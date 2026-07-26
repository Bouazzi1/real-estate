import "dotenv/config";
import { prisma } from "../src/lib/prisma";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function initSupabase() {
  console.log("🔌 Connecting to Supabase PostgreSQL database...");

  // 1. Enable pgvector extension on Supabase
  console.log("⚡ Enabling pgvector extension...");
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
  console.log("✅ pgvector extension enabled on Supabase!");
}

initSupabase()
  .catch((err) => {
    console.error("❌ Connection failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
