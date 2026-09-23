"use client";

import React, { useMemo } from "react";
import { ItineraryDay } from "@/types";

interface TerrainSafetySentinelProps {
  userVehicle?: "sedan" | "crossover" | "suv_4x4";
  days: ItineraryDay[];
  destinationName?: string;
  onVehicleChange?: (vehicle: "sedan" | "crossover" | "suv_4x4") => void;
}

interface IncompatibleStop {
  placeName: string;
  dayNumber: number;
  requiredAccess: string;
  elevationMeters?: number;
  jeepHireStand?: string;
  estimatedJeepFarePkr?: string;
  hazardNote: string;
}

const KNOWN_4X4_CORRIDORS = [
  {
    keywords: ["deosai", "sheosar", "kala pani", "bara pani", "shatung"],
    access: "Dedicated High-Clearance 4x4",
    jeepStand: "Skardu Jeep Stand / Astore",
    fare: "PKR 18,000 – 22,000 (Full Day Safari)",
    hazard: "Rocky glacial tracks, deep water river crossings (Kala Pani), and lack of tarmac.",
  },
  {
    keywords: ["fairy meadows", "tattu", "raikot"],
    access: "Local Raikot 4x4 Jeep Only",
    jeepStand: "Raikot Bridge Jeep Union",
    fare: "PKR 10,000 – 12,000 (Fixed Union Rate Roundtrip)",
    hazard: "Narrow unpaved cliffside track. Private vehicles strictly prohibited by district administration.",
  },
  {
    keywords: ["saif-ul-malook", "saiful maluk", "jheel saif"],
    access: "4x4 Jeep / High Clearance",
    jeepStand: "Naran Jeep Stand",
    fare: "PKR 8,000 – 10,000 (Roundtrip with 2hr stay)",
    hazard: "Steep mountain incline, loose shale, and heavy seasonal mud ruts.",
  },
  {
    keywords: ["shimshal", "passu suspension"],
    access: "High-Torque 4x4 Jeep",
    jeepStand: "Passu / Gulmit",
    fare: "PKR 15,000 – 18,000",
    hazard: "Gorge road with overhang cliffs and unbridged stream crossings.",
  },
  {
    keywords: ["kumrat", "jahaz banda", "katora"],
    access: "4x4 Jeep (Thal to Forest)",
    jeepStand: "Thal Bazaar Jeep Stand",
    fare: "PKR 12,000 – 15,000",
    hazard: "Deep mud ruts, wet riverbed driving, and excessive boulder clearance.",
  },
  {
    keywords: ["cholistan", "derawar fort dunes", "desert safari"],
    access: "4x4 Dune Capable / High-Clearance",
    jeepStand: "Bahawalpur / Ahmedpur East",
    fare: "PKR 14,000 – 18,000",
    hazard: "Deep sand sinkage and extreme desert heat. Requires deflated all-terrain tires.",
  },
];

