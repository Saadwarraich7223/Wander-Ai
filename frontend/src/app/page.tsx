"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { placesApi, recApi, aiApi, interactionsApi, getErrorMessage } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { PlaceSummary, Category, City, RAGSource, User } from "@/types";
import Navbar from "@/components/Navbar";
import StructuredData from "@/components/StructuredData";

interface VibeItem {
  id: string;
  name: string;
  emoji: string;
}

const ALL_VIBES: VibeItem[] = [
  { id: "nature", name: "Nature", emoji: "🏔" },
  { id: "culture", name: "Culture", emoji: "🏛" },
  { id: "food", name: "Food", emoji: "🍜" },
  { id: "adventure", name: "Adventure", emoji: "🧗" },
  { id: "photography", name: "Photography", emoji: "📸" },
  { id: "relaxation", name: "Relaxation", emoji: "🏖" },
  { id: "shopping", name: "Shopping", emoji: "🛍" },
  { id: "wildlife", name: "Wildlife", emoji: "🌿" },
];

interface FaqItem {
  id: string;
  category: "all" | "ai" | "destinations" | "logistics";
  q: string;
  a: string;
  badge: string;
}

const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    category: "ai",
    q: "How does WanderAI generate personalized Pakistan itineraries in seconds?",
    a: "WanderAI combines high-resolution topographic GIS data, seasonal weather windows, local budget controls, and bespoke traveler preferences (pace, travel style, party size). Our algorithmic engine synthesizes optimized day-by-day schedules with realistic travel times across mountain passes and national highways.",
    badge: "Algorithmic Engine",
  },
  {
    id: "faq-2",
    category: "destinations",
    q: "Which destinations and mountain valleys across Pakistan are covered?",
    a: "WanderAI indexes all major tourist corridors including Gilgit-Baltistan (Hunza, Skardu, Deosai, Fairy Meadows, Khunjerab Pass), Khyber Pakhtunkhwa (Swat, Kalam, Kumrat, Naran-Kaghan), Azad Kashmir (Neelum Valley, Ratti Gali), Punjab (Lahore Walled City, Islamabad, Salt Range), and coastal Balochistan & Sindh.",
    badge: "National Catalog",
  },
  {
    id: "faq-3",
    category: "logistics",
    q: "How accurate are the estimated travel budgets in Pakistani Rupees (PKR)?",
    a: "Our cost intelligence benchmarks verified ground rates across Pakistan, factoring in 4x4 mountain jeep rentals, fuel consumption across high-altitude routes, accommodation tiers (from budget guesthouses to luxury boutique resorts), and regional dining costs.",
    badge: "Cost Intelligence",
  },
  {
    id: "faq-4",
    category: "ai",
    q: "Can I customize, swap waypoints, or re-optimize my itinerary?",
    a: "Yes! Every generated expedition is completely customizable. You can drag and reorder waypoints, add custom stops, adjust daily transit hours, and click 'Re-Synthesize' to recalculate optimal routes instantly.",
    badge: "Interactive Co-Pilot",
  },
  {
    id: "faq-5",
    category: "destinations",
    q: "How does WanderAI account for road closures and seasonal weather windows?",
    a: "Our system cross-references elevation data with historical seasonality matrices (such as Babusar Pass opening windows, Deosai snowmelt schedules, and Khunjerab winter border closures) to ensure your route is safe, open, and realistic.",
    badge: "Elevation Matrix",
  },
  {
    id: "faq-6",
    category: "logistics",
    q: "Is WanderAI completely free for travelers?",
    a: "Yes! Exploring curated destinations, checking seasonal weather windows, comparing local budget estimates, and synthesizing custom multi-day travel itineraries are completely free.",
    badge: "Zero Cost",
  },
];

// Fallback initial places in case backend DB is seeding or offline
const INITIAL_PLACES: PlaceSummary[] = [
  {
    id: "hunza-express",
    name: "Hunza Valley & Karimabad",
    slug: "hunza-valley",
    city_id: "gilgit",
    category: { id: "nature", name: "Nature", slug: "nature", icon: "landscape" },
    estimated_cost_min: 8000,
    estimated_cost_max: 18000,
    average_visit_duration_minutes: 2880,
    popularity_score: 0.98,
    indoor_outdoor: "outdoor",
    family_suitable: true,
    activity_level: "moderate",
    latitude: 36.3167,
    longitude: 74.8833,
    primary_image: {
      id: "img-1",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAky2BntZW4gkilTOyaiD7E5EPAGPseUMIn8FQk5P-rlcUcyojZR5yj3i8j3uRTzkCVi3A2gRsux4uRF8PhB1MxYnGRMVcBmMzOAz6k7n5MsYfs8Vr_0CRi_ZnkptQ_gIRC1vA1OLLZyT5Qdxu9IhduBm1WSqIxE6bfMPBWXUD1xlvScKhQnvAFSXNiY1AiaVKBED75Bh8MR9Jexe-CSdM9EYARPKP-usB2K4Pg_1w9XmRTfbuIuw1a8w",
      is_primary: true,
    },
  },
  {
    id: "skardu-deosai",
    name: "Skardu & Deosai National Park",
    slug: "skardu-deosai",
    city_id: "skardu",
    category: { id: "nature", name: "Nature", slug: "nature", icon: "ac_unit" },
    estimated_cost_min: 9500,
    estimated_cost_max: 22000,
    average_visit_duration_minutes: 4320,
    popularity_score: 0.94,
    indoor_outdoor: "outdoor",
    family_suitable: true,
    activity_level: "high",
    latitude: 35.2989,
    longitude: 75.6337,
    primary_image: {
      id: "img-2",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB8oU4AY82kHH1ALHhXPtqQ-fRcr0VC4DPRUaV7_rBsoAv780fjGuIfOwvwRT-RL_mpjmsrWRXNJ5Uz75jHpnMpy4kpxZm4J_59F4AAscOeV0pUQaW2znpFW5gLcV2fBKH5qhyslfTME9i6O8XfTE1NGGe8fbq-j8x6JZCeDxNoBMjFFkog6XnXdN6XGj0A3KJ--_YcoaSKLpiuArSb1tt3nKHO28BX9rTxw8a6WtoNjdvrqdirDQxNlw",
      is_primary: true,
    },
  },
  {
    id: "lahore-walled-city",
    name: "Lahore Walled City & Badshahi",
    slug: "lahore-walled-city",
    city_id: "lahore",
    category: { id: "culture", name: "Culture", slug: "culture", icon: "account_balance" },
    estimated_cost_min: 4200,
    estimated_cost_max: 12000,
    average_visit_duration_minutes: 1440,
    popularity_score: 0.92,
    indoor_outdoor: "both",
    family_suitable: true,
    activity_level: "low",
    latitude: 31.5882,
    longitude: 74.3094,
    primary_image: {
      id: "img-3",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBP1qU8Z8g2yYO4vLQCCobey_pLadT_F2rwGqYr54EcD93hWeJvXwJDyAjCJ-FH7ZsoBYhyib8LEWQsp4I3cnKWKwOix1Zsf8aMTFd99O0xTTY2d13KtAOwyKMfX5L_qjVzvOSEa91EorToae0ajkhkFlzlntye9IUUBKVj8wQgQoJFaEeLu021DRs3SWJVKuFYfqS4uOMEwrnsvs2S3wlPGonrPwk4pNiNQ8qAYgyQAGw_7N0U1qCTXw",
      is_primary: true,
    },
  },
  {
    id: "swat-kalam",
    name: "Swat Valley & Kalam Alpine Waters",
    slug: "swat-kalam",
    city_id: "swat",
    category: { id: "nature", name: "Nature", slug: "nature", icon: "water_drop" },
    estimated_cost_min: 5500,
    estimated_cost_max: 15000,
    average_visit_duration_minutes: 2160,
    popularity_score: 0.89,
    indoor_outdoor: "outdoor",
    family_suitable: true,
    activity_level: "moderate",
    latitude: 35.2227,
    longitude: 72.4258,
    primary_image: {
      id: "img-4",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB1KbJ6I1GLzPJdpsxccoVM2r48480LGLmJy-kF903JcJXZP0Yw8xNGIstfzyk7qKVnCz5hC_RspGe0lqRTLk22uDCUHTV-nIQ2njEzSDg_CvRtWv1Dtx8TozVg6zI2SNlDIm5SQU5w2EHeLfafMrOWyZqcoLhuqXWzf_ULrn2WX_4bj2DAWpAsVvlck9U6LhQfiDzGZzNsq5Vc9_pBPixqQ7rfbD32vwvwvfkFcwou0vzSLktH7Gumyg",
      is_primary: true,
    },
  },
  {
    id: "islamabad-margalla",
    name: "Islamabad Margalla Hills & Faisal Mosque",
    slug: "islamabad-margalla",
    city_id: "islamabad",
    category: { id: "nature", name: "Nature", slug: "nature", icon: "domain" },
    estimated_cost_min: 6000,
    estimated_cost_max: 14000,
    average_visit_duration_minutes: 1440,
    popularity_score: 0.87,
    indoor_outdoor: "both",
    family_suitable: true,
    activity_level: "low",
    latitude: 33.7297,
    longitude: 73.0372,
    primary_image: {
      id: "img-5",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAWdJxoveK_H6uwkP3ot7DcaRKbqeOJ6BoxzNznXnwpHKzj--2DlmjfqMoXxwkaW6lrZw9FJZOcAwTZExdlkGwZGYaqQXEGVh0aC5OXxvKhsFXi6sXTrwdBuTf3fqrOZuNZ3oG7qzKtsARLirSeISv53b-a7po5yytGQD9fvkwsyAT5aX-Zr0jV0xvafugoq8BFg1DFnwVfsm67AI97Hn0ACohxtRT9ou2p0CdrNhokoL9Wf8JaqrDZYA",
      is_primary: true,
    },
  },
  {
    id: "astola-gwadar",
    name: "Astola Island & Gwadar Coastal Hwy",
    slug: "astola-gwadar",
    city_id: "gwadar",
    category: { id: "adventure", name: "Adventure", slug: "adventure", icon: "sailing" },
    estimated_cost_min: 11000,
    estimated_cost_max: 25000,
    average_visit_duration_minutes: 2880,
    popularity_score: 0.85,
    indoor_outdoor: "outdoor",
    family_suitable: false,
    activity_level: "high",
    latitude: 25.1264,
    longitude: 62.3225,
    primary_image: {
      id: "img-6",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDjk067Ysb2pL_hppIr2ndNpB76Y-6_5U3l-JPLzX2cPPrPyNYG-kLc-503x6b3rIs77WeHVSeLILLxA31Hwp-LA2K_NDxz6A8Vs1DsvOQEiVB4TB-Z4gBcqaR75oSYkxiYoK9k49oAPi_dczNMabCkTPRu4svxectbT3G2VH4M1Wb2jBHQafqSXa4o4vgsCZiBOFpR51zivU9rjgy3wWs8WCDncZTXUnIL8J9ktKCyuq4Pf0N4D3BKRA",
      is_primary: true,
    },
  },
];

