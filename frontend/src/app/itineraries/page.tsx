"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { CURATED_ITINERARIES } from "@/lib/itinerariesData";

type DurationFilter = "all" | "weekend" | "traverse" | "grand";
type RegionFilter =
  | "all"
  | "Gilgit-Baltistan"
  | "Khyber Pakhtunkhwa"
  | "Punjab"
  | "Azad Kashmir"
  | "Balochistan";
type SortOption = "recommended" | "duration_asc" | "duration_desc" | "budget_asc" | "elevation_desc";
type ClearanceFilter = "all" | "paved" | "4x4";
type ViewMode = "grid" | "atlas";

export default function ItinerariesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [durationFilter, setDurationFilter] = useState<DurationFilter>("all");
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [clearanceFilter, setClearanceFilter] = useState<ClearanceFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCompareSlugs, setSelectedCompareSlugs] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener for Search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter and Sort Logic
  const filteredItineraries = useMemo(() => {
    let result = CURATED_ITINERARIES.filter((item) => {
      // Duration filter
      if (durationFilter === "weekend" && (item.durationDays < 2 || item.durationDays > 3)) return false;
      if (durationFilter === "traverse" && (item.durationDays < 4 || item.durationDays > 5)) return false;
      if (durationFilter === "grand" && item.durationDays < 6) return false;

      // Region filter
      if (regionFilter !== "all" && item.region !== regionFilter) return false;

      // Clearance filter
      if (clearanceFilter === "paved" && item.vehicleAccess === "suv_4x4") return false;
      if (clearanceFilter === "4x4" && item.vehicleAccess !== "suv_4x4") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.primaryCity.toLowerCase().includes(q) ||
          item.region.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          (item.corridorName && item.corridorName.toLowerCase().includes(q))
        );
      }

      return true;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === "duration_asc") return a.durationDays - b.durationDays;
      if (sortBy === "duration_desc") return b.durationDays - a.durationDays;
      if (sortBy === "budget_asc") return a.estimatedBudgetPKR.moderate - b.estimatedBudgetPKR.moderate;
      if (sortBy === "elevation_desc") {
        const getAltitude = (str: string) => {
          const match = str.match(/(\d[\d,]+)m/);
          return match ? parseInt(match[1].replace(/,/g, ""), 10) : 0;
        };
        return getAltitude(b.elevationRangeMeters) - getAltitude(a.elevationRangeMeters);
      }
      return 0; // Default: recommended
    });

    return result;
  }, [durationFilter, regionFilter, clearanceFilter, searchQuery, sortBy]);

  // Comparison Handlers
  const toggleCompare = (slug: string) => {
    setSelectedCompareSlugs((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, slug];
    });
  };

  const clearComparison = () => {
    setSelectedCompareSlugs([]);
  };

  const comparedItineraries = useMemo(() => {
    return CURATED_ITINERARIES.filter((item) => selectedCompareSlugs.includes(item.slug));
  }, [selectedCompareSlugs]);

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface antialiased flex flex-col relative overflow-hidden selection:bg-secondary/20 selection:text-secondary">
      {/* Seamless Ambient Gradient Background Starting from the Very Top */}
      <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-32 top-24 w-[420px] h-[420px] rounded-full bg-tertiary-fixed/20 blur-3xl pointer-events-none" />

      {/* Shared Application Navbar */}
      <Navbar />

      {/* Main Content Body */}
      <main className="w-full pt-20 sm:pt-24 pb-12 sm:pb-16 relative z-10 flex-1">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-6 sm:space-y-8">
          {/* HERO HEADER & FILTER BAR (Matches Recommendations/Places page pattern) */}
          <div className="pt-2 sm:pt-4 pb-6 border-b border-outline-variant/60 mb-6 sm:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-3xl">
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-on-surface">
                  Pakistan Travel Itineraries &amp;
                  <span className="block text-secondary">Alpine Expedition Blueprints</span>
                </h1>
                <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed max-w-2xl">
                  Expert-crafted multi-day road trips across Gilgit-Baltistan, Khyber Pakhtunkhwa, Punjab, and Azad Kashmir. Open any blueprint directly into the AI Planner to personalize dates, budgets, and vehicle clearance in 1 click.
                </p>
              </div>

              {/* Duration Filter Pills (Matching Model lens filtering pill bar) */}
              <div className="flex items-center bg-surface-container-high/70 p-1.5 rounded-xl border border-outline-variant overflow-x-auto scrollbar-none gap-1.5">
                {[
                  { id: "all", name: "All Durations", badge: "42 Routes" },
                  { id: "weekend", name: "2–3 Days", badge: "Weekend" },
                  { id: "traverse", name: "4–5 Days", badge: "Traverse" },
                  { id: "grand", name: "6+ Days", badge: "Grand" },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDurationFilter(d.id as DurationFilter)}
                    className={`px-3.5 py-2 rounded-lg font-display text-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      durationFilter === d.id
                        ? "bg-surface-container-lowest font-bold text-on-surface shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface font-medium"
                    }`}
                    type="button"
                  >
                    <span>{d.name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                        durationFilter === d.id
                          ? "bg-secondary-container text-on-secondary-container"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {d.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Search & Region Controls Ribbon */}
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1 max-w-xl">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
                  search
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search itineraries, valleys, mountain passes, cultural circuits..."
                  className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-on-surface placeholder:text-on-surface-variant/70 text-xs sm:text-sm outline-none transition-all shadow-xs"
                />
                <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant text-[10px] font-mono font-semibold border border-outline-variant/50">
                  ⌘K
                </kbd>
              </div>

              {/* View Switcher */}
              <div className="hidden sm:flex items-center p-1 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-surface-container text-on-surface font-bold shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">grid_view</span>
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("atlas")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === "atlas"
                      ? "bg-surface-container text-on-surface font-bold shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">map</span>
                  <span>Atlas</span>
                </button>
              </div>
            </div>

            {/* Region Filter Buttons + Sort & Clearance Selectors */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-on-surface-variant font-mono font-medium">Region:</span>
                <button
                  type="button"
                  onClick={() => setRegionFilter("all")}
                  className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                    regionFilter === "all"
                      ? "bg-secondary text-white shadow-xs font-bold"
                      : "bg-surface-container-lowest border border-outline-variant/60 text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  All Regions
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter("Gilgit-Baltistan")}
                  className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                    regionFilter === "Gilgit-Baltistan"
                      ? "bg-secondary text-white shadow-xs font-bold"
                      : "bg-surface-container-lowest border border-outline-variant/60 text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Gilgit-Baltistan
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter("Khyber Pakhtunkhwa")}
                  className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                    regionFilter === "Khyber Pakhtunkhwa"
                      ? "bg-secondary text-white shadow-xs font-bold"
                      : "bg-surface-container-lowest border border-outline-variant/60 text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Khyber Pakhtunkhwa
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter("Punjab")}
                  className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                    regionFilter === "Punjab"
                      ? "bg-secondary text-white shadow-xs font-bold"
                      : "bg-surface-container-lowest border border-outline-variant/60 text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Punjab
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter("Azad Kashmir")}
                  className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                    regionFilter === "Azad Kashmir"
                      ? "bg-secondary text-white shadow-xs font-bold"
                      : "bg-surface-container-lowest border border-outline-variant/60 text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Azad Kashmir
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter("Balochistan")}
                  className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                    regionFilter === "Balochistan"
                      ? "bg-secondary text-white shadow-xs font-bold"
                      : "bg-surface-container-lowest border border-outline-variant/60 text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Balochistan
                </button>
              </div>

              {/* Sort & Clearance */}
              <div className="flex items-center gap-3 ml-auto text-on-surface-variant">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-secondary">tune</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-2.5 py-1 text-on-surface font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="recommended">Sort: Recommended</option>
                    <option value="duration_asc">Duration: Shortest First</option>
                    <option value="duration_desc">Duration: Longest First</option>
                    <option value="budget_asc">Budget: Economical First</option>
                    <option value="elevation_desc">Altitude: High to Low</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-secondary">directions_car</span>
                  <select
                    value={clearanceFilter}
                    onChange={(e) => setClearanceFilter(e.target.value as ClearanceFilter)}
                    className="bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-2.5 py-1 text-on-surface font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="all">Vehicle: All Types</option>
                    <option value="paved">Sedan / Paved Friendly</option>
                    <option value="4x4">4x4 Jeep Required</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Curated Itineraries Section */}
          <section className="pt-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface">
                  Curated Itineraries
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-mono text-xs font-semibold">
                  {filteredItineraries.length} Route{filteredItineraries.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="text-on-surface-variant text-xs hidden sm:block">
                Open any blueprint to view day-by-day itineraries or personalize with AI Planner.
              </div>
            </div>

            {filteredItineraries.length === 0 ? (
              <div className="py-16 bg-surface-container-lowest border border-outline-variant/60 rounded-3xl text-center p-8 space-y-3">
                <span className="material-symbols-outlined text-4xl text-outline">explore_off</span>
                <h3 className="font-display text-lg font-bold text-on-surface">No itineraries found</h3>
                <p className="text-xs text-on-surface-variant">Try resetting filters or adjusting your search query.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setDurationFilter("all");
                    setRegionFilter("all");
                    setClearanceFilter("all");
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-secondary text-white text-xs font-semibold hover:bg-secondary-dark transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* CLEAN GRID CARDS */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItineraries.map((itinerary) => {
                  const plannerUrl = `/planner?destination=${encodeURIComponent(
                    itinerary.plannerParams.destination
                  )}&origin=${encodeURIComponent(itinerary.plannerParams.origin)}&days=${
                    itinerary.plannerParams.days
                  }&budget=${itinerary.plannerParams.budget}&pace=${itinerary.plannerParams.pace}&travel_style=${
                    itinerary.plannerParams.travelStyle
                  }`;

                  const isCompared = selectedCompareSlugs.includes(itinerary.slug);

                  return (
                    <article
                      key={itinerary.slug}
                      className="group flex flex-col rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle hover:shadow-elevated transition-all duration-300 overflow-hidden h-full justify-between"
                    >
                      {/* Image + Badges */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
                        <Link href={`/itineraries/${itinerary.slug}`} prefetch={true} className="block w-full h-full">
                          <img
                            src={itinerary.heroImage}
                            alt={itinerary.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </Link>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                        {/* Top Left Duration & Region Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                          <span className="px-2.5 py-1 rounded-md bg-secondary text-white font-mono text-[11px] font-bold shadow-xs">
                            {itinerary.durationDays} Days / {itinerary.durationDays - 1} Nights
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-md text-on-surface font-semibold text-[11px] shadow-xs">
                            {itinerary.region}
                          </span>
                        </div>

                        {/* Compare Toggle Button */}
                        <button
                          type="button"
                          onClick={() => toggleCompare(itinerary.slug)}
                          title={isCompared ? "Remove from Compare" : "Add to Compare"}
                          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                            isCompared
                              ? "bg-secondary text-white"
                              : "bg-white/80 hover:bg-white text-on-surface"
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">
                            {isCompared ? "check" : "compare_arrows"}
                          </span>
                        </button>
                      </div>

                      {/* Content Area */}
                      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                        <div className="space-y-2">
                          <Link href={`/itineraries/${itinerary.slug}`} prefetch={true} className="block">
                            <h3 className="font-display text-base sm:text-lg font-bold text-on-surface group-hover:text-secondary transition-colors line-clamp-1 leading-snug">
                              {itinerary.title}
                            </h3>
                          </Link>

                          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                            {itinerary.summary}
                          </p>

                          {/* Quick Spec Chips */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[11px] font-mono flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-secondary">altitude</span>
                              {itinerary.elevationRangeMeters}
                            </span>

                            <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[11px] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-secondary">
                                {itinerary.vehicleAccess === "suv_4x4" ? "minor_crash" : "directions_car"}
                              </span>
                              {itinerary.vehicleAccess === "suv_4x4" ? "4x4 Jeep" : "Sedan Friendly"}
                            </span>

                            <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[11px] capitalize">
                              {itinerary.gradeLabel || itinerary.activityLevel}
                            </span>
                          </div>
                        </div>

                        {/* Pricing & Clean Action Buttons */}
                        <div className="pt-3 border-t border-outline-variant/50 space-y-3">
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs text-on-surface-variant">Est. Budget:</span>
                            <span className="font-display text-sm sm:text-base font-bold text-secondary">
                              PKR {itinerary.estimatedBudgetPKR.moderate.toLocaleString()}
                              <span className="text-[11px] font-normal text-on-surface-variant"> / person</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Link
                              href={`/itineraries/${itinerary.slug}`}
                              prefetch={true}
                              className="py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors text-center"
                            >
                              Explore Trip
                            </Link>

                            <Link
                              href={plannerUrl}
                              prefetch={true}
                              className="py-2 px-3 rounded-xl bg-secondary text-white text-xs font-semibold hover:bg-secondary-dark transition-all flex items-center justify-center gap-1 text-center shadow-xs"
                            >
                              <span className="material-symbols-outlined text-sm">auto_awesome</span>
                              <span>Plan with AI</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* ROUTE ATLAS VIEW */
              <div className="space-y-4">
                {filteredItineraries.map((itinerary) => {
                  const plannerUrl = `/planner?destination=${encodeURIComponent(
                    itinerary.plannerParams.destination
                  )}&origin=${encodeURIComponent(itinerary.plannerParams.origin)}&days=${
                    itinerary.plannerParams.days
                  }&budget=${itinerary.plannerParams.budget}&pace=${itinerary.plannerParams.pace}&travel_style=${
                    itinerary.plannerParams.travelStyle
                  }`;

                  return (
                    <div
                      key={itinerary.slug}
                      className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle hover:shadow-elevated transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={itinerary.heroImage}
                          alt={itinerary.title}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 border border-outline-variant/60"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-secondary text-white text-[10px] font-mono font-bold">
                              {itinerary.durationDays} Days
                            </span>
                            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[10px] font-semibold">
                              {itinerary.region}
                            </span>
                            <span className="text-xs text-on-surface-variant font-mono">
                              Altitude: {itinerary.elevationRangeMeters}
                            </span>
                          </div>
                          <h3 className="font-display text-base font-bold text-on-surface">
                            {itinerary.title}
                          </h3>
                          <p className="text-xs text-on-surface-variant line-clamp-2 max-w-2xl">
                            {itinerary.summary}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-3 w-full md:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-outline-variant/50">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-on-surface-variant uppercase block font-mono">Est. Budget</span>
                          <span className="font-display text-sm sm:text-base font-bold text-secondary">
                            PKR {itinerary.estimatedBudgetPKR.moderate.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/itineraries/${itinerary.slug}`}
                            prefetch={true}
                            className="px-3.5 py-1.5 rounded-xl bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors"
                          >
                            Explore Trip
                          </Link>
                          <Link
                            href={plannerUrl}
                            prefetch={true}
                            className="px-3.5 py-1.5 rounded-xl bg-secondary text-white text-xs font-semibold hover:bg-secondary-dark transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">auto_awesome</span>
                            <span>Plan</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Interactive Elevation & Pass Profile Visualizer Module */}
          <section className="pt-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono font-bold text-secondary uppercase tracking-wider">
                    Elevation Profile
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-on-surface">
                    Comparative Topographical Cross-Section
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant">
                    Altitude gradients and climb variations across major Pakistan highway corridors.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-1.5 bg-secondary rounded-full" /> Karakoram N-35
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-1.5 bg-[#FDBA4F] rounded-full" /> Deosai Alpine Pass
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-1.5 bg-[#B17909] rounded-full" /> Makran N-10
                  </span>
                </div>
              </div>

              {/* SVG Topography / Elevation Chart */}
              <div className="w-full h-48 sm:h-64 relative bg-surface-container-low border border-outline-variant/60 rounded-2xl p-4 overflow-hidden flex items-end">
                <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1000 240">
                  {/* Grid lines */}
                  <line className="text-outline-variant/40" stroke="currentColor" strokeDasharray="4 4" x1="0" x2="1000" y1="40" y2="40" />
                  <line className="text-outline-variant/40" stroke="currentColor" strokeDasharray="4 4" x1="0" x2="1000" y1="100" y2="100" />
                  <line className="text-outline-variant/40" stroke="currentColor" strokeDasharray="4 4" x1="0" x2="1000" y1="160" y2="160" />
                  <line className="text-outline-variant/60" stroke="currentColor" x1="0" x2="1000" y1="220" y2="220" />

                  {/* Labels */}
                  <text className="fill-current text-on-surface-variant font-mono text-[10px]" x="10" y="35">
                    4,800m (Khunjerab / Babusar)
                  </text>
                  <text className="fill-current text-on-surface-variant font-mono text-[10px]" x="10" y="95">
                    3,500m (Deosai Plateau)
                  </text>
                  <text className="fill-current text-on-surface-variant font-mono text-[10px]" x="10" y="155">
                    2,000m (Hunza / Kalam)
                  </text>
                  <text className="fill-current text-on-surface-variant font-mono text-[10px]" x="10" y="215">
                    Sea Level (Makran / Karachi)
                  </text>

                  {/* Gradient Area: Karakoram Express */}
                  <path d="M 0 200 Q 150 180, 300 130 T 600 70 T 800 25 T 1000 80 L 1000 220 L 0 220 Z" fill="rgba(24, 106, 87, 0.12)" />
                  <path d="M 0 200 Q 150 180, 300 130 T 600 70 T 800 25 T 1000 80" stroke="#186a57" strokeWidth="2.5" />

                  {/* Path: Deosai High Plateau */}
                  <path d="M 0 210 Q 200 190, 400 140 T 700 45 T 850 48 T 1000 120" stroke="#fdba4f" strokeDasharray="6 3" strokeWidth="2.5" />

                  {/* Path: Makran Coastal */}
                  <path d="M 0 218 C 300 218, 500 210, 700 215 C 850 217, 950 212, 1000 218" stroke="#b17909" strokeWidth="2.5" />
                </svg>
              </div>

              {/* Specs Footer Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60">
                  <span className="text-[11px] font-mono text-secondary font-bold uppercase block">
                    Max Climb Segment
                  </span>
                  <div className="font-display text-base font-bold text-on-surface mt-0.5">+2,293m in 95km</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">Sost to Khunjerab Frontier Gate</div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60">
                  <span className="text-[11px] font-mono text-secondary font-bold uppercase block">
                    Acclimatization Buffer
                  </span>
                  <div className="font-display text-base font-bold text-on-surface mt-0.5">24h Recommended</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">Stopover at Gilgit or Skardu town</div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60">
                  <span className="text-[11px] font-mono text-secondary font-bold uppercase block">
                    Fuel Station Safe Margin
                  </span>
                  <div className="font-display text-base font-bold text-on-surface mt-0.5">190km Range</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">Verified PSO and Shell depots on route</div>
                </div>
              </div>
            </div>
          </section>

          {/* Bespoke AI Synthesis Banner Section */}
          <section className="pt-6 pb-4">
            <div className="relative overflow-hidden rounded-3xl bg-primary text-on-primary p-8 sm:p-12 md:p-14 shadow-elevated">
              {/* Abstract Glow Elements */}
              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-secondary/30 blur-3xl pointer-events-none" />
              <div className="absolute top-0 right-1/4 w-60 h-60 rounded-full bg-tertiary-fixed-dim/20 blur-2xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-highest/20 text-tertiary-fixed-dim text-xs font-mono font-semibold">
                  <span className="material-symbols-outlined text-sm">psychology</span>
                  <span>AI Route Planner</span>
                </div>
                <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  Synthesize a Bespoke Expedition in Seconds
                </h2>
                <p className="text-xs sm:text-base text-inverse-primary leading-relaxed">
                  Need a trip customized for elderly family members, extreme trekking clearances, or seasonal fruit blossom timings? Let WanderAI calculate your exact waypoint schedule, fuel costs, and boutique hotels.
                </p>
                <div className="pt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href="/planner"
                    prefetch={true}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-secondary text-white font-display text-sm font-bold hover:bg-secondary-dark transition-all shadow-glow"
                  >
                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                    <span>Launch AI Trip Planner</span>
                  </Link>
                  <Link
                    href="/assistant"
                    prefetch={true}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-display text-sm font-semibold transition-all border border-white/20"
                  >
                    <span>Chat with AI Assistant</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Floating Blueprint Comparison Dock / Bar */}
        <aside
          className={`fixed bottom-6 inset-x-4 max-w-3xl mx-auto z-50 bg-primary text-on-primary rounded-2xl shadow-elevated border border-outline-variant/40 p-4 flex items-center justify-between gap-4 transition-transform duration-300 ${
            selectedCompareSlugs.length > 0 ? "translate-y-0" : "translate-y-36 pointer-events-none"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center text-secondary-container shrink-0">
              <span className="material-symbols-outlined text-xl">compare</span>
            </div>
            <div>
              <div className="font-display text-sm font-bold text-white">
                {selectedCompareSlugs.length} Itinerar{selectedCompareSlugs.length > 1 ? "ies" : "y"} Selected
              </div>
              <div className="text-xs text-inverse-primary font-mono hidden sm:block">
                Compare terrain profiles, altitude gradients & budgets
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearComparison}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-inverse-primary hover:text-white transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsCompareModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-secondary-dark shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Compare Now</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </aside>

        {/* Comparison Modal */}
        {isCompareModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface rounded-3xl border border-outline-variant/60 shadow-elevated max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-on-surface">
                    Side-by-Side Route Comparison
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Compare altitude, vehicle requirements, and estimated costs
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCompareModalOpen(false)}
                  className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {comparedItineraries.map((itinerary) => {
                  const plannerUrl = `/planner?destination=${encodeURIComponent(
                    itinerary.plannerParams.destination
                  )}&origin=${encodeURIComponent(itinerary.plannerParams.origin)}&days=${
                    itinerary.plannerParams.days
                  }&budget=${itinerary.plannerParams.budget}&pace=${itinerary.plannerParams.pace}&travel_style=${
                    itinerary.plannerParams.travelStyle
                  }`;

                  return (
                    <div
                      key={itinerary.slug}
                      className="rounded-2xl bg-surface-container-lowest border border-outline-variant/60 p-4 flex flex-col justify-between space-y-4 shadow-subtle"
                    >
                      <div className="space-y-3">
                        <img
                          src={itinerary.heroImage}
                          alt={itinerary.title}
                          className="w-full h-36 rounded-xl object-cover"
                        />
                        <div>
                          <span className="text-[10px] font-mono uppercase text-secondary font-bold">
                            {itinerary.region}
                          </span>
                          <h4 className="font-display text-base font-bold text-on-surface line-clamp-2">
                            {itinerary.title}
                          </h4>
                        </div>

                        <div className="space-y-2 text-xs font-mono divide-y divide-outline-variant/40 pt-1">
                          <div className="flex justify-between py-1">
                            <span className="text-on-surface-variant">Duration:</span>
                            <span className="font-bold text-on-surface">{itinerary.durationDays} Days</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-on-surface-variant">Max Altitude:</span>
                            <span className="font-bold text-on-surface">{itinerary.elevationRangeMeters}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-on-surface-variant">Clearance:</span>
                            <span className="font-bold text-on-surface capitalize">
                              {itinerary.vehicleAccess === "suv_4x4" ? "4x4 Jeep" : "Sedan / Paved"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-on-surface-variant">Moderate Budget:</span>
                            <span className="font-bold text-on-surface">
                              PKR {itinerary.estimatedBudgetPKR.moderate.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-outline-variant/50">
                        <Link
                          href={`/itineraries/${itinerary.slug}`}
                          prefetch={true}
                          className="w-full block py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold text-center transition-colors"
                        >
                          Explore Trip
                        </Link>
                        <Link
                          href={plannerUrl}
                          prefetch={true}
                          className="w-full block py-2 rounded-xl bg-secondary hover:bg-secondary-dark text-white text-xs font-semibold text-center transition-all shadow-xs"
                        >
                          Open in AI Planner
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Shared Application Footer */}
      <footer className="w-full bg-surface-container-low py-12 sm:py-16 border-t border-outline-variant/40 relative z-10">
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
                <Link
                  className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                  href="/itineraries"
                >
                  Curated Itineraries
                </Link>
                <Link
                  className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                  href="/places"
                >
                  Regional Guides
                </Link>
                <Link
                  className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                  href="/explore#map"
                >
                  Interactive Waypoints
                </Link>
                <Link
                  className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                  href="/recommendations"
                >
                  AI Recommendations
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                AI Tools
              </span>
              <div className="flex flex-col gap-2">
                <Link
                  className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                  href="/planner"
                >
                  Smart Itinerary Synthesizer
                </Link>
                <Link
                  className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                  href="/trips"
                >
                  Saved Journeys
                </Link>
                <Link
                  className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                  href="/explore"
                >
                  Elevation &amp; Climate Strip
                </Link>
                <Link
                  className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                  href="/assistant"
                >
                  AI Concierge Assistant
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
              <Link
                className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                href="#"
              >
                Privacy Policy
              </Link>
              <Link
                className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                href="#"
              >
                Terms of Service
              </Link>
              <Link
                className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                href="#"
              >
                Security Architecture
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
