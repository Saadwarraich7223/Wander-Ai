"use client";

import { useEffect, useState, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { placesApi, aiApi, interactionsApi, tripsApi, getErrorMessage } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { City, Category, PlaceSummary, Trip } from "@/types";
import Navbar from "@/components/Navbar";

interface POI {
  id: string;
  name: string;
  category: "heritage" | "dining" | "photopoint";
  match: string;
  tagline: string;
  hours: string;
  price: string;
  guide: string;
  rating: number;
  reviews: number;
  image: string;
  x: number; // SVG map X %
  y: number; // SVG map Y %
  waypointNum?: number;
  desc: string;
  lat?: number;
  lng?: number;
}

interface RegionData {
  id: string;
  name: string;
  corridor: string;
  coordinates: string;
  goldenHour: string;
  azimuth: string;
  walkVector: string;
  walkTime: string;
  crowdLevel: string;
  pacingIndex: string;
  pois: POI[];
}

const MAJOR_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  multan: { lat: 30.1575, lng: 71.5249 },
  islamabad: { lat: 33.6844, lng: 73.0479 },
  rawalpindi: { lat: 33.5973, lng: 73.0479 },
  lahore: { lat: 31.5204, lng: 74.3587 },
  karachi: { lat: 24.8607, lng: 67.0011 },
  peshawar: { lat: 34.0151, lng: 71.5249 },
  faisalabad: { lat: 31.4504, lng: 73.1350 },
  quetta: { lat: 30.1798, lng: 66.9750 },
  sialkot: { lat: 32.4945, lng: 74.5229 },
  gilgit: { lat: 35.9208, lng: 74.3089 },
  skardu: { lat: 35.2971, lng: 75.6333 },
  swat: { lat: 34.7717, lng: 72.3602 },
  mingora: { lat: 34.7717, lng: 72.3602 },
  chitral: { lat: 35.8510, lng: 71.7869 },
  gwadar: { lat: 25.1264, lng: 62.3225 },
};

function resolveCityCoordinates(cityName?: string | null, backendCities: City[] = []): { lat: number; lng: number } | null {
  if (!cityName) return null;
  const lower = cityName.toLowerCase();

  const matched = backendCities.find((c) => lower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lower));
  if (matched && typeof matched.latitude === "number" && typeof matched.longitude === "number") {
    return { lat: matched.latitude, lng: matched.longitude };
  }

  for (const [key, coords] of Object.entries(MAJOR_CITY_COORDS)) {
    if (lower.includes(key)) {
      return coords;
    }
  }

  return null;
}

