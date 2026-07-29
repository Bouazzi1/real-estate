import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ApartmentDetailClient from "@/components/apartment/ApartmentDetailClient";
import type { Metadata } from "next";

export const revalidate = 60; // ISR validation caching interval (60 seconds)

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const apartment = await prisma.apartment.findUnique({
      where: { slug },
      include: { project: true },
    });

    if (!apartment) {
      return {
        title: "Apartment Not Found | Elysium Residences",
      };
    }

    return {
      title: `${apartment.title} - Ref: ${apartment.reference} | Elysium Residences`,
      description: `${apartment.rooms} Rooms, ${apartment.bedrooms} Bedrooms, ${apartment.surface}m² surface area. Located in ${apartment.project?.name}.`,
    };
  } catch (e) {
    return {
      title: "Premium Residence Details | Elysium Residences",
    };
  }
}

export default async function ApartmentDetailsPage({ params }: PageProps) {
  const { slug } = await params;

  // Increment view counter directly in server component upon visit
  try {
    await prisma.apartment.update({
      where: { slug },
      data: { views: { increment: 1 } },
    });
  } catch (e) {
    // Non-blocking catch
  }

  // Query database for target apartment
  const apartment = await prisma.apartment.findUnique({
    where: { slug },
    include: {
      project: true,
      documents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!apartment) {
    notFound();
  }

  // Query similar apartments in same project or price range
  const similarApartments = await prisma.apartment.findMany({
    where: {
      projectId: apartment.projectId,
      NOT: {
        id: apartment.id,
      },
    },
    take: 3,
  });

  return (
    <ApartmentDetailClient
      apartment={JSON.parse(JSON.stringify(apartment))}
      similarApartments={JSON.parse(JSON.stringify(similarApartments))}
    />
  );
}
