import React from "react";
import { prisma } from "@/lib/prisma";
import CmsClient from "@/components/admin/CmsClient";

export const revalidate = 0; // Disable server-side page caching for admin panel

export default async function AdminCmsPage() {
  // Query all sections ordered by order parameter
  const sections = await prisma.cmsSection.findMany({
    orderBy: {
      order: "asc",
    },
  });

  return (
    <CmsClient
      initialSections={JSON.parse(JSON.stringify(sections))}
    />
  );
}
