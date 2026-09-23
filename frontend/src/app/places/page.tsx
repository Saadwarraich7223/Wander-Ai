"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { placesApi, tripsApi } from "@/lib/api";
import { Category, City, PlaceSummary, Trip } from "@/types";
import Navbar from "@/components/Navbar";
import PlaceCard, { PlaceCardSkeleton } from "@/components/PlaceCard";

const PAGE_SIZE = 6;

type ActivityKey = "all" | "low" | "moderate" | "high";
type AccessKey = "all" | "indoor" | "outdoor" | "both";
type BudgetKey = "all" | "backpacker" | "boutique" | "luxury";
type SortKey = "affinity" | "cost" | "duration";

const ACTIVITY_OPTIONS: { value: ActivityKey; label: string }[] = [
  { value: "all", label: "All Pacing" },
  { value: "low", label: "Relaxed Sightseeing" },
  { value: "moderate", label: "Moderate Expedition" },
  { value: "high", label: "High-Altitude Pioneer" },
];

const ACCESS_OPTIONS: { value: AccessKey; label: string }[] = [
  { value: "all", label: "All Access" },
  { value: "outdoor", label: "Outdoor / Open Air" },
  { value: "indoor", label: "Indoor / Museum" },
  { value: "both", label: "Mixed Indoor + Outdoor" },
];

const BUDGET_OPTIONS: { value: BudgetKey; label: string }[] = [
  { value: "all", label: "All Budgets" },
  { value: "backpacker", label: "Backpacker Friendly" },
  { value: "boutique", label: "Curated Boutique" },
  { value: "luxury", label: "Ultra Luxury" },
];

const PASSES = [
  {
    name: "KKH Passu Sector",
    status: "100% Clear",
    statusClass: "bg-secondary-container/60 text-on-secondary-container",
    note: "Gilgit → Khunjerab Border. Smooth asphalt, zero landslide hazards recorded.",
    left: "2,500m AMSL",
    right: "Dry & Sunny",
    rightClass: "text-secondary",
  },
  {
    name: "Babusar Pass",
    status: "Advisory",
    statusClass: "bg-tertiary-fixed text-on-tertiary-fixed",
    note: "4,173m. Light evening black ice. Recommended route diverted via KKH Bisham.",
    left: "4,173m AMSL",
    right: "-3°C Frost",
    rightClass: "text-tertiary-fixed-dim",
  },
  {
    name: "Lowari Tunnel",
    status: "24/7 Open",
    statusClass: "bg-secondary-container/60 text-on-secondary-container",
    note: "Dir → Chitral Highland. Bi-directional air flow nominal, standard clearance.",
    left: "3,118m AMSL",
    right: "Stable",
    rightClass: "text-on-surface",
  },
  {
    name: "Deosai Track",
    status: "4x4 High Clear",
    statusClass: "bg-tertiary-fixed text-on-tertiary-fixed",
    note: "Ali Malik Pass sector. Seasonal gate closing in ~14 days before deep snow.",
    left: "4,114m AMSL",
    right: "-6°C Night",
    rightClass: "text-on-surface-variant",
  },
  {
    name: "Makran N10 Coastal",
    status: "Optimal",
    statusClass: "bg-secondary-container/60 text-on-secondary-container",
    note: "Karachi to Gwadar. Fresh tarmac, clear skies, strong sea mist past Kund Malir.",
    left: "Sea Level",
    right: "27°C Gentle",
    rightClass: "text-secondary",
  },
];

