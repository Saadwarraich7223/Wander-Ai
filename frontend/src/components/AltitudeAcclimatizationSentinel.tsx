"use client";

import React, { useMemo } from "react";
import { ItineraryDay } from "@/types";

interface AltitudeAcclimatizationSentinelProps {
  days: ItineraryDay[];
  originAltitudeMeters?: number;
  destinationName?: string;
  onOpenSOSModal?: () => void;
}

interface DayAltitudeProfile {
  dayNumber: number;
  startAltMeters: number;
  peakAltMeters: number;
  peakPlaceName: string;
  altitudeGainMeters: number;
  isHighRiskDay: boolean;
}

export default function AltitudeAcclimatizationSentinel({
  days,
  originAltitudeMeters = 500,
  destinationName = "Pakistan",
  onOpenSOSModal,
}: AltitudeAcclimatizationSentinelProps) {
  // Calculate day-by-day altitude progression
  const altitudeAnalysis = useMemo(() => {
    let currentBaseAlt = originAltitudeMeters;
    let maxTripElevation = originAltitudeMeters;
    let maxSingleDayGain = 0;
    const dayProfiles: DayAltitudeProfile[] = [];

    const isDesertPlains =
      destinationName.toLowerCase().includes("bahawalpur") ||
      destinationName.toLowerCase().includes("cholistan") ||
      destinationName.toLowerCase().includes("multan") ||
      destinationName.toLowerCase().includes("thar") ||
      destinationName.toLowerCase().includes("karachi") ||
      destinationName.toLowerCase().includes("lahore");

    days.forEach((day, index) => {
      let dayPeak = currentBaseAlt;
      let peakName = `Day ${day.day_number} Waypoints`;

      day.items.forEach((item) => {
        const alt = item.place.elevation_meters || 0;
        if (alt > dayPeak) {
          dayPeak = alt;
          peakName = item.place.name;
        }
      });

      // Regional elevation fallbacks
      if (isDesertPlains) {
        dayPeak = 115 + (index % 2) * 15; // Bahawalpur/Cholistan ~115m - 130m AMSL
      } else if (dayPeak === currentBaseAlt && destinationName.toLowerCase().includes("hunza")) {
        dayPeak = 2450 + index * 350;
      } else if (dayPeak === currentBaseAlt && destinationName.toLowerCase().includes("skardu")) {
        dayPeak = 2250 + index * 450;
      }

      const gain = Math.max(0, dayPeak - currentBaseAlt);
      if (gain > maxSingleDayGain) maxSingleDayGain = gain;
      if (dayPeak > maxTripElevation) maxTripElevation = dayPeak;

      const isHighRisk = gain >= 1500 && dayPeak >= 2800;

      dayProfiles.push({
        dayNumber: day.day_number,
        startAltMeters: currentBaseAlt,
        peakAltMeters: dayPeak,
        peakPlaceName: peakName,
        altitudeGainMeters: gain,
        isHighRiskDay: isHighRisk,
      });

      // Overnight base elevation for next day
      currentBaseAlt = dayPeak;
    });

    // Environment Zone Classification
    let zoneType: "alpine" | "foothills" | "desert_plains" = "desert_plains";
    let riskTier: "low" | "moderate" | "high" = "low";

    if (maxTripElevation >= 2800) {
      zoneType = "alpine";
      riskTier = maxTripElevation >= 3800 || maxSingleDayGain >= 1800 ? "high" : "moderate";
    } else if (maxTripElevation >= 1200) {
      zoneType = "foothills";
      riskTier = "low";
    } else {
      zoneType = "desert_plains";
      riskTier = "low";
    }

    return {
      dayProfiles,
      maxTripElevation,
      maxSingleDayGain,
      zoneType,
      riskTier,
      isDesertPlains,
    };
  }, [days, originAltitudeMeters, destinationName]);

  const { dayProfiles, maxTripElevation, maxSingleDayGain, zoneType, riskTier, isDesertPlains } =
    altitudeAnalysis;

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 shadow-xs border transition-all ${
        riskTier === "high"
          ? "bg-surface-container-lowest border-rose-500/40"
          : isDesertPlains
          ? "bg-surface-container-lowest border-amber-500/30"
          : "bg-surface-container-lowest border-emerald-500/40"
      }`}
    >
      {/* Sentinel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/40">
        <div className="flex items-center gap-2.5">
          {/* Decorative icon: hidden on mobile */}
          <div
            className={`hidden sm:flex w-8 h-8 rounded-xl items-center justify-center shrink-0 ${
              zoneType === "alpine" && riskTier === "high"
                ? "bg-rose-500/15 text-rose-700"
                : zoneType === "alpine"
                ? "bg-amber-500/15 text-amber-700"
                : zoneType === "desert_plains"
                ? "bg-amber-500/15 text-amber-800"
                : "bg-emerald-500/15 text-emerald-700"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {zoneType === "alpine"
                ? "terrain"
                : zoneType === "desert_plains"
                ? "wb_sunny"
                : "landscape"}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-secondary">
                {zoneType === "desert_plains"
                  ? "Desert & Lowland Climate Sentinel"
                  : "Altitude & Acclimatization Sentinel"}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  riskTier === "high"
                    ? "bg-rose-500/15 text-rose-900"
                    : isDesertPlains
                    ? "bg-amber-500/15 text-amber-900"
                    : "bg-emerald-500/15 text-emerald-900"
                }`}
              >
                {zoneType === "alpine" && riskTier === "high"
                  ? "HIGH AMS RISK"
                  : zoneType === "alpine"
                  ? "MODERATE ELEVATION"
                  : zoneType === "desert_plains"
                  ? "LOWLAND (0% AMS)"
                  : "SAFE ELEVATION"}
              </span>
            </div>
            <h3 className="font-display text-sm sm:text-base font-bold text-on-surface">
              {zoneType === "desert_plains"
                ? `Peak Elevation: ${maxTripElevation}m AMSL · Desert Climate & Diurnal Shifts`
                : `Peak: ${maxTripElevation.toLocaleString()}m AMSL · Max Gain: +${maxSingleDayGain.toLocaleString()}m/day`}
            </h3>
          </div>
        </div>

        {onOpenSOSModal && (
          <button
            onClick={onOpenSOSModal}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs border border-red-200 transition-colors self-start sm:self-auto cursor-pointer"
            type="button"
          >
            <span className="hidden sm:inline material-symbols-outlined text-xs">local_hospital</span>
            <span>Emergency Directory</span>
          </button>
        )}
      </div>

      {/* Body: Concise Progression & Guidelines */}
      <div className="pt-3 space-y-3">
        {/* Day Elevation Progress Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {dayProfiles.map((dp) => (
            <div
              key={dp.dayNumber}
              className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                dp.isHighRiskDay
                  ? "bg-rose-500/5 border-rose-500/30 text-rose-950"
                  : "bg-surface-container-low border-outline-variant/40 text-on-surface"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="font-bold">Day {dp.dayNumber}</span>
                <span
                  className={`text-[9px] font-bold px-1 rounded ${
                    dp.isHighRiskDay
                      ? "bg-rose-500/20 text-rose-800"
                      : "text-on-surface-variant"
                  }`}
                >
                  +{dp.altitudeGainMeters}m
                </span>
              </div>
              <div className="my-1.5">
                <div className="font-display text-base font-extrabold tracking-tight">
                  {dp.peakAltMeters.toLocaleString()}m
                </div>
                <div
                  className="text-[9px] text-on-surface-variant truncate"
                  title={dp.peakPlaceName}
                >
                  {dp.peakPlaceName}
                </div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    dp.peakAltMeters >= 4000
                      ? "bg-rose-600"
                      : dp.peakAltMeters >= 2800
                      ? "bg-amber-500"
                      : dp.peakAltMeters < 500
                      ? "bg-amber-600"
                      : "bg-secondary"
                  }`}
                  style={{
                    width: `${Math.max(
                      8,
                      Math.min(100, (dp.peakAltMeters / (isDesertPlains ? 200 : 5000)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Environmental & Clinical Guidelines */}
        {zoneType === "desert_plains" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-0.5">
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-start gap-2">
              <span className="hidden sm:inline material-symbols-outlined text-base text-amber-700 shrink-0 mt-0.5">
                water_drop
              </span>
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-on-surface block">Desert Hydration Target</span>
                <p className="text-on-surface-variant leading-relaxed text-[11px]">
                  Carry 4.0L clean water/day per person. Arid desert winds accelerate dehydration.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-start gap-2">
              <span className="hidden sm:inline material-symbols-outlined text-base text-amber-700 shrink-0 mt-0.5">
                thermostat
              </span>
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-on-surface block">Diurnal Temperature Shifts</span>
                <p className="text-on-surface-variant leading-relaxed text-[11px]">
                  Cholistan days reach 30°C+, but nights drop to 12°C–16°C. Keep warm layers for camp.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-start gap-2">
              <span className="hidden sm:inline material-symbols-outlined text-base text-secondary shrink-0 mt-0.5">
                tire_repair
              </span>
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-on-surface block">Dune Sand Pressure Protocol</span>
                <p className="text-on-surface-variant leading-relaxed text-[11px]">
                  Deflate tires to 16–18 PSI for deep sand trails beyond Derawar Fort to avoid sinkage.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-0.5">
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-start gap-2">
              <span className="hidden sm:inline material-symbols-outlined text-base text-secondary shrink-0 mt-0.5">
                water_drop
              </span>
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-on-surface block">Hydration Target</span>
                <p className="text-on-surface-variant leading-relaxed text-[11px]">
                  Drink 3.5 to 4.0L water daily. Avoid excessive caffeine or sleeping pills at high passes.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-start gap-2">
              <span className="hidden sm:inline material-symbols-outlined text-base text-secondary shrink-0 mt-0.5">
                bedtime
              </span>
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-on-surface block">Climb High, Sleep Low</span>
                <p className="text-on-surface-variant leading-relaxed text-[11px]">
                  When crossing high passes (&gt;3,500m), sleep at intermediate valley altitudes.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-start gap-2">
              <span className="hidden sm:inline material-symbols-outlined text-base text-rose-600 shrink-0 mt-0.5">
                medical_information
              </span>
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-on-surface block">Warning Symptoms</span>
                <p className="text-on-surface-variant leading-relaxed text-[11px]">
                  Persistent headache or nausea signals AMS. Descend 500m immediately and seek oxygen.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
