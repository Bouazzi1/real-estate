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
    <div className="fixed inset-0 h-[100dvh] w-screen flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Header
        agencyName={settings?.agencyName || "Résidence WAFA"}
        logoUrl={settings?.logoUrl || "/uploads/folla-logo.png"}
      />
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col overflow-hidden p-0 sm:p-4">
        <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading AI Sales Advisor...</div>}>
          <ChatPageClient agencyName={settings?.agencyName || "Résidence WAFA"} />
        </Suspense>
      </main>
    </div>
  );
}
