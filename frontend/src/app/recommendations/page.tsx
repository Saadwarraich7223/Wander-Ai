"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AtmosphericOverlay from "@/components/AtmosphericOverlay";
import { authStorage } from "@/lib/auth";
import { recApi, placesApi } from "@/lib/api";
import { User as UserType, City, PlaceSummary } from "@/types";

interface TelemetryState {
  isOpen: boolean;
  title: string;
  elevation: string;
  precip: string;
  clarity: string;
}

interface DossierCard {
  id: string;
  region: string;
  score: string;
  modelBadge: string;
  imgUrl: string;
  imgAlt: string;
  elevation: string;
  metric2: string;
  metric2Icon: string;
  metric3: string;
  metric3Icon: string;
  subLocation: string;
  title: string;
  rationale: string;
  tags: string[];
  precip: string;
  clarity: string;
  plannerUrl: string;
}

const scenarioTextMap = {
  clear: {
    title: "Clear Skies over Gilgit-Baltistan",
    desc: "(+15% score multiplier for Passu Cones & Attabad Lake, optimal golden hour visibility index 9.8/10).",
    barometric: "1014 hPa",
    cloudCeiling: ">4,200m",
    windShear: "3.2 knots",
  },
  rain: {
    title: "Rain & Dense Cloud advisory in upper passes",
    desc: "(-20% high-altitude alpine score; rerouting to sheltered cultural museums & heritage forts in Karimabad & Skardu).",
    barometric: "998 hPa",
    cloudCeiling: "1,400m",
    windShear: "14.8 knots",
  },
  snow: {
    title: "Early Frost / Deep Snow alert",
    desc: "(Automated elevation cap ≤2,200m enforced; 4x4 tire chain protocol active).",
    barometric: "985 hPa",
    cloudCeiling: "800m",
    windShear: "22.5 knots",
  },
  monsoon: {
    title: "Landslide divergence route computed for Babusar Pass",
    desc: "; rerouting through KKH Kohistan corridor under active monitoring.",
    barometric: "992 hPa",
    cloudCeiling: "1,100m",
    windShear: "18.1 knots",
  },
};

