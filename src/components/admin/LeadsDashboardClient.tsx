"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Download,
  Flame,
  Clock,
  DollarSign,
  HelpCircle,
  X,
  MessageSquare,
  Building,
  CheckCircle,
  XCircle,
  HelpCircle as QuestionIcon
} from "lucide-react";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  sessionId: string;
  startedAt: string;
  messages: Message[];
}

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  score: string;
  budgetMin: number | null;
  budgetMax: number | null;
  urgency: string | null;
  financingNeeded: boolean;
  interestedApartmentIds: string[];
  createdAt: string;
  updatedAt: string;
  conversations: Conversation[];
}

interface LeadsDashboardClientProps {
  initialLeads: Lead[];
}

export default function LeadsDashboardClient({ initialLeads }: LeadsDashboardClientProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  // Client-side CSV Exporter
  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Score", "Source", "Budget Min", "Budget Max", "Urgency", "Financing Needed", "Created At"];
    const rows = filteredLeads.map((l) => [
      l.name || "Anonymous",
      l.email || "",
      l.phone || "",
      l.score,
      l.source,
      l.budgetMin || "",
      l.budgetMax || "",
      l.urgency || "",
      l.financingNeeded ? "YES" : "NO",
      new Date(l.createdAt).toLocaleDateString(),
    ]);

    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      (l.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (l.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (l.phone || "").includes(search);
    const matchesScore = scoreFilter === "all" || l.score === scoreFilter;
    return matchesSearch && matchesScore;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Leads Overview</h2>
          <p className="text-slate-400 text-xs mt-1">Review captured client details, budget qualifications, and conversation logs</p>
        </div>
        <div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-500" />
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-xl">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by client name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="bg-transparent border-none text-slate-300 focus:outline-none text-xs cursor-pointer py-1"
            >
              <option value="all">All Scores</option>
              <option value="HOT">HOT Leads</option>
              <option value="WARM">WARM Leads</option>
              <option value="COLD">COLD Leads</option>
              <option value="UNQUALIFIED">UNQUALIFIED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-950/20">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email / Phone</th>
                <th className="py-4 px-6">Score</th>
                <th className="py-4 px-6">Source</th>
                <th className="py-4 px-6">Budget Range</th>
                <th className="py-4 px-6">Urgency</th>
                <th className="py-4 px-6">Financing</th>
                <th className="py-4 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No leads found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isHot = lead.score === "HOT";
                  const isWarm = lead.score === "WARM";
                  const isCold = lead.score === "COLD";
                  const isUnqualified = lead.score === "UNQUALIFIED";

                  return (
                    <tr key={lead.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{lead.name || "Anonymous Lead"}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Created: {new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-6 space-y-0.5">
                        <div className="text-slate-300 font-medium">{lead.email || "No Email"}</div>
                        <div className="text-slate-500">{lead.phone || "No Phone"}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          isHot ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          isWarm ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          isCold ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}>
                          {lead.score}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-medium">{lead.source}</td>
                      <td className="py-4 px-6 font-semibold text-white">
                        {lead.budgetMin || lead.budgetMax ? (
                          <span>
                            {lead.budgetMin ? `${(lead.budgetMin / 1000).toFixed(0)}k` : "0"} -{" "}
                            {lead.budgetMax ? `${(lead.budgetMax / 1000).toFixed(0)}k` : "Max"} DT
                          </span>
                        ) : (
                          <span className="text-slate-600 font-normal">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {lead.urgency ? (
                          <span className="capitalize">{lead.urgency.replace("_", " ")}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {lead.financingNeeded ? (
                          <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> <span>Needs Loan</span></span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> <span>Cash/Ready</span></span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          View Logs
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out details drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          {/* Backdrop click to close */}
          <div className="flex-1" onClick={() => setSelectedLeadId(null)} />

          {/* Drawer container (width 500px, full height) */}
          <div className="w-full max-w-xl bg-slate-950 border-l border-slate-800 h-screen flex flex-col justify-between overflow-hidden shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header info */}
            <div className="px-6 py-6 border-b border-slate-850 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-sm">
                  {selectedLead.name ? selectedLead.name[0] : "?"}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">{selectedLead.name || "Anonymous Lead"}</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Qualified Sales Lead</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLeadId(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body - Split into Stats/Contact & Chat Logs */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Profile Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-900/40 border border-slate-850 rounded-2xl p-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Urgency Timeline</span>
                  <span className="text-xs font-semibold text-white capitalize">
                    {selectedLead.urgency ? selectedLead.urgency.replace("_", " ") : "Not specified"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Financing Requirement</span>
                  <span className="text-xs font-semibold text-white">
                    {selectedLead.financingNeeded ? "Requires bank loan" : "Cash payment / Ready"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Budget Limits</span>
                  <span className="text-xs font-semibold text-white">
                    {selectedLead.budgetMin || selectedLead.budgetMax
                      ? `${selectedLead.budgetMin ? `${selectedLead.budgetMin.toLocaleString()} DT` : "0"} to ${selectedLead.budgetMax ? `${selectedLead.budgetMax.toLocaleString()} DT` : "Unlimited"}`
                      : "Not discussed"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Contact Details</span>
                  <span className="text-xs font-semibold text-white block truncate">{selectedLead.email || "No Email"}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{selectedLead.phone || "No Phone"}</span>
                </div>
              </div>

              {/* Chat conversations history */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span>Conversational Logs</span>
                </h4>

                {selectedLead.conversations.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">No chat sessions associated with this lead profile.</p>
                ) : (
                  <div className="space-y-6">
                    {selectedLead.conversations.map((conv, idx) => (
                      <div key={conv.id} className="space-y-3">
                        <div className="flex items-center justify-between text-[9px] text-slate-500 border-b border-slate-900 pb-1">
                          <span>Session #{idx + 1} ({conv.sessionId})</span>
                          <span>Started: {new Date(conv.startedAt).toLocaleString()}</span>
                        </div>
                        <div className="space-y-3.5 bg-slate-950 p-4 border border-slate-900 rounded-2xl max-h-[50vh] overflow-y-auto">
                          {conv.messages.map((m) => {
                            const isUser = m.role === "USER";
                            return (
                              <div key={m.id} className="space-y-1">
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${isUser ? "text-blue-500" : "text-emerald-500"}`}>
                                  {isUser ? "Client" : "AI Advisor"}
                                </span>
                                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{m.content}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom actions */}
            <div className="p-4 border-t border-slate-850 bg-slate-900 text-right">
              <button
                onClick={() => setSelectedLeadId(null)}
                className="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
