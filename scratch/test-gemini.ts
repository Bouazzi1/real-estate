import { OpenAI } from "openai";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const API_KEY = "AIzaSyAEvbzUtNAwzgaUqJZ7BxxlkhZV7cgIV2M";

const openai = new OpenAI({
  apiKey: API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

async function testGeminiStreamToolCallComplete() {
  console.log("🧪 Testing Gemini Streaming Tool Calls with Complete Information...");

  try {
    const stream = await openai.chat.completions.create({
      model: "gemini-3.6-flash",
      messages: [
        { role: "system", content: "Vous êtes le Conseiller Commercial de la Résidence WAFA. Lorsque l'utilisateur vous donne ses coordonnées et son créneau, utilisez OBLIGATOIREMENT l'outil create_appointment." },
        { role: "user", content: "Je souhaite réserver une visite privée pour l'appartement WAF-101 le vendredi 30 juillet à 14h. Mon nom est Jean Dupont, email jean@example.com, tel 98123456." }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "create_appointment",
            description: "Crée une demande de rendez-vous / visite privée.",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                date: { type: "string" },
                time: { type: "string" },
                apartmentId: { type: "string" },
                notes: { type: "string" }
              },
              required: ["name", "email", "phone", "date", "time"]
            }
          }
        }
      ],
      stream: true,
    });

    let toolCallsToExecute: any[] = [];
    let textContent = "";

    for await (const chunk of stream) {
      console.log("CHUNK:", JSON.stringify(chunk, null, 2));
      const choice = chunk.choices[0];
      if (!choice) continue;

      if (choice.delta?.content) {
        textContent += choice.delta.content;
      }

      if (choice.delta?.tool_calls) {
        for (const toolDelta of choice.delta.tool_calls) {
          const idx = toolDelta.index ?? 0;
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

    console.log("\n--- Final Text Output ---");
    console.log(textContent);
    console.log("\n--- Final Accumulated Tool Calls ---");
    console.log(JSON.stringify(toolCallsToExecute, null, 2));
  } catch (err: any) {
    console.error("❌ Error:", err);
  }
}

testGeminiStreamToolCallComplete();
