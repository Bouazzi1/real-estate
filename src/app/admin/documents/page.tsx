import React from "react";
import { prisma } from "@/lib/prisma";
import DocumentsClient from "@/components/admin/DocumentsClient";

export const revalidate = 0; // Disable caching to ensure document uploads display immediately

export default async function DocumentsPage() {
  // Fetch projects list for association dropdown
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch apartments list for association dropdown
  const apartments = await prisma.apartment.findMany({
    select: {
      id: true,
      title: true,
      reference: true,
    },
    orderBy: {
      reference: "asc",
    },
  });

  return (
    <DocumentsClient initialProjects={projects} initialApartments={apartments} />
  );
}
