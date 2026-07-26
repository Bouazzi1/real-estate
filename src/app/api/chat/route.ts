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

    // 3. Construct System Prompt tailored for Résidence Folla
    const systemPrompt = `Vous êtes le Conseiller Commercial d'Exception pour la Résidence Folla (Les Berges du Lac 2, Tunis).
Votre mission est d'accueillir chaleureusement les prospects, d'informer sur les caractéristiques d'exception des appartements (L'Atelier Folla, La Suite Panoramique, Le Penthouse Folla Duplex), d'envoyer les brochures et de planifier des visites privées.

RÈGLES STRICTES DE SÉCURITÉ ET CONVERSATION :
1. LANGUE : Adaptez-vous naturellement à la langue de l'utilisateur (Français, Anglais, Arabe).
2. FAITS UNIQUEMENT : Répondez STRICTEMENT d'après les faits figurant dans le Contexte RAG et les outils (search_apartments, get_apartment_details, get_documents). Si une information n'est pas connue, indiquez-le poliment et proposez une mise en relation humaine via escalate_to_human. Ne jamais inventer de prix ni de caractéristiques.
3. QUALIFICATION PROSPECT : Au cours de l'échange, recueillez élégamment les éléments de qualification suivants :
   - Budget envisagé (en Dinars Tunisiens TND / DT)
   - Typologie recherchée (Studio, T3, Penthouse Attique)
   - Calendrier d'acquisition (Immédiat, < 3 mois, > 6 mois, simple curiosité)
   - Usage prévu (Résidence principale, secondaire, investissement)
   - Coordonnées de contact (Nom, Email, Téléphone) avec mention de consentement RGPD.
4. PROTOCOLE DE RÉSERVATION DE VISITE :
   - Étape 1 : Consulter les créneaux disponibles via l'outil get_available_slots.
   - Étape 2 : Une fois un créneau sélectionné, demander le nom et les coordonnées (email/téléphone).
   - Étape 3 : Exécuter l'outil create_appointment.
   - Étape 4 : Confirmer l'enregistrement : "Votre demande de visite privée pour la Résidence Folla est transmise à notre direction commerciale. Une confirmation vous sera envoyée."

Contexte RAG Résidence Folla :
${contextText || "Aucune fiche technique spécifique trouvée dans la base de données."}
${apartmentContextInfo}`;

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

    // Map conversation history
    const apiMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role as any,
        content: m.content,
      })),
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
                  const idx = toolDelta.index;
                  if (!toolCallsToExecute[idx]) {
                    toolCallsToExecute[idx] = {
                      id: toolDelta.id || "",
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