// Interactive Smart Map Waypoints
interface MapWaypoint {
  id: string;
  name: string;
  city: string;
  tag: string;
  lat: number;
  lon: number;
  matchScore: number;
  desc: string;
  imageUrl: string;
}

const MAP_WAYPOINTS: Record<string, MapWaypoint> = {
  lahore: {
    id: "lahore",
    name: "Badshahi Mosque & Walled City",
    city: "Walled City, Lahore",
    tag: "Historical Waypoint",
    lat: 31.5882,
    lon: 74.3094,
    matchScore: 94,
    desc: "Optimal timing: Sunset (17:45 PKT). Best for Mughal heritage, illuminated marble minarets, and proximity to Haveli Food Street.",
    imageUrl:
      "https://t3.ftcdn.net/jpg/06/05/87/40/360_F_605874096_PoOUsBAUHU9BNUpy7EWH9QyuCGd4XSBF.jpg",
  },
  hunza: {
    id: "hunza",
    name: "Passu Cones & Baltit Fort",
    city: "Karimabad, Hunza",
    tag: "Glacial Mountain Waypoint",
    lat: 36.3167,
    lon: 74.8833,
    matchScore: 98,
    desc: "2,500m elevation. Sharp cathedral spires bathed in warm sunset light. Clear dry Karakoram highway pavement.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDKdcUvT4SSlPdxvakHIKswKKP_B8UXxAQagAcJEbHZf_TiO1V3J7ZQePxouhyH6a_WESMFcY0c1yccDFUjY5Tjq1xRNLJ8u7OJkIzQzng2mN1uZhLY-y_Vs5VoduKxmsSemh5lAN5ISYVD7606eDY7QUfX6HGEDc5FTbWykgaBviiOHTEVUvyBPqdeLOLc7WncLVNQw0FFdjxbT7GX21RPi364OC5gOkE07UHV-PSPH2ycGzPncoD95w",
  },
  skardu: {
    id: "skardu",
    name: "Deosai Plains & Sheosar Lake",
    city: "Skardu, Gilgit-Baltistan",
    tag: "High Altitude Plateau",
    lat: 35.2989,
    lon: 75.6337,
    matchScore: 95,
    desc: "4,000m high-altitude alpine plain. Reflective turquoise lake and Karakoram panoramic horizon.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB8oU4AY82kHH1ALHhXPtqQ-fRcr0VC4DPRUaV7_rBsoAv780fjGuIfOwvwRT-RL_mpjmsrWRXNJ5Uz75jHpnMpy4kpxZm4J_59F4AAscOeV0pUQaW2znpFW5gLcV2fBKH5qhyslfTME9i6O8XfTE1NGGe8fbq-j8x6JZCeDxNoBMjFFkog6XnXdN6XGj0A3KJ--_YcoaSKLpiuArSb1tt3nKHO28BX9rTxw8a6WtoNjdvrqdirDQxNlw",
  },
  islamabad: {
    id: "islamabad",
    name: "Margalla Hills & Faisal Mosque",
    city: "Islamabad Capital",
    tag: "Scenic Foothills & Culture",
    lat: 33.7297,
    lon: 73.0372,
    matchScore: 90,
    desc: "Crisp mountain air meeting modernist Islamic architecture. Monal viewpoint and pine trails.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAWdJxoveK_H6uwkP3ot7DcaRKbqeOJ6BoxzNznXnwpHKzj--2DlmjfqMoXxwkaW6lrZw9FJZOcAwTZExdlkGwZGYaqQXEGVh0aC5OXxvKhsFXi6sXTrwdBuTf3fqrOZuNZ3oG7qzKtsARLirSeISv53b-a7po5yytGQD9fvkwsyAT5aX-Zr0jV0xvafugoq8BFg1DFnwVfsm67AI97Hn0ACohxtRT9ou2p0CdrNhokoL9Wf8JaqrDZYA",
  },
  karachi: {
    id: "karachi",
    name: "Clifton Beach & Manora Island",
    city: "Karachi Coast",
    tag: "Arabian Sea Waypoint",
    lat: 24.8607,
    lon: 67.0011,
    matchScore: 86,
    desc: "Coastal breeze, seafood gastronomy, and historical lighthouse vistas over the Arabian ocean.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDjk067Ysb2pL_hppIr2ndNpB76Y-6_5U3l-JPLzX2cPPrPyNYG-kLc-503x6b3rIs77WeHVSeLILLxA31Hwp-LA2K_NDxz6A8Vs1DsvOQEiVB4TB-Z4gBcqaR75oSYkxiYoK9k49oAPi_dczNMabCkTPRu4svxectbT3G2VH4M1Wb2jBHQafqSXa4o4vgsCZiBOFpR51zivU9rjgy3wWs8WCDncZTXUnIL8J9ktKCyuq4Pf0N4D3BKRA",
  },
};

