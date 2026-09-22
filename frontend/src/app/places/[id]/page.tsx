"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, placesApi, tripsApi } from "@/lib/api";
import { City, PlaceDetail, PlaceSummary, Trip } from "@/types";
import Navbar from "@/components/Navbar";

type CohortKey = "solo" | "duo" | "family";

const COHORTS: { key: CohortKey; label: string; groupSize: number; multiplier: number }[] = [
  { key: "solo", label: "Solo", groupSize: 1, multiplier: 1.0 },
  { key: "duo", label: "Duo", groupSize: 2, multiplier: 1.6 },
  { key: "family", label: "Family", groupSize: 4, multiplier: 2.8 },
];

const SEASONS = [
  { name: "Spring", temp: "12–22°C", best: "Orchards & alpine blooms", volume: 3 },
  { name: "Summer", temp: "18–30°C", best: "Peak season, clear trails", volume: 5 },
  { name: "Autumn", temp: "8–20°C", best: "Golden foliage & photography", volume: 4 },
  { name: "Winter", temp: "-5–10°C", best: "Snowbound, fewer crowds", volume: 2 },
];

const GASTRO = [
  { dish: "Street food corridors", detail: "Evening bites within walking reach" },
  { dish: "Regional specialties", detail: "Seasonal produce, slow-cooked" },
  { dish: "Tea houses & cafes", detail: "Morning stops along the route" },
];

function DishRow({ dish, detail }: { dish: string; detail: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="material-symbols-outlined text-lg text-secondary mt-0.5">restaurant</span>
      <div>
        <p className="text-sm font-semibold text-on-surface">{dish}</p>
        <p className="text-xs text-on-surface-variant">{detail}</p>
      </div>
    </div>
  );
}

