import { OpenAI } from "openai";
import "dotenv/config";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAEvbzUtNAwzgaUqJZ7BxxlkhZV7cgIV2M";

const openai = new OpenAI({
  apiKey: API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

async function testAllGeminiModels() {
  const models = [
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite"
  ];

  console.log("🔍 Testing Gemini models for available quota...");

  for (const model of models) {
    try {
      const startTime = Date.now();
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "Vous êtes le Conseiller Commercial." },
          { role: "user", content: "Bonjour" }
        ]
      });
      const duration = Date.now() - startTime;
      console.log(`✅ SUCCESS (${model}): ${duration}ms -> "${completion.choices[0].message.content?.trim()}"`);
    } catch (err: any) {
      console.error(`❌ FAILED (${model}):`, err.status, err.message?.substring(0, 150));
    }
  }
}

testAllGeminiModels();
