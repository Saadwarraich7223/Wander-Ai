"use client";

import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { placesApi, tripsApi } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { sanitizePayload } from "@/lib/sanitize";
import { City, PlaceSummary } from "@/types";
import Navbar from "@/components/Navbar";
import CityAutocomplete from "@/components/CityAutocomplete";
import {
  PakistanLocation,
  findPakistanLocation,
  calculateRouteMetrics,
  getDestinationClimate,
  getDestinationInterests,
  PAKISTAN_LOCATIONS,
} from "@/lib/pakistanGeo";

const POPULAR_ORIGIN_HUBS = [
  { label: "Islamabad (ISB Hub)", val: "Islamabad (Islamabad Capital)" },
  { label: "Lahore (LHE Hub)", val: "Lahore (Punjab)" },
  { label: "Karachi (KHI Hub)", val: "Karachi (Sindh)" },
  { label: "Peshawar (PEW Hub)", val: "Peshawar (Khyber Pakhtunkhwa)" },
  { label: "Multan (MUX Hub)", val: "Multan (Punjab)" },
  { label: "Bahawalpur (BWP Hub)", val: "Bahawalpur & Cholistan, Punjab" },
  { label: "Chishtian (CTN)", val: "Chishtian (Punjab)" },
];

const QUICK_TEMPLATES = [
  {
    label: "Hunza Autumn Peak (5D)",
    fit: "98% Fit",
    destName: "Hunza Valley & Gojal, Gilgit-Baltistan",
    days: 5,
    budget: 55000,
  },
  {
    label: "Skardu Glacial Trek (7D)",
    fit: "95% Fit",
    destName: "Skardu & Deosai Plains, Gilgit-Baltistan",
    days: 7,
    budget: 85000,
  },
  {
    label: "Bahawalpur & Cholistan Forts (3D)",
    fit: "99% Fit",
    destName: "Bahawalpur & Cholistan, Punjab",
    days: 3,
    budget: 35000,
  },
  {
    label: "Lahore Heritage Trail (3D)",
    fit: "96% Fit",
    destName: "Lahore, Punjab",
    days: 3,
    budget: 32000,
  },
  {
    label: "Makran Coastal Run (4D)",
    fit: "94% Fit",
    destName: "Gwadar & Makran Coast, Balochistan",
    days: 4,
    budget: 48000,
  },
  {
    label: "Swat & Kalam Valleys (4D)",
    fit: "97% Fit",
    destName: "Swat & Kalam Emerald Valleys, Khyber Pakhtunkhwa",
    days: 4,
    budget: 42000,
  },
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
  const [originCity, setOriginCity] = useState<string>("Islamabad (Islamabad Capital)");
  const [originLocation, setOriginLocation] = useState<PakistanLocation | null>(() =>
    findPakistanLocation("Islamabad") || PAKISTAN_LOCATIONS[0]
  );

  const [destination, setDestination] = useState<string>("Hunza Valley & Gojal, Gilgit-Baltistan");
  const [destinationLocation, setDestinationLocation] = useState<PakistanLocation | null>(() =>
    findPakistanLocation("Hunza") || PAKISTAN_LOCATIONS[0]
  );

  const [destinationPlaces, setDestinationPlaces] = useState<PlaceSummary[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);

  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [daysCount, setDaysCount] = useState<number>(5);
  const [currency, setCurrency] = useState<"PKR" | "USD">("PKR");
  const [budget, setBudget] = useState<number>(50000);

  // Dynamic Contextual Destination Interests Matrix
  const destinationMatrix = useMemo(() => {
    const defaultDest = findPakistanLocation("Hunza")!;
    return getDestinationInterests(destinationLocation || defaultDest);
  }, [destinationLocation]);

  const [selectedInterests, setSelectedInterests] = useState<string[]>(() => {
    const defaultDest = findPakistanLocation("Hunza")!;
    return getDestinationInterests(defaultDest).defaultSelectedIds;
  });

  const prevDestKeyRef = useRef<string>("");

  // Automatically update selected interests whenever destination location or category changes
  useEffect(() => {
    const currentKey = destinationLocation
      ? `${destinationLocation.id}-${destinationMatrix.category}`
      : `default-${destinationMatrix.category}`;
    if (currentKey !== prevDestKeyRef.current) {
      prevDestKeyRef.current = currentKey;
      setSelectedInterests(destinationMatrix.defaultSelectedIds);
    }
  }, [destinationLocation, destinationMatrix]);

  const [travelStyle, setTravelStyle] = useState<"solo" | "couple" | "family" | "crew">("solo");
  const [transitMode, setTransitMode] = useState<"car" | "flight" | "bus" | "hybrid">("car");
  const [vehicleClass, setVehicleClass] = useState<"sedan" | "crossover" | "suv_4x4">("crossover");
  const [lodgingStyle, setLodgingStyle] = useState<"glamping" | "midrange" | "homestay">("glamping");
  const [pace, setPace] = useState<"relaxed" | "balanced" | "intensive">("balanced");
  const [mode, setMode] = useState<"bespoke" | "precalibrated" | "prompt">("bespoke");

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBackendCities();
    fetchTripsCount();
  }, []);

  // Handle incoming query params
  useEffect(() => {
    const destParam = searchParams.get("destination");
    const originParam = searchParams.get("origin");
    const budgetParam = searchParams.get("budget");
    const paceParam = searchParams.get("pace");
    const pId = searchParams.get("place_id");
    const pName = searchParams.get("place_name");
    const cId = searchParams.get("city_id");
    const cName = searchParams.get("city_name");
    const daysParam = searchParams.get("days");
    const cohortParam = searchParams.get("cohort") || searchParams.get("travel_style");

    if (pId && pName) {
      setPreselectedPlace({
        id: pId,
        name: pName,
        city_id: cId || undefined,
        city_name: cName || undefined,
      });

      const destString = cName ? `${pName}, ${cName}` : pName;
      setDestination(destString);
      const loc = findPakistanLocation(cName || pName);
      if (loc) setDestinationLocation(loc);
    } else if (destParam) {
      setDestination(destParam);
      const loc = findPakistanLocation(destParam);
      if (loc) setDestinationLocation(loc);
    }

    if (originParam) {
      setOriginCity(originParam);
      const loc = findPakistanLocation(originParam);
      if (loc) setOriginLocation(loc);
    }

    if (budgetParam) {
      const parsedBudget = parseInt(budgetParam, 10);
      if (!isNaN(parsedBudget) && parsedBudget > 0) {
        setBudget(parsedBudget);
      }
    }

    if (paceParam && ["relaxed", "balanced", "intensive"].includes(paceParam)) {
      setPace(paceParam as "relaxed" | "balanced" | "intensive");
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

  // Sync destination location when destination text changes
  useEffect(() => {
    const loc = findPakistanLocation(destination);
    if (loc) {
      setDestinationLocation(loc);
    }
  }, [destination]);

  // Sync origin location when origin text changes
  useEffect(() => {
    const loc = findPakistanLocation(originCity);
    if (loc) {
      setOriginLocation(loc);
    }
  }, [originCity]);

  // Dynamic Route Metrics (PostGIS Haversine + Terrain Routing)
  const routeMetrics = useMemo(() => {
    const defaultOrigin = findPakistanLocation("Islamabad")!;
    const defaultDest = findPakistanLocation("Hunza")!;
    return calculateRouteMetrics(
      originLocation || defaultOrigin,
      destinationLocation || defaultDest
    );
  }, [originLocation, destinationLocation]);

  // If flight is not viable for this route, ensure transitMode is not left on flight
  useEffect(() => {
    if (!routeMetrics.canFlyCommercial && transitMode === "flight") {
      setTransitMode("car");
    }
  }, [routeMetrics.canFlyCommercial, transitMode]);

  // Fetch real database places for the active destination
  useEffect(() => {
    let isCancelled = false;

    async function loadPlacesForDestination() {
      if (!destinationLocation) return;
      setIsLoadingPlaces(true);

      try {
        // 1. Only look up database places if this location is an exact database city
        // (Do NOT use parent_hub_slug because it will pull Lahore's places for Kasur, or Bahawalpur's places for Hasilpur!)
        const matchedCity = destinationLocation.db_city_slug
          ? cities.find((c) => c.slug === destinationLocation.db_city_slug)
          : cities.find(
              (c) =>
                c.name.toLowerCase() === destinationLocation.name.toLowerCase() ||
                c.slug.toLowerCase() === destinationLocation.name.toLowerCase()
            );

        if (matchedCity) {
          const res = await placesApi.list({ city_id: matchedCity.id, limit: 15 });
          if (!isCancelled && res?.items && res.items.length > 0) {
            setDestinationPlaces(res.items);
            setIsLoadingPlaces(false);
            return;
          }
        }

        // 2. If no direct DB city match, try searching database for places that explicitly match this exact city/town name
        const searchWord = destinationLocation.name.split(" ")[0].replace(/[^a-zA-Z]/g, "");
        if (searchWord.length >= 3) {
          const res = await placesApi.list({ q: searchWord, limit: 10 });
          if (!isCancelled && res?.items && res.items.length > 0) {
            const validMatches = res.items.filter((item: PlaceSummary) => {
              const matchName = item.name.toLowerCase().includes(searchWord.toLowerCase());
              const matchDesc = item.description?.toLowerCase().includes(searchWord.toLowerCase());
              return matchName || matchDesc;
            });
            if (validMatches.length > 0) {
              setDestinationPlaces(validMatches);
              setIsLoadingPlaces(false);
              return;
            }
          }
        }

        // 3. Fallback to empty [] so that the pipeline strictly uses destinationLocation's curated highlights
        if (!isCancelled) {
          setDestinationPlaces([]);
          setIsLoadingPlaces(false);
        }
      } catch {
        if (!isCancelled) {
          setDestinationPlaces([]);
          setIsLoadingPlaces(false);
        }
      }
    }

    loadPlacesForDestination();

    return () => {
      isCancelled = true;
    };
  }, [destinationLocation, cities]);

  // Dynamic Climate & Seasonality Metrics
  const climateMetrics = useMemo(() => {
    const defaultDest = findPakistanLocation("Hunza")!;
    return getDestinationClimate(destinationLocation || defaultDest, startDate);
  }, [destinationLocation, startDate]);

  // Dynamic Dates
  const startObj = useMemo(() => new Date(startDate || "2025-10-18"), [startDate]);
  const endObj = useMemo(() => {
    const d = new Date(startObj);
    d.setDate(startObj.getDate() + Math.max(1, daysCount - 1));
    return d;
  }, [startObj, daysCount]);

  const formatShortDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const endDateFormatted = formatShortDate(endObj);
  const startDateFormatted = formatShortDate(startObj);

  // Dynamic Waypoint Pipeline Builder (Filtered & Ranked by Selected Taste & Experience Matrix Themes)
  const synthesizedWaypoints = useMemo(() => {
    const destLoc = destinationLocation || findPakistanLocation("Hunza")!;
    const originLoc = originLocation || findPakistanLocation("Islamabad")!;
    const isSameCity = routeMetrics.drivingDistanceKm < 20;

    const waypoints: { title: string; type: string; desc: string }[] = [];

    // Day 1: Transit & Check-in / Anchor
    if (isSameCity) {
      waypoints.push({
        title: `Day 1: ${destLoc.name} Intra-City Staging & Heritage Circuit`,
        type: "Local Transit",
        desc: `Local exploration and arrival check-in. Curated boutique lodging in central ${destLoc.name}.`,
      });
    } else {
      waypoints.push({
        title: `Day 1: ${originLoc.name.split(" ")[0]} ➔ ${destLoc.name.split(" ")[0]}`,
        type: `${routeMetrics.drivingDistanceKm} km`,
        desc: `Transit via ${routeMetrics.corridorName}. Arrival & panoramic orientation dinner in ${destLoc.name}.`,
      });
    }

    // Keyword & Semantic Matcher for Taste & Experience Matrix Themes
    const scoreCandidate = (
      title: string,
      desc: string
    ): { score: number; matchedType: string } => {
      const text = `${title} ${desc}`.toLowerCase();
      let score = 0;
      let matchedType = "Curated Excursion";

      const themeRules: Record<string, { keywords: string[]; type: string; weight: number }> = {
        wetlands_wildlife: {
          keywords: ["wetland", "wildlife", "national park", "sanctuary", "deer", "blackbuck", "lake", "canal", "river", "barrage", "forest", "lal suhanra", "head islam"],
          type: "Nature & Wildlife Sanctuary",
          weight: 15,
        },
        artisan_crafts: {
          keywords: ["bazaar", "craft", "chunri", "pottery", "artisan", "handicraft", "leather", "market", "silk", "shopping"],
          type: "Handcrafted Bazaars & Culture",
          weight: 15,
        },
        craft_bazaars: {
          keywords: ["bazaar", "craft", "market", "anarkali", "walled city", "silk", "shopping"],
          type: "Artisan Bazaars & Silk Markets",
          weight: 15,
        },
        local_shawls: {
          keywords: ["shawl", "pashmina", "bazaar", "craft", "market", "handicraft"],
          type: "Handcrafted Shawls & Bazaars",
          weight: 15,
        },
        tribal_bazaars: {
          keywords: ["mirrorwork", "rug", "tribal", "bazaar", "craft", "market"],
          type: "Baloch Tribal Crafts & Bazaars",
          weight: 15,
        },
        gemstone_bazaars: {
          keywords: ["gemstone", "patti", "handcraft", "bazaar", "market"],
          type: "Mountain Gemstones & Crafts",
          weight: 15,
        },
        port_bazaars: {
          keywords: ["port", "bazaar", "market", "embroidery", "craft"],
          type: "Silk Route Port Bazaars",
          weight: 15,
        },
        sufi_heritage: {
          keywords: ["shrine", "sufi", "hakra", "channan pir", "ruins", "civilization", "ancient", "tomb", "maharvi", "bulleh shah"],
          type: "Ancient Civilization & Sufi Heritage",
          weight: 15,
        },
        royal_forts: {
          keywords: ["palace", "mahal", "fort", "fortress", "bastion", "citadel", "noor mahal", "darbar mahal"],
          type: "Royal Palaces & Fortresses",
          weight: 12,
        },
        desert_safari: {
          keywords: ["desert", "dune", "safari", "4x4", "cholistan", "thar", "sand", "derawar"],
          type: "4x4 Desert Dunes Safari",
          weight: 12,
        },
        mughal_heritage: {
          keywords: ["mughal", "badshahi", "unesco", "sheesh mahal", "shalamar", "monument", "historic", "heritage"],
          type: "Mughal Architecture & Heritage",
          weight: 12,
        },
        historic_passes: {
          keywords: ["pass", "bolan", "silk", "fort", "historic"],
          type: "Historic Passes & Silk Forts",
          weight: 12,
        },
        museums_archaeology: {
          keywords: ["museum", "archaeological", "relic", "gandhara", "taxila", "harappa"],
          type: "Archaeological Museums & Relics",
          weight: 12,
        },
        gastronomy: {
          keywords: ["gastronomy", "cuisine", "sohan halwa", "sajji", "food", "fare", "dining", "delicacy"],
          type: "Saraiki & Royal Gastronomy",
          weight: 12,
        },
        food_street: {
          keywords: ["food street", "gastronomy", "dining", "karahi", "namak mandi", "gawalmandi"],
          type: "Legendary Food Streets & Gastronomy",
          weight: 12,
        },
        trout_gastronomy: {
          keywords: ["trout", "river trout", "fish", "cafe", "food", "dining"],
          type: "Fresh River Trout & Mountain Cafes",
          weight: 12,
        },
        seafood_gastronomy: {
          keywords: ["seafood", "fish", "harbor", "dining", "crabs", "prawns"],
          type: "Fresh Harbor Seafood Dining",
          weight: 12,
        },
        balochi_gastronomy: {
          keywords: ["balochi", "rosh", "sajji", "kakar", "bread", "dining"],
          type: "Balochi Rosh & Traditional Gastronomy",
          weight: 12,
        },
        silk_road_food: {
          keywords: ["apricot", "walnut", "fare", "indigenous", "food"],
          type: "Silk Road Indigenous Fare",
          weight: 12,
        },
        stargazing_glamping: {
          keywords: ["glamping", "stargazing", "star", "camp", "night", "dunes camp"],
          type: "Desert Glamping & Stargazing",
          weight: 12,
        },
        stargazing: {
          keywords: ["stargazing", "milky way", "star", "night", "astronomy", "dark sky"],
          type: "High-Altitude Milky Way Stargazing",
          weight: 12,
        },
        glamping_chalets: {
          keywords: ["chalet", "glamping", "cabin", "wooden", "stay"],
          type: "Boutique Wooden Chalets & Glamping",
          weight: 12,
        },
        glamping_cabins: {
          keywords: ["cabin", "glamping", "forest stay", "riverside"],
          type: "Riverside Cabins & Forest Glamping",
          weight: 12,
        },
        beach_camping: {
          keywords: ["beach", "camping", "glamping", "bioluminescence"],
          type: "Coastal Glamping & Bioluminescence",
          weight: 12,
        },
        highland_camping: {
          keywords: ["plateau", "camping", "highland", "star"],
          type: "High Plateau Stargazing & Camping",
          weight: 12,
        },
        nature_peaks: {
          keywords: ["peak", "7,000m", "summit", "rakaposhi", "k2", "mountain", "viewpoint"],
          type: "7,000m+ Summit Viewpoints",
          weight: 12,
        },
        nature_canopy: {
          keywords: ["pine", "canopy", "forest", "river", "stream", "nature"],
          type: "Dense Pine Canopy & River Streams",
          weight: 12,
        },
        juniper_forests: {
          keywords: ["juniper", "forest", "reserve", "ancient", "tree"],
          type: "Ancient Juniper World Reserves",
          weight: 12,
        },
        coastal_beaches: {
          keywords: ["beach", "cliff", "sea", "ocean", "arabian sea", "coast"],
          type: "Arabian Sea Beaches & Cliffs",
          weight: 12,
        },
        glacial_lakes: {
          keywords: ["glacial lake", "attabad", "shangrila", "lake", "turquoise", "boating"],
          type: "Turquoise Glacial Lakes & Boating",
          weight: 12,
        },
        alpine_trekking: {
          keywords: ["alpine", "trek", "glacier", "pass", "passu", "trail"],
          type: "Alpine Trails & Glacier Passes",
          weight: 12,
        },
        nature_hikes: {
          keywords: ["nature trail", "waterfall", "hike", "walk", "meadow"],
          type: "Gentle Nature Trails & Waterfalls",
          weight: 12,
        },
        scenic_ridges: {
          keywords: ["chairlift", "cable car", "ridge", "panoramic"],
          type: "Chairlifts & Panoramic Ridge Walks",
          weight: 12,
        },
        canyon_gorges: {
          keywords: ["canyon", "gorge", "stream", "moola chotok", "scramble"],
          type: "Hidden Canyon Gorges & Streams",
          weight: 12,
        },
        photography: {
          keywords: ["photography", "sunset", "vantage", "vantage point", "photo", "golden hour"],
          type: "Haute Sunset & Landscape Photography",
          weight: 8,
        },
      };

      selectedInterests.forEach((interestId) => {
        const rule = themeRules[interestId];
        if (rule) {
          for (const kw of rule.keywords) {
            if (text.includes(kw)) {
              score += rule.weight;
              matchedType = rule.type;
              break;
            }
          }
        }
      });

      return { score, matchedType };
    };

    // 1. Gather all candidate places (combining curated highlights and database places)
    interface CandidateItem {
      title: string;
      desc: string;
      defaultType: string;
      dedupKey: string;
    }

    const candidates: CandidateItem[] = [];
    const seenKeys = new Set<string>();

    const getDedupKey = (name: string) => {
      return name
        .toLowerCase()
        .replace(/\(.*?\)/g, "")
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 12);
    };

    // Add curated highlights first (they are perfectly tuned to the specific city/tehsil)
    if (destLoc.curated_highlights && destLoc.curated_highlights.length > 0) {
      destLoc.curated_highlights.forEach((h) => {
        const key = getDedupKey(h);
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          candidates.push({
            title: h,
            desc: `Scenic field itinerary, photography vantage points, and authentic local cultural experience in ${destLoc.name}.`,
            defaultType: "Curated Excursion",
            dedupKey: key,
          });
        }
      });
    }

    // Add database places (if direct matches exist)
    if (destinationPlaces.length > 0) {
      destinationPlaces.forEach((p) => {
        const key = getDedupKey(p.name);
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          candidates.push({
            title: p.name,
            desc: p.description || `${p.name} exploration, photography vectors, and guided cultural experience.`,
            defaultType: p.category?.name || "Focal Attraction",
            dedupKey: key,
          });
        }
      });
    }

    // Fallback if no specific candidates exist
    if (candidates.length === 0) {
      const region = destLoc.province;
      candidates.push(
        {
          title: `${destLoc.name} Cultural Landmark & Heritage Circuit`,
          desc: `Historic architecture, monuments, and iconic city landmarks in ${destLoc.name}.`,
          defaultType: "Regional Heritage",
          dedupKey: "fallback-heritage",
        },
        {
          title: `Local Artisan Bazaars & Countryside Trails`,
          desc: `Handcrafted artisan stalls, traditional markets, and regional delicacies.`,
          defaultType: "Local Culture",
          dedupKey: "fallback-bazaar",
        },
        {
          title: `Panoramic Nature Vantage & Sunset Trail`,
          desc: `Scenic outdoor viewpoints, golden hour photography, and local trails in ${destLoc.name}.`,
          defaultType: "Nature & Scenery",
          dedupKey: "fallback-nature",
        }
      );
    }

    // 2. Score and sort candidates by relevance to selectedInterests
    const scoredCandidates = candidates.map((cand) => {
      const { score, matchedType } = scoreCandidate(cand.title, cand.desc);
      return {
        ...cand,
        score,
        type: score > 0 ? matchedType : cand.defaultType,
      };
    });

    // Sort: highest interest score first, maintaining stable order for ties
    scoredCandidates.sort((a, b) => b.score - a.score);

    // 3. Assign to Days 2..daysCount
    const maxAttractionDays = Math.max(1, daysCount - 1);
    const assignedItems = scoredCandidates.slice(0, maxAttractionDays);

    assignedItems.forEach((item, idx) => {
      const dayNumber = idx + 2;
      if (dayNumber > daysCount) return;
      waypoints.push({
        title: `Day ${dayNumber}: ${item.title}`,
        type: item.type,
        desc: item.desc,
      });
    });

    // Final Return Day if trip is multi-day and last day is transit
    if (daysCount >= 3 && waypoints.length < daysCount) {
      waypoints.push({
        title: `Day ${daysCount}: Local Fare, Souvenirs & Return Vector`,
        type: "Return Transit",
        desc: `Morning artisan bazaar stroll, local specialties / dry fruits, and safe return journey to ${originLoc.name.split(" ")[0]}.`,
      });
    }

    return waypoints.slice(0, daysCount);
  }, [destinationLocation, originLocation, routeMetrics, destinationPlaces, daysCount, selectedInterests]);

  // Destination Hero Image resolution
  const heroImage = useMemo(() => {
    if (destinationPlaces.length > 0 && destinationPlaces[0].primary_image?.url) {
      return destinationPlaces[0].primary_image.url;
    }
    const destLoc = destinationLocation;
    if (destLoc?.province === "Gilgit-Baltistan") {
      return "https://lh3.googleusercontent.com/aida-public/AB6AXuA6kGwiJoU2OhGsixgvXfGqlWy-DjQMgj2XX2ffdT2P07Yhjv5ztVuPHdm1PlDs9v7MbfUgG34ClS3JGefPsjBpB0-6U90MvIG7bnfTigynCfQWEHfPSVt1HBi_PfQnPcP16z8c14rH-w0DjLr7EGZjp2DwylowOQM71ggT3qAf_MrhpGK-wu3O9fjATMToRu5p1EKzNH73RUDSzSb_mniq7Y9AJcP2Uq9PkV7q_dkNZa4ylIKsxpXLfw";
    }
    if (
      destLoc?.district?.includes("Bahawalpur") ||
      destLoc?.district?.includes("Bahawalnagar") ||
      destLoc?.name?.includes("Cholistan")
    ) {
      return "https://images.unsplash.com/photo-1590077428593-a55bb07c4665?q=80&w=1200&auto=format&fit=crop";
    }
    if (destLoc?.name?.includes("Lahore") || destLoc?.district?.includes("Lahore")) {
      return "https://images.unsplash.com/photo-1589802829985-817e51171b92?q=80&w=1200&auto=format&fit=crop";
    }
    if (destLoc?.province === "Balochistan") {
      return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop";
    }
    if (destLoc?.province === "Khyber Pakhtunkhwa") {
      return "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?q=80&w=1200&auto=format&fit=crop";
    }
    if (destLoc?.province === "Azad Kashmir") {
      return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop";
    }
    return "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop";
  }, [destinationPlaces, destinationLocation]);

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
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter((item) => item !== id));
      }
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleSurpriseMe = () => {
    const touristHubs = PAKISTAN_LOCATIONS.filter((l) => l.is_tourist_hub);
    const randomLoc = touristHubs[Math.floor(Math.random() * touristHubs.length)];
    const formattedName = `${randomLoc.name}, ${randomLoc.province}`;
    setDestination(formattedName);
    setDestinationLocation(randomLoc);
  };

  const handlePopularChip = (cityName: string) => {
    const loc = findPakistanLocation(cityName);
    if (loc) {
      const formattedName = `${loc.name}, ${loc.province}`;
      setDestination(formattedName);
      setDestinationLocation(loc);
    } else {
      setDestination(`${cityName}, Pakistan`);
    }
  };

  const handleTemplatePill = (template: (typeof QUICK_TEMPLATES)[0]) => {
    setDestination(template.destName);
    const loc = findPakistanLocation(template.destName);
    if (loc) setDestinationLocation(loc);
    setDaysCount(template.days);
    setBudget(template.budget);
  };

  const handleGenerate = async () => {
    // Require authentication to generate and save a trip
    const token = authStorage.getAccessToken();
    if (!token) {
      const currentParams = new URLSearchParams();
      if (preselectedPlace?.id) currentParams.set("place_id", preselectedPlace.id);
      if (preselectedPlace?.name) currentParams.set("place_name", preselectedPlace.name);
      currentParams.set("days", daysCount.toString());
      currentParams.set("budget", budget.toString());
      currentParams.set("origin", originCity);
      currentParams.set("destination", destination);
      currentParams.set("pace", pace);
      currentParams.set("style", travelStyle);
      const redirectTarget = `/planner?${currentParams.toString()}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
      return;
    }

    setIsGenerating(true);

    try {
      let matchedCityId = preselectedPlace?.city_id;

      if (!matchedCityId) {
        const destLoc = destinationLocation;
        const targetSlug = destLoc?.db_city_slug || destLoc?.parent_hub_slug;
        const matchedCity = cities.find(
          (c) =>
            (targetSlug && c.slug === targetSlug) ||
            (destLoc?.name && c.name.toLowerCase().includes(destLoc.name.toLowerCase())) ||
            destination.toLowerCase().includes(c.name.toLowerCase())
        );
        matchedCityId = matchedCity ? matchedCity.id : cities[0]?.id || "";
      }

      if (matchedCityId) {
        const payload = sanitizePayload({
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
            vehicle_class: vehicleClass,
            lodging_style: lodgingStyle,
            interests: selectedInterests,
            anchor_place_id: preselectedPlace?.id || null,
            route_distance_km: routeMetrics.drivingDistanceKm,
            route_corridor: routeMetrics.corridorName,
          },
        });

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
        }, 1200);
        return;
      }
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setIsGenerating(false);
      router.push("/trips");
    }, 2500);
  };

  // Budget Calculations
  const usdRate = 278;
  const stayCost = Math.round(budget * 0.4);
  const travelCost = Math.round(budget * 0.3);
  const foodCost = Math.round(budget * 0.2);
  const bufferCost = Math.round(budget * 0.1);
  const usdVal = Math.round(budget / usdRate);

  const routeFitPercent = Math.min(99, 88 + selectedInterests.length * 2);

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

  // Selected interest labels for concierge text
  const activeInterestLabels = useMemo(() => {
    return destinationMatrix.options
      .filter((opt) => selectedInterests.includes(opt.id))
      .map((opt) => opt.label.replace(/^[^\s]+ /, ""))
      .slice(0, 2);
  }, [destinationMatrix, selectedInterests]);

  // Fuel Logistics & Topographic Range Calculations
  const fuelLogistics = useMemo(() => {
    const roundTripDistanceKm = Math.round(routeMetrics.drivingDistanceKm * 2 + daysCount * 35);
    const isMountain = (destinationLocation?.elevation_m || 0) > 1500;

    let kmPerLiter = 14;
    let fuelType = "Super Unleaded (92 Octane)";
    let pricePerLiter = 275;
    let vehicleName = "Sedan (Civic / City / Corolla)";

    if (vehicleClass === "crossover") {
      kmPerLiter = isMountain ? 9.5 : 11.5;
      pricePerLiter = 275;
      vehicleName = "Crossover / Light SUV (Sportage / Tucson / Vezel)";
    } else if (vehicleClass === "suv_4x4") {
      kmPerLiter = isMountain ? 6.5 : 8.0;
      fuelType = "High-Torque Diesel / Hi-Octane";
      pricePerLiter = 285;
      vehicleName = "Heavy 4x4 Rig (LC Prado / Hilux / LC76)";
    } else {
      kmPerLiter = isMountain ? 11.5 : 14.0;
    }

    const litersRequired = Math.ceil(roundTripDistanceKm / kmPerLiter);
    const estimatedFuelCostPkr = litersRequired * pricePerLiter;

    return {
      roundTripDistanceKm,
      vehicleName,
      kmPerLiter,
      litersRequired,
      pricePerLiter,
      fuelType,
      estimatedFuelCostPkr,
      isMountain,
    };
  }, [routeMetrics.drivingDistanceKm, daysCount, destinationLocation, vehicleClass]);

  // Real-time Constraint Solver & Feasibility Engine
  const solverMetrics = useMemo(() => {
    // 1. Budget Feasibility
    const dailySubsistence =
      travelStyle === "family" ? 8500 : travelStyle === "couple" ? 5500 : travelStyle === "crew" ? 10000 : 3200;
    const minViableCost = fuelLogistics.estimatedFuelCostPkr + daysCount * dailySubsistence;
    const isBudgetDeficit = budget < fuelLogistics.estimatedFuelCostPkr;
    const isBudgetTight = budget < minViableCost && !isBudgetDeficit;
    const isBudgetSurplus = budget >= minViableCost * 1.6;

    // 2. Road / Vehicle Feasibility
    const isHighElevation = (destinationLocation?.elevation_m || 0) > 2200;
    const isOffroadDesert =
      (destinationLocation?.district?.toLowerCase().includes("bahawalpur") ?? false) ||
      (destinationLocation?.name?.toLowerCase().includes("cholistan") ?? false) ||
      (destinationLocation?.name?.toLowerCase().includes("thar") ?? false);
    const is4x4Required = (isHighElevation || isOffroadDesert) && vehicleClass === "sedan";

    // 3. Pacing Feasibility
    const dailyDrivingKm = routeMetrics.drivingDistanceKm / Math.max(1, daysCount);
    const isPacingRushed = dailyDrivingKm > 380;
    const isPacingRelaxed = dailyDrivingKm < 150 && daysCount >= 4;

    const issuesCount =
      (isBudgetDeficit || isBudgetTight ? 1 : 0) + (is4x4Required ? 1 : 0) + (isPacingRushed ? 1 : 0);
    const allPassed = issuesCount === 0;

    return {
      allPassed,
      issuesCount,
      minViableCost,
      budgetStatus: isBudgetDeficit ? "DEFICIT" : isBudgetTight ? "TIGHT" : isBudgetSurplus ? "SURPLUS" : "OK",
      budgetColor: isBudgetDeficit
        ? "text-red-700 border-red-300 bg-red-50 dark:bg-red-950/40"
        : isBudgetTight
        ? "text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/40"
        : "text-emerald-800 border-outline-variant/60 bg-surface-container-lowest",
      budgetIcon: isBudgetDeficit ? "error" : isBudgetTight ? "warning" : "check_circle",
      budgetIconColor: isBudgetDeficit ? "text-red-600" : isBudgetTight ? "text-amber-600" : "text-emerald-600",

      roadStatus: is4x4Required ? "4x4 REQ" : isOffroadDesert && vehicleClass === "suv_4x4" ? "4x4 READY" : "CLEAR",
      roadColor: is4x4Required
        ? "text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/40"
        : "text-emerald-800 border-outline-variant/60 bg-surface-container-lowest",
      roadIcon: is4x4Required ? "warning" : "check_circle",
      roadIconColor: is4x4Required ? "text-amber-600" : "text-emerald-600",

      pacingStatus: isPacingRushed ? "RUSHED" : isPacingRelaxed ? "RELAXED" : "FIT",
      pacingColor: isPacingRushed
        ? "text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/40"
        : "text-emerald-800 border-outline-variant/60 bg-surface-container-lowest",
      pacingIcon: isPacingRushed ? "schedule" : "check_circle",
      pacingIconColor: isPacingRushed ? "text-amber-600" : "text-emerald-600",
    };
  }, [
    budget,
    fuelLogistics.estimatedFuelCostPkr,
    daysCount,
    travelStyle,
    destinationLocation,
    vehicleClass,
    routeMetrics.drivingDistanceKm,
  ]);

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
      <main className="w-full pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          {/* HERO HEADER & UTILITY BAR */}
          <div className="pt-2 sm:pt-4 pb-6 border-b border-outline-variant/60 mb-6 sm:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-3xl">
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-on-surface">
                  Design Bespoke Expeditions with
                  <span className="block text-secondary">Algorithmic Precision</span>
                </h1>
                <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed max-w-2xl">
                  Synthesizing topographic elevation, real-time Pakistani road telemetry, curated boutique glamping, and private 4x4 staging into a flawless multi-day itinerary.
                </p>
              </div>

              {/* Mode Selector & Action Blueprint Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center bg-surface-container-high/70 p-1 rounded-xl border border-outline-variant overflow-x-auto scrollbar-none max-w-full">
                  <button
                    onClick={() => setMode("bespoke")}
                    className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg font-display text-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
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
                      setDestinationLocation(findPakistanLocation("Hunza"));
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
                </div>
              </div>
            </div>

            {/* Quick Template Accelerator Strip */}
            <div className="mt-4 pt-3 flex items-center gap-2 overflow-x-auto text-xs pb-1 scrollbar-none">
              <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant flex items-center gap-1 font-semibold flex-shrink-0">
                <span className="material-symbols-outlined text-xs text-secondary">dataset</span>{" "}
                Quick Templates:
              </span>
              {QUICK_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.label}
                  onClick={() => handleTemplatePill(tmpl)}
                  className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant transition-colors flex-shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{tmpl.label}</span>
                  <span className="text-secondary font-mono text-[10px]">{tmpl.fit}</span>
                </button>
              ))}
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
                        {preselectedPlace.name}{" "}
                        {preselectedPlace.city_name ? `• ${preselectedPlace.city_name}` : ""}
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
              <section className="p-6 sm:p-7 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-luxury relative z-30 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center font-mono text-xs font-bold text-secondary">
                      01
                    </span>
                    <div>
                      <h2 className="font-display font-bold text-base sm:text-lg text-on-surface">
                        Departure Point &amp; Destination
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        Select any Pakistani city or district hub to start planning your route
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 180+ Geocoded Hubs
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Origin City Hub Selection (CityAutocomplete) */}
                  <CityAutocomplete
                    label="Starting City / Hub (Origin Vector):"
                    icon="my_location"
                    placeholder="e.g. Chishtian, Bahawalpur, Hasilpur, Lahore, Karachi, Islamabad..."
                    value={originCity}
                    onChange={(val, loc) => {
                      setOriginCity(val);
                      if (loc) {
                        setOriginLocation(loc);
                      } else {
                        const found = findPakistanLocation(val);
                        if (found) setOriginLocation(found);
                      }
                    }}
                    popularChips={POPULAR_ORIGIN_HUBS}
                  />

                  {/* Destination Vector (CityAutocomplete) */}
                  <div>
                    <CityAutocomplete
                      label="Target Destination / Tehsil Hub:"
                      icon="place"
                      placeholder="e.g. Bahawalpur, Hasilpur, Fort Abbas, Hunza, Skardu, Swat, Gwadar..."
                      value={destination}
                      onChange={(val, loc) => {
                        setDestination(val);
                        if (loc) {
                          setDestinationLocation(loc);
                        } else {
                          const found = findPakistanLocation(val);
                          if (found) setDestinationLocation(found);
                        }
                      }}
                      filterTouristHubsOnly={false}
                    />

                    {/* Surprise Me & Trending Chips */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
                      <button
                        onClick={handleSurpriseMe}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 rounded-xl bg-gradient-to-r from-secondary/15 via-secondary-container/40 to-tertiary-container/50 hover:from-secondary/25 text-on-surface border border-secondary/30 font-semibold text-xs transition-all shadow-xs group/btn cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm text-secondary group-hover/btn:rotate-12 transition-transform">
                          auto_awesome
                        </span>
                        <span>
                          Surprise Me{" "}
                          <span className="font-normal text-on-surface-variant hidden sm:inline">
                            (Curated Valleys)
                          </span>
                        </span>
                      </button>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] text-on-surface-variant hidden sm:inline">
                          Trending:
                        </span>
                        {["Bahawalpur", "Hasilpur", "Hunza", "Skardu", "Swat", "Gwadar", "Lahore"].map(
                          (chip) => (
                            <button
                              key={chip}
                              onClick={() => handlePopularChip(chip)}
                              className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded-lg text-xs text-on-surface font-medium border border-outline-variant transition-colors cursor-pointer"
                              type="button"
                            >
                              {chip}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* STEP 02: Temporal Window & Departure Start Date */}
              <section className="p-6 sm:p-7 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-luxury relative z-20">
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
                    {climateMetrics.seasonTag}
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
                      <span>Min: 1 Day</span>
                      <span>Max: 21 Days</span>
                    </div>
                  </div>

                  {/* Date Range, Picker & Dynamic Telemetry (7 cols) */}
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
                        <span className="text-xs text-on-surface-variant block truncate">
                          Route Vector: ~{routeMetrics.drivingDistanceKm} km ({routeMetrics.drivingTimeFormatted})
                        </span>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[11px]">
                      <span className="text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-secondary">
                          thermostat
                        </span>{" "}
                        {climateMetrics.tempFormatted}
                      </span>
                      <span className="text-secondary font-mono font-semibold">
                        {routeMetrics.roadPassabilityPercent}% Road Passability
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* STEP 03: Precision Budget Architecture */}
              <section className="p-6 sm:p-7 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-luxury relative z-10">
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
                        Includes transport + accommodation allocation
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
                      min="15000"
                      step="5000"
                      type="range"
                      value={budget}
                      onChange={(e) => setBudget(parseInt(e.target.value, 10))}
                    />
                    <div className="flex justify-between text-[11px] font-mono text-on-surface-variant mt-1.5">
                      <span>Rs. 15k (Backpacker)</span>
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
                      <div className="h-full bg-teal-600 transition-all duration-300" style={{ width: "30%" }} title="Transit & Transport: 30%" />
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
                          <span className="w-2 h-2 rounded-full bg-teal-600" /> Transit (30%)
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

              {/* STEP 04: Taste & Experience Matrix (Dynamically generated per destination geography) */}
              <section className="p-6 sm:p-7 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-luxury relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center font-mono text-xs font-bold text-secondary">
                      04
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display font-bold text-base sm:text-lg text-on-surface">
                          Taste & Experience Matrix
                        </h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-secondary/10 text-secondary uppercase tracking-wider">
                          {destinationMatrix.categoryBadge}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {destinationMatrix.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-secondary font-mono font-semibold px-2.5 py-1 rounded-lg bg-secondary-container/50 shrink-0">
                    {selectedInterests.length} Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {destinationMatrix.options.map((opt) => {
                    const isSelected = selectedInterests.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleInterest(opt.id)}
                        className={`p-3 rounded-xl font-semibold text-xs flex items-center justify-between gap-2 transition-all cursor-pointer text-left ${
                          isSelected
                            ? "bg-secondary text-on-primary shadow-xs border border-secondary font-bold"
                            : "bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant"
                        }`}
                        type="button"
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected ? (
                          <span className="material-symbols-outlined text-sm shrink-0">
                            check_circle
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-outline-variant shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* STEP 05: Travel Dynamics & Cohort */}
              <section className="p-6 sm:p-7 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-luxury relative z-10">
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
                    { id: "solo", title: "Solo Pioneer", desc: "Nimble, photography & pacing", icon: "hiking" },
                    { id: "couple", title: "Duo / Couples", desc: "Scenic chalets, sunsets & dining", icon: "favorite" },
                    { id: "family", title: "Family Circle", desc: "Comfortable hotels & gentle walks", icon: "family_restroom" },
                    { id: "crew", title: "Expedition Crew", desc: "High-energy trails & cross-country", icon: "groups_3" },
                  ].map((st) => {
                    const isActive = travelStyle === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => setTravelStyle(st.id as any)}
                        className={`p-3.5 sm:p-4 rounded-xl border text-left flex flex-col justify-between min-h-[8.5rem] transition-all cursor-pointer group ${
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
              <section className="p-6 sm:p-7 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-luxury relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center font-mono text-xs font-bold text-secondary">
                      06
                    </span>
                    <div>
                      <h2 className="font-display font-bold text-base sm:text-lg text-on-surface">
                        Transportation &amp; Travel Style
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        Ground vehicle class, hospitality standard, and daily pacing
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-secondary font-medium">
                    Verified Routes
                  </span>
                </div>

                <div className="space-y-5">
                  {/* Transit Vector Class */}
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-medium mb-2">
                      Mode of Travel
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {/* Car / 4x4 */}
                      <button
                        onClick={() => setTransitMode("car")}
                        className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 cursor-pointer transition-all ${
                          transitMode === "car"
                            ? "bg-surface-container-low border-2 border-secondary shadow-xs"
                            : "bg-surface-container-low border-outline-variant hover:bg-surface-container"
                        }`}
                        type="button"
                      >
                        <span
                          className={`material-symbols-outlined text-xl ${
                            transitMode === "car" ? "text-secondary" : "text-on-surface-variant"
                          }`}
                        >
                          directions_car
                        </span>
                        <span className="font-display font-bold text-xs text-on-surface">
                          {destinationLocation && destinationLocation.elevation_m > 1800
                            ? "Private 4x4 Prado"
                            : routeMetrics.drivingDistanceKm < 80
                            ? "Private Car / Taxi"
                            : "Private Sedan / SUV"}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                          {routeMetrics.drivingTimeFormatted} road drive
                        </span>
                      </button>

                      {/* Flight (Dynamically enabled/disabled) */}
                      {routeMetrics.canFlyCommercial ? (
                        <button
                          onClick={() => setTransitMode("flight")}
                          className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 cursor-pointer transition-all ${
                            transitMode === "flight"
                              ? "bg-surface-container-low border-2 border-secondary shadow-xs"
                              : "bg-surface-container-low border-outline-variant hover:bg-surface-container"
                          }`}
                          type="button"
                        >
                          <span
                            className={`material-symbols-outlined text-xl ${
                              transitMode === "flight" ? "text-secondary" : "text-on-surface-variant"
                            }`}
                          >
                            flight
                          </span>
                          <span className="font-display font-bold text-xs text-on-surface">
                            Flight + Staged 4x4
                          </span>
                          <span className="text-[10px] text-emerald-700 font-medium">
                            {routeMetrics.flightRouteNote || "Direct Air Connect"}
                          </span>
                        </button>
                      ) : (
                        <div
                          className="p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low/50 text-left flex flex-col items-start gap-1 opacity-60 cursor-not-allowed"
                          title="Commercial flight not applicable for short distance or non-airport locations"
                        >
                          <span className="material-symbols-outlined text-xl text-on-surface-variant">
                            flight_takeoff
                          </span>
                          <span className="font-display font-bold text-xs text-on-surface-variant">
                            Flight (N/A)
                          </span>
                          <span className="text-[10px] text-on-surface-variant">
                            {routeMetrics.drivingDistanceKm < 350 ? "< 350 km overland" : "No commercial airport"}
                          </span>
                        </div>
                      )}

                      {/* Bus / Coach */}
                      <button
                        onClick={() => setTransitMode("bus")}
                        className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 cursor-pointer transition-all ${
                          transitMode === "bus"
                            ? "bg-surface-container-low border-2 border-secondary shadow-xs"
                            : "bg-surface-container-low border-outline-variant hover:bg-surface-container"
                        }`}
                        type="button"
                      >
                        <span
                          className={`material-symbols-outlined text-xl ${
                            transitMode === "bus" ? "text-secondary" : "text-on-surface-variant"
                          }`}
                        >
                          directions_bus
                        </span>
                        <span className="font-display font-bold text-xs text-on-surface">
                          Executive Coach
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                          Expressway & bus lines
                        </span>
                      </button>

                      {/* Hybrid / Train */}
                      <button
                        onClick={() => setTransitMode("hybrid")}
                        className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 cursor-pointer transition-all ${
                          transitMode === "hybrid"
                            ? "bg-surface-container-low border-2 border-secondary shadow-xs"
                            : "bg-surface-container-low border-outline-variant hover:bg-surface-container"
                        }`}
                        type="button"
                      >
                        <span
                          className={`material-symbols-outlined text-xl ${
                            transitMode === "hybrid" ? "text-secondary" : "text-on-surface-variant"
                          }`}
                        >
                          sync_alt
                        </span>
                        <span className="font-display font-bold text-xs text-on-surface">
                          Hybrid / Staged
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                          Flexible multimodal
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Vehicle Archetype & Fuel Logistics Engine */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                        Vehicle Rig & Fuel Consumption
                      </label>
                      <span className="font-mono text-[11px] text-secondary font-semibold">
                        ~PKR {fuelLogistics.estimatedFuelCostPkr.toLocaleString()} Est. Fuel
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                      {[
                        {
                          id: "sedan",
                          title: "Sedan / Saloon",
                          spec: "14 km/L · Motorways & Plains",
                          icon: "directions_car",
                        },
                        {
                          id: "crossover",
                          title: "Crossover / Compact SUV",
                          spec: "10 km/L · Valleys & Hill Stations",
                          icon: "minor_crash",
                        },
                        {
                          id: "suv_4x4",
                          title: "Heavy 4x4 Overlander",
                          spec: "7 km/L · Passes, Deosai & Dunes",
                          icon: "terrain",
                        },
                      ].map((vh) => (
                        <button
                          key={vh.id}
                          onClick={() => setVehicleClass(vh.id as any)}
                          className={`p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                            vehicleClass === vh.id
                              ? "bg-surface-container-low border-2 border-secondary shadow-xs"
                              : "bg-surface-container-low border-outline-variant hover:bg-surface-container"
                          }`}
                          type="button"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`material-symbols-outlined text-lg ${
                                vehicleClass === vh.id ? "text-secondary" : "text-on-surface-variant"
                              }`}
                            >
                              {vh.icon}
                            </span>
                            {vehicleClass === vh.id && (
                              <span className="w-2 h-2 rounded-full bg-secondary" />
                            )}
                          </div>
                          <span className="font-display font-bold text-xs text-on-surface">
                            {vh.title}
                          </span>
                          <span className="text-[10px] text-on-surface-variant">{vh.spec}</span>
                        </button>
                      ))}
                    </div>

                    {/* Fuel Consumption Readout Box */}
                    <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant text-xs space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-on-surface-variant flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-secondary">local_gas_station</span>
                          {fuelLogistics.litersRequired} Litres required for ~{fuelLogistics.roundTripDistanceKm} km round expedition
                        </span>
                        <span className="font-mono font-bold text-on-surface text-[11px]">
                          Rs. {fuelLogistics.estimatedFuelCostPkr.toLocaleString()} ({currency === "USD" ? `$${Math.round(fuelLogistics.estimatedFuelCostPkr / usdRate)}` : `PKR @ Rs. ${fuelLogistics.pricePerLiter}/L`})
                        </span>
                      </div>
                      {fuelLogistics.isMountain && (
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 text-[11px] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-amber-700 shrink-0">warning</span>
                          <span>High-altitude mountain terrain applies a 20% fuel efficiency gradient penalty. Daylight driving recommended.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lodging Architecture */}
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-medium mb-2">
                      Lodging Architecture
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: "glamping", title: "Heritage Glamping & Resorts", desc: "Serena, Luxus & luxury chalets", icon: "chalet" },
                        { id: "midrange", title: "Boutique Scenic Mid-Range", desc: "Panoramic verified hotels", icon: "hotel" },
                        { id: "homestay", title: "Curated Homestays", desc: "Authentic local village hosts", icon: "cottage" },
                      ].map((ld) => (
                        <button
                          key={ld.id}
                          onClick={() => setLodgingStyle(ld.id as any)}
                          className={`p-3 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
                            lodgingStyle === ld.id
                              ? "bg-surface-container-low border-2 border-secondary shadow-xs"
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
                        { id: "relaxed", label: "Relaxed (Gentle Pacing)" },
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
                  className="relative w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl bg-gradient-to-r from-[#151515] via-[#1a2d27] to-[#186a57] hover:to-[#135546] text-white transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-glow-emerald cursor-pointer group hover:shadow-xl hover:scale-[1.008] active:scale-[0.995] disabled:opacity-80"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg group-hover:rotate-12 transition-transform shrink-0">
                      <span className="material-symbols-outlined text-xl">auto_awesome</span>
                    </span>
                    <div className="text-left min-w-0">
                      <span className="font-display text-sm sm:text-lg font-bold tracking-tight block truncate">
                        {isGenerating
                          ? `Synthesizing Custom Travel Itinerary...`
                          : "Generate Custom Itinerary"}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-emerald-200/80 font-mono block">
                        Optimized Driving Times &amp; Curated Stops
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-white/10">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-black/30 border border-white/10 font-mono text-[11px] sm:text-xs text-white/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Ready in seconds
                    </span>
                    <span className="material-symbols-outlined text-xl group-hover:translate-x-1.5 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </button>

                {/* Trust Signals */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-on-surface-variant font-mono text-[11px]">
                  <span className="flex items-center gap-1 text-secondary">
                    <span className="material-symbols-outlined text-xs">verified</span> Verified Route Feasibility
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-secondary">satellite_alt</span> Live Weather &amp; Road Telemetry
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-secondary">lock</span> Flexible Itinerary Customization
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
                    {isLoadingPlaces ? "SYNCING..." : "SYNC ACTIVE"}
                  </span>
                </div>

                {/* Cinematic Visual Banner */}
                <div className="relative rounded-xl overflow-hidden shadow-xs mb-4 group">
                  <img
                    alt={destinationLocation?.name || destination}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-700"
                    src={heroImage}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-between p-3.5 text-white">
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-1 rounded-md bg-black/40 backdrop-blur-md border border-white/20 font-mono text-[10px] tracking-wider uppercase text-emerald-300 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Geocoded Vector Hub
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-[10px] font-mono">
                        {routeMetrics.transitDifficulty.toUpperCase()} ROUTE
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 block font-medium">
                            Destination Focal Point
                          </span>
                          <h3 className="font-display text-lg font-bold tracking-tight text-white leading-tight">
                            {destinationLocation?.name || destination}
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-white block">
                            Elev. {destinationLocation ? `${destinationLocation.elevation_m}m` : "N/A"}
                          </span>
                          <span className="text-[10px] text-white/80">
                            {destinationLocation ? `${destinationLocation.province}` : "Pakistan"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Route Fit & Telemetry Widgets */}
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
                        Seasonal Forecast
                      </span>
                      <span className="material-symbols-outlined text-amber-600 text-base">
                        sunny
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                          {climateMetrics.tempHighC}°C
                        </span>
                        <span className="text-xs text-on-surface-variant font-medium">
                          / {climateMetrics.tempLowC}°C night
                        </span>
                      </div>
                      <span className="text-[10px] text-secondary font-medium block truncate">
                        {climateMetrics.condition}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Road & Transit Vector Box */}
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant mb-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono font-semibold">
                    <span className="text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-secondary">
                        alt_route
                      </span>{" "}
                      Geospatial Transit Corridor
                    </span>
                    <span className="text-secondary">{routeMetrics.drivingTimeFormatted}</span>
                  </div>
                  <div className="text-xs font-semibold text-on-surface truncate">
                    {routeMetrics.corridorName}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/50">
                    <span>Driving Distance: ~{routeMetrics.drivingDistanceKm} km</span>
                    <span className="font-mono text-secondary font-semibold">
                      {routeMetrics.roadPassabilityPercent}% Passability
                    </span>
                  </div>
                </div>

                {/* Fuel & Expedition Logistics Summary */}
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant mb-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono font-semibold">
                    <span className="text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-secondary">local_gas_station</span>
                      Vehicle & Fuel Allocation
                    </span>
                    <span className="text-secondary font-bold">Rs. {fuelLogistics.estimatedFuelCostPkr.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-on-surface font-semibold truncate">
                    {fuelLogistics.vehicleName}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/50">
                    <span>~{fuelLogistics.litersRequired}L @ {fuelLogistics.kmPerLiter} km/L</span>
                    <span className="font-mono text-emerald-800 font-semibold">
                      {fuelLogistics.roundTripDistanceKm} km round trip
                    </span>
                  </div>
                </div>

                {/* Dynamic Constraint Validator Checklist */}
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant mb-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono font-semibold">
                    <span className="text-on-surface flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-secondary">
                        fact_check
                      </span>{" "}
                      Constraint Solver Validation
                    </span>
                    <span
                      className={
                        solverMetrics.allPassed
                          ? "text-secondary font-bold"
                          : "text-amber-700 font-bold"
                      }
                    >
                      {solverMetrics.allPassed
                        ? "ALL PASSED"
                        : `${solverMetrics.issuesCount} ADVISOR${
                            solverMetrics.issuesCount > 1 ? "IES" : "Y"
                          }`}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10px] font-mono">
                    <div
                      className={`p-1.5 rounded border flex items-center gap-1 font-semibold ${solverMetrics.budgetColor}`}
                    >
                      <span
                        className={`material-symbols-outlined text-xs ${solverMetrics.budgetIconColor}`}
                      >
                        {solverMetrics.budgetIcon}
                      </span>
                      <span>Budget: {solverMetrics.budgetStatus}</span>
                    </div>
                    <div
                      className={`p-1.5 rounded border flex items-center gap-1 font-semibold ${solverMetrics.roadColor}`}
                    >
                      <span
                        className={`material-symbols-outlined text-xs ${solverMetrics.roadIconColor}`}
                      >
                        {solverMetrics.roadIcon}
                      </span>
                      <span>Road: {solverMetrics.roadStatus}</span>
                    </div>
                    <div
                      className={`p-1.5 rounded border flex items-center gap-1 font-semibold ${solverMetrics.pacingColor}`}
                    >
                      <span
                        className={`material-symbols-outlined text-xs ${solverMetrics.pacingIconColor}`}
                      >
                        {solverMetrics.pacingIcon}
                      </span>
                      <span>Pacing: {solverMetrics.pacingStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Day-by-Day Dynamic Micro-Timeline Pipeline */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                      Synthesized Waypoint Pipeline
                    </span>
                    <span className="text-[11px] text-secondary font-mono font-semibold">
                      {synthesizedWaypoints.length} Vectors
                    </span>
                  </div>
                  <div className="relative pl-5 space-y-3.5 before:content-[''] before:absolute before:top-2.5 before:bottom-2.5 before:left-1.5 before:w-0.5 before:bg-outline-variant">
                    {synthesizedWaypoints.map((wp, idx) => (
                      <div key={idx} className="relative group">
                        <span className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-secondary ring-4 ring-surface-container-lowest" />
                        <div className="flex items-baseline justify-between">
                          <span className="font-display font-bold text-xs text-on-surface">
                            {wp.title}
                          </span>
                          <span className="font-mono text-[10px] text-secondary font-semibold shrink-0 ml-2">
                            {wp.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                          {wp.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Topographic Map Preview */}
                <div className="rounded-xl overflow-hidden border border-outline-variant relative group">
                  <div
                    className="w-full h-32 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: `url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1000&auto=format&fit=crop')`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                  <div className="absolute bottom-2 left-2 right-2 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 flex items-center justify-between text-on-surface">
                    <span className="font-mono text-[11px] font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary" /> {daysCount} Days Itinerary Active
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
                    Based on your route to <strong className="text-on-surface">{destinationLocation?.name || destination}</strong> and selected focus on{" "}
                    <strong className="text-on-surface">
                      {activeInterestLabels.length > 0
                        ? activeInterestLabels.join(" & ")
                        : "regional highlights"}
                    </strong>
                    , the optimizer calibrated the itinerary via <strong className="text-on-surface">{routeMetrics.corridorName}</strong> ({routeMetrics.drivingTimeFormatted}) with optimal seasonal conditions for {climateMetrics.seasonTag}.
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
              {[
                "Bahawalpur & Cholistan, Punjab",
                "Hasilpur, Punjab",
                "Hunza Valley & Gojal, Gilgit-Baltistan",
                "Skardu & Deosai Plains, Gilgit-Baltistan",
                "Swat & Kalam Emerald Valleys, KPK",
                "Lahore Walled City & Forts, Punjab",
                "Gwadar & Makran Coastal Highway, Balochistan",
              ].map((dest) => (
                <button
                  key={dest}
                  onClick={() => {
                    setDestination(dest);
                    const loc = findPakistanLocation(dest);
                    if (loc) setDestinationLocation(loc);
                    setSearchOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-xl hover:bg-surface-container-low transition-colors flex items-center justify-between text-on-surface cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-semibold">{dest}</span>
                  <span className="text-xs text-secondary font-bold flex items-center gap-1">
                    <span>Select</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </span>
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
