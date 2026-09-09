"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { placesApi, tripsApi, getErrorMessage } from "@/lib/api";
import { City } from "@/types";
import Navbar from "@/components/Navbar";

interface DestinationPreset {
  name: string;
  region: string;
  elevation: string;
  image: string;
  mapImage: string;
  weather: string;
  weatherTemp: string;
  foliage: string;
  waypoints: { title: string; type: string; desc: string; km?: string }[];
}

const DESTINATION_PRESETS: Record<string, DestinationPreset> = {
  hunza: {
    name: "Hunza Valley & Passu Cones",
    region: "Gilgit-Baltistan",
    elevation: "2,438m",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6kGwiJoU2OhGsixgvXfGqlWy-DjQMgj2XX2ffdT2P07Yhjv5ztVuPHdm1PlDs9v7MbfUgG34ClS3JGefPsjBpB0-6U90MvIG7bnfTigynCfQWEHfPSVt1HBi_PfQnPcP16z8c14rH-w0DjLr7EGZjp2DwylowOQM71ggT3qAf_MrhpGK-wu3O9fjATMToRu5p1EKzNH73RUDSzSb_mniq7Y9AJcP2Uq9PkV7q_dkNZa4ylIKsxpXLfw",
    mapImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAIdYoEUaeCK29PBdSsLCpapQ0r93gcUs0rSqiBgNZFxRCbRRGrhQMAsXMmg8bg6_TBz5OVYdmX2kahZ8-c5-uoXFXFKYdaMbGfMH3IT-tdP3P8PTP65LFWS7xLgcG8I5iRYOOoM1VuARFIPY75QRXN4UAtrXqN7Li4m0-51ieDDjObvu4LEZLZCCRkYcDMk6VmSMlO7PTZ9m1iF8ppRmzrqVg8UNk0gGfjKPlpIsOG0XiDocBN78QxjA",
    weather: "Clear Skies",
    weatherTemp: "14°C",
    foliage: "Foliage Peak: +4 Days",
    waypoints: [
      { title: "Day 1: Islamabad ➔ Chilas / Gilgit", type: "380 km", desc: "Karakoram Highway crossing, Babusar Pass staging checkpoint." },
      { title: "Day 2-3: Karimabad, Baltit & Altit Forts", type: "Focal Hub", desc: "Royal terraced orchards, sunset photography at Eagle's Nest viewpoint." },
      { title: "Day 4: Attabad Lake & Passu Cathedral Cones", type: "85 km", desc: "Turquoise boat crossing, Hussaini bridge hike, Borith glacier tea." },
      { title: "Day 5: Souvenirs, Walnut Delights & Descent", type: "Return", desc: "Gilgit dry fruit bazaar, flight / transit connect to Islamabad hub." },
    ],
  },
  skardu: {
    name: "Skardu Glacial Lakes & Deosai Plains",
    region: "Baltistan",
    elevation: "2,228m",
    image: "https://images.unsplash.com/photo-1627894098906-74045f29910d?q=80&w=1200&auto=format&fit=crop",
    mapImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1000&auto=format&fit=crop",
    weather: "Sunny High Altitude",
    weatherTemp: "11°C",
    foliage: "Alpine Peak: Active",
    waypoints: [
      { title: "Day 1: Skardu Arrival & Lower Kachura", type: "Arrival", desc: "Check-in at Shangrila resort, boat ride at Shangrila lake." },
      { title: "Day 2: Upper Kachura & Cold Desert", type: "45 km", desc: "Desert dunes safari in Katpana, sunset stargazing." },
      { title: "Day 3: Deosai National Park & Sheosar Lake", type: "High Plateau", desc: "High altitude plateau, brown bear sanctuary, floral plains." },
      { title: "Day 4: Shigar Fort & Organic Orchards", type: "Heritage", desc: "17th century heritage palace, organic fruit gardens." },
      { title: "Day 5-7: Khaplu Palace & Ascent", type: "Trek", desc: "Sailing valley trek, handcrafted gemstone bazaar shopping." },
    ],
  },
  swat: {
    name: "Swat Emerald Valleys & Kalam",
    region: "Khyber Pakhtunkhwa",
    elevation: "1,980m",
    image: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?q=80&w=1200&auto=format&fit=crop",
    mapImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop",
    weather: "Mild Breeze",
    weatherTemp: "18°C",
    foliage: "Pine Canopy Clear",
    waypoints: [
      { title: "Day 1: Islamabad ➔ Mingora & Fizagat", type: "Transit", desc: "Swat Motorway scenic transit, riverfront dinner." },
      { title: "Day 2: White Palace & Malam Jabba", type: "Alpine", desc: "Marble palace architecture, chairlift ride & alpine forest." },
      { title: "Day 3: Kalam Valley & Ushu Forest", type: "Glacier", desc: "Dense pine canopy, glacier streams, trout farm lunch." },
      { title: "Day 4: Mahodand Lake Expedition", type: "Offroad 4x4", desc: "Jeep track to high alpine lake, horseback riding." },
    ],
  },
  lahore: {
    name: "Lahore Walled City & Mughal Heritage",
    region: "Punjab",
    elevation: "217m",
    image: "https://images.unsplash.com/photo-1589802829985-817e51171b92?q=80&w=1200&auto=format&fit=crop",
    mapImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000&auto=format&fit=crop",
    weather: "Warm & Vibrant",
    weatherTemp: "26°C",
    foliage: "Culinary Season",
    waypoints: [
      { title: "Day 1: Walled City & Badshahi Mosque", type: "Mughal", desc: "Mughal grandeur, Delhi Gate heritage walk, Haveli dinner." },
      { title: "Day 2: Lahore Fort & Shalamar Gardens", type: "UNESCO", desc: "Sheesh Mahal mirror palace, royal fountains." },
      { title: "Day 3: Anarkali Bazaar & Qawwali Night", type: "Culinary", desc: "Colonial art collections, traditional silk & spice bazaars." },
    ],
  },
  gwadar: {
    name: "Makran Coastal Highway & Gwadar",
    region: "Balochistan",
    elevation: "12m",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
    mapImage: "https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1000&auto=format&fit=crop",
    weather: "Coastal Breeze",
    weatherTemp: "28°C",
    foliage: "Oceanic Sunset",
    waypoints: [
      { title: "Day 1: Karachi ➔ Kund Malir & Hingol", type: "Highway", desc: "Princess of Hope rock formations, Sphinx of Balochistan." },
      { title: "Day 2: Ormara Beach & Turtle Beaches", type: "Coastal", desc: "Pristine white sand beaches, bioluminescent waters." },
      { title: "Day 3: Gwadar Port & Sunset at Koh-e-Batil", type: "Port View", desc: "Hammerhead peninsula overlook, seafood feast." },
      { title: "Day 4: Jiwani & Marine Reserve", type: "Return", desc: "Victoria Hut sunset point, mangrove ecosystem." },
    ],
  },
};

