"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, placesApi, getErrorMessage } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { Category } from "@/types";

interface FallbackCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

const FALLBACK_CATEGORIES: FallbackCategory[] = [
  {
    id: "historical",
    name: "Historical & Heritage",
    slug: "historical",
    icon: "fort",
    description: "Mughal monuments, ancient forts, UNESCO archaeological ruins, and royal palaces.",
  },
  {
    id: "nature",
    name: "Nature & Alpine Landscapes",
    slug: "nature",
    icon: "landscape",
    description: "Turquoise glacial lakes, snow-capped Karakoram peaks, deodar pine forests, and lush meadows.",
  },
  {
    id: "food",
    name: "Culinary & Street Food",
    slug: "food",
    icon: "restaurant",
    description: "Authentic Shinwari Karahi, Sajji, old city breakfast dhabas, BBQ streets, and Kashmiri chai.",
  },
  {
    id: "adventure",
    name: "Adventure & Outdoors",
    slug: "adventure",
    icon: "hiking",
    description: "High-altitude mountain trekking, 4x4 jeep trails, ski slopes, white-water rafting, and scuba diving.",
  },
  {
    id: "religious",
    name: "Religious & Spiritual",
    slug: "religious",
    icon: "temple_buddhist",
    description: "Historic Sufi shrines, Gandharan Buddhist stupas, historic Mughal mosques, and sacred temples.",
  },
  {
    id: "shopping",
    name: "Bazaars & Artisans",
    slug: "shopping",
    icon: "shopping_bag",
    description: "Silk routes, handmade carpets, gemstone markets, blue pottery artisans, and traditional handicrafts.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>(FALLBACK_CATEGORIES);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Record<string, number>>({});
  const [budgetTier, setBudgetTier] = useState<"budget" | "moderate" | "luxury">("moderate");
  const [travelStyle, setTravelStyle] = useState<"cultural" | "adventure" | "relaxation" | "mixed">("adventure");
  const [pacing, setPacing] = useState<"leisurely" | "balanced" | "intensive">("balanced");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setFetching(true);
      const data = await placesApi.getCategories();
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
        // Pre-select first 2 categories
        const initial: Record<string, number> = {};
        initial[data[0].id] = 0.8;
        if (data.length > 1) initial[data[1].id] = 0.8;
        setSelectedCategoryIds(initial);
      } else {
        // Use fallback
        const initial: Record<string, number> = {
          historical: 0.8,
          nature: 0.8,
          adventure: 0.8,
        };
        setSelectedCategoryIds(initial);
      }
    } catch (err) {
      console.warn("Could not fetch remote categories, using verified defaults", err);
      const initial: Record<string, number> = {
        historical: 0.8,
        nature: 0.8,
        adventure: 0.8,
      };
      setSelectedCategoryIds(initial);
    } finally {
      setFetching(false);
    }
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) => {
      const copy = { ...prev };
      if (copy[catId]) {
        delete copy[catId];
      } else {
        copy[catId] = 0.8;
      }
      return copy;
    });
  };

  const selectedCount = Object.keys(selectedCategoryIds).length;

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = authStorage.getAccessToken();

      // If logged in, update remote user preferences
      if (token) {
        const preferencesPayload = Object.entries(selectedCategoryIds).map(([catId, score]) => ({
          category_id: catId,
          preference_score: score,
        }));

        if (preferencesPayload.length > 0) {
          try {
            await api.put("/users/me/preferences", { preferences: preferencesPayload });
          } catch (prefErr) {
            console.warn("Preference save skipped", prefErr);
          }
        }

        try {
          await api.put("/users/me/profile", {
            preferred_budget: budgetTier,
            travel_style: travelStyle,
          });
        } catch (profErr) {
          console.warn("Profile save skipped", profErr);
        }
      }

      // Save local persona cache
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "wander_onboarding_preferences",
          JSON.stringify({
            categories: Object.keys(selectedCategoryIds),
            budgetTier,
            travelStyle,
            pacing,
            timestamp: new Date().toISOString(),
          })
        );
      }

      router.push("/explore");
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to save travel preferences. Please try again."));
      console.error("Failed to save preferences", err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (cat: any) => {
    if (cat.icon) return cat.icon;
    const name = (cat.name || "").toLowerCase();
    if (name.includes("historic") || name.includes("fort")) return "fort";
    if (name.includes("nature") || name.includes("lake") || name.includes("mount")) return "landscape";
    if (name.includes("food") || name.includes("dining")) return "restaurant";
    if (name.includes("adventur") || name.includes("hik")) return "hiking";
    if (name.includes("religio") || name.includes("shrine") || name.includes("mosque")) return "temple_buddhist";
    if (name.includes("shop") || name.includes("bazaar")) return "shopping_bag";
    return "explore";
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col justify-between selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Top Ambient Glow Highlights */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 focus:outline-none">
          <span className="font-display font-bold text-xl sm:text-2xl tracking-tight text-on-surface">
            Wander<span className="text-secondary">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-light border border-secondary/20 text-xs font-semibold text-secondary">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span>Personalization Engine</span>
          </div>

          <Link
            href="/explore"
            className="text-xs font-semibold text-on-surface-variant hover:text-on-surface px-3 py-1.5 rounded-xl hover:bg-surface-container transition-colors"
          >
            Skip for now →
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center space-y-8 sm:space-y-10">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/60 text-xs font-semibold text-on-surface-variant shadow-xs">
            <span>Step 1 of 2</span>
            <span>•</span>
            <span className="text-secondary font-bold">Discover Your Travel Persona</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
            What excites you most <span className="gradient-text">about Pakistan?</span>
          </h1>

          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            Select your preferred travel interests and travel style so our AI engine can tailor personalized recommendations, itineraries, and elevation telemetry for your journeys.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-lg shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Categories */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-on-surface">
                1. Destinations &amp; Experiences
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                Select one or more categories that interest you.
              </p>
            </div>
            <span className="text-xs font-bold text-secondary bg-secondary-light px-2.5 py-1 rounded-lg border border-secondary/20">
              {selectedCount} Selected
            </span>
          </div>

          {fetching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-surface-container" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {categories.map((cat) => {
                const isSelected = Boolean(selectedCategoryIds[cat.id]);
                const iconName = getCategoryIcon(cat);

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 border relative group cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-secondary-light/80 border-secondary ring-2 ring-secondary/20 shadow-sm"
                        : "bg-surface-container-lowest border-outline-variant/60 hover:border-secondary/40 hover:bg-surface-container-low shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-secondary text-white shadow-xs"
                            : "bg-surface-container text-secondary group-hover:bg-secondary-light"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">{iconName}</span>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-secondary text-white scale-100"
                            : "border border-outline-variant/80 text-transparent scale-90"
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm font-bold">check</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-on-surface text-sm sm:text-base leading-snug mb-1">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                        {cat.description || `Explore scenic ${cat.name.toLowerCase()} locations across Pakistan.`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Budget & Travel Style */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/70 shadow-sm">
          {/* Budget Tier */}
          <div className="space-y-3">
            <div>
              <label className="block font-display text-sm font-bold text-on-surface">
                2. Preferred Budget Tier
              </label>
              <p className="text-xs text-on-surface-variant">
                Select your average spending comfort per day.
              </p>
            </div>

            <div className="space-y-2">
              {[
                {
                  id: "budget",
                  label: "Budget Explorer",
                  pkr: "Under ₨5,000 / day",
                  desc: "Hostels, local dhabas & public transport",
                  icon: "savings",
                },
                {
                  id: "moderate",
                  label: "Comfort & Balanced",
                  pkr: "₨5,000 - ₨18,000 / day",
                  desc: "Boutique hotels, private car & guided dining",
                  icon: "hotel",
                },
                {
                  id: "luxury",
                  label: "Luxury & Exclusive",
                  pkr: "₨18,000+ / day",
                  desc: "5★ resorts, private 4x4 jeeps & flights",
                  icon: "diamond",
                },
              ].map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setBudgetTier(tier.id as any)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    budgetTier === tier.id
                      ? "bg-secondary-light border-secondary ring-2 ring-secondary/20 shadow-xs"
                      : "bg-surface-container-low border-outline-variant/50 hover:bg-surface-container hover:border-outline-variant"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        budgetTier === tier.id ? "bg-secondary text-white" : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">{tier.icon}</span>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-on-surface">{tier.label}</div>
                      <div className="text-[11px] text-on-surface-variant">{tier.desc}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-secondary shrink-0">{tier.pkr}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Travel Style */}
          <div className="space-y-3">
            <div>
              <label className="block font-display text-sm font-bold text-on-surface">
                3. Primary Travel Style
              </label>
              <p className="text-xs text-on-surface-variant">
                How do you prefer to experience destinations?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  id: "adventure",
                  label: "Alpine & Trekking",
                  icon: "altitude",
                  desc: "Glaciers & peaks",
                },
                {
                  id: "cultural",
                  label: "Heritage & Culture",
                  icon: "account_balance",
                  desc: "Forts & history",
                },
                {
                  id: "relaxation",
                  label: "Serene & Scenic",
                  icon: "park",
                  desc: "Lakes & meadows",
                },
                {
                  id: "mixed",
                  label: "Roadtrip Explorer",
                  icon: "directions_car",
                  desc: "Highway food trails",
                },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setTravelStyle(style.id as any)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                    travelStyle === style.id
                      ? "bg-secondary-light border-secondary ring-2 ring-secondary/20 shadow-xs"
                      : "bg-surface-container-low border-outline-variant/50 hover:bg-surface-container hover:border-outline-variant"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      travelStyle === style.id ? "bg-secondary text-white" : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{style.icon}</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-on-surface leading-tight">{style.label}</div>
                    <div className="text-[10px] text-on-surface-variant mt-0.5">{style.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Pacing selection */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                Trip Pacing Preference
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "leisurely", label: "Leisurely" },
                  { id: "balanced", label: "Balanced" },
                  { id: "intensive", label: "High Energy" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPacing(p.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer border ${
                      pacing === p.id
                        ? "bg-on-surface text-white border-on-surface shadow-xs"
                        : "bg-surface-container text-on-surface-variant border-outline-variant/40 hover:text-on-surface"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Action Button & Summary */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-on-surface-variant text-center sm:text-left">
            <span>Selected: </span>
            <span className="font-bold text-on-surface">{selectedCount} Categories</span>
            <span> • </span>
            <span className="capitalize font-semibold text-secondary">{budgetTier} tier</span>
            <span> • </span>
            <span className="capitalize font-semibold text-on-surface">{travelStyle} vibe</span>
          </div>

          <button
            onClick={handleSave}
            disabled={loading || fetching}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-display font-bold text-sm shadow-sm hover:shadow-glow hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                <span>Synthesizing Profile...</span>
              </>
            ) : (
              <>
                <span>Complete Setup &amp; Launch Explorer</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 border-t border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-on-surface-variant">
        <span>© 2026 WanderAI. All rights reserved.</span>
        <span>You can adjust these preferences anytime inside your Travel Passport profile.</span>
      </footer>
    </div>
  );
}
