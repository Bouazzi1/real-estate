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
  MessageSquare
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

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("10:00");

  const pendingQueue = appointments.filter((a) => a.status === "PENDING");
  const approvedList = appointments.filter((a) => a.status === "APPROVED");

  const handleDecision = async (id: string, status: "APPROVED" | "REJECTED" | "RESCHEDULED", extraBody = {}) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status === "RESCHEDULED" ? "PENDING" : status, // Rescheduling sets it back to pending with new date
          ...extraBody,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to make decision");

      // Update state
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? data : a))
      );
      
      setShowRejectModal(false);
      setShowRescheduleModal(false);
    } catch (err: any) {
      alert(err.message || "Failed to save appointment update");
    } finally {
      setProcessingId(null);
    }
  };

  // Calendar logic helpers
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
  const firstDayIndex = getFirstDayOfMonth(year, month); // 0 = Sun, 1 = Mon, etc.

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper to check if a day has approved appointments
  const getApptsOnDay = (day: number) => {
    return approvedList.filter((a) => {
      const d = new Date(a.requestedSlot);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  // Format date key
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
        <h2 className="text-2xl font-bold text-white">Appointment Scheduler</h2>
        <p className="text-slate-400 text-xs mt-1">Approve client visits and track approved tours inside the calendar view</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Pending requests list (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass border border-slate-800 rounded-3xl p-6 bg-slate-900/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Pending Queue</span>
              </h3>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                {pendingQueue.length}
              </span>
            </div>

            {pendingQueue.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No pending appointment requests in queue.
              </div>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {pendingQueue.map((appt) => {
                  const dateStr = new Date(appt.requestedSlot).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={appt.id}
                      className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-3 relative group"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] text-blue-400 font-bold block">{dateStr}</span>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{appt.lead.name || "Anonymous Client"}</span>
                        </h4>
                        {appt.apartment && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                            <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">Ref: {appt.apartment.reference} - {appt.apartment.title}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 space-y-0.5 mt-1 border-t border-slate-900 pt-1">
                          {appt.lead.email && <div className="truncate flex items-center gap-1"><Mail className="w-3 h-3 text-slate-600 shrink-0" /> <span className="truncate">{appt.lead.email}</span></div>}
                          {appt.lead.phone && <div className="truncate flex items-center gap-1"><Phone className="w-3 h-3 text-slate-600 shrink-0" /> <span>{appt.lead.phone}</span></div>}
                        </div>
                      </div>

                      {/* Quick Decisions controls */}
                      <div className="flex gap-2 border-t border-slate-900 pt-3">
                        <button
                          onClick={() => handleDecision(appt.id, "APPROVED")}
                          disabled={processingId === appt.id}
                          className="flex-1 flex items-center justify-center py-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white text-emerald-500 text-[10px] font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {processingId === appt.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3 mr-1" />
                          )}
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveApptId(appt.id);
                            setRejectReason("");
                            setShowRejectModal(true);
                          }}
                          className="flex-1 flex items-center justify-center py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-600 hover:text-white text-red-500 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3 mr-1" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Interactive calendar and schedule listing (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass border border-slate-800 rounded-3xl p-6 bg-slate-900/40 space-y-6">
            
            {/* Calendar header switcher */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {monthNames[month]} {year}
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {/* Day Headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-2 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
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
                        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/10"
                        : "bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span className="font-bold text-xs">{day}</span>
                    {hasAppts && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-blue-500"}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active day detailed list */}
          {selectedDateStr && (
            <div className="glass border border-slate-800 rounded-3xl p-6 bg-slate-900/40 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Tours Booked on: <span className="text-white font-bold">{new Date(selectedDateStr).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</span>
              </h3>

              {selectedDayAppts.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  No confirmed visits scheduled on this day.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedDayAppts.map((appt) => {
                    const timeStr = new Date(appt.requestedSlot).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={appt.id}
                        className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-2">
                          <span className="font-bold text-blue-400">{timeStr}</span>
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                            {appt.type}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="font-semibold text-white">{appt.lead.name || "Anonymous"}</div>
                          {appt.apartment && (
                            <div className="text-[10px] text-slate-400 truncate">
                              Ref: {appt.apartment.reference} · {appt.apartment.title}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 pt-1">
                            {appt.lead.email && <p className="truncate">Email: {appt.lead.email}</p>}
                            {appt.lead.phone && <p>Phone: {appt.lead.phone}</p>}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Decline Viewing Request</h3>
            <p className="text-slate-400 text-xs">Specify a brief explanation. An email notification detailing this reasoning will be sent to the client.</p>
            <textarea
              rows={3}
              placeholder="e.g. The requested slot falls outside of our agent's holiday calendar. Please select another slot."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDecision(activeApptId!, "REJECTED", { adminNote: rejectReason })}
                disabled={processingId === activeApptId}
                className="flex items-center justify-center px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {processingId === activeApptId ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                <span>Decline Tour</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