const CORRIDORS = [
  {
    name: "Karakoram Silk Route (KKH)",
    stops: "Islamabad → Chilas → Gilgit → Hunza → Khunjerab",
    area: "Gilgit-Baltistan",
    altitude: "4,693m",
    altitudeNote: "Pass",
    transit: "14h Road / 50m Air",
    vehicle: "Sedan / SUV / Coaster",
    clearance: "100% Passable",
  },
  {
    name: "Baltistan High Plateau & Shigar",
    stops: "Islamabad → Skardu → Shigar → Deosai → Khaplu",
    area: "Gilgit-Baltistan",
    altitude: "4,114m",
    altitudeNote: "Deosai",
    transit: "16h Road / 45m Air",
    vehicle: "4x4 Prerequisite (Deosai)",
    clearance: "Road Nominally Clear",
  },
  {
    name: "Hindu Kush Deep Corridor",
    stops: "Islamabad → Dir → Lowari Tunnel → Chitral → Kalash",
    area: "Khyber Pakhtunkhwa",
    altitude: "3,118m",
    altitudeNote: "Tunnel",
    transit: "8h via M-1/M-16",
    vehicle: "SUV (Sedan to Chitral)",
    clearance: "24/7 Tunnel Active",
  },
  {
    name: "Southern Makran Coastal Highway",
    stops: "Karachi → Hingol → Ormara → Pasni → Gwadar",
    area: "Balochistan",
    altitude: "150m",
    altitudeNote: "Cliffs",
    transit: "7h from KHI / Flight to GWD",
    vehicle: "All Vehicles (Asphalt)",
    clearance: "Pristine Tarmac",
  },
];

const CATEGORY_ICON_MAP: Record<string, string> = {
  landmark: "fort",
  trees: "forest",
  utensils: "restaurant",
  mountain: "hiking",
  "shopping-bag": "shopping_bag",
};

function materialIcon(name: string | null | undefined): string {
  if (!name) return "";
  return CATEGORY_ICON_MAP[name] ?? name;
}

function getPaginationRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const range: (number | "...")[] = [];
  if (current <= 4) {
    range.push(1, 2, 3, 4, 5, "...", total);
  } else if (current >= total - 3) {
    range.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    range.push(1, "...", current - 1, current, current + 1, "...", total);
  }
  return range;
}

