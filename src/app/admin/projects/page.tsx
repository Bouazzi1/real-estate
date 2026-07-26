import React from "react";
import { prisma } from "@/lib/prisma";
import ProjectsClient from "@/components/admin/ProjectsClient";

export const revalidate = 0;

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      apartments: {
        select: {
          id: true,
          title: true,
          reference: true,
          price: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <ProjectsClient initialProjects={JSON.parse(JSON.stringify(projects))} />
  );
}
