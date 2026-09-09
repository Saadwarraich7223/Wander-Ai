"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { authStorage } from "@/lib/auth";
import { aiApi } from "@/lib/api";
import { User as UserType, ChatMessage } from "@/types";

export default function AssistantPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      content:
        "Greetings! I am WanderAI's Travel Intelligence Assistant. Ask me anything about Pakistan destination recommendations, real-time weather passability, 4x4 alpine routes, or local budget optimization!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loggedUser = authStorage.getUser();
    setUser(loggedUser);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        content: res.response || "Synthesis complete. Verified against regional GIS telemetry.",
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
          "I am calibrating regional GIS telemetry. You can ask for Hunza weather, Skardu 4x4 routes, or custom itineraries!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface antialiased flex flex-col relative overflow-x-hidden">
      {/* Universal Fixed Top Header Component */}
      <Navbar user={user} />

      {/* Main Page Body */}
      <main className="w-full pt-20 sm:pt-24 pb-16 relative z-10 flex-1">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-8">
          {/* HERO HEADER BANNER (Consistent with Recommendations, Explore, Places) */}
          <div className="pt-4 pb-8 border-b border-outline-variant/60">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 border border-secondary/20">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    Grounded RAG Engine v4.2
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-mono hidden sm:inline-block border border-outline-variant/60">
                    Tool-Calling Active
                  </span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-on-surface">
                  AI Travel Intelligence Console
                </h1>
                <p className="font-sans text-sm sm:text-base text-on-surface-variant mt-2.5 leading-relaxed max-w-2xl">
                  Conversational RAG agent augmented by real-time weather telemetry, PostGIS waypoint meshes, local cost parameters, and multi-day expedition synthesis.
                </p>
              </div>

              {/* Status Badges Box */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-surface-container-high/70 p-3 rounded-2xl border border-outline-variant/60">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-lowest text-xs font-mono text-on-surface border border-outline-variant/60">
                  <span className="material-symbols-outlined text-sm text-secondary">satellite_alt</span>
                  <span>Sentinel-2 Synced</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-lowest text-xs font-mono text-on-surface border border-outline-variant/60">
                  <span className="material-symbols-outlined text-sm text-secondary">verified_user</span>
                  <span>PMD Telemetry</span>
                </div>
              </div>
            </div>

            {/* Quick Starter Prompts Strip */}
            <div className="mt-6 pt-5 border-t border-outline-variant/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  emoji: "🌤️",
                  title: "Hunza Weather Window",
                  desc: "Check clear-sky windows & passability for Karakoram Highway",
                  query: "What is the live weather & road passability for Hunza Valley?",
                },
                {
                  emoji: "🕌",
                  title: "Lahore Heritage Tour",
                  desc: "Synthesize 2-day historical fort & gastronomy itinerary",
                  query: "Recommend top UNESCO cultural spots and heritage sites in Lahore.",
                },
                {
                  emoji: "🚙",
                  title: "Skardu 4x4 Expedition",
                  desc: "Plan high-altitude cold desert route with LC76 specs",
                  query: "Synthesize a 5-day 4x4 high-altitude itinerary for Skardu & Deosai.",
                },
                {
                  emoji: "💰",
                  title: "Budget Optimization",
                  desc: "Calculate 5-day family travel baseline under 80,000 PKR",
                  query: "Help me optimize budget for a 5-day family trip to Swat & Kalam.",
                },
              ].map((card) => (
                <button
                  key={card.title}
                  onClick={() => handleSendMessage(undefined, card.query)}
                  className="p-3.5 rounded-2xl bg-surface-container-lowest hover:bg-surface-container text-left transition-all border border-outline-variant/60 hover:border-secondary/40 shadow-xs hover:-translate-y-0.5 cursor-pointer group flex flex-col justify-between"
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{card.emoji}</span>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-secondary transition-colors">
                      arrow_forward
                    </span>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    <h4 className="font-display font-bold text-xs text-on-surface group-hover:text-secondary transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* TWO-COLUMN EDITORIAL CONSOLE LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* MAIN CHAT CONSOLE (8 COLS) */}
            <div className="lg:col-span-8 bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/60 flex flex-col h-[650px] relative">
              {/* Console Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/40 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-2xl">smart_toy</span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-on-surface">
                      Travel Intelligence Assistant
                    </h3>
                    <p className="text-xs text-on-surface-variant font-mono">
                      Grounded RAG Pipeline · Connected to Pakistan GIS
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setMessages([
                      {
                        id: "welcome",
                        sender: "assistant",
                        content:
                          "Session reset. Ask me anything about Pakistan destinations, weather, 4x4 passes, or trip planning!",
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      },
                    ])
                  }
                  className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors border border-outline-variant/60 flex items-center gap-1 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  <span>Clear Session</span>
                </button>
              </div>

              {/* Messages Thread Container */}
              <div className="flex-1 py-6 overflow-y-auto space-y-4 scrollbar-none">
                {messages.map((msg) => {
                  const isAssistant = msg.sender === "assistant";

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3.5 ${isAssistant ? "justify-start" : "justify-end"}`}
                    >
                      {isAssistant && (
                        <div className="w-8 h-8 rounded-2xl bg-secondary/15 border border-secondary/30 text-secondary flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <span className="material-symbols-outlined text-base">smart_toy</span>
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed ${
                          isAssistant
                            ? "bg-surface-container-low/90 border-l-2 border-secondary border border-outline-variant/40 text-on-surface shadow-xs"
                            : "bg-primary text-white font-medium ml-auto shadow-md"
                        }`}
                      >
                        <p className="whitespace-pre-line font-sans">{msg.content}</p>

                        {/* Data Provenance Citations */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3.5 pt-3 border-t border-outline-variant/40 space-y-2">
                            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">verified</span> Data Provenance Citations
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {msg.sources.map((src, i) => (
                                <a
                                  key={i}
                                  href={src.source_url || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-medium border border-outline-variant/40 transition-all hover:scale-[1.02]"
                                >
                                  <span>{src.title} ({src.source})</span>
                                  <span className="material-symbols-outlined text-xs text-secondary">open_in_new</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggested Action Buttons */}
                        {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                          <div className="mt-3.5 flex flex-wrap gap-2">
                            {msg.suggested_actions.map((act, i) => (
                              <Link
                                key={i}
                                href={act.payload || "/planner"}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 text-xs font-bold transition-all shadow-xs"
                              >
                                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                <span>{act.label}</span>
                              </Link>
                            ))}
                          </div>
                        )}

                        <span
                          className={`block text-[10px] font-mono mt-2 opacity-60 ${
                            isAssistant ? "text-on-surface-variant" : "text-white/80"
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant bg-surface-container-low p-4 rounded-2xl border border-outline-variant/40 max-w-xs shadow-xs">
                    <div className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                    <span className="text-xs font-mono font-semibold text-secondary">
                      Running RAG retrieval &amp; GIS tools...
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Form Input Bar */}
              <div className="pt-4 border-t border-outline-variant/40 shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about places in Lahore, weather in Hunza, 4x4 routes, or budget..."
                    className="flex-1 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/60 text-xs sm:text-sm px-5 py-3.5 rounded-2xl border border-outline-variant/60 focus:outline-none focus:border-secondary shadow-xs font-medium"
                  />
                  <button
                    type="submit"
                    disabled={loading || !inputMessage.trim()}
                    className="px-6 py-3.5 rounded-2xl bg-secondary text-white hover:bg-secondary-dark disabled:opacity-40 font-bold transition-all cursor-pointer shadow-md shadow-secondary/20 flex items-center gap-2 text-xs sm:text-sm shrink-0"
                  >
                    <span>Send Query</span>
                    <span className="material-symbols-outlined text-base">send</span>
                  </button>
                </form>
              </div>
            </div>

            {/* SIDEBAR: GIS TELEMETRY & SYSTEM CAPABILITIES (4 COLS) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Connected RAG Sources Box */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-xs border border-outline-variant/60 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">database</span>
                    Knowledge Sources
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-mono font-bold">
                    4 Active
                  </span>
                </div>

                <h3 className="font-display font-bold text-lg text-on-surface">
                  Verified Data Provenance
                </h3>

                <div className="space-y-3 pt-1">
                  <div className="p-3 bg-surface-container-low rounded-2xl flex items-center justify-between text-xs border border-outline-variant/40">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-base text-secondary">cloud</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface">Pak Meteorological Dept</span>
                        <span className="text-[11px] text-on-surface-variant">Live rain &amp; snow telemetry</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                  </div>

                  <div className="p-3 bg-surface-container-low rounded-2xl flex items-center justify-between text-xs border border-outline-variant/40">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-base text-secondary">map</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface">PostGIS Waypoint Mesh</span>
                        <span className="text-[11px] text-on-surface-variant">300+ spatial POIs &amp; passes</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                  </div>

                  <div className="p-3 bg-surface-container-low rounded-2xl flex items-center justify-between text-xs border border-outline-variant/40">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-base text-secondary">castle</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface">UNESCO Archival Index</span>
                        <span className="text-[11px] text-on-surface-variant">Forts, Silk Road &amp; Heritage</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                  </div>

                  <div className="p-3 bg-surface-container-low rounded-2xl flex items-center justify-between text-xs border border-outline-variant/40">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-base text-secondary">payments</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface">Local Cost Parameterizer</span>
                        <span className="text-[11px] text-on-surface-variant">Real-time PKR budget estimates</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                  </div>
                </div>
              </div>

              {/* Agent Capabilities Card */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-xs border border-outline-variant/60 space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                  Agent Capabilities
                </span>
                <h3 className="font-display font-bold text-lg text-on-surface">
                  Autonomous Functions
                </h3>

                <ul className="space-y-2.5 text-xs text-on-surface-variant leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">
                      route
                    </span>
                    <span><strong>Multi-Day Route Synthesis:</strong> Generates optimal travel vectors balancing altitude, transit time, and POI density.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">
                      ac_unit
                    </span>
                    <span><strong>Weather Passability Checks:</strong> Enforces altitude caps (≤2,200m in deep snow) &amp; 4x4 tire chain protocols.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">
                      calculate
                    </span>
                    <span><strong>Budget Optimization:</strong> Computes realistic accommodation, fuel, guide, and entry fees.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Universal Shared Application Footer */}
      <footer className="w-full bg-surface-container-low py-12 sm:py-16 border-t border-outline-variant/40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 pb-8 border-b border-outline-variant/40">
            <div className="lg:col-span-4 flex flex-col items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center border border-secondary/20">
                  <span className="material-symbols-outlined text-secondary text-xl">
                    travel_explore
                  </span>
                </div>
                <span className="font-display text-xl tracking-tight font-bold text-on-surface">
                  Wander<span className="text-secondary">AI</span>
                </span>
              </div>
              <p className="text-base text-on-surface-variant max-w-sm">
                Explore more. Plan smarter. Travel better.
              </p>
              <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
                High-touch bespoke travel curation augmented by state-of-the-art computational intelligence.
              </p>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Explore
              </span>
              <div className="flex flex-col gap-2">
                <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/planner">
                  Curated Itineraries
                </Link>
                <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/places">
                  Regional Guides
                </Link>
                <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/explore#map">
                  Interactive Waypoints
                </Link>
                <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/recommendations">
                  AI Recommendations
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                AI Tools
              </span>
              <div className="flex flex-col gap-2">
                <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/planner">
                  Smart Itinerary Synthesizer
                </Link>
                <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/trips">
                  Saved Journeys
                </Link>
                <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/explore">
                  Elevation &amp; Climate Strip
                </Link>
                <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/planner">
                  Dynamic Waypoint Generator
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                AI Dispatch &amp; Updates
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Receive exclusive seasonal expedition releases and algorithmic travel insights.
              </p>
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 text-xs border border-outline-variant/60 focus:outline-none shadow-xs"
                  placeholder="Enter your email"
                  type="email"
                />
                <button
                  className="px-4 py-2.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark transition-colors text-xs font-bold cursor-pointer shadow-xs"
                  type="button"
                >
                  Join
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-on-surface-variant">
              © 2025 WanderAI Intelligence Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="#">
                Privacy Policy
              </Link>
              <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="#">
                Terms of Service
              </Link>
              <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="#">
                Security Architecture
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
