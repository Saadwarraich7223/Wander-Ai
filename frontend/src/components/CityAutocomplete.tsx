"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PakistanLocation,
  searchPakistanLocations,
  PAKISTAN_LOCATIONS,
} from "@/lib/pakistanGeo";

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string, location?: PakistanLocation) => void;
  placeholder?: string;
  icon?: string;
  label?: string;
  popularChips?: { label: string; val: string }[];
  filterTouristHubsOnly?: boolean;
  className?: string;
  required?: boolean;
}

export default function CityAutocomplete({
  value,
  onChange,
  placeholder = "Search any Pakistani city, tehsil or valley...",
  icon = "place",
  label,
  popularChips,
  filterTouristHubsOnly = false,
  className = "",
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PakistanLocation[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Update suggestions when query changes
  useEffect(() => {
    if (!isOpen) return;

    if (!query.trim()) {
      // If empty, show top tourist hubs or major cities
      const topLocations = filterTouristHubsOnly
        ? PAKISTAN_LOCATIONS.filter((l) => l.is_tourist_hub).slice(0, 10)
        : PAKISTAN_LOCATIONS.filter(
            (l) =>
              l.is_tourist_hub ||
              [
                "Lahore",
                "Islamabad",
                "Karachi",
                "Rawalpindi",
                "Peshawar",
                "Multan",
                "Bahawalpur & Cholistan",
                "Quetta & Ziarat",
                "Faisalabad",
                "Sialkot",
              ].includes(l.name)
          ).slice(0, 10);
      setSuggestions(topLocations);
    } else {
      let results = searchPakistanLocations(query);
      if (filterTouristHubsOnly) {
        results = [
          ...results.filter((r) => r.is_tourist_hub),
          ...results.filter((r) => !r.is_tourist_hub),
        ].slice(0, 10);
      }
      setSuggestions(results);
    }
    setHighlightedIndex(-1);
  }, [query, isOpen, filterTouristHubsOnly]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (loc: PakistanLocation) => {
    const formattedName = loc.is_tourist_hub
      ? `${loc.name}, ${loc.province}`
      : `${loc.name} (${loc.province})`;
    setQuery(formattedName);
    onChange(formattedName, loc);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    onChange("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSelect(suggestions[highlightedIndex]);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
          {label}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-16 py-3 bg-surface-container-low hover:bg-surface-container/50 focus:bg-surface-container-lowest border border-outline-variant focus:border-secondary rounded-xl text-on-surface font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-secondary/15 placeholder:text-on-surface-variant/70 shadow-xs"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title="Clear location"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {/* Suggestions Dropdown with elevated z-index */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-surface-container-lowest rounded-2xl border-2 border-outline-variant/80 shadow-2xl z-[100] overflow-hidden max-h-80 overflow-y-auto animate-fade-in backdrop-blur-xl">
          <div className="px-3.5 py-2 bg-surface-container-low border-b border-outline-variant/60 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold">
            <span>Pakistani Geocoded Locations</span>
            <span className="text-secondary font-bold">{suggestions.length} Matches</span>
          </div>

          <div className="p-1.5 space-y-1">
            {suggestions.map((loc, idx) => {
              const isSelected = highlightedIndex === idx;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelect(loc)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-secondary/15 border border-secondary/40 text-secondary shadow-xs"
                      : "hover:bg-surface-container-low text-on-surface border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        loc.is_tourist_hub
                          ? "bg-secondary/10 text-secondary border border-secondary/20"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {loc.is_tourist_hub
                          ? "tour"
                          : loc.has_commercial_airport
                          ? "flight"
                          : "location_city"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-on-surface truncate">
                        {loc.name}
                      </div>
                      <div className="text-[11px] text-on-surface-variant truncate">
                        {loc.district} • <span className="font-semibold text-secondary">{loc.province}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end">
                    <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md font-semibold">
                      {loc.elevation_m}m
                    </span>
                    {loc.is_tourist_hub ? (
                      <span className="text-[9px] font-extrabold text-secondary uppercase tracking-wider mt-0.5">
                        Focal Hub
                      </span>
                    ) : loc.has_commercial_airport ? (
                      <span className="text-[9px] font-mono text-emerald-700 font-bold uppercase tracking-wider mt-0.5">
                        ✈️ Airport
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Popular Chips */}
      {popularChips && popularChips.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          <span className="font-mono text-[11px] text-on-surface-variant">
            Quick Hubs:
          </span>
          {popularChips.map((chip) => (
            <button
              key={chip.val}
              onClick={() => {
                const loc = PAKISTAN_LOCATIONS.find((l) =>
                  l.name.toLowerCase().includes(chip.label.toLowerCase().split(" ")[0])
                );
                if (loc) {
                  handleSelect(loc);
                } else {
                  setQuery(chip.val);
                  onChange(chip.val);
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                query.toLowerCase().includes(chip.label.toLowerCase().split(" ")[0])
                  ? "bg-secondary-container/60 text-secondary border-secondary/30 font-semibold"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant"
              }`}
              type="button"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