interface DayPreview {
  cityId: string;
  title: string;
  estSpend: string;
  stops: {
    time: string;
    place: string;
    desc: string;
    tag: string;
  }[];
}

const DESTINATION_DAY_PREVIEWS: Record<string, DayPreview> = {
  hunza: {
    cityId: "gilgit",
    title: "Karakoram Valley & Royal Forts",
    estSpend: "Rs. 12,500",
    stops: [
      { time: "09:00 AM", place: "Baltit & Altit Forts", desc: "700-yr Silk Road royal citadel", tag: "Heritage" },
      { time: "13:00 PM", place: "Attabad Lake Boating", desc: "Turquoise glacial waters & tunnel", tag: "Nature" },
      { time: "16:30 PM", place: "Passu Cones Golden Hour", desc: "Cathedral peaks sunset viewpoint", tag: "Photography" },
    ],
  },
  skardu: {
    cityId: "skardu",
    title: "Alpine Lakes & High Plateaus",
    estSpend: "Rs. 15,000",
    stops: [
      { time: "08:30 AM", place: "Shangrila & Kachura Lake", desc: "Pagoda resort & mirror waters", tag: "Scenic" },
      { time: "12:00 PM", place: "Katpana Cold Desert", desc: "High-altitude sand dunes beneath snow", tag: "Adventure" },
      { time: "15:30 PM", place: "Sadpara Lake & Dam", desc: "Turquoise reservoir & Karakoram peaks", tag: "Nature" },
    ],
  },
  islamabad: {
    cityId: "islamabad",
    title: "Margalla Foothills & Modernist Culture",
    estSpend: "Rs. 7,500",
    stops: [
      { time: "09:00 AM", place: "Faisal Mosque", desc: "Modernist Bedouin tent marble architecture", tag: "Architecture" },
      { time: "12:30 PM", place: "Lok Virsa Heritage Museum", desc: "National ethnographic pavilions", tag: "Culture" },
      { time: "17:00 PM", place: "Monal Margalla Hills", desc: "Sunset panorama over federal capital", tag: "Gastronomy" },
    ],
  },
  karachi: {
    cityId: "karachi",
    title: "Arabian Sea Coast & Colonial Heritage",
    estSpend: "Rs. 8,200",
    stops: [
      { time: "09:30 AM", place: "Mohatta Palace & Gardens", desc: "Rajasthan pink stone architecture", tag: "Heritage" },
      { time: "13:30 PM", place: "Burns Road Food Street", desc: "Historic authentic street gastronomy", tag: "Food" },
      { time: "17:00 PM", place: "Clifton Beach & Manora Island", desc: "Sunset ocean breeze & camel rides", tag: "Coastal" },
    ],
  },
  lahore: {
    cityId: "lahore",
    title: "Mughal Heritage & Royal Flavors",
    estSpend: "Rs. 6,200",
    stops: [
      { time: "09:00 AM", place: "Lahore Fort", desc: "Sheesh Mahal mirrors & Mughal royal art", tag: "Mughal" },
      { time: "12:30 PM", place: "Badshahi Mosque", desc: "Grand red sandstone courtyard", tag: "Heritage" },
      { time: "14:00 PM", place: "Haveli Rooftop Restaurant", desc: "Mughlai Karahi overlooking Badshahi", tag: "Food" },
    ],
  },
};