function SeasonCard({
  name,
  temp,
  best,
  volume,
}: {
  name: string;
  temp: string;
  best: string;
  volume: number;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-display font-bold text-on-surface">{name}</p>
        <p className="text-xs font-semibold text-secondary">{temp}</p>
      </div>
      <p className="text-xs text-on-surface-variant">{best}</p>
      <div className="flex items-center gap-1 pt-1">
        {[1, 2, 3, 4, 5].map((dot) => (
          <span
            key={dot}
            className={`h-1.5 w-6 rounded-full ${
              dot <= volume ? "bg-secondary" : "bg-outline-variant"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm">
      <span className="material-symbols-outlined text-xl text-secondary">{icon}</span>
      <p className="font-display text-2xl font-bold tracking-tight text-on-surface mt-3">{value}</p>
      <p className="text-xs text-on-surface-variant mt-1">{label}</p>
    </div>
  );
}

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const placeId = params?.id as string;

  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [city, setCity] = useState<City | null>(null);
  const [siblings, setSiblings] = useState<PlaceSummary[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [cohortKey, setCohortKey] = useState<CohortKey>("duo");
  const [days, setDays] = useState(5);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [addStopOpen, setAddStopOpen] = useState(false);
  const [addStopPlaceId, setAddStopPlaceId] = useState<string | null>(null);
  const [addingStopTripId, setAddingStopTripId] = useState<string | null>(null);
  const [addStopError, setAddStopError] = useState<string | null>(null);

  const [saved, setSaved] = useState(false);
  const [visited, setVisited] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!placeId) return;
      try {
        const [placeRes, citiesRes] = await Promise.all([
          placesApi.getById(placeId),
          placesApi.getCities(),
        ]);
        if (!active) return;
        setPlace(placeRes);
        setCity(citiesRes.find((c: City) => c.id === placeRes.city_id) ?? null);

        if (placeRes.city_id) {
          api.get(`/weather/${placeRes.city_id}`)
            .then((res) => { if (active && res.data) setWeatherData(res.data); })
            .catch(() => {
              api.get(`/cities/${placeRes.city_id}/weather`)
                .then((res) => { if (active && res.data) setWeatherData(res.data); })
                .catch(() => {});
            });
        }

        const [tripList, siblingRes] = await Promise.all([
          tripsApi.list().catch(() => [] as Trip[]),
          placesApi
            .list({ city_id: placeRes.city_id })
            .catch(() => ({ items: [] as PlaceSummary[] })),
        ]);
        if (!active) return;
        setSiblings(
          (siblingRes.items ?? []).filter((p: PlaceSummary) => p.id !== placeId).slice(0, 5)
        );
        setTrips(tripList);
        api
          .post("/interactions", { place_id: placeId, interaction_type: "view" })
          .catch(() => {});
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
  }, [placeId]);

  const cohort = COHORTS.find((c) => c.key === cohortKey) ?? COHORTS[1];

  const dynamicSeasons = useMemo(() => {
    const isAlpine =
      (place?.latitude || 0) > 34.0 ||
      city?.name?.toLowerCase().includes("hunza") ||
      city?.name?.toLowerCase().includes("skardu") ||
      city?.name?.toLowerCase().includes("swat") ||
      city?.name?.toLowerCase().includes("gilgit");

    if (isAlpine) {
      return [
        { name: "Spring (Apr–May)", temp: "8–18°C", best: "Apricot blossoms & thawed streams", volume: 4 },
        { name: "Summer (Jun–Aug)", temp: "16–28°C", best: "Peak alpine trekking & pass clearance", volume: 5 },
        { name: "Autumn (Sep–Nov)", temp: "4–16°C", best: "Golden foliage & crystal visibility", volume: 5 },
        { name: "Winter (Dec–Mar)", temp: "-12–4°C", best: "Snowbound solitude & frozen waterfalls", volume: 2 },
      ];
    }
    return [
      { name: "Spring (Feb–Mar)", temp: "18–26°C", best: "Gardens blooming, pleasant breezes", volume: 4 },
      { name: "Summer (Apr–Aug)", temp: "30–42°C", best: "Early morning sightseeing & cold drinks", volume: 2 },
      { name: "Autumn (Sep–Nov)", temp: "22–32°C", best: "Clear skies & evening dining streets", volume: 5 },
      { name: "Winter (Dec–Jan)", temp: "10–22°C", best: "Peak heritage season & festival bazaars", volume: 5 },
    ];
  }, [place, city]);

  const dynamicGastro = useMemo(() => {
    const cityName = city?.name || "";
    if (cityName.toLowerCase().includes("lahore")) {
      return [
        { dish: "Lahori Karahi & Barbecue", detail: "Slow-simmered wok spices at Fort Road Food Street" },
        { dish: "Shahi Tukray & Falooda", detail: "Traditional Mughal royal milk and saffron sweets" },
        { dish: "Kashmiri Pink Chai", detail: "Cardamom & crushed pistachios at Delhi Gate" },
      ];
    }
    if (cityName.toLowerCase().includes("hunza") || cityName.toLowerCase().includes("gilgit")) {
      return [
        { dish: "Hunza Chapshuro", detail: "Crispy wood-baked minced meat & mountain herb pie" },
        { dish: "Apricot Soup (Chamus)", detail: "Warm sun-dried organic apricot nectar" },
        { dish: "Gyal & Local Walnut Cake", detail: "Stone-ground wheat crepe with pure apricot kernel oil" },
      ];
    }
    if (cityName.toLowerCase().includes("skardu")) {
      return [
        { dish: "Balti Marzan & Trout", detail: "Fresh cold-stream river trout with buckwheat paste" },
        { dish: "Butter Tea (Poyu Cha)", detail: "Aromatic Himalayan salted butter tea" },
        { dish: "Mamtu Dumplings", detail: "Steamed spicy mountain meat dumplings with red sauce" },
      ];
    }
    return [
      { dish: `${cityName || "Regional"} Street Food`, detail: "Evening specialty stalls within walking reach" },
      { dish: "Slow-Cooked Delicacies", detail: "Local seasonal produce and clay pot specialties" },
      { dish: "Tea Houses & Roasteries", detail: "Traditional chai and local roasters along the avenue" },
    ];
  }, [place, city]);

  const baseRate = useMemo(() => {
    if (!place?.estimated_cost_max) return 8400;

    return Math.max(2000, Math.round((place.estimated_cost_max * 0.55) / 100) * 100);
  }, [place]);

  const totalBudget = Math.round(baseRate * cohort.multiplier * days);
  const regionName = city?.region?.name ?? "Northern Corridors";
  const seasonNote =
    typeof place?.seasonality?.note === "string"
      ? place.seasonality.note
      : "Year-Round Access";
  const anchors = siblings.length + 1;
  const connectivity = Math.round((place?.data_confidence ?? 0.95) * 100);

  const handleCreateTrip = useCallback(() => {
    if (!place) return;
    const params = new URLSearchParams();
    params.set("place_id", place.id);
    params.set("place_name", place.name);
    if (place.city_id) params.set("city_id", place.city_id);
    if (city?.name) params.set("city_name", city.name);
    params.set("days", days.toString());
    params.set("cohort", cohortKey);

    router.push(`/planner?${params.toString()}`);
  }, [place, city, days, cohortKey, router]);

  const handleAddStop = useCallback(
    async (trip: Trip) => {
      if (!addStopPlaceId) return;
      setAddingStopTripId(trip.id);
      setAddStopError(null);
      try {
        await tripsApi.addStop(trip.id, { place_id: addStopPlaceId });
        router.push(`/trips/${trip.id}`);
      } catch (err: unknown) {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
        setAddStopError(detail ?? "Could not add this stop to the trip.");
        setAddingStopTripId(null);
      }
    },
    [addStopPlaceId, router]
  );

  const openAddStop = (targetPlaceId: string) => {
    setAddStopPlaceId(targetPlaceId);
    setAddStopError(null);
    setAddStopOpen(true);
  };

  const handleLogInteraction = async (type: "save" | "visit" | "share") => {
    if (!placeId) return;
    try {
      await api.post("/interactions", { place_id: placeId, interaction_type: type });
      if (type === "save") setSaved(!saved);
      if (type === "visit") setVisited(true);
    } catch (err) {
      console.error("Failed to record interaction", err);
    }
  };

  if (!loading && (!place || loadError)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">
          explore_off
        </span>
        <h2 className="font-display text-2xl font-bold text-on-surface mb-2">
          Place Not Found
        </h2>
        <p className="text-on-surface-variant text-sm mb-6">
          The requested destination record could not be loaded.
        </p>
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-display text-sm font-semibold transition-all shadow-sm hover:shadow-glow"
        >
          <span>Back to Explore</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-body-md">
      <Navbar tripsCount={trips.length} />

      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-8 pt-24 pb-16 space-y-10">
        <div className="py-6 space-y-6">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-on-surface-variant font-medium">
            <Link href="/explore" className="hover:text-secondary transition-colors">
              Explore
            </Link>
            <span className="material-symbols-outlined text-sm text-outline">
              chevron_right
            </span>
            <span>{regionName}</span>
            <span className="material-symbols-outlined text-sm text-outline">
              chevron_right
            </span>
            <span className="text-on-surface font-semibold">
              {place ? place.name : <span className="inline-block w-28 h-3.5 rounded bg-surface-container animate-pulse align-middle" />}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {place?.is_unesco_heritage && (
              <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-xs font-bold text-amber-700 dark:text-amber-300">
                <span className="material-symbols-outlined text-sm text-amber-500">workspace_premium</span>
                UNESCO World Heritage Site
              </div>
            )}
            {place?.elevation_meters && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/50 text-xs font-semibold text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-secondary">landscape</span>
                {place.elevation_meters.toLocaleString()}m Altitude
              </div>
            )}
            {place?.vehicle_access && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/50 text-xs font-semibold text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-secondary">
                  {place.vehicle_access === "4x4_jeep" ? "directions_car" : place.vehicle_access === "trekking_only" ? "hiking" : "directions_car"}
                </span>
                {place.vehicle_access === "4x4_jeep" ? "4x4 Jeep Required" : place.vehicle_access === "trekking_only" ? "Trekking Route Only" : "Sedan Accessible"}
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/50 text-xs font-semibold text-on-surface-variant">
              <span className="material-symbols-outlined text-sm text-secondary">
                my_location
              </span>
              {place ? `${place.latitude.toFixed(4)}°N, ${place.longitude.toFixed(4)}°E` : "35.4222°N, 75.4497°E"}
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/50 text-xs font-semibold text-on-surface-variant">
              <span className="material-symbols-outlined text-sm text-secondary">route</span>
              {regionName} Corridor
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/50 text-xs font-semibold text-on-surface-variant">
              <span className="material-symbols-outlined text-sm text-secondary">verified</span>
              {connectivity}% Data Confidence
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/50 text-xs font-semibold text-on-surface-variant">
              <span className="material-symbols-outlined text-sm text-secondary">wb_sunny</span>
              {seasonNote}
            </div>
          </div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          <div className="lg:col-span-2 relative rounded-3xl overflow-hidden border border-outline-variant/60 shadow-elevated min-h-[380px] sm:min-h-[440px] bg-surface-container">
            {place?.primary_image?.url || city?.image_url ? (
              <img
                src={place?.primary_image?.url || city?.image_url}
                alt={place?.name || "Destination landscape"}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-surface-container-high/80 animate-pulse flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-outline">
                  landscape
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />

            <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-bold">
                  {place?.category?.name ?? "Heritage & Scenic"}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs capitalize">
                  {place?.indoor_outdoor ?? "Outdoor"}
                </span>
                {place?.family_suitable && (
                  <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs">
                    Family Friendly
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLogInteraction("save")}
                  className={`p-2.5 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                    saved
                      ? "bg-secondary border-secondary text-white"
                      : "bg-white/15 border-white/25 text-white hover:bg-white/25"
                  }`}
                  title={saved ? "Saved" : "Save Place"}
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">
                    {saved ? "bookmark" : "bookmark_add"}
                  </span>
                </button>
                <button
                  onClick={() => handleLogInteraction("visit")}
                  className={`p-2.5 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                    visited
                      ? "bg-secondary border-secondary text-white"
                      : "bg-white/15 border-white/25 text-white hover:bg-white/25"
                  }`}
                  title={visited ? "Visited" : "Mark Visited"}
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">
                    {visited ? "check_circle" : "radio_button_unchecked"}
                  </span>
                </button>
                <button
                  onClick={() => handleLogInteraction("share")}
                  className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white hover:bg-white/25 transition-all cursor-pointer"
                  title="Share"
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">share</span>
                </button>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <p className="font-mono text-[11px] uppercase tracking-wider text-white/80 font-semibold mb-2">
                {regionName} · {city?.name ?? "Verified Destination"}
              </p>
              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  {place ? place.name : <span className="inline-block w-64 h-8 rounded-lg bg-white/20 animate-pulse align-middle" />}
                </h1>
                {place?.name_ur && (
                  <span className="text-xl sm:text-2xl text-emerald-300 font-semibold font-serif dir-rtl">
                    {place.name_ur}
                  </span>
                )}
              </div>
              {place?.description ? (
                <p className="mt-3 max-w-xl text-sm text-white/85 leading-relaxed">
                  {place.description.slice(0, 220)}
                  {place.description.length > 220 ? "…" : ""}
                </p>
              ) : loading ? (
                <div className="mt-3 space-y-1.5 max-w-xl">
                  <div className="w-full h-3.5 rounded bg-white/20 animate-pulse" />
                  <div className="w-4/5 h-3.5 rounded bg-white/20 animate-pulse" />
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 sm:p-7 shadow-luxury flex flex-col gap-6">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-secondary font-semibold mb-1">
                Autonomous Trip Engine
              </p>
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-on-surface">
                Plan an Expedition
              </h2>
            </div>

            <div>
              <p className="text-xs font-semibold text-on-surface-variant mb-2">Cohort</p>
              <div className="grid grid-cols-3 gap-2">
                {COHORTS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCohortKey(c.key)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      cohort.key === c.key
                        ? "bg-secondary text-white shadow-sm"
                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                    type="button"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-on-surface-variant">Duration</p>
                <p className="text-xs font-bold text-secondary">{days}-Day Expedition</p>
              </div>
              <input
                type="range"
                min={3}
                max={10}
                step={1}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full accent-secondary"
                aria-label="Expedition duration in days"
              />
              <div className="flex justify-between text-[11px] font-mono font-semibold text-on-surface-variant mt-1.5">
                <span>3</span>
                <span>5</span>
                <span>7</span>
                <span>10</span>
              </div>
            </div>

            <div className="rounded-xl bg-surface-container-low border border-outline-variant/60 p-4 space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-wider text-outline font-semibold">
                Estimated Cost
              </p>
              <p className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
                PKR {totalBudget.toLocaleString()}
              </p>
              <p className="text-xs text-on-surface-variant">
                {baseRate.toLocaleString()}/day × {cohort.label} × {days} days
              </p>
            </div>

            {createError && (
              <p className="text-xs font-semibold text-error-container bg-error-container/40 px-3 py-2 rounded-xl">
                {createError}
              </p>
            )}

            <div className="flex flex-col gap-2.5 mt-auto">
              <button
                onClick={handleCreateTrip}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-display text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow-glow hover:-translate-y-0.5 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">tune</span>
                Customize & Generate Route
              </button>
              <button
                onClick={() => place && openAddStop(place.id)}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl border border-secondary text-secondary hover:bg-secondary-light font-display text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">add_location_alt</span>
                Add to Itinerary
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon="route"
              value={`${anchors}-Node Corridor`}
              label={`${regionName} · synthesized waypoints`}
            />
            <StatCard icon="wb_sunny" value="Prime Windows" label={seasonNote.slice(0, 40)} />
            <StatCard
              icon="tour"
              value={`${anchors}`}
              label="Audited anchors in destination"
            />
            <StatCard
              icon="verified"
              value={`${connectivity}%`}
              label="RAG citation confidence"
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                Telemetry
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface">
                Seasonality & Climate Matrix
              </h2>
            </div>
            {weatherData && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/60 text-xs font-semibold text-on-surface">
                <span className="material-symbols-outlined text-secondary text-base">thermostat</span>
                <span>{weatherData.temperature_celsius}°C</span>
                <span className="text-on-surface-variant font-normal">· {weatherData.condition}</span>
                <span className="text-emerald-700 font-mono text-[11px] font-bold">({weatherData.humidity_percent}% humidity)</span>
              </div>
            )}
          </div>
          {weatherData?.alert && (
            <div className="p-3.5 rounded-xl bg-secondary-container/40 border border-secondary/30 text-xs text-on-surface flex items-start gap-2.5">
              <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">info</span>
              <div>
                <span className="font-bold text-secondary">Local Advisory: </span>
                <span>{weatherData.alert}</span>
                {weatherData.pass_clearance && (
                  <span className="block mt-1 font-mono text-[11px] text-on-surface-variant font-medium">
                    Route Clearance: {weatherData.pass_clearance}
                  </span>
                )}
              </div>
            </div>
          )}
          {weatherData?.forecast && Array.isArray(weatherData.forecast) && (
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">wb_sunny</span>
                  5-Day Live Atmospheric Forecast
                </span>
                <span className="text-[11px] font-mono text-on-surface-variant font-semibold">
                  PMD Synchronized
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {weatherData.forecast.map((f: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/40 flex flex-col items-center text-center gap-1"
                  >
                    <span className="text-[11px] font-mono font-bold text-on-surface-variant">
                      {f.day}
                    </span>
                    <span className="material-symbols-outlined text-xl text-secondary my-0.5">
                      {f.condition === "rain" ? "rainy" : f.condition === "snow" ? "ac_unit" : f.condition === "partly_cloudy" ? "partly_cloudy_day" : "wb_sunny"}
                    </span>
                    <span className="text-xs font-bold text-on-surface">
                      {f.temp_max}°C <span className="text-[10px] text-on-surface-variant font-normal">/ {f.temp_min}°C</span>
                    </span>
                    <span className="text-[10px] text-on-surface-variant capitalize">
                      {f.condition?.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {dynamicSeasons.map((s) => (
              <SeasonCard key={s.name} {...s} />
            ))}
          </div>
          {typeof place?.seasonality?.note === "string" && (
            <p className="text-xs text-on-surface-variant">{place.seasonality.note}</p>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Audited Anchors
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface">
              Curated Waypoint Dossiers
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden shadow-sm animate-pulse flex flex-col h-72">
                  <div className="h-40 bg-surface-container" />
                  <div className="p-5 space-y-3 flex-1">
                    <div className="w-3/4 h-4 rounded bg-surface-container" />
                    <div className="w-full h-3 rounded bg-surface-container" />
                    <div className="w-1/2 h-3 rounded bg-surface-container" />
                  </div>
                </div>
              ))
            ) : siblings.map((sibling, idx) => (
              <article
                key={sibling.id}
                className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden shadow-sm hover:shadow-elevated transition-all flex flex-col"
              >
                <div className="relative h-40">
                  {sibling.primary_image?.url ? (
                    <img
                      src={sibling.primary_image.url}
                      alt={sibling.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-outline">
                        landscape
                      </span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md text-white font-display text-xs font-bold">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="p-5 space-y-3 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display font-bold text-base text-on-surface">
                      {sibling.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-light text-secondary text-[10px] font-bold uppercase tracking-wide">
                      {sibling.category.name}
                    </span>
                  </div>
                  {sibling.description && (
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {sibling.description.slice(0, 110)}
                      {sibling.description.length > 110 ? "…" : ""}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs font-semibold text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {sibling.average_visit_duration_minutes || 90} min
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">payments</span>
                      PKR {(sibling.estimated_cost_max ?? 500).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-accent">star</span>
                      {Math.round((sibling.popularity_score ?? 0) * 100)}%
                    </span>
                  </div>
                  <button
                    onClick={() => openAddStop(sibling.id)}
                    className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-secondary text-secondary hover:bg-secondary hover:text-white transition-all text-xs font-semibold cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">add_location_alt</span>
                    Add Anchor
                  </button>
                </div>
              </article>
            ))}

            <article className="relative rounded-xl overflow-hidden bg-secondary text-white shadow-sm flex flex-col justify-between min-h-[280px]">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full border border-white/40" />
                <div className="absolute -top-4 -right-4 w-28 h-28 rounded-full border border-white/40" />
                <div className="absolute bottom-6 left-8 w-24 h-24 rounded-full border border-white/30" />
                <span className="material-symbols-outlined absolute bottom-8 left-10 text-3xl">
                  radar
                </span>
              </div>
              <div className="relative p-6 space-y-3">
                <span className="material-symbols-outlined text-3xl">map</span>
                <h3 className="font-display text-xl font-bold">Smart Map Engine</h3>
                <p className="text-sm text-white/85">
                  All audited anchors localized in real space with route vectors.
                </p>
              </div>
              <Link
                href="/explore#map"
                className="relative m-4 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-secondary hover:bg-white/90 font-display text-sm font-semibold transition-all"
              >
                Open Interactive Map
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </article>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Local Texture
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface">
              Gastronomy, Culture & Lodging
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-secondary">
                  restaurant
                </span>
                <h3 className="font-display font-bold text-base text-on-surface">
                  Gastronomic Heritage
                </h3>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-on-surface-variant">Food relevance</span>
                  <span className="text-secondary">
                    {Math.round((place?.food_relevance ?? 0.5) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full rounded-full bg-secondary transition-all"
                    style={{ width: `${Math.round((place?.food_relevance ?? 0.5) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                {dynamicGastro.map((g) => (
                  <DishRow key={g.dish} {...g} />
                ))}
              </div>
            </div>


            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-secondary">
                  account_balance
                </span>
                <h3 className="font-display font-bold text-base text-on-surface">
                  Cultural Protocol
                </h3>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-on-surface-variant">Historical depth</span>
                  <span className="text-secondary">
                    {Math.round((place?.historical_significance ?? 0.5) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full rounded-full bg-secondary transition-all"
                    style={{
                      width: `${Math.round((place?.historical_significance ?? 0.5) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Dress modestly, seek permission before photographing people, and observe
                local customs across {regionName}. Seasonal festivals shape access windows —
                confirm dates before departure.
              </p>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-secondary">hotel</span>
                <h3 className="font-display font-bold text-base text-on-surface">Curated Lodging</h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {city?.name ?? "The destination"} offers base camps, heritage stays, and
                guest houses within reach of this waypoint. Generate a custom route to lock
                in a full expedition plan with optimized overnights.
              </p>
              <Link
                href="/trips"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-secondary-dark transition-colors"
              >
                Browse Trip Bases
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {addStopOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setAddStopOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-3xl shadow-elevated w-full max-w-md border border-outline-variant/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-outline-variant/60 flex items-center justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-secondary font-semibold">
                  Add Stop
                </p>
                <h3 className="font-display text-lg font-semibold text-on-surface">
                  Pick an existing trip
                </h3>
              </div>
              <button
                onClick={() => setAddStopOpen(false)}
                className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
                title="Close"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="px-6 py-4 max-h-[50vh] overflow-y-auto space-y-2">
              {addStopError && (
                <p className="text-xs font-semibold text-error-container bg-error-container/40 px-3 py-2 rounded-xl">
                  {addStopError}
                </p>
              )}
              {trips.length === 0 && !addStopError && (
                <div className="text-center py-8 space-y-3">
                  <span className="material-symbols-outlined text-4xl text-outline mx-auto block">
                    luggage
                  </span>
                  <p className="text-sm font-semibold text-on-surface">No trips yet</p>
                  <p className="text-xs text-on-surface-variant">
                    Create one first, then anchor this stop to it.
                  </p>
                  <Link
                    href="/planner"
                    onClick={() => setAddStopOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-display text-xs font-semibold transition-all"
                  >
                    Open AI Planner
                  </Link>
                </div>
              )}
              {trips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => handleAddStop(trip)}
                  disabled={addingStopTripId === trip.id}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container/60 hover:border-secondary/40 transition-all text-left disabled:opacity-60 cursor-pointer"
                  type="button"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">
                      {trip.title}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {trip.duration_days}-day · {trip.pace}
                    </p>
                  </div>
                  {addingStopTripId === trip.id ? (
                    <span className="material-symbols-outlined text-lg text-secondary animate-spin">
                      progress_activity
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-lg text-secondary">
                      add_circle
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/60 bg-surface-container/50">
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                The stop is appended to the trip's last itinerary day with optimized timing
                and cost telemetry.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}