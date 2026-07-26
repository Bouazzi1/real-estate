import "dotenv/config";
import { OpenAI } from "openai";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function testModel(client: OpenAI, model: string, input: string) {
  try {
    console.log(`Testing model: ${model}...`);
    const res = await client.embeddings.create({ model, input });
    console.log(`  ✅ Success! Vector length: ${res.data[0].embedding.length}`);
    return true;
  } catch (e: any) {
    console.error(`  ❌ Failed:`, e.message || e);
    return false;
  }
}

async function main() {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  const baseURL = process.env.NIM_BASE_URL || "https://integrate.api.nvidia.com/v1";
  
  const client = new OpenAI({ apiKey, baseURL });
  const input = "Executive suite residences in downtown Paris";

  console.log("Testing multiple embedding models...");
  
  const models = [
    "nvidia/embed-qa-4",
    "nvidia/nv-embed-v1",
    "snowflake/arctic-embed-l",
    "nvidia/llama-3.2-nv-embedqa-1b-v1"
  ];

  for (const model of models) {
    await testModel(client, model, input);
  }
}

main();
