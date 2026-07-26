import React from "react";
import { prisma } from "@/lib/prisma";
import {
  Building2,
  Users,
  Calendar,
  MessageSquare,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Flame,
  UserCheck
} from "lucide-react";
import Link from "next/link";

export const revalidate = 0; // Disable caching for the admin overview dashboard

export default async function AdminDashboardOverview() {
  // Query live metrics from database
  const totalApartments = await prisma.apartment.count();
  const pendingAppointmentsCount = await prisma.appointment.count({
    where: { status: "PENDING" },
  });
  const totalLeads = await prisma.lead.count();
  const totalConversations = await prisma.conversation.count();

  // Fetch top 5 hot leads
  const hotLeads = await prisma.lead.findMany({
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  // Fetch recent appointments (max 5)
  const recentAppointments = await prisma.appointment.findMany({
    include: {
      lead: true,
      apartment: true,
    },
    orderBy: { requestedSlot: "asc" },
    where: {
      requestedSlot: {
        gte: new Date(), // show future appointments
      },
    },
    take: 5,
  });

  const stats = [
    {
      name: "Active Listings",
      value: totalApartments,
      icon: Building2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      href: "/admin/apartments",
    },
    {
      name: "Pending Appointments",
      value: pendingAppointmentsCount,
      icon: Calendar,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      href: "/admin/appointments",
    },
    {
      name: "Captured Leads",
      value: totalLeads,
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      href: "/admin/leads",
    },
    {
      name: "AI Chats Started",
      value: totalConversations,
      icon: MessageSquare,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      href: "/admin/leads",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Agency Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time metrics, AI conversations, and listing manager</p>
        </div>
      </div>

      {/* Stats Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.name} href={stat.href} className="block group">
              <div className={`p-6 bg-slate-900/40 rounded-3xl border ${stat.border} hover:border-slate-700 transition-all duration-200 backdrop-blur-xl relative overflow-hidden`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-400">{stat.name}</span>
                  <div className={`p-2.5 rounded-2xl ${stat.bg} ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{stat.value}</span>
                </div>
                <div className="absolute bottom-2 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-slate-400">
                  <span>Manage</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Grid of Leads & Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Hot Leads */}
        <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold text-white">Recent Leads</h2>
            </div>
            <Link href="/admin/leads" className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1">
              <span>View all leads</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {hotLeads.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No leads captured yet. They will appear here once visitors contact the AI advisor or fill out forms.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {hotLeads.map((lead) => {
                const isHot = lead.score === "HOT";
                const isWarm = lead.score === "WARM";
                const isCold = lead.score === "COLD";
                
                return (
                  <div key={lead.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-sm">
                        {lead.name ? lead.name[0] : "?"}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{lead.name || "Anonymous Lead"}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{lead.email || lead.phone || "No contact info"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Budget */}
                      {(lead.budgetMin || lead.budgetMax) && (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-slate-400 font-medium">
                            {lead.budgetMin ? `${(lead.budgetMin / 1000).toFixed(0)}k` : "0"} - {lead.budgetMax ? `${(lead.budgetMax / 1000).toFixed(0)}k` : "Max"} DT
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Budget</p>
                        </div>
                      )}

                      {/* Score Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isHot ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        isWarm ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        isCold ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}>
                        {lead.score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Column: Upcoming Appointments */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold text-white">Upcoming Visits</h2>
            </div>
            <Link href="/admin/appointments" className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1">
              <span>Calendar</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No upcoming appointments. Approved slot bookings will show up here.
            </div>
          ) : (
            <div className="space-y-4">
              {recentAppointments.map((appt) => {
                const dateStr = new Date(appt.requestedSlot).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div key={appt.id} className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-2xl flex flex-col justify-between gap-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-blue-400 font-semibold">{dateStr}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        appt.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        appt.status === "PENDING" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate">{appt.lead.name || "Anonymous client"}</h4>
                      {appt.apartment && (
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          Ref: <span className="text-slate-400">{appt.apartment.reference}</span> — {appt.apartment.title}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
