import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { indexApartment } from "../src/lib/rag/pipeline";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function reindexAll() {
  console.log("🧹 Clearing all stale vector chunks from DocumentChunk table...");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "DocumentChunk" RESTART IDENTITY;`);
  console.log("✅ Table cleared.");

  const apartments = await prisma.apartment.findMany();
  console.log(`\n🚀 Re-indexing ${apartments.length} apartments into pgvector...`);

  for (const apt of apartments) {
    console.log(`Indexing ${apt.reference} (${apt.title})...`);
    await indexApartment(apt.id);
  }

  const chunkCount = await prisma.documentChunk.count();
  console.log(`\n🎉 Re-indexing complete! Total clean chunks in pgvector: ${chunkCount}`);
}

reindexAll()
  .catch((e) => {
    console.error("Re-indexing failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
