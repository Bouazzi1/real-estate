import React, { Suspense } from "react";
import ChatPageClient from "@/components/chat/ChatPageClient";
import Header from "@/components/navigation/Header";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

export default async function ChatPage() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "singleton" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Header
        agencyName={settings?.agencyName || "Résidence WAFA"}
        logoUrl={settings?.logoUrl || "/uploads/folla-logo.png"}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 flex flex-col">
        <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading AI Sales Advisor...</div>}>
          <ChatPageClient agencyName={settings?.agencyName || "Résidence WAFA"} />
        </Suspense>
      </main>
    </div>
  );
}
