import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function check() {
  const start = Date.now();
  const apartmentCount = await prisma.apartment.count();
  const leadCount = await prisma.lead.count();
  const chunkCount = await prisma.documentChunk.count();
  const elapsed = Date.now() - start;

  console.log(`✅ SUPABASE DATABASE STATUS:`);
  console.log(`⏱️ Query Response Time: ${elapsed} ms`);
  console.log(`🏢 Apartments in DB: ${apartmentCount}`);
  console.log(`👥 Leads in DB: ${leadCount}`);
  console.log(`🧠 AI Vector Chunks (pgvector 2048D): ${chunkCount}`);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
