"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { MessageSquare, X, Send, Sparkles, Loader2, Calendar, User, MessageCircle, RefreshCw } from "lucide-react";

interface Message {
  role: "USER" | "ASSISTANT";
  content: string;
}

export default function ChatWidget() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isAdmin = pathname?.startsWith("/admin") || false;
  const isHidden = isAdmin || pathname === "/chat";

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const startNewSession = (customRef?: string, isBooking?: boolean) => {
    const newSid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("elysium_chat_session", newSid);
    setSessionId(newSid);

    const aptRef = customRef || searchParams.get("apartment");
    const bookIntent = isBooking !== undefined ? isBooking : searchParams.get("book") === "true";

    let greeting = "Bonjour ! Je suis le Conseiller Virtuel pour la Résidence WAFA. Comment puis-je vous accompagner ?";
    if (aptRef) {
      if (bookIntent) {
        greeting = `Bonjour ! Je serais ravi de vous aider à réserver une visite pour l'appartement ${aptRef}. Consulterons-nous les créneaux disponibles ?`;
      } else {
        greeting = `Bonjour ! Je vois que vous consultez l'appartement ${aptRef}. Avez-vous des questions sur le prix, la surface ou les prestations ?`;
      }
    }

    setMessages([
      {
        role: "ASSISTANT",
        content: greeting,
      },
    ]);
  };

  // 1. Initialize or load sessionId from localStorage
  useEffect(() => {
    if (isHidden) return; // Skip initialization when widget is hidden
    let sid = localStorage.getItem("elysium_chat_session");
    const lastApt = localStorage.getItem("elysium_last_apartment_ref");
    const currentApt = searchParams.get("apartment");

    if (!sid || (currentApt && currentApt !== lastApt)) {
      if (currentApt) {
        localStorage.setItem("elysium_last_apartment_ref", currentApt);
      }
      startNewSession();
    } else {
      setSessionId(sid);
      loadChatHistory(sid);
    }
  }, [searchParams, isHidden]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadChatHistory = async (sid: string) => {
    try {
      const res = await fetch(`/api/chat/history?sessionId=${sid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setMessages(data);
        }
      }
    } catch (e) {
      console.warn("Failed to load chat history:", e);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");
    setLoading(true);

    const updatedMessages = [...messages, { role: "USER" as const, content: userText }];
    setMessages(updatedMessages);

    // Get active apartment reference context if available in URL
    const apartmentReference = searchParams.get("apartment") || undefined;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role.toLowerCase(), content: m.content })),
          sessionId,
          apartmentReference,
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      // Add a placeholder message for the streaming reply
      setMessages((prev) => [...prev, { role: "ASSISTANT", content: "" }]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantText += chunk;

          // Update the streaming reply in state
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "ASSISTANT", content: assistantText };
            return copy;
          });
        }
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "ASSISTANT", content: "Désolé, un problème de connexion est survenu. Veuillez réessayer." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Return null AFTER all hooks have been called (React rules-of-hooks)
  if (isHidden) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end text-xs">
      
      {/* Slide-in Chat panel */}
      {isOpen && (
        <div className="w-[90vw] sm:w-[400px] h-[600px] max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl rounded-3xl flex flex-col justify-between overflow-hidden mb-4 backdrop-blur-xl relative">
          
          {/* Header panel */}
          <div className="px-6 py-4 bg-slate-900 text-slate-100 flex items-center justify-between border-b border-slate-850">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-white block">WAFA Advisor</span>
                <span className="text-[9px] text-slate-500 uppercase font-semibold">Conseiller Commercial IA</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => startNewSession()}
                title="Nouveau Chat (Réinitialiser)"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="text-[10px]">Reset</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-900/10">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-850 dark:text-white text-sm">Posez vos questions sur nos biens</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[250px]">
                    Renseignez-vous sur les prix, superficies, brochures, ou planifiez une visite avec notre assistant IA.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isUser = m.role === "USER";
                return (
                  <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed text-xs ${
                        isUser
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold shadow-md rounded-br-none"
                          : "bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-855 text-slate-800 dark:text-slate-200 shadow-sm rounded-bl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                );
              })
            )}
            {loading && messages[messages.length - 1]?.role === "USER" && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-855 border border-slate-200 dark:border-slate-850 text-slate-400 shadow-xs rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Recherche dans la base de données...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form inputs */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                required
                disabled={loading}
                placeholder="Posez vos questions sur la Résidence WAFA..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm rounded-xl py-2.5 px-4"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-1">
              🔒 Collecte consentie (RGPD). Vos données sont transmises exclusivement à notre équipe commerciale.
            </p>
          </form>

        </div>
      )}

      {/* Floating Toggle Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-full shadow-2xl shadow-amber-500/20 transition-all duration-300 hover:scale-105 cursor-pointer flex items-center justify-center relative animate-pulseGold"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

    </div>
  );
}