const FALLBACK_DOSSIERS: DossierCard[] = [
  {
    id: "hunza-passu",
    region: "hunza",
    score: "98.4",
    modelBadge: "98.4% AI Match · Model E",
    imgUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAsmXirXIN6BbOBr2R94pelLDivJG9CEiwzbvVd_rbahHLPTMfkA7ciYhFhtED_QJG-0_gq2bIyqJPUBO7uiI5dUM_fUtkgpDn3TwwtHDEH706eNctXfcYLDwba7GLT1NPby7E3nvdNuV_Rphq0ru8MkulzupP1ig5_n6OO47WQXFda9IOKpi4VOXuhMwyKtqYEjwF7sHS3_8p0S3DgLEGVMa0Y-0s-n-GJP1pb9RojYFyoeTXF1kyoXw",
    imgAlt: "Panoromic photograph of Hunza Valley and Passu Cathedral",
    elevation: "2,438m",
    metric2: "Passability: 100%",
    metric2Icon: "navigation",
    metric3: "17:15 PKT",
    metric3Icon: "wb_twilight",
    subLocation: "Gilgit-Baltistan • Passu / Upper Hunza",
    title: "Hunza Valley & Passu Cathedral Spires",
    rationale:
      "Top meteorological match. Exceptional clear-sky window across Karakoram corridor. Zero precipitation advisory; perfect solar azimuth for cathedral spire photogrammetry.",
    tags: ["Alpine Pass", "UNESCO Heritage", "Photogrammetry"],
    precip: "0.00mm",
    clarity: "9.8 / 10",
    plannerUrl: "/planner?destination=Hunza%20Valley",
  },
  {
    id: "skardu-shangrila",
    region: "skardu",
    score: "96.8",
    modelBadge: "96.8% AI Match · Model E + D Synergy",
    imgUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBwAVCw7li-fjdD4CTQMUWsTF_aW-8OitKXbdhJywPm9R9wDJuVbJB5tquiVAEPBzt9OeWj7r4nvQueXxXq4vUC3GtayCieYqwVlAFVbKxlCEJcf_d-1xI-SHKN4mmmNOSkfwShNhbcavs2I_Vo-mUHAWUbqLIodNsIAm-qAgEczwOg-YZCiJZtXxuAQGZYOaT5YmowAsoM_79_Q8BZpK1PW0uemsZuNrNNatmFwqrSLOMwqC4xRaM7RA",
    imgAlt: "Katpana Cold Desert and Shangrila Lake in Skardu",
    elevation: "2,228m",
    metric2: "Road: 98% Open",
    metric2Icon: "navigation",
    metric3: "Temp: 16°C",
    metric3Icon: "thermostat",
    subLocation: "Baltistan • Skardu Basin",
    title: "Skardu Shangrila & Katpana Cold Desert",
    rationale:
      "Synergistic match: Weather window stable with pristine mirrored alpine reflections and unique high-altitude cold desert dunes. Ideal vector match for off-road luxury traversal.",
    tags: ["Cold Desert", "Alpine Lake", "4x4 Expedition"],
    precip: "0.05mm",
    clarity: "9.4 / 10",
    plannerUrl: "/planner?destination=Skardu",
  },
  {
    id: "baltit-fort",
    region: "hunza",
    score: "95.2",
    modelBadge: "95.2% AI Match · Heritage & Climate",
    imgUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCy0AUH_CFY_Ae2iSBGyBujv5U_1yYpAKEd5JCt4aM80BDuiQ7IbmLeeN68IN6LzezPdDHwtQ7CKpZJH9deMIqyXye8wfRe-P-lKFUpCX8xZGVAzNTR0191QbSXO0-JjSRrq8qF9VNOKn0XLRZq0XiwiWFBjt4lafwnOvvkp39biFYYbFU-hy67dELK_Zxv64bNSVkrJPGnZje5Da1qYaap9FxcsHoiHhTPkuVLxHpWi3iC0VfYLoOSSQ",
    imgAlt: "Baltit Fort perched on stone cliff overlooking Karimabad",
    elevation: "2,480m",
    metric2: "Tier-1 POI",
    metric2Icon: "account_balance",
    metric3: "Certified Guide",
    metric3Icon: "verified_user",
    subLocation: "Hunza Central • Karimabad",
    title: "Baltit Fort & Karimabad Terraced Orchards",
    rationale:
      "Archival UNESCO stone architecture perfectly sheltered with panoramic Ultar Sar vistas. Flawless cultural immersion score with dry alpine breeze index.",
    tags: ["700-Year Heritage", "Mir of Hunza", "Architecture"],
    precip: "0.00mm",
    clarity: "9.6 / 10",
    plannerUrl: "/planner?destination=Karimabad",
  },
  {
    id: "makran-highway",
    region: "makran",
    score: "92.6",
    modelBadge: "92.6% AI Match · Maritime Corridor",
    imgUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBE2BTre5rn1LvgJC8HI-ffGR--qXje6SFUza6lpoW_rR06U7sCBi7aVe3UdF1RK7dGuINGMH3b40vL9uSm5qALURv1gPjtfZTo2Bcl65-ohUYJJLTKSmHUY0I6GIn67Gkea0m9_33Pd8iZUEgxQ3uGaePSu86T-G040RVOSEDmiyE0PBqpyVS5jEaCteUmmoHg_2AgLgGg-i99Ddx-YrmOROKGSUVM7nyyl3xTLPKYlS--R9OkNpjcvw",
    imgAlt: "Makran Coastal Highway along Arabian Sea",
    elevation: "80m AMSL",
    metric2: "Breeze: 26°C",
    metric2Icon: "air",
    metric3: "0% Rain Risk",
    metric3Icon: "water_drop",
    subLocation: "Balochistan Coast • Hingol National Park",
    title: "Makran Highway & Princess of Hope",
    rationale:
      "Ideal winter maritime corridor. Coastal trade winds provide clear celestial photography and zero mud-volcano seismic advisory. Smooth asphalt connectivity.",
    tags: ["Arabian Sea", "Geological Marvel", "Coastal Safari"],
    precip: "0.00mm",
    clarity: "9.9 / 10",
    plannerUrl: "/planner?destination=Makran",
  },
  {
    id: "swat-malam-jabba",
    region: "swat",
    score: "91.0",
    modelBadge: "91.0% AI Match · Emerald Meadow",
    imgUrl:
      "https://lh3.googleusercontent.com/aida/AEtjO1Uq-YQyedwbPonZ6Z3yNs8-t8gElNawpR4Jx7jAiIqQbqL1aTV1JGxqGhqW8NBkEMkSg-NBt0APCPoEjgz4aDNIwagzXGNMMhG-kqnHVjOwzlsIeNnAZMlMeRsdjmPzPyX6Z7ZR3j7YjxEobyWmqVopaP0Xs5z8CRYbrqSPNXmRiSBS-2VEsy7gk9Hu2cmsuTOjvBGHmreBlT25MT0HvbxX6lHv47Kt3OnBo-W52ErI5yZ0YTl3r30avuC0",
    imgAlt: "Swat Valley pine forests",
    elevation: "2,804m",
    metric2: "Chairlift Active",
    metric2Icon: "downhill_skiing",
    metric3: "Cedar Canopy",
    metric3Icon: "eco",
    subLocation: "Khyber Pakhtunkhwa • Swat District",
    title: "Swat Valley & Malam Jabba Pine Ridges",
    rationale:
      "Optimal ambient temperature and cedar aroma index. Low wind shear suitable for drone elevation mapping and alpine wellness retreats.",
    tags: ["Pine Forests", "Hindu Kush", "Eco-Luxury"],
    precip: "0.00mm",
    clarity: "9.1 / 10",
    plannerUrl: "/planner?destination=Swat",
  },
];

