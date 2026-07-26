import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function alterVectorColumn() {
  console.log("Updating vector column to vector(2048)...");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "DocumentChunk" RESTART IDENTITY;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "DocumentChunk" ALTER COLUMN embedding TYPE vector(2048);`);
  console.log("✅ Vector column successfully updated to 2048 dimensions!");
}

alterVectorColumn()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
