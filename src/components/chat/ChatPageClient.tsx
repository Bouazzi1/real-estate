"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Send,
  Sparkles,
  Loader2,
  RefreshCw,
  Building2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  ArrowRight
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        initialGreeting = `Bonjour ! Je vois que vous découvrez l'appartement ${targetRef}.\nSouhaitez-vous obtenir sa fiche technique, la brochure d'architecte, ou planifier une visite privée ?`;
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

    // If context changed to a different apartment or no session exists, start fresh session
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    const newMessages: Message[] = [...messages, { role: "USER", content: userText }];
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
          content: "Désolé, une erreur de connexion est survenue. Veuillez réinstaller votre demande.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6 h-[750px] max-h-[85vh]">
      {/* Left Sidebar Context Info */}
      <div className="w-full md:w-80 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between backdrop-blur-xl">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-white tracking-tight">{agencyName}</h2>
              <p className="text-xs text-slate-400">Conseiller Commercial IA</p>
            </div>
          </div>

          {apartmentRef && (
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 block">
                Contexte Appartement
              </span>
              <p className="text-sm font-bold text-white">Référence : {apartmentRef}</p>
              {bookIntent === "true" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Calendar className="w-3.5 h-3.5" />
                  Mode Réservation
                </span>
              )}
            </div>
          )}

          <div className="space-y-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Réponses instantanées sur les plans & tarifs</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Accès direct aux brochures d'architectes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Prise de RDV visite synchronisée</span>
            </div>
          </div>
        </div>

        {/* Reset conversation button */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <button
            onClick={() => startNewSession()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Nouveau Chat (Réinitialiser)</span>
          </button>
          <p className="text-[10px] text-slate-500 text-center">
            🔒 Collecte consentie RGPD. Transmission commerciale exclusive.
          </p>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-3xl flex flex-col overflow-hidden backdrop-blur-xl">
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-white">Conseiller Virtuel Résidence Aurea</span>
          </div>
          <button
            onClick={() => startNewSession()}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Nouveau Chat</span>
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === "USER" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 text-sm whitespace-pre-wrap leading-relaxed shadow-lg ${
                  m.role === "USER"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role === "USER" && (
            <div className="flex justify-start">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none p-4 text-slate-400 flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span>Recherche dans la base pgvector Résidence Aurea...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950/80 flex gap-3">
          <input
            type="text"
            required
            disabled={loading}
            placeholder="Posez votre question sur les appartements, tarifs ou visites..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <span>Envoyer</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
