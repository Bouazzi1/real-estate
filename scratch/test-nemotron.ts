import "dotenv/config";
import { OpenAI } from "openai";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function testNemotron() {
  const apiKey = process.env.NVIDIA_NIM_API_KEY || "dummy-api-key";
  const baseURL = process.env.NIM_BASE_URL || "https://integrate.api.nvidia.com/v1";

  const client = new OpenAI({ apiKey, baseURL });

  console.log("Testing NVIDIA NIM embedding model: nvidia/nemotron-3-embed-1b...");

  try {
    const response = await client.embeddings.create({
      model: "nvidia/nemotron-3-embed-1b",
      input: "Appartement de luxe Résidence Aurea",
      input_type: "passage"
    } as any);

    const vec = response.data[0].embedding;
    console.log(`✅ Success! Embedding vector length: ${vec.length}`);
  } catch (err: any) {
    console.error("❌ Test failed:", err.message || err);
  }
}

testNemotron();
