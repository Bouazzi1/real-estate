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
  Bot,
  User,
  ExternalLink,
  ChevronRight,
  Compass,
  Zap,
  Home,
  MessageSquare
} from "lucide-react";

interface Message {
  role: "USER" | "ASSISTANT";
  content: string;
}

interface ChatPageClientProps {
  agencyName: string;
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-4 h-full overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950 shadow-2xl backdrop-blur-2xl">
      
      {/* ── Left Sidebar (ChatGPT / Gemini Drawer) ── */}
      <div className="w-full md:w-72 bg-slate-900/60 border-b md:border-b-0 md:border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          
          {/* New Chat CTA Button */}
          <button
            onClick={() => startNewSession()}
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
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5 animate-fadeIn">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-amber-400" />
                Contexte Biens Actif
              </span>
              <p className="text-xs font-extrabold text-white">Appartement {apartmentRef}</p>
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
                  onClick={() => sendMessageQuery(p.query)}
                  disabled={loading}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-850 border border-slate-800/60 hover:border-amber-500/30 text-slate-300 hover:text-white text-xs font-semibold transition-all duration-200 flex items-center justify-between group cursor-pointer"
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
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2 px-2 text-[11px] font-medium text-slate-350">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>NVIDIA Nemotron-3 RAG • Llama 3.1</span>
          </div>
        </div>
      </div>

      {/* ── Main Chat Workspace (ChatGPT / Gemini Canvas) ── */}
      <div className="flex-1 flex flex-col h-full bg-slate-950/40 overflow-hidden relative">
        
        {/* Top Header Bar */}
        <div className="px-6 py-3.5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 p-0.5 flex items-center justify-center shadow-md shadow-amber-500/20">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white tracking-tight">{agencyName} AI Advisor</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  En ligne
                </span>
              </div>
              <p className="text-[10px] text-slate-350">Conseiller Commercial d'Exception (IA & RAG)</p>
            </div>
          </div>

          <button
            onClick={() => startNewSession()}
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Effacer la session</span>
          </button>
        </div>

        {/* Message Stream Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* Welcome Card when initial greeting is displayed */}
          {messages.length <= 1 && (
            <div className="max-w-2xl mx-auto py-6 space-y-6 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 p-0.5 mx-auto shadow-xl shadow-amber-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-amber-400" />
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Bienvenue à la {agencyName}
                </h2>
                <p className="text-xs sm:text-sm text-slate-350 max-w-md mx-auto mt-2 leading-relaxed">
                  Posez vos questions sur nos suites, attiques, superficies, tarifs en Dinars Tunisiens (DT) ou planifiez une visite privée.
                </p>
              </div>

              {/* Starter Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                {starterPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessageQuery(p.query)}
                    disabled={loading}
                    className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800/80 hover:border-amber-500/40 transition-all duration-300 group cursor-pointer shadow-lg hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5 text-amber-400 font-extrabold text-xs mb-1">
                      <p.icon className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span>{p.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-350 leading-snug">{p.subtitle}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Render Messages */}
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3.5 max-w-3xl mx-auto ${
                m.role === "USER" ? "justify-end" : "justify-start"
              } animate-fadeIn`}
            >
              {/* Assistant Avatar */}
              {m.role === "ASSISTANT" && (
                <div className="w-8 h-8 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
              )}

              {/* Message Content Bubble */}
              <div className="relative group">
                <div
                  className={`rounded-3xl p-5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-lg ${
                    m.role === "USER"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold rounded-br-none"
                      : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none backdrop-blur-md"
                  }`}
                >
                  {m.content}
                </div>

                {/* Copy Button for Assistant responses */}
                {m.role === "ASSISTANT" && m.content && (
                  <button
                    onClick={() => copyToClipboard(m.content, idx)}
                    className="absolute -bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] text-slate-300 flex items-center gap-1 cursor-pointer shadow-md"
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
                <div className="w-8 h-8 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-amber-400" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Typing State */}
          {loading && messages[messages.length - 1]?.role === "USER" && (
            <div className="flex gap-3.5 max-w-3xl mx-auto justify-start animate-fadeIn">
              <div className="w-8 h-8 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              </div>
              <div className="bg-slate-900/90 border border-slate-800 text-slate-400 rounded-3xl rounded-bl-none px-5 py-4 text-xs sm:text-sm flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Analyse du catalogue & vectorisation pgvector...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── ChatGPT Floating Input Bar ── */}
        <div className="p-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
          <form
            onSubmit={handleSend}
            className="max-w-3xl mx-auto relative flex items-center bg-slate-900/90 border border-slate-800 hover:border-slate-700 focus-within:border-amber-500/60 focus-within:ring-2 focus-within:ring-amber-500/20 rounded-3xl p-2 shadow-2xl backdrop-blur-2xl transition-all duration-300"
          >
            <input
              type="text"
              required
              disabled={loading}
              placeholder="Posez votre question sur les appartements, prix en DT ou réservez une visite..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent px-4 py-2.5 text-white text-xs sm:text-sm placeholder-slate-350 focus:outline-none"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-2xl transition-all duration-200 disabled:opacity-30 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 shrink-0"
              title="Envoyer le message"
            >
              <Send className="w-4 h-4 text-slate-950" />
            </button>
          </form>

          <p className="text-[10px] text-slate-350 text-center mt-2.5">
            L'IA Résidence WAFA utilise la base de données pgvector officielle. Informations commerciales vérifiées.
          </p>
        </div>

      </div>
    </div>
  );
}