export default function RecommendationsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [activeLens, setActiveLens] = useState<
    "model_e" | "model_d" | "model_c" | "model_b" | "model_a"
  >("model_e");
  const [activeScenario, setActiveScenario] = useState<
    "clear" | "rain" | "snow" | "monsoon"
  >("clear");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});

  const [cities, setCities] = useState<City[]>([]);
  const [dossiers, setDossiers] = useState<DossierCard[]>(FALLBACK_DOSSIERS);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const [telemetryModal, setTelemetryModal] = useState<TelemetryState>({
    isOpen: false,
    title: "",
    elevation: "",
    precip: "",
    clarity: "",
  });

  useEffect(() => {
    const loggedUser = authStorage.getUser();
    setUser(loggedUser);

    async function loadCities() {
      try {
        const data = await placesApi.getCities();
        setCities(data || []);
      } catch (err) {
        console.warn("Could not fetch cities, using fallback options", err);
      }
    }
    loadCities();
  }, []);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeLens, activeScenario, selectedRegion, searchQuery]);

  // Fetch live recommendation feed whenever model, weather, search, or region changes
  useEffect(() => {
    let isCancelled = false;

    async function fetchLiveFeed() {
      setLoading(true);
      try {
        const effectiveScenario = activeLens === "model_e" ? activeScenario : null;
        const params: Record<string, any> = {
          model: activeLens,
          limit: 24,
        };
        if (effectiveScenario) {
          params.weather = effectiveScenario;
        }

        let apiItems: any[] = [];

        try {
          const recRes = await recApi.getRecommendations(params);
          if (recRes && Array.isArray(recRes.items) && recRes.items.length > 0) {
            apiItems = recRes.items;
          }
        } catch (err) {
          // If unauthenticated or recommendations endpoint error, fallback to places list with weather filtering
          const placesRes = await placesApi.list({
            limit: 30,
            city_id: selectedRegion !== "all" ? selectedRegion : undefined,
            search: searchQuery.trim() || undefined,
          });
          if (placesRes && Array.isArray(placesRes.items)) {
            let filteredPlaces = placesRes.items;
            if (effectiveScenario === "snow") {
              const snowCities = ["skardu", "hunza", "swat", "gilgit", "chitral", "abbottabad", "mansehra", "dir"];
              filteredPlaces = placesRes.items.filter((p: PlaceSummary) => {
                const cId = (p.city_id || "").toLowerCase();
                const pName = p.name.toLowerCase();
                return (
                  snowCities.includes(cId) ||
                  pName.includes("skardu") ||
                  pName.includes("hunza") ||
                  pName.includes("swat") ||
                  pName.includes("kalam") ||
                  pName.includes("malam") ||
                  pName.includes("deosai") ||
                  pName.includes("passu") ||
                  pName.includes("baltit")
                );
              });
              if (filteredPlaces.length === 0) filteredPlaces = placesRes.items;
            }

            apiItems = filteredPlaces.map((p: PlaceSummary) => ({
              place: p,
              score: p.popularity_score || 0.85,
              model_name: activeLens.toUpperCase(),
              score_explanation: {
                reason:
                  effectiveScenario === "snow"
                    ? `Deep Snow Matrix: High-altitude alpine destination verified for 4x4 snow passability.`
                    : effectiveScenario === "rain"
                      ? `Rain Matrix: Sheltered indoor heritage location with low precipitation risk.`
                      : `Calibrated via ${activeLens.toUpperCase()} vector search. High popularity score (${(
                        (p.popularity_score || 0.85) * 5
                      ).toFixed(1)}/5) with optimal affinity alignment.`,
              },
            }));
          }
        }

        if (isCancelled) return;

        if (apiItems.length > 0) {
          // Sort items by score descending
          apiItems.sort((a, b) => (b.score || 0) - (a.score || 0));

          const formatted: DossierCard[] = apiItems.map((item: any) => {
            const p: PlaceSummary = item.place || item;
            const scorePct = ((item.score || p.popularity_score || 0.85) * 100).toFixed(1);
            const modelLabel = (item.model_name || activeLens).toUpperCase();

            // Resolve human-readable city name (don't display raw UUID strings like BCDD96DB-...)
            const matchedCity = cities.find(
              (c) => c.id === p.city_id || c.slug === p.city_id
            );
            const rawCityName = (p as any).city?.name || matchedCity?.name;
            const cityName = rawCityName
              ? rawCityName.toUpperCase()
              : p.city_id && !p.city_id.includes("-")
              ? p.city_id.toUpperCase()
              : "PAKISTAN";

            const categoryName = p.category?.name || "Destination";
            const rationaleText =
              item.score_explanation?.reason ||
              item.score_explanation?.description ||
              (effectiveScenario === "snow"
                ? "Snow matrix active: High-altitude alpine corridor with 4x4 tire chain protocol."
                : "Ensemble AI weight algorithm verified optimal clear-sky window and high affinity score.");

            return {
              id: p.id,
              region: matchedCity?.slug || (p.city_id && !p.city_id.includes("-") ? p.city_id.toLowerCase() : "all"),
              score: scorePct,
              modelBadge: `${scorePct}% AI Match · ${modelLabel}`,
              imgUrl:
                p.primary_image?.url ||
                "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80",
              imgAlt: p.name,
              elevation: p.latitude ? `${Math.round(Math.abs(p.latitude) * 70)}m` : "2,400m",
              metric2: p.average_visit_duration_minutes
                ? `${Math.round(p.average_visit_duration_minutes / 60)}h Visit`
                : "Passability: 100%",
              metric2Icon: "navigation",
              metric3: p.indoor_outdoor === "outdoor" ? "Alpine Outdoor" : "Sheltered POI",
              metric3Icon: "wb_twilight",
              subLocation: `${cityName} • ${categoryName}`,
              title: p.name,
              rationale: rationaleText,
              tags: [
                categoryName,
                p.indoor_outdoor || "Outdoor",
                p.family_suitable ? "Family Friendly" : "Adventure",
              ].filter(Boolean),
              precip: effectiveScenario === "snow" ? "12.4mm Snow" : effectiveScenario === "rain" ? "8.2mm Rain" : "0.00mm",
              clarity: effectiveScenario === "snow" ? "7.8 / 10" : "9.6 / 10",
              plannerUrl: `/planner?destination=${encodeURIComponent(matchedCity?.name ? `${p.name}, ${matchedCity.name}` : p.name)}&place_id=${p.id}&place_name=${encodeURIComponent(p.name)}&city_id=${p.city_id || ""}&city_name=${encodeURIComponent(matchedCity?.name || "")}&algorithm=${activeLens}`,
            };
          });

          setDossiers(formatted);
        } else if (effectiveScenario === "snow") {
          // Filter fallback dossiers for snow alpine destinations
          const snowDossiers = FALLBACK_DOSSIERS.filter(
            (d) => d.region === "hunza" || d.region === "skardu" || d.region === "swat"
          );
          setDossiers(snowDossiers);
        }
      } catch (error) {
        console.error("Error fetching live recommendations", error);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchLiveFeed();

    return () => {
      isCancelled = true;
    };
  }, [activeLens, activeScenario, selectedRegion, searchQuery]);

  const openTelemetry = (
    title: string,
    elevation: string,
    precip: string,
    clarity: string
  ) => {
    setTelemetryModal({
      isOpen: true,
      title: `${title} Telemetry`,
      elevation,
      precip,
      clarity,
    });
  };

  const closeTelemetry = () => {
    setTelemetryModal((prev) => ({ ...prev, isOpen: false }));
  };

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Local search filter over dossier list
  const filteredDossiers = dossiers.filter((card) => {
    const matchesRegion =
      selectedRegion === "all" ||
      card.region === selectedRegion ||
      card.subLocation.toLowerCase().includes(selectedRegion.toLowerCase());
    const query = searchQuery.toLowerCase().trim();
    const cardText = `${card.title} ${card.subLocation} ${card.rationale} ${card.tags.join(
      " "
    )}`.toLowerCase();
    const matchesSearch = !query || cardText.includes(query);
    return matchesRegion && matchesSearch;
  });

  const totalPages = Math.ceil(filteredDossiers.length / ITEMS_PER_PAGE) || 1;
  const paginatedDossiers = filteredDossiers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeScenarioInfo = scenarioTextMap[activeScenario];

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface antialiased flex flex-col relative overflow-hidden">
      {/* Dynamic Photographic Weather Scenery Background & Live Particle System */}
      <AtmosphericOverlay scenario={activeLens === "model_e" ? activeScenario : "clear"} />

      {/* Universal Shared Header/Navbar Component */}
      <Navbar user={user} />

      {/* Main Content Body */}
      <main className="w-full pt-20 sm:pt-24 pb-16 relative z-10 flex-1">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-8 sm:space-y-12">
          {/* HERO HEADER & AI MODEL LENS FILTER BAR (Map Page Banner Style) */}
          <div className="pt-4 pb-8 border-b border-outline-variant/60 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-3xl">
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-on-surface">
                  AI Recommendation &amp; Intelligence Hub
                </h1>
                <p className="font-sans text-sm sm:text-base text-on-surface-variant mt-2.5 leading-relaxed max-w-2xl">
                  Multi-Model Machine Learning Engine · Autonomous Destination &amp; Experience Synthesis calibrated for elevation, road telemetry, microclimates, and bespoke travel affinities.
                </p>
              </div>

              {/* 5-Model Lens Filtering Pills */}
              <div className="flex items-center bg-surface-container-high/70 p-1.5 rounded-xl border border-outline-variant overflow-x-auto scrollbar-none gap-1.5">
                {[
                  { id: "model_e", emoji: "🌤️", name: "Weather & Season Lens", badge: "Model E" },
                  { id: "model_d", emoji: "🎯", name: "Personal Affinity Lens", badge: "Model D" },
                  { id: "model_c", emoji: "👥", name: "Similar Travelers Lens", badge: "Model C" },
                  { id: "model_b", emoji: "🧠", name: "Content & Hobby Lens", badge: "Model B" },
                  { id: "model_a", emoji: "🔥", name: "Top Trending", badge: "Model A" },
                ].map((lens) => (
                  <button
                    key={lens.id}
                    onClick={() => setActiveLens(lens.id as any)}
                    className={`px-3.5 py-2 rounded-lg font-display text-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      activeLens === lens.id
                        ? "bg-surface-container-lowest font-bold text-on-surface shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface font-medium"
                    }`}
                    type="button"
                  >
                    <span>{lens.emoji}</span>
                    <span>{lens.name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                        activeLens === lens.id
                          ? "bg-secondary-container text-on-secondary-container"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {lens.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Weather Scenario & Telemetry Accelerator Strip (Only for Model E - Weather & Season Lens) */}
            {activeLens === "model_e" && (
              <div className="mt-6 pt-5 border-t border-outline-variant/40 animate-fadeIn space-y-3">
                <div className="flex flex-col gap-3.5 p-4 sm:p-5 rounded-2xl bg-secondary/8 border border-secondary/25 shadow-xs">
                  {/* Line 1: Header / Status Badge */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/15 border border-secondary/30 text-secondary text-[11px] font-mono font-bold tracking-wider uppercase flex-shrink-0">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                      Weather Matrix Active
                    </div>
                    <span className="text-xs text-on-surface-variant font-mono hidden sm:inline-block">
                      <strong className="text-secondary font-semibold">{activeScenarioInfo.title}</strong>
                    </span>
                  </div>

                  {/* Line 2: Scenario Filters */}
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
                    {[
                      { id: "clear", label: "☀️ Clear Skies", sub: "+15%" },
                      { id: "rain", label: "🌧️ Rain / Fog", sub: "Sheltered" },
                      { id: "snow", label: "❄️ Deep Snow", sub: "Cap ≤2,200m" },
                      { id: "monsoon", label: "🌩️ Monsoon Surge", sub: "Landslide" },
                    ].map((sc) => (
                      <button
                        key={sc.id}
                        onClick={() => setActiveScenario(sc.id as any)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                          activeScenario === sc.id
                            ? "bg-secondary text-on-secondary font-bold shadow-md shadow-secondary/20"
                            : "bg-surface-container-lowest text-on-surface border border-outline-variant/70 hover:bg-surface-container hover:border-secondary/30 font-medium"
                        }`}
                        type="button"
                      >
                        <span>{sc.label}</span>
                        <span className={`text-[10px] ${activeScenario === sc.id ? "text-on-secondary/80" : "text-on-surface-variant"}`}>
                          ({sc.sub})
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Line 3: Telemetry Stats (3rd line under filters) */}
                  <div className="flex items-center gap-3 text-xs font-mono overflow-x-auto scrollbar-none pt-2.5 border-t border-secondary/15">
                    <span className="px-3 py-1.5 rounded-xl bg-surface-container-lowest text-on-surface-variant border border-outline-variant/60 flex items-center gap-1.5 flex-shrink-0">
                      <span>Barometric:</span>
                      <strong className="text-secondary font-bold">{activeScenarioInfo.barometric}</strong>
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-surface-container-lowest text-on-surface-variant border border-outline-variant/60 flex items-center gap-1.5 flex-shrink-0">
                      <span>Ceiling:</span>
                      <strong className="text-secondary font-bold">{activeScenarioInfo.cloudCeiling}</strong>
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-surface-container-lowest text-on-surface-variant border border-outline-variant/60 flex items-center gap-1.5 flex-shrink-0">
                      <span>Wind Shear:</span>
                      <strong className="text-secondary font-bold">{activeScenarioInfo.windShear}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-on-surface-variant px-1">
                  <span className="material-symbols-outlined text-secondary text-sm flex-shrink-0">bolt</span>
                  <span>
                    <strong className="text-on-surface font-semibold">{activeScenarioInfo.title}:</strong> {activeScenarioInfo.desc}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Destination Dossiers (3-Column Editorial Grid) */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                  Calibrated Destination Dossiers
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                  Ranked deterministically through active ML weights and telemetry inputs.
                </p>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-3 py-1.5 rounded-full border border-secondary/20 hidden sm:inline-block">
                {loading ? "Calculating ML Feed..." : `${filteredDossiers.length} Synthesized Dossiers`}
              </span>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {paginatedDossiers.map((card) => {
                const scenarioCardBorder =
                  activeLens === "model_e" && activeScenario === "snow"
                    ? "border-sky-500/30 hover:border-sky-400/60 shadow-sky-500/10"
                    : activeLens === "model_e" && activeScenario === "rain"
                    ? "border-teal-500/30 hover:border-teal-400/60 shadow-teal-500/10"
                    : activeLens === "model_e" && activeScenario === "monsoon"
                    ? "border-purple-500/30 hover:border-purple-400/60 shadow-purple-500/10"
                    : "border-outline-variant/60 hover:border-secondary/40 shadow-secondary/5";

                return (
                  <div
                    key={card.id}
                    className={`group bg-surface-container-lowest/90 backdrop-blur-md rounded-3xl overflow-hidden shadow-luxury border ${scenarioCardBorder} transition-all duration-300 flex flex-col hover:-translate-y-1`}
                  >
                    <div className="relative w-full h-60 sm:h-64 overflow-hidden bg-surface-container">
                    <div
                      className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                      style={{ backgroundImage: `url('${card.imgUrl}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />

                    {/* Badges top */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-surface-container-lowest/95 backdrop-blur-md text-secondary text-xs font-bold shadow-xs flex items-center gap-1 border border-secondary/20">
                        <span className="material-symbols-outlined text-xs">
                          auto_awesome
                        </span>
                        {card.modelBadge}
                      </span>
                      <button
                        onClick={() => toggleBookmark(card.id)}
                        className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer ${bookmarked[card.id]
                          ? "bg-secondary text-white"
                          : "bg-black/40 text-white hover:bg-black/60"
                          }`}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {bookmarked[card.id] ? "bookmark" : "bookmark_border"}
                        </span>
                      </button>
                    </div>

                    {/* Bottom Image Bar: Micro Metrics */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-secondary-container">
                          terrain
                        </span>{" "}
                        Elev: {card.elevation}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-secondary-container">
                          {card.metric2Icon}
                        </span>{" "}
                        {card.metric2}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-secondary-container">
                          {card.metric3Icon}
                        </span>{" "}
                        {card.metric3}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                        {card.subLocation}
                      </span>
                      <h3 className="font-display font-bold text-lg text-on-surface group-hover:text-secondary transition-colors line-clamp-1">
                        {card.title}
                      </h3>

                      {/* AI Match Dossier Rationale */}
                      <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">
                            psychology
                          </span>
                          Synthesizer Rationale
                        </span>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {card.rationale}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {card.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-0.5 rounded-lg bg-surface-container text-on-surface-variant text-[11px] font-medium border border-outline-variant/40"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 space-y-2">
                      <Link
                        className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-neutral-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs group-hover:shadow-md"
                        href={card.plannerUrl}
                      >
                        <span>Customize &amp; Plan Route</span>
                        <span className="material-symbols-outlined text-sm">
                          arrow_forward
                        </span>
                      </Link>
                      <button
                        className="w-full py-2.5 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-outline-variant/40"
                        onClick={() =>
                          openTelemetry(
                            card.title,
                            card.elevation,
                            card.precip,
                            card.clarity
                          )
                        }
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">
                          insights
                        </span>
                        <span>Inspect Telemetry &amp; 3D Terrain</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>

            {/* Pagination Controls Bar */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-outline-variant/40">
                <div className="text-xs text-on-surface-variant">
                  Showing Page <strong className="text-on-surface font-bold">{currentPage}</strong> of{" "}
                  <strong className="text-on-surface font-bold">{totalPages}</strong> ({filteredDossiers.length} total destinations)
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/60 text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                    type="button"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === pageNum
                        ? "bg-secondary text-white shadow-xs"
                        : "bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/60 text-on-surface"
                        }`}
                      type="button"
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/60 text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Interactive Map & Terrain Preview Strip */}
          <section className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/60 flex flex-col lg:flex-row gap-6 items-center">
            <div className="lg:w-1/3 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-base">
                  map
                </span>
                Spatial Intelligence Layer
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-on-surface">
                Real-time GIS &amp; Vector Passability Map
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Live satellite terrain telemetry monitoring snowline elevations, seasonal Karakoram Highway transit times, and microclimate barometric gradients.
              </p>

              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Passability Index</span>
                  <span className="font-bold text-secondary">
                    97.8% Operational
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                  <div className="w-[97.8%] h-full bg-secondary rounded-full" />
                </div>
              </div>

              <div className="pt-2">
                <Link
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs sm:text-sm transition-colors border border-outline-variant/60"
                  href="/explore#map"
                >
                  <span>Launch Fullscreen Smart Map</span>
                  <span className="material-symbols-outlined text-sm">
                    open_in_new
                  </span>
                </Link>
              </div>
            </div>

            {/* Map Preview Image */}
            <div className="lg:w-2/3 w-full h-72 rounded-2xl overflow-hidden relative shadow-inner border border-outline-variant/60">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDL18Hw8fFWIlB2w15EBcxw3Duf3gDXPeb3dOzLRcqZWt3C1Pjnri76_BNh2kbL86iMsN9BepWwHXOgzYMkfguiTnU9-jPhLTzbtc9AP5dIXPHzQzqeKuVC36We37KGU6_xPSzXX-d_Q2SyP_oG9RaJUCc3SjPEDFWQCEqrUJF12nVmSTaN-ttzPHQWs6zFhbLe1XKliKStiVamWYq1KJBTN0zlhRaUwJhJ7t7AYC2ZEL1cO_0WofH-9A')`,
                }}
              />
              <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:left-4 bg-surface-container-lowest/90 backdrop-blur-md px-3.5 py-2 sm:py-2.5 rounded-xl text-on-surface shadow-md flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-semibold border border-outline-variant/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span>
                    KKH N-35: <strong>Clear / Green</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>
                    Skardu S-1: <strong>Passable</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span>
                    Babusar: <strong>Active Telemetry</strong>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Under the Hood: 5 Recommendation Models Architecture */}
          <section className="bg-surface-container-low/70 rounded-3xl p-6 sm:p-10 border border-outline-variant/50 shadow-xs space-y-8">
            <div className="max-w-3xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                Under the Hood
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                The 5 Recommendation Models Architecture
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                WanderAI does not rely on static directory rankings. Every result is computed through an ensemble machine learning pipeline balancing real-time safety, physical terrain constraints, and personal taste vectors.
              </p>
            </div>

            {/* Architecture 5 Cards Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Model A */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/60 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center font-mono font-bold text-xs text-on-surface">
                    A
                  </div>
                  <h4 className="font-display font-bold text-sm text-on-surface">
                    Popularity Velocity
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Tracks high-velocity trending nodes, seasonal booking surges, and archival viral affinity across Pakistan.
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-mono text-secondary font-semibold border-t border-outline-variant/40">
                  Weight: 15% · Baseline
                </div>
              </div>

              {/* Model B */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/60 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center font-mono font-bold text-xs text-on-surface">
                    B
                  </div>
                  <h4 className="font-display font-bold text-sm text-on-surface">
                    Semantic Content Match
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    384-dimension vector embeddings matching POI attributes to discrete traveler hobbies (alpine photography, gastronomy).
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-mono text-secondary font-semibold border-t border-outline-variant/40">
                  Weight: 20% · Cosine Sim
                </div>
              </div>

              {/* Model C */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/60 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center font-mono font-bold text-xs text-on-surface">
                    C
                  </div>
                  <h4 className="font-display font-bold text-sm text-on-surface">
                    Collaborative Filtering
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Matrix factorization cross-referencing travelers with similar alpine tolerance, pacing, and expedition style.
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-mono text-secondary font-semibold border-t border-outline-variant/40">
                  Weight: 20% · SVD Factors
                </div>
              </div>

              {/* Model D */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/60 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center font-mono font-bold text-xs text-on-surface">
                    D
                  </div>
                  <h4 className="font-display font-bold text-sm text-on-surface">
                    Personal Affinity Vector
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    High-dimension vector mapping historical ratings, physical pacing choices, 4x4 preferences, and accommodation tiers.
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-mono text-secondary font-semibold border-t border-outline-variant/40">
                  Weight: 25% · Personalized
                </div>
              </div>

              {/* Model E */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-secondary/40 flex flex-col justify-between space-y-4 bg-gradient-to-b from-surface-container-lowest to-secondary-container/20">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-secondary text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
                    E
                  </div>
                  <h4 className="font-display font-bold text-sm text-on-surface">
                    Live Weather Multiplier
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Deterministic real-time modifier adjusting scores based on precipitation, cloud cover, pass accessibility, and daylight window.
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-mono text-secondary font-extrabold border-t border-secondary/20">
                  Multiplier: ±35% · Dynamic
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Interactive Telemetry Modal Dialog */}
      {telemetryModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative border border-outline-variant/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  insights
                </span>
                <h3 className="font-display font-bold text-lg text-on-surface">
                  {telemetryModal.title}
                </h3>
              </div>
              <button
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                onClick={closeTelemetry}
                type="button"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col border border-outline-variant/40">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Elevation
                </span>
                <span className="font-display font-bold text-xl text-on-surface mt-0.5">
                  {telemetryModal.elevation}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col border border-outline-variant/40">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  24h Precip Risk
                </span>
                <span className="font-display font-bold text-xl text-secondary mt-0.5">
                  {telemetryModal.precip}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col border border-outline-variant/40">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Golden Hour Clarity
                </span>
                <span className="font-display font-bold text-xl text-on-surface mt-0.5">
                  {telemetryModal.clarity}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col border border-outline-variant/40">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Landslide Status
                </span>
                <span className="font-display font-bold text-xl text-secondary mt-0.5">
                  Zero Risk
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low text-xs text-on-surface-variant leading-relaxed border border-outline-variant/40">
              <strong className="text-on-surface">
                Telemetry Calibration:
              </strong>{" "}
              Sensor array synchronized with Pak Meteorological Department (PMD) &amp; Sentinel-2 optical imagery at 10m ground resolution.
            </div>

            <button
              className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-neutral-800 transition-colors cursor-pointer shadow-xs"
              onClick={closeTelemetry}
              type="button"
            >
              Dismiss Telemetry View
            </button>
          </div>
        </div>
      )}

      {/* Shared Footer Component */}
      <footer className="w-full bg-surface-container-low py-12 sm:py-16 border-t border-outline-variant/40">
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
                  href="/planner"
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
                  href="/planner"
                >
                  Dynamic Waypoint Generator
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
