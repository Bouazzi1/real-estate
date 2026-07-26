import React from "react";
import { prisma } from "@/lib/prisma";
import ApartmentsClient from "@/components/admin/ApartmentsClient";

export const revalidate = 0; // Disable server-side page caching for admin panel

export default async function AdminApartmentsPage() {
  // Query all apartments with their project relationship
  const apartments = await prisma.apartment.findMany({
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Query projects list for dropdown selectors
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <ApartmentsClient
      initialApartments={JSON.parse(JSON.stringify(apartments))}
      projects={JSON.parse(JSON.stringify(projects))}
    />
  );
}