export default function TerrainSafetySentinel({
  userVehicle = "crossover",
  days,
  destinationName = "Pakistan",
  onVehicleChange,
}: TerrainSafetySentinelProps) {
  // Analyze itinerary items for vehicle terrain conflicts
  const incompatibleStops = useMemo(() => {
    const conflicts: IncompatibleStop[] = [];

    days.forEach((day) => {
      day.items.forEach((item) => {
        const place = item.place;
        const pName = place.name.toLowerCase();
        const pDesc = (place.description || "").toLowerCase();
        const access = place.vehicle_access || "sedan";

        // Check against known 4x4 corridors
        const corridorMatch = KNOWN_4X4_CORRIDORS.find((c) =>
          c.keywords.some((k) => pName.includes(k) || pDesc.includes(k))
        );

        const requires4x4 = access === "4x4_jeep" || Boolean(corridorMatch);

        if (requires4x4 && userVehicle !== "suv_4x4") {
          conflicts.push({
            placeName: place.name,
            dayNumber: day.day_number,
            requiredAccess: corridorMatch?.access || "High-Clearance 4x4 Jeep",
            elevationMeters: place.elevation_meters,
            jeepHireStand: corridorMatch?.jeepStand || `${destinationName} Local Jeep Stand`,
            estimatedJeepFarePkr: corridorMatch?.fare || "PKR 10,000 – 15,000",
            hazardNote:
              corridorMatch?.hazard ||
              "Rocky unpaved mountain trail with severe risk of undercarriage scraping and oil pan puncture for sedans.",
          });
        }
      });
    });

    return conflicts;
  }, [days, userVehicle, destinationName]);

  const isCompatible = incompatibleStops.length === 0;

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 shadow-xs border transition-all ${
        isCompatible
          ? "bg-surface-container-lowest border-emerald-500/40"
          : "bg-surface-container-lowest border-amber-500/50"
      }`}
    >
      {/* Compact Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/40">
        <div className="flex items-center gap-2.5">
          {/* Decorative icon: hidden on mobile */}
          <div
            className={`hidden sm:flex w-8 h-8 rounded-xl items-center justify-center shrink-0 ${
              isCompatible
                ? "bg-emerald-500/15 text-emerald-700"
                : "bg-amber-500/15 text-amber-700"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {isCompatible ? "verified_user" : "warning"}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-secondary">
                Vehicle-Terrain Sentinel
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  isCompatible
                    ? "bg-emerald-500/15 text-emerald-800"
                    : "bg-amber-500/20 text-amber-900"
                }`}
              >
                {isCompatible ? "TERRAIN OK" : `${incompatibleStops.length} 4X4 ALERTS`}
              </span>
            </div>
            <h3 className="font-display text-sm sm:text-base font-bold text-on-surface">
              {isCompatible
                ? "Road & Elevation Clearance Confirmed"
                : "Vehicle-Terrain Mismatch Detected"}
            </h3>
          </div>
        </div>

        {/* Vehicle Selector Pills */}
        <div className="flex items-center gap-1 p-1 bg-surface-container rounded-xl border border-outline-variant/50 self-start sm:self-auto">
          {[
            { id: "sedan", label: "Sedan" },
            { id: "crossover", label: "Crossover" },
            { id: "suv_4x4", label: "4x4 Rig" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => onVehicleChange && onVehicleChange(v.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                userVehicle === v.id
                  ? "bg-secondary text-white font-bold shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              type="button"
            >
              <span>{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Concise Body */}
      <div className="pt-3">
        {isCompatible ? (
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Your configured vehicle (
            <strong className="font-semibold text-on-surface capitalize">
              {userVehicle === "suv_4x4"
                ? "Heavy 4x4 Rig"
                : userVehicle === "crossover"
                ? "Crossover AWD"
                : "Standard Sedan"}
            </strong>
            ) has verified ground clearance for all {days.reduce((acc, d) => acc + d.items.length, 0)} planned waypoints on this corridor.
          </p>
        ) : (
          <div className="space-y-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-950 flex items-start gap-2">
              <span className="hidden sm:inline material-symbols-outlined text-sm text-amber-700 shrink-0 mt-0.5">
                fmd_bad
              </span>
              <p className="leading-relaxed">
                <strong>4x4 Trail Advisory:</strong> Your route includes rugged off-road/mountain sectors where low-clearance passenger cars risk oil pan or bumper damage.
              </p>
            </div>

            {/* Incompatible Stop Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {incompatibleStops.map((stop, sIdx) => (
                <div
                  key={sIdx}
                  className="bg-surface-container-low rounded-xl p-3 border border-amber-500/30 flex flex-col justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-900">
                        Day {stop.dayNumber}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-mono">
                        {stop.requiredAccess}
                      </span>
                    </div>
                    <div className="font-bold text-on-surface text-xs sm:text-sm">
                      {stop.placeName}
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed line-clamp-2">
                      {stop.hazardNote}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-outline-variant/40 flex items-center justify-between text-[11px]">
                    <span className="text-secondary font-semibold">
                      Stand: {(stop.jeepHireStand || "Local Stand").split("/")[0]}
                    </span>
                    <span className="font-mono text-on-surface-variant">
                      {(stop.estimatedJeepFarePkr || "Standard Rate").split("(")[0]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
