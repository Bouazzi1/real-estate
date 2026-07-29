"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Check,
  X,
  User,
  Building,
  Mail,
  Phone,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  CalendarCheck2,
  CalendarDays
} from "lucide-react";

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

interface Apartment {
  id: string;
  reference: string;
  title: string;
  price: number;
}

interface Appointment {
  id: string;
  leadId: string;
  apartmentId: string | null;
  requestedSlot: string;
  alternativeSlot: string | null;
  status: string;
  type: string;
  adminNote: string | null;
  createdAt: string;
  lead: Lead;
  apartment: Apartment | null;
}

interface AppointmentsDashboardProps {
  initialAppointments: Appointment[];
}

export default function AppointmentsDashboard({ initialAppointments }: AppointmentsDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Modal / Input states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [activeApptId, setActiveApptId] = useState<string | null>(null);

  const pendingQueue = appointments.filter((a) => a.status === "PENDING");
  const approvedList = appointments.filter((a) => a.status === "APPROVED");

  // Sorted list of upcoming approved appointments
  const upcomingApprovedList = [...approvedList]
    .sort((a, b) => new Date(a.requestedSlot).getTime() - new Date(b.requestedSlot).getTime());

  const handleDecision = async (id: string, status: "APPROVED" | "REJECTED" | "RESCHEDULED", extraBody = {}) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status === "RESCHEDULED" ? "PENDING" : status,
          ...extraBody,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'enregistrer la décision");

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? data : a))
      );
      
      setShowRejectModal(false);
    } catch (err: any) {
      alert(err.message || "Une erreur est survenue lors de la mise à jour");
    } finally {
      setProcessingId(null);
    }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDateStr(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDateStr(null);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const getApptsOnDay = (day: number) => {
    return approvedList.filter((a) => {
      const d = new Date(a.requestedSlot);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const getDateStr = (day: number) => {
    return `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  };

  const selectedDayAppts = selectedDateStr
    ? approvedList.filter((a) => {
        const d = new Date(a.requestedSlot);
        const dayStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
        return dayStr === selectedDateStr;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white">Gestionnaire des Visites Privées</h2>
        <p className="text-slate-300 text-xs font-medium mt-1">Validez les demandes de visites et consultez la liste complète des rendez-vous confirmés</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Pending requests list + Upcoming confirmed appointments */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Box 1: Demandes en Attente */}
          <div className="border border-slate-700/80 rounded-3xl p-6 bg-slate-900/90 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Demandes en Attente</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-extrabold">
                {pendingQueue.length}
              </span>
            </div>

            {pendingQueue.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-medium">
                Aucune demande de visite en attente.
              </div>
            ) : (
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                {pendingQueue.map((appt) => {
                  const dateStr = new Date(appt.requestedSlot).toLocaleDateString("fr-FR", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={appt.id}
                      className="p-4 bg-slate-950 border border-slate-700/80 rounded-2xl space-y-3 relative group shadow-md"
                    >
                      <div className="space-y-1.5">
                        <span className="text-xs text-amber-400 font-extrabold block capitalize">{dateStr}</span>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <User className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="truncate">{appt.lead.name || "Client Anonyme"}</span>
                        </h4>
                        {appt.apartment && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 truncate">
                            <Building className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="truncate">Réf: <strong className="text-white">{appt.apartment.reference}</strong> - {appt.apartment.title}</span>
                          </div>
                        )}
                        <div className="text-xs text-slate-200 space-y-1 mt-2 border-t border-slate-800 pt-2 font-medium">
                          {appt.lead.email && <div className="truncate flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" /> <span className="truncate">{appt.lead.email}</span></div>}
                          {appt.lead.phone && <div className="truncate flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" /> <span className="font-semibold text-white">{appt.lead.phone}</span></div>}
                        </div>
                      </div>

                      {/* Quick Decisions controls */}
                      <div className="flex gap-2 border-t border-slate-800 pt-3">
                        <button
                          onClick={() => handleDecision(appt.id, "APPROVED")}
                          disabled={processingId === appt.id}
                          className="flex-1 flex items-center justify-center py-2 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 text-xs font-extrabold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                        >
                          {processingId === appt.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5 mr-1" />
                          )}
                          <span>Approuver</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveApptId(appt.id);
                            setRejectReason("");
                            setShowRejectModal(true);
                          }}
                          className="flex-1 flex items-center justify-center py-2 bg-red-500/20 border border-red-500/40 hover:bg-red-500 hover:text-white text-red-300 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          <span>Annuler</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Box 2: Liste des Prochains Rendez-vous Confirmés (Accès Rapide) */}
          <div className="border border-slate-700/80 rounded-3xl p-6 bg-slate-900/90 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarCheck2 className="w-4 h-4 text-emerald-400" />
                <span>Prochains RDV Confirmés</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold">
                {upcomingApprovedList.length}
              </span>
            </div>

            {upcomingApprovedList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-medium">
                Aucun rendez-vous confirmé enregistré.
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
                {upcomingApprovedList.map((appt) => {
                  const d = new Date(appt.requestedSlot);
                  const dateStr = d.toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  });
                  const timeStr = d.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit"
                  });
                  const dayKeyStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;

                  return (
                    <div
                      key={appt.id}
                      onClick={() => {
                        setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
                        setSelectedDateStr(dayKeyStr);
                      }}
                      className="p-3.5 bg-slate-950 border border-slate-700 rounded-2xl space-y-2 hover:border-amber-500 transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-amber-400 capitalize">{dateStr} à {timeStr}</span>
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                          CONFIRMÉ
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-white text-xs group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{appt.lead.name || "Client anonyme"}</span>
                        </div>
                        {appt.apartment && (
                          <div className="text-[11px] text-slate-300 font-medium truncate flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">Réf: <strong className="text-white">{appt.apartment.reference}</strong> - {appt.apartment.title}</span>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-300 pt-1 font-medium border-t border-slate-800/80 mt-1 flex flex-wrap justify-between gap-1">
                          {appt.lead.phone && <span className="text-slate-200">Tél: <strong className="text-white">{appt.lead.phone}</strong></span>}
                          {appt.lead.email && <span className="text-slate-400 truncate max-w-[160px]">{appt.lead.email}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right column: Interactive calendar */}
        <div className="lg:col-span-8 space-y-6">
          <div className="border border-slate-700/80 rounded-3xl p-6 bg-slate-900/90 shadow-xl space-y-6">
            
            {/* Calendar header switcher */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  {monthNames[month]} {year}
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 bg-slate-950 border border-slate-700 hover:border-amber-500 text-slate-200 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 bg-slate-950 border border-slate-700 hover:border-amber-500 text-slate-200 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2.5 text-center text-xs">
              {/* Day Headers */}
              {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
                <div key={day} className="py-2 font-extrabold text-amber-400 text-xs uppercase tracking-wider">
                  {day}
                </div>
              ))}

              {/* Offset days */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`offset-${i}`} className="aspect-square border border-transparent" />
              ))}

              {/* Days of month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayStr = getDateStr(day);
                const isSelected = selectedDateStr === dayStr;
                const appts = getApptsOnDay(day);
                const hasAppts = appts.length > 0;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDateStr(isSelected ? null : dayStr)}
                    className={`aspect-square relative rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500 border-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20 scale-105"
                        : "bg-slate-950 border-slate-700 text-slate-100 font-bold hover:border-amber-500 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <span className="font-extrabold text-sm">{day}</span>
                    {hasAppts && (
                      <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-slate-950" : "bg-amber-400"}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active day detailed list */}
          {selectedDateStr && (
            <div className="border border-slate-700/80 rounded-3xl p-6 bg-slate-900/90 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Visites Confirmées le : <span className="text-white font-bold">{new Date(selectedDateStr).toLocaleDateString("fr-FR", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
              </h3>

              {selectedDayAppts.length === 0 ? (
                <div className="py-6 text-center text-slate-300 text-xs font-medium">
                  Aucune visite confirmée pour cette journée.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedDayAppts.map((appt) => {
                    const timeStr = new Date(appt.requestedSlot).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={appt.id}
                        className="p-4 bg-slate-950 border border-slate-700 rounded-2xl space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                          <span className="font-extrabold text-amber-400 text-sm">{timeStr}</span>
                          <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase">
                            {appt.type}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-white text-sm">{appt.lead.name || "Client anonyme"}</div>
                          {appt.apartment && (
                            <div className="text-xs text-slate-300 font-medium truncate">
                              Réf: <strong className="text-white">{appt.apartment.reference}</strong> · {appt.apartment.title}
                            </div>
                          )}
                          <div className="text-xs text-slate-300 space-y-0.5 pt-1.5 font-medium border-t border-slate-800 mt-1">
                            {appt.lead.email && <p className="truncate text-slate-300">Email: <span className="text-white font-semibold">{appt.lead.email}</span></p>}
                            {appt.lead.phone && <p className="text-slate-300">Tél: <span className="text-white font-semibold">{appt.lead.phone}</span></p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Annuler la Demande de Visite</h3>
            <p className="text-slate-300 text-xs font-medium">Spécifiez un motif d'annulation. Un e-mail d'information expliquant la raison sera envoyé au client.</p>
            <textarea
              rows={3}
              placeholder="ex: Le créneau demandé tombe un jour de fermeture de la résidence. Veuillez choisir un autre horaire."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => handleDecision(activeApptId!, "REJECTED", { adminNote: rejectReason })}
                disabled={processingId === activeApptId}
                className="flex items-center justify-center px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {processingId === activeApptId ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                <span>Confirmer l'Annulation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
