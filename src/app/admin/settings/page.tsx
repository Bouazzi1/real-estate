import React from "react";
import { prisma } from "@/lib/prisma";
import SettingsClient from "@/components/admin/SettingsClient";

export const revalidate = 0; // Disable server-side page caching for admin panel

export default async function AdminSettingsPage() {
  // Query singleton site settings
  const settings = await prisma.siteSettings.findUnique({
    where: {
      id: "singleton",
    },
  });

  return (
    <SettingsClient
      initialSettings={JSON.parse(JSON.stringify(settings))}
    />
  );
}
