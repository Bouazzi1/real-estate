import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLLMProvider } from "@/lib/providers/llm";
import { retrieveContextWithTimeout } from "@/lib/rag/retrieval";
import { agentTools, executeAgentTool } from "@/lib/agent/tools";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { formatPrice } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { messages, sessionId, apartmentReference } = await request.json();

    if (!messages || !Array.isArray(messages) || !sessionId) {
      return NextResponse.json({ error: "Messages and Session ID are required" }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const lowerMsg = lastUserMessage.toLowerCase().trim();

    // ─── INSTANT GREETINGS FAST-PATH (0ms LATENCY) ───
    const greetingMatch = /^(bonjour|bonsoir|salut|hello|hi|hey|coucou)(\s|\.|\!|\?)*$/i.test(lowerMsg);
    if (greetingMatch) {
      const greetingPrefix = lowerMsg.includes("bonsoir") ? "Bonsoir" : "Bonjour";
      const instantReply = `${greetingPrefix} ! Je suis le Conseiller Commercial Dédié pour la Résidence WAFA. Comment puis-je vous accompagner aujourd'hui ? Souhaitez-vous découvrir nos appartements disponibles, consulter la brochure officielle ou réserver une visite privée ?`;

      // Asynchronously log to database in background
      (async () => {
        try {
          let conv = await prisma.conversation.findUnique({ where: { sessionId } });
          if (!conv) {
            conv = await prisma.conversation.create({ data: { sessionId } });
          }
          await prisma.message.createMany({
            data: [
              { conversationId: conv.id, role: "USER", content: lastUserMessage },
              { conversationId: conv.id, role: "ASSISTANT", content: instantReply },
            ],
          });
        } catch (err) {
          console.warn("Background DB log warning:", err);
        }
      })();

      return NextResponse.json({
        message: instantReply,
        history: [...messages, { role: "ASSISTANT", content: instantReply }],
      });
    }

    // ─── INSTANT BROCHURE / DOCUMENT FAST-PATH (~50ms DB-ONLY, NO LLM) ───
    const isBrochureQuery = /^(brochure|document|catalogue|donnez.*(brochure|document|catalogue)|telecharger|télécharger|pdf|fiche)/i.test(lowerMsg);
    if (isBrochureQuery) {
      const docs = await prisma.document.findMany({
        select: { title: true, fileUrl: true, type: true, apartment: { select: { reference: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      let instantReply: string;
      if (docs.length > 0) {
        const docLines = docs.map((d) => {
          const aptRef = d.apartment?.reference ? ` (Apt. ${d.apartment.reference})` : " (Général)";
          return `📄 [${d.title}${aptRef}](${d.fileUrl})`;
        }).join("\n");
        instantReply = `Voici les brochures et documents disponibles pour la Résidence WAFA :\n\n${docLines}\n\nCliquez sur un lien pour ouvrir le document dans un nouvel onglet. Souhaitez-vous d'autres informations ?`;
      } else {
        instantReply = `Je n'ai pas encore de brochure téléchargeable pour le moment. Souhaitez-vous que je vous présente nos appartements disponibles ou que je vous aide à réserver une visite privée ?`;
      }

      // Background DB log
      (async () => {
        try {
          let conv = await prisma.conversation.findUnique({ where: { sessionId } });
          if (!conv) conv = await prisma.conversation.create({ data: { sessionId } });
          await prisma.message.createMany({ data: [
            { conversationId: conv.id, role: "USER", content: lastUserMessage },
            { conversationId: conv.id, role: "ASSISTANT", content: instantReply },
          ]});
        } catch (err) { console.warn("Background DB log warning:", err); }
      })();

      return NextResponse.json({
        message: instantReply,
        history: [...messages, { role: "ASSISTANT", content: instantReply }],
      });
    }

    // ─── INSTANT SHORT-REPLY FAST-PATH (oui, non, ok, merci, d'accord — 0ms) ───
    const isShortAck = /^(oui|non|ok|merci|d'accord|super|parfait|entendu|compris|c'est bon|exactement|bien sûr|absolument|tout à fait|pas de souci)(\s|\.|\!|\?)*$/i.test(lowerMsg);
    if (isShortAck) {
      const ackReplies: Record<string, string> = {
        merci: "Avec plaisir ! N'hésitez pas si vous avez d'autres questions sur nos appartements ou si vous souhaitez réserver une visite privée.",
        default: "Parfait ! Comment puis-je vous aider davantage ? Souhaitez-vous consulter nos appartements, télécharger une brochure ou réserver un créneau de visite ?",
      };
      const instantReply = lowerMsg.includes("merci") ? ackReplies.merci : ackReplies.default;

      (async () => {
        try {
          let conv = await prisma.conversation.findUnique({ where: { sessionId } });
          if (!conv) conv = await prisma.conversation.create({ data: { sessionId } });
          await prisma.message.createMany({ data: [
            { conversationId: conv.id, role: "USER", content: lastUserMessage },
            { conversationId: conv.id, role: "ASSISTANT", content: instantReply },
          ]});
        } catch (err) { console.warn("Background DB log warning:", err); }
      })();

      return NextResponse.json({
        message: instantReply,
        history: [...messages, { role: "ASSISTANT", content: instantReply }],
      });
    }

    // ─── PERFORMANCE: Skip RAG vector search for direct brochure, catalog, and general queries ───
    const isDirectQuery = /(brochure|catalogue|document|plan|tarifs|prix|offres|appartements|disponib|visite|bonjour|bonsoir|salut|merci|donnez)/i.test(lastUserMessage);
    const needsRag = lastUserMessage.length > 35 && !isDirectQuery;

    // 3. Parallel fetching of RAG context, active apartment, catalog, documents, and conversation
    const [retrievalResults, apt, allApartments, allDocuments, existingConversation] = await Promise.all([
      needsRag
        ? retrieveContextWithTimeout(lastUserMessage, { apartmentId: undefined, limit: 3 }, 1000)
        : Promise.resolve([]),
      apartmentReference
        ? prisma.apartment.findUnique({ where: { reference: apartmentReference } })
        : Promise.resolve(null),
      prisma.apartment.findMany({
        where: { status: "AVAILABLE" },
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
          description: true,
          status: true,
        },
      }),
      prisma.document.findMany({
        select: {
          id: true,
          title: true,
          type: true,
          fileUrl: true,
          apartment: { select: { reference: true } },
        },
      }),
      prisma.conversation.findUnique({
        where: { sessionId },
      }),
    ]);

    // Resolve apartment context
    let apartmentId: string | undefined;
    let apartmentContextInfo = "";
    if (apt) {
      apartmentId = apt.id;
      apartmentContextInfo = `\n[Context: The user is currently viewing apartment ${apt.reference} (${apt.title}). Apartment Database ID: ${apt.id}, Reference Code: ${apt.reference}. Prioritize details and scheduling tours for this unit.]`;
    }

    const contextText = retrievalResults.map((r, i) => `[Source ${i + 1}]: ${r.content}`).join("\n\n");

    const fullCatalogText = allApartments
      .map(
        (a) =>
          `• [Réf: ${a.reference}] ${a.title} | Prix: ${formatPrice(a.price)} DT | Surface: ${a.surface} m² | ${a.bedrooms} chambres, ${a.bathrooms} SDB | Étage ${a.floor} (${a.orientation}) | Statut: ${a.status}.\n  Description: ${a.description}`
      )
      .join("\n\n");

    const availableDocsText = allDocuments.length > 0
      ? allDocuments
          .map((d) => `• [${d.type}] "${d.title}" ${d.apartment ? `(Appartement Réf: ${d.apartment.reference})` : "(Général Résidence WAFA)"} => Link: ${d.fileUrl}`)
          .join("\n")
      : "Aucun document supplémentaire.";

    const now = new Date();
    const currentDateFormatted = now.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // 5. Construct System Prompt tailored for Résidence WAFA
    const systemPrompt = `Vous êtes le Conseiller Commercial d'Exception pour la Résidence WAFA (Les Berges du Lac 2, Tunis).
DATE ET ANNÉE ACTUELLES : Nous sommes aujourd'hui le ${currentDateFormatted} (${now.toISOString().substring(0, 10)}).
Toutes les dates relatives ("ce jeudi", "cette semaine", "demain", "vendredi prochain") DOIVENT se référer à l'année en cours ${now.getFullYear()}. N'utilisez JAMAIS une année passée comme 2025.

Votre mission est d'accueillir chaleureusement les prospects, de présenter la liste complète des offres et appartements disponibles à la Résidence WAFA, d'informer sur leurs caractéristiques d'exception et de planifier des visites privées.

CATALOGUE OFFICIEL ET DISPONIBILITÉS REELLES — RÉSIDENCE WAFA (DONNÉES EN DINARS TUNISIENS TND / DT) :
${fullCatalogText || "Aucun appartement enregistré pour le moment."}

DOCUMENTATION ET BROCHURES OFFICIELLES TÉLÉCHARGEABLES :
${availableDocsText}

RAG CONTEXT & DOCUMENTS SPÉCIFIQUES :
${contextText || "Aucun extrait textuel supplémentaire."}
${apartmentContextInfo}

RÈGLES STRICTES DE DIALOGUE COMMERCIAL :
1. LANGUE : Adaptez-vous naturellement à la langue de l'utilisateur (Français, Anglais, Arabe).
2. PRÉSENTATION DES OFFRES : Quand un client demande les offres, les prix ou la liste des appartements disponibles, présentez directement la liste claire des biens de la Résidence WAFA ci-dessus avec leurs tarifs en Dinars Tunisiens (DT). Ne dites JAMAIS que vous n'avez pas l'information.
3. BROCHURES ET DOCUMENTS : Quand un client demande une brochure, un plan ou un document, fournissez-lui DIRECTEMENT le lien de téléchargement Markdown correspondant figurant dans la section "DOCUMENTATION ET BROCHURES OFFICIELLES TÉLÉCHARGEABLES" ci-dessus (ex: "[Télécharger la Brochure Officielle Résidence WAFA](URL)"). Ne dites JAMAIS que vous n'avez pas la brochure si elle est répertoriée ci-dessus.
4. CONVERSATION NATURELLE : N'affichez JAMAIS de code JSON, de dates ISO (ex: 2026-07-29T08:00:00.000Z), ni de structures techniques dans vos messages au client. Parlez uniquement en langage naturel commercial élégant.
5. FORMAT DES DATES ET HORAIRES : Présentez TOUJOURS les dates en format lisible et élégant (ex: "Mardi 29 juillet à 9h00, 10h00, 14h00"). Regroupez les créneaux par journée. N'affichez JAMAIS de format ISO ou technique.
6. QUALIFICATION CLIENT : Recueillez avec courtoisie le nom, l'email, le téléphone et le budget du prospect.
7. RÉSERVATION DE VISITE : Les visites privées sont ouvertes 7 jours sur 7 (du lundi au dimanche, de 9h à 18h en semaine, et 10h à 17h le week-end). Pour réserver une visite privée ou vérifier une date, proposez des créneaux et enregistrez la réservation avec l'outil create_appointment.
8. FORMAT STRICT DES PRIX : Présentez TOUJOURS les prix en Dinars Tunisiens (DT) avec des espaces comme séparateurs de milliers (ex: 790 000 DT, 1 850 000 DT, 380 000 DT). N'utilisez JAMAIS de virgule ni de point comme séparateur de milliers (ne dites JAMAIS 790,000 DT ni 790.000 DT).

PROTOCOLE OBLIGATOIRE DE RÉSERVATION DE VISITE (IMPORTANT) :
Quand un client souhaite réserver une visite, vous DEVEZ TOUJOURS suivre ces étapes dans cet ordre EXACT :
  Étape 1 : Proposer les créneaux disponibles en utilisant l'outil get_available_slots.
  Étape 2 : Confirmer la date et l'heure choisies par le client.
  Étape 3 : Demander OBLIGATOIREMENT les 3 informations suivantes au client :
    - Son nom complet
    - Son numéro de téléphone
    - Son adresse e-mail
  Étape 4 : UNIQUEMENT après avoir reçu les 3 informations ci-dessus, appeler l'outil create_appointment.
  
  INTERDICTION ABSOLUE : N'appelez JAMAIS l'outil create_appointment sans avoir d'abord obtenu le nom, le téléphone ET l'e-mail du client. Si le client n'a pas encore fourni ces informations, vous DEVEZ les lui demander avant de procéder.`;

    // Create or load conversation (non-blocking for the LLM call)
    let conversation = existingConversation;

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

    // Save the User's Message in the database (fire-and-forget, don't block)
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: lastUserMessage,
      },
    }).catch((e) => console.error("Failed to save user message:", e));

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
            // Initiate the stream from LLM
            let chatStreamInstance;
            try {
              chatStreamInstance = await llm.chatStream(activeMessages, agentTools);
            } catch (streamErr: any) {
              // If the LLM rejects our messages (e.g., after tool results), fall back gracefully
              console.error("LLM stream initiation failed:", streamErr.status, streamErr.message);
              
              // Try again without tools (simple completion) using only the original messages
              try {
                const fallbackMessages: ChatCompletionMessageParam[] = [
                  activeMessages[0], // system prompt
                  ...messages.map((m: any): ChatCompletionMessageParam => ({
                    role: normalizeRole(m.role),
                    content: typeof m.content === "string" ? m.content : String(m.content || ""),
                  })),
                ];
                chatStreamInstance = await llm.chatStream(fallbackMessages);
              } catch (fallbackErr: any) {
                console.error("Fallback stream also failed:", fallbackErr.message);
                const fallbackText = "Je vous prie de m'excuser, un problème technique est survenu. Pourriez-vous reformuler votre demande ?";
                finalAssistantText = fallbackText;
                controller.enqueue(encoder.encode(fallbackText));
                continueStreaming = false;
                break;
              }
            }

            let toolCallsToExecute: any[] = [];

            for await (const chunk of chatStreamInstance!) {
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
                  // Robust JSON parsing: Gemini streaming can produce concatenated/malformed JSON
                  let rawArgs = tc.function.arguments || "{}";
                  
                  // Sanitize: extract the first valid JSON object from the string
                  let args: any;
                  try {
                    args = JSON.parse(rawArgs);
                  } catch (parseErr) {
                    console.warn(`Initial JSON parse failed for tool ${tc.function.name}, attempting sanitization. Raw: "${rawArgs}"`);
                    // Try extracting the first JSON object via brace matching
                    const firstBrace = rawArgs.indexOf("{");
                    if (firstBrace !== -1) {
                      let depth = 0;
                      let endIdx = -1;
                      for (let i = firstBrace; i < rawArgs.length; i++) {
                        if (rawArgs[i] === "{") depth++;
                        else if (rawArgs[i] === "}") depth--;
                        if (depth === 0) {
                          endIdx = i;
                          break;
                        }
                      }
                      if (endIdx !== -1) {
                        const cleanJson = rawArgs.substring(firstBrace, endIdx + 1);
                        args = JSON.parse(cleanJson);
                      } else {
                        args = {};
                      }
                    } else {
                      args = {};
                    }
                  }

                  // Inject active sessionId for escalation context
                  if (tc.function.name === "escalate_to_human") {
                    args.sessionId = sessionId;
                  }
                  // Inject active apartment context for booking if not explicitly set
                  if (tc.function.name === "create_appointment" && apartmentId && !args.apartmentId) {
                    args.apartmentId = apartmentId;
                  }

                  console.log(`Executing tool [${tc.function.name}] with parsed args:`, JSON.stringify(args));
                  const result = await executeAgentTool(tc.function.name, args);
                  // Ensure toolResult is a simple string for Gemini compatibility
                  toolResult = typeof result === "string" ? result : JSON.stringify(result);
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
