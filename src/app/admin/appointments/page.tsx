import React from "react";
import { prisma } from "@/lib/prisma";
import AppointmentsDashboard from "@/components/admin/AppointmentsDashboard";

export const revalidate = 0; // Disable server-side page caching for admin panel

export default async function AdminAppointmentsPage() {
  // Query all appointments including lead and apartment models
  const appointments = await prisma.appointment.findMany({
    include: {
      lead: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      apartment: {
        select: {
          id: true,
          reference: true,
          title: true,
          price: true,
        },
      },
    },
    orderBy: {
      requestedSlot: "desc",
    },
  });

  return (
    <AppointmentsDashboard
      initialAppointments={JSON.parse(JSON.stringify(appointments))}
    />
  );
}
