import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function cleanOldFolla() {
  console.log("Cleaning old Folla and Aurea records from database...");
  await prisma.apartment.deleteMany({
    where: {
      OR: [
        { reference: { startsWith: "AUR-" } },
        { reference: { startsWith: "FOL-" } }
      ]
    }
  });
  await prisma.project.deleteMany({
    where: {
      OR: [
        { slug: "residence-aurea" },
        { slug: "residence-folla" }
      ]
    }
  });
  console.log("✅ Database cleaned!");
}

cleanOldFolla()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