export default function PlacesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<PlaceSummary[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [q, setQ] = useState("");
  const [region, setRegion] = useState("all");
  const [cityId, setCityId] = useState("all");
  const [activity, setActivity] = useState<ActivityKey>("all");
  const [access, setAccess] = useState<AccessKey>("all");
  const [budget, setBudget] = useState<BudgetKey>("all");
  const [categoryId, setCategoryId] = useState("all");
  const [sort, setSort] = useState<SortKey>("affinity");
  const [page, setPage] = useState(1);

  // Add to Trip Modal state
  const [addToTripModalPlace, setAddToTripModalPlace] = useState<PlaceSummary | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(1);
  const [addingStop, setAddingStop] = useState(false);
  const [addStopError, setAddStopError] = useState<string | null>(null);
  const [addStopSuccess, setAddStopSuccess] = useState<string | null>(null);

  const handleConfirmAddToTrip = async () => {
    if (!addToTripModalPlace || !selectedTripId) return;
    setAddingStop(true);
    setAddStopError(null);
    try {
      await tripsApi.addStop(selectedTripId, {
        place_id: addToTripModalPlace.id,
        preferred_day_number: selectedDayIndex,
      });
      setAddStopSuccess(`Successfully attached ${addToTripModalPlace.name} to expedition!`);
      setTimeout(() => {
        setAddToTripModalPlace(null);
        setAddStopSuccess(null);
      }, 1400);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Could not attach place to expedition.";
      setAddStopError(msg);
    } finally {
      setAddingStop(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError(false);
      try {
        const [citiesRes, catRes, placesRes, tripRes] = await Promise.allSettled([
          placesApi.getCities(),
          placesApi.getCategories(),
          placesApi.list({ limit: 300 }),
          tripsApi.list(),
        ]);
        if (!active) return;
        if (citiesRes.status === "fulfilled" && Array.isArray(citiesRes.value)) {
          setCities(citiesRes.value);
        }
        if (catRes.status === "fulfilled" && Array.isArray(catRes.value)) {
          setCategories(catRes.value);
        }
        if (placesRes.status === "fulfilled" && placesRes.value?.items) {
          setPlaces(placesRes.value.items);
        } else {
          setLoadError(true);
        }
        if (tripRes.status === "fulfilled" && Array.isArray(tripRes.value)) {
          setTrips(tripRes.value);
        }
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const cityById = useMemo(() => new Map(cities.map((c) => [c.id, c])), [cities]);

  const regions = useMemo(() => {
    const map = new Map<string, City[]>();
    cities.forEach((c) => {
      const name = c.region?.name ?? "Other Regions";
      const list = map.get(name) ?? [];
      list.push(c);
      map.set(name, list);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [cities]);

  const availableCities = useMemo(() => {
    let list = cities;
    if (region !== "all") {
      const selectedRegionCities = regions.find(([name]) => name === region)?.[1] ?? [];
      list = selectedRegionCities;
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [cities, region, regions]);

  const filtered = useMemo(() => {
    let list = places;
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter((p) => {
        const city = cityById.get(p.city_id);
        const cityName = city?.name?.toLowerCase() ?? "";
        const regionName = city?.region?.name?.toLowerCase() ?? "";
        const name = p.name.toLowerCase();
        const nameUr = p.name_ur?.toLowerCase() ?? "";
        const desc = p.description?.toLowerCase() ?? "";
        const cat = p.category.name.toLowerCase();

        return (
          name.includes(needle) ||
          nameUr.includes(needle) ||
          desc.includes(needle) ||
          cat.includes(needle) ||
          cityName.includes(needle) ||
          regionName.includes(needle)
        );
      });
    }
    if (region !== "all") {
      const ids = new Set(regions.find(([name]) => name === region)?.[1].map((c) => c.id) ?? []);
      list = list.filter((p) => ids.has(p.city_id));
    }
    if (cityId !== "all") {
      list = list.filter((p) => p.city_id === cityId);
    }
    if (activity !== "all") {
      list = list.filter((p) => p.activity_level === activity);
    }
    if (access !== "all") {
      if (access === "indoor") list = list.filter((p) => p.indoor_outdoor === "indoor" || p.indoor_outdoor === "both");
      else if (access === "outdoor") list = list.filter((p) => p.indoor_outdoor === "outdoor" || p.indoor_outdoor === "both");
      else list = list.filter((p) => p.indoor_outdoor === "both");
    }
    if (budget !== "all") {
      list = list.filter((p) => {
        const max = p.estimated_cost_max ?? p.estimated_cost_min ?? 0;
        if (budget === "backpacker") return max <= 15000;
        if (budget === "boutique") return max > 15000 && max <= 50000;
        return max > 50000;
      });
    }
    if (categoryId !== "all") {
      list = list.filter((p) => p.category.id === categoryId);
    }
    const sorted = [...list];
    if (sort === "cost") {
      sorted.sort((a, b) => (a.estimated_cost_min ?? Number.MAX_SAFE_INTEGER) - (b.estimated_cost_min ?? Number.MAX_SAFE_INTEGER));
    } else if (sort === "duration") {
      sorted.sort((a, b) => (a.average_visit_duration_minutes ?? 0) - (b.average_visit_duration_minutes ?? 0));
    } else {
      sorted.sort((a, b) => b.popularity_score - a.popularity_score);
    }
    return sorted;
  }, [places, q, region, cityId, regions, activity, access, budget, categoryId, sort]);

  useEffect(() => {
    setPage(1);
  }, [q, region, cityId, activity, access, budget, categoryId, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const featured = useMemo(
    () => [...places].sort((a, b) => b.popularity_score - a.popularity_score).slice(0, 3),
    [places]
  );

  const affinityPicks = useMemo(() => {
    const sorted = [...places].sort((a, b) => b.popularity_score - a.popularity_score);
    const bentoIds = new Set(featured.map((p) => p.id));
    const others = sorted.filter((p) => !bentoIds.has(p.id));
    return others.length >= 3 ? others.slice(0, 3) : sorted.slice(0, 3);
  }, [places, featured]);

  const categoryCount = (id: string) => places.filter((p) => p.category.id === id).length;

  const hasActiveFilters =
    q.trim() !== "" ||
    region !== "all" ||
    cityId !== "all" ||
    activity !== "all" ||
    access !== "all" ||
    budget !== "all" ||
    categoryId !== "all";

  const clearAllFilters = () => {
    setQ("");
    setRegion("all");
    setCityId("all");
    setActivity("all");
    setAccess("all");
    setBudget("all");
    setCategoryId("all");
  };

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const selectClass =
  "w-full appearance-none bg-surface-container-low hover:bg-surface-container text-on-surface font-medium text-xs sm:text-sm py-2.5 pl-2.5 sm:pl-3 pr-7 sm:pr-8 rounded-xl border border-transparent outline-none cursor-pointer transition-colors truncate";

  return (
    <div className="bg-background font-sans text-on-surface antialiased min-h-screen flex flex-col">
      <Navbar tripsCount={trips.length} />

      <main className="w-full bg-background flex-grow pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="flex flex-col w-full">
          {/* Hero: Geographic Frontier Command Center */}
          <section className="w-full bg-surface relative overflow-hidden">
            <div className="absolute -right-32 -top-32 w-[480px] h-[480px] rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />
            <div className="absolute -left-32 top-24 w-[420px] h-[420px] rounded-full bg-tertiary-fixed/30 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-8 sm:pb-10">
              <div className="flex flex-col items-start gap-3 sm:gap-4 max-w-4xl">


                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-on-surface font-extrabold leading-tight tracking-tight">
                  Explore Pakistan&rsquo;s Epic
                  <span className="block text-secondary">Geographic Frontiers</span>
                </h1>

                <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                  Algorithmic seasonal route curation, real-time alpine pass gates, and deep
                  heritage vectors synthesized across the Karakoram, Western Himalayas, Hindu
                  Kush, and Makran Coast.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/50 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    Live Map Data Active
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/50 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {cities.length > 0 ? `${cities.length} Regional Corridors` : "7 Major Corridors"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/50 text-[11px] font-bold uppercase tracking-wider text-secondary">
                    {loading ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                        Fetching Destinations...
                      </span>
                    ) : (
                      `${places.length} Verified Destinations`
                    )}
                  </span>
                  <Link
                    href="/explore#map"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/60 text-[11px] font-bold uppercase tracking-wider text-secondary hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">explore</span>
                    Switch to GIS Map
                  </Link>
                  <button
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/60 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Sync Corridor Data
                  </button>
                </div>
              </div>

              <div className="mt-8 sm:mt-10 bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-subtle p-3.5 sm:p-4 space-y-3">
                {/* Search Bar + Filter Dropdowns Row */}
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2.5">
                  {/* Side-by-Side Search Input */}
                  <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface-container-low focus-within:ring-2 focus-within:ring-secondary/30 focus-within:bg-surface-container-lowest transition-all border border-outline-variant/40 min-w-[240px]">
                    <span className="material-symbols-outlined text-secondary text-xl">search</span>
                    <input
                      ref={searchRef}
                      className="w-full bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/70 text-xs sm:text-sm font-medium"
                      placeholder="Search places or cities (e.g. Multan, Hunza)..."
                      type="text"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                    {q && (
                      <button
                        onClick={() => setQ("")}
                        className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
                        type="button"
                        aria-label="Clear search"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                    <kbd className="hidden md:inline-block font-mono text-[9px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">⌘K</kbd>
                  </div>

                  {/* Compact Filter Controls */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 shrink-0">
                    <div className="relative">
                      <select
                        className={selectClass}
                        value={region}
                        onChange={(e) => {
                          setRegion(e.target.value);
                          setCityId("all");
                        }}
                        aria-label="Filter by region"
                      >
                        <option value="all">Region: All ({regions.length})</option>
                        {regions.map(([name]) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[16px] text-on-surface-variant">expand_more</span>
                    </div>
                    <div className="relative">
                      <select
                        className={selectClass}
                        value={cityId}
                        onChange={(e) => setCityId(e.target.value)}
                        aria-label="Filter by city"
                      >
                        <option value="all">City: All ({availableCities.length})</option>
                        {availableCities.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[18px] text-on-surface-variant">expand_more</span>
                    </div>
                    <div className="relative">
                      <select
                        className={selectClass}
                        value={activity}
                        onChange={(e) => setActivity(e.target.value as ActivityKey)}
                        aria-label="Filter by pacing"
                      >
                        {ACTIVITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[18px] text-on-surface-variant">expand_more</span>
                    </div>
                    <div className="relative">
                      <select
                        className={selectClass}
                        value={access}
                        onChange={(e) => setAccess(e.target.value as AccessKey)}
                        aria-label="Filter by access"
                      >
                        {ACCESS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[18px] text-on-surface-variant">expand_more</span>
                    </div>
                    <div className="relative">
                      <select
                        className={selectClass}
                        value={budget}
                        onChange={(e) => setBudget(e.target.value as BudgetKey)}
                        aria-label="Filter by budget"
                      >
                        {BUDGET_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[18px] text-on-surface-variant">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-outline-variant/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setCategoryId("all")}
                    className={`px-3 py-1.5 rounded-lg font-medium text-sm shrink-0 transition-colors cursor-pointer ${categoryId === "all"
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                      }`}
                    type="button"
                  >
                    All Destinations {places.length > 0 ? `(${places.length})` : loading ? "" : "(0)"}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryId(cat.id)}
                      className={`px-3 py-1.5 rounded-lg font-medium text-sm shrink-0 flex items-center gap-1 transition-colors cursor-pointer ${categoryId === cat.id
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                        }`}
                      type="button"
                    >
                      {cat.icon && (
                        <span className="material-symbols-outlined text-[15px]">{materialIcon(cat.icon)}</span>
                      )}
                      {cat.name} {places.length > 0 ? `(${categoryCount(cat.id)})` : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/60">
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-on-surface tracking-tight">
                      Verified Regional Catalog
                    </h2>
                    <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                      Showing <strong className="text-on-surface">{loading ? 6 : pageItems.length}</strong> of{" "}
                      <strong className="text-on-surface">{loading ? "140+" : filtered.length}</strong> destinations
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tertiary-fixed/40 hover:bg-tertiary-fixed/60 text-on-surface text-xs font-semibold transition-colors cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                        Clear filters
                      </button>
                    )}
                    <div className="relative">
                      <select
                        className="appearance-none bg-surface-container hover:bg-surface-container-high text-on-surface font-medium text-sm py-2 pl-3.5 pr-9 rounded-xl border border-transparent outline-none cursor-pointer transition-colors"
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortKey)}
                        aria-label="Sort destinations"
                      >
                        <option value="affinity">Highest AI Affinity Match</option>
                        <option value="cost">Lowest Estimated Cost</option>
                        <option value="duration">Shortest Visit Duration</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[16px] text-on-surface-variant">expand_more</span>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <PlaceCardSkeleton key={`catalog-skeleton-${i}`} />
                    ))}
                  </div>
                ) : pageItems.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
                    <span className="material-symbols-outlined text-5xl text-outline">search_off</span>
                    <h3 className="font-display text-xl font-extrabold text-on-surface">No destinations match those filters</h3>
                    <p className="text-sm text-on-surface-variant">Try widening the region, pacing, or budget scope.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {pageItems.map((place) => (
                      <PlaceCard
                        key={place.id}
                        place={place}
                        regionName={cityById.get(place.city_id)?.region?.name}
                        cityName={cityById.get(place.city_id)?.name}
                        onAddToTrip={(p) => {
                          setAddToTripModalPlace(p);
                          setSelectedTripId(trips[0]?.id || "");
                          setSelectedDayIndex(1);
                          setAddStopError(null);
                          setAddStopSuccess(null);
                        }}
                      />
                    ))}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center sm:justify-end gap-1.5 pt-5 border-t border-outline-variant/60">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface text-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                      Previous
                    </button>
                    {getPaginationRange(currentPage, totalPages).map((item, idx) =>
                      item === "..." ? (
                        <span key={`ellipsis-${idx}`} className="w-8 text-center text-on-surface-variant text-sm font-semibold select-none">
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setPage(item as number)}
                          className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${item === currentPage
                            ? "bg-secondary text-white shadow-sm font-bold"
                            : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                            }`}
                          type="button"
                        >
                          {item}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface text-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
                      type="button"
                    >
                      Next
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {loadError ? (
            <section className="w-full py-14 sm:py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-3">
                  <span className="material-symbols-outlined text-5xl text-outline">explore_off</span>
                  <h2 className="font-display text-2xl font-extrabold text-on-surface">Corridor Telemetry Offline</h2>
                  <p className="text-sm text-on-surface-variant max-w-md">
                    The destination catalog could not be loaded. Sync again to re-establish the
                    data connection.
                  </p>
                  <button
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-secondary-dark transition-colors shadow-sm cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg">refresh</span>
                    Retry Sync
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <>
              {/* Live Passability & Atmospheric Telemetry Strip */}
              <section className="w-full bg-surface-container-low border-y border-outline-variant/40 py-8 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
                    <div className="max-w-2xl">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">
                        <span className="material-symbols-outlined text-[16px]">traffic</span>
                        Real-Time Alpine Telmetry
                      </div>
                      <h2 className="font-display text-lg sm:text-xl font-bold text-on-surface tracking-tight">
                        Active Mountain Passability &amp; Corridor Clearance
                      </h2>
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] font-medium text-on-surface-variant">
                        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary" /> Optimal</span>
                        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" /> Advisory</span>
                        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-error" /> Closed / High Risk</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">Refreshed Today</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {PASSES.map((pass) => (
                      <div
                        key={pass.name}
                        className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-subtle flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-display text-base font-bold text-on-surface">{pass.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${pass.statusClass}`}>{pass.status}</span>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed mt-2">{pass.note}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-on-surface-variant pt-3 border-t border-outline-variant/60 mt-3">
                          <span>{pass.left}</span>
                          <span className={`font-semibold ${pass.rightClass}`}>{pass.right}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Top Seasonal Picks — 1+2 Bento */}
              <section className="w-full bg-surface py-8 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
                    <div className="max-w-xl">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">
                        <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                        Top Seasonal Picks
                      </div>
                      <h2 className="font-display text-lg sm:text-xl font-bold text-on-surface tracking-tight">
                        Prime Corridors, Ranked By Live Signal
                      </h2>
                    </div>
                    <Link
                      href="/explore#map"
                      className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-[15px]">map</span>
                      View on Smart Map
                    </Link>
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-2 gap-5 sm:h-[420px]">
                      <div className="relative sm:row-span-2 h-[340px] sm:h-full rounded-2xl bg-surface-container/70 border border-outline-variant/50 animate-pulse overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      </div>
                      <div className="relative h-[200px] sm:h-full rounded-2xl bg-surface-container/70 border border-outline-variant/50 animate-pulse overflow-hidden" />
                      <div className="relative h-[200px] sm:h-full rounded-2xl bg-surface-container/70 border border-outline-variant/50 animate-pulse overflow-hidden" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-2 gap-5 sm:h-[420px]">
                      {featured[0] && (
                        <div className="relative sm:row-span-2 h-[340px] sm:h-full">
                          <span className="absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full bg-surface-container-lowest border border-outline-variant/60 shadow-subtle flex items-center justify-center font-display text-xs font-bold text-secondary">
                            01
                          </span>
                          <PlaceCard
                            place={featured[0]}
                            variant="cover"
                            prominent
                            regionName={cityById.get(featured[0].city_id)?.region?.name}
                            className="h-full"
                          />
                        </div>
                      )}
                      {featured[1] && (
                        <div className="relative h-[200px] sm:h-full">
                          <span className="absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full bg-surface-container-lowest border border-outline-variant/60 shadow-subtle flex items-center justify-center font-display text-xs font-bold text-secondary">
                            02
                          </span>
                          <PlaceCard
                            place={featured[1]}
                            variant="cover"
                            regionName={cityById.get(featured[1].city_id)?.region?.name}
                            className="h-full"
                          />
                        </div>
                      )}
                      {featured[2] && (
                        <div className="relative h-[200px] sm:h-full">
                          <span className="absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full bg-surface-container-lowest border border-outline-variant/60 shadow-subtle flex items-center justify-center font-display text-xs font-bold text-secondary">
                            03
                          </span>
                          <PlaceCard
                            place={featured[2]}
                            variant="cover"
                            regionName={cityById.get(featured[2].city_id)?.region?.name}
                            className="h-full"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <Link
                    href="/explore#map"
                    className="sm:hidden mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
                  >
                    <span className="material-symbols-outlined text-[15px]">map</span>
                    View on Smart Map
                  </Link>
                </div>
              </section>

              {/* Regional Route Comparison Matrix */}
              <section className="w-full bg-surface-container-low border-y border-outline-variant/40 py-8 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="max-w-2xl mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">
                      <span className="material-symbols-outlined text-[16px]">analytics</span>
                      Travel Routes &amp; Corridor Comparison
                    </div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-on-surface tracking-tight">Compare Major Expedition Vectors</h2>
                    <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                      Evaluate altitude gradients, transit durations from Islamabad, fuel stops, and vehicle specifications.
                    </p>
                  </div>
                  <div className="overflow-x-auto bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-subtle">
                    <table className="min-w-[720px] w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-high border-b border-outline-variant/60 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                          <th className="py-4 px-6">Expedition Vector</th>
                          <th className="py-4 px-4">Province / Area</th>
                          <th className="py-4 px-4">Max Altitude</th>
                          <th className="py-4 px-4">Transit from ISB</th>
                          <th className="py-4 px-4">Optimal Vehicle</th>
                          <th className="py-4 px-4">Current Clearance</th>
                          <th className="py-4 px-6 text-right">Autonomous Plan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/40 text-sm text-on-surface">
                        {CORRIDORS.map((corridor) => (
                          <tr key={corridor.name} className="hover:bg-surface-container-low/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-medium text-on-surface">{corridor.name}</div>
                              <div className="text-xs text-on-surface-variant mt-0.5">{corridor.stops}</div>
                            </td>
                            <td className="py-4 px-4 text-on-surface-variant">{corridor.area}</td>
                            <td className="py-4 px-4">
                              <span className="font-medium text-on-surface">{corridor.altitude}</span> <span className="text-xs text-on-surface-variant">({corridor.altitudeNote})</span>
                            </td>
                            <td className="py-4 px-4 text-on-surface-variant">{corridor.transit}</td>
                            <td className="py-4 px-4">
                              <span className="px-2 py-0.5 rounded bg-surface-container text-xs font-medium text-on-surface">{corridor.vehicle}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary">
                                <span className="w-2 h-2 rounded-full bg-secondary" /> {corridor.clearance}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <Link href="/planner" className="text-sm font-semibold text-secondary hover:underline">
                                Generate →
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Conversion Banner */}
              <section className="w-full bg-surface py-8 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="relative overflow-hidden rounded-3xl bg-primary p-6 sm:p-10 text-on-primary shadow-elevated">
                    <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-secondary/30 blur-3xl pointer-events-none" />
                    <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-tertiary-fixed/20 blur-2xl pointer-events-none" />
                    <div className="relative z-10 max-w-2xl space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold uppercase tracking-wider text-on-primary w-fit">
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        Autonomous Travel Synthesis
                      </div>
                      <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight tracking-tight text-on-primary">
                        Can&rsquo;t decide which geographic frontier suits your calendar?
                      </h2>
                      <p className="text-xs sm:text-sm text-on-primary/80 leading-relaxed">
                        Let the WanderAI Concierge compute an individualized itinerary balancing
                        real-time mountain pass weather, vehicle ground clearance, and
                        acclimatization safety margins.
                      </p>
                      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <Link
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary text-white hover:bg-secondary-dark text-sm font-semibold transition-all shadow-sm hover:shadow-glow"
                          href="/planner"
                        >
                          <span className="material-symbols-outlined text-lg">auto_awesome</span>
                          <span>Launch AI Route Planner</span>
                        </Link>
                        <Link
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-on-primary border border-white/15 text-sm font-semibold transition-colors"
                          href="/explore#map"
                        >
                          <span className="material-symbols-outlined text-lg">map</span>
                          <span>Browse Interactive 3D GIS Map</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* ADD TO TRIP MODAL */}
      {addToTripModalPlace && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setAddToTripModalPlace(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/60 w-full max-w-md overflow-hidden p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-secondary">
                  Expedition Dispatch
                </span>
                <h3 className="font-display text-lg font-bold text-on-surface">
                  Add to Expedition
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
                  {addToTripModalPlace.name}
                </p>
              </div>
              <button
                onClick={() => setAddToTripModalPlace(null)}
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {addStopSuccess && (
              <div className="p-3 bg-secondary/10 border border-secondary/30 rounded-xl text-xs font-semibold text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>{addStopSuccess}</span>
              </div>
            )}

            {addStopError && (
              <div className="p-3 bg-error-container/20 border border-error/30 rounded-xl text-xs font-semibold text-error flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{addStopError}</span>
              </div>
            )}

            {trips.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <span className="material-symbols-outlined text-4xl text-outline mx-auto block">luggage</span>
                <p className="text-sm font-semibold text-on-surface">No Active Expeditions Found</p>
                <p className="text-xs text-on-surface-variant">
                  Generate a blueprint in the AI Planner first to anchor waypoints.
                </p>
                <Link
                  href="/planner"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-white text-xs font-semibold hover:bg-secondary-dark transition-all"
                >
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  <span>Create Expedition</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Target Expedition
                  </label>
                  <select
                    value={selectedTripId}
                    onChange={(e) => {
                      setSelectedTripId(e.target.value);
                      setSelectedDayIndex(1);
                    }}
                    className="w-full bg-surface-container text-on-surface text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:outline-none focus:border-secondary"
                  >
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.duration_days} Days)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Itinerary Day / Stage
                  </label>
                  {(() => {
                    const activeTrip = trips.find((t) => t.id === selectedTripId);
                    const daysCount = activeTrip?.duration_days || 3;
                    return (
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: daysCount }, (_, i) => i + 1).map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setSelectedDayIndex(day)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              selectedDayIndex === day
                                ? "bg-secondary text-white shadow-sm"
                                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                            }`}
                          >
                            Day {day}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddToTripModalPlace(null)}
                    className="px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={addingStop || !selectedTripId}
                    onClick={handleConfirmAddToTrip}
                    className="px-4 py-2 rounded-xl bg-secondary text-white hover:bg-secondary-dark text-xs font-semibold transition-all shadow-sm disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                  >
                    {addingStop ? (
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm">add_location_alt</span>
                    )}
                    <span>{addingStop ? "Attaching..." : "Confirm Attachment"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}