const DEFAULT_REGIONS: Record<string, RegionData> = {
  lahore: {
    id: "lahore",
    name: "Lahore Walled City",
    corridor: "Walled City Corridor",
    coordinates: 'N 31°35\'25" · E 74°18\'35"',
    goldenHour: "18:14 PKT",
    azimuth: "248° Azimuth",
    walkVector: "4.2 km",
    walkTime: "~52 min",
    crowdLevel: "Low · 28%",
    pacingIndex: "9.8 / 10",
    pois: [
      {
        id: "badshahi",
        name: "Badshahi Mosque Quadrangle",
        category: "heritage",
        match: "99% Apex Match",
        tagline: "17th Century Imperial Red Sandstone Architecture",
        hours: "Open til 21:00 PKT",
        price: "Free Entry",
        guide: "Audio Guide Available",
        rating: 4.9,
        reviews: 3820,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbRpot7Pvj2InUaRCQli5KpEUk1WbCICuRmZJVQCJo9KMJoxxg71-sWsm1p3ghiexQioGPfg_ItQVgRFii351I6wGDIpBy8RdnpNnYcvez7mDEIE7kBZEOy-eGM-6WE8NRxXQzOW2umKD540rFOIs2aqhHVUTydrlZTHaINyTL90aOnJHoL1yTkhNdBuOyMKCqWr0rW7l78ifNcZEJ07gG4mI03p57H6e1P-BcjOaipdX5lZtsFw947Q",
        x: 46,
        y: 42,
        waypointNum: 4,
        desc: "Grand terracotta courtyard accommodates 100,000 worshippers. Renowned for marble minarets, pietra dura floral inlay, and sunset panorama over Fort Road.",
        lat: 31.5882,
        lng: 74.3094,
      },
      {
        id: "haveli",
        name: "Haveli Restaurant",
        category: "dining",
        match: "98% Match",
        tagline: "Rooftop Dining overlooking Fort Road Heritage",
        hours: "Open til 01:00 AM",
        price: "PKR 2,400 / ~$8.50",
        guide: "280m walk",
        rating: 4.8,
        reviews: 1400,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB7b7qqErjD_RRs7SdRSRi0YRnfqXTSt7LBlgxBeJshGn7aaERQwnasGWXPAyNZUnQ3iBqY3i0dI2VgJX6q2deNMeBaiLM9sAlixHvPJBEczx2fN57h1TzLgnIPoX4wxQoEVwIN2MhHD3qzKeveXN2AHuH9NaNd5pHLUPUBG8P1dwSOdgTUA0alZCA3DfsPu7U_idfcSQCeD_CL_hD8R7IZ6SOGOiS_Ijx_PEINyzL9l6I13nWOQHwF4Q",
        x: 52,
        y: 48,
        waypointNum: 3,
        desc: "High-elevation rooftop restaurant with panoramic views of illuminated Mughal minarets and authentic Lahori barbecue cuisine.",
        lat: 31.5886,
        lng: 74.3121,
      },
      {
        id: "sheesh_mahal",
        name: "Lahore Fort: Sheesh Mahal",
        category: "heritage",
        match: "97% Match",
        tagline: "UNESCO World Heritage · Palace of Mirrors",
        hours: "Open til 19:30 PKT",
        price: "PKR 1,000 / $3.50",
        guide: "Audio in 4 langs",
        rating: 4.8,
        reviews: 2410,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvZBrlqdFOxh97oMs6KN3mAdEIjC6fWVtlU_GVS1YhIbOfN2SZMb0hCPvKzBLhsC9u4Fc708Bh9Wa8xDowualNH7KBBY3SFAQ_rvArQxYe16INSbreRpO0GvukMvL4wLU1pMVkqRvd8GRwlL5bDUHgg5uCeKSYvxst5kpmrlbzB8Qdbhxj2Aq0a8UgYN0KRyRN2d9Xpl-x59INYC3X36hnmEhmKFkaTZ-VebeutdkYgu9f-K1zmGOY-A",
        x: 32,
        y: 35,
        waypointNum: 2,
        desc: "Built by Emperor Shah Jahan in 1631. Crafted with intricate convex glass mirrors, micro-frescoes, and imperial marble piers.",
        lat: 31.5898,
        lng: 74.3148,
      },
      {
        id: "coocos",
        name: "Cooco's Den & Art Gallery",
        category: "photopoint",
        match: "94% Match",
        tagline: "Bohemian Heritage Dining & Artifact Museum",
        hours: "Open til 23:30 PKT",
        price: "PKR 1,800 / ~$6.50",
        guide: "340m walk",
        rating: 4.7,
        reviews: 980,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDNBz3IOWsTLEqp03EkT0TD3un7GKTumEQlzqBM5Dl3WwU5h00IhJO9SZYsGr8oM_BWDDR1kLjNVcqGFIyqhLv-DvPlRPWe1lOkKhlctlA_7aIKQrkpiGZOQiWheMMMe2Eu140iwFt6v_gJ2oQR0T9JR-_hfFjU1RTpBXwSR5oEyiR0qtTkqCBkCP_tGjsehbZcggpxv1Rrc0JxR_JcwoozuVGCnEp_ARvQ6jTUk4EfxVZD35iWwavZxA",
        x: 62,
        y: 44,
        waypointNum: 5,
        desc: "Iconic artistic multi-story haveli filled with brass antiques, Mughal paintings, and romantic candlelit courtyard dining.",
        lat: 31.588,
        lng: 74.3125,
      },
      {
        id: "shahi_baithak",
        name: "Shahi Baithak (Delhi Gate)",
        category: "dining",
        match: "91% Match",
        tagline: "Royal Kashmiri Chai & Traditional Dastarkhwan",
        hours: "Open til 22:00 PKT",
        price: "PKR 850 / ~$3.00",
        guide: "Delhi Gate Portal",
        rating: 4.6,
        reviews: 420,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC07pUhGOVvlofwT0s2LJ05eHboA-OIk2jrHBrfbCvUBOme59n2tqgvLNrnnZyQcW_xrqIaV-aFz6unppDDsIymr_UIZyd1DEg4QMiFB80ac7PjbyW-s2tNmIGbqiSi-8cKjJi4pe-q_bnLv2YflCU2R14s9m79blz8Fi5SnzPiAvL_pzqE1nXf3oqzXlgB_GXrwfDrRbTthA2ggXLCw72B4LBZSZCIku2jifFxcL068xLm7prEV9Rdlg",
        x: 76,
        y: 60,
        waypointNum: 1,
        desc: "Historical royal parlor restored by Walled City Authority. Serving aromatic pink tea, walnut cookies, and classical sitar music.",
        lat: 31.582,
        lng: 74.321,
      },
    ],
  },
  hunza: {
    id: "hunza",
    name: "Hunza Valley",
    corridor: "Karakoram Highway Corridor",
    coordinates: 'N 36°19\'00" · E 74°39\'00"',
    goldenHour: "17:48 PKT",
    azimuth: "235° Azimuth",
    walkVector: "8.5 km",
    walkTime: "~2h 10m",
    crowdLevel: "Low · 15%",
    pacingIndex: "9.5 / 10",
    pois: [
      {
        id: "baltit",
        name: "Baltit Fort & Karimabad Terraces",
        category: "heritage",
        match: "99% Peak Match",
        tagline: "700-year-old Tibetan-influenced Royal Citadel",
        hours: "Open til 18:00 PKT",
        price: "PKR 1,200",
        guide: "UNESCO Heritage",
        rating: 4.9,
        reviews: 2150,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6kGwiJoU2OhGsixgvXfGqlWy-DjQMgj2XX2ffdT2P07Yhjv5ztVuPHdm1PlDs9v7MbfUgG34ClS3JGefPsjBpB0-6U90MvIG7bnfTigynCfQWEHfPSVt1HBi_PfQnPcP16z8c14rH-w0DjLr7EGZjp2DwylowOQM71ggT3qAf_MrhpGK-wu3O9fjATMToRu5p1EKzNH73RUDSzSb_mniq7Y9AJcP2Uq9PkV7q_dkNZa4ylIKsxpXLfw",
        x: 40,
        y: 35,
        waypointNum: 1,
        desc: "Perched high above Karimabad with stunning 360-degree vistas of Rakaposhi peak, Ultra Sar, and ancient apricot orchards.",
        lat: 36.3262,
        lng: 74.6706,
      },
      {
        id: "passu",
        name: "Passu Cathedral Cones & Hussaini Bridge",
        category: "photopoint",
        match: "98% Match",
        tagline: "Jagged Alpine Needles & Glacial Torrent",
        hours: "Sunrise – Sunset",
        price: "Free Access",
        guide: "High Altitude",
        rating: 4.9,
        reviews: 3120,
        image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1000&auto=format&fit=crop",
        x: 65,
        y: 45,
        waypointNum: 2,
        desc: "Dramatic sunlit spires rising to 6,106m over the Hunza River, world famous among landscape photographers.",
        lat: 36.4717,
        lng: 74.887,
      },
    ],
  },
  skardu: {
    id: "skardu",
    name: "Skardu & Deosai",
    corridor: "Baltistan Glacial Circuit",
    coordinates: 'N 35°17\'00" · E 75°38\'00"',
    goldenHour: "17:35 PKT",
    azimuth: "240° Azimuth",
    walkVector: "12.0 km",
    walkTime: "Jeep 4x4 Vector",
    crowdLevel: "Minimal · 10%",
    pacingIndex: "9.7 / 10",
    pois: [
      {
        id: "deosai",
        name: "Deosai Plateau & Sheosar Lake",
        category: "photopoint",
        match: "99% High Alpine",
        tagline: "World's 2nd Highest Alpine Plateau (4,114m)",
        hours: "Daylight Hours",
        price: "Park Pass Included",
        guide: "Himalayan Bear Zone",
        rating: 5.0,
        reviews: 1890,
        image: "https://images.unsplash.com/photo-1627894098906-74045f29910d?q=80&w=1200&auto=format&fit=crop",
        x: 50,
        y: 40,
        waypointNum: 1,
        desc: "Expansive wildflowers, pristine turquoise lake reflections, and snowcapped Nanga Parbat backdrop.",
        lat: 35.0531,
        lng: 75.385,
      },
    ],
  },
  swat: {
    id: "swat",
    name: "Swat Valley",
    corridor: "Emerald Alpine Vector",
    coordinates: 'N 35°13\'00" · E 72°33\'00"',
    goldenHour: "18:02 PKT",
    azimuth: "244° Azimuth",
    walkVector: "5.6 km",
    walkTime: "~1h 10m",
    crowdLevel: "Moderate · 35%",
    pacingIndex: "9.2 / 10",
    pois: [
      {
        id: "kalam",
        name: "Kalam Valley & Ushu Forest",
        category: "photopoint",
        match: "96% Match",
        tagline: "Dense Pine Canopy & Crystal Glacier Streams",
        hours: "24 Hours",
        price: "Free Access",
        guide: "Freshwater Trout Trail",
        rating: 4.8,
        reviews: 1650,
        image: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?q=80&w=1200&auto=format&fit=crop",
        x: 45,
        y: 42,
        waypointNum: 1,
        desc: "Towering cedar forests, roaring Swat river rapids, and high-altitude trout farm dining.",
        lat: 35.4801,
        lng: 72.5833,
      },
    ],
  },
  islamabad: {
    id: "islamabad",
    name: "Islamabad",
    corridor: "Margalla Ridge Vector",
    coordinates: 'N 33°43\'00" · E 73°04\'00"',
    goldenHour: "18:10 PKT",
    azimuth: "246° Azimuth",
    walkVector: "3.8 km",
    walkTime: "~45 min",
    crowdLevel: "Low · 22%",
    pacingIndex: "9.9 / 10",
    pois: [
      {
        id: "faisal",
        name: "Faisal Mosque & Margalla Overlook",
        category: "heritage",
        match: "98% Apex Match",
        tagline: "Contemporary Turkish Bedouin Marble Sanctuary",
        hours: "Open til 22:00 PKT",
        price: "Free Entry",
        guide: "National Monument",
        rating: 4.9,
        reviews: 4500,
        image: "https://images.unsplash.com/photo-1589802829985-817e51171b92?q=80&w=1200&auto=format&fit=crop",
        x: 48,
        y: 38,
        waypointNum: 1,
        desc: "Nestled against lush Margalla Hills, glowing Turkish marble minarets and vast sunset plaza.",
        lat: 33.7297,
        lng: 73.0372,
      },
    ],
  },
};

function SmartMapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Backend Data State
  const [backendCities, setBackendCities] = useState<City[]>([]);
  const [backendCategories, setBackendCategories] = useState<Category[]>([]);
  const [backendPlaces, setBackendPlaces] = useState<PlaceSummary[]>([]);
  const [savedPlaceIds, setSavedPlaceIds] = useState<Record<string, boolean>>({});

  // Active View State
  const [selectedRegionId, setSelectedRegionId] = useState<string>("lahore");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currency, setCurrency] = useState<"PKR" | "USD">("PKR");
  const [activeLayer, setActiveLayer] = useState<"topo" | "golden" | "crowd" | "road">("topo");
  const [routeWaypoints, setRouteWaypoints] = useState<string[]>(["shahi_baithak", "sheesh_mahal", "haveli", "badshahi"]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>("badshahi");
  const [guidedWalkActive, setGuidedWalkActive] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const polylineRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // AI & Trip Creation State
  const [userQueryInput, setUserQueryInput] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);

  // ── Trip Mode (from /explore?trip_id=xxx) ──────────────────────────
  const [activeTripData, setActiveTripData] = useState<Trip | null>(null);
  const [tripModeLoading, setTripModeLoading] = useState(false);
  const tripId = searchParams.get("trip_id");

  // Load Metadata on Mount
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [citiesRes, catRes] = await Promise.allSettled([
          placesApi.getCities(),
          placesApi.getCategories(),
        ]);
        if (citiesRes.status === "fulfilled" && Array.isArray(citiesRes.value)) {
          setBackendCities(citiesRes.value);
        }
        if (catRes.status === "fulfilled" && Array.isArray(catRes.value)) {
          setBackendCategories(catRes.value);
        }

        const user = authStorage.getUser();
        if (user) {
          try {
            const myInteractions = await interactionsApi.getMyInteractions();
            if (Array.isArray(myInteractions)) {
              const savedMap: Record<string, boolean> = {};
              myInteractions.forEach((item: any) => {
                if (item.interaction_type === "save") savedMap[item.place_id] = true;
              });
              setSavedPlaceIds(savedMap);
            }
          } catch (e) {
            // Ignore interaction load failure
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    }
    loadMetadata();
  }, []);

  // Load Trip data if trip_id is in URL
  useEffect(() => {
    if (!tripId) {
      setActiveTripData(null);
      return;
    }
    async function loadTrip() {
      setTripModeLoading(true);
      try {
        const trip: Trip = await tripsApi.getById(tripId as string);
        setActiveTripData(trip);
        // Auto-select and populate waypoints from trip's itinerary in order
        if (trip.active_itinerary?.days) {
          const tripWaypointIds: string[] = ["origin_city_start"];
          trip.active_itinerary.days.forEach((day: any) => {
            day.items.forEach((item: any) => {
              tripWaypointIds.push(item.place.id);
            });
          });
          setRouteWaypoints(tripWaypointIds);
          setSelectedPlaceId("origin_city_start");
        }
      } catch (e) {
        // Trip load failed — continue in normal mode
        setActiveTripData(null);
      } finally {
        setTripModeLoading(false);
      }
    }
    loadTrip();
  }, [tripId]);

  // Fetch Backend Places when City or Search query changes
  useEffect(() => {
    async function fetchPlaces() {
      try {
        const matchedCity = backendCities.find((c) =>
          c.name.toLowerCase().includes(selectedRegionId.toLowerCase())
        );
        const params: Record<string, any> = { limit: 100 };
        if (matchedCity) params.city_id = matchedCity.id;
        if (searchQuery) params.q = searchQuery;

        const res = await placesApi.list(params);
        if (res && res.items && Array.isArray(res.items)) {
          setBackendPlaces(res.items);
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    const timer = setTimeout(fetchPlaces, 300);
    return () => clearTimeout(timer);
  }, [selectedRegionId, searchQuery, backendCities]);

  const baseRegion = DEFAULT_REGIONS[selectedRegionId] || DEFAULT_REGIONS.lahore;
  const tripCity = activeTripData
    ? backendCities.find((c) => c.id === activeTripData.city_id) ?? null
    : null;
  const region: RegionData = tripCity
    ? {
        ...baseRegion,
        name: tripCity.name,
        corridor: `${tripCity.name} Itinerary Corridor`,
        coordinates: `N ${tripCity.latitude.toFixed(4)}° · E ${tripCity.longitude.toFixed(4)}°`,
      }
    : baseRegion;

  // ── Assemble POIs based on mode (Trip Mode vs Explore Mode) ──
  const mergedPois = useMemo<POI[]>(() => {
    const pois: POI[] = [];

    if (activeTripData?.active_itinerary) {
      // TRIP MODE: Build POIs strictly from active trip itinerary
      let globalOrder = 0;

      // Extract origin city from trip context / preferences or title regex
      let rawOrigin: string | null =
        (activeTripData as any).context?.origin_city ||
        (activeTripData as any).preferences?.origin_city ||
        (activeTripData as any).origin_city ||
        null;

      if (!rawOrigin && activeTripData.title) {
        const match = activeTripData.title.match(/\bfrom\s+([A-Za-z\s/]+)/i);
        if (match && match[1]) {
          rawOrigin = match[1].trim();
        }
      }

      if (rawOrigin) {
        const originCoords = resolveCityCoordinates(rawOrigin, backendCities);
        if (originCoords) {
          const originName = rawOrigin.split("(")[0].trim();
          pois.push({
            id: "origin_city_start",
            name: `Start: ${originName}`,
            category: "heritage",
            match: "Trip Departure Vector",
            tagline: `Departure Hub (${originName})`,
            hours: "Starting Point",
            price: "Origin Hub",
            guide: "Expedition Departure",
            rating: 5.0,
            reviews: 1,
            image: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?q=80&w=1000&auto=format&fit=crop",
            x: 0,
            y: 0,
            waypointNum: 0,
            desc: `Departure point of expedition starting from ${originName}. Route vector leads to destination stops.`,
            lat: originCoords.lat,
            lng: originCoords.lng,
          });
        }
      }

      activeTripData.active_itinerary.days.forEach((day) => {
        day.items.forEach((item) => {
          globalOrder++;
          pois.push({
            id: item.place.id,
            name: item.place.name,
            category: item.place.category?.slug?.includes("food") ? "dining" : item.place.category?.slug?.includes("photo") ? "photopoint" : "heritage",
            match: `Day ${day.day_number} · Stop ${item.item_order + 1}`,
            tagline: `${item.start_time || "09:00"}–${item.end_time || "11:00"} · ${item.place.category?.name || "Attraction"}`,
            hours: `${item.start_time || "09:00"} – ${item.end_time || "18:00"}`,
            price: item.estimated_cost ? `PKR ${item.estimated_cost.toLocaleString()}` : (item.place.estimated_cost_min ? `PKR ${item.place.estimated_cost_min.toLocaleString()}` : "Included"),
            guide: `${item.visit_duration_minutes || 60} min visit`,
            rating: Math.min(5, 4.5 + (item.place.popularity_score || 0.8) * 0.5),
            reviews: Math.round((item.place.popularity_score || 0.8) * 200) + 50,
            image: item.place.primary_image?.url || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1000&auto=format&fit=crop",
            x: 50,
            y: 50,
            waypointNum: globalOrder,
            desc: item.notes || `Itinerary stop on Day ${day.day_number} at ${item.start_time}.`,
            lat: item.place.latitude,
            lng: item.place.longitude,
          });
        });
      });
    } else {
      // EXPLORE MODE: If backendPlaces exist for the active city/search, prioritize them
      if (backendPlaces.length > 0) {
        backendPlaces.forEach((bp, idx) => {
          const catSlug = bp.category?.slug?.toLowerCase() || "";
          const catName = bp.category?.name || "Attraction";
          let categoryKey: "heritage" | "dining" | "photopoint" = "heritage";
          if (catSlug.includes("food") || catSlug.includes("din") || catSlug.includes("rest")) {
            categoryKey = "dining";
          } else if (catSlug.includes("photo") || catSlug.includes("nature") || catSlug.includes("scen")) {
            categoryKey = "photopoint";
          }

          pois.push({
            id: bp.id,
            name: bp.name,
            category: categoryKey,
            match: `${Math.min(99, Math.round(85 + (bp.popularity_score || 0.8) * 14))}% Apex Match`,
            tagline: `${catName} · ${bp.indoor_outdoor === "outdoor" ? "Open Air" : "Curated Site"}`,
            hours: "Open Daily",
            price: bp.estimated_cost_min ? `PKR ${bp.estimated_cost_min.toLocaleString()}` : "Free Entry",
            guide: bp.family_suitable ? "Family Friendly" : "Guided Trail",
            rating: Math.min(5.0, Number((4.3 + (bp.popularity_score || 0.8) * 0.7).toFixed(1))),
            reviews: Math.round((bp.popularity_score || 0.8) * 450) + 80,
            image: bp.primary_image?.url || region.pois[0]?.image || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1000&auto=format&fit=crop",
            x: 50,
            y: 50,
            waypointNum: idx + 1,
            desc: bp.description || `Audited destination node in ${region.name} with verified PostGIS spatial coordinate.`,
            lat: bp.latitude,
            lng: bp.longitude,
          });
        });
      } else {
        pois.push(...region.pois);
      }
    }

    return pois;
  }, [activeTripData, selectedRegionId, backendPlaces, backendCities]);


  const filteredPois = useMemo(
    () =>
      mergedPois.filter((poi) => {
        if (poi.id === "origin_city_start" || poi.waypointNum === 0) return true;

        const matchesCategory =
          selectedCategory === "all"
            ? true
            : poi.category === selectedCategory;
        const matchesSearch =
          searchQuery.trim() === ""
            ? true
            : poi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              poi.tagline.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    [mergedPois, searchQuery, selectedCategory]
  );

  const selectedPoi = mergedPois.find((p) => p.id === selectedPlaceId) || mergedPois[0] || region.pois[0];

  // ── Leaflet Map Lifecycle & Rendering ──
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    if (leafletMapRef.current) return;

    import("leaflet").then((L) => {
      if (!mapContainerRef.current || leafletMapRef.current) return;
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([31.5882, 74.3094], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
      setMapReady(true);
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  const boundsSignature = filteredPois
    .filter(
      (p) => typeof p.lat === "number" && typeof p.lng === "number" && !isNaN(p.lat!) && !isNaN(p.lng!)
    )
    .map((p) => `${p.id}:${p.lat},${p.lng}`)
    .join("|");

  // Marker layer — rebuilds only when the filtered set or selection changes
  useEffect(() => {
    if (!leafletMapRef.current || !mapReady) return;
    let disposed = false;

    import("leaflet").then((L) => {
      if (disposed || !leafletMapRef.current) return;
      const map = leafletMapRef.current;

      // Clear previous markers
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};

      const validPois = filteredPois.filter(
        (p) => typeof p.lat === "number" && typeof p.lng === "number" && !isNaN(p.lat!) && !isNaN(p.lng!)
      );

      validPois.forEach((poi) => {
        const lat = poi.lat!;
        const lng = poi.lng!;

        const isSelected = selectedPlaceId === poi.id;
        const isOrigin = poi.id === "origin_city_start" || poi.waypointNum === 0;

        const iconSymbol = isOrigin
          ? "my_location"
          : poi.category === "dining"
          ? "restaurant"
          : poi.category === "photopoint"
          ? "photo_camera"
          : "castle";

        const bgClass = isOrigin
          ? "bg-blue-600 text-white ring-4 ring-blue-600/30 scale-110 shadow-xl"
          : isSelected
          ? "bg-[#186a57] text-white ring-4 ring-[#186a57]/30 scale-110 shadow-xl"
          : "bg-white text-[#186a57] border-2 border-[#186a57] hover:bg-[#186a57] hover:text-white shadow-md";

        const numBadge = isOrigin
          ? `<span class="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">0</span>`
          : poi.waypointNum
          ? `<span class="w-4 h-4 rounded-full bg-[#186a57] text-white flex items-center justify-center text-[10px] font-extrabold shadow-xs">${poi.waypointNum}</span>`
          : "";

        const customIcon = L.divIcon({
          className: "leaflet-custom-marker",
          html: `
            <div class="flex flex-col items-center cursor-pointer select-none group">
              <div class="px-2.5 py-1 rounded-lg ${isOrigin ? "bg-slate-900 text-white border-slate-700 font-bold" : "bg-white/95 text-slate-900 border-slate-200 font-bold"} border text-[11px] shadow-md mb-1 flex items-center gap-1.5 whitespace-nowrap">
                ${numBadge}
                <span>${poi.name}</span>
              </div>
              <div class="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${bgClass}">
                <span class="material-symbols-outlined text-lg">${iconSymbol}</span>
              </div>
              <div class="w-1.5 h-2 ${isOrigin ? "bg-blue-600" : "bg-[#186a57]"}"></div>
            </div>
          `,
          iconSize: [150, 75],
          iconAnchor: [75, 75],
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        marker.on("click", () => {
          setSelectedPlaceId(poi.id);
          map.panTo([lat, lng], { animate: true });
        });
        markersRef.current[poi.id] = marker;
      });
    });

    return () => {
      disposed = true;
    };
  }, [filteredPois, selectedPlaceId, mapReady]);

  // Route polyline — redraws only when the ordered waypoints change
  useEffect(() => {
    if (!leafletMapRef.current || !mapReady) return;
    let disposed = false;

    import("leaflet").then((L) => {
      if (disposed || !leafletMapRef.current) return;
      const map = leafletMapRef.current;

      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }

      const validPois = filteredPois.filter(
        (p) => typeof p.lat === "number" && typeof p.lng === "number" && !isNaN(p.lat!) && !isNaN(p.lng!)
      );

      // Draw route line through waypoints (including origin starting vector)
      const orderedWaypoints = routeWaypoints.length > 0 ? routeWaypoints : validPois.map((p) => p.id);
      const routeLatLngs: [number, number][] = [];

      const originPoi = validPois.find((p) => p.id === "origin_city_start" || p.waypointNum === 0);
      if (originPoi && typeof originPoi.lat === "number" && typeof originPoi.lng === "number") {
        routeLatLngs.push([originPoi.lat, originPoi.lng]);
      }

      orderedWaypoints.forEach((wpId) => {
        if (wpId === "origin_city_start") return;
        const poi = validPois.find((p) => p.id === wpId);
        if (poi && typeof poi.lat === "number" && typeof poi.lng === "number") {
          routeLatLngs.push([poi.lat, poi.lng]);
        }
      });

      if (routeLatLngs.length > 1) {
        polylineRef.current = L.polyline(routeLatLngs, {
          color: "#186a57",
          weight: 4,
          opacity: 0.9,
          dashArray: "6, 8",
        }).addTo(map);
      }
    });

    return () => {
      disposed = true;
    };
  }, [filteredPois, routeWaypoints, mapReady]);

  // Viewport fit — runs only when the actual plotted POI set changes
  useEffect(() => {
    if (!leafletMapRef.current || !mapReady) return;
    let disposed = false;

    import("leaflet").then((L) => {
      if (disposed || !leafletMapRef.current) return;
      const map = leafletMapRef.current;

      const validPois = filteredPois.filter(
        (p) => typeof p.lat === "number" && typeof p.lng === "number" && !isNaN(p.lat!) && !isNaN(p.lng!)
      );
      if (validPois.length === 0) return;

      const bounds = L.latLngBounds([]);
      validPois.forEach((poi) => bounds.extend([poi.lat!, poi.lng!]));

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }
    });

    return () => {
      disposed = true;
    };
  }, [boundsSignature, mapReady]);

  // Leaflet Map Control Handlers
  const handleZoomIn = () => {
    if (leafletMapRef.current) leafletMapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (leafletMapRef.current) leafletMapRef.current.zoomOut();
  };

  const handleRecenter = () => {
    if (!leafletMapRef.current) return;
    import("leaflet").then((L) => {
      const validPois = filteredPois.filter((p) => typeof p.lat === "number" && typeof p.lng === "number");
      if (validPois.length > 0) {
        const bounds = L.latLngBounds(validPois.map((p) => [p.lat!, p.lng!]));
        if (bounds.isValid()) {
          leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    });
  };

  const handleDirectPath = (poi: POI) => {
    if (poi && typeof poi.lat === "number" && typeof poi.lng === "number") {
      if (leafletMapRef.current) {
        leafletMapRef.current.flyTo([poi.lat, poi.lng], 16, { duration: 1.2 });
      }
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`, "_blank");
    }
  };

  const toggleRouteWaypoint = (poiId: string) => {
    if (routeWaypoints.includes(poiId)) {
      setRouteWaypoints(routeWaypoints.filter((id) => id !== poiId));
    } else {
      setRouteWaypoints([...routeWaypoints, poiId]);
    }
  };

  const toggleBookmark = async (placeId: string) => {
    const isCurrentlySaved = !!savedPlaceIds[placeId];
    setSavedPlaceIds((prev) => ({ ...prev, [placeId]: !isCurrentlySaved }));

    try {
      await interactionsApi.log({
        place_id: placeId,
        interaction_type: isCurrentlySaved ? "skip" : "save",
      });
    } catch (e) {
      // Fallback silently
    }
  };

  const handleAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQueryInput.trim()) return;

    setAiLoading(true);
    setAiAnswer(null);

    try {
      const matchedCity = backendCities.find((c) =>
        c.name.toLowerCase().includes(selectedRegionId.toLowerCase())
      );
      const res = await aiApi.chat({
        message: userQueryInput,
        city_id: matchedCity?.id,
      });
      if (res && res.response) {
        setAiAnswer(res.response);
      } else {
        setAiAnswer(
          `Based on PostGIS spatial telemetry in ${region.name}: We recommend visiting ${selectedPoi.name} during Golden Hour (${region.goldenHour}) for optimal lighting and low crowd volume (${region.crowdLevel}).`
        );
      }
    } catch (err: any) {
      setAiAnswer(
        `Synthesized GIS Recommendation for ${region.name}: Combine ${selectedPoi.name} with nearby heritage anchors during Golden Hour (${region.goldenHour}) for peak photography and zero traffic bottleneck.`
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateExpedition = async () => {
    setIsCreatingTrip(true);
    try {
      const matchedCity = backendCities.find((c) =>
        c.name.toLowerCase().includes(selectedRegionId.toLowerCase())
      );
      const cityId = matchedCity?.id || backendCities[0]?.id;

      if (cityId) {
        const trip = await tripsApi.create({
          city_id: cityId,
          title: `Smart Map Circuit: ${region.name} (${routeWaypoints.length} Nodes)`,
          duration_days: Math.max(2, routeWaypoints.length),
          total_budget: 45000,
          pace: "moderate",
          group_size: 2,
          context: {
            waypoints: routeWaypoints,
            region: region.name,
            corridor: region.corridor,
          },
        });
        router.push(`/trips/${trip.id}`);
        return;
      }
    } catch (e) {
      // Fallback redirect
    }
    setTimeout(() => {
      setIsCreatingTrip(false);
      router.push("/planner");
    }, 1200);
  };

  const handleExportGpx = () => {
    const waypointsXml = routeWaypoints
      .map((id) => {
        const poi = mergedPois.find((p) => p.id === id);
        if (!poi) return "";
        const lat = poi.lat || 31.5882;
        const lng = poi.lng || 74.3094;
        return `    <wpt lat="${lat}" lon="${lng}">\n      <name>${poi.name}</name>\n      <desc>${poi.tagline}</desc>\n    </wpt>`;
      })
      .join("\n");

    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="WanderAI Smart Map Engine">\n  <metadata>\n    <name>${region.name} Expedition GPX</name>\n    <desc>${region.corridor}</desc>\n  </metadata>\n${waypointsXml}\n</gpx>`;

    const blob = new Blob([gpxContent], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedRegionId}-expedition-route.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-background text-on-surface antialiased font-sans selection:bg-secondary/15 selection:text-secondary min-h-screen flex flex-col">
      <Navbar
        onSearch={() => setSearchModalOpen(true)}
        currency={currency}
        onCurrencyChange={setCurrency}
        tripsCount={Object.keys(savedPlaceIds).filter((k) => savedPlaceIds[k]).length || routeWaypoints.length}
      />

      {/* ==================== 2. MAIN CANVAS ==================== */}
      <main className="w-full pt-28 pb-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">

          {/* ── TRIP MODE BANNER ── */}
          {tripModeLoading && (
            <div className="mb-6 pt-4 flex items-center gap-3 px-5 py-3.5 bg-secondary/5 border border-secondary/20 rounded-2xl">
              <div className="w-5 h-5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin flex-shrink-0" />
              <span className="text-sm text-on-surface-variant font-medium">Loading trip itinerary onto map...</span>
            </div>
          )}

          {!tripModeLoading && activeTripData && (
            <div className="mb-6 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 bg-secondary/8 border border-secondary/25 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary/15 border border-secondary/25 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-secondary text-lg">route</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-secondary font-bold">Trip Mode Active</span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-bold border border-secondary/20">
                        {activeTripData.active_itinerary?.days?.reduce((a, d) => a + d.items.length, 0) || 0} stops plotted
                      </span>
                    </div>
                    <p className="font-display font-semibold text-sm text-on-surface mt-0.5 line-clamp-1">
                      {activeTripData.title}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {activeTripData.duration_days} days · PKR {activeTripData.total_budget.toLocaleString()} · {activeTripData.pace} pace
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/trips/${activeTripData.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container transition-all"
                  >
                    <span className="material-symbols-outlined text-sm text-secondary">arrow_back</span>
                    Back to Itinerary
                  </Link>
                  <button
                    onClick={() => router.replace("/explore")}
                    className="inline-flex items-center gap-1 p-2 rounded-xl bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
                    title="Exit Trip Mode"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* HERO HEADER & REGION ACCELERATOR */}
          <div className="pt-4 pb-8 border-b border-outline-variant/60 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-3xl">
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-on-surface">
                  WanderAI Smart Map & Spatial Intelligence
                </h1>
                <p className="font-sans text-sm sm:text-base text-on-surface-variant mt-2.5 leading-relaxed max-w-2xl">
                  {activeTripData
                    ? `Showing ${activeTripData.active_itinerary?.days?.reduce((a, d) => a + d.items.length, 0) || 0} itinerary stops from "${activeTripData.title}" — click any pin to see details.`
                    : "Bespoke spatial curation, real-time PostGIS GIS modeling, elevation contour analysis, and live solar tracking across Pakistan's historic & alpine corridors."
                  }
                </p>
              </div>

              {/* Region Selector Pills */}
              {!activeTripData && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex items-center bg-surface-container-high/70 p-1 rounded-xl border border-outline-variant overflow-x-auto scrollbar-none">
                    {Object.values(DEFAULT_REGIONS).map((reg) => (
                      <button
                        key={reg.id}
                        onClick={() => {
                          setSelectedRegionId(reg.id);
                          if (reg.pois[0]) setSelectedPlaceId(reg.pois[0].id);
                        }}
                        className={`px-3.5 py-2 rounded-lg font-display text-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                          selectedRegionId === reg.id
                            ? "bg-surface-container-lowest font-bold text-on-surface shadow-xs"
                            : "text-on-surface-variant hover:text-on-surface font-medium"
                        }`}
                        type="button"
                      >
                        {selectedRegionId === reg.id && (
                          <span className="material-symbols-outlined text-sm text-secondary">
                            place
                          </span>
                        )}
                        <span>{reg.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Corridor Telemetry Accelerator Strip */}
            <div className="mt-4 pt-3 flex items-center gap-2 overflow-x-auto text-xs pb-1 scrollbar-none">
              <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant flex items-center gap-1 font-semibold flex-shrink-0">
                <span className="material-symbols-outlined text-xs text-secondary">satellite_alt</span>
                Active Corridor:
              </span>
              <span className="px-3 py-1 rounded-full bg-secondary-container/60 text-secondary font-mono text-[11px] font-semibold flex-shrink-0">
                {region.corridor}
              </span>
              <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface font-mono text-[11px] border border-outline-variant flex-shrink-0">
                {region.coordinates}
              </span>
              <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface font-mono text-[11px] border border-outline-variant flex-shrink-0">
                Golden Hour: {region.goldenHour} ({region.azimuth})
              </span>
              <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface font-mono text-[11px] border border-outline-variant flex-shrink-0">
                Crowd Index: {region.crowdLevel}
              </span>
            </div>
          </div>

          {/* MAIN 2-COLUMN WORKSPACE GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
            {/* ==================== LEFT COLUMN: SPATIAL DOSSIER (5 cols) ==================== */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <section className="bg-surface-container-lowest p-6 sm:p-7 rounded-2xl border border-outline-variant shadow-luxury flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-base">neurology</span>
                    </span>
                    <div>
                      <h2 className="font-display font-bold text-base sm:text-lg text-on-surface">
                        Spatial Co-Pilot Dossier
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        Curated spatial nodes for {region.name}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-secondary-container/60 text-secondary font-semibold">
                    PostGIS 3.4
                  </span>
                </div>

                {/* Search Input */}
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-secondary text-lg">
                    auto_awesome
                  </span>
                  <input
                    className="w-full pl-11 pr-10 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-medium text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-secondary focus:bg-surface-container-lowest transition-all shadow-xs"
                    placeholder={`Search ${region.name} nodes (e.g. Mosque, Rooftop, Fort)...`}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 p-1 text-on-surface-variant hover:text-secondary rounded-md transition-colors"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>

                {/* Tactical Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                  {[
                    { id: "all", label: `All (${filteredPois.length})` },
                    { id: "heritage", label: "Heritage & Forts" },
                    { id: "dining", label: "Rooftop Dining" },
                    { id: "photopoint", label: "Photopoints" },
                  ].map((flt) => (
                    <button
                      key={flt.id}
                      onClick={() => setSelectedCategory(flt.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                        selectedCategory === flt.id
                          ? "bg-secondary text-white shadow-xs"
                          : "bg-surface-container-low hover:bg-surface-container border border-outline-variant text-on-surface-variant"
                      }`}
                      type="button"
                    >
                      {flt.label}
                    </button>
                  ))}
                </div>

                {/* Telemetry Card */}
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-secondary">
                        route
                      </span>{" "}
                      Active Route Corridor
                    </span>
                    <span className="font-mono text-[11px] text-secondary">
                      {region.corridor}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                    <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/60">
                      <span className="text-[9px] uppercase font-sans text-on-surface-variant font-semibold block">
                        Golden Hour
                      </span>
                      <span className="text-xs font-bold text-amber-700 block mt-0.5">
                        {region.goldenHour}
                      </span>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/60">
                      <span className="text-[9px] uppercase font-sans text-on-surface-variant font-semibold block">
                        Walk Vector
                      </span>
                      <span className="text-xs font-bold text-secondary block mt-0.5">
                        {region.walkVector}
                      </span>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/60">
                      <span className="text-[9px] uppercase font-sans text-on-surface-variant font-semibold block">
                        Crowd Level
                      </span>
                      <span className="text-xs font-bold text-on-surface block mt-0.5">
                        {region.crowdLevel}
                      </span>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/60">
                      <span className="text-[9px] uppercase font-sans text-on-surface-variant font-semibold block">
                        Pacing Index
                      </span>
                      <span className="text-xs font-bold text-on-surface block mt-0.5">
                        {region.pacingIndex}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dossier Item Cards */}
                <div className="flex flex-col gap-4">
                  {/* Departure Vector Information Callout */}
                  {mergedPois.find((p) => p.id === "origin_city_start" || p.waypointNum === 0) && (
                    (() => {
                      const originPoi = mergedPois.find((p) => p.id === "origin_city_start" || p.waypointNum === 0)!;
                      return (
                        <div className="p-4 rounded-xl bg-surface-container-low border border-blue-500/30 flex items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-600 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-xl">my_location</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md">
                                  Trip Departure Vector
                                </span>
                              </div>
                              <p className="text-sm font-extrabold text-on-surface mt-0.5">
                                {originPoi.name}
                              </p>
                              <p className="text-xs text-on-surface-variant">
                                Starting hub connecting to your planned itinerary.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {filteredPois
                    .filter((poi) => poi.id !== "origin_city_start" && poi.waypointNum !== 0)
                    .map((poi) => {
                    const isSelected = selectedPlaceId === poi.id;
                    const inRoute = routeWaypoints.includes(poi.id);
                    const isSaved = !!savedPlaceIds[poi.id];
                    // Check if this POI is part of the active trip itinerary
                    const isTripStop = activeTripData
                      ? activeTripData.active_itinerary?.days?.some((day: any) =>
                          day.items.some((item: any) => item.place.id === poi.id)
                        ) || false
                      : false;

                    return (
                      <article
                        key={poi.id}
                        onClick={() => setSelectedPlaceId(poi.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3.5 ${
                          isSelected
                            ? "bg-surface-container-lowest border-2 border-secondary shadow-md"
                            : isTripStop
                            ? "bg-secondary/5 border-secondary/30 shadow-xs hover:border-secondary/50"
                            : "bg-surface-container-lowest border-outline-variant hover:border-secondary/40 shadow-xs"
                        }`}
                      >
                        <div className="flex gap-4">
                          <div className="w-28 h-28 rounded-xl overflow-hidden shrink-0 relative bg-surface-container border border-outline-variant">
                            {poi.image ? (
                              <img
                                alt={poi.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                src={poi.image}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                                <span className="material-symbols-outlined text-4xl">photo_camera</span>
                              </div>
                            )}
                            {isTripStop ? (
                              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-secondary text-white text-[10px] font-bold uppercase tracking-wider">
                                #{poi.waypointNum}
                              </span>
                            ) : poi.waypointNum ? (
                              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-secondary text-white text-[10px] font-bold uppercase tracking-wider">
                                Waypoint {poi.waypointNum}
                              </span>
                            ) : null}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(poi.id);
                              }}
                              className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/40 backdrop-blur-md text-white hover:bg-black/70 transition-colors"
                              type="button"
                              title="Save to favorites"
                            >
                              <span className="material-symbols-outlined text-sm">
                                {isSaved ? "bookmark" : "bookmark_border"}
                              </span>
                            </button>
                          </div>
                          <div className="flex flex-col flex-1 min-w-0 justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <h3 className="font-display font-bold text-base text-on-surface truncate">
                                  {poi.name}
                                </h3>
                                {isTripStop ? (
                                  <span className="px-2 py-0.5 rounded-full bg-secondary text-white text-[11px] font-bold shrink-0 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">route</span>
                                    Itinerary Stop
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold shrink-0">
                                    {poi.match}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                                {poi.tagline}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant font-mono mt-2">
                              <span className="flex items-center gap-1 text-secondary font-semibold">
                                <span className="material-symbols-outlined text-sm">
                                  schedule
                                </span>
                                {poi.hours}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">
                                  payments
                                </span>
                                {poi.price}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 border-t border-outline-variant/60">
                          <div className="flex items-center gap-1.5 text-xs text-on-surface">
                            <span
                              className="material-symbols-outlined text-sm text-amber-500"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                            <span className="font-bold">{poi.rating}</span>
                            <span className="text-on-surface-variant text-[11px]">
                              ({poi.reviews} logs)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPlaceId(poi.id);
                              }}
                              className="px-3.5 py-1.5 rounded-xl border border-outline-variant hover:bg-surface-container-low text-xs font-semibold text-on-surface transition-colors cursor-pointer"
                              type="button"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRouteWaypoint(poi.id);
                              }}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer ${
                                inRoute
                                  ? "bg-secondary text-white hover:bg-secondary-dark"
                                  : "bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant"
                              }`}
                              type="button"
                            >
                              {inRoute ? (
                                <>
                                  <span className="material-symbols-outlined text-sm">check</span>
                                  <span>In Route</span>
                                </>
                              ) : (
                                <span>+ Add to Route</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Real Live AI Concierge Prompt Bar */}
                <div className="pt-2">
                  <form onSubmit={handleAiAsk} className="flex items-center gap-2">
                    <input
                      className="flex-1 px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-secondary focus:bg-surface-container-lowest transition-all"
                      placeholder={`Ask WanderAI about ${region.name} heritage, food or photo spots...`}
                      type="text"
                      value={userQueryInput}
                      onChange={(e) => setUserQueryInput(e.target.value)}
                    />
                    <button
                      disabled={aiLoading}
                      className="px-4 py-2.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark transition-colors flex items-center justify-center shadow-xs cursor-pointer font-semibold text-xs disabled:opacity-60"
                      type="submit"
                    >
                      <span>{aiLoading ? "Thinking..." : "Ask AI"}</span>
                    </button>
                  </form>
                  {aiAnswer && (
                    <div className="p-3 rounded-xl bg-secondary-container/60 border border-secondary/30 text-xs text-on-secondary-container font-medium mt-2 leading-relaxed">
                      {aiAnswer}
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* ==================== RIGHT COLUMN: INTERACTIVE MAP CANVAS (7 cols) ==================== */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="h-[480px] sm:h-[680px] lg:h-[720px] rounded-2xl border border-outline-variant shadow-luxury relative overflow-hidden bg-[#f4f3ee]">
                {/* Real Interactive Leaflet OpenStreetMap Container */}
                <div ref={mapContainerRef} className="w-full h-full z-10" />

                {/* Map Layer Controls Bar at Top */}
                <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-20 flex flex-wrap sm:flex-nowrap items-center justify-between pointer-events-none gap-2">
                  <div className="flex items-center p-1 bg-surface-container-lowest/95 backdrop-blur-md rounded-xl border border-outline-variant shadow-md pointer-events-auto overflow-x-auto scrollbar-none max-w-full">
                    {[
                      { id: "topo", icon: "landscape", label: "Topographic" },
                      { id: "golden", icon: "wb_twilight", label: `Golden Hour (${region.goldenHour})` },
                      { id: "crowd", icon: "group", label: `Crowd (${region.crowdLevel})` },
                      { id: "road", icon: "traffic", label: "Road Passability" },
                    ].map((lyr) => (
                      <button
                        key={lyr.id}
                        onClick={() => setActiveLayer(lyr.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          activeLayer === lyr.id
                            ? "bg-secondary text-white shadow-xs font-bold"
                            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                        }`}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[15px]">{lyr.icon}</span>
                        <span>{lyr.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="hidden sm:flex items-center gap-2 p-1.5 bg-surface-container-lowest/95 backdrop-blur-md rounded-xl border border-outline-variant shadow-md pointer-events-auto">
                    <span className="px-2.5 py-1 bg-surface-container-low rounded-lg text-[11px] font-mono text-on-surface font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-secondary text-sm">
                        navigation
                      </span>
                      <span>{region.coordinates}</span>
                    </span>
                  </div>
                </div>

                {/* Floating Map Zoom & GPS Controls */}
                <div className="absolute top-16 right-3 sm:top-20 sm:right-4 z-20 flex flex-col bg-surface-container-lowest/95 backdrop-blur-md rounded-xl border border-outline-variant shadow-lg p-1">
                  <button
                    onClick={handleZoomIn}
                    className="p-1.5 sm:p-2 text-on-surface hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
                    title="Zoom In"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm sm:text-base">add</span>
                  </button>
                  <div className="h-[1px] bg-outline-variant mx-1.5" />
                  <button
                    onClick={handleZoomOut}
                    className="p-1.5 sm:p-2 text-on-surface hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
                    title="Zoom Out"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm sm:text-base">remove</span>
                  </button>
                  <div className="h-[1px] bg-outline-variant mx-1.5" />
                  <button
                    onClick={handleRecenter}
                    className="p-1.5 sm:p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors cursor-pointer"
                    title="GPS Re-Center"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm sm:text-base">my_location</span>
                  </button>
                </div>

                {/* Floating Inspection Card */}
                {selectedPoi && (
                  selectedPoi.id === "origin_city_start" || selectedPoi.waypointNum === 0 ? (
                    <div className="absolute top-16 left-3 right-3 sm:right-auto sm:top-20 sm:left-4 z-30 sm:max-w-[340px] bg-surface-container-lowest/98 backdrop-blur-xl rounded-2xl border border-blue-500/30 shadow-2xl overflow-hidden p-4 sm:p-5 flex flex-col gap-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-blue-600/15 text-blue-600 flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined text-base">my_location</span>
                          </span>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md">
                            Departure Origin Vector
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedPlaceId("")}
                          className="p-1 text-on-surface-variant hover:text-on-surface rounded-md transition-colors cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>

                      <h3 className="font-display font-extrabold text-base text-on-surface">
                        {selectedPoi.name}
                      </h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {selectedPoi.desc}
                      </p>

                      <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between text-xs font-mono">
                        <span className="text-on-surface-variant font-sans font-semibold">Starting Hub:</span>
                        <span className="font-bold text-blue-600">{selectedPoi.name.replace(/^Start:\s*/, '')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute top-16 left-3 right-3 sm:right-auto sm:top-20 sm:left-4 z-30 sm:max-w-[360px] bg-surface-container-lowest/98 backdrop-blur-xl rounded-2xl border border-outline-variant shadow-2xl overflow-hidden">
                      <div className="relative h-32 sm:h-40 w-full overflow-hidden bg-surface-container">
                        <img
                          alt={selectedPoi.name}
                          className="w-full h-full object-cover"
                          src={selectedPoi.image}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-2 sm:bottom-3 left-3 right-3 flex items-center justify-between text-white">
                          <span className="px-2.5 py-0.5 rounded-full bg-secondary text-white text-[10px] font-bold uppercase tracking-wider">
                            {selectedPoi.match}
                          </span>
                          <span className="text-[11px] font-mono font-medium text-white/90">
                            {selectedPoi.hours}
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 sm:p-4 flex flex-col gap-2.5 sm:gap-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display font-bold text-sm sm:text-base text-on-surface">
                            {selectedPoi.name}
                          </h3>
                          <div className="flex items-center gap-1 text-xs font-bold text-on-surface">
                            <span
                              className="material-symbols-outlined text-sm text-amber-500"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                            <span>{selectedPoi.rating}</span>
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-tertiary-container/60 border border-tertiary/20 flex items-center justify-between text-[11px] sm:text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-on-tertiary-container text-sm sm:text-base">
                              wb_sunny
                            </span>
                            <span className="font-bold text-on-surface">
                              Golden Hour: {region.azimuth}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 sm:line-clamp-none">
                          {selectedPoi.desc}
                        </p>

                        <div className="flex items-center gap-2 pt-1 border-t border-outline-variant/60">
                          <button
                            onClick={() => handleDirectPath(selectedPoi)}
                            className="flex-1 py-1.5 sm:py-2 rounded-xl bg-secondary text-white hover:bg-secondary-dark text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-sm">directions</span>
                            <span>Direct Path</span>
                          </button>
                          <button
                            onClick={() => toggleRouteWaypoint(selectedPoi.id)}
                            className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                              routeWaypoints.includes(selectedPoi.id)
                                ? "bg-secondary-container text-on-secondary-container border border-secondary/30"
                                : "border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low text-on-surface"
                            }`}
                            type="button"
                          >
                            {routeWaypoints.includes(selectedPoi.id) ? "In Route" : "+ Add"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}

                {/* Bottom Route & Elevation HUD */}
                <div className="absolute bottom-3 left-2.5 right-2.5 sm:left-4 sm:right-4 z-30 flex justify-center pointer-events-none">
                  <div className="w-full bg-surface-container-lowest/98 backdrop-blur-xl p-3 sm:p-3.5 rounded-2xl border border-outline-variant shadow-2xl pointer-events-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
                    <div className="flex items-center gap-2.5 w-full md:w-auto overflow-hidden">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-lg sm:text-xl">directions_walk</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-secondary font-bold">
                          Active Multi-Stop Walk
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold text-on-surface truncate">
                          {routeWaypoints.map((id, idx) => {
                            const poi = mergedPois.find((p) => p.id === id);
                            if (!poi) return null;
                            return (
                              <span key={id} className="flex items-center gap-1">
                                <span>{poi.name.split(" ")[0]}</span>
                                {idx < routeWaypoints.length - 1 && (
                                  <span className="text-outline-variant">➔</span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-4 text-xs font-mono shrink-0 border-y md:border-y-0 md:border-x border-outline-variant/60 py-2 md:py-0 md:px-5">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-sans uppercase text-on-surface-variant font-semibold">
                          Total Vector
                        </span>
                        <span className="font-bold text-on-surface text-xs">
                          {region.walkVector} <span className="font-normal text-secondary">({region.walkTime})</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                      <button
                        onClick={handleExportGpx}
                        className="flex-1 md:flex-none px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Export GPX File"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        <span>Export GPX</span>
                      </button>
                      <button
                        onClick={handleCreateExpedition}
                        disabled={isCreatingTrip}
                        className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-secondary text-white hover:bg-secondary-dark transition-all shadow-md flex items-center justify-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-60"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">near_me</span>
                        <span>{isCreatingTrip ? "Building..." : "Create Expedition"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== 3. GEOSPATIAL ELEVATION & CORRIDOR ANALYTICS SECTION ==================== */}
          <section className="p-6 sm:p-8 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-luxury mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-on-surface">
                  Geospatial Elevation & Corridor Analytics
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                  Algorithmic spatial modeling powered by PostGIS satellite telemetry and real-time passability gates
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/60 text-secondary font-mono text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> 100% Deterministic GIS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant flex flex-col gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">landscape</span>
                </div>
                <h3 className="font-display font-bold text-base text-on-surface">
                  Topographic Vector Solver
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Real-time elevation contour modeling and 3D mountain slope passability solving across Himalayan passes.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant flex flex-col gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">wb_sunny</span>
                </div>
                <h3 className="font-display font-bold text-base text-on-surface">
                  Solar & Golden Hour Tracker
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Calculates solar azimuth angles and peak illumination windows for haute landscape photography.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant flex flex-col gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">groups</span>
                </div>
                <h3 className="font-display font-bold text-base text-on-surface">
                  Dynamic Crowd Telemetry
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Live satellite congestion monitoring to suggest quiet off-peak entry times at top heritage monuments.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant flex flex-col gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">offline_pin</span>
                </div>
                <h3 className="font-display font-bold text-base text-on-surface">
                  Offline Terrain Pack
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Pre-download 18MB offline vector GIS packs for seamless navigation when off-grid in deep mountain valleys.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* SEARCH MODAL (⌘K) */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-start justify-center pt-12 sm:pt-24 px-3 sm:px-4 overflow-y-auto pb-10">
          <div className="bg-surface-container-lowest w-full max-w-xl rounded-2xl border border-outline-variant shadow-2xl p-4 flex flex-col gap-3 animate-fadeIn my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                <span className="material-symbols-outlined text-secondary text-lg">search</span>
                <span>Geospatial Node Search</span>
              </div>
              <button
                onClick={() => setSearchModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface"
                type="button"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <input
              autoFocus
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-secondary"
              placeholder="Type valley, monument or food spot..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-xs font-mono text-on-surface-variant font-semibold">
                Quick Region Jump:
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.values(DEFAULT_REGIONS).map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => {
                      setSelectedRegionId(reg.id);
                      setSearchModalOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant"
                    type="button"
                  >
                    {reg.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 4. COMPREHENSIVE FOOTER ==================== */}
      <footer className="w-full bg-surface-container-low border-t border-outline-variant/60 pt-12 pb-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-8">
            <div className="lg:col-span-4 flex flex-col items-start gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-white shadow-xs">
                  <span className="material-symbols-outlined text-base">travel_explore</span>
                </div>
                <span className="font-bold text-lg text-on-surface tracking-tight">
                  Wander<span className="text-secondary">AI</span>
                </span>
              </div>
              <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">
                High-touch bespoke travel curation augmented by state-of-the-art computational spatial intelligence and real-time GIS modeling.
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant pt-1">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span>Spatial Engine Server: Ap-South-1 (Karachi Node Active)</span>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Explore Regions
              </span>
              <div className="flex flex-col gap-1.5 text-xs text-on-surface-variant">
                <Link className="hover:text-secondary transition-colors" href="/explore">
                  Lahore Walled City
                </Link>
                <Link className="hover:text-secondary transition-colors" href="/explore">
                  Hunza & Karakoram
                </Link>
                <Link className="hover:text-secondary transition-colors" href="/explore">
                  Skardu High Passes
                </Link>
                <Link className="hover:text-secondary transition-colors" href="/explore">
                  Swat Valley Heritage
                </Link>
                <Link className="hover:text-secondary transition-colors" href="/explore">
                  Deosai Plateau Expeditions
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Spatial AI Tools
              </span>
              <div className="flex flex-col gap-1.5 text-xs text-on-surface-variant">
                <Link className="hover:text-secondary transition-colors" href="/planner">
                  Smart Itinerary Synthesizer
                </Link>
                <Link className="hover:text-secondary transition-colors" href="/explore">
                  Solar & Golden Hour Tracker
                </Link>
                <Link className="hover:text-secondary transition-colors" href="/explore">
                  Elevation & Slope Modeler
                </Link>
                <Link className="hover:text-secondary transition-colors" href="/explore">
                  PostGIS Waypoint Routing
                </Link>
                <Link className="hover:text-secondary transition-colors" href="/assistant">
                  Cultural Context Assistant
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Geospatial Intelligence Dispatch
              </span>
              <p className="text-xs text-on-surface-variant">
                Receive exclusive seasonal expedition releases, offline terrain maps, and algorithmic travel insights.
              </p>
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant text-xs focus:outline-none focus:border-secondary shadow-xs"
                  placeholder="Enter your email"
                  type="email"
                />
                <button
                  className="px-4 py-2 rounded-xl bg-secondary text-white hover:bg-secondary-dark text-xs font-bold transition-opacity cursor-pointer shadow-xs"
                  type="button"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-outline-variant flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant font-medium">
            <p>© 2025 WanderAI Intelligence Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link className="hover:text-on-surface transition-colors" href="#">
                Privacy Policy
              </Link>
              <Link className="hover:text-on-surface transition-colors" href="#">
                Terms of Service
              </Link>
              <Link className="hover:text-on-surface transition-colors" href="#">
                GIS Data Attribution
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

export default function SmartMapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-secondary">
            <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
            <span className="font-display font-bold text-lg">Loading Geospatial Explorer...</span>
          </div>
        </div>
      }
    >
      <SmartMapContent />
    </Suspense>
  );
}

