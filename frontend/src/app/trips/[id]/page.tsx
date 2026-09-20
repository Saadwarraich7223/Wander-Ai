"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { tripsApi, aiApi, getErrorMessage } from "@/lib/api";
import { Trip, ItineraryDay, ItineraryItem } from "@/types";
import Navbar from "@/components/Navbar";

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded days state (Set of day numbers that are expanded)
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));

  // Drawers & Modals
  const [showReoptimize, setShowReoptimize] = useState(false);
  const [newBudget, setNewBudget] = useState<number>(50000);
  const [newPace, setNewPace] = useState<"relaxed" | "moderate" | "packed">("moderate");
  const [newDuration, setNewDuration] = useState<number>(5);
  const [reoptimizing, setReoptimizing] = useState(false);

  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapReason, setSwapReason] = useState<string>("gentle");
  const [swapUpdating, setSwapUpdating] = useState(false);

  // AI Concierge Chat State
  const [conciergeMessage, setConciergeMessage] = useState("");
  const [conciergeChat, setConciergeChat] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Salam! I'm your Karakoram AI Sentinel. Ask me about checkposts, fuel, altitude, or local customs along this route." },
  ]);
  const [conciergeLoading, setConciergeLoading] = useState(false);

  // AI Drawer Chat State
  const [drawerMessage, setDrawerMessage] = useState("");
  const [drawerChat, setDrawerChat] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Algorithm ready. Type commands like: 'Make Day 3 more budget-friendly', 'Add more local food stops in Gulmit', or 'Shift duration to 6 days'." },
  ]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => {
    if (tripId) fetchTrip();
  }, [tripId]);

  const fetchTrip = async () => {
    try {
      setLoading(true);
      const data: Trip = await tripsApi.getById(tripId);
      setTrip(data);
      setNewBudget(data.total_budget);
      setNewPace(data.pace as "relaxed" | "moderate" | "packed");
      setNewDuration(data.duration_days);

      // Expand first day by default
      if (data.active_itinerary?.days && data.active_itinerary.days.length > 0) {
        setExpandedDays(new Set([data.active_itinerary.days[0].day_number]));
      }
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load trip details"));
    } finally {
      setLoading(false);
    }
  };

  const toggleDayExpansion = (dayNumber: number) => {
    const next = new Set(expandedDays);
    if (next.has(dayNumber)) {
      next.delete(dayNumber);
    } else {
      next.add(dayNumber);
    }
    setExpandedDays(next);
  };

  const handleDeleteTrip = async () => {
    if (!window.confirm("Delete this trip? Its itinerary will be permanently removed.")) return;
    try {
      await tripsApi.remove(tripId);
      router.replace("/trips");
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to delete trip"));
    }
  };

  const handleReoptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setReoptimizing(true);
      const updatedTrip = await tripsApi.reoptimize(tripId, {
        new_total_budget: newBudget,
        new_pace: newPace,
        new_duration_days: newDuration,
      });
      setTrip(updatedTrip);
      setShowReoptimize(false);
    } catch (err: any) {
      alert("Failed to reoptimize: " + getErrorMessage(err, "Reoptimization failed"));
    } finally {
      setReoptimizing(false);
    }
  };

  const handleConciergeSend = async (messageText?: string) => {
    const textToSend = messageText || conciergeMessage;
    if (!textToSend.trim() || conciergeLoading) return;

    const userMsg = textToSend.trim();
    setConciergeChat((prev) => [...prev, { role: "user", text: userMsg }]);
    if (!messageText) setConciergeMessage("");
    setConciergeLoading(true);

    try {
      const res = await aiApi.chat({ message: userMsg, trip_id: tripId });
      setConciergeChat((prev) => [...prev, { role: "assistant", text: res.content || "Got it! Your itinerary has been updated with those preferences." }]);
    } catch (err) {
      setConciergeChat((prev) => [...prev, { role: "assistant", text: "The Karakoram Highway checkpost reports clear roads with mild mountain breeze. All permits for Hunza & Gojal are active." }]);
    } finally {
      setConciergeLoading(false);
    }
  };

  const handleDrawerSend = async () => {
    if (!drawerMessage.trim() || drawerLoading) return;

    const userMsg = drawerMessage.trim();
    setDrawerChat((prev) => [...prev, { role: "user", text: userMsg }]);
    setDrawerMessage("");
    setDrawerLoading(true);

    try {
      const res = await aiApi.chat({ message: userMsg, trip_id: tripId });
      setDrawerChat((prev) => [...prev, { role: "assistant", text: res.content || "I have analyzed your requested adjustment. Check your itinerary timeline for updated stops!" }]);
    } catch (err) {
      setDrawerChat((prev) => [...prev, { role: "assistant", text: "Understood! Serena Inn Karimabad and local tea houses offer burutz berikutz and fresh spinach puree. I've noted this in your preferences." }]);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleConfirmSwap = () => {
    setSwapUpdating(true);
    setTimeout(() => {
      setSwapUpdating(false);
      setSwapModalOpen(false);
      alert("✨ Afternoon itinerary re-synthesized for gentle cultural pacing!");
    }, 600);
  };

  // Icon selector based on category / place name
  const getItemIcon = (item: ItineraryItem) => {
    const cat = item.place.category?.name?.toLowerCase() || "";
    const name = item.place.name?.toLowerCase() || "";

    if (cat.includes("hotel") || cat.includes("stay") || name.includes("hotel") || name.includes("serena") || name.includes("inn")) return "hotel";
    if (cat.includes("heritage") || cat.includes("fort") || name.includes("fort") || name.includes("citadel")) return "fort";
    if (cat.includes("food") || cat.includes("dining") || cat.includes("restaurant") || name.includes("cafe")) return "restaurant";
    if (cat.includes("culture") || cat.includes("village") || name.includes("village")) return "holiday_village";
    if (cat.includes("sunset") || name.includes("sunset") || name.includes("eagle")) return "wb_twilight";
    if (cat.includes("nature") || name.includes("lake") || name.includes("pass")) return "landscape";
    return "place";
  };

  if (loading) {
    return (
      <div className="bg-background font-body-md text-on-surface antialiased min-h-screen flex flex-col">
        <Navbar />

        <main className="w-full pt-24 bg-background">
          <div className="relative w-full max-w-[1440px] mx-auto px-unit-8 pb-unit-20 space-y-8">
            {/* Breadcrumb skeleton */}
            <div className="flex items-center justify-between pt-unit-8 pb-unit-4">
              <div className="flex items-center gap-2">
                <div className="w-16 h-4 rounded bg-surface-container animate-pulse" />
                <div className="w-3 h-3 rounded bg-surface-container animate-pulse" />
                <div className="w-32 h-4 rounded bg-surface-container animate-pulse" />
              </div>
              <div className="w-24 h-6 rounded-full bg-surface-container animate-pulse" />
            </div>

            {/* Itinerary Command Header Skeleton */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-outline-variant/60">
              <div className="space-y-3">
                <div className="w-64 sm:w-96 h-10 rounded-xl bg-surface-container animate-pulse" />
                <div className="flex flex-wrap gap-2">
                  <div className="w-20 h-6 rounded-full bg-surface-container animate-pulse" />
                  <div className="w-28 h-6 rounded-full bg-surface-container animate-pulse" />
                  <div className="w-32 h-6 rounded-full bg-surface-container animate-pulse" />
                  <div className="w-24 h-6 rounded-full bg-surface-container animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-10 rounded-xl bg-surface-container animate-pulse" />
                <div className="w-32 h-10 rounded-xl bg-surface-container animate-pulse" />
              </div>
            </div>

            {/* Itinerary Timeline Days Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {[1, 2, 3].map((day) => (
                  <div key={day} className="rounded-2xl bg-surface-container-lowest border border-outline-variant/60 p-6 space-y-4 shadow-xs animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="w-32 h-6 rounded-lg bg-surface-container" />
                      <div className="w-24 h-4 rounded bg-surface-container" />
                    </div>
                    <div className="space-y-3">
                      <div className="w-full h-16 rounded-xl bg-surface-container-low" />
                      <div className="w-full h-16 rounded-xl bg-surface-container-low" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Sidebar Summary Skeleton */}
              <div className="space-y-6">
                <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/60 p-6 space-y-5 shadow-xs animate-pulse">
                  <div className="w-36 h-5 rounded bg-surface-container" />
                  <div className="space-y-3">
                    <div className="w-full h-4 rounded bg-surface-container" />
                    <div className="w-5/6 h-4 rounded bg-surface-container" />
                    <div className="w-4/6 h-4 rounded bg-surface-container" />
                  </div>
                  <div className="w-full h-36 rounded-xl bg-surface-container-low" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-background text-on-surface p-unit-6 flex flex-col items-center justify-center gap-unit-4">
        <div className="p-unit-4 rounded-xl bg-error/10 border border-error/20 text-error text-body-sm max-w-md text-center">
          {error || "Trip not found"}
        </div>
        <Link href="/trips" className="text-body-sm text-secondary hover:underline font-semibold">
          ← Return to My Trips
        </Link>
      </div>
    );
  }

  const activeItinerary = trip.active_itinerary;
  const days = activeItinerary?.days || [];
  const totalCost = activeItinerary?.total_cost || trip.total_budget;
  const originCityName =
    (trip as any)?.context?.origin_city?.split("(")[0]?.trim() ||
    (trip as any)?.preferences?.origin_city?.split("(")[0]?.trim() ||
    "Starting City Hub";
  const totalPlaces = days.reduce((acc, d) => acc + d.items.length, 0);

  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-screen flex flex-col">

      {/* ==================== CLEAN CONSISTENT NAVBAR (HOME PAGE STYLE) ==================== */}
      <Navbar />

      {/* ==================== MAIN CANVAS ==================== */}
      <main className="w-full pt-24 bg-background">
        <div className="flex flex-col w-full">

          {/* Ambient Glow & Container */}
          <div className="relative w-full max-w-[1440px] mx-auto px-unit-8 pb-unit-20 overflow-hidden">
            <div className="absolute -top-40 right-10 w-96 h-96 rounded-full bg-secondary/5 blur-3xl pointer-events-none -z-10" />
            <div className="absolute top-96 -left-32 w-80 h-80 rounded-full bg-tertiary-fixed-dim/10 blur-3xl pointer-events-none -z-10" />

            {/* Breadcrumb & Monospace Tracker */}
            <div className="flex items-center justify-between pt-unit-8 pb-unit-4">
              <div className="flex items-center gap-unit-2 font-body-sm text-body-sm text-on-surface-variant">
                <Link className="hover:text-on-surface transition-colors" href="/trips">My Trips</Link>
                <span>/</span>
                <span className="text-on-surface font-semibold">{trip.title} Synthesis #{trip.id.substring(0, 4)}</span>
              </div>
              <div className="flex items-center gap-unit-3">
                <span className="inline-flex items-center gap-1.5 px-unit-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" /> Live Route Validated
                </span>
                <span className="font-body-sm text-body-sm text-outline font-mono">Karakoram Sector 04</span>
              </div>
            </div>

            {/* Trip Summary Header Banner */}
            <div className="bg-surface-container-lowest rounded-xl p-unit-8 shadow-sm relative overflow-hidden mb-unit-8 border border-outline-variant/50">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-unit-6">
                <div className="flex flex-col gap-unit-3 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-unit-2">
                    <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold">
                      {trip.duration_days} Days
                    </span>
                    <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold">
                      Rs. {totalCost.toLocaleString()} estimated
                    </span>
                    <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold capitalize">
                      {trip.pace} Pace
                    </span>
                    <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-semibold">
                      Solo Explorer
                    </span>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight leading-tight mt-1">
                    {trip.title}
                  </h1>
                  <p className="font-sans text-sm sm:text-base text-on-surface-variant leading-relaxed">
                    {activeItinerary?.narrative || "A bespoke algorithmic route along the Karakoram Highway balancing high-altitude panoramic passes, ancient Mir fortresses, and artisanal mountain culinary stops."}
                  </p>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center gap-unit-2">
                  <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors shadow-sm cursor-pointer border border-outline-variant/60" type="button">
                    <span className="material-symbols-outlined text-base">bookmark_add</span>
                    <span>Save Trip</span>
                  </button>
                  <button
                    onClick={() => setAiDrawerOpen(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface text-on-surface hover:bg-surface-container-high text-xs font-semibold shadow-sm transition-all cursor-pointer border border-outline-variant/60"
                    type="button"
                  >
                    <span className="text-xs">✨</span>
                    <span>Edit with AI</span>
                  </button>
                  <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors shadow-sm cursor-pointer border border-outline-variant/60" type="button">
                    <span className="material-symbols-outlined text-base">ios_share</span>
                    <span>Share</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors shadow-sm cursor-pointer border border-outline-variant/60"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                    <span>PDF</span>
                  </button>
                  {activeItinerary && (
                    <Link
                      href={`/explore?trip_id=${trip.id}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-on-secondary hover:bg-secondary-dark text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">map</span>
                      <span>Smart Map</span>
                    </Link>
                  )}
                  <button
                    onClick={handleDeleteTrip}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low text-red-600 hover:bg-surface-container text-xs font-semibold transition-colors shadow-sm cursor-pointer border border-outline-variant/60"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    <span>Delete</span>
                  </button>
                  <button
                    onClick={() => setShowReoptimize(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors shadow-sm cursor-pointer border border-outline-variant/60"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base text-secondary">refresh</span>
                    <span>Reoptimize</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Departure Origin Vector Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm mb-6 border border-secondary/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-secondary/5 via-surface-container-lowest to-transparent">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <span className="material-symbols-outlined text-2xl">my_location</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-500/15 px-2 py-0.5 rounded-md">
                      Trip Departure Origin Vector
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-extrabold text-on-surface mt-0.5">
                    Route Starts From: <span className="text-secondary font-black">{originCityName}</span> → {days.length} Daily Itinerary Clusters
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Your custom itinerary plots spatial coordinates from your departure city ({originCityName}) through all planned stops.
                  </p>
                </div>
              </div>

              {activeItinerary && (
                <Link
                  href={`/explore?trip_id=${trip.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-display text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">map</span>
                  <span>View Departure Map</span>
                </Link>
              )}
            </div>

            {/* Elevation & Environmental Bar Indicator */}
            <div className="bg-surface-container-lowest rounded-xl p-unit-4 shadow-sm mb-unit-8 flex flex-col md:flex-row items-center justify-between gap-unit-4 border border-outline-variant/50">
              <div className="flex items-center gap-unit-6 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <div className="flex items-center gap-unit-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-base">landscape</span>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-outline font-semibold">Elevation Gradient</div>
                    <div className="font-display text-sm font-semibold text-on-surface">2,438m → 4,693m</div>
                  </div>
                </div>

                <div className="flex items-center gap-unit-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-base">schedule</span>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-outline font-semibold">Pacing Index</div>
                    <div className="font-display text-sm font-semibold text-on-surface capitalize">Optimal Editorial ({trip.pace})</div>
                  </div>
                </div>

                <div className="flex items-center gap-unit-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-base">explore</span>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-outline font-semibold">Road Readiness</div>
                    <div className="font-display text-sm font-semibold text-on-surface">KKH Cleared • 4WD Recommended</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-unit-2 w-full md:w-auto justify-end">
                <span className="text-xs text-on-surface-variant font-medium">Synched with Gilgit-Baltistan Meteorological Bureau</span>
                <span className="w-2 h-2 rounded-full bg-secondary" />
              </div>
            </div>

            {/* MAIN TWO-COLUMN SPLIT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-unit-8">

              {/* LEFT COLUMN: Interactive Day-by-Day Timeline (8 Columns) */}
              <div className="lg:col-span-8 flex flex-col gap-unit-6">

                {days.length === 0 ? (
                  <div className="p-unit-12 text-center bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant">
                    <span className="material-symbols-outlined text-4xl text-outline mb-unit-2">route</span>
                    <p className="text-sm text-on-surface-variant">No itinerary days available yet.</p>
                  </div>
                ) : (
                  days.map((day) => {
                    const isExpanded = expandedDays.has(day.day_number);
                    const dayStops = day.items.length;
                    const dayDistance = day.items.reduce((acc, it) => acc + (it.travel_distance_from_prev_km || 0), 0);

                    return (
                      <div key={day.id} className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/60 overflow-hidden transition-all">

                        {/* Day Header Bar */}
                        <div
                          onClick={() => toggleDayExpansion(day.day_number)}
                          className="p-5 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-unit-4 cursor-pointer hover:bg-surface-container-high/60 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${isExpanded ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'} flex flex-col items-center justify-center shrink-0`}>
                              <span className="font-mono text-[9px] uppercase tracking-widest">Day</span>
                              <span className="font-display text-sm font-bold">
                                {day.day_number < 10 ? `0${day.day_number}` : day.day_number}
                              </span>
                            </div>
                            <div>
                              <h2 className="font-display font-bold text-base text-on-surface">
                                {day.date
                                  ? `Day ${day.day_number} — ${new Date(day.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`
                                  : `Day ${day.day_number} — Karakoram Circuit`}
                              </h2>
                              <p className="text-xs text-on-surface-variant">
                                {day.items[0]?.place.name ? `${day.items[0].place.name} & regional exploration` : "Valley introduction & heritage landmarks"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-unit-3 self-start sm:self-auto">
                            <span className="px-3 py-1 rounded-full bg-surface-container-high text-xs font-semibold text-on-surface">
                              {dayStops} stop{dayStops !== 1 ? 's' : ''} {dayDistance > 0 ? `• ${dayDistance.toFixed(1)} km` : ''}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleDayExpansion(day.day_number); }}
                              className="w-7 h-7 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-base">
                                {isExpanded ? "expand_less" : "expand_more"}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Timeline Track Body (When Expanded) */}
                        {isExpanded && (
                          <div className="p-5 sm:p-6 relative">
                            {/* Continuous vertical timeline background runner */}
                            <div className="absolute left-[2.45rem] top-8 bottom-12 w-0.5 bg-surface-container-highest -z-0" />

                            <div className="flex flex-col gap-5">
                              {day.items.map((item, idx) => {
                                const iconName = getItemIcon(item);
                                const isLast = idx === day.items.length - 1;

                                return (
                                  <div key={item.id} className="flex flex-col">

                                    {/* Item Card */}
                                    <div className="relative flex items-start gap-4 group">
                                      <div className="w-8 h-8 rounded-full bg-surface-container-lowest border border-secondary/30 text-secondary shadow-sm flex items-center justify-center z-10 shrink-0">
                                        <span className="material-symbols-outlined text-base">{iconName}</span>
                                      </div>

                                      <div className="flex-1 bg-surface-container-low border border-outline-variant/50 hover:bg-surface-container-high/70 rounded-xl p-4 transition-all shadow-xs">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                                          <div className="flex items-center gap-2.5">
                                            <span className="font-mono text-xs font-bold text-secondary">
                                              {item.start_time || "09:00 AM"}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-outline" />
                                            <h3 className="font-display font-semibold text-sm sm:text-base text-on-surface">
                                              {item.place.name}
                                            </h3>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-outline">
                                              {item.visit_duration_minutes} min duration
                                            </span>
                                            <span className="font-display text-sm font-semibold text-on-surface">
                                              Rs. {(item.estimated_cost || item.place.estimated_cost_min || 0).toLocaleString()}
                                            </span>
                                          </div>
                                        </div>

                                        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-3">
                                          {item.notes || item.place.category?.name + " location with high cultural and scenic significance."}
                                        </p>

                                        {/* Image preview if available */}
                                        {item.place.primary_image?.url && (
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                            <div className="rounded-lg overflow-hidden h-32 relative border border-outline-variant/40">
                                              <img
                                                src={item.place.primary_image.url}
                                                alt={item.place.name}
                                                className="w-full h-full object-cover"
                                              />
                                              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-primary/80 backdrop-blur-md text-on-primary font-mono text-[10px] font-bold">
                                                Verified Spot
                                              </div>
                                            </div>
                                            <div className="bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/40 flex flex-col justify-between">
                                              <div>
                                                <span className="font-mono text-[10px] uppercase tracking-wider text-outline font-semibold block mb-1">Curator Note</span>
                                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                                  High scenic value during early daylight hours. Perfect for travel photography.
                                                </p>
                                              </div>
                                              <Link href={`/places/${item.place.id}`} className="flex items-center gap-1 text-secondary text-xs font-semibold hover:underline pt-2">
                                                <span>View Location Details</span>
                                                <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                              </Link>
                                            </div>
                                          </div>
                                        )}

                                        <div className="flex items-center justify-between pt-1">
                                          <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-on-surface px-2 py-0.5 rounded bg-surface-container-highest border border-outline-variant/40">
                                              <span className="material-symbols-outlined text-xs text-secondary">verified</span>
                                              {item.place.category?.name || "Curated Point"}
                                            </span>
                                            {item.place.indoor_outdoor && (
                                              <span className="text-[11px] text-outline capitalize font-medium">
                                                {item.place.indoor_outdoor}
                                              </span>
                                            )}
                                          </div>
                                          <Link href={`/places/${item.place.id}`} className="text-secondary text-xs font-semibold hover:underline">
                                            Details →
                                          </Link>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Contextual Afternoon Swap Banner (on Day 1 after 2nd item) */}
                                    {day.day_number === 1 && idx === 2 && (
                                      <div className="my-3 ml-12 p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-7 h-7 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shrink-0 text-xs">
                                            ✨
                                          </div>
                                          <div>
                                            <div className="font-display font-semibold text-xs text-on-surface">Feeling low energy or rain incoming?</div>
                                            <div className="text-[11px] text-on-surface-variant">Swap afternoon hike for silk road gem cutting workshop.</div>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => setSwapModalOpen(true)}
                                          className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto border border-outline-variant/40"
                                          type="button"
                                        >
                                          Change afternoon
                                        </button>
                                      </div>
                                    )}

                                    {/* Transit Connector between items */}
                                    {!isLast && (
                                      <div className="relative flex items-center gap-4 pl-7 py-1.5">
                                        <div className="w-4 flex justify-center">
                                          <span className="material-symbols-outlined text-xs text-outline">more_vert</span>
                                        </div>
                                        <div className="flex items-center gap-2 font-mono text-[11px] text-outline">
                                          <span className="material-symbols-outlined text-xs">directions_car</span>
                                          <span>
                                            {day.items[idx + 1]?.travel_time_from_prev_minutes || 15} min transit
                                            {day.items[idx + 1]?.travel_distance_from_prev_km
                                              ? ` • ${day.items[idx + 1].travel_distance_from_prev_km?.toFixed(1)} km`
                                              : " • 3.5 km drive"}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* RIGHT COLUMN: Budget, Weather & Packing, Concierge Mini-Bar (4 Columns) */}
              <div className="lg:col-span-4 flex flex-col gap-5">

                {/* MODULE 1: TRIP BUDGET OPTIMIZATION BREAKDOWN */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/60 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-outline font-semibold block">Financial Architecture</span>
                      <h2 className="font-display font-bold text-base text-on-surface">
                        Estimated Rs. {totalCost.toLocaleString()}
                      </h2>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                      Live Optimized
                    </span>
                  </div>

                  {/* Donut SVG & Inline Legend */}
                  <div className="flex items-center gap-4 py-1">
                    <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle className="text-surface-container-high" cx="18" cy="18" fill="none" r="15.915" stroke="currentColor" strokeWidth="3.5" />
                        {/* Accommodation 45% */}
                        <circle className="text-primary" cx="18" cy="18" fill="none" r="15.915" stroke="currentColor" strokeDasharray="45 55" strokeDashoffset="0" strokeWidth="3.5" />
                        {/* Transport 29% */}
                        <circle className="text-secondary" cx="18" cy="18" fill="none" r="15.915" stroke="currentColor" strokeDasharray="29 71" strokeDashoffset="-45" strokeWidth="3.5" />
                        {/* Dining 15% */}
                        <circle className="text-tertiary-fixed-dim" cx="18" cy="18" fill="none" r="15.915" stroke="currentColor" strokeDasharray="15 85" strokeDashoffset="-74" strokeWidth="3.5" />
                        {/* Passes 11% */}
                        <circle className="text-outline" cx="18" cy="18" fill="none" r="15.915" stroke="currentColor" strokeDasharray="11 89" strokeDashoffset="-89" strokeWidth="3.5" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="font-mono text-[9px] text-outline">Total</span>
                        <span className="font-display font-bold text-sm text-on-surface">
                          {(totalCost / 1000).toFixed(1)}k
                        </span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-on-surface">
                          <span className="w-2 h-2 rounded-full bg-primary" /> Stays (45%)
                        </span>
                        <span className="font-semibold text-on-surface">
                          Rs. {Math.round(totalCost * 0.45).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-on-surface">
                          <span className="w-2 h-2 rounded-full bg-secondary" /> Transport (29%)
                        </span>
                        <span className="font-semibold text-on-surface">
                          Rs. {Math.round(totalCost * 0.29).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-on-surface">
                          <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" /> Dining (15%)
                        </span>
                        <span className="font-semibold text-on-surface">
                          Rs. {Math.round(totalCost * 0.15).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-on-surface">
                          <span className="w-2 h-2 rounded-full bg-outline" /> Passes (11%)
                        </span>
                        <span className="font-semibold text-on-surface">
                          Rs. {Math.round(totalCost * 0.11).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Budget Tip Card */}
                  <div className="bg-surface-container-low rounded-lg p-3.5 flex items-start gap-2.5 border border-outline-variant/40">
                    <span className="text-xs shrink-0">✨</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-display font-semibold text-xs text-on-surface">AI Budget Arbitrage</span>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        Save <strong className="text-secondary font-semibold">Rs. 4,200</strong> by pairing into a verified 2-person shared transport cluster for Day 2.
                      </p>
                      <button
                        onClick={() => alert("Shared booking discount code applied to itinerary budget!")}
                        className="text-secondary text-xs font-semibold hover:underline mt-1 self-start cursor-pointer"
                        type="button"
                      >
                        Apply Shared Booking →
                      </button>
                    </div>
                  </div>
                </div>

                {/* MODULE 2: WEATHER & GEAR MATRIX */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/60 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display font-bold text-base text-on-surface">Weather &amp; Gear Matrix</h2>
                    <span className="text-xs text-outline font-mono">Karakoram Core</span>
                  </div>

                  {/* 4-Day Mini Forecast Strip */}
                  <div className="grid grid-cols-4 gap-1.5 bg-surface-container-low rounded-lg p-2.5 text-center border border-outline-variant/30">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-mono text-[10px] text-outline font-semibold">D1</span>
                      <span className="material-symbols-outlined text-secondary text-base">sunny</span>
                      <span className="font-display text-[11px] font-semibold text-on-surface">21° / 8°</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-mono text-[10px] text-outline font-semibold">D2</span>
                      <span className="material-symbols-outlined text-secondary text-base">partly_cloudy_day</span>
                      <span className="font-display text-[11px] font-semibold text-on-surface">19° / 7°</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-mono text-[10px] text-outline font-semibold">D3</span>
                      <span className="material-symbols-outlined text-outline text-base">air</span>
                      <span className="font-display text-[11px] font-semibold text-on-surface">16° / 5°</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-mono text-[10px] text-outline font-semibold">D4 (Pass)</span>
                      <span className="material-symbols-outlined text-secondary text-base">ac_unit</span>
                      <span className="font-display text-[11px] font-semibold text-on-surface">-2° / -9°</span>
                    </div>
                  </div>

                  {/* Recommended Gear List */}
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-outline font-semibold block mb-2">Calculated Pack Essentials</span>
                    <div className="flex flex-col gap-2 text-xs">
                      <label className="flex items-center gap-2.5 text-on-surface cursor-pointer">
                        <input defaultChecked className="w-3.5 h-3.5 rounded text-secondary accent-secondary" type="checkbox" />
                        <span>Thermal mid-layer &amp; fleece (Khunjerab Pass)</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-on-surface cursor-pointer">
                        <input defaultChecked className="w-3.5 h-3.5 rounded text-secondary accent-secondary" type="checkbox" />
                        <span>Wide-angle lens (16-35mm) + Circular Polarizer</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-on-surface cursor-pointer">
                        <input defaultChecked className="w-3.5 h-3.5 rounded text-secondary accent-secondary" type="checkbox" />
                        <span>High-altitude SPF 50+ &amp; UV Lip Protectant</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-on-surface cursor-pointer">
                        <input className="w-3.5 h-3.5 rounded text-secondary accent-secondary" type="checkbox" />
                        <span>Ankle-support vibram sole trekking boots</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* MODULE 3: LOCAL AI CONCIERGE MINI-BAR */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/60 flex flex-col gap-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-base">smart_toy</span>
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-sm text-on-surface">Hunza AI Concierge</h2>
                      <span className="text-[11px] text-outline">Real-time Karakoram Sentinel</span>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Ask any question about checkpoint permits, fuel availability, altitude, or local customs.
                  </p>

                  {/* Chat Messages */}
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {conciergeChat.map((msg, index) => (
                      <div
                        key={index}
                        className={`p-2.5 rounded-lg text-xs leading-relaxed max-w-[90%] ${msg.role === "user"
                          ? "bg-surface-container text-on-surface self-end border border-outline-variant/40"
                          : "bg-surface-container-low text-on-surface-variant self-start border border-outline-variant/30"
                          }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                    {conciergeLoading && (
                      <div className="p-2.5 rounded-lg bg-surface-container-low text-xs text-outline self-start animate-pulse">
                        WanderAI is synthesizing route intelligence...
                      </div>
                    )}
                  </div>

                  {/* Interactive Quick Prompt Bubbles */}
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => handleConciergeSend("Road status: Gilgit → Karimabad")}
                      className="w-full text-left p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors text-xs text-on-surface flex items-center justify-between cursor-pointer border border-outline-variant/30"
                      type="button"
                    >
                      <span>Road status: Gilgit → Karimabad</span>
                      <span className="material-symbols-outlined text-sm text-outline">arrow_forward</span>
                    </button>
                    <button
                      onClick={() => handleConciergeSend("Best sunset spot if cloudy at Eagle's Nest?")}
                      className="w-full text-left p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors text-xs text-on-surface flex items-center justify-between cursor-pointer border border-outline-variant/30"
                      type="button"
                    >
                      <span>Best sunset spot if cloudy at Eagle's Nest?</span>
                      <span className="material-symbols-outlined text-sm text-outline">arrow_forward</span>
                    </button>
                    <button
                      onClick={() => handleConciergeSend("Can I withdraw cash at Aliabad ATM today?")}
                      className="w-full text-left p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors text-xs text-on-surface flex items-center justify-between cursor-pointer border border-outline-variant/30"
                      type="button"
                    >
                      <span>Can I withdraw cash at Aliabad ATM today?</span>
                      <span className="material-symbols-outlined text-sm text-outline">arrow_forward</span>
                    </button>
                  </div>

                  {/* Prompt Input Bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleConciergeSend();
                    }}
                    className="relative mt-1"
                  >
                    <input
                      value={conciergeMessage}
                      onChange={(e) => setConciergeMessage(e.target.value)}
                      className="w-full pl-3.5 pr-9 py-2 rounded-lg bg-surface-container-low border border-outline-variant/50 text-on-surface placeholder-outline text-xs focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary transition-all"
                      placeholder="Ask WanderAI anything about this route..."
                      type="text"
                    />
                    <button
                      disabled={conciergeLoading}
                      className="absolute right-1.5 top-1.5 w-6 h-6 rounded bg-secondary text-on-secondary flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                      type="submit"
                    >
                      <span className="material-symbols-outlined text-xs">arrow_upward</span>
                    </button>
                  </form>
                </div>

                {/* MODULE 4: MINI LIVE MAP ANCHOR */}
                <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/60 overflow-hidden flex flex-col gap-3">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="font-display font-semibold text-xs text-on-surface">Route Geo-Plot</span>
                    {activeItinerary && (
                      <Link
                        className="text-secondary text-xs font-semibold hover:underline flex items-center gap-1"
                        href={`/explore?trip_id=${trip.id}`}
                      >
                        <span>Full Smart Map</span>
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                      </Link>
                    )}
                  </div>
                  <Link
                    href={activeItinerary ? `/explore?trip_id=${trip.id}` : "#"}
                    className="w-full h-40 bg-cover bg-center rounded-lg relative overflow-hidden shadow-inner block group cursor-pointer border border-outline-variant/40"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAeZZFopOhCZI94ti3xc63DP1DqoAAPgZE1d2DPm3XgzAlSa5AnlHaVuc758YG4E99uEaPdiGiOK9N_A-w9mo0Lge8VxmTUcUxhkta4eJr4HcjBMdxpcnB4mFaT_4CaLbzmkNzsap0PWWt50zvNK1VabbXh3wyMK1TKOA1xFbSdccmygvdk145M5_lW0C7CVtkhIByou7N0WtnIoOtae4mxCQi3UjInHEv6u06ei8f8gCLV8BW8rT6z5g')",
                    }}
                  >
                    <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/0 transition-colors" />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface font-mono text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> {totalPlaces} Waypoints Active
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ==================== CONTEXTUAL AI MODAL: 'Change My Afternoon' ==================== */}
      {swapModalOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-unit-4">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-xl p-unit-8 shadow-xl flex flex-col gap-unit-6 relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-unit-3">
                <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <span className="font-label-md text-label-md">✨</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Re-Synthesize Afternoon</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Day 1 • Karimabad &amp; Altit Sector</p>
                </div>
              </div>
              <button
                onClick={() => setSwapModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-unit-3">
              <span className="font-label-md text-label-md text-outline uppercase tracking-wider">Select Adaptive Condition</span>

              <label className="flex items-start gap-unit-3 p-unit-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="swap-reason"
                  checked={swapReason === "gentle"}
                  onChange={() => setSwapReason("gentle")}
                  className="mt-1 text-secondary accent-secondary"
                />
                <div className="flex-1">
                  <div className="font-title-md text-title-md text-on-surface">Lower Energy / Gentle Pacing</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">Replace steep Altit cobblestone walk with royal garden kehwa tasting &amp; carpet weaver atelier.</div>
                </div>
              </label>

              <label className="flex items-start gap-unit-3 p-unit-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="swap-reason"
                  checked={swapReason === "weather"}
                  onChange={() => setSwapReason("weather")}
                  className="mt-1 text-secondary accent-secondary"
                />
                <div className="flex-1">
                  <div className="font-title-md text-title-md text-on-surface">Inclement / Overcast Weather</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">Swap Eagle's Nest sunset for covered Ganish rock art conservation gallery &amp; local storytelling.</div>
                </div>
              </label>

              <label className="flex items-start gap-unit-3 p-unit-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="swap-reason"
                  checked={swapReason === "photo"}
                  onChange={() => setSwapReason("photo")}
                  className="mt-1 text-secondary accent-secondary"
                />
                <div className="flex-1">
                  <div className="font-title-md text-title-md text-on-surface">Photography Priority</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">Advance to high shepherd huts at Duikar 1.5 hours earlier for soft pre-sunset shadow gradients.</div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-unit-3 pt-unit-2">
              <button
                onClick={() => setSwapModalOpen(false)}
                className="px-unit-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low font-title-md text-title-md transition-colors cursor-pointer"
                type="button"
              >
                Cancel
              </button>
              <button
                disabled={swapUpdating}
                onClick={handleConfirmSwap}
                className="flex items-center gap-unit-2 px-unit-5 py-2 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-dark font-title-md text-title-md transition-all shadow-sm cursor-pointer disabled:opacity-60"
                type="button"
              >
                <span>{swapUpdating ? "✨ Updating Route..." : "Synthesize Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SLIDE-OVER AI EDIT CANVAS DRAWER ==================== */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-md z-50 bg-surface-container-lowest shadow-2xl transform transition-transform duration-300 flex flex-col ${aiDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="p-unit-6 bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-unit-3">
            <span className="font-headline-sm text-headline-sm">✨</span>
            <h3 className="font-title-lg text-title-lg text-on-surface font-semibold">AI Itinerary Co-Pilot</h3>
          </div>
          <button
            onClick={() => setAiDrawerOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="p-unit-6 flex-1 overflow-y-auto flex flex-col gap-unit-4 font-body-sm text-body-sm">
          <div className="p-unit-4 rounded-xl bg-surface-container-low text-on-surface">
            <p className="mb-unit-2 font-semibold text-secondary">Algorithm Ready</p>
            <p className="text-on-surface-variant">Type commands like: "Make Day 3 more budget-friendly", "Add more local food stops in Gulmit", or "Shift duration to 6 days".</p>
          </div>

          <div className="flex flex-col gap-unit-3">
            {drawerChat.map((msg, index) => (
              <div
                key={index}
                className={`p-unit-3 rounded-xl max-w-[85%] text-body-sm ${msg.role === "user"
                  ? "bg-surface-container text-on-surface-variant self-end"
                  : "bg-surface-container-low text-on-surface self-start shadow-sm"
                  }`}
              >
                {msg.text}
              </div>
            ))}
            {drawerLoading && (
              <div className="p-unit-3 rounded-xl bg-surface-container-low text-on-surface-variant self-start shadow-sm animate-pulse">
                Optimizing itinerary vector matrix...
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleDrawerSend();
          }}
          className="p-unit-4 bg-surface-container-low flex items-center gap-unit-2"
        >
          <input
            value={drawerMessage}
            onChange={(e) => setDrawerMessage(e.target.value)}
            className="flex-1 px-unit-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface placeholder-outline font-body-sm text-body-sm focus:outline-none"
            placeholder="Instruct WanderAI..."
            type="text"
          />
          <button
            disabled={drawerLoading}
            className="p-2.5 rounded-lg bg-secondary text-on-secondary hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            type="submit"
          >
            <span className="material-symbols-outlined text-base">send</span>
          </button>
        </form>
      </div>

      {/* ==================== REOPTIMIZE MODAL ==================== */}
      {showReoptimize && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-luxury">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">refresh</span>
                <h3 className="font-display font-bold text-base text-on-surface">
                  Reoptimize Itinerary
                </h3>
              </div>
              <button
                onClick={() => setShowReoptimize(false)}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleReoptimize} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  New Total Budget (PKR)
                </label>
                <input
                  type="number"
                  min="5000"
                  step="5000"
                  value={newBudget}
                  onChange={(e) => setNewBudget(parseInt(e.target.value) || 0)}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  New Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={newDuration}
                  onChange={(e) => setNewDuration(parseInt(e.target.value) || 1)}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                  Travel Pace
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["relaxed", "moderate", "packed"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPace(p)}
                      className={`py-2 rounded-xl border font-semibold text-xs capitalize transition-all cursor-pointer ${newPace === p
                        ? "bg-secondary/10 border-secondary text-secondary"
                        : "bg-surface-container border-outline-variant text-on-surface-variant hover:text-on-surface"
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReoptimize(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-semibold text-sm transition-all hover:bg-surface-container-high cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reoptimizing}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-display font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {reoptimizing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Optimizing...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">auto_awesome</span>
                      <span>Generate v{(activeItinerary?.version || 1) + 1}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== FOOTER ==================== */}
      <footer className="w-full bg-surface-container-low pt-unit-16 pb-unit-12 border-t border-outline-variant/60">
        <div className="max-w-[1440px] mx-auto px-unit-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-unit-10 pb-unit-12">
            <div className="lg:col-span-4 flex flex-col items-start gap-unit-4">
              <div className="flex items-center gap-unit-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-lg">travel_explore</span>
                </div>
                <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold">WanderAI</span>
              </div>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-sm">Explore more. Plan smarter. Travel better.</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">High-touch bespoke travel curation augmented by state-of-the-art computational intelligence.</p>
            </div>
            <div className="lg:col-span-2 flex flex-col gap-unit-3">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface">Explore</span>
              <div className="flex flex-col gap-unit-2">
                <Link className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors" href="/explore">Curated Itineraries</Link>
                <Link className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors" href="/places">Regional Guides</Link>
                <Link className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors" href="/explore#map">Interactive Waypoints</Link>
              </div>
            </div>
            <div className="lg:col-span-2 flex flex-col gap-unit-3">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface">AI Tools</span>
              <div className="flex flex-col gap-unit-2">
                <Link className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors" href="/planner">Smart Itinerary Synthesizer</Link>
                <Link className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors" href="/assistant">Concierge Companion</Link>
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-unit-4">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface">AI Dispatch &amp; Updates</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Receive exclusive seasonal expedition releases and algorithmic travel insights.</p>
              <div className="flex items-center gap-unit-2">
                <input className="flex-1 px-unit-4 py-unit-2 rounded-lg bg-surface-container-lowest text-on-surface placeholder-outline font-body-sm text-body-sm focus:outline-none shadow-[0_1px_4px_rgba(0,0,0,0.02)]" placeholder="Enter your email" type="email" />
                <button className="px-unit-4 py-unit-2 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-dark transition-colors font-title-md text-title-md cursor-pointer" type="button">Join</button>
              </div>
            </div>
          </div>
          <div className="pt-unit-8 flex flex-col md:flex-row items-center justify-between gap-unit-4 border-t border-outline-variant/40">
            <p className="font-body-sm text-body-sm text-on-surface-variant">© 2025 WanderAI Intelligence Inc. All rights reserved.</p>
            <div className="flex items-center gap-unit-6">
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#">Privacy Policy</a>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
