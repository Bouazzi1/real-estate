import { OpenAI } from "openai";
import "dotenv/config";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAEvbzUtNAwzgaUqJZ7BxxlkhZV7cgIV2M";

async function testEmptyContent() {
  console.log("🔍 Testing empty content message against Gemini...");

  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gemini-3.6-flash",
        messages: [
          { role: "system", content: "Vous êtes le Conseiller Commercial." },
          { role: "user", content: "" }, // Empty user message!
          { role: "assistant", content: "Bonjour !" },
          { role: "user", content: "Réservation" }
        ]
      })
    });

    console.log("Empty Content Status:", res.status);
    console.log("Empty Content Body:", await res.text());
  } catch (e: any) {
    console.error("Error:", e);
  }
}

testEmptyContent();
