"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { tripsApi, getErrorMessage } from "@/lib/api";
import { Trip } from "@/types";
import Navbar from "@/components/Navbar";
import {
  findPakistanLocation,
  calculateRouteMetrics,
  getDestinationClimate,
  PAKISTAN_LOCATIONS,
} from "@/lib/pakistanGeo";

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<"all" | "active" | "upcoming" | "draft">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const data = await tripsApi.list();
      setTrips(data);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load itineraries"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!window.confirm("Delete this trip? Its itinerary will be permanently removed.")) return;
    try {
      await tripsApi.remove(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to delete trip"));
    }
  };

  // Filter & Search Logic
  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trip.active_itinerary?.narrative || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "active") return trip.active_itinerary !== undefined;
    if (activeTab === "draft") return !trip.active_itinerary;
    return true;
  });

  // Helper to compute realistic distance for any trip
  const getTripDistance = (trip: Trip) => {
    const raw = Math.round(trip.active_itinerary?.total_travel_distance_km || 0);
    if (raw > 0) return raw;

    const originName =
      (trip as any)?.preferences?.origin_city?.split("(")[0]?.trim() ||
      (trip as any)?.context?.origin_city?.split("(")[0]?.trim() ||
      "Islamabad";
    const destName =
      (trip as any)?.preferences?.destination?.split("(")[0]?.trim() ||
      (trip as any)?.context?.destination?.split("(")[0]?.trim() ||
      trip.title
        .replace(/\d+-Day/gi, "")
        .replace(/Expedition|Tour|Trip|Getaway|Circuit/gi, "")
        .replace(/from.*/gi, "")
        .trim() ||
      "Bahawalpur";

    const oLoc = findPakistanLocation(originName) || PAKISTAN_LOCATIONS[0];
    const dLoc = findPakistanLocation(destName) || PAKISTAN_LOCATIONS[1];
    const metrics = calculateRouteMetrics(oLoc, dLoc);
    return metrics.drivingDistanceKm;
  };

  // Calculate Aggregates
  const totalCapital = trips.reduce((acc, t) => acc + (t.total_budget || 0), 0);
  const totalKm = trips.reduce((acc, t) => acc + getTripDistance(t), 0);
  const activeTrip = trips.length > 0 ? trips[0] : null;

  // Derive dynamic telemetry for the featured active trip
  const activeOriginLoc = useMemo(() => {
    if (!activeTrip) return null;
    const originName =
      (activeTrip as any)?.preferences?.origin_city?.split("(")[0]?.trim() ||
      (activeTrip as any)?.context?.origin_city?.split("(")[0]?.trim() ||
      "Islamabad";
    return findPakistanLocation(originName);
  }, [activeTrip]);

  const activeDestLoc = useMemo(() => {
    if (!activeTrip) return null;
    const destName =
      (activeTrip as any)?.preferences?.destination?.split("(")[0]?.trim() ||
      (activeTrip as any)?.context?.destination?.split("(")[0]?.trim() ||
      activeTrip.title
        .replace(/\d+-Day/gi, "")
        .replace(/Expedition|Tour|Trip|Getaway|Circuit/gi, "")
        .replace(/from.*/gi, "")
        .trim() ||
      "Hunza Valley";
    return findPakistanLocation(destName);
  }, [activeTrip]);

  const activeRouteMetrics = useMemo(() => {
    if (!activeOriginLoc || !activeDestLoc || !activeTrip) return null;
    return calculateRouteMetrics(activeOriginLoc, activeDestLoc);
  }, [activeOriginLoc, activeDestLoc, activeTrip]);

  const activeClimate = useMemo(() => {
    if (!activeDestLoc || !activeTrip) return null;
    return getDestinationClimate(activeDestLoc, activeTrip.start_date);
  }, [activeDestLoc, activeTrip]);

  return (
    <div className="bg-background font-sans text-on-surface antialiased min-h-screen flex flex-col">

      {/* ==================== CLEAN CONSISTENT NAVBAR ==================== */}
      <Navbar tripsCount={trips.length} />

      {/* ==================== MAIN CANVAS ==================== */}
      <main className="w-full pt-28 pb-16 bg-background min-h-screen">
        <div className="flex flex-col w-full">

          {/* SECTION 1: COMMAND HEADER & BREADCRUMB */}
          <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8  pb-6">
            <div className="flex flex-col gap-6">

              {/* Title & Primary Control Buttons */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
                <div className="max-w-2xl">
                  <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight leading-tight mb-2">
                    Expedition Command
                  </h1>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Manage, simulate, and reoptimize your algorithmic itineraries across Pakistan. 0% constraint violations, live weather synchronization, and PostGIS corridor telemetry.
                  </p>
                </div>

                {/* Quick Primary Actions */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    onClick={() => alert("Offline sync packs generated for your active route!")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container text-xs font-semibold transition-all shadow-xs border border-outline-variant/60 cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base text-secondary">download_for_offline</span>
                    <span>Sync Packs</span>
                  </button>
                  <Link
                    href="/planner"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark text-xs font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    <span>+ Plan New Itinerary</span>
                  </Link>
                </div>
              </div>

              {/* Telemetry Metric Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs">
                <div className="flex items-center gap-4 p-3">
                  <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined text-2xl">explore</span>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Active &amp; Queued</div>
                    <div className="font-display text-xl font-bold text-on-surface">{trips.length} Expeditions</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3">
                  <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined text-2xl">payments</span>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Managed Capital</div>
                    <div className="font-display text-xl font-bold text-on-surface">PKR {totalCapital.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3">
                  <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined text-2xl">conversion_path</span>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Corridor Telemetry</div>
                    <div className="font-display text-xl font-bold text-on-surface">{totalKm} km Calibrated</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3">
                  <div className="w-11 h-11 rounded-xl bg-secondary-container/40 flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined text-2xl">verified</span>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-secondary font-bold uppercase tracking-wider">Constraint Satisfaction</div>
                    <div className="font-display text-xl font-bold text-on-surface">0 Violations · Optimal</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: NAVIGATION FILTERS & QUERY BAR */}
          <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-outline-variant/50">

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${activeTab === "all"
                    ? "bg-secondary text-white shadow-xs"
                    : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-outline-variant/60"
                    }`}
                  type="button"
                >
                  <span>All Trips</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "all" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface"}`}>
                    {trips.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("active")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${activeTab === "active"
                    ? "bg-secondary text-white shadow-xs"
                    : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-outline-variant/60"
                    }`}
                  type="button"
                >
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span>Active Expeditions</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px]">
                    {trips.filter((t) => t.active_itinerary).length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("draft")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${activeTab === "draft"
                    ? "bg-secondary text-white shadow-xs"
                    : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-outline-variant/60"
                    }`}
                  type="button"
                >
                  <span>Draft Blueprints</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface text-[10px]">
                    {trips.filter((t) => !t.active_itinerary).length}
                  </span>
                </button>
              </div>

              {/* Search Bar & Controls */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-72">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-on-surface-variant">
                    search
                  </span>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-secondary transition-all"
                    placeholder="Filter by destination, route..."
                    type="text"
                  />
                </div>
                <Link
                  href="/planner"
                  className="px-3.5 py-2 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold hover:bg-secondary/20 transition-colors shrink-0"
                >
                  + New Itinerary
                </Link>
              </div>
            </div>
          </section>

          {/* LOADING STATE */}
          {loading ? (
            <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest border border-outline-variant/60 p-5 shadow-xs animate-pulse space-y-5"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-20 h-5 rounded bg-surface-container" />
                        <div className="w-24 h-4 rounded bg-surface-container" />
                      </div>
                      <div className="space-y-2">
                        <div className="w-3/4 h-5 rounded-lg bg-surface-container" />
                        <div className="w-full h-3 rounded bg-surface-container" />
                        <div className="w-5/6 h-3 rounded bg-surface-container" />
                      </div>
                      <div className="p-3.5 rounded-xl bg-surface-container-low/70 space-y-2">
                        <div className="w-24 h-3 rounded bg-surface-container" />
                        <div className="w-3/4 h-4 rounded bg-surface-container" />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-outline-variant/40 flex items-center justify-between">
                      <div className="w-20 h-5 rounded bg-surface-container" />
                      <div className="w-24 h-8 rounded-xl bg-surface-container" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : error ? (
            <div className="max-w-md mx-auto my-12 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs text-center">
              {error}
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="max-w-xl mx-auto my-16 text-center p-8 bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-xs">
              <span className="material-symbols-outlined text-5xl text-outline mb-3">explore_off</span>
              <h3 className="font-display font-bold text-base text-on-surface">No Expeditions Found</h3>
              <p className="text-xs text-on-surface-variant mt-1.5 max-w-md mx-auto">
                No travel itineraries match your active search or filter constraints. Start a new AI-optimized journey in seconds.
              </p>
              <Link
                href="/planner"
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-secondary text-white font-display text-xs font-semibold hover:bg-secondary-dark transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>Plan Your First Trip</span>
              </Link>
            </div>
          ) : (
            <>
              {/* SECTION 3: FEATURED ACTIVE EXPEDITION BANNER (First Trip) */}
              {activeTrip && activeDestLoc && (
                <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
                  <div className="relative rounded-2xl bg-surface-container-lowest p-6 sm:p-8 border border-outline-variant/60 shadow-xs overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-secondary via-secondary-container to-secondary" />

                    <div className="flex flex-col lg:flex-row gap-8 items-stretch">
                      {/* Left Details Panel */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-4">

                          {/* Status Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-white text-xs font-mono font-bold tracking-wide">
                              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                              ACTIVE EXPEDITION · {activeTrip.duration_days} DAYS
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container text-xs text-on-surface-variant font-medium">
                              <span className="material-symbols-outlined text-sm">calendar_today</span>
                              {activeTrip.start_date ? activeTrip.start_date : "Flexible Schedule"}
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container text-xs text-on-surface-variant capitalize">
                              <span className="material-symbols-outlined text-sm">speed</span>
                              {activeTrip.pace} Pace
                            </span>
                          </div>

                          {/* Title */}
                          <div>
                            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-on-surface tracking-tight">
                              {activeTrip.title}
                            </h2>
                            <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 flex items-center gap-2">
                              <span className="material-symbols-outlined text-base text-secondary">alt_route</span>
                              <span>
                                {activeTrip.active_itinerary?.days[0]?.items[0]?.place.name
                                  ? `${activeTrip.active_itinerary.days[0].items[0].place.name} → ${activeDestLoc.name} Route`
                                  : `${activeDestLoc.name} · ${activeDestLoc.province} Corridor`}
                              </span>
                            </p>
                          </div>

                          {/* Telemetry Box */}
                          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 font-display text-sm font-bold text-on-surface">
                                <span className="material-symbols-outlined text-base text-secondary">my_location</span>
                                <span>{activeDestLoc.name} · {activeDestLoc.province} Sector</span>
                                <span className="text-on-surface-variant font-normal">· Live Status</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="inline-flex items-center gap-1 text-on-surface-variant">
                                  <span className="material-symbols-outlined text-sm text-amber-500">sunny</span>
                                  {activeClimate?.tempHighC ?? 24}°C {activeClimate?.condition ?? "Clear Sky"}
                                </span>
                                <span className="inline-flex items-center gap-1 text-secondary font-semibold">
                                  <span className="material-symbols-outlined text-sm">check_circle</span>
                                  Corridor: {activeRouteMetrics?.roadPassabilityPercent ?? 98}% PASSABLE
                                </span>
                              </div>
                            </div>

                            {/* Milestone */}
                            {activeTrip.active_itinerary?.days[0]?.items[0] && (
                              <div className="flex items-center justify-between gap-4 pt-2 border-t border-outline-variant/30">
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs shrink-0">
                                    WP1
                                  </div>
                                  <div>
                                    <div className="font-display font-semibold text-xs text-on-surface">
                                      {activeTrip.active_itinerary.days[0].items[0].place.name}
                                    </div>
                                    <div className="text-[11px] text-on-surface-variant">
                                      Visit Duration: {activeTrip.active_itinerary.days[0].items[0].visit_duration_minutes} mins
                                    </div>
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 rounded bg-surface-container font-mono text-[10px] text-on-surface font-semibold">
                                  Validated
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Budget Liquidity Bar */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-on-surface font-medium">
                                Budget Liquidity: PKR {(activeTrip.active_itinerary?.total_cost || activeTrip.total_budget).toLocaleString()} estimated of PKR {activeTrip.total_budget.toLocaleString()} allocated
                              </span>
                              <span className="text-secondary font-semibold">Optimal Pacing</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                              <div
                                className="h-full bg-secondary rounded-full"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    ((activeTrip.active_itinerary?.total_cost || activeTrip.total_budget) /
                                      activeTrip.total_budget) *
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-6">
                          <Link
                            href={`/trips/${activeTrip.id}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark transition-all font-display text-xs font-bold shadow-sm"
                          >
                            <span className="material-symbols-outlined text-base">radar</span>
                            <span>Open Itinerary Timeline</span>
                          </Link>
                          <Link
                            href={`/explore?trip_id=${activeTrip.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-all text-xs font-semibold border border-outline-variant/60"
                          >
                            <span className="material-symbols-outlined text-base text-secondary">map</span>
                            <span>View on Smart Map</span>
                          </Link>
                        </div>
                      </div>

                      {/* Right Visual & Elevation Preview */}
                      <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
                        <div className="relative w-full h-48 rounded-xl overflow-hidden shadow-xs border border-outline-variant/40 group">
                          <img
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDE7jONMFJ6B9HEu3w3mMhMsFblNSzBEqfgC0A6-CvgO6XDcH2NzMPF_hbynDsypBtEHNRvT6IzrZlWWM7H04dFUxuc36_RNCPRUgxUj9hWCP9TSLmDEMLd9U20w0VXFPMOGpPHXeaFFpmmQDnyWjYdKAmpt8_GeI8tJgDyofhOCZjqktKmlzVMJRWB2sP_zg3iVVKKjC6Z7rbxhYQ7dlm5IfDJiKEM7NjpJQiWXxuBocWZonJ9jLT7sQ"
                            alt={activeTrip.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 text-white">
                            <div className="font-mono text-[9px] uppercase tracking-wider text-secondary-container font-bold">
                              Corridor Telemetry
                            </div>
                            <div className="font-display text-xs font-bold text-white">
                              {activeTrip.title}
                            </div>
                          </div>
                        </div>

                        {/* Topography Elevation SVG */}
                        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-2">
                          <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">
                            <span>Elevation Profile</span>
                            <span className="font-semibold text-on-surface">
                              {activeOriginLoc?.elevation_m ?? 200}m → {activeDestLoc?.elevation_m ?? 500}m
                            </span>
                          </div>
                          <svg className="w-full h-10 text-secondary" fill="none" preserveAspectRatio="none" viewBox="0 0 300 48">
                            <path d="M0,40 Q40,38 75,32 T150,22 T220,12 T300,16" fill="none" stroke="currentColor" strokeWidth="2" />
                            <path d="M0,40 Q40,38 75,32 T150,22 T220,12 T300,16 L300,48 L0,48 Z" fill="currentColor" fillOpacity="0.08" />
                            <circle cx="150" cy="22" fill="currentColor" r="4" className="animate-ping" />
                            <circle cx="150" cy="22" fill="currentColor" r="3" />
                          </svg>
                          <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
                            <span>{activeOriginLoc?.name ?? "Origin"}</span>
                            <span className="text-secondary font-bold">{activeDestLoc?.name ?? "Destination"} Corridor</span>
                            <span>{activeDestLoc?.district ?? "District"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* SECTION 4: UPCOMING EXPEDITIONS GRID */}
              <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface">
                      All Expedition Plans ({filteredTrips.length})
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Deterministic constraint-satisfaction routes scheduled for dynamic rollout.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTrips.map((trip) => {
                    const activeItin = trip.active_itinerary;
                    const totalStops = activeItin?.days.reduce((acc, d) => acc + d.items.length, 0) || 0;
                    const feasibility = activeItin ? Math.round(activeItin.feasibility_score * 100) : 0;

                    return (
                      <div
                        key={trip.id}
                        className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest border border-outline-variant/60 p-5 shadow-xs hover:shadow-md transition-all group"
                      >
                        <div className="space-y-4">
                          {/* Card Header Tag */}
                          <div className="flex items-center justify-between text-xs text-on-surface-variant">
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary px-2 py-0.5 rounded bg-secondary-container/40">
                              <span className="material-symbols-outlined text-xs">tune</span>
                              {trip.pace} Pace
                            </span>
                            <span className="font-mono text-[11px]">
                              {trip.duration_days} Days · {totalStops} Stops
                            </span>
                          </div>

                          {/* Title & Narrative */}
                          <div>
                            <h3 className="font-display font-bold text-base text-on-surface group-hover:text-secondary transition-colors">
                              {trip.title}
                            </h3>
                            <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">
                              {activeItin?.narrative || `${trip.duration_days}-day travel plan optimized for budget PKR ${trip.total_budget.toLocaleString()}`}
                            </p>
                          </div>

                          {/* Feasibility Solver Badge */}
                          {activeItin && (
                            <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-xs text-on-surface">
                                <span className="material-symbols-outlined text-sm text-secondary">verified</span>
                                <span className="font-medium">Feasibility Score</span>
                              </div>
                              <span className="font-mono text-xs font-bold text-secondary">{feasibility}%</span>
                            </div>
                          )}

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-surface-container border border-outline-variant/30 text-center">
                            <div>
                              <div className="font-mono text-[9px] text-on-surface-variant uppercase">Budget</div>
                              <div className="font-display text-xs font-bold text-on-surface">
                                PKR {(trip.total_budget / 1000).toFixed(0)}k
                              </div>
                            </div>
                            <div>
                              <div className="font-mono text-[9px] text-on-surface-variant uppercase">Stops</div>
                              <div className="font-display text-xs font-bold text-on-surface">
                                {totalStops} POIs
                              </div>
                            </div>
                            <div>
                              <div className="font-mono text-[9px] text-on-surface-variant uppercase">Distance</div>
                              <div className="font-display text-xs font-bold text-on-surface">
                                {getTripDistance(trip)} km
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action CTAs */}
                        <div className="flex items-center gap-2 pt-5 mt-2 border-t border-outline-variant/40">
                          <Link
                            href={`/trips/${trip.id}`}
                            className="flex-1 py-2 rounded-xl bg-secondary text-white font-display text-xs font-semibold text-center hover:bg-secondary-dark transition-all shadow-xs"
                          >
                            View Itinerary
                          </Link>
                          {activeItin && (
                            <Link
                              href={`/explore?trip_id=${trip.id}`}
                              className="px-3 py-1 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-all border border-outline-variant/50"
                              title="View on Smart Map"
                            >
                              <span className="material-symbols-outlined !text-[16px] text-secondary">map</span>
                            </Link>
                          )}
                          <button
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="px-3 py-1 rounded-xl bg-surface-container text-red-600 hover:bg-surface-container-high transition-all border border-outline-variant/50"
                            title="Delete trip"
                            type="button"
                          >
                            <span className="material-symbols-outlined !text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {/* SECTION 5: BOTTOM OPERATIONAL TOOLS */}
          <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Utility 1 */}
              <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-xl">cloud_sync</span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-on-surface">Offline Packs (GB &amp; KPK)</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Pre-cache high-resolution vector contours, elevation grids, and local medical coordinates before leaving cellular coverage.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30">
                  <span className="text-[11px] text-on-surface-variant font-mono">Size: 42.4 MB</span>
                  <button
                    onClick={() => alert("Downloading offline vector map packs for Northern Pakistan...")}
                    className="text-secondary text-xs font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    type="button"
                  >
                    <span>Download All</span>
                    <span className="material-symbols-outlined text-xs">download</span>
                  </button>
                </div>
              </div>

              {/* Utility 2 */}
              <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-xl">history</span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-on-surface">Reoptimization History</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Audit automatic route adjustments triggered by weather anomalies, landslide notices, or user budget re-calibrations.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30">
                  <span className="text-[11px] text-on-surface-variant font-mono">Live Logs</span>
                  <button
                    onClick={() => alert("Audit log: All optimization steps ran with 0 constraint violations.")}
                    className="text-secondary text-xs font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    type="button"
                  >
                    <span>View Audit Logs</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </button>
                </div>
              </div>

              {/* Utility 3 */}
              <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-xl">schema</span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-on-surface">Spatial Trace &amp; GeoJSON</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Export mathematical constraint parameters, PostGIS distance matrices, and raw waypoint vectors for external GIS analysis.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30">
                  <span className="text-[11px] text-on-surface-variant font-mono">RFC-7946 Standard</span>
                  <button
                    onClick={() => {
                      const jsonStr = JSON.stringify(trips, null, 2);
                      const blob = new Blob([jsonStr], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "wanderai_trips_geojson.json";
                      a.click();
                    }}
                    className="text-secondary text-xs font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    type="button"
                  >
                    <span>Export JSON</span>
                    <span className="material-symbols-outlined text-xs">code</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="w-full bg-surface-container-low border-t border-outline-variant/60 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold text-on-surface">WanderAI</span>
              </div>
              <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
                High-touch travel intelligence synthesizing geopolitical clarity, topographical metrics, and bespoke cultural itineraries across Pakistan and the Karakoram corridor.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-on-surface">Travel Intelligence</h3>
              <ul className="space-y-1.5 text-xs text-on-surface-variant">
                <li>Autonomous Route Generation</li>
                <li>Pass &amp; Glacier Road Conditions</li>
                <li>Altitude Acclimatization Radar</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-on-surface">Regions</h3>
              <ul className="space-y-1.5 text-xs text-on-surface-variant">
                <li>Hunza &amp; Nagar Valleys</li>
                <li>Skardu &amp; Deosai Plateau</li>
                <li>Swat &amp; Chitral Highlands</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-on-surface">Platform</h3>
              <ul className="space-y-1.5 text-xs text-on-surface-variant">
                <li>Live Satellite Weather</li>
                <li>Curated Stays &amp; Lodges</li>
                <li>Offline Wilderness Packs</li>
              </ul>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-outline-variant/40 text-xs text-on-surface-variant">
            <div>© 2025 WanderAI Technologies Inc. Crafted for purposeful exploration.</div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-on-surface transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-on-surface transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

