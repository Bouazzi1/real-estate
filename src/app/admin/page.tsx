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
  CalendarCheck2,
  Eye,
  Trophy
} from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/formatters";

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

  // Fetch all apartments with project details and sort by views safely in JS
  const allApartmentsRaw = await prisma.apartment.findMany({
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });

  const apartmentsWithViews = allApartmentsRaw.map((apt: any) => ({
    ...apt,
    views: typeof apt.views === "number" ? apt.views : 0,
  }));

  const sortedApartments = [...apartmentsWithViews].sort((a, b) => b.views - a.views);
  const totalViews = sortedApartments.reduce((sum, apt) => sum + apt.views, 0);
  const topVisitedApartments = sortedApartments.slice(0, 5);

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

  const maxViews = topVisitedApartments.length > 0 && topVisitedApartments[0].views > 0
    ? topVisitedApartments[0].views
    : 1;

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
      name: "Consultations Fiches",
      value: totalViews,
      icon: Eye,
      color: "text-rose-400",
      bg: "bg-rose-500/20",
      border: "border-rose-500/40",
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
          <h1 className="text-2xl font-black text-white tracking-tight">Vue d'ensemble Commerciale</h1>
          <p className="text-xs text-slate-400 mt-1">Supervision en temps réel des propriétés, rendez-vous et statistiques de consultation.</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link
              key={idx}
              href={stat.href}
              className="group p-5 bg-slate-900/90 border border-slate-700/80 hover:border-slate-500 rounded-3xl transition-all duration-200 shadow-xl hover:-translate-y-1 block"
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-2xl ${stat.bg} border ${stat.border} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black text-white block">{stat.value}</span>
                <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">{stat.name}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Top Visited Apartments Widget */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Top 5 — Appartements les Plus Visités</h2>
          </div>
          <Link href="/admin/apartments" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
            <span>Voir tout le catalogue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {topVisitedApartments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">
            Aucune donnée de consultation disponible pour le moment.
          </div>
        ) : (
          <div className="space-y-4">
            {topVisitedApartments.map((apt, idx) => {
              const pct = Math.round((apt.views / maxViews) * 100);

              return (
                <div key={apt.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        idx === 0 ? "bg-amber-500 text-slate-950" :
                        idx === 1 ? "bg-slate-300 text-slate-950" :
                        idx === 2 ? "bg-amber-700 text-white" :
                        "bg-slate-800 text-slate-400"
                      }`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/apartments/${apt.slug}`} className="font-bold text-sm text-white hover:text-amber-400 transition-colors">
                            {apt.title}
                          </Link>
                          <span className="text-[10px] font-bold font-mono text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            {apt.reference}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">
                          {apt.project?.name} · <strong className="text-white">{formatPrice(apt.price)} DT</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{apt.views} visites</span>
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid Section: Prospects & Visites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left 1 Column: Hot Prospects */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Derniers Prospects Qualifiés</h2>
            </div>
            <Link href="/admin/leads" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
              <span>Voir tout ({totalLeads})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {hotLeads.length === 0 ? (
            <div className="py-12 text-center text-slate-300 text-xs font-medium">
              Aucun prospect qualifié enregistré pour le moment.
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
                            {lead.budgetMin ? formatPrice(lead.budgetMin) : "0"} - {lead.budgetMax ? formatPrice(lead.budgetMax) : "Max"} DT
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Budget</p>
                        </div>
                      )}

                      {/* Score Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                        isHot ? "bg-red-500/20 text-red-300 border border-red-500/40" :
                        isWarm ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                        "bg-slate-500/20 text-slate-300 border border-slate-500/40"
                      }`}>
                        {isHot ? "CHAUD 🔥" : isWarm ? "TIÈDE ⚡" : "FROID ❄️"}
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
