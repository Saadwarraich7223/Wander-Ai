"use client";

import React, { useState } from "react";
import { FieldIntelReport } from "@/lib/corridorIntel";

interface CorridorIntelModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeName: string;
  corridorName: string;
  placeId?: string;
  placeSlug?: string;
  cityId?: string;
  cityName?: string;
  tripId?: string;
  verifiedInTrip?: boolean;
  onSubmitReport: (report: FieldIntelReport) => void;
}

const ROAD_OPTIONS = [
  { id: "paved_clear", label: "Smooth Asphalt", sub: "100% Clear & Passable", icon: "verified" },
  { id: "patchy_potholes", label: "Patchy / Potholes", sub: "Drive with Care", icon: "warning" },
  { id: "jeep_4x4_only", label: "4x4 Jeep Only", sub: "Deep Ruts & Rocks", icon: "minor_crash" },
  { id: "landslide_blockage", label: "Active Landslide", sub: "Road Blocked", icon: "block" },
  { id: "snow_chains_req", label: "Snow / Black Ice", sub: "Chains Required", icon: "ac_unit" },
] as const;

const FUEL_OPTIONS = [
  { id: "fuel_ok", label: "Fuel OK", sub: "Petrol & Diesel in stock", icon: "local_gas_station" },
  { id: "petrol_only", label: "Petrol Only", sub: "Diesel unavailable", icon: "local_gas_station" },
  { id: "diesel_only", label: "Diesel Only", sub: "Petrol unavailable", icon: "local_gas_station" },
  { id: "no_fuel", label: "Station Dry", sub: "No fuel available", icon: "error" },
] as const;

const ATM_OPTIONS = [
  { id: "atm_ok", label: "ATM Cash OK", sub: "Dispensing cash", icon: "payments" },
  { id: "atm_empty", label: "ATM Empty", sub: "Out of order / offline", icon: "money_off" },
  { id: "cash_only", label: "Cash-Only Zone", sub: "No POS / Cards declined", icon: "payments" },
] as const;

export default function CorridorIntelModal({
  isOpen,
  onClose,
  placeName,
  corridorName,
  placeId,
  placeSlug,
  cityId,
  cityName,
  tripId,
  verifiedInTrip = true,
  onSubmitReport,
}: CorridorIntelModalProps) {
  const [roadCondition, setRoadCondition] = useState<FieldIntelReport["roadCondition"]>("paved_clear");
  const [fuelStatus, setFuelStatus] = useState<FieldIntelReport["fuelStatus"]>("fuel_ok");
  const [atmStatus, setAtmStatus] = useState<FieldIntelReport["atmStatus"]>("atm_ok");
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const report: FieldIntelReport = {
      id: `intel-${Date.now()}`,
      placeId,
      placeSlug,
      placeName,
      corridorName,
      cityId,
      cityName,
      tripId,
      verifiedInTrip,
      roadCondition,
      fuelStatus,
      atmStatus,
      note: note.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    setTimeout(() => {
      onSubmitReport(report);
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1200);
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="bg-surface-container-lowest rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-outline-variant/60 flex flex-col">
        {/* Header */}
        <div className="p-5 bg-surface-container-low border-b border-outline-variant/40 rounded-t-3xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-2xl">campaign</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider bg-secondary/15 text-secondary px-2 py-0.5 rounded-md">
                  Ground-Truth Intel
                </span>
                {verifiedInTrip && (
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-emerald-600">verified_user</span>
                    VERIFIED IN-TRIP EXPLORER
                  </span>
                )}
              </div>
              <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-on-surface mt-0.5">
                Live Field Status: {placeName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-outline-variant/60"
            type="button"
            title="Close"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">verified</span>
            </div>
            <h3 className="font-display font-bold text-lg text-on-surface">Field Status Broadcasted</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Your live observation for <strong>{placeName}</strong> is synchronized across the platform and helping all travelers on {corridorName}!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 flex-1">
            {/* Section 1: Road Passability */}
            <div>
              <label className="font-display font-bold text-xs text-on-surface uppercase tracking-wider block mb-2">
                1. Current Road Condition
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ROAD_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRoadCondition(opt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      roadCondition === opt.id
                        ? "bg-secondary text-white border-secondary shadow-xs"
                        : "bg-surface-container-low border-outline-variant/60 text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    <span className="font-bold text-xs">{opt.label}</span>
                    <span
                      className={`text-[10px] mt-0.5 ${
                        roadCondition === opt.id ? "text-white/80" : "text-on-surface-variant"
                      }`}
                    >
                      {opt.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Fuel Availability */}
            <div>
              <label className="font-display font-bold text-xs text-on-surface uppercase tracking-wider block mb-2">
                2. Fuel Pump Availability
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FUEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFuelStatus(opt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      fuelStatus === opt.id
                        ? "bg-secondary text-white border-secondary shadow-xs"
                        : "bg-surface-container-low border-outline-variant/60 text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    <span className="font-bold text-xs">{opt.label}</span>
                    <span
                      className={`text-[10px] mt-0.5 ${
                        fuelStatus === opt.id ? "text-white/80" : "text-on-surface-variant"
                      }`}
                    >
                      {opt.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Cash / ATM Status */}
            <div>
              <label className="font-display font-bold text-xs text-on-surface uppercase tracking-wider block mb-2">
                3. Cash &amp; ATM Availability
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ATM_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAtmStatus(opt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      atmStatus === opt.id
                        ? "bg-secondary text-white border-secondary shadow-xs"
                        : "bg-surface-container-low border-outline-variant/60 text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    <span className="font-bold text-xs">{opt.label}</span>
                    <span
                      className={`text-[10px] mt-0.5 ${
                        atmStatus === opt.id ? "text-white/80" : "text-on-surface-variant"
                      }`}
                    >
                      {opt.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 4: 1-Line Observation Note */}
            <div>
              <label className="font-display font-bold text-xs text-on-surface uppercase tracking-wider block mb-1.5">
                4. Field Note or Hazard Tip (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={140}
                placeholder="e.g., No fuel, also ATM is empty and there are potholes..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-xs text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-all"
              />
            </div>

            {/* Submit Bar */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-outline-variant/40">
              <span className="text-[11px] text-on-surface-variant font-mono flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-emerald-600">verified</span>
                Verified Ground-Truth Broadcast
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">broadcast_on_personal</span>
                    <span>Broadcast Live Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
