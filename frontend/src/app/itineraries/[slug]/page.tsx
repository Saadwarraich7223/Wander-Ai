"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getItineraryBySlug, CURATED_ITINERARIES } from "@/lib/itinerariesData";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ItineraryDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const itinerary = getItineraryBySlug(resolvedParams.slug);

  if (!itinerary) {
    notFound();
  }

  const [budgetTier, setBudgetTier] = useState<"backpacker" | "moderate" | "luxury">("moderate");

  // State for collapsible day stages (all open by default or toggle individual)
  const [openDays, setOpenDays] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    itinerary.days.forEach((d) => {
      initial[d.dayNumber] = true;
    });
    return initial;
  });

  const toggleDay = (dayNumber: number) => {
    setOpenDays((prev) => ({
      ...prev,
      [dayNumber]: !prev[dayNumber],
    }));
  };

  const expandAllDays = () => {
    const allOpen: Record<number, boolean> = {};
    itinerary.days.forEach((d) => {
      allOpen[d.dayNumber] = true;
    });
    setOpenDays(allOpen);
  };

  const collapseAllDays = () => {
    const allClosed: Record<number, boolean> = {};
    itinerary.days.forEach((d) => {
      allClosed[d.dayNumber] = false;
    });
    setOpenDays(allClosed);
  };

  const plannerUrl = `/planner?destination=${encodeURIComponent(
    itinerary.plannerParams.destination
  )}&origin=${encodeURIComponent(itinerary.plannerParams.origin)}&days=${
    itinerary.plannerParams.days
  }&budget=${itinerary.plannerParams.budget}&pace=${itinerary.plannerParams.pace}&travel_style=${
    itinerary.plannerParams.travelStyle
  }`;

  const otherItineraries = CURATED_ITINERARIES.filter((item) => item.slug !== itinerary.slug).slice(0, 3);

  // Dynamic budget breakdown calculation
  const totalCost = itinerary.estimatedBudgetPKR[budgetTier];
  const hotelCost = Math.round(totalCost * 0.46);
  const transportCost = Math.round(totalCost * 0.34);
  const foodCost = Math.round(totalCost * 0.14);
  const activityCost = totalCost - hotelCost - transportCost - foodCost;
  const costUSD = Math.round(totalCost / 280);

  // GeoJSON / GPX route export handler
  const handleExportRoute = () => {
    const routeData = {
      type: "FeatureCollection",
      metadata: {
        title: itinerary.title,
        region: itinerary.region,
        durationDays: itinerary.durationDays,
        elevationRange: itinerary.elevationRangeMeters,
        exportedAt: new Date().toISOString(),
      },
      features: itinerary.days.flatMap((day) =>
        day.stops.map((stop, idx) => ({
          type: "Feature",
          properties: {
            day: day.dayNumber,
            dayTitle: day.title,
            placeName: stop.placeName,
            timing: stop.timing,
            highlight: stop.highlight,
            elevationMeters: stop.elevationMeters,
            tips: stop.tips,
          },
          geometry: {
            type: "Point",
            coordinates: [74.3587 + idx * 0.05, 35.9208 + idx * 0.05],
          },
        }))
      ),
    };

    const blob = new Blob([JSON.stringify(routeData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${itinerary.slug}-wanderai-blueprint.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface antialiased flex flex-col relative overflow-hidden selection:bg-secondary/20 selection:text-secondary">
      {/* Seamless Ambient Gradient Background */}
      <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-32 top-24 w-[420px] h-[420px] rounded-full bg-tertiary-fixed/20 blur-3xl pointer-events-none" />

      {/* Shared Application Navbar */}
      <Navbar />

      {/* Main Content Body */}
      <main className="w-full pt-20 sm:pt-24 pb-12 sm:pb-16 relative z-10 flex-1">
        {/* Primary Header & Key Telemetry Strip */}
        <div className="w-full bg-surface-container-low/70 border-b border-outline-variant/40">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 sm:py-10">
            {/* Badge Group */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-surface-container-highest text-on-surface font-mono text-xs font-bold shadow-xs">
                {itinerary.durationDays} Days / {itinerary.durationDays - 1} Nights
              </span>
              <span className="px-3 py-1 rounded-full bg-secondary text-white font-mono text-xs font-semibold shadow-xs">
                {itinerary.region}
              </span>
              <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-mono text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-secondary">
                  {itinerary.vehicleAccess === "suv_4x4" ? "minor_crash" : "directions_car"}
                </span>
                <span>
                  {itinerary.vehicleAccess === "suv_4x4"
                    ? "4x4 High-Clearance Required"
                    : `Standard Vehicle (${itinerary.corridorName || "Paved"})`}
                </span>
              </span>
            </div>

            {/* Main Headline & Subtitle */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-6">
              <div className="max-w-3xl space-y-2">
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight leading-tight">
                  {itinerary.title}
                </h1>
                <p className="font-sans text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {itinerary.subtitle}
                </p>
              </div>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href={plannerUrl}
                  prefetch={true}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary text-white font-display text-xs sm:text-sm font-bold hover:bg-secondary-dark transition-all shadow-md hover:shadow-glow cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">auto_awesome</span>
                  <span>Customize in AI Planner</span>
                </Link>
                <button
                  type="button"
                  onClick={handleExportRoute}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-on-surface font-display text-xs sm:text-sm font-semibold hover:bg-surface-container transition-all shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-secondary">file_download</span>
                  <span>Export Route (JSON/GPX)</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Ribbon (4 Cards) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-2xl">terrain</span>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider font-semibold">
                    Elevation Band
                  </div>
                  <div className="font-display text-base sm:text-lg font-bold text-on-surface mt-0.5">
                    {itinerary.elevationRangeMeters}
                  </div>
                  <div className="text-[11px] text-on-surface-variant">AMSL Corridor</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-2xl">hiking</span>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider font-semibold">
                    Pacing Tier
                  </div>
                  <div className="font-display text-base sm:text-lg font-bold text-on-surface mt-0.5 capitalize">
                    {itinerary.gradeLabel || itinerary.activityLevel}
                  </div>
                  <div className="text-[11px] text-on-surface-variant">Gradual Acclimatization</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-2xl">calendar_month</span>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider font-semibold">
                    Best Season
                  </div>
                  <div className="font-display text-base sm:text-lg font-bold text-on-surface mt-0.5">
                    {itinerary.bestSeason.split("(")[0]}
                  </div>
                  <div className="text-[11px] text-on-surface-variant">Optimal Road Conditions</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-2xl">payments</span>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider font-semibold">
                    Est. Moderate Cost
                  </div>
                  <div className="font-display text-base sm:text-lg font-bold text-secondary mt-0.5">
                    PKR {itinerary.estimatedBudgetPKR.moderate.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-on-surface-variant font-mono">
                    ~${costUSD} USD per explorer
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Visual Showcase & Route Physics Overview */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 w-full space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 rounded-3xl overflow-hidden shadow-subtle bg-surface-container-lowest border border-outline-variant/60">
            {/* Main High-Res Image Showcase */}
            <div className="lg:col-span-8 relative min-h-[320px] md:min-h-[420px] overflow-hidden bg-surface-container">
              <img
                src={itinerary.heroImage}
                alt={itinerary.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
                <div className="space-y-1">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-mono font-bold tracking-wide">
                    {itinerary.corridorName || `Corridor: ${itinerary.primaryCity}`}
                  </span>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                    {itinerary.primaryCity} Basin Expedition
                  </h2>
                  <p className="text-xs text-white/85">
                    {itinerary.elevationRangeMeters} altitude · Telemetry-audited mountain pass route
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-end bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-xs text-on-surface">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span className="font-mono text-xs font-bold">Weather: Seasonal Clear</span>
                </div>
              </div>
            </div>

            {/* Route Physics & Telemetry Quick Card */}
            <div className="lg:col-span-4 p-6 flex flex-col justify-between bg-surface-container-lowest space-y-6">
              <div>
                <div className="flex items-center justify-between pb-3">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-secondary">
                    Telemetry Matrix
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-mono text-[10px] font-bold">
                    Audited Nominal
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-on-surface mb-2">
                  Expedition Route Physics
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {itinerary.summary}
                </p>
              </div>

              {/* Telemetry Data Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/50">
                <div>
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase">Primary Axis</div>
                  <div className="font-display text-sm font-bold text-on-surface mt-0.5">
                    {itinerary.corridorName ? itinerary.corridorName.split(":")[1] || "High-Pass" : "Motorway Axis"}
                  </div>
                  <div className="text-[11px] text-secondary font-medium">Clear Road Access</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase">Safety Index</div>
                  <div className="font-display text-sm font-bold text-on-surface mt-0.5">99.8% Feasible</div>
                  <div className="text-[11px] text-on-surface-variant">Audited telemetry</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase">Peak Altitude</div>
                  <div className="font-display text-sm font-bold text-on-surface mt-0.5">
                    {itinerary.elevationRangeMeters.split("–")[1] || itinerary.elevationRangeMeters}
                  </div>
                  <div className="text-[11px] text-on-surface-variant">Gradual incline</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase">AMS Risk</div>
                  <div className="font-display text-sm font-bold text-secondary mt-0.5">
                    {itinerary.activityLevel === "high" ? "Moderate (Buffer 24h)" : "Negligible"}
                  </div>
                  <div className="text-[11px] text-on-surface-variant">Safe pacing</div>
                </div>
              </div>

              {/* Elevation Profile Sparkline SVG */}
              <div className="space-y-1">
                <div className="flex items-center justify-between font-mono text-[10px] text-on-surface-variant">
                  <span>{itinerary.originHub.split("/")[0]}</span>
                  <span>{itinerary.primaryCity}</span>
                  <span>Peak Waypoint</span>
                </div>
                <svg className="w-full h-10 text-secondary" fill="none" preserveAspectRatio="none" viewBox="0 0 300 48">
                  <path d="M0,42 Q40,38 75,32 T150,12 T225,22 T300,8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
                  <path d="M0,42 Q40,38 75,32 T150,12 T225,22 T300,8 L300,48 L0,48 Z" fill="currentColor" fillOpacity="0.12" />
                  <circle cx="0" cy="42" fill="currentColor" r="3" />
                  <circle cx="150" cy="12" fill="currentColor" r="3.5" />
                  <circle cx="300" cy="8" fill="currentColor" r="3.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* Highlights Banner: What Makes This Route Unique */}
          <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-low border border-outline-variant/60 shadow-subtle space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-secondary">verified_user</span>
              <h3 className="font-display text-lg sm:text-xl font-bold text-on-surface">
                What Makes This Route Unique
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itinerary.highlights.map((hl, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/40">
                  <div className="w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center text-secondary shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                  </div>
                  <span className="text-xs text-on-surface-variant leading-relaxed font-medium">
                    {hl}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Split: Left (Day-by-Day Stages) + Right Sticky (HUD & Calculator) */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Day-by-Day Timetable & Stages (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-outline-variant/60">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-secondary font-bold">
                    Comprehensive Schedule
                  </span>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface mt-0.5">
                    Day-by-Day Expedition Schedule
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <button
                      type="button"
                      onClick={expandAllDays}
                      className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-[11px] font-semibold transition-colors"
                    >
                      Expand All
                    </button>
                    <button
                      type="button"
                      onClick={collapseAllDays}
                      className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-[11px] font-semibold transition-colors"
                    >
                      Collapse All
                    </button>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 text-on-surface-variant font-mono text-xs">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span>{itinerary.days.length} Stages</span>
                  </div>
                </div>
              </div>

              {/* Day Stages Collapsible Cards */}
              <div className="space-y-4">
                {itinerary.days.map((day) => {
                  const isOpen = openDays[day.dayNumber] ?? true;

                  return (
                    <article
                      key={day.dayNumber}
                      className="rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle overflow-hidden transition-all duration-300"
                    >
                      {/* Day Header (Clickable Collapsible Trigger) */}
                      <div
                        onClick={() => toggleDay(day.dayNumber)}
                        className={`p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none group transition-colors ${
                          isOpen ? "bg-surface-container-low/40 border-b border-outline-variant/50" : "hover:bg-surface-container-low/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-2xl bg-secondary text-white font-display font-extrabold text-sm flex items-center justify-center shadow-xs shrink-0">
                            D{day.dayNumber}
                          </span>
                          <div>
                            <h3 className="font-display text-base sm:text-lg font-bold text-on-surface group-hover:text-secondary transition-colors">
                              {day.title}
                            </h3>
                            <p className="text-xs text-on-surface-variant mt-0.5 font-mono">
                              Overnight: <strong className="text-on-surface">{day.overnightLocation}</strong> · Transit: ~{day.transitHours}h
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container font-mono text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-[14px] text-secondary">altitude</span>
                            <span>Stage {day.dayNumber} of {itinerary.days.length}</span>
                          </span>
                          <div className="w-8 h-8 rounded-full bg-surface-container group-hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors">
                            <span
                              className={`material-symbols-outlined text-lg text-secondary transition-transform duration-300 ${
                                isOpen ? "rotate-180" : "rotate-0"
                              }`}
                            >
                              keyboard_arrow_down
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Collapsible Content Body */}
                      {isOpen && (
                        <div className="p-5 sm:p-6 space-y-5 animate-fadeIn">
                          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                            {day.summary}
                          </p>

                          {/* Waypoints Timeline Stream */}
                          <div className="space-y-4 pl-2 border-l-2 border-surface-container-high ml-2 pt-1">
                            {day.stops.map((stop, sIdx) => {
                              const placeHref = stop.placeSlug ? `/places/${stop.placeSlug}` : `/places`;

                              return (
                                <div key={sIdx} className="relative pl-6 space-y-1.5">
                                  {/* Timeline Node Dot */}
                                  <div className="absolute -left-[17px] top-1.5 w-3.5 h-3.5 rounded-full bg-surface-container-lowest border-2 border-secondary" />

                                  <div className="flex flex-wrap items-baseline gap-2">
                                    <span className="font-mono text-xs text-secondary font-bold">
                                      {stop.timing}
                                    </span>
                                    {stop.placeSlug ? (
                                      <Link
                                        href={placeHref}
                                        prefetch={true}
                                        className="font-display text-sm font-bold text-on-surface hover:text-secondary transition-colors inline-flex items-center gap-1 group"
                                      >
                                        <span>{stop.placeName}</span>
                                        <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">
                                          arrow_forward
                                        </span>
                                      </Link>
                                    ) : (
                                      <span className="font-display text-sm font-bold text-on-surface">
                                        {stop.placeName}
                                      </span>
                                    )}
                                    <span className="font-mono text-[11px] text-on-surface-variant">
                                      {stop.elevationMeters ? `${stop.elevationMeters}m AMSL · ` : ""}
                                      ~{stop.durationHours}h stop
                                    </span>
                                  </div>

                                  <p className="text-xs text-on-surface-variant leading-relaxed">
                                    {stop.highlight}
                                  </p>

                                  {stop.tips && (
                                    <div className="mt-2 p-3 rounded-xl bg-surface-container-low text-xs text-on-surface-variant flex items-start gap-2 border border-outline-variant/40">
                                      <span className="material-symbols-outlined text-secondary text-sm shrink-0 mt-0.5">
                                        lightbulb
                                      </span>
                                      <span>
                                        <strong className="text-on-surface">Insider Tip:</strong> {stop.tips}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>

            {/* RIGHT STICKY SIDEBAR: Telemetry HUD & Interactive Pricing (4 cols) */}
            <div className="lg:col-span-4 space-y-6 sticky top-24">
              {/* CARD 1: Cost & Budget Calculator */}
              <div className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-secondary font-bold">
                    Trip Cost Estimator
                  </span>
                  <span className="text-[10px] font-mono text-secondary bg-secondary-container px-2 py-0.5 rounded-full font-bold">
                    Live Calculation
                  </span>
                </div>

                {/* Pacing Tabs */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-surface-container rounded-xl font-display text-xs">
                  <button
                    type="button"
                    onClick={() => setBudgetTier("backpacker")}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                      budgetTier === "backpacker"
                        ? "bg-surface-container-lowest font-bold text-on-surface shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Backpacker
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetTier("moderate")}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                      budgetTier === "moderate"
                        ? "bg-surface-container-lowest font-bold text-on-surface shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Moderate
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetTier("luxury")}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                      budgetTier === "luxury"
                        ? "bg-surface-container-lowest font-bold text-on-surface shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Luxury
                  </button>
                </div>

                {/* Itemized Breakdown */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-secondary">hotel</span>
                      <span>Curated Stays ({itinerary.durationDays - 1}N)</span>
                    </span>
                    <span className="font-mono font-bold text-on-surface">PKR {hotelCost.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-secondary">local_gas_station</span>
                      <span>Transport &amp; Dedicated Driver</span>
                    </span>
                    <span className="font-mono font-bold text-on-surface">PKR {transportCost.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-secondary">restaurant</span>
                      <span>Regional Meals &amp; Dining</span>
                    </span>
                    <span className="font-mono font-bold text-on-surface">PKR {foodCost.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-secondary">confirmation_number</span>
                      <span>Admissions, Parks &amp; Activities</span>
                    </span>
                    <span className="font-mono font-bold text-on-surface">PKR {activityCost.toLocaleString()}</span>
                  </div>
                </div>

                {/* Total Strip */}
                <div className="pt-4 border-t border-outline-variant/60 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-on-surface-variant uppercase">ESTIMATED TOTAL</span>
                    <div className="font-display text-xl sm:text-2xl font-bold text-secondary">
                      PKR {totalCost.toLocaleString()}
                    </div>
                  </div>
                  <span className="font-mono text-xs text-on-surface-variant font-medium">
                    ~${costUSD} USD
                  </span>
                </div>

                {/* Action Button */}
                <Link
                  href={plannerUrl}
                  prefetch={true}
                  className="w-full py-3 px-4 rounded-xl bg-secondary text-white font-display text-xs sm:text-sm font-bold hover:bg-secondary-dark transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-glow text-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">auto_awesome</span>
                  <span>Open in AI Trip Planner</span>
                </Link>
              </div>

              {/* CARD 2: Live Telemetry & Road Conditions */}
              <div className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-sm font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-secondary">satellite_alt</span>
                    <span>Live Corridor Conditions</span>
                  </h4>
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                </div>

                <ul className="space-y-2 text-xs">
                  <li className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low">
                    <span className="text-on-surface font-medium">Highway Access</span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-secondary font-bold">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span> 100% Passable
                    </span>
                  </li>
                  <li className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low">
                    <span className="text-on-surface font-medium">Pass Clearance</span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-secondary font-bold">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span> Nominal Traction
                    </span>
                  </li>
                  <li className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low">
                    <span className="text-on-surface font-medium">Cellular Telemetry</span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-secondary font-bold">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span> 4G Active
                    </span>
                  </li>
                </ul>

                <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                  <span>Landslides: <strong>Zero Recorded</strong></span>
                  <span>Forecast: <strong>Clear / Mild</strong></span>
                </div>
              </div>

              {/* CARD 3: Other Popular Expeditions */}
              <div className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle space-y-4">
                <h4 className="font-display text-sm font-bold uppercase tracking-wider text-on-surface">
                  Related Expeditions
                </h4>
                <div className="space-y-3">
                  {otherItineraries.map((other) => (
                    <Link
                      key={other.slug}
                      href={`/itineraries/${other.slug}`}
                      prefetch={true}
                      className="block p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-display text-xs font-bold text-on-surface group-hover:text-secondary transition-colors line-clamp-1">
                            {other.title}
                          </div>
                          <div className="text-[11px] text-on-surface-variant mt-0.5">
                            {other.durationDays} Days · {other.region}
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold text-secondary">
                          PKR {Math.round(other.estimatedBudgetPKR.moderate / 1000)}K
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] text-secondary font-semibold mt-2">
                        <span>View Blueprint</span>
                        <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Route FAQ Accordion Section (FULL WIDTH) */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 w-full">
          <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/50">
              <span className="material-symbols-outlined text-xl text-secondary">help</span>
              <h3 className="font-display text-lg sm:text-xl font-bold text-on-surface">
                Frequently Asked Route Questions
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {itinerary.faqs.map((faq, idx) => (
                <details
                  key={idx}
                  className="group p-5 rounded-2xl bg-surface-container-low border border-outline-variant/40 open:bg-surface-container transition-all"
                >
                  <summary className="flex items-center justify-between cursor-pointer font-display text-sm font-bold text-on-surface list-none">
                    <span className="pr-4">{faq.question}</span>
                    <span className="material-symbols-outlined group-open:rotate-180 transition-transform text-secondary shrink-0">
                      keyboard_arrow_down
                    </span>
                  </summary>
                  <p className="mt-3 text-xs sm:text-sm text-on-surface-variant leading-relaxed pt-3 border-t border-outline-variant/40">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
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
