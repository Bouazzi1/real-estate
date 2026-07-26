import React from "react";
import { prisma } from "@/lib/prisma";
import LeadsDashboardClient from "@/components/admin/LeadsDashboardClient";

export const revalidate = 0; // Disable server-side page caching for admin panel

export default async function AdminLeadsPage() {
  // 1. Query all leads including their conversations
  const leads = await prisma.lead.findMany({
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // 2. Query any unlinked conversations
  const unlinkedConversations = await prisma.conversation.findMany({
    where: {
      leadId: null,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  // Convert unlinked conversations to virtual lead objects
  const virtualLeads = unlinkedConversations.map((conv) => ({
    id: `virtual_${conv.id}`,
    name: `Prospect Chat (${conv.sessionId.substring(0, 10)})`,
    email: null,
    phone: null,
    source: "CHAT",
    score: "COLD",
    budgetMin: null,
    budgetMax: null,
    urgency: "JustBrowsing",
    financingNeeded: false,
    interestedApartmentIds: [],
    createdAt: conv.startedAt,
    updatedAt: conv.startedAt,
    conversations: [conv],
  }));

  const allLeads = [...leads, ...virtualLeads];

  return (
    <LeadsDashboardClient
      initialLeads={JSON.parse(JSON.stringify(allLeads))}
    />
  );
}
