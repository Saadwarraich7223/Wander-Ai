"use client";

import React from "react";
import {
  FieldIntelReport,
  ROAD_CONDITION_LABELS,
  FUEL_STATUS_LABELS,
  ATM_STATUS_LABELS,
  formatTimeAgo,
} from "@/lib/corridorIntel";

interface CorridorIntelSectionProps {
  destinationName: string;
  corridorName: string;
  passabilityPercent: number;
  recentReports: FieldIntelReport[];
  onOpenReportModal: () => void;
  onOpenFairPriceModal: () => void;
}

export default function CorridorIntelSection({
  destinationName,
  corridorName,
  passabilityPercent,
  recentReports,
  onOpenReportModal,
  onOpenFairPriceModal,
}: CorridorIntelSectionProps) {
  const latestReport = recentReports.length > 0 ? recentReports[0] : null;
  const hasReports = recentReports.length > 0;

  const roadInfo = latestReport
    ? ROAD_CONDITION_LABELS[latestReport.roadCondition]
    : {
        label: `Estimated ~${passabilityPercent}% Clear`,
        icon: "traffic",
        color: "text-on-surface",
        alert: false,
      };

  const fuelInfo = latestReport
    ? FUEL_STATUS_LABELS[latestReport.fuelStatus]
    : {
        label: "Standard Regional Fuel Corridor",
        icon: "local_gas_station",
        color: "text-on-surface",
      };

  const atmInfo = latestReport
    ? ATM_STATUS_LABELS[latestReport.atmStatus]
    : {
        label: "Carry Cash Contingency Reserve",
        icon: "payments",
        color: "text-on-surface",
      };

  return (
    <div className="rounded-2xl p-4 sm:p-6 bg-surface-container-lowest border border-outline-variant/60 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-outline-variant/40">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
            <span className="material-symbols-outlined text-xl">hub</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-secondary">
                Live Corridor Intelligence &amp; Fair Tariffs
              </span>
              {hasReports ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  CROWD-VERIFIED ({recentReports.length} {recentReports.length === 1 ? "REPORT" : "REPORTS"})
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/60">
                  AWAITING FIELD REPORTS
                </span>
              )}
            </div>
            <h3 className="font-display text-sm sm:text-base font-bold text-on-surface">
              Ground-Truth Route Status &amp; Anti-Scam Tariffs for {destinationName}
            </h3>
            {hasReports ? (
              <p className="text-xs text-on-surface-variant font-medium mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-emerald-600">verified</span>
                <span>
                  Latest status logged <strong>{formatTimeAgo(latestReport!.timestamp)}</strong> for <strong>{latestReport!.placeName}</strong>.
                </span>
              </p>
            ) : (
              <p className="text-xs text-on-surface-variant mt-0.5">
                No crowdsourced traveler observations logged yet for this corridor.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto shrink-0">
          <button
            onClick={onOpenFairPriceModal}
            className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs border border-outline-variant/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            type="button"
          >
            <span className="material-symbols-outlined text-sm text-emerald-700">price_check</span>
            <span>Fair Rates</span>
          </button>
          <button
            onClick={onOpenReportModal}
            className="px-3.5 py-1.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">campaign</span>
            <span>{hasReports ? "Report Update" : "+ Submit First Report"}</span>
          </button>
        </div>
      </div>

      {/* Prominent Traveler Note Callout (When Note exists) */}
      {latestReport?.note && (
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-secondary/30 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-base text-secondary shrink-0 mt-0.5">comment</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-secondary">
                Latest Traveler Observation ({latestReport.placeName})
              </span>
              <span className="text-[10px] text-outline font-mono">
                {formatTimeAgo(latestReport.timestamp)}
              </span>
            </div>
            <p className="text-xs text-on-surface font-semibold italic">
              &ldquo;{latestReport.note}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* 3 Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Road Telemetry Card */}
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
              <span className="uppercase tracking-wider font-semibold">Road Passability</span>
              <span className={hasReports ? "text-emerald-800 font-bold" : "text-outline"}>
                {hasReports ? "Crowd-Reported" : "Estimated Baseline"}
              </span>
            </div>
            <div className="font-display font-bold text-sm text-on-surface flex items-center gap-1.5 mt-1">
              <span className="material-symbols-outlined text-base text-secondary">
                {roadInfo.icon}
              </span>
              <span className="leading-tight">{roadInfo.label}</span>
            </div>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-snug">
            {latestReport?.note
              ? `Note: "${latestReport.note}"`
              : `${corridorName.split("/")[0]} corridor standard traffic trajectory.`}
          </p>
        </div>

        {/* Fuel Telemetry Card */}
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
              <span className="uppercase tracking-wider font-semibold">Fuel Pump Status</span>
              <span className={hasReports ? "text-secondary font-bold" : "text-outline"}>
                {hasReports ? "Live Verified" : "Unverified"}
              </span>
            </div>
            <div className="font-display font-bold text-sm text-on-surface flex items-center gap-1.5 mt-1">
              <span className="material-symbols-outlined text-base text-secondary">
                {fuelInfo.icon}
              </span>
              <span className="leading-tight">{fuelInfo.label}</span>
            </div>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-snug">
            Standard fuel stations located along {destinationName.split(" ")[0]} regional route.
          </p>
        </div>

        {/* ATM / Cash Card */}
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
              <span className="uppercase tracking-wider font-semibold">Cash &amp; ATM Liquidity</span>
              <span className={hasReports ? "text-secondary font-bold" : "text-outline"}>
                {hasReports ? "Reported" : "Advisory"}
              </span>
            </div>
            <div className="font-display font-bold text-sm text-on-surface flex items-center gap-1.5 mt-1">
              <span className="material-symbols-outlined text-base text-secondary">
                {atmInfo.icon}
              </span>
              <span className="leading-tight">{atmInfo.label}</span>
            </div>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-snug">
            Carry PKR 15,000+ cash reserve for highway tolls, tea stalls &amp; local entries.
          </p>
        </div>
      </div>

      {/* Recent Field Observations Feed (When multiple reports exist) */}
      {recentReports.length > 0 && (
        <div className="pt-2 border-t border-outline-variant/30 space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-bold block">
            All Traveler Field Logs ({recentReports.length})
          </span>
          <div className="space-y-1.5">
            {recentReports.map((rep) => {
              const rRoad = ROAD_CONDITION_LABELS[rep.roadCondition];
              const rFuel = FUEL_STATUS_LABELS[rep.fuelStatus];
              const rAtm = ATM_STATUS_LABELS[rep.atmStatus];

              return (
                <div
                  key={rep.id}
                  className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs space-y-1"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-bold text-on-surface">{rep.placeName}</span>
                      {rep.verifiedInTrip && (
                        <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-800 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs">verified_user</span>
                          VERIFIED IN-TRIP
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/40 text-on-surface-variant">
                        {rRoad.label.split("(")[0]}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/40 text-on-surface-variant">
                        {rFuel.label.split("(")[0]}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/40 text-on-surface-variant">
                        {rAtm.label.split("(")[0]}
                      </span>
                    </div>
                    <span className="text-[10px] text-outline font-mono self-start sm:self-auto shrink-0">
                      {formatTimeAgo(rep.timestamp)}
                    </span>
                  </div>
                  {rep.note && (
                    <p className="text-xs text-on-surface-variant pl-4 italic">
                      &ldquo;{rep.note}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
