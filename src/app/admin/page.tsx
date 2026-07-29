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
  UserCheck,
  CalendarCheck2
} from "lucide-react";
import Link from "next/link";

export const revalidate = 0; // Disable caching for the admin overview dashboard

export default async function AdminDashboardOverview() {
  // Query live metrics from database
  const totalApartments = await prisma.apartment.count();
  const pendingAppointmentsCount = await prisma.appointment.count({
    where: { status: "PENDING" },
  });
  const upcomingAppointmentsCount = await prisma.appointment.count({
    where: {
      status: "APPROVED",
      requestedSlot: {
        gte: new Date(),
      },
    },
  });
  const totalLeads = await prisma.lead.count();
  const totalConversations = await prisma.conversation.count();

  // Fetch top 5 hot leads
  const hotLeads = await prisma.lead.findMany({
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  // Fetch upcoming appointments (max 5)
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
      name: "Appartements au Catalogue",
      value: totalApartments,
      icon: Building2,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      border: "border-blue-500/40",
      href: "/admin/apartments",
    },
    {
      name: "Visites en Attente",
      value: pendingAppointmentsCount,
      icon: Calendar,
      color: "text-amber-400",
      bg: "bg-amber-500/20",
      border: "border-amber-500/40",
      href: "/admin/appointments",
    },
    {
      name: "Prochains RDV Confirmés",
      value: upcomingAppointmentsCount,
      icon: CalendarCheck2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/40",
      href: "/admin/appointments",
    },
    {
      name: "Prospects Enregistrés",
      value: totalLeads,
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/20",
      border: "border-purple-500/40",
      href: "/admin/leads",
    },
    {
      name: "Discussions IA Initiées",
      value: totalConversations,
      icon: MessageSquare,
      color: "text-cyan-400",
      bg: "bg-cyan-500/20",
      border: "border-cyan-500/40",
      href: "/admin/leads",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Tableau de Bord Administration</h1>
          <p className="text-slate-300 text-xs font-medium mt-1">Statistiques en temps réel, visites et gestion des appartements Résidence WAFA</p>
        </div>
      </div>

      {/* Stats Cards grid (5 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.name} href={stat.href} className="block group">
              <div className={`p-5 bg-slate-900/90 rounded-3xl border ${stat.border} hover:border-amber-400 transition-all duration-200 shadow-xl relative overflow-hidden`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200 leading-tight">{stat.name}</span>
                  <div className={`p-2.5 rounded-2xl ${stat.bg} ${stat.color} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{stat.value}</span>
                </div>
                <div className="absolute bottom-2 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                  <span>Accéder</span>
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
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-bold text-white">Derniers Prospects & Contacts</h2>
            </div>
            <Link href="/admin/leads" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
              <span>Voir tous les prospects</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {hotLeads.length === 0 ? (
            <div className="py-12 text-center text-slate-300 text-xs font-medium">
              Aucun prospect enregistré pour le moment. Ils apparaîtront dès qu'un visiteur contacte le conseiller ou remplit un formulaire.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {hotLeads.map((lead) => {
                const isHot = lead.score === "HOT";
                const isWarm = lead.score === "WARM";
                const isCold = lead.score === "COLD";
                
                return (
                  <div key={lead.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-amber-400 font-extrabold text-sm shrink-0">
                        {lead.name ? lead.name[0].toUpperCase() : "?"}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{lead.name || "Prospect Anonyme"}</h4>
                        <p className="text-xs font-medium text-slate-300 mt-0.5">{lead.email || lead.phone || "Aucun contact"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Budget */}
                      {(lead.budgetMin || lead.budgetMax) && (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-white font-bold">
                            {lead.budgetMin ? `${(lead.budgetMin / 1000).toFixed(0)}k` : "0"} - {lead.budgetMax ? `${(lead.budgetMax / 1000).toFixed(0)}k` : "Max"} DT
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Budget</p>
                        </div>
                      )}

                      {/* Score Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isHot ? "bg-red-500/20 text-red-300 border border-red-500/40" :
                        isWarm ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                        isCold ? "bg-blue-500/20 text-blue-300 border border-blue-500/40" :
                        "bg-slate-500/20 text-slate-300 border border-slate-500/40"
                      }`}>
                        {lead.score === "HOT" ? "CHAUD 🔥" : lead.score === "WARM" ? "TIÈDE ☀️" : lead.score === "COLD" ? "FROID ❄️" : lead.score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Column: Upcoming Appointments */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Prochaines Visites Privées</h2>
            </div>
            <Link href="/admin/appointments" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
              <span>Calendrier</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="py-12 text-center text-slate-300 text-xs font-medium">
              Aucune visite programmée pour le moment. Les demandes de créneaux apparaîtront ici.
            </div>
          ) : (
            <div className="space-y-4">
              {recentAppointments.map((appt) => {
                const dateStr = new Date(appt.requestedSlot).toLocaleDateString("fr-FR", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div key={appt.id} className="p-4 bg-slate-950 border border-slate-700 rounded-2xl flex flex-col justify-between gap-2 shadow-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-amber-400 font-extrabold capitalize">{dateStr}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                        appt.status === "APPROVED" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" :
                        appt.status === "PENDING" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                        "bg-slate-500/20 text-slate-300 border border-slate-500/40"
                      }`}>
                        {appt.status === "APPROVED" ? "CONFIRMÉ" : appt.status === "PENDING" ? "EN ATTENTE" : appt.status === "CANCELLED" ? "ANNULÉ" : appt.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white truncate">{appt.lead.name || "Client anonyme"}</h4>
                      {appt.apartment && (
                        <p className="text-xs text-slate-300 mt-1 truncate font-medium">
                          Réf: <strong className="text-white">{appt.apartment.reference}</strong> — {appt.apartment.title}
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