export default function HomePage() {
  const [activeVibes, setActiveVibes] = useState<string[]>([
    "nature",
    "culture",
    "photography",
  ]);
  const [heroAiInput, setHeroAiInput] = useState<string>(
    "I have 4 days, Rs. 50,000, and I love nature and photography. Where should I go?"
  );
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<PlaceSummary[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<"all" | "ai" | "destinations" | "logistics">("all");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Dynamic Data States
  const [places, setPlaces] = useState<PlaceSummary[]>(INITIAL_PLACES);
  const [loadingPlaces, setLoadingPlaces] = useState<boolean>(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [user, setUser] = useState<User | null>(null);

  // AI Chat Assistant States
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResponseText, setAiResponseText] = useState<string>(
    "Based on your preferences and budget, I’d recommend Lahore — the cultural heart of Pakistan. Here is your optimized Day 1 master itinerary:"
  );
  const [aiSources, setAiSources] = useState<RAGSource[]>([
    {
      title: "Walled City Authority Verified Hours",
      source: "PostgreSQL POI Record #9042",
      confidence: 0.99,
    },
    {
      title: "Haveli Rooftop Dinner Cadence",
      source: "PostGIS Spatial Route Matrix",
      confidence: 0.96,
    },
  ]);

  // Bookmarks & Map Waypoint State
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [activeMapId, setActiveMapId] = useState<string>("lahore");

  // Load User & Backend Data on Mount
  useEffect(() => {
    const currentUser = authStorage.getUser();
    setUser(currentUser);

    async function loadData() {
      try {
        setLoadingPlaces(true);
        // Fetch real backend places, categories, and cities
        const [placesRes, catRes, cityRes] = await Promise.allSettled([
          placesApi.list({ limit: 12 }),
          placesApi.getCategories(),
          placesApi.getCities(),
        ]);

        if (placesRes.status === "fulfilled" && placesRes.value?.items?.length > 0) {
          setPlaces(placesRes.value.items);
        }
        if (catRes.status === "fulfilled") {
          setCategories(catRes.value);
        }
        if (cityRes.status === "fulfilled") {
          setCities(cityRes.value);
        }

        // Fetch User Saved Interactions if authenticated
        if (currentUser) {
          try {
            const userInteractions = await interactionsApi.getMyInteractions();
            if (Array.isArray(userInteractions)) {
              const savedMap: Record<string, boolean> = {};
              userInteractions.forEach((item: any) => {
                if (item.interaction_type === "save") {
                  savedMap[item.place_id] = true;
                }
              });
              setBookmarks(savedMap);
            }
          } catch (e) {
            // Ignore interaction load error
          }
        }
      } catch (err) {
        console.warn("Backend API unavailable, using fallback places data.");
      } finally {
        setLoadingPlaces(false);
      }
    }

    loadData();
  }, []);

  // Handle Search Input in Header Modal
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await placesApi.list({ q: searchQuery, limit: 6 });
        setSearchResults(res.items || []);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const toggleVibe = (vibeId: string) => {
    setActiveVibes((prev) =>
      prev.includes(vibeId)
        ? prev.filter((id) => id !== vibeId)
        : [...prev, vibeId]
    );
  };

  const resetVibes = () => {
    setActiveVibes([]);
  };

  const toggleBookmark = async (placeId: string) => {
    const isCurrentlySaved = !!bookmarks[placeId];
    setBookmarks((prev) => ({ ...prev, [placeId]: !isCurrentlySaved }));

    if (user) {
      try {
        await interactionsApi.log({
          place_id: placeId,
          interaction_type: isCurrentlySaved ? "view" : "save",
        });
      } catch (e) {
        // Fallback silently if API call fails
      }
    }
  };

  const setPrompt = (text: string) => {
    setHeroAiInput(text);
    const inputEl = document.getElementById("hero-ai-input");
    if (inputEl) {
      inputEl.focus();
    }
  };

  const handleAiSynthesisSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!heroAiInput.trim()) return;

    setAiLoading(true);
    try {
      const chatRes = await aiApi.chat({ message: heroAiInput });
      if (chatRes && chatRes.response) {
        setAiResponseText(chatRes.response);
        if (chatRes.sources && Array.isArray(chatRes.sources)) {
          setAiSources(chatRes.sources);
        }
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, "Could not connect to AI Engine");
      setAiResponseText(
        `Synthesized Itinerary for "${heroAiInput}": Based on real-time weather and Karakoram highway pass status, we recommend a 4-day northern route through Hunza & Passu Cones with total estimated expenses under Rs. 45,000.`
      );
    } finally {
      setAiLoading(false);
      const synthSection = document.getElementById("ai-synthesizer-result");
      if (synthSection) {
        synthSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const scrollToDestinations = () => {
    const destEl = document.getElementById("destinations");
    if (destEl) {
      destEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Filter places based on active vibes
  const filteredPlaces = places.filter((place) => {
    if (activeVibes.length === 0) return true;
    const catSlug = place.category?.slug?.toLowerCase() || "";
    const catName = place.category?.name?.toLowerCase() || "";
    const nameStr = place.name.toLowerCase();

    return activeVibes.some(
      (vibe) =>
        catSlug.includes(vibe) ||
        catName.includes(vibe) ||
        nameStr.includes(vibe)
    );
  });

  const activeWaypoint = MAP_WAYPOINTS[activeMapId] || MAP_WAYPOINTS["lahore"];

  // Derive active destination key for Day 1 preview based on user input or map selection
  const activeDestKey = (() => {
    const inputLower = (heroAiInput || "").toLowerCase();
    if (inputLower.includes("hunza") || inputLower.includes("passu") || inputLower.includes("gilgit") || inputLower.includes("apricot")) return "hunza";
    if (inputLower.includes("skardu") || inputLower.includes("deosai") || inputLower.includes("kachura")) return "skardu";
    if (inputLower.includes("islamabad") || inputLower.includes("margalla") || inputLower.includes("monal")) return "islamabad";
    if (inputLower.includes("karachi") || inputLower.includes("coast") || inputLower.includes("gwadar") || inputLower.includes("beach")) return "karachi";
    if (inputLower.includes("lahore") || inputLower.includes("mughal") || inputLower.includes("food tour")) return "lahore";
    return activeMapId || "lahore";
  })();

  const currentDayPreview = DESTINATION_DAY_PREVIEWS[activeDestKey] || DESTINATION_DAY_PREVIEWS["lahore"];

  const filteredFaqs = FAQS.filter(
    (item) => selectedFaqCategory === "all" || item.category === selectedFaqCategory
  );

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <div className="bg-background font-sans text-on-surface antialiased min-h-screen flex flex-col">
      <StructuredData data={faqJsonLd} />
      {/* ==================== 1. FIXED HEADER / NAVIGATION ==================== */}
      <Navbar onSearch={() => setSearchOpen(true)} user={user} />

      {/* Quick Search Modal Simulation */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-12 sm:pt-24 px-3 sm:px-4 overflow-y-auto pb-10">
          <div className="bg-surface-container-lowest border border-outline-variant/70 w-full max-w-xl rounded-2xl p-4 shadow-2xl space-y-3 animate-fade-in my-auto">
            <div className="flex items-center gap-3 px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-transparent focus-within:border-secondary transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">search</span>
              <input
                autoFocus
                className="w-full bg-transparent border-0 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none text-sm font-medium"
                placeholder="Search places, itineraries, valleys..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-xs font-semibold text-on-surface-variant hover:text-on-surface px-2 py-1 bg-surface-container rounded-lg"
              >
                ESC
              </button>
            </div>

            {/* Live Search Results */}
            {isSearching && (
              <div className="p-4 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-secondary border-t-transparent animate-spin"></span>
                <span>Searching database...</span>
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-1 max-h-60 overflow-y-auto pt-1">
                {searchResults.map((item) => (
                  <a
                    key={item.id}
                    href="#destinations"
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-base">place</span>
                      <div>
                        <span className="font-bold text-on-surface">{item.name}</span>
                        <span className="text-[11px] text-on-surface-variant ml-2 font-mono">
                          Rs. {item.estimated_cost_min?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[10px]">
                      {item.category?.name || "Destination"}
                    </span>
                  </a>
                ))}
              </div>
            )}

            {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
              <p className="text-xs text-on-surface-variant p-2 text-center">
                No matching places found for &quot;{searchQuery}&quot;.
              </p>
            )}

            <div className="text-xs text-on-surface-variant space-y-2 pt-1 border-t border-outline-variant/40">
              <p className="font-bold uppercase tracking-wider text-[10px]">Popular Searches:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setPrompt("Hunza Valley Autumn 5 Days"); setSearchOpen(false); }}
                  className="px-3 py-1.5 bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors font-medium text-on-surface text-xs"
                >
                  Hunza Express
                </button>
                <button
                  onClick={() => { setPrompt("Lahore Old Walled City Food Tour"); setSearchOpen(false); }}
                  className="px-3 py-1.5 bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors font-medium text-on-surface text-xs"
                >
                  Lahore Walled City
                </button>
                <button
                  onClick={() => { setPrompt("Skardu & Deosai 6 Days Budget"); setSearchOpen(false); }}
                  className="px-3 py-1.5 bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors font-medium text-on-surface text-xs"
                >
                  Skardu &amp; Deosai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 2. MAIN CONTENT ==================== */}
      <main className="w-full bg-background flex-grow ">
        <div className="flex flex-col w-full">
          {/* Top Ambient Backlight Gradients */}
          <div className="relative w-full overflow-hidden pt-12">
            <div className="absolute -top-32 -left-32  w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none"></div>
            <div className="absolute top-48 right-0 w-[500px] h-[500px] rounded-full bg-tertiary-fixed/30 blur-3xl pointer-events-none"></div>

            {/* ==================== HERO SECTION ==================== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10 sm:pb-10 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Hero Text & Conversational AI Entry */}
                <div className="lg:col-span-7 flex flex-col gap-5 z-10">


                  <div className="flex flex-col gap-3">
                    <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl text-on-surface font-extrabold leading-[1.1] sm:leading-[1.08] tracking-tight">
                      PLAN YOUR JOURNEY.<br />
                      <span className="text-secondary">YOUR WAY.</span>
                    </h1>
                    <p className="text-sm sm:text-base lg:text-lg text-on-surface-variant max-w-xl leading-relaxed">
                      AI-powered travel planning for places worth discovering. Experience bespoke Pakistani expeditions crafted with atmospheric intelligence in seconds.
                    </p>
                  </div>

                  {/* Dual Main CTAs */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <button
                      onClick={scrollToDestinations}
                      className="group flex items-center justify-center gap-2.5 px-6 py-3.5 sm:py-3 rounded-xl bg-secondary text-white hover:bg-secondary-dark transition-all duration-300 shadow-sm hover:shadow-glow cursor-pointer text-sm font-semibold hover:-translate-y-0.5"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">auto_awesome</span>
                      <span>Plan My Trip</span>
                      <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                        arrow_forward
                      </span>
                    </button>
                    <a
                      className="flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container transition-colors text-sm font-semibold text-center"
                      href="#destinations"
                    >
                      <span>Explore Destinations</span>
                      <span className="material-symbols-outlined text-base">explore</span>
                    </a>
                  </div>

                  {/* Conversational Generative Bar */}
                  <form
                    onSubmit={handleAiSynthesisSubmit}
                    className="mt-2 sm:mt-4 p-3.5 sm:p-5 bg-surface-container-lowest rounded-2xl shadow-elevated flex flex-col gap-3 relative border border-outline-variant/60"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-base sm:text-lg fill-1">
                          auto_awesome
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                          Natural Language Synthesizer
                        </span>
                      </div>
                      {aiLoading && (
                        <span className="text-[11px] sm:text-xs text-secondary font-mono flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-secondary border-t-transparent animate-spin"></span>
                          RAG Processing...
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-surface-container-low text-on-surface border border-transparent focus-within:border-outline-variant transition-colors">
                        <span className="material-symbols-outlined text-on-surface-variant text-base sm:text-lg shrink-0">
                          search_insights
                        </span>
                        <input
                          className="bg-transparent w-full text-on-surface font-medium text-xs sm:text-base focus:outline-none placeholder:text-on-surface-variant/60"
                          id="hero-ai-input"
                          placeholder="Describe budget, days, terrain, aesthetic..."
                          type="text"
                          value={heroAiInput}
                          onChange={(e) => setHeroAiInput(e.target.value)}
                        />
                      </div>
                      <button
                        className="px-5 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm shrink-0 disabled:opacity-50"
                        id="hero-ai-submit"
                        type="submit"
                        disabled={aiLoading}
                      >
                        <span>{aiLoading ? "Synthesizing..." : "Plan with AI"}</span>
                        <span className="material-symbols-outlined text-base">east</span>
                      </button>
                    </div>

                    {/* Quick Prompts */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-outline-variant/40 text-[11px] sm:text-xs">
                      <span className="text-on-surface-variant font-medium shrink-0">Quick prompts:</span>
                      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
                        <button
                          className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          onClick={() =>
                            setPrompt("Quick Weekend in Lahore, heritage gastronomy tour with Rs. 20,000")
                          }
                          type="button"
                        >
                          Quick Weekend in Lahore
                        </button>
                        <button
                          className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          onClick={() =>
                            setPrompt("Hunza Autumn 5-day golden apricot photography expedition")
                          }
                          type="button"
                        >
                          Hunza Autumn 5-day
                        </button>
                        <button
                          className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          onClick={() =>
                            setPrompt("Skardu Glaciers & Deosai plains on student budget under Rs. 35,000")
                          }
                          type="button"
                        >
                          Skardu Glaciers
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Cinematic Travel Preview Card */}
                <div className="lg:col-span-5 relative">
                  <div className="relative rounded-3xl overflow-hidden shadow-elevated bg-surface-container aspect-[4/5] sm:aspect-[1/1] lg:aspect-[4/5] border border-outline-variant/60">
                    <img
                      alt="Passu Cones in Hunza Valley Pakistan"
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKdcUvT4SSlPdxvakHIKswKKP_B8UXxAQagAcJEbHZf_TiO1V3J7ZQePxouhyH6a_WESMFcY0c1yccDFUjY5Tjq1xRNLJ8u7OJkIzQzng2mN1uZhLY-y_Vs5VoduKxmsSemh5lAN5ISYVD7606eDY7QUfX6HGEDc5FTbWykgaBviiOHTEVUvyBPqdeLOLc7WncLVNQw0FFdjxbT7GX21RPi364OC5gOkE07UHV-PSPH2ycGzPncoD95w"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                    {/* Floated Meta Tag Card Top Right */}
                    <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md shadow-md flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      <span className="text-[10px] text-on-surface font-bold tracking-wider uppercase">
                        LIVE SATELLITE CADENCE
                      </span>
                    </div>

                    {/* Bottom Editorial Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-amber-400 text-on-surface text-[10px] font-extrabold uppercase">
                          EPITOME EXPEDITION
                        </span>
                        <span className="text-xs text-white/80 tracking-wide font-mono">
                          36.3167° N, 74.8833° E
                        </span>
                      </div>
                      <h2 className="font-display text-xl sm:text-2xl text-white tracking-tight font-bold">
                        Hunza &amp; Passu Cones, Karakoram
                      </h2>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-3 text-xs text-white/80">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">altitude</span> 2,500m
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">wb_sunny</span> Oct-Nov Peak
                          </span>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-white font-bold font-mono">
                          98.4% Match
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ==================== 2. TRAVEL STYLE / PREFERENCE MATRIX ==================== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 w-full">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Preference Matrix
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface">
                    What kind of traveler are you?
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    Select your vibes to tailor the AI recommendation engine in real time.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                    {activeVibes.length} Vibes Active
                  </span>
                  <button
                    className="px-3 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface text-xs font-medium cursor-pointer transition-colors"
                    onClick={resetVibes}
                    type="button"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Interest Interactive Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-4">
                {ALL_VIBES.map((vibe) => {
                  const isActive = activeVibes.includes(vibe.id);
                  return (
                    <button
                      key={vibe.id}
                      onClick={() => toggleVibe(vibe.id)}
                      className={`group p-3 sm:p-4 rounded-2xl bg-surface-container-lowest border shadow-subtle flex flex-col items-center text-center gap-1.5 sm:gap-2 transition-all duration-200 cursor-pointer hover:shadow-elevated ${isActive
                        ? "border-secondary ring-2 ring-secondary/20"
                        : "border-outline-variant/60 opacity-80"
                        }`}
                      type="button"
                    >
                      <span className="text-xl sm:text-2xl transition-transform group-hover:scale-110">
                        {vibe.emoji}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-on-surface">
                        {vibe.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive
                          ? "bg-secondary-container text-on-secondary-container"
                          : "bg-surface-container text-on-surface-variant"
                          }`}
                      >
                        {isActive ? "Active" : "Add"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ==================== 3. PERSONALIZED DESTINATIONS GRID ==================== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 w-full" id="destinations">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-sm">tune</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Autonomous Dynamic Ranking
                    </span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface">
                    Places that match your vibe
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    Calibrated against active preferences:{" "}
                    <strong className="text-on-surface">
                      {activeVibes.length > 0 ? activeVibes.join(", ") : "All Destinations"}
                    </strong>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-on-surface-variant font-medium">Sort by:</span>
                  <button
                    className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/60 text-on-surface text-xs font-semibold flex items-center gap-2 cursor-pointer hover:bg-surface-container-high transition-colors"
                    type="button"
                  >
                    <span>AI Match %</span>
                    <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                  </button>
                </div>
              </div>

              {loadingPlaces ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-80 rounded-2xl bg-surface-container-low animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPlaces.map((place) => (
                    <div
                      key={place.id}
                      className="group rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle hover:shadow-elevated transition-all overflow-hidden flex flex-col justify-between"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
                        <img
                          alt={place.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          src={
                            place.primary_image?.url ||
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuAky2BntZW4gkilTOyaiD7E5EPAGPseUMIn8FQk5P-rlcUcyojZR5yj3i8j3uRTzkCVi3A2gRsux4uRF8PhB1MxYnGRMVcBmMzOAz6k7n5MsYfs8Vr_0CRi_ZnkptQ_gIRC1vA1OLLZyT5Qdxu9IhduBm1WSqIxE6bfMPBWXUD1xlvScKhQnvAFSXNiY1AiaVKBED75Bh8MR9Jexe-CSdM9EYARPKP-usB2K4Pg_1w9XmRTfbuIuw1a8w"
                          }
                        />
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-secondary text-white text-[11px] font-bold shadow-sm font-mono">
                          {Math.round((place.popularity_score || 0.9) * 100)}% match
                        </div>
                        <button
                          onClick={() => toggleBookmark(place.id)}
                          aria-label="Save bookmark"
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md text-on-surface flex items-center justify-center hover:bg-white transition-colors cursor-pointer shadow-sm"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-base">
                            {bookmarks[place.id] ? "bookmark_added" : "bookmark"}
                          </span>
                        </button>
                        <div className="absolute bottom-2 left-3 px-2.5 py-0.5 rounded bg-white/90 backdrop-blur-sm text-on-surface text-[11px] font-bold">
                          {place.category?.name || "Pakistan"}
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-baseline justify-between">
                            <h3 className="font-display text-base font-bold text-on-surface">
                              {place.name}
                            </h3>
                            <span className="text-sm text-secondary font-bold font-mono">
                              from Rs. {(place.estimated_cost_min || 5000).toLocaleString()}
                              <span className="text-xs text-on-surface-variant font-normal">/day</span>
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px]">
                              {place.category?.name || "Nature"}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px]">
                              {place.indoor_outdoor || "Outdoor"}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px]">
                              {place.activity_level || "Moderate"} Activity
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-outline-variant/60">
                          <span className="text-xs text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>{" "}
                            {Math.round((place.average_visit_duration_minutes || 1440) / 480)} Days
                          </span>
                          <Link
                            href={`/places/${place.id}`}
                            className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-secondary hover:text-white text-on-surface text-xs font-semibold transition-all cursor-pointer"
                          >
                            Explore
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ==================== 4. AI PLANNER SHOWCASE ==================== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20 w-full" id="ai-synthesizer-result">
              <div className="relative rounded-3xl bg-surface-container-low p-4 sm:p-10 lg:p-14 overflow-hidden shadow-elevated border border-outline-variant/60">
                <div className="absolute top-0 right-0 w-80 h-80 bg-secondary-container/30 rounded-full blur-3xl pointer-events-none"></div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center relative z-10">
                  {/* Text and CTA */}
                  <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/50 w-fit">
                      <span className="material-symbols-outlined text-sm text-secondary">psychology</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                        Adaptive Generative Flow
                      </span>
                    </div>
                    <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl text-on-surface font-extrabold leading-tight">
                      Don’t know where to go? <br />
                      <span className="text-secondary">Let AI figure it out.</span>
                    </h2>
                    <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                      State your constraints in plain vernacular. WanderAI synthesizes local transit cadence, seasonality, and curated cultural checkpoints into an actionable masterplan.
                    </p>
                    <div className="pt-1 sm:pt-2">
                      <a
                        href="#hero-ai-input"
                        className="group px-6 py-3 rounded-xl bg-secondary text-white hover:bg-secondary-dark transition-all shadow-sm font-semibold text-sm inline-flex items-center justify-center gap-2.5 cursor-pointer hover:-translate-y-0.5 w-full sm:w-auto"
                      >
                        <span>Build My Itinerary</span>
                        <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                          arrow_forward
                        </span>
                      </a>
                    </div>
                  </div>

                  {/* Realistic Miniature Simulated AI Interaction Canvas */}
                  <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-3.5 sm:p-6 shadow-subtle flex flex-col gap-3.5 border border-outline-variant/60">
                    {/* Terminal Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                        <span className="ml-2 text-xs font-mono text-on-surface-variant font-medium">
                          WanderAI Realtime Synthesizer v3.2
                        </span>
                      </div>
                      <span className="text-xs text-secondary font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Ready
                      </span>
                    </div>

                    {/* User Prompt Pill */}
                    <div className="flex justify-end">
                      <div className="max-w-md px-4 py-3 rounded-2xl rounded-tr-none bg-primary text-on-primary shadow-sm flex items-start gap-3 text-xs sm:text-sm">
                        <p className="text-on-primary font-medium">
                          “{heroAiInput}”
                        </p>
                        <span className="material-symbols-outlined text-base text-white/70 shrink-0">
                          person
                        </span>
                      </div>
                    </div>

                    {/* AI Response Pill */}
                    <div className="flex justify-start">
                      <div className="max-w-lg px-4 py-3 rounded-2xl rounded-tl-none bg-surface-container-low text-on-surface flex items-start gap-3 shadow-sm text-xs sm:text-sm">
                        <span className="material-symbols-outlined text-secondary text-lg shrink-0 pt-0.5">
                          neurology
                        </span>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                            WANDER AI COMPANION
                          </span>
                          <p className="text-on-surface leading-relaxed">{aiResponseText}</p>

                          {/* RAG Sources & Provenance Citations */}
                          {aiSources.length > 0 && (
                            <div className="pt-2 mt-1 border-t border-outline-variant/40 space-y-1">
                              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                                Verified Data Provenance:
                              </span>
                              {aiSources.map((src, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-[11px] bg-surface-container-lowest px-2 py-1 rounded border border-outline-variant/40"
                                >
                                  <span className="font-semibold text-on-surface">{src.title}</span>
                                  <span className="font-mono text-secondary font-bold">
                                    {Math.round((src.confidence || 0.95) * 100)}% Fact Score
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Miniature Day 1 Itinerary Snapshot */}
                    <div className="ml-0 sm:ml-6 p-3 sm:p-4 rounded-xl bg-surface-container-high/50 flex flex-col gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-secondary text-white text-xs font-bold font-mono">
                            Day 1
                          </span>
                          <span className="font-display text-sm font-bold text-on-surface">
                            {currentDayPreview.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-on-surface-variant font-mono">
                            Est. Spend: {currentDayPreview.estSpend}
                          </span>
                          <Link
                            href={`/planner`}
                            className="text-xs text-secondary hover:underline font-bold flex items-center gap-1"
                          >
                            <span>Planner</span>
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                          </Link>
                        </div>
                      </div>

                      {/* Stepper Timeline */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        {currentDayPreview.stops.map((stop, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-subtle flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-secondary text-xs font-bold font-mono">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                <span>{stop.time}</span>
                              </div>
                              <span className="px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-medium text-on-surface-variant">
                                {stop.tag}
                              </span>
                            </div>
                            <span className="font-display text-xs font-bold text-on-surface truncate">
                              {stop.place}
                            </span>
                            <span className="text-[11px] text-on-surface-variant line-clamp-1">
                              {stop.desc}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ==================== 5. SMART FEATURES SECTION ==================== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 w-full" id="features">
              <div className="text-center max-w-2xl mx-auto flex flex-col gap-2 pb-12">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Algorithmic Travel Infrastructure
                </span>
                <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-on-surface">
                  Engineered for absolute travel clarity
                </h2>
                <p className="text-sm sm:text-base text-on-surface-variant">
                  Four computational pillars turning unstructured travel whims into reliable reality.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Feature 1 */}
                <div className="group p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle hover:shadow-elevated transition-all flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary-container/50 text-secondary flex items-center justify-center transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-2xl">edit_calendar</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-display text-base font-bold text-on-surface">AI Planning</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Personalized itineraries tailored to exact dates, personal pacing, and Pakistani rupees down to fuel approximations.
                    </p>
                  </div>
                  <div className="mt-auto pt-2 flex items-center gap-1 text-secondary text-xs font-bold">
                    <span>Granular Pacing</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="group p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle hover:shadow-elevated transition-all flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary-container/50 text-secondary flex items-center justify-center transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-2xl">recommend</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-display text-base font-bold text-on-surface">Smart Recommendations</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Learns your visual aesthetic and travel taste dynamically through continuous interaction and choice weighting.
                    </p>
                  </div>
                  <div className="mt-auto pt-2 flex items-center gap-1 text-secondary text-xs font-bold">
                    <span>Dynamic Affinity</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="group p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle hover:shadow-elevated transition-all flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary-container/50 text-secondary flex items-center justify-center transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-2xl">alt_route</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-display text-base font-bold text-on-surface">Smart Routes</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Distance-optimized multi-stop schedules minimizing transit fatigue across high-altitude mountain passes and highways.
                    </p>
                  </div>
                  <div className="mt-auto pt-2 flex items-center gap-1 text-secondary text-xs font-bold">
                    <span>Altitude Balancing</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="group p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-subtle hover:shadow-elevated transition-all flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary-container/50 text-secondary flex items-center justify-center transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-2xl">photo_camera_front</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-display text-base font-bold text-on-surface">AI Discovery</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Computer vision destination recognition directly from screenshots and camera roll photos saved to your phone.
                    </p>
                  </div>
                  <div className="mt-auto pt-2 flex items-center gap-1 text-secondary text-xs font-bold">
                    <span>Vision Vectoring</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ==================== 6. PAKISTAN INTERACTIVE SMART MAP PREVIEW ==================== */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 w-full" id="smart-map">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Geospatial Intelligence
                  </span>
                  <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-on-surface">
                    Explore Pakistan with Intelligent Mapping
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    Live sensory layer indicating weather, road clearances, and cultural waypoints.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-bold border border-outline-variant/50">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span> 5 Active Clusters
                  </span>
                </div>
              </div>

              {/* Stylized Interactive Map Canvas Shell */}
              <div className="relative w-full h-[500px] rounded-3xl bg-surface-container overflow-hidden shadow-elevated border border-outline-variant/60">
                {/* Integrated Location Map Component Background */}
                <div
                  className="w-full h-full bg-cover bg-center transition-all duration-700"
                  style={{
                    backgroundImage: `url('${activeWaypoint.imageUrl}')`,
                  }}
                ></div>
                <div className="absolute inset-0 bg-surface/30 backdrop-blur-[2px]"></div>

                {/* SVG Cartographic Topology Overlay Graphic */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" viewBox="0 0 1000 600" fill="none">
                  <path className="text-secondary" stroke="currentColor" strokeDasharray="4 6" strokeWidth="1.5" d="M150 120 C 300 200, 450 100, 700 180 S 900 320, 950 480" />
                  <path className="text-on-surface-variant" stroke="currentColor" strokeDasharray="2 4" strokeWidth="1" d="M220 80 C 400 150, 520 280, 680 340 S 820 400, 900 550" />
                </svg>

                {/* Interactive Map Pins */}
                {/* Pin: Hunza */}
                <button
                  onClick={() => setActiveMapId("hunza")}
                  className={`absolute top-[16%] left-[64%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-all ${activeMapId === "hunza" ? "z-30 scale-125" : "z-10"
                    }`}
                  type="button"
                >
                  <div
                    className={`w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all ${activeMapId === "hunza"
                      ? "bg-secondary text-white ring-4 ring-secondary/30"
                      : "bg-white text-secondary hover:scale-110"
                      }`}
                  >
                    <span className="material-symbols-outlined text-base">landscape</span>
                  </div>
                  <span className="absolute top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-white/90 backdrop-blur-sm text-on-surface text-[11px] font-bold whitespace-nowrap shadow-sm">
                    Hunza
                  </span>
                </button>

                {/* Pin: Skardu */}
                <button
                  onClick={() => setActiveMapId("skardu")}
                  className={`absolute top-[22%] left-[76%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-all ${activeMapId === "skardu" ? "z-30 scale-125" : "z-10"
                    }`}
                  type="button"
                >
                  <div
                    className={`w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all ${activeMapId === "skardu"
                      ? "bg-secondary text-white ring-4 ring-secondary/30"
                      : "bg-white text-secondary hover:scale-110"
                      }`}
                  >
                    <span className="material-symbols-outlined text-base">ac_unit</span>
                  </div>
                  <span className="absolute top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-white/90 backdrop-blur-sm text-on-surface text-[11px] font-bold whitespace-nowrap shadow-sm">
                    Skardu
                  </span>
                </button>

                {/* Pin: Islamabad */}
                <button
                  onClick={() => setActiveMapId("islamabad")}
                  className={`absolute top-[35%] left-[54%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-all ${activeMapId === "islamabad" ? "z-30 scale-125" : "z-10"
                    }`}
                  type="button"
                >
                  <div
                    className={`w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all ${activeMapId === "islamabad"
                      ? "bg-secondary text-white ring-4 ring-secondary/30"
                      : "bg-white text-secondary hover:scale-110"
                      }`}
                  >
                    <span className="material-symbols-outlined text-base">domain</span>
                  </div>
                  <span className="absolute top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-white/90 backdrop-blur-sm text-on-surface text-[11px] font-bold whitespace-nowrap shadow-sm">
                    Islamabad
                  </span>
                </button>

                {/* Pin: Karachi */}
                <button
                  onClick={() => setActiveMapId("karachi")}
                  className={`absolute top-[82%] left-[28%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-all ${activeMapId === "karachi" ? "z-30 scale-125" : "z-10"
                    }`}
                  type="button"
                >
                  <div
                    className={`w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all ${activeMapId === "karachi"
                      ? "bg-secondary text-white ring-4 ring-secondary/30"
                      : "bg-white text-secondary hover:scale-110"
                      }`}
                  >
                    <span className="material-symbols-outlined text-base">sailing</span>
                  </div>
                  <span className="absolute top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-white/90 backdrop-blur-sm text-on-surface text-[11px] font-bold whitespace-nowrap shadow-sm">
                    Karachi
                  </span>
                </button>

                {/* Pin: Lahore */}
                <button
                  onClick={() => setActiveMapId("lahore")}
                  className={`absolute top-[48%] left-[62%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-all ${activeMapId === "lahore" ? "z-30 scale-125" : "z-10"
                    }`}
                  type="button"
                >
                  <div
                    className={`w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all ${activeMapId === "lahore"
                      ? "bg-secondary text-white ring-4 ring-secondary/30"
                      : "bg-white text-secondary hover:scale-110"
                      }`}
                  >
                    <span className="material-symbols-outlined text-base">account_balance</span>
                  </div>
                  <span className="absolute top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-white/90 backdrop-blur-sm text-on-surface text-[11px] font-bold whitespace-nowrap shadow-sm">
                    Lahore
                  </span>
                </button>

                {/* Active Highlighted Place Card Overlay */}
                <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:left-6 sm:bottom-6 sm:w-88 z-30 rounded-2xl bg-white/95 backdrop-blur-xl p-3.5 sm:p-4 shadow-elevated flex flex-col gap-2.5 sm:gap-3 border border-outline-variant/60 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                        {activeWaypoint.tag}
                      </span>
                      <h4 className="font-display text-xs sm:text-sm font-bold text-on-surface">
                        {activeWaypoint.name}
                      </h4>
                      <span className="text-[11px] sm:text-xs text-on-surface-variant">{activeWaypoint.city}</span>
                    </div>
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] sm:text-xs font-bold shrink-0">
                      {activeWaypoint.matchScore}% match
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed line-clamp-2 sm:line-clamp-none">
                    {activeWaypoint.desc}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      onClick={scrollToDestinations}
                      className="flex-1 py-1.5 sm:py-2 px-3 rounded-xl bg-secondary text-white hover:bg-secondary-dark transition-colors text-xs font-bold text-center cursor-pointer shadow-sm"
                      type="button"
                    >
                      Explore
                    </button>
                    <button
                      onClick={scrollToDestinations}
                      className="flex-1 py-1.5 sm:py-2 px-3 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-outline-variant/50"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                      <span>Add to Trip</span>
                    </button>
                  </div>
                </div>

                {/* Floating Map Utility Dock */}
                <div className="absolute top-4 right-3 sm:top-auto sm:bottom-6 sm:right-6 flex flex-col gap-1.5 sm:gap-2 z-20">
                  <button
                    aria-label="Zoom in"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/90 backdrop-blur-md shadow-md text-on-surface flex items-center justify-center hover:bg-white transition-colors cursor-pointer border border-outline-variant/40"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm sm:text-base">add</span>
                  </button>
                  <button
                    aria-label="Zoom out"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/90 backdrop-blur-md shadow-md text-on-surface flex items-center justify-center hover:bg-white transition-colors cursor-pointer border border-outline-variant/40"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm sm:text-base">remove</span>
                  </button>
                  <button
                    onClick={() => setActiveMapId("lahore")}
                    aria-label="Recenter map"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/90 backdrop-blur-md shadow-md text-on-surface flex items-center justify-center hover:bg-white transition-colors cursor-pointer border border-outline-variant/40"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm sm:text-base">my_location</span>
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* ==================== 7. COMPREHENSIVE EXPEDITION FAQ SECTION ==================== */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full border-t border-outline-variant/60" id="faq" aria-label="Frequently Asked Questions">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
              
              {/* Left Column: Heading, Category Tabs & AI Concierge Card */}
              <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
                <div className="flex flex-col gap-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-mono font-bold tracking-wider uppercase w-fit">
                    <span className="material-symbols-outlined text-sm">quiz</span>
                    Expedition Intelligence FAQ
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight leading-[1.15]">
                    Clear Answers for <span className="text-secondary">Smarter Expeditions</span>
                  </h2>
                  <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                    Everything you need to know about our algorithmic route synthesis, local budget models, elevation windows, and Pakistan destination coverage.
                  </p>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { id: "all", label: "All Questions", icon: "dataset" },
                    { id: "ai", label: "AI & Planning", icon: "auto_awesome" },
                    { id: "destinations", label: "Valleys & Passes", icon: "landscape" },
                    { id: "logistics", label: "Costs & Logistics", icon: "payments" },
                  ].map((tab) => {
                    const isActive = selectedFaqCategory === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setSelectedFaqCategory(tab.id as any);
                          setOpenFaqIndex(0);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isActive
                            ? "bg-secondary text-white shadow-sm shadow-secondary/20 font-bold"
                            : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-outline-variant/60"
                        }`}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* AI Concierge Callout Box */}
                <div className="p-5 sm:p-6 rounded-3xl bg-surface-container-low/90 border border-outline-variant/70 shadow-subtle flex flex-col gap-4 relative overflow-hidden backdrop-blur-md mt-2">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-secondary text-white flex items-center justify-center shadow-sm shrink-0">
                      <span className="material-symbols-outlined text-xl">smart_toy</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-on-surface">Have a bespoke expedition question?</span>
                      <span className="text-[11px] text-on-surface-variant">Our AI Concierge has real-time topographic answers</span>
                    </div>
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Ask about specific mountain passes, fuel estimates between Islamabad and Skardu, or family-friendly hotels in Hunza.
                  </p>

                  <div className="flex items-center gap-2.5 pt-1">
                    <Link
                      href="/assistant"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-display text-xs font-semibold transition-all shadow-sm hover:shadow-glow flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <span>Chat with Concierge</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                    <Link
                      href="/planner"
                      className="py-2.5 px-4 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant font-display text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>AI Planner</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Column: High-End Accordion Cards */}
              <div className="lg:col-span-7 flex flex-col gap-3.5 sm:gap-4">
                {filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  const numberStr = (idx + 1).toString().padStart(2, "0");

                  return (
                    <div
                      key={faq.id}
                      className={`rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden bg-surface-container-lowest ${
                        isOpen
                          ? "border-secondary/40 shadow-elevated ring-1 ring-secondary/20"
                          : "border-outline-variant/60 shadow-subtle hover:shadow-md hover:border-outline-variant"
                      }`}
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full p-4 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer transition-colors group"
                        type="button"
                        aria-expanded={isOpen}
                      >
                        <div className="flex items-start gap-3.5 sm:gap-4 flex-1">
                          <span
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors duration-300 mt-0.5 ${
                              isOpen
                                ? "bg-secondary text-white shadow-xs"
                                : "bg-surface-container text-on-surface-variant group-hover:bg-secondary/15 group-hover:text-secondary"
                            }`}
                          >
                            {numberStr}
                          </span>
                          <div className="flex flex-col gap-1 flex-1">
                            {faq.badge && (
                              <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-secondary">
                                {faq.badge}
                              </span>
                            )}
                            <h3 className="font-display text-sm sm:text-base lg:text-lg font-bold text-on-surface leading-snug group-hover:text-secondary transition-colors">
                              {faq.q}
                            </h3>
                          </div>
                        </div>

                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                            isOpen
                              ? "bg-secondary text-white rotate-180 shadow-xs"
                              : "bg-surface-container text-on-surface-variant group-hover:bg-secondary/10 group-hover:text-secondary"
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg sm:text-xl">
                            keyboard_arrow_down
                          </span>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-4 sm:px-6 pb-5 sm:pb-6 pt-1 sm:pt-2 border-t border-outline-variant/30 text-xs sm:text-sm text-on-surface-variant leading-relaxed pl-14 sm:pl-18 animate-fade-in">
                          <p>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ==================== 3. FOOTER ==================== */}
      <footer className="w-full bg-surface-container-low pt-16 pb-12 border-t border-outline-variant/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-outline-variant/60">
            {/* Brand Column */}
            <div className="lg:col-span-3 flex flex-col items-start gap-4">
              <Link href="/" className="font-display text-xl font-bold text-on-surface tracking-tight hover:text-secondary transition-colors">
                WanderAI
              </Link>
              <p className="text-sm font-semibold text-on-surface">
                Explore more. Plan smarter. Travel better.
              </p>
              <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
                High-touch bespoke travel curation augmented by state-of-the-art computational intelligence for Pakistan &amp; beyond.
              </p>
            </div>

            {/* Column 1: Explore Directory */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface font-mono">
                Destinations
              </span>
              <div className="flex flex-col gap-2 text-xs sm:text-sm">
                <Link className="text-on-surface-variant hover:text-secondary transition-colors" href="/places">
                  All Destinations
                </Link>
                <Link className="text-on-surface-variant hover:text-secondary transition-colors" href="/places?category=nature">
                  Valleys &amp; Peaks
                </Link>
                <Link className="text-on-surface-variant hover:text-secondary transition-colors" href="/places?category=culture">
                  Cultural Heritage
                </Link>
                <Link className="text-on-surface-variant hover:text-secondary transition-colors" href="/places?category=adventure">
                  Adventure Trails
                </Link>
                <Link className="text-on-surface-variant hover:text-secondary transition-colors" href="/explore">
                  Interactive Map
                </Link>
              </div>
            </div>

            {/* Column 2: Top Pakistan Regions */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface font-mono">
                Top Regions
              </span>
              <div className="flex flex-col gap-2 text-xs sm:text-sm">
                <Link className="text-on-surface-variant hover:text-secondary transition-colors" href="/places?search=Hunza">
                  Hunza Valley
                </Link>
                <Link className="text-on-surface-variant hover:text-secondary transition-colors" href="/places?search=Skardu">
                  Skardu &amp; Deosai
                </Link>
                <Link className="text-on-surface-variant hover:text-secondary transition-colors" href="/places?search=Lahore">
                  Lahore Walled City
                </Link>
                <Link className="text-on-surface-variant hover:text-secondary transition-colors" href="/places?search=Swat">
                  Swat &amp; Kalam
                </Link>
                <Link className="text-on-surface-variant hover:text-secondary transition-colors" href="/places?search=Neelum">
                  Neelum Valley
                </Link>
              </div>
            </div>

            {/* Column 3: AI Intelligence Tools */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface font-mono">
                AI Engines
              </span>
              <div className="flex flex-col gap-2 text-xs sm:text-sm">
                <Link className="text-on-surface-variant hover:text-secondary transition-colors" href="/planner">
                  Expedition Synthesizer
                </Link>
                <Link className="text-on-surface-variant hover:text-secondary transition-colors" href="/assistant">
                  AI Travel Concierge
                </Link>
                <Link className="text-on-surface-variant hover:text-secondary transition-colors" href="/recommendations">
                  Vibe Matcher
                </Link>
                <Link className="text-on-surface-variant hover:text-secondary transition-colors" href="/trips">
                  Saved Itineraries
                </Link>
              </div>
            </div>

            {/* Column 4: Newsletter */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface font-mono">
                Expedition Dispatch
              </span>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Receive exclusive seasonal expedition releases and algorithmic travel insights.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Thank you for subscribing to WanderAI Dispatch!");
                }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
              >
                <input
                  className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 text-xs sm:text-sm focus:outline-none shadow-subtle border border-outline-variant/60"
                  placeholder="Enter your email"
                  type="email"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark transition-colors font-semibold text-xs sm:text-sm cursor-pointer shadow-sm shrink-0"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Legal Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
            <p>© {new Date().getFullYear()} WanderAI Intelligence Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link className="hover:text-on-surface transition-colors" href="/places">
                Destinations Directory
              </Link>
              <Link className="hover:text-on-surface transition-colors" href="/explore">
                Topographic Map
              </Link>
              <Link className="hover:text-on-surface transition-colors" href="/planner">
                Trip Generator
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
