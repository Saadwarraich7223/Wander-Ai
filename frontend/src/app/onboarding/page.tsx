"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, placesApi, getErrorMessage } from "@/lib/api";
import { authStorage } from "@/lib/auth";

interface InterestCardItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  tags: string[];
}

const INTEREST_ITEMS: InterestCardItem[] = [
  {
    id: "historical",
    title: "Historical & Heritage",
    icon: "castle",
    description: "Forts, palaces, ancient ruins, and Mughal heritage monuments across Lahore, Rohtas, and Gilgit.",
    tags: ["Baltit & Altit", "Shahi Qila", "Harappa"],
  },
  {
    id: "nature",
    title: "Nature & Scenery",
    icon: "landscape",
    description: "Lakes, mountain peaks, terraced valleys, national parks, and turquoise glacial rivers.",
    tags: ["Hunza Valley", "Deosai", "Attabad Lake"],
  },
  {
    id: "adventure",
    title: "Adventure & Outdoors",
    icon: "hiking",
    description: "Trekking, high-altitude passes, suspension bridges, skiing, and rugged 4x4 off-road routes.",
    tags: ["Passu Cones", "K2 Basecamp", "Malam Jabba"],
  },
  {
    id: "food",
    title: "Food & Dining",
    icon: "restaurant",
    description: "Traditional street food, Shinwari Karahi, chapshuro pies, chai khanas, and regional culinary trails.",
    tags: ["Food Street", "Chapshuro", "Shinwari"],
  },
  {
    id: "religious",
    title: "Religious & Cultural",
    icon: "temple_buddhist",
    description: "Sufi shrines, historic mosques, Gandhara Buddhist stupas in Taxila, and Sikh gurdwaras.",
    tags: ["Badshahi Mosque", "Taxila", "Data Darbar"],
  },
  {
    id: "shopping",
    title: "Shopping & Bazaars",
    icon: "storefront",
    description: "Traditional heritage bazaars, hand-knotted woolen rugs, raw gemstone dealers, and dry fruit souks.",
    tags: ["Anarkali", "Gilgit Gems", "Namak Mandi"],
  },
];

interface BudgetOption {
  id: "value" | "balanced" | "luxury";
  symbol: string;
  title: string;
  description: string;
  price: string;
  badge?: string;
}

const BUDGET_OPTIONS: BudgetOption[] = [
  {
    id: "value",
    symbol: "$",
    title: "Backpacker & Value",
    description: "Youth hostels, regional transit & coasters, local mountain homestays.",
    price: "Est. $25–$50 / day",
  },
  {
    id: "balanced",
    symbol: "$$",
    title: "Balanced Explorer",
    description: "Boutique hotels, mid-scale lodges, rental 4WD with fuel optimization algorithms.",
    price: "Est. $90–$180 / day",
    badge: "Most Recommended for Northern Trails",
  },
  {
    id: "luxury",
    symbol: "$$$",
    title: "Luxury & Bespoke",
    description: "5-star Serena resorts, chauffeured Land Cruiser Prado, private mountain guides, aerial heli-transfers.",
    price: "Est. $350+ / day",
  },
];

interface StyleOption {
  id: "heritage" | "alpine" | "slow" | "mixed";
  icon: string;
  title: string;
  description: string;
  archetype: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: "heritage",
    icon: "history_edu",
    title: "Cultural Heritage",
    description: "Deep history, architectural immersion, museum archives.",
    archetype: "Cultural Heritage Archivist",
  },
  {
    id: "alpine",
    icon: "terrain",
    title: "Alpine Adventure",
    description: "High-altitude treks, technical terrain, off-road corridors.",
    archetype: "Alpine Cultural Voyager",
  },
  {
    id: "slow",
    icon: "self_improvement",
    title: "Slow & Relaxation",
    description: "Scenic wellness, lake retreats, panoramic balcony pacing.",
    archetype: "Slow Paced Mountain Retreatant",
  },
  {
    id: "mixed",
    icon: "tune",
    title: "Curated Mixed",
    description: "Dynamic blend synthesized by multi-model engine.",
    archetype: "Multi-Vector Explorer",
  },
];

