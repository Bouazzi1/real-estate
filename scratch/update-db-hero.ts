import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function updateDbHeroImage() {
  console.log("🖼️ Updating CMS Section HERO background image in Database...");

  const heroSection = await prisma.cmsSection.findFirst({
    where: { key: "HERO" }
  });

  if (heroSection) {
    const content = (heroSection.content || {}) as any;
    content.backgroundUrl = "http://groupelamiri.com/wp-content/uploads/2024/05/acda6e58-5225-4fac-ab33-03ed8fddf39e.jpg";

    await prisma.cmsSection.update({
      where: { id: heroSection.id },
      data: {
        content,
        draft: null // Clear draft if any to apply live
      }
    });

    console.log("✅ CMS HERO section image updated in DB to:", content.backgroundUrl);
  } else {
    console.log("No HERO section found in DB.");
  }
}

updateDbHeroImage();
