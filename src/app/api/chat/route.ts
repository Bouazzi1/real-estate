import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLLMProvider } from "@/lib/providers/llm";
import { retrieveContext } from "@/lib/rag/retrieval";
import { agentTools, executeAgentTool } from "@/lib/agent/tools";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { messages, sessionId, apartmentReference } = await request.json();

    if (!messages || !Array.isArray(messages) || !sessionId) {
      return NextResponse.json({ error: "Messages and Session ID are required" }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";

    // 1. Resolve apartment context if provided
    let apartmentId: string | undefined;
    let apartmentContextInfo = "";
    if (apartmentReference) {
      const apt = await prisma.apartment.findUnique({
        where: { reference: apartmentReference },
      });
      if (apt) {
        apartmentId = apt.id;
        apartmentContextInfo = `\n[Context: The user is currently viewing apartment ${apt.reference} (${apt.title}). Apartment Database ID: ${apt.id}, Reference Code: ${apt.reference}. Prioritize details and scheduling tours for this unit.]`;
      }
    }

    // 2. Fetch RAG context
    const retrievalResults = await retrieveContext(lastUserMessage, {
      apartmentId,
      limit: 6,
    });
    
    const contextText = retrievalResults.map((r, i) => `[Source ${i + 1}]: ${r.content}`).join("\n\n");

    // 2b. Fetch full catalog summary to guarantee 100% accurate availability awareness
    const allApartments = await prisma.apartment.findMany({
      select: {
        reference: true,
        title: true,
        price: true,
        surface: true,
        rooms: true,
        bedrooms: true,
        bathrooms: true,
        floor: true,
        orientation: true,
        status: true,
        description: true,
      },
      orderBy: { price: "asc" },
    });

    const fullCatalogText = allApartments
      .map(
        (a) =>
          `• [Réf: ${a.reference}] ${a.title} | Prix: ${a.price.toLocaleString()} DT (TND) | Surface: ${a.surface} m² | ${a.bedrooms} chambres, ${a.bathrooms} SDB | Étage ${a.floor} (${a.orientation}) | Statut: ${a.status}.\n  Description: ${a.description}`
      )
      .join("\n\n");

    // 3. Construct System Prompt tailored for Résidence WAFA
    const systemPrompt = `Vous êtes le Conseiller Commercial d'Exception pour la Résidence WAFA (Les Berges du Lac 2, Tunis).
Votre mission est d'accueillir chaleureusement les prospects, de présenter la liste complète des offres et appartements disponibles à la Résidence WAFA, d'informer sur leurs caractéristiques d'exception et de planifier des visites privées.

CATALOGUE OFFICIEL ET DISPONIBILITÉS REELLES — RÉSIDENCE WAFA (DONNÉES EN DINARS TUNISIENS TND / DT) :
${fullCatalogText || "Aucun appartement enregistré pour le moment."}

RAG CONTEXT & DOCUMENTS SPÉCIFIQUES :
${contextText || "Aucun document supplémentaire."}
${apartmentContextInfo}

RÈGLES STRICTES DE DIALOGUE COMMERCIAL :
1. LANGUE : Adaptez-vous naturellement à la langue de l'utilisateur (Français, Anglais, Arabe).
2. PRÉSENTATION DES OFFRES : Quand un client demande les offres, les prix ou la liste des appartements disponibles, présentez directement la liste claire des biens de la Résidence WAFA ci-dessus avec leurs tarifs en Dinars Tunisiens (DT). Ne dites JAMAIS que vous n'avez pas l'information.
3. CONVERSATION NATURELLE : N'affichez JAMAIS de code JSON ni de structures techniques dans vos messages au client. Parlez uniquement en langage naturel commercial élégant.
4. QUALIFICATION CLIENT : Recueillez avec courtoisie le nom, l'email, le téléphone et le budget du prospect.
5. RÉSERVATION DE VISITE : Pour réserver une visite privée, proposez les créneaux disponibles et utilisez l'outil create_appointment.`;

    // 4. Create or Load the Conversation in DB
    let conversation = await prisma.conversation.findUnique({
      where: { sessionId },
    });

    if (!conversation) {
      // Create associated Lead record for instant visibility in Admin Leads dashboard
      const lead = await prisma.lead.create({
        data: {
          name: `Prospect ${sessionId.substring(0, 14)}`,
          source: "CHAT",
          score: "COLD",
          interestedApartmentIds: apartmentId ? [apartmentId] : [],
        },
      });

      conversation = await prisma.conversation.create({
        data: {
          sessionId,
          leadId: lead.id,
          startedAt: new Date(),
        },
      });
    }

    // Save the User's Message in the database
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: lastUserMessage,
      },
    });

    const llm = getLLMProvider();

    const normalizeRole = (r: string): "user" | "assistant" | "system" => {
      const lower = (r || "").toLowerCase();
      if (lower === "assistant" || lower === "bot") return "assistant";
      if (lower === "system") return "system";
      return "user";
    };

    // Map conversation history safely for Gemini/OpenAI spec
    const apiMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any): ChatCompletionMessageParam => {
        const lower = (m.role || "").toLowerCase();
        if (lower === "tool") {
          return {
            role: "tool",
            tool_call_id: m.tool_call_id || "call_default",
            content: typeof m.content === "string" ? m.content : String(m.content || ""),
          };
        }
        return {
          role: normalizeRole(m.role),
          content: typeof m.content === "string" ? m.content : String(m.content || ""),
        };
      }),
    ];

    // Set up SSE response stream headers
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        let activeMessages = [...apiMessages];
        let finalAssistantText = "";
        let continueStreaming = true;

        try {
          while (continueStreaming) {
            // Initiate the stream from NIM
            const chatStreamInstance = await llm.chatStream(activeMessages, agentTools);
            let toolCallsToExecute: any[] = [];

            for await (const chunk of chatStreamInstance) {
              const choice = chunk.choices[0];
              if (!choice) continue;

              // Handle streaming text content
              if (choice.delta?.content) {
                const text = choice.delta.content;
                finalAssistantText += text;
                controller.enqueue(encoder.encode(text));
              }

              // Handle tool calling
              if (choice.delta?.tool_calls) {
                for (const toolDelta of choice.delta.tool_calls) {
                  const idx = typeof toolDelta.index === "number" ? toolDelta.index : 0;
                  if (!toolCallsToExecute[idx]) {
                    toolCallsToExecute[idx] = {
                      id: toolDelta.id || `call_${Date.now()}_${idx}`,
                      type: "function",
                      function: { name: toolDelta.function?.name || "", arguments: "" },
                    };
                  }
                  if (toolDelta.id) {
                    toolCallsToExecute[idx].id = toolDelta.id;
                  }
                  if (toolDelta.function?.name) {
                    toolCallsToExecute[idx].function.name = toolDelta.function.name;
                  }
                  if (toolDelta.function?.arguments) {
                    toolCallsToExecute[idx].function.arguments += toolDelta.function.arguments;
                  }
                }
              }
            }

            // Filter out sparse array elements if any
            toolCallsToExecute = toolCallsToExecute.filter(Boolean);

            // Execute tool calls if any are requested
            if (toolCallsToExecute.length > 0) {
              // Add assistant message with tool calls to history
              const assistantMessage: any = {
                role: "assistant",
                content: finalAssistantText || null,
                tool_calls: toolCallsToExecute.map(tc => ({
                  id: tc.id,
                  type: "function",
                  function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments
                  }
                }))
              };
              activeMessages.push(assistantMessage);

              for (const tc of toolCallsToExecute) {
                let toolResult;
                try {
                  const args = JSON.parse(tc.function.arguments || "{}");
                  // Inject active sessionId for escalation context
                  if (tc.function.name === "escalate_to_human") {
                    args.sessionId = sessionId;
                  }
                  // Inject active apartment context for booking if not explicitly set
                  if (tc.function.name === "create_appointment" && apartmentId && !args.apartmentId) {
                    args.apartmentId = apartmentId;
                  }

                  const result = await executeAgentTool(tc.function.name, args);
                  toolResult = JSON.stringify(result);
                } catch (e: any) {
                  console.error(`Tool execution error: ${tc.function.name}`, e);
                  toolResult = JSON.stringify({ error: e.message || "Failed to execute tool" });
                }

                // Add tool response message to history
                activeMessages.push({
                  role: "tool",
                  tool_call_id: tc.id,
                  content: toolResult,
                } as any);
              }
              // Reset final text so it accumulates next assistant reply
              finalAssistantText = "";
            } else {
              // No tool calls means the model finished its response
              continueStreaming = false;
            }
          }

          // Save the final reply to the database
          if (finalAssistantText) {
            await prisma.message.create({
              data: {
                conversationId: conversation!.id,
                role: "ASSISTANT",
                content: finalAssistantText,
              },
            });

            // Asynchronously run lead qualification and scoring
            triggerLeadQualification(conversation!.id, finalAssistantText);
          }

          controller.close();
        } catch (err: any) {
          console.error("Chat Stream Error:", err);
          controller.enqueue(encoder.encode(`\n[ERROR: ${err.message || "Failed to generate reply"}]`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (e: any) {
    console.error("Chat handler API error:", e);
    return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
  }
}

// Background asynchronous lead qualification job
async function triggerLeadQualification(conversationId: string, assistantReply: string) {
  try {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conv || conv.messages.length < 3) return;

    // Get the contact info and lead details
    const lead = await prisma.lead.findFirst({
      where: {
        conversations: {
          some: { id: conversationId },
        },
      },
    });

    if (!lead) return;

    // We compile the chat transcript
    const transcript = conv.messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const llm = getLLMProvider();

    // Call OpenAI/NIM to qualify the lead
    const queryMessages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an expert lead analyzer. Analyze this chat transcript between a client and an AI sales agent. Extract the client's profile details.
Return a clean JSON object with the following schema:
{
  "budgetMin": number | null,
  "budgetMax": number | null,
  "urgency": "IMMEDIATE" | "3_MONTHS" | "6_MONTHS" | "JustBrowsing" | null,
  "financingNeeded": boolean | null,
  "score": "HOT" | "WARM" | "COLD" | "UNQUALIFIED"
}

SCORING RULES:
- HOT: Shows strong intent to buy, budget matches luxury inventory (400k+), looking to move immediately or within 3 months, financing is ready or not needed.
- WARM: Interested, looking within 6 months, has standard budget, might need financing.
- COLD: Just browsing, no clear timeline or very low budget.
- UNQUALIFIED: Invalid contact info, test chat, or off-topic conversation.`
      },
      {
        role: "user",
        content: `Here is the chat history:\n${transcript}`
      }
    ];

    const res = await llm.chatCompletion(queryMessages);
    const textResult = res.choices[0]?.message?.content || "{}";
    
    // Parse JSON safely
    const cleanJsonText = textResult.substring(
      textResult.indexOf("{"),
      textResult.lastIndexOf("}") + 1
    );

    const data = JSON.parse(cleanJsonText);

    // Update Lead in database
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        budgetMin: data.budgetMin || undefined,
        budgetMax: data.budgetMax || undefined,
        urgency: data.urgency || undefined,
        financingNeeded: data.financingNeeded !== undefined ? data.financingNeeded : undefined,
        score: data.score || undefined,
      },
    });

    console.log(`Lead ${lead.id} qualified successfully. Score: ${data.score}`);

  } catch (e) {
    console.error("Asynchronous lead qualification failed:", e);
  }
}