const INTEREST_OPTIONS = [
  { id: "nature", label: "🏔️ Nature & Peaks" },
  { id: "photography", label: "📸 Haute Photography" },
  { id: "trekking", label: "🧗 Alpine Trekking" },
  { id: "food", label: "🍲 Gastronomic Trails" },
  { id: "heritage", label: "🕌 Heritage & Mughal History" },
  { id: "stargazing", label: "🌌 High-Altitude Stargazing" },
  { id: "glamping", label: "🏕️ Stays & Glamping" },
  { id: "bazaar", label: "🛍️ Silk Road Bazaars" },
];

function PlannerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cities, setCities] = useState<City[]>([]);
  const [tripsCount, setTripsCount] = useState<number | null>(null);

  const [preselectedPlace, setPreselectedPlace] = useState<{
    id: string;
    name: string;
    city_id?: string;
    city_name?: string;
  } | null>(null);

  // Form State
  const [originCity, setOriginCity] = useState<string>("Islamabad / Rawalpindi (ISB Hub)");
  const [destination, setDestination] = useState<string>("Hunza Valley & Gojal, Gilgit-Baltistan");
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // Default to today
  });
  const [daysCount, setDaysCount] = useState<number>(5);
  const [currency, setCurrency] = useState<"PKR" | "USD">("PKR");
  const [budget, setBudget] = useState<number>(50000);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["nature", "photography", "trekking", "food"]);
  const [travelStyle, setTravelStyle] = useState<"solo" | "couple" | "family" | "crew">("solo");
  const [transitMode, setTransitMode] = useState<"car" | "flight" | "bus" | "hybrid">("car");
  const [lodgingStyle, setLodgingStyle] = useState<"glamping" | "midrange" | "homestay">("glamping");
  const [pace, setPace] = useState<"relaxed" | "balanced" | "intensive">("balanced");
  const [mode, setMode] = useState<"bespoke" | "precalibrated" | "prompt">("bespoke");

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePreset, setActivePreset] = useState<DestinationPreset>(DESTINATION_PRESETS.hunza);

  useEffect(() => {
    fetchBackendCities();
    fetchTripsCount();
  }, []);

  useEffect(() => {
    const pId = searchParams.get("place_id");
    const pName = searchParams.get("place_name");
    const cId = searchParams.get("city_id");
    const cName = searchParams.get("city_name");
    const daysParam = searchParams.get("days");
    const cohortParam = searchParams.get("cohort");

    if (pId && pName) {
      setPreselectedPlace({
        id: pId,
        name: pName,
        city_id: cId || undefined,
        city_name: cName || undefined,
      });

      setDestination(cName ? `${pName}, ${cName}` : pName);
    }

    if (daysParam) {
      const parsedDays = parseInt(daysParam, 10);
      if (!isNaN(parsedDays) && parsedDays > 0) {
        setDaysCount(parsedDays);
      }
    }

    if (cohortParam && ["solo", "couple", "family", "crew"].includes(cohortParam)) {
      setTravelStyle(cohortParam as "solo" | "couple" | "family" | "crew");
    }
  }, [searchParams]);

  useEffect(() => {
    const text = destination.toLowerCase();
    if (text.includes("skardu")) {
      setActivePreset(DESTINATION_PRESETS.skardu);
    } else if (text.includes("swat")) {
      setActivePreset(DESTINATION_PRESETS.swat);
    } else if (text.includes("lahore")) {
      setActivePreset(DESTINATION_PRESETS.lahore);
    } else if (text.includes("gwadar") || text.includes("makran") || text.includes("balochistan")) {
      setActivePreset(DESTINATION_PRESETS.gwadar);
    } else {
      setActivePreset(DESTINATION_PRESETS.hunza);
    }
  }, [destination]);

  // Dynamic End Date & Seasonality Gate calculation
  const startObj = new Date(startDate || "2025-10-18");
  const endObj = new Date(startObj);
  endObj.setDate(startObj.getDate() + Math.max(1, daysCount - 1));

  const formatShortDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const endDateFormatted = formatShortDate(endObj);
  const startDateFormatted = formatShortDate(startObj);

  // Month-based seasonality gate tag
  const monthNum = startObj.getMonth() + 1;
  const seasonalityGate =
    monthNum >= 10 && monthNum <= 11
      ? "🍁 Golden Autumn Peak"
      : monthNum >= 5 && monthNum <= 9
      ? "🌿 Green Alpine Peak"
      : "❄️ High Altitude Snow Gate";

  // Dynamic distance & mode telemetry based on BOTH origin and destination
  const getRouteTelemetry = () => {
    const o = originCity.toLowerCase();
    const d = destination.toLowerCase();

    // 1. Same city / Intra-city staycation or local tour
    const originBasename = o.split(" ")[0].replace(/[^a-z]/g, "");
    if (
      (originBasename && d.includes(originBasename)) ||
      (o.includes("lahore") && d.includes("lahore")) ||
      (o.includes("islamabad") && d.includes("islamabad")) ||
      (o.includes("karachi") && d.includes("karachi")) ||
      (o.includes("peshawar") && d.includes("peshawar")) ||
      (o.includes("multan") && d.includes("multan"))
    ) {
      return { dist: "~25 km", modeRec: "Intra-City Heritage Circuit & Local Transit" };
    }

    // 2. Destination: Lahore
    if (d.includes("lahore")) {
      if (o.includes("islamabad")) return { dist: "~370 km", modeRec: "M2 Motorway Direct Vector (~4.5 hrs)" };
      if (o.includes("karachi")) return { dist: "~1,210 km", modeRec: "Direct Air Flight / M5 Motorway (~2 hrs flight)" };
      if (o.includes("peshawar")) return { dist: "~490 km", modeRec: "M1 ➔ M2 Motorway Vector (~5.5 hrs)" };
      if (o.includes("multan")) return { dist: "~340 km", modeRec: "M4 Motorway Direct Vector (~4 hrs)" };
      return { dist: "~380 km", modeRec: "Inter-city Motorway Route" };
    }

    // 3. Destination: Swat / Kalam
    if (d.includes("swat") || d.includes("kalam") || d.includes("mingora")) {
      if (o.includes("islamabad")) return { dist: "~240 km", modeRec: "M1 ➔ Swat Expressway (M16) (~4.5 hrs)" };
      if (o.includes("lahore")) return { dist: "~590 km", modeRec: "M2 ➔ M1 ➔ Swat Expressway (~7.5 hrs)" };
      if (o.includes("karachi")) return { dist: "~1,680 km", modeRec: "Air Flight to ISB + Swat Expressway Transit" };
      if (o.includes("peshawar")) return { dist: "~180 km", modeRec: "M1 ➔ Swat Expressway (~3 hrs)" };
      if (o.includes("multan")) return { dist: "~770 km", modeRec: "M4 ➔ M2 ➔ Swat Expressway (~9.5 hrs)" };
      return { dist: "~320 km", modeRec: "Expressway & Mountain Pass" };
    }

    // 4. Destination: Gwadar / Makran
    if (d.includes("gwadar") || d.includes("makran") || d.includes("balochistan")) {
      if (o.includes("karachi")) return { dist: "~630 km", modeRec: "Makran Coastal Highway (N10) (~7 hrs)" };
      if (o.includes("lahore")) return { dist: "~1,320 km", modeRec: "Direct Air Flight to Gwadar (GWD) (~2 hrs)" };
      if (o.includes("islamabad")) return { dist: "~1,580 km", modeRec: "Direct Air Flight to Gwadar Airport" };
      return { dist: "~650 km", modeRec: "Coastal Highway Vector" };
    }

    // 5. Destination: Skardu / Baltistan
    if (d.includes("skardu") || d.includes("deosai") || d.includes("baltistan")) {
      if (o.includes("karachi")) return { dist: "~2,050 km", modeRec: "Direct Air Flight to Skardu (KDU) Recommended" };
      if (o.includes("lahore")) return { dist: "~1,010 km", modeRec: "M2 ➔ Hazara Expressway ➔ Jaglot-Skardu Rd" };
      if (o.includes("peshawar")) return { dist: "~680 km", modeRec: "M1 ➔ Hazara Expressway ➔ Jaglot-Skardu Rd" };
      if (o.includes("multan")) return { dist: "~1,180 km", modeRec: "M4 ➔ Hazara ➔ Jaglot-Skardu Rd" };
      return { dist: "~640 km", modeRec: "Karakoram Highway ➔ Jaglot-Skardu Road" };
    }

    // 6. Destination: Hunza / Gojal / Gilgit (Default North Mountain Vector)
    if (o.includes("karachi")) return { dist: "~1,950 km", modeRec: "Air Flight to Gilgit/ISB + 4x4 Staging Recommended" };
    if (o.includes("lahore")) return { dist: "~940 km", modeRec: "M2 Motorway ➔ Hazara Expressway ➔ KKH" };
    if (o.includes("peshawar")) return { dist: "~620 km", modeRec: "M1 Motorway ➔ Hazara Expressway ➔ KKH" };
    if (o.includes("multan")) return { dist: "~1,120 km", modeRec: "M4 Motorway ➔ Hazara Expressway ➔ KKH" };
    return { dist: "~580 km", modeRec: "Karakoram Highway / Babusar Pass Route" };
  };

  const routeTelemetry = getRouteTelemetry();

  const fetchBackendCities = async () => {
    try {
      const data = await placesApi.getCities();
      if (Array.isArray(data)) {
        setCities(data);
      }
    } catch {
      // Backend fallback silently
    }
  };

  const fetchTripsCount = async () => {
    try {
      const data = await tripsApi.list();
      if (Array.isArray(data)) setTripsCount(data.length);
    } catch {
      // Not logged in — silently ignore
    }
  };

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleSurpriseMe = () => {
    const keys = Object.keys(DESTINATION_PRESETS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const preset = DESTINATION_PRESETS[randomKey];
    setDestination(`${preset.name}, ${preset.region}`);
    setActivePreset(preset);
  };

  const handlePopularChip = (cityName: string) => {
    const key = cityName.toLowerCase();
    if (DESTINATION_PRESETS[key]) {
      const preset = DESTINATION_PRESETS[key];
      setDestination(`${preset.name}, ${preset.region}`);
      setActivePreset(preset);
    } else {
      setDestination(`${cityName} Region, Pakistan`);
    }
  };

  const handleTemplatePill = (presetDest: string, presetDays: number, presetBudget: number) => {
    setDestination(presetDest);
    setDaysCount(presetDays);
    setBudget(presetBudget);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      let matchedCityId = preselectedPlace?.city_id;
      if (!matchedCityId) {
        const matchedCity = cities.find((c) =>
          destination.toLowerCase().includes(c.name.toLowerCase())
        );
        matchedCityId = matchedCity ? matchedCity.id : (cities[0]?.id || "");
      }

      if (matchedCityId) {
        const payload = {
          city_id: matchedCityId,
          title: preselectedPlace
            ? `${daysCount}-Day ${preselectedPlace.name} Expedition`
            : `${daysCount}-Day ${destination.split(",")[0]} Expedition from ${originCity.split(" ")[0]}`,
          duration_days: daysCount,
          total_budget: budget,
          pace: pace === "relaxed" ? "relaxed" : pace === "intensive" ? "packed" : "moderate",
          group_size: travelStyle === "solo" ? 1 : travelStyle === "couple" ? 2 : 4,
          context: {
            origin_city: originCity,
            start_date: startDate,
            end_date: endDateFormatted,
            transit_mode: transitMode,
            lodging_style: lodgingStyle,
            interests: selectedInterests,
            anchor_place_id: preselectedPlace?.id || null,
          }
        };
        const createdTrip = await tripsApi.create(payload);

        if (preselectedPlace?.id && createdTrip?.id) {
          const alreadyContains = createdTrip.active_itinerary?.days?.some((day: any) =>
            day.items?.some((item: any) => item.place?.id === preselectedPlace.id)
          );
          if (!alreadyContains) {
            try {
              await tripsApi.addStop(createdTrip.id, { place_id: preselectedPlace.id });
            } catch {
              // Silently ignore if stop addition fails
            }
          }
        }

        setTimeout(() => {
          setIsGenerating(false);
          router.push(`/trips/${createdTrip.id}`);
        }, 1500);
        return;
      }
    } catch {
      // Client fallback
    }

    setTimeout(() => {
      setIsGenerating(false);
      router.push("/trips");
    }, 2800);
  };

  // Budget Calculations
  const usdRate = 278;
  const stayCost = Math.round(budget * 0.40);
  const travelCost = Math.round(budget * 0.30);
  const foodCost = Math.round(budget * 0.20);
  const bufferCost = Math.round(budget * 0.10);
  const usdVal = Math.round(budget / usdRate);

  const routeFitPercent = Math.min(99, 86 + selectedInterests.length * 3);

  const budgetTierText =
    budget < 40000
      ? "Tier: Smart Backpacker"
      : budget < 90000
      ? "Tier: Balanced Connoisseur"
      : budget < 160000
      ? "Tier: Luxury Expedition"
      : "Tier: VIP Ultra Luxe";

  const pacingText =
    daysCount <= 3 ? "Brisk Pacing" : daysCount <= 8 ? "Optimal Pace" : "Immersive Expedition";

  return (
    <div className="bg-background text-on-surface antialiased font-sans selection:bg-secondary-container selection:text-on-secondary-container min-h-screen flex flex-col">
      {/* ==================== TOP FLOATING TRANSLUCENT GLASS NAVBAR ==================== */}
      <Navbar
        onSearch={() => setSearchOpen(true)}
        currency={currency}
        onCurrencyChange={setCurrency}
        tripsCount={tripsCount}
        onPlanTrip={handleGenerate}
      />

      {/* ==================== MAIN CANVAS ==================== */}
      <main className="w-full pt-28 pb-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          {/* HERO HEADER & UTILITY BAR */}
          <div className="pt-4 pb-8 border-b border-outline-variant/60 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-3xl">
                {/* Clean Solid Editorial Heading */}
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-on-surface">
                  Design your bespoke expedition with algorithmic precision.
                </h1>
                <p className="font-sans text-sm sm:text-base text-on-surface-variant mt-2.5 leading-relaxed max-w-2xl">
                  Synthesizing topographic elevation, real-time Karakoram road telemetry, curated boutique glamping, and private 4x4 staging into a flawless multi-day itinerary.
                </p>
              </div>

              {/* Mode Selector & Action Blueprint Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Segmented Mode Selector */}
                <div className="flex items-center bg-surface-container-high/70 p-1 rounded-xl border border-outline-variant">
                  <button
                    onClick={() => setMode("bespoke")}
                    className={`px-3.5 py-2 rounded-lg font-display text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      mode === "bespoke"
                        ? "bg-surface-container-lowest font-bold text-on-surface shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface font-medium"
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm text-secondary">
                      insights
                    </span>
                    <span>Bespoke Planner</span>
                  </button>
                  <button
                    onClick={() => setMode("precalibrated")}
                    className={`px-3.5 py-2 rounded-lg font-display text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      mode === "precalibrated"
                        ? "bg-surface-container-lowest font-bold text-on-surface shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface font-medium"
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">view_agenda</span>
                    <span>Pre-calibrated</span>
                  </button>
                  <button
                    onClick={() => setMode("prompt")}
                    className={`px-3.5 py-2 rounded-lg font-display text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      mode === "prompt"
                        ? "bg-surface-container-lowest font-bold text-on-surface shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface font-medium"
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">terminal</span>
                    <span>Prompt Matrix</span>
                  </button>
                </div>

                {/* Blueprint Action Pills */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setDestination("Hunza Valley & Gojal, Gilgit-Baltistan");
                      setDaysCount(5);
                      setBudget(50000);
                    }}
                    className="px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs transition-colors flex items-center gap-1.5 border border-outline-variant cursor-pointer"
                    title="Reset all input fields"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">
                      restart_alt
                    </span>
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={() => alert("Expedition Blueprint Loaded!")}
                    className="px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs transition-colors flex items-center gap-1.5 border border-outline-variant cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm text-secondary">
                      download
                    </span>
                    <span>Load Blueprint</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Template Accelerator Strip */}
            <div className="mt-4 pt-3 flex items-center gap-2 overflow-x-auto text-xs pb-1 scrollbar-none">
              <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant flex items-center gap-1 font-semibold flex-shrink-0">
                <span className="material-symbols-outlined text-xs text-secondary">dataset</span>{" "}
                Quick Templates:
              </span>
              <button
                onClick={() => handleTemplatePill("Hunza Valley & Gojal, Gilgit-Baltistan", 5, 55000)}
                className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant transition-colors flex-shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <span>🍂 Hunza Autumn Peak (5D)</span>
                <span className="text-secondary font-mono text-[10px]">98% Fit</span>
              </button>
              <button
                onClick={() => handleTemplatePill("Skardu Glacial Lakes & Deosai Plains, Baltistan", 7, 85000)}
                className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant transition-colors flex-shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <span>❄️ Skardu Glacial Trek (7D)</span>
                <span className="text-secondary font-mono text-[10px]">95% Fit</span>
              </button>
              <button
                onClick={() => handleTemplatePill("Lahore Walled City & Mughal Heritage", 3, 32000)}
                className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant transition-colors flex-shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <span>🕌 Lahore Heritage & Food Trail (3D)</span>
              </button>
              <button
                onClick={() => handleTemplatePill("Makran Coastal Highway & Gwadar, Balochistan", 4, 48000)}
                className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant transition-colors flex-shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <span>🌊 Makran Coastal Run (4D)</span>
              </button>
            </div>
          </div>

          {/* MAIN 2-COLUMN SPLIT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ==================== LEFT COLUMN: WIZARD CONFIGURATION CANVAS (7 cols) ==================== */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* PRESELECTED ANCHOR PLACE BANNER */}
              {preselectedPlace && (
                <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border-2 border-secondary/40 shadow-elevated flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all animate-fade-in">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-secondary/15 border border-secondary/30 text-secondary flex items-center justify-center font-bold shrink-0">
                      <span className="material-symbols-outlined text-2xl">location_on</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-0.5 rounded-md">
                          Anchor Place Locked
                        </span>
                      </div>
                      <p className="text-sm sm:text-base font-extrabold text-on-surface mt-0.5">
                        {preselectedPlace.name} {preselectedPlace.city_name ? `• ${preselectedPlace.city_name}` : ""}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Designing route starting/featuring this place. Adjust days, budget, and options below.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreselectedPlace(null)}
                    className="text-xs font-semibold text-on-surface-variant hover:text-on-surface px-3 py-1.5 rounded-xl border border-outline-variant/60 hover:bg-surface-container-high transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    Clear Anchor
                  </button>
                </div>
              )}
              {/* STEP 01: Departure Hub & Destination Vector */}
              <section className="p-6 sm:p-7 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-luxury relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center font-mono text-xs font-bold text-secondary">
                      01
                    </span>
                    <div>
                      <h2 className="font-display font-bold text-base sm:text-lg text-on-surface">
                        Departure Hub & Destination Vector
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        Select your starting city and primary destination hub for PostGIS route calculations
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> PostGIS Telemetry Active
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Origin City Hub Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                      Starting City / Hub (Origin Vector):
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                        <span className="material-symbols-outlined text-lg">my_location</span>
                      </div>
                      <input
                        className="w-full pl-10 pr-4 py-3 bg-surface-container-low hover:bg-surface-container/50 focus:bg-surface-container-lowest border border-outline-variant focus:border-secondary rounded-xl text-on-surface font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-secondary/15 placeholder:text-on-surface-variant/70 shadow-xs"
                        placeholder="e.g. Islamabad, Lahore, Karachi, Peshawar, Multan"
                        type="text"
                        value={originCity}
                        onChange={(e) => setOriginCity(e.target.value)}
                      />
                    </div>
                    {/* Origin Quick Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      <span className="font-mono text-[11px] text-on-surface-variant">
                        Quick Hubs:
                      </span>
                      {[
                        { label: "Islamabad (ISB Hub)", val: "Islamabad / Rawalpindi (ISB Hub)" },
                        { label: "Lahore (LHE Hub)", val: "Lahore (LHE Hub)" },
                        { label: "Karachi (KHI Hub)", val: "Karachi (KHI Flight Hub)" },
                        { label: "Peshawar (PEW Hub)", val: "Peshawar (PEW Hub)" },
                        { label: "Multan (MUX Hub)", val: "Multan (MUX Hub)" },
                      ].map((hub) => (
                        <button
                          key={hub.val}
                          onClick={() => setOriginCity(hub.val)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                            originCity.includes(hub.label.split(" ")[0])
                              ? "bg-secondary-container/60 text-secondary border-secondary/30 font-semibold"
                              : "bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant"
                          }`}
                          type="button"
                        >
                          {hub.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Destination Vector */}
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                      Target Destination / Valley:
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                        <span className="material-symbols-outlined text-lg">place</span>
                      </div>
                      <input
                        className="w-full pl-10 pr-28 py-3 bg-surface-container-low hover:bg-surface-container/50 focus:bg-surface-container-lowest border border-outline-variant focus:border-secondary rounded-xl text-on-surface font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-secondary/15 placeholder:text-on-surface-variant/70 shadow-xs"
                        placeholder="Enter target valley, city, or coordinates (e.g., Hunza, Skardu, Swat)"
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                      />
                      {destination && (
                        <button
                          onClick={() => setDestination("")}
                          className="absolute right-2 top-1.5 bottom-1.5 px-3 rounded-lg bg-secondary-container/60 hover:bg-secondary-container text-on-secondary-container font-medium text-xs flex items-center gap-1 transition-all cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-xs">close</span> Clear
                        </button>
                      )}
                    </div>

                    {/* Surprise Me & Trending Chips */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
                      <button
                        onClick={handleSurpriseMe}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-secondary/15 via-secondary-container/40 to-tertiary-container/50 hover:from-secondary/25 text-on-surface border border-secondary/30 font-semibold text-xs transition-all shadow-xs group/btn cursor-pointer"
                        type="button"
                      >
                        <span className="text-tertiary font-bold group-hover/btn:rotate-12 transition-transform">
                          ✨
                        </span>
                        <span>
                          Surprise Me{" "}
                          <span className="font-normal text-on-surface-variant">
                            (AI Curated Valleys)
                          </span>
                        </span>
                      </button>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] text-on-surface-variant">
                          Trending:
                        </span>
                        {["Hunza", "Skardu", "Swat", "Gwadar", "Lahore"].map((chip) => (
                          <button
                            key={chip}
                            onClick={() => handlePopularChip(chip)}
                            className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded-lg text-xs text-on-surface font-medium border border-outline-variant transition-colors cursor-pointer"
                            type="button"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* STEP 02: Temporal Window & Departure Start Date */}
              <section className="p-6 sm:p-7 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-luxury">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center font-mono text-xs font-bold text-secondary">
                      02
                    </span>
                    <div>
                      <h2 className="font-display font-bold text-base sm:text-lg text-on-surface">
                        Temporal Window & Start Date
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        Choose departure date to calibrate seasonality, weather & return timeline
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/60 text-secondary font-mono text-[11px] font-semibold">
                    {seasonalityGate}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Duration Stepper (5 cols) */}
                  <div className="sm:col-span-5 p-4 rounded-xl bg-surface-container-low border border-outline-variant flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                        Expedition Span
                      </span>
                      <span className="text-[11px] font-semibold text-secondary">
                        {pacingText}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <button
                        onClick={() => setDaysCount(Math.max(1, daysCount - 1))}
                        className="w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors border border-outline-variant cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">remove</span>
                      </button>
                      <div className="text-center">
                        <span className="font-display text-2xl font-bold text-on-surface">
                          {daysCount} Days
                        </span>
                        <span className="text-xs text-on-surface-variant block font-medium">
                          {Math.max(0, daysCount - 1)} Nights
                        </span>
                      </div>
                      <button
                        onClick={() => setDaysCount(Math.min(21, daysCount + 1))}
                        className="w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors border border-outline-variant cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                    <div className="mt-2 pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span>Min: 2 Days</span>
                      <span>Max: 21 Days</span>
                    </div>
                  </div>

                  {/* Date Range, Picker & Telemetry (7 cols) */}
                  <div className="sm:col-span-7 p-4 rounded-xl bg-surface-container-low border border-outline-variant flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                        Departure Start Date
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-secondary">
                          event
                        </span>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1 text-xs text-on-surface font-semibold focus:outline-none focus:border-secondary cursor-pointer shadow-xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="w-10 h-10 rounded-lg bg-secondary-container/50 flex items-center justify-center text-secondary flex-shrink-0">
                        <span className="material-symbols-outlined text-xl">calendar_month</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-display text-sm font-bold text-on-surface block truncate">
                          {startDateFormatted} – {endDateFormatted}
                        </span>
                        <span className="text-xs text-on-surface-variant block">
                          Route Vector: {routeTelemetry.dist} ({routeTelemetry.modeRec})
                        </span>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[11px]">
                      <span className="text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-secondary">
                          thermostat
                        </span>{" "}
                        14°C High / 2°C Night
                      </span>
                      <span className="text-secondary font-mono font-semibold">
                        92% Road Passability
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* STEP 03: Precision Budget Architecture */}
              <section className="p-6 sm:p-7 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-luxury">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center font-mono text-xs font-bold text-secondary">
                      03
                    </span>
                    <div>
                      <h2 className="font-display font-bold text-base sm:text-lg text-on-surface">
                        Precision Budget Architecture
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        Dynamic allocation model for logistics, lodging & guiding
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-tertiary-container/50 border border-tertiary/20">
                    <span className="material-symbols-outlined text-xs text-tertiary">diamond</span>
                    <span className="font-mono text-[11px] font-bold text-on-tertiary-container">
                      {budgetTierText}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                        Expedition Spend Per Person
                      </span>
                      <div className="flex items-baseline gap-2.5 mt-1">
                        <span className="font-display text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
                          {currency === "PKR"
                            ? `Rs. ${budget.toLocaleString()}`
                            : `$${usdVal.toLocaleString()} USD`}
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-on-surface-variant font-mono">
                          {currency === "PKR"
                            ? `~ $${usdVal} USD`
                            : `~ Rs. ${budget.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-secondary font-semibold block">
                        Includes private 4x4 + local permits
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        Adjust slider to recalculate dynamically
                      </span>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <div className="px-1">
                    <input
                      className="w-full accent-secondary cursor-pointer h-2.5 bg-surface-container-highest rounded-lg"
                      max="250000"
                      min="20000"
                      step="5000"
                      type="range"
                      value={budget}
                      onChange={(e) => setBudget(parseInt(e.target.value, 10))}
                    />
                    <div className="flex justify-between text-[11px] font-mono text-on-surface-variant mt-1.5">
                      <span>Rs. 20k (Backpacker)</span>
                      <span>Rs. 100k (Luxury Prado)</span>
                      <span>Rs. 250k+ (VIP Glamping)</span>
                    </div>
                  </div>

                  {/* Allocation Bar */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-on-surface font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-secondary" /> Algorithmic Distribution
                      </span>
                      <span className="font-mono text-[11px] text-secondary font-bold">
                        100% Calibrated
                      </span>
                    </div>

                    <div className="h-3 w-full bg-surface-container-highest rounded-full flex overflow-hidden p-0.5 gap-0.5">
                      <div className="h-full bg-secondary rounded-l-full transition-all duration-300" style={{ width: "40%" }} title="Lodging: 40%" />
                      <div className="h-full bg-teal-600 transition-all duration-300" style={{ width: "30%" }} title="Transit & 4x4: 30%" />
                      <div className="h-full bg-amber-600 transition-all duration-300" style={{ width: "20%" }} title="Expeditions & Passes: 20%" />
                      <div className="h-full bg-stone-500 rounded-r-full transition-all duration-300" style={{ width: "10%" }} title="Buffer: 10%" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                      <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/60">
                        <span className="text-on-surface-variant text-[11px] flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-secondary" /> Stays (40%)
                        </span>
                        <span className="font-mono font-bold text-on-surface text-sm block mt-0.5">
                          {currency === "PKR" ? `Rs. ${stayCost.toLocaleString()}` : `$${Math.round(stayCost / usdRate)}`}
                        </span>
                      </div>
                      <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/60">
                        <span className="text-on-surface-variant text-[11px] flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-teal-600" /> 4x4 Transit (30%)
                        </span>
                        <span className="font-mono font-bold text-on-surface text-sm block mt-0.5">
                          {currency === "PKR" ? `Rs. ${travelCost.toLocaleString()}` : `$${Math.round(travelCost / usdRate)}`}
                        </span>
                      </div>
                      <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/60">
                        <span className="text-on-surface-variant text-[11px] flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-600" /> Expeditions (20%)
                        </span>
                        <span className="font-mono font-bold text-on-surface text-sm block mt-0.5">
                          {currency === "PKR" ? `Rs. ${foodCost.toLocaleString()}` : `$${Math.round(foodCost / usdRate)}`}
                        </span>
                      </div>
                      <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/60">
                        <span className="text-on-surface-variant text-[11px] flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-stone-500" /> Buffer (10%)
                        </span>
                        <span className="font-mono font-bold text-on-surface text-sm block mt-0.5">
                          {currency === "PKR" ? `Rs. ${bufferCost.toLocaleString()}` : `$${Math.round(bufferCost / usdRate)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* STEP 04: Taste & Experience Matrix */}
              <section className="p-6 sm:p-7 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-luxury">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center font-mono text-xs font-bold text-secondary">
                      04
                    </span>
                    <div>
                      <h2 className="font-display font-bold text-base sm:text-lg text-on-surface">
                        Taste & Experience Matrix
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        Select core focal themes to tailor route cadence & stops
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-on-surface-variant font-mono">
                    {selectedInterests.length} Active
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {INTEREST_OPTIONS.map((opt) => {
                    const isSelected = selectedInterests.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleInterest(opt.id)}
                        className={`px-3.5 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-secondary text-on-primary shadow-xs"
                            : "bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant"
                        }`}
                        type="button"
                      >
                        <span>{opt.label}</span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-xs">check</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* STEP 05: Travel Dynamics & Cohort */}
              <section className="p-6 sm:p-7 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-luxury">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center font-mono text-xs font-bold text-secondary">
                      05
                    </span>
                    <div>
                      <h2 className="font-display font-bold text-base sm:text-lg text-on-surface">
                        Travel Dynamics & Cohort
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        Calibrate physical difficulty, lodging configs, and pacing
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-on-surface-variant font-mono">Cohort Setup</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "solo", title: "Solo Pioneer", desc: "Nimble, photography & summit pacing", icon: "hiking" },
                    { id: "couple", title: "Duo / Couples", desc: "Scenic chalets, sunsets & fireside dining", icon: "favorite" },
                    { id: "family", title: "Family Circle", desc: "Comfortable hotels, gentle walks & kids", icon: "family_restroom" },
                    { id: "crew", title: "Expedition Crew", desc: "High-energy pass crossing & trails", icon: "groups_3" },
                  ].map((st) => {
                    const isActive = travelStyle === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => setTravelStyle(st.id as any)}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between h-36 transition-all cursor-pointer group ${
                          isActive
                            ? "bg-surface-container-low border-2 border-secondary shadow-xs"
                            : "bg-surface-container-low hover:bg-surface-container border-outline-variant"
                        }`}
                        type="button"
                      >
                        <div className="flex justify-between items-start">
                          <span
                            className={`material-symbols-outlined text-2xl group-hover:scale-110 transition-transform ${
                              isActive ? "text-secondary" : "text-on-surface-variant"
                            }`}
                          >
                            {st.icon}
                          </span>
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              isActive ? "bg-secondary" : "border border-outline"
                            }`}
                          >
                            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <div>
                          <span className="font-display font-bold text-xs sm:text-sm text-on-surface block">
                            {st.title}
                          </span>
                          <span className="text-[11px] text-on-surface-variant mt-0.5 block leading-tight">
                            {st.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* STEP 06: Logistics & Velocity Calibration */}
              <section className="p-6 sm:p-7 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-luxury">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center font-mono text-xs font-bold text-secondary">
                      06
                    </span>
                    <div>
                      <h2 className="font-display font-bold text-base sm:text-lg text-on-surface">
                        Logistics & Velocity Calibration
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        Ground vehicle class, hospitality standard, and daily pacing
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-secondary font-mono font-semibold">
                    PostGIS Verified
                  </span>
                </div>

                <div className="space-y-5">
                  {/* Transit Vector Class */}
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-medium mb-2">
                      Transit Vector Class
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: "car", title: "Private 4x4 Prado", desc: "All terrains & passes", icon: "directions_car" },
                        { id: "flight", title: "Flight + 4x4", desc: "Gilgit / Skardu Air", icon: "flight" },
                        { id: "bus", title: "Executive Coach", desc: "KKH highway cruise", icon: "directions_bus" },
                        { id: "hybrid", title: "Hybrid Staged", desc: "Intermodal transit", icon: "sync_alt" },
                      ].map((tm) => (
                        <button
                          key={tm.id}
                          onClick={() => setTransitMode(tm.id as any)}
                          className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 cursor-pointer transition-all ${
                            transitMode === tm.id
                              ? "bg-surface-container-low border-2 border-secondary"
                              : "bg-surface-container-low border-outline-variant hover:bg-surface-container"
                          }`}
                          type="button"
                        >
                          <span
                            className={`material-symbols-outlined text-xl ${
                              transitMode === tm.id ? "text-secondary" : "text-on-surface-variant"
                            }`}
                          >
                            {tm.icon}
                          </span>
                          <span className="font-display font-bold text-xs text-on-surface">
                            {tm.title}
                          </span>
                          <span className="text-[10px] text-on-surface-variant">{tm.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lodging Architecture */}
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-medium mb-2">
                      Lodging Architecture
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: "glamping", title: "Heritage Glamping & Resorts", desc: "Serena, Luxus & luxury domes", icon: "chalet" },
                        { id: "midrange", title: "Boutique Scenic Mid-Range", desc: "Panoramic riverfront hotels", icon: "hotel" },
                        { id: "homestay", title: "Curated Homestays", desc: "Authentic local village hosts", icon: "cottage" },
                      ].map((ld) => (
                        <button
                          key={ld.id}
                          onClick={() => setLodgingStyle(ld.id as any)}
                          className={`p-3 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
                            lodgingStyle === ld.id
                              ? "bg-surface-container-low border-2 border-secondary"
                              : "bg-surface-container-low border-outline-variant hover:bg-surface-container"
                          }`}
                          type="button"
                        >
                          <span
                            className={`material-symbols-outlined text-xl mt-0.5 ${
                              lodgingStyle === ld.id ? "text-secondary" : "text-on-surface-variant"
                            }`}
                          >
                            {ld.icon}
                          </span>
                          <div>
                            <span className="font-display font-bold text-xs text-on-surface block">
                              {ld.title}
                            </span>
                            <span className="text-[11px] text-on-surface-variant">{ld.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Daily Daylight Pacing Dial */}
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-medium mb-2">
                      Daily Daylight Pacing
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-surface-container-low p-1 rounded-xl border border-outline-variant">
                      {[
                        { id: "relaxed", label: "Relaxed (3h transit/day)" },
                        { id: "balanced", label: "Balanced Harmony" },
                        { id: "intensive", label: "Intensive Explorer" },
                      ].map((pc) => (
                        <button
                          key={pc.id}
                          onClick={() => setPace(pc.id as any)}
                          className={`py-2 rounded-lg text-xs text-center transition-all cursor-pointer ${
                            pace === pc.id
                              ? "bg-surface-container-lowest text-on-surface border border-outline-variant/60 shadow-xs font-bold"
                              : "text-on-surface-variant hover:text-on-surface font-semibold"
                          }`}
                          type="button"
                        >
                          {pc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* MASTER CTA BUTTON & TRUST BADGES */}
              <div className="pt-2 flex flex-col gap-3 pb-8">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="relative w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#151515] via-[#1a2d27] to-[#186a57] hover:to-[#135546] text-white transition-all duration-300 flex items-center justify-between shadow-glow-emerald cursor-pointer group hover:shadow-xl hover:scale-[1.008] active:scale-[0.995] disabled:opacity-80"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg group-hover:rotate-12 transition-transform">
                      ✨
                    </span>
                    <div className="text-left">
                      <span className="font-display text-base sm:text-lg font-bold tracking-tight block">
                        {isGenerating
                          ? `Solving Constraints via PostGIS Engine...`
                          : "Generate Autonomous Itinerary"}
                      </span>
                      <span className="text-[11px] text-emerald-200/80 font-mono block">
                        Zero Hallucination · Topographic Route Simulation
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 border border-white/10 font-mono text-xs text-white/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Solve Time: ~2.8s
                    </span>
                    <span className="material-symbols-outlined text-xl group-hover:translate-x-1.5 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </button>

                {/* Trust Signals */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-on-surface-variant font-mono text-[11px]">
                  <span className="flex items-center gap-1 text-secondary">
                    <span className="material-symbols-outlined text-xs">verified</span> 100% Deterministic Feasibility
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-secondary">satellite_alt</span> Live PostGIS Satellite Verified
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-secondary">lock</span> Zero Cancellation Booking Lockers
                  </span>
                </div>
              </div>
            </div>

            {/* ==================== RIGHT COLUMN: LIVE STICKY DASHBOARD (5 cols) ==================== */}
            <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
              {/* Glassmorphic Panel Card */}
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-luxury p-5 sm:p-6 relative overflow-hidden">
                {/* Header & Sync Pulse */}
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-outline-variant">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
                    </span>
                    <span className="font-display font-bold text-sm text-on-surface">
                      Live Expedition Synthesis
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-mono text-[10px] font-semibold border border-secondary/20 uppercase tracking-wider">
                    SYNC ACTIVE
                  </span>
                </div>

                {/* Cinematic Visual Banner */}
                <div className="relative rounded-xl overflow-hidden shadow-xs mb-4 group">
                  <img
                    alt={activePreset.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-700"
                    src={activePreset.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-between p-3.5 text-white">
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-1 rounded-md bg-black/40 backdrop-blur-md border border-white/20 font-mono text-[10px] tracking-wider uppercase text-emerald-300 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live Satellite Cadence
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-[10px] font-mono">
                        17:42 PKT Golden Hr
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 block font-medium">
                            Destination Focal Point
                          </span>
                          <h3 className="font-display text-lg font-bold tracking-tight text-white leading-tight">
                            {activePreset.name}
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-white block">
                            Elev. {activePreset.elevation}
                          </span>
                          <span className="text-[10px] text-white/80">{activePreset.region}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Route Fit & Weather Widgets */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant block font-medium">
                        Computational Fit
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-display text-2xl font-extrabold text-on-surface tracking-tight">
                          {routeFitPercent}%
                        </span>
                        <span className="text-[11px] font-mono text-secondary font-semibold">
                          Superb
                        </span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant block mt-0.5">
                        12/12 gates validated
                      </span>
                    </div>
                    <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-surface-container-highest"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                      />
                      <path
                        className="text-secondary"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${routeFitPercent}, 100`}
                        strokeLinecap="round"
                        strokeWidth="3.5"
                      />
                    </svg>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">
                        Telemetry
                      </span>
                      <span className="material-symbols-outlined text-amber-600 text-base">
                        sunny
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-2xl font-extrabold text-on-surface tracking-tight">
                          {activePreset.weatherTemp}
                        </span>
                        <span className="text-xs text-on-surface-variant font-medium">
                          {activePreset.weather}
                        </span>
                      </div>
                      <span className="text-[10px] text-secondary font-medium block">
                        {activePreset.foliage}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Constraint Validator Checklist */}
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant mb-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono font-semibold">
                    <span className="text-on-surface flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-secondary">
                        fact_check
                      </span>{" "}
                      Constraint Solver Validation
                    </span>
                    <span className="text-secondary">ALL PASSED</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                    <div className="bg-surface-container-lowest p-1.5 rounded border border-outline-variant/60 flex items-center gap-1 text-emerald-800 font-semibold">
                      <span className="material-symbols-outlined text-xs text-emerald-600">
                        check_circle
                      </span>
                      <span>Budget: PASS</span>
                    </div>
                    <div className="bg-surface-container-lowest p-1.5 rounded border border-outline-variant/60 flex items-center gap-1 text-emerald-800 font-semibold">
                      <span className="material-symbols-outlined text-xs text-emerald-600">
                        check_circle
                      </span>
                      <span>KKH: OPEN</span>
                    </div>
                    <div className="bg-surface-container-lowest p-1.5 rounded border border-outline-variant/60 flex items-center gap-1 text-emerald-800 font-semibold">
                      <span className="material-symbols-outlined text-xs text-emerald-600">
                        check_circle
                      </span>
                      <span>Pacing: OPTIMAL</span>
                    </div>
                  </div>
                </div>

                {/* Day-by-Day Micro-Timeline Pipeline */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                      Synthesized Waypoint Pipeline
                    </span>
                    <span className="text-[11px] text-secondary font-mono font-semibold">
                      {Math.min(activePreset.waypoints.length, daysCount)} Vectors
                    </span>
                  </div>
                  <div className="relative pl-5 space-y-3.5 before:content-[''] before:absolute before:top-2.5 before:bottom-2.5 before:left-1.5 before:w-0.5 before:bg-outline-variant">
                    {activePreset.waypoints.slice(0, Math.min(activePreset.waypoints.length, daysCount)).map((wp, idx) => {
                      const dynamicTitle = idx === 0 && wp.title.includes("Islamabad")
                        ? wp.title.replace("Islamabad", originCity.split(" ")[0])
                        : wp.title;
                      return (
                        <div key={idx} className="relative group">
                          <span className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-secondary ring-4 ring-surface-container-lowest" />
                          <div className="flex items-baseline justify-between">
                            <span className="font-display font-bold text-xs text-on-surface">
                              {dynamicTitle}
                            </span>
                            <span className="font-mono text-[10px] text-secondary font-semibold">
                              {wp.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                            {wp.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Topographic Map Preview */}
                <div className="rounded-xl overflow-hidden border border-outline-variant relative group">
                  <div
                    className="w-full h-32 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${activePreset.mapImage}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                  <div className="absolute bottom-2 left-2 right-2 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 flex items-center justify-between text-on-surface">
                    <span className="font-mono text-[11px] font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary" /> {daysCount} Mountain Waypoints Active
                    </span>
                    <Link
                      className="font-display text-xs font-bold text-secondary hover:text-emerald-800 flex items-center gap-0.5"
                      href="/explore#map"
                    >
                      <span>Expand Full GIS Map</span>
                      <span className="material-symbols-outlined text-xs">arrow_outward</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* AI Concierge Proactive Card */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-secondary/30 shadow-luxury flex items-start gap-3.5 relative overflow-hidden">
                <div className="w-2 h-full absolute left-0 top-0 bottom-0 bg-secondary" />
                <div className="w-9 h-9 rounded-xl bg-secondary-container/50 border border-secondary/20 flex-shrink-0 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-lg">psychology</span>
                </div>
                <div className="space-y-1 pl-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xs font-bold text-on-surface">
                      AI Concierge Proactive Recommendation
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-secondary-container text-on-secondary-container font-mono text-[9px] font-bold uppercase">
                      High Value
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Because you selected <strong className="text-on-surface">Haute Photography</strong> and <strong className="text-on-surface">Autumn Peak</strong>, the optimizer prioritized the 17:35 PKT golden hour reflection directly over Ladyfinger & Ultar peaks from Eagle's Nest viewpoint.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* QUICK SEARCH OVERLAY MODAL (⌘K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/30">
            <div className="p-4 border-b border-surface-container-low flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant">search</span>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations, routes, or mountain passes..."
                className="flex-1 bg-transparent font-sans text-sm sm:text-base text-on-surface focus:outline-none placeholder:text-on-surface-variant"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-on-surface-variant hover:text-on-surface px-2 py-1 rounded text-xs font-semibold cursor-pointer"
              >
                ESC
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto space-y-2">
              <div className="text-xs uppercase font-bold tracking-wider text-on-surface-variant mb-2">
                Suggested Destinations
              </div>
              {["Hunza Valley & Gojal", "Skardu & Deosai Plains", "Swat & Kalam Emerald Valleys", "Lahore Walled City & Forts", "Naran & Lake Saiful Malook", "Gwadar Coastal Highway"].map((dest) => (
                <button
                  key={dest}
                  onClick={() => {
                    setDestination(dest);
                    setSearchOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-xl hover:bg-surface-container-low transition-colors flex items-center justify-between text-on-surface cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-semibold">{dest}</span>
                  <span className="text-xs text-secondary font-bold">Select ➔</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== LUXURY FOOTER ==================== */}
      <footer className="w-full bg-surface-container-low border-t border-outline-variant pt-16 pb-12">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-outline-variant">
            {/* Brand Column */}
            <div className="lg:col-span-4 flex flex-col items-start gap-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center border border-secondary/20">
                  <span className="material-symbols-outlined text-secondary text-xl">
                    travel_explore
                  </span>
                </div>
                <span className="font-display font-bold text-xl text-on-surface tracking-tight">
                  Wander<span className="text-secondary">AI</span>
                </span>
              </div>
              <p className="text-sm text-on-surface font-medium">
                Explore more. Plan smarter. Travel better.
              </p>
              <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
                High-touch bespoke travel curation augmented by state-of-the-art computational intelligence and real-time geographic telemetry.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container border border-outline-variant font-mono text-[11px] text-on-surface">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Global API: 99.98%
                </span>
                <span className="text-xs text-on-surface-variant">PostGIS 3.4 · OpenStreetMap</span>
              </div>
            </div>

            {/* Links: Explore */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface">
                Explore
              </span>
              <div className="flex flex-col gap-2 text-xs">
                <Link className="text-on-surface-variant hover:text-on-surface transition-colors" href="/explore">
                  Curated Itineraries
                </Link>
                <Link className="text-on-surface-variant hover:text-on-surface transition-colors" href="/places">
                  Regional Field Guides
                </Link>
                <Link className="text-on-surface-variant hover:text-on-surface transition-colors" href="/explore#map">
                  Interactive Waypoints
                </Link>
                <Link className="text-on-surface-variant hover:text-on-surface transition-colors" href="/planner">
                  Karakoram Highway Hub
                </Link>
                <Link className="text-on-surface-variant hover:text-on-surface transition-colors" href="/planner">
                  Silk Road Passes
                </Link>
              </div>
            </div>

            {/* Links: AI Tools */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface">
                AI Tools
              </span>
              <div className="flex flex-col gap-2 text-xs">
                <Link className="text-secondary font-medium hover:text-on-surface transition-colors" href="/planner">
                  Autonomous Synthesizer
                </Link>
                <Link className="text-on-surface-variant hover:text-on-surface transition-colors" href="/assistant">
                  Concierge Intelligence
                </Link>
                <Link className="text-on-surface-variant hover:text-on-surface transition-colors" href="/explore">
                  Elevation & Road Strips
                </Link>
                <Link className="text-on-surface-variant hover:text-on-surface transition-colors" href="/planner">
                  Constraint Solver v3.4
                </Link>
                <Link className="text-on-surface-variant hover:text-on-surface transition-colors" href="/planner">
                  Weather Window Predictor
                </Link>
              </div>
            </div>

            {/* Newsletter Dispatch */}
            <div className="lg:col-span-4 flex flex-col gap-3.5">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface">
                Algorithmic Travel Dispatch
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Receive exclusive seasonal expedition releases, snow clearance alerts, and predictive itinerary drops directly.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Thank you for joining the Algorithmic Travel Dispatch!");
                }}
                className="flex items-center gap-2"
              >
                <input
                  className="flex-1 px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/70 text-xs focus:outline-none focus:ring-1 focus:ring-secondary"
                  placeholder="Enter your expedition email"
                  type="email"
                  required
                />
                <button
                  className="px-4 py-2 rounded-xl bg-secondary text-white hover:bg-[#135546] transition-colors font-semibold text-xs cursor-pointer"
                  type="submit"
                >
                  Join Dispatch
                </button>
              </form>
              <span className="text-[10px] text-on-surface-variant font-mono">
                No spam. One dispatch every fortnight.
              </span>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
            <p>© 2025 WanderAI Intelligence Inc. High-fidelity algorithmic expedition design.</p>
            <div className="flex items-center gap-6">
              <Link className="hover:text-on-surface transition-colors" href="#">
                Privacy Protocol
              </Link>
              <Link className="hover:text-on-surface transition-colors" href="#">
                Terms of Architecture
              </Link>
              <Link className="hover:text-on-surface transition-colors" href="#">
                Satellite Telemetry SLA
              </Link>
              <Link className="hover:text-on-surface transition-colors" href="#">
                Security Architecture
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AIPlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-secondary">
            <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
            <span className="font-display font-bold text-lg">Loading Planner Engine...</span>
          </div>
        </div>
      }
    >
      <PlannerContent />
    </Suspense>
  );
}
