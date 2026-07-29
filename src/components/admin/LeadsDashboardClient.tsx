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
import { formatPrice } from "@/lib/formatters";

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
    const headers = ["Nom", "Email", "Téléphone", "Score", "Source", "Budget Min", "Budget Max", "Urgence", "Besoin Financement", "Date Création"];
    const rows = filteredLeads.map((l) => [
      l.name || "Prospect Anonyme",
      l.email || "",
      l.phone || "",
      l.score,
      l.source,
      l.budgetMin || "",
      l.budgetMax || "",
      l.urgency || "",
      l.financingNeeded ? "OUI" : "NON",
      new Date(l.createdAt).toLocaleDateString("fr-FR"),
    ]);

    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `prospects_export_${Date.now()}.csv`);
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
          <h2 className="text-2xl font-bold text-white">Suivi des Prospects & Leads</h2>
          <p className="text-slate-400 text-xs mt-1">Consultez les informations de vos prospects, leurs budgets qualifiés et l'historique de leurs discussions</p>
        </div>
        <div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-500" />
            <span>Exporter en CSV</span>
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
            placeholder="Rechercher par nom, email ou téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
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
              <option value="all">Tous les Niveaux</option>
              <option value="HOT">CHAUD (Intérêt Fort)</option>
              <option value="WARM">TIÈDE (Intérêt Moyen)</option>
              <option value="COLD">FROID (Curieux)</option>
              <option value="UNQUALIFIED">NON QUALIFIÉ</option>
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
                <th className="py-4 px-6">Nom complet</th>
                <th className="py-4 px-6">Email / Téléphone</th>
                <th className="py-4 px-6">Qualification</th>
                <th className="py-4 px-6">Origine</th>
                <th className="py-4 px-6">Fourchette de Budget</th>
                <th className="py-4 px-6">Délai d'Achat</th>
                <th className="py-4 px-6">Financement</th>
                <th className="py-4 px-6 text-right">Historique</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Aucun prospect ne correspond aux critères.
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
                        <div className="font-semibold text-white">{lead.name || "Prospect Anonyme"}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Créé le : {new Date(lead.createdAt).toLocaleDateString("fr-FR")}
                        </div>
                      </td>
                      <td className="py-4 px-6 space-y-0.5">
                        <div className="text-slate-300 font-medium">{lead.email || "Aucun email"}</div>
                        <div className="text-slate-500">{lead.phone || "Aucun téléphone"}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          isHot ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          isWarm ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          isCold ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}>
                          {lead.score === "HOT" ? "CHAUD 🔥" : lead.score === "WARM" ? "TIÈDE ☀️" : lead.score === "COLD" ? "FROID ❄️" : lead.score}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-medium">{lead.source === "CHAT" ? "Conseiller IA" : lead.source}</td>
                      <td className="py-4 px-6 font-semibold text-white">
                        {lead.budgetMin || lead.budgetMax ? (
                          <span>
                            {lead.budgetMin ? `${formatPrice(lead.budgetMin)}` : "0"} -{" "}
                            {lead.budgetMax ? `${formatPrice(lead.budgetMax)}` : "Max"} DT
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
                          <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> <span>Emprunt nécessaire</span></span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> <span>Paiement comptant</span></span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Voir la discussion
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

          {/* Drawer container */}
          <div className="w-full max-w-xl bg-slate-950 border-l border-slate-800 h-screen flex flex-col justify-between overflow-hidden shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header info */}
            <div className="px-6 py-6 border-b border-slate-850 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-sm">
                  {selectedLead.name ? selectedLead.name[0] : "?"}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">{selectedLead.name || "Prospect Anonyme"}</h3>
                  <p className="text-[10px] text-amber-400 uppercase font-semibold mt-0.5">Fiche Prospect Qualifié</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLeadId(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Profile Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-900/40 border border-slate-850 rounded-2xl p-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Délai d'Acquisition</span>
                  <span className="text-xs font-semibold text-white capitalize">
                    {selectedLead.urgency ? selectedLead.urgency.replace("_", " ") : "Non précisé"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Besoin de Financement</span>
                  <span className="text-xs font-semibold text-white">
                    {selectedLead.financingNeeded ? "Nécessite un prêt bancaire" : "Paiement comptant / Fonds prêts"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Capacité Budgétaire</span>
                  <span className="text-xs font-semibold text-white">
                    {selectedLead.budgetMin || selectedLead.budgetMax
                      ? `${selectedLead.budgetMin ? `${formatPrice(selectedLead.budgetMin)} DT` : "0"} à ${selectedLead.budgetMax ? `${formatPrice(selectedLead.budgetMax)} DT` : "Illimité"}`
                      : "Non abordé"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Coordonnées de Contact</span>
                  <span className="text-xs font-semibold text-white block truncate">{selectedLead.email || "Aucun email"}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{selectedLead.phone || "Aucun téléphone"}</span>
                </div>
              </div>

              {/* Chat conversations history */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  <span>Historique des Échanges</span>
                </h4>

                {selectedLead.conversations.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">Aucune session de chat enregistrée pour ce prospect.</p>
                ) : (
                  <div className="space-y-6">
                    {selectedLead.conversations.map((conv, idx) => (
                      <div key={conv.id} className="space-y-3">
                        <div className="flex items-center justify-between text-[9px] text-slate-500 border-b border-slate-900 pb-1">
                          <span>Session #{idx + 1} ({conv.sessionId})</span>
                          <span>Débuté le : {new Date(conv.startedAt).toLocaleString("fr-FR")}</span>
                        </div>
                        <div className="space-y-3.5 bg-slate-950 p-4 border border-slate-900 rounded-2xl max-h-[50vh] overflow-y-auto">
                          {conv.messages.map((m) => {
                            const isUser = m.role === "USER";
                            return (
                              <div key={m.id} className="space-y-1">
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${isUser ? "text-amber-400" : "text-emerald-400"}`}>
                                  {isUser ? "Client" : "Conseiller Virtuel WAFA"}
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
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
