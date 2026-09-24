"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  MapPin,
  Sparkles,
  Bot,
  Calendar,
  LogOut,
  SlidersHorizontal,
  Search,
  Star,
  Clock,
  ChevronRight,
  TrendingUp,
  Cpu,
  CloudRain,
  Sun,
  Users,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { PlaceSummary, User as UserType } from "@/types";

interface RecommendedItem {
  place: PlaceSummary;
  score: number;
  model_name: string;
  score_explanation: Record<string, any>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeModel, setActiveModel] = useState<"model_a" | "model_b" | "model_c" | "model_d" | "model_e">("model_e");
  const [weatherContext, setWeatherContext] = useState<string>("clear");
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    const user = authStorage.getUser();
    if (!user) {
      router.push("/login");
    } else {
      router.push("/recommendations");
    }
  }, [router]);

  useEffect(() => {
    async function fetchRecommendations() {
      if (!currentUser) return;
      setLoadingRecs(true);
      try {
        let url = `/recommendations?model=${activeModel}&limit=6`;
        if (activeModel === "model_e" && weatherContext) {
          url += `&weather=${weatherContext}`;
        }
        const res = await api.get(url);
        setRecommendations(res.data.items);
        setExecutionTime(res.data.execution_time_ms);
      } catch (err) {
        console.error("Failed to load recommendations", err);
      } finally {
        setLoadingRecs(false);
      }
    }
    fetchRecommendations();
  }, [activeModel, weatherContext, currentUser]);

  const handleLogout = () => {
    authStorage.clearAuth();
    router.push("/");
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col">
      {/* Topbar */}
      <header className="w-full bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Compass className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="font-bold text-lg text-white">
            Travel<span className="text-emerald-400">Intelligence</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              {currentUser.full_name?.charAt(0) || "U"}
            </div>
            <span className="text-xs font-semibold text-slate-200">{currentUser.full_name}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-6 gap-8">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 hidden md:flex flex-col gap-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Navigation
          </div>

          <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>AI Dashboard</span>
          </button>

          <Link
            href="/explore"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors text-sm font-medium"
          >
            <Search className="w-4 h-4" />
            <span>Explore Destinations</span>
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors text-sm font-medium"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Admin Data Panel</span>
          </Link>
        </aside>

        {/* Dashboard Main Area */}
        <main className="flex-1 space-y-8">
          {/* Hero Banner */}
          <div className="glass-panel p-8 rounded-3xl border border-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[96px] pointer-events-none" />
            <div className="relative z-10 max-w-xl">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 inline-block mb-3">
                Week 4 Milestone · Models A–E Active
              </span>
              <h1 className="text-3xl font-extrabold text-white mb-3">
                Welcome, {currentUser.full_name}!
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Your personalized travel feed powered by 5 benchmark algorithms: Popularity (A), Content-Based (B), Collaborative (C), Hybrid (D), and Context-Aware AI (E).
              </p>
            </div>
          </div>

          {/* Recommendation Feed Header & Model Selector */}
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span>Personalized Recommendation Benchmarks</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Select an algorithm model to benchmark scoring, weights, and situational adaptation.
                </p>
              </div>

              {/* 5-Model Selector Tabs */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setActiveModel("model_e")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${activeModel === "model_e"
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                      : "text-slate-400 hover:text-white"
                    }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Model E (Context-Aware)</span>
                </button>

                <button
                  onClick={() => setActiveModel("model_d")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${activeModel === "model_d"
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                      : "text-slate-400 hover:text-white"
                    }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Model D (Hybrid)</span>
                </button>

                <button
                  onClick={() => setActiveModel("model_c")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${activeModel === "model_c"
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                      : "text-slate-400 hover:text-white"
                    }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Model C (Collaborative)</span>
                </button>

                <button
                  onClick={() => setActiveModel("model_b")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${activeModel === "model_b"
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                      : "text-slate-400 hover:text-white"
                    }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Model B (Content-Based)</span>
                </button>

                <button
                  onClick={() => setActiveModel("model_a")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${activeModel === "model_a"
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                      : "text-slate-400 hover:text-white"
                    }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Model A (Popularity)</span>
                </button>
              </div>

              {/* Weather Context Selector for Model E */}
              {activeModel === "model_e" && (
                <div className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-4 border-emerald-500/30">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                    <CloudRain className="w-4 h-4 text-emerald-400" />
                    <span>Real-Time Weather Context Multiplier:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(["clear", "rain", "snow", "monsoon"] as const).map((cond) => (
                      <button
                        key={cond}
                        onClick={() => setWeatherContext(cond)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${weatherContext === cond
                            ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                            : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                          }`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {executionTime !== null && (
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>Evaluation latency:</span>
                <span className="font-mono text-emerald-400 font-bold">{executionTime} ms</span>
              </div>
            )}

            {/* Recommendation Cards */}
            {loadingRecs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card h-64 rounded-2xl animate-pulse bg-slate-900/60" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((item) => (
                  <div
                    key={item.place.id}
                    className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group"
                  >
                    <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                      {item.place.primary_image ? (
                        <img
                          src={item.place.primary_image.url}
                          alt={item.place.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <MapPin className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                        {item.place.category.name}
                      </div>

                      <div className="absolute top-3 right-3 bg-emerald-500/90 text-slate-950 font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow">
                        Match {(item.score * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                          {item.place.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="font-semibold text-slate-200">
                              {(item.place.popularity_score * 5).toFixed(1)}
                            </span>
                          </div>
                          {item.place.average_visit_duration_minutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>{item.place.average_visit_duration_minutes}m</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                        <span className="text-slate-500 text-[10px]">
                          {item.model_name.toUpperCase()}
                        </span>
                        <Link
                          href={`/places/${item.place.id}`}
                          className="text-emerald-400 font-semibold flex items-center gap-1 hover:translate-x-1 transition-transform"
                        >
                          <span>View Details</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
