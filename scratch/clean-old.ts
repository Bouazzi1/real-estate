import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function cleanOldAurea() {
  console.log("Cleaning old Aurea records from database...");
  await prisma.apartment.deleteMany({
    where: { reference: { startsWith: "AUR-" } }
  });
  await prisma.project.deleteMany({
    where: { slug: "residence-aurea" }
  });
  console.log("✅ Database cleaned!");
}

cleanOldAurea()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