export default function OnboardingPage() {
  const router = useRouter();

  // Selected State
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "historical",
    "nature",
    "adventure",
  ]);
  const [selectedBudget, setSelectedBudget] = useState<"value" | "balanced" | "luxury">("balanced");
  const [selectedStyle, setSelectedStyle] = useState<"heritage" | "alpine" | "slow" | "mixed">("alpine");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loggedUser = authStorage.getUser();
    setUser(loggedUser);
  }, []);

  // Metrics Calculations
  const count = selectedInterests.length;
  const fit = Math.min(99, Math.max(68, 65 + count * 6));
  const pois = 78 + count * 35;
  const strokeOffset = 125.6 - (125.6 * fit) / 100;

  const currentArchetype =
    STYLE_OPTIONS.find((s) => s.id === selectedStyle)?.archetype || "Alpine Cultural Voyager";

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = authStorage.getAccessToken();

      // If authenticated, sync with FastAPI backend
      if (token) {
        try {
          const preferencesPayload = selectedInterests.map((catId) => ({
            category_id: catId,
            preference_score: 0.85,
          }));

          if (preferencesPayload.length > 0) {
            await api.put("/users/me/preferences", { preferences: preferencesPayload });
          }
        } catch (prefErr) {
          console.warn("Could not sync remote preferences", prefErr);
        }

        try {
          await api.put("/users/me/profile", {
            preferred_budget: selectedBudget === "value" ? "budget" : selectedBudget === "luxury" ? "luxury" : "moderate",
            travel_style: selectedStyle,
          });
        } catch (profErr) {
          console.warn("Could not sync remote profile", profErr);
        }
      }

      // Cache locally
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "wander_onboarding_preferences",
          JSON.stringify({
            interests: selectedInterests,
            budget: selectedBudget,
            style: selectedStyle,
            fit,
            archetype: currentArchetype,
            timestamp: new Date().toISOString(),
          })
        );
      }

      router.push("/explore");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to complete calibration sequence. Please try again."));
      console.error("Onboarding submission failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background font-sans text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container min-h-screen flex flex-col justify-between">
      {/* Fixed Luxury Calibration Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/60">
        <div className="h-16 sm:h-20 max-w-[1440px] mx-auto px-4 md:px-8 lg:px-14 flex items-center justify-between gap-6">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 focus:outline-none">
            <span className="font-display font-bold text-xl sm:text-2xl tracking-tight text-on-surface">
              Wander<span className="text-secondary">AI</span>
            </span>
          </Link>

          {/* Center Calibration Progress Bar */}
          <div className="flex flex-col items-center justify-center flex-1 max-w-md mx-auto hidden sm:flex">
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                Calibration Sequence
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">
                Step 2 of 3
              </span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden flex">
              <div className="h-full w-2/3 bg-secondary rounded-full transition-all duration-500 ease-out" />
            </div>
            <div className="w-full flex justify-between items-center mt-1">
              <span className="text-[11px] text-on-surface-variant">Algorithmic Calibration</span>
              <span className="text-[11px] text-on-surface-variant opacity-60">67%</span>
            </div>
          </div>

          {/* Right Header Navigation Actions */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link
              className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors py-2 px-3 rounded-lg hover:bg-surface-container-high"
              href="/explore"
            >
              Save &amp; Exit
            </Link>

            <div className="h-4 w-px bg-outline-variant/60 hidden md:block" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-xs shadow-xs ring-1 ring-surface-container-high">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "WA"}
              </div>
              <span className="hidden lg:inline-block text-xs font-semibold text-on-surface">
                {user?.full_name || "Bespoke Member"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="w-full pt-20 sm:pt-24 bg-background min-h-[calc(100vh-5rem)] flex flex-col justify-between">
        <div className="flex flex-col w-full">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-14 py-8 sm:py-10 w-full space-y-8 sm:space-y-10">
            {/* Top Status & Hero Calibration Banner */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-surface-container-high">
              <div className="space-y-3 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low shadow-xs border border-surface-container-high">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-bold">
                    Cognitive Engine Initialization · v4.2
                  </span>
                  <span className="text-outline-variant text-[10px]">/</span>
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    Model B &amp; Model D Calibration
                  </span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight leading-tight">
                  What interests you most when traveling?
                </h1>

                <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl leading-relaxed">
                  Select your travel preferences so our AI recommendation engine can synthesize custom high-fidelity experiences, altitude-cleared corridors, and zero-violation itineraries tailored to your stamina and aesthetic.
                </p>
              </div>

              {/* Realtime Engine Calibration Circular Gauge Badge */}
              <div className="shrink-0 flex items-center gap-4 bg-surface-container-lowest p-3.5 sm:p-4 rounded-xl shadow-sm border border-surface-container-high">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
                    <circle
                      className="text-surface-container"
                      cx="24"
                      cy="24"
                      fill="transparent"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <circle
                      className="text-secondary transition-all duration-700 ease-out"
                      cx="24"
                      cy="24"
                      fill="transparent"
                      r="20"
                      stroke="currentColor"
                      strokeDasharray="125.6"
                      strokeDashoffset={strokeOffset}
                      strokeWidth="4"
                    />
                  </svg>
                  <span className="absolute font-display text-base font-bold text-on-surface">
                    {fit}%
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-on-surface">
                      {count} of 6 Selected
                    </span>
                  </div>
                  <span className="text-[11px] text-secondary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">insights</span>
                    <span>Affinity Synthesis Fit</span>
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Main Dynamic Layout Split (Left Input Canvas, Right Live HUD projection) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Primary Interactivity Column (8 cols) */}
              <div className="lg:col-span-8 space-y-8 sm:space-y-10">
                {/* SECTION 1: Interests & Vector Calibration */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                        Dimension 01
                      </span>
                      <h2 className="font-display text-lg sm:text-xl font-bold text-on-surface">
                        Travel Interests &amp; Vector Calibration
                      </h2>
                    </div>
                    <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container-high px-2.5 py-0.5 rounded-full">
                      Multi-select enabled
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {INTEREST_ITEMS.map((item) => {
                      const isSelected = selectedInterests.includes(item.id);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleInterest(item.id)}
                          className={`group text-left bg-surface-container-lowest rounded-xl p-4 sm:p-5 shadow-xs transition-all duration-300 relative flex flex-col justify-between cursor-pointer border-2 ${
                            isSelected
                              ? "border-secondary shadow-md bg-secondary-light/20"
                              : "border-transparent hover:border-surface-container-high hover:shadow-xs"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "bg-secondary text-white"
                                    : "bg-surface-container text-on-surface"
                                }`}
                              >
                                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                              </div>

                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "bg-secondary text-white"
                                    : "bg-surface-container text-on-surface-variant"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  {isSelected ? "check" : "add"}
                                </span>
                              </span>
                            </div>

                            <h3 className="font-display text-base font-bold text-on-surface mb-1">
                              {item.title}
                            </h3>
                            <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3 mb-4">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-auto">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* SECTION 2: Preferred Budget Tier */}
                <section className="space-y-4">
                  <div className="space-y-0.5">
                    <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                      Dimension 02
                    </span>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-on-surface">
                      Preferred Budget &amp; Pacing Tier
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      Calibrates accommodation standards, transit modes, and vehicle mountain clearance ratings.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {BUDGET_OPTIONS.map((tier) => {
                      const isSelected = selectedBudget === tier.id;

                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setSelectedBudget(tier.id)}
                          className={`text-left bg-surface-container-lowest rounded-xl p-4 sm:p-5 border-2 transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                            isSelected
                              ? "border-secondary shadow-md bg-secondary-light/10"
                              : "border-transparent hover:border-surface-container-high shadow-xs"
                          }`}
                        >
                          {tier.badge && (
                            <div className="absolute -top-3 left-4 bg-secondary text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider shadow-xs">
                              {tier.badge}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`font-display text-lg font-bold ${
                                  isSelected ? "text-secondary" : "text-on-surface"
                                }`}
                              >
                                {tier.symbol}
                              </span>

                              <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  isSelected
                                    ? "border-secondary bg-secondary"
                                    : "border-outline-variant"
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-surface-container-lowest" />
                                )}
                              </div>
                            </div>

                            <h3 className="font-display text-sm sm:text-base font-bold text-on-surface">
                              {tier.title}
                            </h3>
                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                              {tier.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between">
                            <span className="text-xs text-on-surface font-bold">
                              {tier.price.split("/")[0]}
                            </span>
                            <span className="text-[10px] text-on-surface-variant font-medium">
                              / day
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* SECTION 3: Primary Travel Mode */}
                <section className="space-y-4">
                  <div className="space-y-0.5">
                    <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                      Dimension 03
                    </span>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-on-surface">
                      Primary Travel Mode
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {STYLE_OPTIONS.map((style) => {
                      const isSelected = selectedStyle === style.id;

                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setSelectedStyle(style.id)}
                          className={`text-left p-4 rounded-xl bg-surface-container-lowest border-2 transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "border-secondary shadow-md bg-secondary-light/10"
                              : "border-transparent hover:border-surface-container-high shadow-xs"
                          }`}
                        >
                          <span className="material-symbols-outlined text-secondary mb-2 block text-2xl">
                            {style.icon}
                          </span>
                          <div className="font-display text-sm font-bold text-on-surface leading-tight">
                            {style.title}
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                            {style.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* Right HUD / Dynamic AI Persona Live Projection (4 cols) */}
              <aside className="lg:col-span-4 space-y-4 sticky top-24">
                {/* Live Persona Projection Card */}
                <div className="bg-surface-container-lowest rounded-2xl shadow-luxury border border-surface-container-high overflow-hidden">
                  {/* Visual Header with Inspiration Aesthetic */}
                  <div className="relative h-44 w-full bg-surface-container overflow-hidden">
                    <div
                      className="bg-cover bg-center w-full h-full transform scale-105 transition-transform duration-700 hover:scale-100"
                      style={{
                        backgroundImage:
                          "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDnr0msXewYM6XF4n9MePuUM5AAEDIcwdxxHJz0lQbdlfNNZP0HvjqFFXByBQqLEOe2GPpGtuWbN-8ekLFAypp-fbYsTHVUZ55aFEHKI2HDMMY4iQ5F3jWHICpr76oysyzetnqLcNnu9PQ-G0aVJqX8I7ah572YPD_bNuuO5h1hxjbZdKg3zahihEjbWwFZdIzei1hufUPOR_ExHg_ntPzn8bYLEV8qs4zQHioux9h80gZPRPpCo--2Qg')",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-secondary flex items-center gap-1 shadow-xs">
                        <span className="material-symbols-outlined text-[13px]">bolt</span>
                        <span>Vector Live</span>
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <span className="text-[10px] uppercase tracking-wider text-white/80 font-semibold">
                        Calibrated Archetype
                      </span>
                      <div className="font-display text-lg font-bold leading-tight drop-shadow-sm">
                        {currentArchetype}
                      </div>
                    </div>
                  </div>

                  {/* Persona Details & Dynamic Diagnostics */}
                  <div className="p-4 sm:p-5 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-on-surface-variant text-xs">
                        <span>Model Confidence</span>
                        <span className="font-bold text-on-surface">{fit}.4% Match</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-full transition-all duration-500"
                          style={{ width: `${fit}%` }}
                        />
                      </div>
                    </div>

                    {/* Archetype Badges */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                        Engine Hyperparameters
                      </span>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low text-on-surface text-xs">
                          <span className="text-on-surface-variant flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-secondary">explore</span>
                            <span>Primary Corridor</span>
                          </span>
                          <span className="font-bold">Karakoram &amp; Hunza</span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low text-on-surface text-xs">
                          <span className="text-on-surface-variant flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-secondary">shield</span>
                            <span>Altitude Pacing</span>
                          </span>
                          <span className="font-bold">Gradual Acclimatization</span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low text-on-surface text-xs">
                          <span className="text-on-surface-variant flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-secondary">car_tag</span>
                            <span>Vehicle Clearance</span>
                          </span>
                          <span className="font-bold">
                            {selectedBudget === "luxury" ? "Luxury 4x4 Prado" : "Standard High 4x4"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tailored POI Count Indicator */}
                    <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">pin_drop</span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-sm font-bold text-on-surface truncate">
                          <span>{pois}</span> Tailored POIs Found
                        </div>
                        <p className="text-[11px] text-on-surface-variant">
                          Validated against seasonal pass closures
                        </p>
                      </div>
                    </div>

                    <div className="pt-1 text-center">
                      <span className="text-[11px] text-secondary font-semibold flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">verified_user</span>
                        <span>100% Zero-Violation Itinerary Guarantee</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Curated Mountain Corridors Hint */}
                <div className="p-4 rounded-xl bg-surface-container-low text-on-surface-variant border border-surface-container-high space-y-1.5">
                  <div className="flex items-center gap-1.5 text-on-surface font-bold text-xs">
                    <span className="material-symbols-outlined text-secondary text-sm">info</span>
                    <span>Algorithmic Restraint Notice</span>
                  </div>
                  <p className="text-xs leading-relaxed text-on-surface-variant">
                    Northern routes (Khunjerab, Babusar, Shandur) automatically enforce altitude ceilings and daylight transit rules to maintain strict expedition safety.
                  </p>
                </div>
              </aside>
            </div>

            {/* Sticky Bottom Execution Bar */}
            <footer className="pt-6 sm:pt-8 pb-4 border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <Link
                  className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors py-2 px-3 rounded-lg hover:bg-surface-container-low"
                  href="/explore"
                >
                  Skip for now (use default balanced profile)
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <div className="text-right hidden md:block">
                  <div className="text-xs text-on-surface font-bold">Deterministic Constraint Engine</div>
                  <div className="text-[11px] text-on-surface-variant">
                    Weights can be adjusted anytime in Account Settings
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-display text-sm font-bold px-6 py-3.5 rounded-xl hover:bg-primary-container transition-all transform active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                      <span>Calibrating Engine...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Setup &amp; Launch Dashboard</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </footer>
          </div>
        </div>

        {/* Bottom Micro Footer */}
        <footer className="w-full bg-surface-container-low py-4 mt-8 border-t border-surface-container-high/40 shadow-[0_-1px_6px_rgba(0,0,0,0.02)]">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-14 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-on-surface-variant">
            <span>© 2026 WanderAI Concierge Inc. Secure Algorithmic Onboarding.</span>
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:text-on-surface transition-colors">
                Privacy Notice
              </Link>
              <span>·</span>
              <Link href="#" className="hover:text-on-surface transition-colors">
                Concierge Support
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
