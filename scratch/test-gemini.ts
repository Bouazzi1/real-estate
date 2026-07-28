import { OpenAI } from "openai";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const API_KEY = "AIzaSyAEvbzUtNAwzgaUqJZ7BxxlkhZV7cgIV2M";

const openai = new OpenAI({
  apiKey: API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

async function testEmbedding() {
  console.log("🧪 Testing Gemini Embeddings via OpenAI SDK...");

  try {
    const res = await openai.embeddings.create({
      model: "text-embedding-004",
      input: "Appartement de luxe Résidence WAFA",
    });
    console.log("✅ Embedding length:", res.data[0].embedding.length);
  } catch (err: any) {
    console.error("❌ Embedding Error with text-embedding-004, trying gemini-embedding-001...");
    try {
      const res2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/gemini-embedding-001",
          content: { parts: [{ text: "Appartement de luxe Résidence WAFA" }] }
        })
      });
      const data2 = (await res2.json()) as any;
      if (data2.embedding?.values) {
        console.log("✅ Native Gemini Embedding length:", data2.embedding.values.length);
      } else {
        console.error("❌ Native Error:", data2);
      }
    } catch (e2) {
      console.error("❌ Native error:", e2);
    }
  }
}

testEmbedding();
