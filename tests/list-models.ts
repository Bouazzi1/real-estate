import "dotenv/config";
import { OpenAI } from "openai";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function main() {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  const baseURL = process.env.NIM_BASE_URL || "https://integrate.api.nvidia.com/v1";
  
  console.log(`Querying baseURL: ${baseURL} with key starting with ${apiKey?.substring(0, 10)}...`);

  const client = new OpenAI({ apiKey, baseURL });
  try {
    const list = await client.models.list();
    const ids = list.data.map(m => m.id);
    console.log("Connection successful!");
    console.log("Available models list length:", ids.length);
    console.log("Embedding models:", ids.filter(id => id.includes("embed")));
  } catch (e: any) {
    console.error("Failed to list models:", e.message || e);
  }
}

main();
