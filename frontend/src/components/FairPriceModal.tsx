"use client";

import React, { useState, useMemo } from "react";
import { FAIR_PRICE_DATABASE, FairPriceItem } from "@/data/fair_prices";

interface FairPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRegionName?: string;
}

const REGION_TABS = [
  "All Regions",
  "Gilgit-Baltistan & Baltistan",
  "KPK & Kaghan/Swat",
  "Punjab & Cholistan",
  "Balochistan & Sindh",
] as const;

export default function FairPriceModal({
  isOpen,
  onClose,
  activeRegionName = "Pakistan",
}: FairPriceModalProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("All Regions");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-select region matching active destination on open
  useMemo(() => {
    if (!activeRegionName) return;
    const dest = activeRegionName.toLowerCase();
    if (dest.includes("hunza") || dest.includes("skardu") || dest.includes("gilgit") || dest.includes("deosai")) {
      setSelectedRegion("Gilgit-Baltistan & Baltistan");
    } else if (dest.includes("naran") || dest.includes("swat") || dest.includes("kaghan") || dest.includes("kumrat")) {
      setSelectedRegion("KPK & Kaghan/Swat");
    } else if (dest.includes("bahawalpur") || dest.includes("cholistan") || dest.includes("lahore") || dest.includes("multan")) {
      setSelectedRegion("Punjab & Cholistan");
    } else if (dest.includes("gwadar") || dest.includes("karachi") || dest.includes("balochistan") || dest.includes("makran")) {
      setSelectedRegion("Balochistan & Sindh");
    }
  }, [activeRegionName]);

  const filteredItems = useMemo(() => {
    return FAIR_PRICE_DATABASE.filter((item) => {
      const matchesRegion =
        selectedRegion === "All Regions" || item.region === selectedRegion;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.serviceName.toLowerCase().includes(q) ||
        item.corridor.toLowerCase().includes(q) ||
        item.unionStandLocation?.toLowerCase().includes(q) ||
        item.cautionNotes.toLowerCase().includes(q);

      return matchesRegion && matchesSearch;
    });
  }, [selectedRegion, searchQuery]);

  if (!isOpen) return null;

  const handleCopyRate = (item: FairPriceItem) => {
    const text = `${item.serviceName}: ${item.fairRangePkr} (${item.pricingBasis}) - Union Stand: ${item.unionStandLocation || "Local Stand"}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="bg-surface-container-lowest rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-outline-variant/60 flex flex-col">
        {/* Sleek, Uncluttered Header */}
        <div className="p-4 sm:p-6 bg-surface-container-low border-b border-outline-variant/40 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-2xl">price_check</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-900 px-2 py-0.5 rounded-md">
                  Anti-Gouging Index
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium hidden sm:inline">
                  Verified Local Union Rates
                </span>
              </div>
              <h2 className="font-display text-base sm:text-xl font-bold tracking-tight text-on-surface truncate sm:whitespace-normal">
                Fair Price &amp; Tariff Benchmark Index
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-outline-variant/60"
            type="button"
            title="Close"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-3 sm:p-5 border-b border-outline-variant/30 space-y-2.5 bg-surface-container-lowest">
          {/* Search Box */}
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-on-surface-variant material-symbols-outlined text-base">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search service (e.g., Saif-ul-Malook, Fairy Meadows, Attabad Boat, Cholistan Safari)..."
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-all"
            />
          </div>

          {/* Regional Pill Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {REGION_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedRegion(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedRegion === tab
                    ? "bg-secondary text-white shadow-xs font-bold"
                    : "bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/40"
                }`}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body: Price Item Grid */}
        <div className="p-3 sm:p-6 flex-1 space-y-3 sm:space-y-4 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 bg-surface-container-low rounded-2xl border border-outline-variant/50">
              <span className="material-symbols-outlined text-3xl text-outline mb-2">search_off</span>
              <p className="text-sm font-semibold text-on-surface">No fair price benchmark found</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Try searching for another service or select &apos;All Regions&apos;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/50 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-2">
                    {/* Header Row: Corridor & Region */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-900 truncate">
                        {item.corridor}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-mono shrink-0">
                        {item.region.split("&")[0]}
                      </span>
                    </div>

                    {/* Service Name */}
                    <h3 className="font-display font-bold text-sm sm:text-base text-on-surface leading-snug">
                      {item.serviceName}
                    </h3>

                    {/* Price highlight banner */}
                    <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-emerald-500/25 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-mono uppercase text-on-surface-variant font-semibold block">
                          Verified Tariff
                        </span>
                        <span className="font-display text-base sm:text-lg font-extrabold text-emerald-800">
                          {item.fairRangePkr}
                        </span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant text-right font-medium max-w-[55%]">
                        {item.pricingBasis}
                      </span>
                    </div>

                    {/* Details: Stand & Negotiation */}
                    <div className="space-y-1.5 text-xs text-on-surface-variant pt-0.5">
                      {item.unionStandLocation && (
                        <div className="flex items-start gap-1.5">
                          <span className="material-symbols-outlined text-xs text-secondary shrink-0 mt-0.5">
                            location_on
                          </span>
                          <span className="leading-snug">
                            <strong className="text-on-surface font-semibold">Official Stand:</strong> {item.unionStandLocation}
                          </span>
                        </div>
                      )}
                      <div className="flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-xs text-amber-700 shrink-0 mt-0.5">
                          verified
                        </span>
                        <span className="leading-snug">
                          <strong className="text-on-surface font-semibold">Negotiation Tip:</strong> {item.negotiationTip}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-outline font-mono">Union Benchmark</span>
                    <button
                      onClick={() => handleCopyRate(item)}
                      className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-mono text-[11px] font-semibold flex items-center gap-1 transition-colors border border-outline-variant/60 cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-xs">
                        {copiedId === item.id ? "check" : "content_copy"}
                      </span>
                      <span>{copiedId === item.id ? "Copied" : "Copy Tariff"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-5 bg-surface-container-low border-t border-outline-variant/40 flex items-center justify-between gap-3">
          <span className="text-[11px] text-on-surface-variant font-mono truncate">
            WanderAI Verified Tariffs · Updated 2026
          </span>
          <button
            onClick={onClose}
            className="px-4 sm:px-5 py-2 rounded-xl bg-primary text-white hover:bg-neutral-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            type="button"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
