"use client";

import { useState } from "react";
import Link from "next/link";
import { api, placesApi } from "@/lib/api";
import { PlaceSummary } from "@/types";

interface PlaceCardProps {
  place: PlaceSummary;
  regionName?: string;
  cityName?: string;
  variant?: "compact" | "featured" | "cover";
  className?: string;
  imageClassName?: string;
  prominent?: boolean;
  onAddToTrip?: (place: PlaceSummary) => void;
}

export function formatPrice(place: PlaceSummary): string {
  const min = place.estimated_cost_min;
  const max = place.estimated_cost_max;
  if (min && max) {
    if (min === max) return `PKR ${min.toLocaleString()}`;
    return `PKR ${min.toLocaleString()} – ${max.toLocaleString()}`;
  }
  if (min) return `PKR ${min.toLocaleString()}`;
  if (max) return `PKR ${max.toLocaleString()}`;
  return "Budget Flexible";
}

export function formatDays(minutes?: number): string {
  const days = Math.max(1, Math.round((minutes || 1440) / 480));
  return `${days} Day${days > 1 ? "s" : ""}`;
}

export function matchPercent(place: PlaceSummary): number {
  return Math.min(99, Math.round((place.popularity_score || 0) * 100));
}

function PlaceVisual({ place, cityName, className }: { place: PlaceSummary; cityName?: string; className: string }) {
  const altText = `${place.name}${cityName ? ` in ${cityName}, Pakistan` : " travel destination in Pakistan"}`;
  if (place.primary_image?.url) {
    return (
      <img
        src={place.primary_image.url}
        alt={altText}
        loading="lazy"
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }
  return (
    <div className={`w-full h-full bg-surface-container-high flex items-center justify-center ${className}`}>
      <span className="material-symbols-outlined text-5xl text-outline">landscape</span>
    </div>
  );
}

function isDistrictType(cityName?: string): boolean {
  if (!cityName) return false;
  const lower = cityName.toLowerCase();
  return (
    lower.includes("valley") ||
    lower.includes("district") ||
    lower.includes("range") ||
    lower.includes("coast") ||
    lower.includes("meadow") ||
    lower.includes("territory") ||
    lower.includes("galyat") ||
    lower.includes("kaghan") ||
    lower.includes("neelum") ||
    lower.includes("salt") ||
    lower.includes("ridge")
  );
}

function CompactCard({
  place,
  regionName,
  cityName,
  imageClassName,
  onAddToTrip,
}: {
  place: PlaceSummary;
  regionName?: string;
  cityName?: string;
  imageClassName?: string;
  onAddToTrip?: (place: PlaceSummary) => void;
}) {
  const [saved, setSaved] = useState(false);
  const match = matchPercent(place);
  const detailHref = `/places/${place.id}`;
  const isDistrict = isDistrictType(cityName);

  const handleWarmCache = () => {
    placesApi.prefetchPlace(place.id, place);
  };

  return (
    <article
      onMouseEnter={handleWarmCache}
      className="group rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle hover:shadow-elevated transition-all overflow-hidden flex flex-col justify-between h-full"
    >
      <div className={`relative overflow-hidden bg-surface-container ${imageClassName ?? "aspect-[16/10]"}`}>
        <Link href={detailHref} prefetch={true} onMouseEnter={handleWarmCache} className="absolute inset-0" aria-label={place.name}>
          <PlaceVisual place={place} cityName={cityName} className="group-hover:scale-105 transition-transform duration-500" />
        </Link>
        {place.is_unesco_heritage && (
          <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-extrabold text-[10px] uppercase shadow-sm flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">workspace_premium</span>
            UNESCO
          </span>
        )}
        <span className={`absolute top-3 ${place.is_unesco_heritage ? "left-24" : "left-3"} px-2.5 py-1 rounded-md bg-secondary text-white text-[11px] font-bold shadow-sm font-mono`}>
          {match}% match
        </span>
        <span className="absolute bottom-2 left-3 px-2.5 py-0.5 rounded bg-white/90 backdrop-blur-sm text-on-surface text-[11px] font-bold">
          {regionName ?? place.category.name}
        </span>
        <button
          onClick={() => {
            api
              .post("/interactions", { place_id: place.id, interaction_type: "save" })
              .catch(() => {});
            setSaved(!saved);
          }}
          aria-label={saved ? "Saved" : "Save"}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md text-on-surface flex items-center justify-center hover:bg-white transition-colors cursor-pointer shadow-sm"
          type="button"
        >
          <span className="material-symbols-outlined text-base">
            {saved ? "bookmark_added" : "bookmark"}
          </span>
        </button>
      </div>

      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-bold text-on-surface leading-tight">{place.name}</h3>
              {place.name_ur && (
                <p className="text-xs text-emerald-600 font-semibold font-serif dir-rtl mt-0.5">{place.name_ur}</p>
              )}
            </div>
            <span className="text-sm text-secondary font-bold font-mono whitespace-nowrap">
              {formatPrice(place)}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {cityName && (
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 border ${
                  isDistrict
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                }`}
              >
                <span className="material-symbols-outlined text-[12px]">
                  {isDistrict ? "landscape" : "location_city"}
                </span>
                {isDistrict ? `District: ${cityName}` : `City: ${cityName}`}
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px]">
              {place.category.name}
            </span>
            {place.elevation_meters && (
              <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-medium flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px] text-secondary">landscape</span>
                {place.elevation_meters}m
              </span>
            )}
            {place.vehicle_access && (
              <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-medium flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px] text-secondary">
                  {place.vehicle_access === "4x4_jeep" ? "directions_car" : "directions_car"}
                </span>
                {place.vehicle_access === "4x4_jeep" ? "4x4 Jeep" : "Sedan"}
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] capitalize">
              {place.indoor_outdoor}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-outline-variant/60">
          <span className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {formatDays(place.average_visit_duration_minutes)}
          </span>
          <div className="flex items-center gap-1.5">
            {onAddToTrip && (
              <button
                onClick={() => onAddToTrip(place)}
                className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-secondary hover:text-white text-on-surface text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                type="button"
                title="Add to Itinerary"
              >
                <span className="material-symbols-outlined text-[14px]">add_location_alt</span>
                <span>+ Trip</span>
              </button>
            )}
            <Link
              href={detailHref}
              prefetch={true}
              onMouseEnter={handleWarmCache}
              className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-secondary hover:text-white text-on-surface text-xs font-semibold transition-all cursor-pointer"
            >
              Explore
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function CoverCard({
  place,
  regionName,
  cityName,
  prominent,
}: {
  place: PlaceSummary;
  regionName?: string;
  cityName?: string;
  prominent?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const match = matchPercent(place);
  const detailHref = `/places/${place.id}`;

  const handleWarmCache = () => {
    placesApi.prefetchPlace(place.id, place);
  };

  return (
    <article
      onMouseEnter={handleWarmCache}
      className="group relative h-full w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-outline-variant/60 shadow-subtle hover:shadow-elevated transition-all"
    >
      <Link href={detailHref} prefetch={true} onMouseEnter={handleWarmCache} className="absolute inset-0" aria-label={place.name}>
        {place.primary_image?.url ? (
          <img
            src={place.primary_image.url}
            alt={place.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-outline">landscape</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
      </Link>

      <span className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-secondary text-white text-[11px] font-bold shadow-sm font-mono">
        {match}% Season Fit
      </span>
      <button
        onClick={() => {
          api
            .post("/interactions", { place_id: place.id, interaction_type: "save" })
            .catch(() => {});
          setSaved(!saved);
        }}
        aria-label={saved ? "Saved" : "Save"}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md text-on-surface flex items-center justify-center hover:bg-white transition-colors cursor-pointer shadow-sm"
        type="button"
      >
        <span className="material-symbols-outlined text-base">
          {saved ? "bookmark_added" : "bookmark"}
        </span>
      </button>

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white flex flex-col gap-2 pointer-events-none">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
          {cityName ?? regionName ?? place.category.name} · {place.category.name}
        </span>
        <h3 className={`font-display font-bold text-white tracking-tight ${prominent ? "text-xl sm:text-3xl" : "text-base sm:text-lg"}`}>
          {place.name}
        </h3>
        {prominent ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/80 pt-1">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {formatDays(place.average_visit_duration_minutes)}
            </span>
            <span className="flex items-center gap-1 capitalize">
              <span className="material-symbols-outlined text-sm">altitude</span>
              {place.activity_level}
            </span>
            <span className="flex items-center gap-1 capitalize">
              <span className="material-symbols-outlined text-sm">explore</span>
              {place.indoor_outdoor}
            </span>
            <span className="ml-auto px-2.5 py-1 rounded-full bg-secondary text-white text-xs font-bold font-mono">
              {formatPrice(place)}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-xs text-white/80 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {formatDays(place.average_visit_duration_minutes)}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-secondary text-white text-xs font-bold font-mono">
              {formatPrice(place)}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

function FeaturedCard({
  place,
  regionName,
  cityName,
  imageClassName,
  onAddToTrip,
}: {
  place: PlaceSummary;
  regionName?: string;
  cityName?: string;
  imageClassName?: string;
  onAddToTrip?: (place: PlaceSummary) => void;
}) {
  const [saved, setSaved] = useState(false);
  const match = matchPercent(place);
  const detailHref = `/places/${place.id}`;

  const handleWarmCache = () => {
    placesApi.prefetchPlace(place.id, place);
  };

  return (
    <article
      onMouseEnter={handleWarmCache}
      className="rounded-3xl overflow-hidden border border-outline-variant/60 shadow-elevated bg-surface-container-lowest flex flex-col group transition-all duration-300 h-full"
    >
      <div className={`relative overflow-hidden bg-surface-container ${imageClassName ?? "aspect-[16/9] sm:aspect-[21/10]"}`}>
        <Link href={detailHref} prefetch={true} onMouseEnter={handleWarmCache} className="absolute inset-0" aria-label={place.name}>
          <PlaceVisual place={place} cityName={cityName} className="group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-md bg-secondary text-white text-[11px] font-bold shadow-sm font-mono">
              {match}% Season Fit
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-sm text-on-surface text-[11px] font-bold shadow-sm">
              Top Destination
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
              {regionName ?? place.category.name} · {place.category.name}
            </span>
            <h3 className="font-display text-xl sm:text-3xl text-white tracking-tight font-bold">
              {place.name}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/80 pt-1">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {formatDays(place.average_visit_duration_minutes)}
              </span>
              <span className="flex items-center gap-1 capitalize">
                <span className="material-symbols-outlined text-sm">altitude</span>
                {place.activity_level}
              </span>
              <span className="flex items-center gap-1 capitalize">
                <span className="material-symbols-outlined text-sm">explore</span>
                {place.indoor_outdoor}
              </span>
              <span className="ml-auto px-2.5 py-1 rounded-full bg-secondary text-white text-xs font-bold font-mono">
                {formatPrice(place)}
              </span>
            </div>
          </div>
        </Link>
      </div>

      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 bg-surface-container-lowest gap-4">
        {place.description && (
          <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3">
            {place.description}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-outline-variant/60">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant text-xs font-semibold capitalize">
              {place.family_suitable ? "Family friendly" : "Guided access"}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant text-xs font-semibold">
              {regionName ?? "Verified Corridor"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onAddToTrip && (
              <button
                onClick={() => onAddToTrip(place)}
                className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-secondary hover:text-white text-on-surface text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                type="button"
                title="Add to Itinerary"
              >
                <span className="material-symbols-outlined text-base">add_location_alt</span>
                <span>+ Trip</span>
              </button>
            )}
            <button
              onClick={() => {
                api
                  .post("/interactions", { place_id: place.id, interaction_type: "save" })
                  .catch(() => {});
                setSaved(!saved);
              }}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-base">
                {saved ? "bookmark_added" : "bookmark"}
              </span>
              {saved ? "Saved" : "Save"}
            </button>
            <Link
              href={detailHref}
              prefetch={true}
              onMouseEnter={handleWarmCache}
              className="px-4 py-2 rounded-xl bg-secondary text-white hover:bg-secondary-dark text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow-glow hover:-translate-y-0.5 flex items-center gap-1.5"
            >
              <span>Inspect Dossier</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function PlaceCardSkeleton({ className, imageClassName }: { className?: string; imageClassName?: string }) {
  return (
    <article className={`rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle overflow-hidden flex flex-col justify-between h-full ${className ?? ""}`}>
      <div className={`relative overflow-hidden bg-surface-container/70 animate-pulse ${imageClassName ?? "aspect-[16/10]"}`}>
        <div className="absolute top-3 left-3 w-16 h-5 rounded-md bg-surface-container-high/80" />
        <div className="absolute bottom-2 left-3 w-24 h-4 rounded bg-surface-container-high/80" />
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-container-high/80" />
      </div>

      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <div className="w-3/5 h-5 rounded-lg bg-surface-container animate-pulse" />
            <div className="w-1/4 h-4 rounded bg-surface-container animate-pulse" />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <div className="w-20 h-5 rounded bg-surface-container animate-pulse" />
            <div className="w-16 h-5 rounded bg-surface-container animate-pulse" />
            <div className="w-14 h-5 rounded bg-surface-container animate-pulse" />
            <div className="w-16 h-5 rounded bg-surface-container animate-pulse" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-outline-variant/40">
          <div className="w-16 h-4 rounded bg-surface-container animate-pulse" />
          <div className="w-24 h-7 rounded-xl bg-surface-container animate-pulse" />
        </div>
      </div>
    </article>
  );
}

export default function PlaceCard({
  place,
  regionName,
  cityName,
  variant = "compact",
  className,
  imageClassName,
  prominent,
  onAddToTrip,
}: PlaceCardProps) {
  if (variant === "featured") {
    return (
      <div className={className}>
        <FeaturedCard place={place} regionName={regionName} cityName={cityName} imageClassName={imageClassName} onAddToTrip={onAddToTrip} />
      </div>
    );
  }
  if (variant === "cover") {
    return (
      <div className={className}>
        <CoverCard place={place} regionName={regionName} cityName={cityName} prominent={prominent} />
      </div>
    );
  }
  return (
    <div className={className}>
      <CompactCard place={place} regionName={regionName} cityName={cityName} imageClassName={imageClassName} onAddToTrip={onAddToTrip} />
    </div>
  );
}