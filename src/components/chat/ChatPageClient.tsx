"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Send,
  Loader2,
  RefreshCw,
  Building2,
  Calendar,
  ShieldCheck,
  Plus,
  Copy,
  Check,
  User,
  ChevronRight,
  Compass,
  Menu,
  X,
  Mic,
  Volume2,
  ExternalLink
} from "lucide-react";

interface Message {
  role: "USER" | "ASSISTANT";
  content: string;
}

interface ChatPageClientProps {
  agencyName: string;
}

function FormattedMessageText({ content }: { content: string }) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    const label = match[1];
    const url = match[2];

    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-amber-500 dark:text-amber-400 font-bold underline underline-offset-2 hover:text-amber-400 transition-colors my-1 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20"
      >
        <span>{label}</span>
        <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
      </a>
    );

    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return <>{parts.length > 0 ? parts : content}</>;
}

export default function ChatPageClient({ agencyName }: ChatPageClientProps) {
  const searchParams = useSearchParams();
  const apartmentRef = searchParams.get("apartment");
  const bookIntent = searchParams.get("book");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const starterPrompts = [
    {
      title: "Offres Disponibles",
      subtitle: "Voir tout le catalogue & appartements libres",
      icon: Building2,
      query: "Quelles sont les offres et appartements disponibles à la Résidence WAFA ?"
    },
    {
      title: "Penthouse Duplex",
      subtitle: "Découvrir le Penthouse WAF-801 d'exception",
      icon: Sparkles,
      query: "Quel est le prix et les caractéristiques du Penthouse Duplex WAF-801 ?"
    },
    {
      title: "Réserver une Visite",
      subtitle: "Planifier un rendez-vous privé sur place",
      icon: Calendar,
      query: "Je souhaite réserver une visite privée pour la Résidence WAFA cette semaine."
    },
    {
      title: "Studios & T3 Prestige",
      subtitle: "Consulter les superficies & prix en DT",
      icon: Compass,
      query: "Quels sont les tarifs et superficies des studios et T3 de la résidence ?"
    }
  ];

  const startNewSession = (customRef?: string, isBooking?: boolean) => {
    const newSid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("elysium_chat_session", newSid);
    setSessionId(newSid);

    let initialGreeting = `Bonjour et bienvenue. Je suis le Conseiller Commercial d'Exception pour la ${agencyName}.\nComment puis-je vous accompagner aujourd'hui dans l'exploration de nos suites et attiques de prestige ?`;

    const targetRef = customRef || apartmentRef;
    const targetBook = isBooking !== undefined ? isBooking : bookIntent === "true";

    if (targetRef) {
      if (targetBook) {
        initialGreeting = `Bonjour ! Je serais ravi de vous aider à planifier une visite privée pour l'appartement ${targetRef}.\nConsultons les créneaux disponibles pour vous réserver un accueil privilégié.`;
      } else {
        initialGreeting = `Bonjour ! Je vois que vous découvrez l'appartement ${targetRef}.\nSouhaitez-vous obtenir sa fiche technique, sa grille tarifaire, ou planifier une visite privée ?`;
      }
    }

    setMessages([
      {
        role: "ASSISTANT",
        content: initialGreeting,
      },
    ]);
  };

  useEffect(() => {
    const savedSid = localStorage.getItem("elysium_chat_session");
    const lastApartmentRef = localStorage.getItem("elysium_last_apartment_ref");

    if (!savedSid || (apartmentRef && apartmentRef !== lastApartmentRef)) {
      if (apartmentRef) {
        localStorage.setItem("elysium_last_apartment_ref", apartmentRef);
      }
      startNewSession();
    } else {
      setSessionId(savedSid);
      loadChatHistory(savedSid);
    }
  }, [apartmentRef, bookIntent]);

  const loadChatHistory = async (sid: string) => {
    try {
      const res = await fetch(`/api/chat/history?sessionId=${sid}`);
      if (res.ok) {
        const history = await res.json();
        if (Array.isArray(history) && history.length > 0) {
          setMessages(
            history.map((m: any) => ({
              role: m.role === "USER" ? "USER" : "ASSISTANT",
              content: m.content,
            }))
          );
        } else {
          startNewSession();
        }
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
      startNewSession();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessageQuery = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: "USER", content: queryText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          messages: newMessages.map((m) => ({
            role: m.role.toLowerCase(),
            content: m.content,
          })),
          apartmentReference: apartmentRef || undefined,
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream");

      setMessages((prev) => [...prev, { role: "ASSISTANT", content: "" }]);

      let assistantReply = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        assistantReply += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "ASSISTANT",
            content: assistantReply,
          };
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "ASSISTANT",
          content: "Désolé, une erreur de connexion est survenue. Veuillez réitérer votre demande.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input;
    setInput("");
    sendMessageQuery(text);
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (!mounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs gap-3 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        <span>Chargement du Conseiller Virtuel WAFA...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden rounded-none sm:rounded-3xl border-0 sm:border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-xl backdrop-blur-2xl relative">
      
      {/* ── Left Sidebar Drawer (Desktop permanent, Mobile overlay) ── */}
      <div
        className={`fixed inset-0 z-50 md:relative md:z-auto bg-white dark:bg-slate-955 md:bg-slate-50/80 dark:md:bg-slate-900/60 border-r border-slate-200/80 dark:border-slate-800/80 p-4 flex flex-col justify-between shrink-0 w-72 transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-4">
          
          {/* Header Mobile Drawer Close */}
          <div className="flex items-center justify-between md:hidden pb-2 border-b border-slate-800">
            <span className="font-extrabold text-xs text-amber-400 uppercase tracking-widest">
              {agencyName} AI
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat CTA Button */}
          <button
            onClick={() => {
              startNewSession();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg shadow-amber-500/15 transition-all duration-300 cursor-pointer active:scale-95 group"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="w-4 h-4 text-slate-950 group-hover:rotate-90 transition-transform duration-300" />
              <span>Nouveau Chat</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-slate-950/70" />
          </button>

          {/* Active Apartment Context Card */}
          {apartmentRef && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/25 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-amber-400" />
                Contexte Biens Actif
              </span>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">Appartement {apartmentRef}</p>
              {bookIntent === "true" && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Calendar className="w-3 h-3" />
                  Mode Visite Privée
                </span>
              )}
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="space-y-1 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-350 px-2 block">
              Prompts Rapides
            </span>
            <div className="space-y-1">
              {starterPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    sendMessageQuery(p.query);
                    setMobileMenuOpen(false);
                  }}
                  disabled={loading}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900/40 hover:bg-amber-50/50 dark:hover:bg-slate-850 border border-slate-200/80 dark:border-slate-800/60 hover:border-amber-300 dark:hover:border-amber-500/30 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all duration-200 flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <p.icon className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">{p.title}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-amber-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2 px-2 text-[11px] font-medium text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Conseiller Commercial Virtuel • Résidence WAFA</span>
          </div>
        </div>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* ── Main Chat Workspace (ChatGPT / Gemini Fixed Canvas) ── */}
      <div className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/40 overflow-hidden relative">
        
        {/* Top Header Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl shadow-xs flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile Drawer Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
              title="Ouvrir le menu"
            >
              <Menu className="w-4 h-4 text-amber-400" />
            </button>

            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 p-0.5 flex items-center justify-center shadow-md shadow-amber-500/20">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">{agencyName} — Conseiller Commercial</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  En ligne
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">Conseiller Commercial Privé 24/7</p>
            </div>
          </div>

          <button
            onClick={() => startNewSession()}
            className="text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Effacer la session</span>
          </button>
        </div>

        {/* Message Stream Area (The ONLY scrollable region!) */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-8 py-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* Welcome Card when initial greeting is displayed */}
          {messages.length <= 1 && (
            <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-5 text-center animate-fadeIn">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 p-0.5 mx-auto shadow-xl shadow-amber-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
                </div>
              </div>

              <div>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">
                  Bienvenue à la {agencyName}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                  Posez vos questions sur nos suites, attiques, superficies, tarifs en Dinars Tunisiens (DT) ou planifiez une visite privée.
                </p>
              </div>

              {/* Starter Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-1">
                {starterPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessageQuery(p.query)}
                    disabled={loading}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 hover:bg-amber-50/40 dark:hover:bg-slate-850 border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-300 dark:hover:border-amber-500/40 shadow-xs hover:shadow-md transition-all duration-300 group cursor-pointer hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs mb-1">
                      <p.icon className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span>{p.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{p.subtitle}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Render Messages */}
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 max-w-3xl mx-auto ${
                m.role === "USER" ? "justify-end" : "justify-start"
              } animate-fadeIn`}
            >
              {/* Assistant Avatar */}
              {m.role === "ASSISTANT" && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                </div>
              )}

              {/* Message Content Bubble */}
              <div className="relative group max-w-[88%] sm:max-w-[82%]">
                <div
                  className={`rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-lg ${
                    m.role === "USER"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold rounded-br-none"
                      : "bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-xs backdrop-blur-md"
                  }`}
                >
                  <FormattedMessageText content={m.content} />
                </div>

                {/* Copy Button for Assistant responses */}
                {m.role === "ASSISTANT" && m.content && (
                  <button
                    onClick={() => copyToClipboard(m.content, idx)}
                    className="absolute -bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer shadow-md"
                    title="Copier la réponse"
                  >
                    {copiedIdx === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* User Avatar */}
              {m.role === "USER" && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-2xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Typing State */}
          {loading && messages[messages.length - 1]?.role === "USER" && (
            <div className="flex gap-3 max-w-3xl mx-auto justify-start animate-fadeIn">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-spin" />
              </div>
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shadow-xs rounded-3xl rounded-bl-none px-4 py-3.5 text-xs sm:text-sm flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Le Conseiller IA prépare sa réponse...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── ChatGPT Mobile & Desktop Sticky Input Bar (Screenshot 2 style) ── */}
        <div className="p-2 sm:p-4 bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0 sticky bottom-0 z-20">
          <form
            onSubmit={handleSend}
            className="max-w-3xl mx-auto relative flex items-center bg-slate-50 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-within:border-amber-500 focus-within:bg-white dark:focus-within:bg-slate-900 shadow-md transition-all rounded-full p-1.5 sm:p-2 duration-300"
          >
            {/* ChatGPT + Plus icon button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-full bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shrink-0 ml-1"
              title="Prompts rapides"
            >
              <Plus className="w-4 h-4 text-slate-300" />
            </button>

            {/* Input field */}
            <input
              type="text"
              required
              disabled={loading}
              placeholder="Répondre à la Résidence WAFA..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent px-3 sm:px-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-xs sm:text-sm"
            />

            {/* Microphone Icon Placeholder (like ChatGPT Mobile) */}
            <button
              type="button"
              className="p-2 rounded-full text-slate-400 hover:text-slate-200 transition-colors hidden sm:block shrink-0"
              title="Entrée vocale"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Send / Audio Action Pill */}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 sm:p-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-full transition-all duration-200 disabled:opacity-30 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 shrink-0"
              title="Envoyer"
            >
              <Send className="w-4 h-4 text-slate-950" />
            </button>
          </form>

          <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-1.5 hidden sm:block">
            L'IA Résidence WAFA utilise la base pgvector officielle. Réponses commerciales vérifiées.
          </p>
        </div>

      </div>
    </div>
  );
}
