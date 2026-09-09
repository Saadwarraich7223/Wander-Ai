"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { aiApi } from "@/lib/api";
import { ChatMessage } from "@/types";

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      content:
        "Hello! I am WanderAI Travel Intelligence. Ask me anything about Pakistan destinations, weather passability, 4x4 routes, or budget optimization!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const query = customText || inputMessage;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage("");
    setLoading(true);

    try {
      const res = await aiApi.chat({ message: query });
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        content: res.response || "Here is your computational travel analysis.",
        sources: res.sources,
        suggested_actions: res.suggested_actions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        content:
          "I am calibrating regional GIS telemetry. You can ask for Hunza passes, Skardu deserts, or custom itineraries!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Interactive Chat Panel Drawer */}
      {isOpen && (
        <div className="w-[calc(100vw-3rem)] max-w-sm sm:max-w-md h-[540px] max-h-[75vh] mb-4 bg-surface-container-lowest/95 backdrop-blur-2xl rounded-3xl border border-outline-variant/80 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-slide-up">
          {/* Header Bar */}
          <div className="px-5 py-4 bg-surface-container-low border-b border-outline-variant/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary shadow-xs">
                <span className="material-symbols-outlined text-xl">smart_toy</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-sm text-on-surface">
                    WanderAI Assistant
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                </div>
                <span className="text-[11px] text-on-surface-variant font-mono">
                  Grounded Travel Intelligence
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href="/assistant"
                className="p-1.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                title="Fullscreen Assistant"
              >
                <span className="material-symbols-outlined text-lg">open_in_full</span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                type="button"
                title="Close Assistant"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-none">
            {messages.map((msg) => {
              const isAssistant = msg.sender === "assistant";

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${isAssistant
                        ? "bg-surface-container-low border border-outline-variant/40 text-on-surface"
                        : "bg-primary text-white font-medium ml-auto shadow-xs"
                      }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>

                    {/* Sources / Citations */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-outline-variant/40 space-y-1.5">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">verified</span> Data Provenance
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src, i) => (
                            <a
                              key={i}
                              href={src.source_url || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface text-[10px] border border-outline-variant/40 transition-colors"
                            >
                              <span>{src.title}</span>
                              <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Actions */}
                    {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {msg.suggested_actions.map((act, i) => (
                          <Link
                            key={i}
                            href={act.payload || "/planner"}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 text-[11px] font-semibold transition-colors"
                          >
                            <span>✨ {act.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    <span
                      className={`block text-[9px] font-mono mt-1.5 opacity-60 ${isAssistant ? "text-on-surface-variant" : "text-white/80"
                        }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2.5 text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-2xl border border-outline-variant/40 max-w-xs animate-pulse">
                <div className="w-3.5 h-3.5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                <span className="text-[11px] font-mono">Retrieving grounded intelligence...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Prompts Strip */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 bg-surface-container-low/60 border-t border-outline-variant/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {[
                "☀️ Weather in Hunza",
                "🕌 Places in Lahore",
                "🚙 5-day Skardu plan",
              ].map((starter) => (
                <button
                  key={starter}
                  onClick={() => handleSendMessage(undefined, starter)}
                  className="px-2.5 py-1 rounded-xl bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/60 text-on-surface text-[10px] font-medium whitespace-nowrap cursor-pointer transition-colors shadow-xs"
                  type="button"
                >
                  {starter}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer Form */}
          <div className="p-3 bg-surface-container-low border-t border-outline-variant/40">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about places, routes, weather..."
                className="flex-1 bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:outline-none focus:border-secondary shadow-xs"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="p-2.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark disabled:opacity-40 font-bold transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Icon Trigger Button (Always visible in bottom-right corner) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-secondary text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border border-white/20"
        type="button"
        title="Open WanderAI Assistant"
      >
        <div className="relative flex items-center justify-center">
          <span className="material-symbols-outlined text-xl transition-transform duration-300 group-hover:rotate-12">
            {isOpen ? "close" : "smart_toy"}
          </span>
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-secondary animate-ping" />
          )}
        </div>
        <span className="font-display font-bold text-xs tracking-wide">
          {isOpen ? "Close AI" : "Ask AI"}
        </span>
      </button>
    </div>
  );
}
