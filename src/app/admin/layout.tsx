import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    // Render child content (login page form) without layout sidebar if not authenticated
    return <>{children}</>;
  }

  const user = session.user;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar navigation */}
      <AdminSidebar
        userName={user.name || "Admin Director"}
        userEmail={user.email || ""}
        userAvatar={(user as any).image || ""}
      />

      {/* Main content workspace area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-900/40 p-6 lg:p-10">
        <div className="max-w-7xl w-full mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
