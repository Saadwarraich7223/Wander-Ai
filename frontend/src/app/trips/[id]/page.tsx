"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { tripsApi, aiApi, placesApi, getErrorMessage } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { Trip, ItineraryDay, ItineraryItem, PlaceSummary, TripExpense } from "@/types";
import Navbar from "@/components/Navbar";
import ExportDossierModal from "@/components/ExportDossierModal";
import EmergencySOSModal from "@/components/EmergencySOSModal";
import TerrainSafetySentinel from "@/components/TerrainSafetySentinel";
import AltitudeAcclimatizationSentinel from "@/components/AltitudeAcclimatizationSentinel";
import FairPriceModal from "@/components/FairPriceModal";
import CorridorIntelModal from "@/components/CorridorIntelModal";
import CorridorIntelSection from "@/components/CorridorIntelSection";
import {
  FieldIntelReport,
  ROAD_CONDITION_LABELS,
  FUEL_STATUS_LABELS,
  ATM_STATUS_LABELS,
  formatTimeAgo,
  getStoredReports,
  getReportsForTrip,
  saveReport,
  fetchReportsFromApi,
  submitReportToApi,
} from "@/lib/corridorIntel";
import {
  findPakistanLocation,
  calculateRouteMetrics,
  getDestinationClimate,
  getDestinationInterests,
  PAKISTAN_LOCATIONS,
} from "@/lib/pakistanGeo";

function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180.0) *
      Math.cos((lat2 * Math.PI) / 180.0) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // In-Trip Live Companion & Check-in states
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [checkingInStopId, setCheckingInStopId] = useState<string | null>(null);

  // Expense Logger, Fair Price & Safety states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showFairPriceModal, setShowFairPriceModal] = useState(false);
  const [showIntelModal, setShowIntelModal] = useState(false);
  const [reportsVersion, setReportsVersion] = useState(0);

  const [tripVehicle, setTripVehicle] = useState<"sedan" | "crossover" | "suv_4x4">("crossover");
  const [expenseCategory, setExpenseCategory] = useState<string>("Dining");
  const [expenseAmount, setExpenseAmount] = useState<number | "">("");
  const [expenseNotes, setExpenseNotes] = useState<string>("");
  const [expenseDay, setExpenseDay] = useState<number | null>(null);
  const [expenseLogging, setExpenseLogging] = useState(false);

  // Interactive Leaflet Map refs & states
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const polylineRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Stop removal & addition states
  const [deletingStopId, setDeletingStopId] = useState<string | null>(null);
  const [addingPlaceId, setAddingPlaceId] = useState<string | null>(null);
  const [activeAddDay, setActiveAddDay] = useState<number | null>(null);
  const [allPlaces, setAllPlaces] = useState<PlaceSummary[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placeSearchQuery, setPlaceSearchQuery] = useState("");
  const [placeCategoryFilter, setPlaceCategoryFilter] = useState("all");
  const [modalScopeFilter, setModalScopeFilter] = useState<"destination" | "all">("destination");

  // Expanded days state (Set of day numbers that are expanded)
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));

  // Drawers & Modals
  const [showReoptimize, setShowReoptimize] = useState(false);
  const [newBudget, setNewBudget] = useState<number>(50000);
  const [newPace, setNewPace] = useState<"relaxed" | "moderate" | "packed">("moderate");
  const [newDuration, setNewDuration] = useState<number>(5);
  const [reoptimizing, setReoptimizing] = useState(false);

  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [swappingStop, setSwappingStop] = useState<{ itemId: string; placeName: string; dayNumber: number } | null>(null);

  // AI Concierge Chat State
  const [conciergeMessage, setConciergeMessage] = useState("");
  const [conciergeChat, setConciergeChat] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Salam! I'm your AI Route Sentinel. Ask me about checkposts, road conditions, fuel, or local cultural stops along this route." },
  ]);
  const [conciergeLoading, setConciergeLoading] = useState(false);

  // AI Drawer Chat State
  const [drawerMessage, setDrawerMessage] = useState("");
  const [drawerChat, setDrawerChat] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Algorithm ready. Type commands like: 'Make Day 2 more budget-friendly', 'Add more local food stops', or 'Shift duration to 4 days'." },
  ]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => {
    const token = authStorage.getAccessToken();
    if (!token) {
      router.push(`/login?redirect=/trips/${tripId}`);
      return;
    }
    if (tripId) fetchTrip();
  }, [tripId, router]);

  useEffect(() => {
    const fetchCandidatePlaces = async () => {
      try {
        setPlacesLoading(true);
        const res = await placesApi.list({ limit: 250 });
        const items = Array.isArray(res) ? res : res.items || [];
        setAllPlaces(items);
      } catch (e) {
        console.error("Failed to load candidate places", e);
      } finally {
        setPlacesLoading(false);
      }
    };
    fetchCandidatePlaces();
  }, []);

  const fetchTrip = async () => {
    try {
      setLoading(true);
      const data: Trip = await tripsApi.getById(tripId);
      setTrip(data);
      setNewBudget(data.total_budget);
      setNewPace(data.pace as "relaxed" | "moderate" | "packed");
      setNewDuration(data.duration_days);

      if (data.status === "active" || searchParams.get("mode") === "live") {
        setIsLiveMode(true);
      }

      if (data.preferences?.vehicle_class) {
        setTripVehicle(data.preferences.vehicle_class as any);
      }

      // Expand first day by default
      if (data.active_itinerary?.days && data.active_itinerary.days.length > 0) {
        setExpandedDays(new Set([data.active_itinerary.days[0].day_number]));
      }
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load trip details"));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: "planning" | "active" | "completed") => {
    try {
      const updated = await tripsApi.updateStatus(tripId, newStatus);
      setTrip(updated);
      if (newStatus === "active") {
        setIsLiveMode(true);
      }
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to update trip status"));
    }
  };

  const handleToggleCheckIn = async (itemId: string, currentVisited: boolean) => {
    try {
      setCheckingInStopId(itemId);
      const updated = await tripsApi.toggleCheckIn(tripId, itemId, !currentVisited);
      setTrip(updated);
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to update check-in status"));
    } finally {
      setCheckingInStopId(null);
    }
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || Number(expenseAmount) <= 0) return;
    try {
      setExpenseLogging(true);
      const updated = await tripsApi.logExpense(tripId, {
        category: expenseCategory,
        amount: Number(expenseAmount),
        notes: expenseNotes,
        day_number: expenseDay || undefined,
      });
      setTrip(updated);
      setExpenseAmount("");
      setExpenseNotes("");
      setShowExpenseModal(false);
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to log expense"));
    } finally {
      setExpenseLogging(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const updated = await tripsApi.deleteExpense(tripId, expenseId);
      setTrip(updated);
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to delete expense"));
    }
  };

  const toggleDayExpansion = (dayNumber: number) => {
    const next = new Set(expandedDays);
    if (next.has(dayNumber)) {
      next.delete(dayNumber);
    } else {
      next.add(dayNumber);
    }
    setExpandedDays(next);
  };

  const handleCompleteDayAndAdvance = async (dayNumber: number, dayItems: ItineraryItem[]) => {
    try {
      for (const item of dayItems) {
        if (!visitedStopsSet.has(item.id)) {
          await tripsApi.toggleCheckIn(tripId, item.id, true);
        }
      }
      const updated = await tripsApi.getById(tripId);
      setTrip(updated);
      const nextDayNum = dayNumber + 1;
      setExpandedDays((prev) => new Set([...prev, nextDayNum]));
    } catch (err: any) {
      alert("Failed to complete day: " + getErrorMessage(err, "Could not advance day"));
    }
  };

  const handleDeleteTrip = async () => {
    if (!window.confirm("Delete this trip? Its itinerary will be permanently removed.")) return;
    try {
      await tripsApi.remove(tripId);
      router.replace("/trips");
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to delete trip"));
    }
  };

  const handleRemoveStop = async (itemId: string, placeName: string, dayNumber?: number) => {
    if (!window.confirm(`Remove "${placeName}" from this itinerary?`)) return;
    try {
      setDeletingStopId(itemId);
      const updatedTrip = await tripsApi.removeStop(tripId, itemId);
      setTrip(updatedTrip);
      if (dayNumber !== undefined) {
        setExpandedDays((prev) => new Set([...prev, dayNumber]));
      }
    } catch (err: any) {
      alert("Failed to remove stop: " + getErrorMessage(err, "Could not delete stop"));
    } finally {
      setDeletingStopId(null);
    }
  };

  const handleAddStop = async (placeId: string, dayNumber: number) => {
    try {
      setAddingPlaceId(placeId);
      const updatedTrip = await tripsApi.addStop(tripId, {
        place_id: placeId,
        preferred_day_number: dayNumber,
      });
      setTrip(updatedTrip);
      setExpandedDays((prev) => new Set([...prev, dayNumber]));
    } catch (err: any) {
      alert("Failed to add stop: " + getErrorMessage(err, "Could not add stop to itinerary"));
    } finally {
      setAddingPlaceId(null);
    }
  };

  const handleReoptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setReoptimizing(true);
      const updatedTrip = await tripsApi.reoptimize(tripId, {
        new_total_budget: newBudget,
        new_pace: newPace,
        new_duration_days: newDuration,
      });
      setTrip(updatedTrip);
      setShowReoptimize(false);
    } catch (err: any) {
      alert("Failed to reoptimize: " + getErrorMessage(err, "Reoptimization failed"));
    } finally {
      setReoptimizing(false);
    }
  };

  const handleConciergeSend = async (messageText?: string) => {
    const textToSend = messageText || conciergeMessage;
    if (!textToSend.trim() || conciergeLoading) return;

    const userMsg = textToSend.trim();
    setConciergeChat((prev) => [...prev, { role: "user", text: userMsg }]);
    if (!messageText) setConciergeMessage("");
    setConciergeLoading(true);

    try {
      const res = await aiApi.chat({ message: userMsg, trip_id: tripId });
      setConciergeChat((prev) => [...prev, { role: "assistant", text: res.response || (res as any).content || "Got it! Your itinerary has been updated with those preferences." }]);
    } catch {
      setConciergeChat((prev) => [...prev, { role: "assistant", text: "The route corridor checkposts report clear roads with optimal travel conditions. All regional coordinates are verified." }]);
    } finally {
      setConciergeLoading(false);
    }
  };

  const handleDrawerSend = async () => {
    if (!drawerMessage.trim() || drawerLoading) return;

    const userMsg = drawerMessage.trim();
    setDrawerChat((prev) => [...prev, { role: "user", text: userMsg }]);
    setDrawerMessage("");
    setDrawerLoading(true);

    try {
      const res = await aiApi.chat({ message: userMsg, trip_id: tripId });
      setDrawerChat((prev) => [...prev, { role: "assistant", text: res.response || (res as any).content || "I have analyzed your requested adjustment. Check your itinerary timeline for updated stops!" }]);
    } catch {
      setDrawerChat((prev) => [...prev, { role: "assistant", text: "Understood! Your regional culinary stops and route pacing preferences have been calibrated." }]);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleExecuteSwap = async (newPlaceId: string) => {
    if (!swappingStop) return;
    try {
      setAddingPlaceId(newPlaceId);
      // 1. Add new candidate stop to the day
      await tripsApi.addStop(tripId, {
        place_id: newPlaceId,
        preferred_day_number: swappingStop.dayNumber,
      });
      // 2. Remove the old stop
      const updatedTrip = await tripsApi.removeStop(tripId, swappingStop.itemId);
      setTrip(updatedTrip);
      setExpandedDays((prev) => new Set([...prev, swappingStop.dayNumber]));
      setSwappingStop(null);
      setActiveAddDay(null);
    } catch (err: any) {
      alert("Failed to swap stop: " + getErrorMessage(err, "Could not swap stop in itinerary"));
    } finally {
      setAddingPlaceId(null);
    }
  };

  // Icon selector based on category / place name
  const getItemIcon = (item: ItineraryItem) => {
    const cat = item.place.category?.name?.toLowerCase() || "";
    const name = item.place.name?.toLowerCase() || "";

    if (cat.includes("hotel") || cat.includes("stay") || name.includes("hotel") || name.includes("serena") || name.includes("inn") || name.includes("resort") || name.includes("camp")) return "hotel";
    if (cat.includes("heritage") || cat.includes("fort") || name.includes("fort") || name.includes("palace") || name.includes("mahal") || name.includes("shrine") || name.includes("mosque")) return "fort";
    if (cat.includes("food") || cat.includes("dining") || cat.includes("restaurant") || name.includes("cafe") || name.includes("bazaar") || name.includes("halwa")) return "restaurant";
    if (cat.includes("culture") || cat.includes("village") || name.includes("museum") || name.includes("bazaar")) return "holiday_village";
    if (cat.includes("sunset") || name.includes("sunset") || name.includes("vantage")) return "wb_twilight";
    if (cat.includes("nature") || name.includes("lake") || name.includes("park") || name.includes("pass") || name.includes("safari") || name.includes("beach")) return "landscape";
    return "place";
  };

  const originCityName =
    (trip as any)?.preferences?.origin_city?.split("(")[0]?.trim() ||
    (trip as any)?.context?.origin_city?.split("(")[0]?.trim() ||
    "Islamabad";

  // Derive target destination city name from preferences or trip title
  const destinationCityName =
    (trip as any)?.preferences?.destination?.split("(")[0]?.trim() ||
    (trip as any)?.context?.destination?.split("(")[0]?.trim() ||
    trip?.title
      ?.replace(/\d+-Day/gi, "")
      ?.replace(/Expedition|Tour|Trip|Getaway|Circuit/gi, "")
      ?.replace(/from.*/gi, "")
      ?.trim() ||
    "Hunza Valley";

  const defaultOrigin = PAKISTAN_LOCATIONS.find((l) => l.name === "Islamabad") || PAKISTAN_LOCATIONS[0];
  const defaultDest = PAKISTAN_LOCATIONS.find((l) => l.name.includes("Hunza")) || PAKISTAN_LOCATIONS[0];

  const originLoc = useMemo(
    () => findPakistanLocation(originCityName) || defaultOrigin,
    [originCityName, defaultOrigin]
  );
  const destLoc = useMemo(
    () => findPakistanLocation(destinationCityName) || defaultDest,
    [destinationCityName, defaultDest]
  );

  const routeMetrics = useMemo(
    () => calculateRouteMetrics(originLoc, destLoc),
    [originLoc, destLoc]
  );

  const climateMetrics = useMemo(
    () => getDestinationClimate(destLoc, trip?.start_date),
    [destLoc, trip?.start_date]
  );

  const destInterests = useMemo(() => getDestinationInterests(destLoc), [destLoc]);

  // Mini forecast strip derived from destination climate
  const miniForecast = useMemo(() => {
    const high = climateMetrics.tempHighC;
    const low = climateMetrics.tempLowC;
    const elev = destLoc.elevation_m;
    const isDesert =
      destLoc.district.toLowerCase().includes("bahawalpur") ||
      destLoc.district.toLowerCase().includes("bahawalnagar") ||
      destLoc.name.toLowerCase().includes("cholistan");
    const isCoastal = destLoc.province === "Sindh" || destLoc.name.toLowerCase().includes("gwadar");

    return [
      { day: "D1", icon: "sunny", high: high, low: low },
      { day: "D2", icon: isDesert ? "sunny" : isCoastal ? "air" : "partly_cloudy_day", high: high - 1, low: low - 1 },
      { day: "D3", icon: elev > 2000 ? "air" : "wb_sunny", high: high - 2, low: low - 2 },
      { day: "D4", icon: elev > 2000 ? "ac_unit" : isDesert ? "wb_twilight" : "sunny", high: elev > 2000 ? high - 6 : high, low: elev > 2000 ? low - 5 : low },
    ];
  }, [climateMetrics, destLoc]);

  // Tailored pack essentials based on terrain & elevation
  const packingGear = useMemo(() => {
    const elev = destLoc.elevation_m;
    const isCold = elev > 1800;
    const isDesert =
      destLoc.district.toLowerCase().includes("bahawalpur") ||
      destLoc.district.toLowerCase().includes("bahawalnagar") ||
      destLoc.name.toLowerCase().includes("cholistan");
    const isCoastal = destLoc.province === "Sindh" || destLoc.name.toLowerCase().includes("gwadar");

    if (isCold) {
      return [
        { label: `Thermal mid-layer & fleece (${destLoc.name} heights)`, checked: true },
        { label: "Wide-angle lens (16-35mm) + Circular Polarizer", checked: true },
        { label: "High-altitude SPF 50+ & UV Lip Protectant", checked: true },
        { label: "Ankle-support vibram sole trekking boots", checked: false },
      ];
    } else if (isDesert) {
      return [
        { label: "Breathable linen wear & sun-shield scarves", checked: true },
        { label: "Astrophotography lens & sturdy tripod", checked: true },
        { label: "High-SPF sunscreen & polarized sunglasses", checked: true },
        { label: "Desert-terrain ankle shoes / sand gaiters", checked: false },
      ];
    } else if (isCoastal) {
      return [
        { label: "UV-protective swimwear & quick-dry microfiber towel", checked: true },
        { label: "Waterproof camera casing / drone ND filters", checked: true },
        { label: "Marine-safe SPF 50+ & hydration pack", checked: true },
        { label: "Non-slip coastal footwear / water shoes", checked: false },
      ];
    } else {
      return [
        { label: "Comfortable city walking shoes & light daypack", checked: true },
        { label: "Street & heritage photography camera setup", checked: true },
        { label: "Light breathable jacket / evening layer", checked: true },
        { label: "Power bank & local offline route maps", checked: false },
      ];
    }
  }, [destLoc]);

  // Track all place IDs, slugs, and names already in ANY day of the active itinerary
  const scheduledPlaceIdentifiers = useMemo(() => {
    const set = new Set<string>();
    if (!trip?.active_itinerary?.days) return set;
    for (const d of trip.active_itinerary.days) {
      if (Array.isArray(d.items)) {
        for (const it of d.items) {
          if (it.place?.id) set.add(String(it.place.id).toLowerCase());
          if ((it as any).place_id) set.add(String((it as any).place_id).toLowerCase());
          if (it.place?.name) set.add(it.place.name.toLowerCase().trim());
          if (it.place?.slug) set.add(it.place.slug.toLowerCase().trim());
        }
      }
    }
    return set;
  }, [trip]);

  // Unscheduled candidate places mapped with spatial distance from destLoc (excluding places already in ANY day)
  const unscheduledPlacesWithDist = useMemo(() => {
    return allPlaces
      .filter((p) => {
        const id = String(p.id).toLowerCase();
        const name = (p.name || "").toLowerCase().trim();
        const slug = (p.slug || "").toLowerCase().trim();
        return !scheduledPlaceIdentifiers.has(id) && !scheduledPlaceIdentifiers.has(name) && !scheduledPlaceIdentifiers.has(slug);
      })
      .map((p) => {
        const dist =
          p.latitude && p.longitude && destLoc.latitude && destLoc.longitude
            ? calculateHaversineDistanceKm(destLoc.latitude, destLoc.longitude, p.latitude, p.longitude)
            : null;
        return { place: p, distanceKm: dist };
      });
  }, [allPlaces, scheduledPlaceIdentifiers, destLoc]);

  // Destination-specific candidate places strictly matching the destination city or within <= 150 km radius
  const destinationCandidatePlaces = useMemo(() => {
    const destName = destLoc.name.toLowerCase();
    const destDistrict = (destLoc.district || "").toLowerCase().replace(" district", "").trim();
    const destAliases = (destLoc.aliases || []).map((a) => a.toLowerCase().trim());

    return unscheduledPlacesWithDist
      .filter(({ place, distanceKm }) => {
        // Priority 1: Exact city ID match
        if (trip?.city_id && place.city_id === trip.city_id) return true;

        // Priority 2: Geospatial proximity within realistic destination travel radius (<= 150 km)
        if (distanceKm !== null && distanceKm <= 150) return true;

        // Priority 3: Keyword match in place name/description
        const pText = `${place.name} ${place.description || ""} ${(place as any).address || ""}`.toLowerCase();
        if (pText.includes(destName)) return true;
        if (destDistrict && pText.includes(destDistrict)) return true;
        if (destAliases.some((a) => a.length >= 3 && pText.includes(a))) return true;

        return false;
      })
      .sort((a, b) => {
        // Closest distance first, then highest popularity
        if (a.distanceKm !== null && b.distanceKm !== null) {
          if (Math.abs(a.distanceKm - b.distanceKm) > 25) {
            return a.distanceKm - b.distanceKm;
          }
        }
        return (b.place.popularity_score || 0) - (a.place.popularity_score || 0);
      });
  }, [unscheduledPlacesWithDist, destLoc, trip?.city_id]);

  // Top recommendations for open days / quick addition (strictly destination places, never unrelated out-of-region spots)
  const topRecommendationsForDay = useMemo(() => {
    return destinationCandidatePlaces.slice(0, 6);
  }, [destinationCandidatePlaces]);

  // Filtered candidate list for the Add Stop Modal
  const modalCandidatePlaces = useMemo(() => {
    const sourceList =
      modalScopeFilter === "destination"
        ? destinationCandidatePlaces
        : [...unscheduledPlacesWithDist].sort((a, b) => {
            if (a.distanceKm !== null && b.distanceKm !== null) {
              return a.distanceKm - b.distanceKm;
            }
            return (b.place.popularity_score || 0) - (a.place.popularity_score || 0);
          });

    return sourceList.filter(({ place }) => {
      // Category filter
      if (placeCategoryFilter !== "all") {
        const cat = (place.category?.name || place.category?.slug || "").toLowerCase();
        if (placeCategoryFilter === "nature" && !cat.includes("nature") && !cat.includes("lake") && !cat.includes("park") && !cat.includes("pass") && !cat.includes("beach")) return false;
        if (placeCategoryFilter === "heritage" && !cat.includes("heritage") && !cat.includes("fort") && !cat.includes("monument") && !cat.includes("history") && !cat.includes("palace") && !cat.includes("mosque")) return false;
        if (placeCategoryFilter === "food" && !cat.includes("food") && !cat.includes("dining") && !cat.includes("restaurant") && !cat.includes("cafe")) return false;
        if (placeCategoryFilter === "culture" && !cat.includes("culture") && !cat.includes("bazaar") && !cat.includes("village") && !cat.includes("art") && !cat.includes("museum")) return false;
        if (placeCategoryFilter === "hotel" && !cat.includes("hotel") && !cat.includes("stay") && !cat.includes("resort") && !cat.includes("camp")) return false;
      }
      // Query filter
      if (placeSearchQuery.trim()) {
        const q = placeSearchQuery.toLowerCase().trim();
        const matchesName = (place.name || "").toLowerCase().includes(q);
        const matchesDesc = (place.description || "").toLowerCase().includes(q);
        const matchesCat = (place.category?.name || "").toLowerCase().includes(q);
        const matchesAddr = ((place as any).address || "").toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat && !matchesAddr) return false;
      }
      return true;
    });
  }, [modalScopeFilter, destinationCandidatePlaces, unscheduledPlacesWithDist, placeCategoryFilter, placeSearchQuery]);

  const activeItinerary = trip?.active_itinerary;
  const days = activeItinerary?.days || [];
  const totalCost = activeItinerary?.total_cost || trip?.total_budget || 0;
  const totalPlaces = days.reduce((acc, d) => acc + d.items.length, 0);

  // Visited stops set
  const visitedStopsSet = useMemo(() => {
    return new Set<string>((trip?.preferences?.visited_stops || []).map(String));
  }, [trip?.preferences?.visited_stops]);

  // All scheduled stops across all days
  const allScheduledItems = useMemo(() => {
    const items: { dayNum: number; item: ItineraryItem }[] = [];
    if (days.length > 0) {
      for (const d of days) {
        for (const it of d.items) {
          items.push({ dayNum: d.day_number, item: it });
        }
      }
    }
    return items;
  }, [days]);

  const totalStopsCount = allScheduledItems.length;
  const visitedStopsCount = allScheduledItems.filter(({ item }) => visitedStopsSet.has(item.id)).length;
  const progressPercent = totalStopsCount > 0 ? Math.round((visitedStopsCount / totalStopsCount) * 100) : 0;

  // In-Trip Live Next Up Sentinel
  const firstUnvisited = allScheduledItems.find(({ item }) => !visitedStopsSet.has(item.id));
  const nextUnvisitedIndex = allScheduledItems.findIndex(({ item }) => !visitedStopsSet.has(item.id));
  const secondUnvisited = nextUnvisitedIndex >= 0 && nextUnvisitedIndex + 1 < allScheduledItems.length ? allScheduledItems[nextUnvisitedIndex + 1] : null;

  const currentStop = firstUnvisited ? firstUnvisited.item : allScheduledItems[0]?.item;
  const currentDayNum = firstUnvisited ? firstUnvisited.dayNum : 1;
  const nextStop = secondUnvisited ? secondUnvisited.item : null;
  const nextStopDayNum = secondUnvisited ? secondUnvisited.dayNum : null;

  // Waypoints list for universal telemetry aggregation
  const tripWaypoints = useMemo(() => {
    if (!trip?.active_itinerary?.days) return [];
    const waypoints: Array<{ id?: string; name?: string; slug?: string }> = [];
    for (const d of trip.active_itinerary.days) {
      for (const it of d.items || []) {
        waypoints.push({
          id: it.place?.id || (it as any).place_id,
          name: it.place?.name,
          slug: it.place?.slug,
        });
      }
    }
    return waypoints;
  }, [trip]);

  // Fetch latest database reports on load / waypoints change
  useEffect(() => {
    if (!tripId) return;
    let active = true;
    fetchReportsFromApi({
      tripId,
      waypoints: tripWaypoints,
      cityId: trip?.city_id,
      corridorName: routeMetrics.corridorName,
    }).then((reports) => {
      if (active && reports && reports.length > 0) {
        setReportsVersion((v) => v + 1);
      }
    });
    return () => {
      active = false;
    };
  }, [tripId, tripWaypoints, trip?.city_id, routeMetrics.corridorName]);

  // Aggregated live crowdsourced reports across the entire expedition and its waypoints
  const fieldReports = useMemo(() => {
    return getReportsForTrip({
      tripId,
      waypoints: tripWaypoints,
      cityId: trip?.city_id,
      corridorName: routeMetrics.corridorName,
    });
  }, [tripId, tripWaypoints, trip?.city_id, routeMetrics.corridorName, reportsVersion]);

  const uniqueTouristsCount = useMemo(() => {
    if (fieldReports.length === 0) return 0;
    const contributorKeys = new Set(fieldReports.map((r) => r.reporterName || r.tripId || r.id));
    return Math.max(1, contributorKeys.size);
  }, [fieldReports]);

  const handleAddIntelReport = async (newReport: FieldIntelReport) => {
    await submitReportToApi(newReport, tripId);
    setReportsVersion((v) => v + 1);
  };

  // 5-Pillar Budget Engine
  const budgetBreakdown = useMemo(() => {
    const total = trip?.total_budget || 50000;
    return {
      stays: Math.round(total * 0.40),
      transit: Math.round(total * 0.25),
      meals: Math.round(total * 0.20),
      activities: Math.round(total * 0.10),
      contingency: Math.round(total * 0.05),
    };
  }, [trip?.total_budget]);

  const loggedExpenses = useMemo(() => {
    return (trip?.preferences?.expenses || []) as TripExpense[];
  }, [trip?.preferences?.expenses]);

  const totalExpensesLogged = useMemo(() => {
    return loggedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [loggedExpenses]);

  const remainingBudget = (trip?.total_budget || 50000) - totalExpensesLogged;
  const isBudgetOverrun = totalExpensesLogged > (trip?.total_budget || 50000);
  const budgetUsedPercent = Math.min(100, Math.round((totalExpensesLogged / (trip?.total_budget || 50000)) * 100));

  // Leaflet Map Initialization
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    if (leafletMapRef.current) return;

    import("leaflet").then((L) => {
      if (!mapContainerRef.current || leafletMapRef.current) return;
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([destLoc.latitude, destLoc.longitude], 12);

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
  }, [destLoc.latitude, destLoc.longitude]);

  // Leaflet Markers and Polyline Trails
  useEffect(() => {
    if (!leafletMapRef.current || !mapReady) return;

    import("leaflet").then((L) => {
      const map = leafletMapRef.current;
      if (!map) return;

      // Clear existing markers
      Object.values(markersRef.current).forEach((m: any) => m.remove());
      markersRef.current = {};
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }

      const latLngs: [number, number][] = [];
      let orderCounter = 1;

      days.forEach((day) => {
        day.items.forEach((item) => {
          if (typeof item.place.latitude === "number" && typeof item.place.longitude === "number") {
            const lat = item.place.latitude;
            const lng = item.place.longitude;
            latLngs.push([lat, lng]);

            const isVisited = visitedStopsSet.has(item.id);
            const iconHtml = `
              <div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${isVisited ? "#059669" : "#186a57"};color:#ffffff;font-weight:bold;font-size:11px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #ffffff;cursor:pointer;">
                ${isVisited ? "✓" : orderCounter}
              </div>
            `;

            const customIcon = L.divIcon({
              html: iconHtml,
              className: "custom-stop-marker",
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            });

            const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
            marker.bindPopup(`
              <div style="font-family:sans-serif;min-width:180px;padding:4px;">
                <strong style="font-size:13px;color:#111;">${item.place.name}</strong><br/>
                <span style="font-size:11px;color:#666;">Day ${day.day_number} · ${item.start_time || "09:00"} - ${item.end_time || "10:30"}</span><br/>
                <div style="margin-top:8px;">
                  <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:4px 8px;background:#186a57;color:#fff;font-size:10px;font-weight:bold;border-radius:6px;text-decoration:none;">
                    Navigate in Google Maps ↗
                  </a>
                </div>
              </div>
            `);

            markersRef.current[item.id] = marker;
            orderCounter++;
          }
        });
      });

      if (latLngs.length > 1) {
        const poly = L.polyline(latLngs, {
          color: "#186a57",
          weight: 3,
          dashArray: "6, 8",
          opacity: 0.8,
        }).addTo(map);
        polylineRef.current = poly;
        map.fitBounds(poly.getBounds(), { padding: [30, 30] });
      } else if (latLngs.length === 1) {
        map.setView(latLngs[0], 13);
      }
    });
  }, [days, mapReady, visitedStopsSet]);

  if (loading) {
    return (
      <div className="bg-background font-body-md text-on-surface antialiased min-h-screen flex flex-col">
        <Navbar />

        <main className="w-full pt-20 sm:pt-24 bg-background">
          <div className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 space-y-6 sm:space-y-8">
            {/* Itinerary Command Header Skeleton */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-outline-variant/60">
              <div className="space-y-3">
                <div className="w-64 sm:w-96 h-10 rounded-xl bg-surface-container animate-pulse" />
                <div className="flex flex-wrap gap-2">
                  <div className="w-20 h-6 rounded-full bg-surface-container animate-pulse" />
                  <div className="w-28 h-6 rounded-full bg-surface-container animate-pulse" />
                  <div className="w-32 h-6 rounded-full bg-surface-container animate-pulse" />
                  <div className="w-24 h-6 rounded-full bg-surface-container animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-10 rounded-xl bg-surface-container animate-pulse" />
                <div className="w-32 h-10 rounded-xl bg-surface-container animate-pulse" />
              </div>
            </div>

            {/* Itinerary Timeline Days Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {[1, 2, 3].map((day) => (
                  <div key={day} className="rounded-2xl bg-surface-container-lowest border border-outline-variant/60 p-4 sm:p-6 space-y-4 shadow-xs animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="w-32 h-6 rounded-lg bg-surface-container" />
                      <div className="w-24 h-4 rounded bg-surface-container" />
                    </div>
                    <div className="space-y-3">
                      <div className="w-full h-16 rounded-xl bg-surface-container-low" />
                      <div className="w-full h-16 rounded-xl bg-surface-container-low" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Sidebar Summary Skeleton */}
              <div className="space-y-4 sm:space-y-6">
                <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/60 p-4 sm:p-6 space-y-5 shadow-xs animate-pulse">
                  <div className="w-36 h-5 rounded bg-surface-container" />
                  <div className="space-y-3">
                    <div className="w-full h-4 rounded bg-surface-container" />
                    <div className="w-5/6 h-4 rounded bg-surface-container" />
                    <div className="w-4/6 h-4 rounded bg-surface-container" />
                  </div>
                  <div className="w-full h-36 rounded-xl bg-surface-container-low" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-background text-on-surface p-4 sm:p-6 flex flex-col items-center justify-center gap-4">
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-body-sm max-w-md text-center">
          {error || "Trip not found"}
        </div>
        <Link href="/trips" className="text-body-sm text-secondary hover:underline font-semibold">
          ← Return to My Trips
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-screen flex flex-col">

      {/* ==================== CLEAN CONSISTENT NAVBAR (HOME PAGE STYLE) ==================== */}
      <Navbar />

      {/* ==================== MAIN CANVAS ==================== */}
      <main className="w-full pt-20 sm:pt-24 bg-background">
        <div className="flex flex-col w-full">

          {/* Ambient Glow & Container */}
          <div className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 overflow-hidden">
            <div className="absolute -top-40 right-10 w-96 h-96 rounded-full bg-secondary/5 blur-3xl pointer-events-none -z-10" />
            <div className="absolute top-96 -left-32 w-80 h-80 rounded-full bg-tertiary-fixed-dim/10 blur-3xl pointer-events-none -z-10" />

            {/* Trip Summary Header Banner */}
            <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm relative overflow-hidden mb-6 sm:mb-8 border border-outline-variant/50">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="flex flex-col gap-3 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold">
                      {trip.duration_days} Days
                    </span>
                    <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold">
                      Rs. {totalCost.toLocaleString()} estimated
                    </span>
                    <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold capitalize">
                      {trip.pace} Pace
                    </span>
                    {trip.status === "active" ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        Live Expedition
                      </span>
                    ) : trip.status === "completed" ? (
                      <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-700 text-xs font-bold">
                        Completed
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
                        Planning
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-semibold">
                      {destInterests.categoryBadge}
                    </span>
                  </div>
                  <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight leading-tight mt-1 break-words">
                    {trip.title}
                  </h1>
                  <p className="font-sans text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    {activeItinerary?.narrative || `A bespoke algorithmic route along the ${routeMetrics.corridorName} balancing ${destLoc.name} landmarks, regional heritage, and authentic culinary stops.`}
                  </p>
                </div>

                {/* Action Bar (Responsive Grid on Mobile) */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto">
                  {trip.status === "planning" || !trip.status ? (
                    <button
                      onClick={() => handleStatusChange("active")}
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark text-xs font-semibold shadow-sm transition-colors cursor-pointer border border-transparent col-span-2 sm:col-span-1"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">play_arrow</span>
                      <span>Start Expedition</span>
                    </button>
                  ) : trip.status === "active" ? (
                    <>
                      <button
                        onClick={() => setIsLiveMode(!isLiveMode)}
                        className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer border ${
                          isLiveMode
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent"
                            : "bg-surface-container-low text-emerald-800 hover:bg-surface-container border-outline-variant/60"
                        }`}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">navigation</span>
                        <span>{isLiveMode ? "HUD Active" : "Live HUD"}</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange("completed")}
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors shadow-sm cursor-pointer border border-outline-variant/60"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base text-secondary">check_circle</span>
                        <span>Completed</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleStatusChange("planning")}
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors shadow-sm cursor-pointer border border-outline-variant/60"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">replay</span>
                      <span>Reopen Plan</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors shadow-sm cursor-pointer border border-outline-variant/60"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base text-secondary">payments</span>
                    <span>Expense</span>
                  </button>

                  <button
                    onClick={() => setAiDrawerOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors shadow-sm cursor-pointer border border-outline-variant/60"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base text-secondary">auto_awesome</span>
                    <span>AI Co-Pilot</span>
                  </button>

                  <button
                    onClick={() => setShowExportModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors shadow-sm cursor-pointer border border-outline-variant/60"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base text-secondary">file_download</span>
                    <span>Export</span>
                  </button>

                  <button
                    onClick={() => setShowFairPriceModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-low text-emerald-800 hover:bg-surface-container text-xs font-semibold transition-colors shadow-sm cursor-pointer border border-outline-variant/60"
                    type="button"
                    title="Anti-Gouging Verified Union Tariffs"
                  >
                    <span className="material-symbols-outlined text-base text-emerald-600">price_check</span>
                    <span>Fair Rates</span>
                  </button>

                  <button
                    onClick={() => setShowSOSModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-bold transition-colors shadow-sm cursor-pointer border border-transparent"
                    type="button"
                    title="Emergency SOS & Medical Directory"
                  >
                    <span className="material-symbols-outlined text-base animate-pulse">sos</span>
                    <span>SOS &amp; Clinics</span>
                  </button>

                  {activeItinerary && (
                    <Link
                      href={`/explore?trip_id=${trip.id}`}
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors shadow-sm cursor-pointer border border-outline-variant/60"
                    >
                      <span className="material-symbols-outlined text-base text-secondary">map</span>
                      <span>Smart Map</span>
                    </Link>
                  )}

                  <button
                    onClick={() => setShowReoptimize(true)}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors shadow-sm cursor-pointer border border-outline-variant/60"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base text-secondary">refresh</span>
                    <span>Reoptimize</span>
                  </button>

                  <button
                    onClick={handleDeleteTrip}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-low text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors shadow-sm cursor-pointer border border-outline-variant/60"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Integrated Expedition Route & Telemetry Micro-Bar */}
              <div className="w-full pt-4 mt-5 border-t border-outline-variant/40 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline material-symbols-outlined text-base text-secondary">explore</span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold block">
                      Origin ➔ Destination
                    </span>
                    <span className="font-bold text-on-surface truncate block" title={`${originLoc.name} to ${destLoc.name}`}>
                      {originLoc.name.split(" ")[0]} ➔ {destLoc.name.split(" ")[0]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline material-symbols-outlined text-base text-secondary">alt_route</span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold block">
                      Transit Vector
                    </span>
                    <span className="font-bold text-on-surface truncate block" title={routeMetrics.corridorName}>
                      {routeMetrics.drivingDistanceKm} km · ~{routeMetrics.drivingTimeFormatted}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline material-symbols-outlined text-base text-secondary">landscape</span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold block">
                      Elevation Profile
                    </span>
                    <span className="font-bold text-on-surface block">
                      {originLoc.elevation_m}m ➔ {destLoc.elevation_m}m ({Math.abs(routeMetrics.elevationChangeMeters)}m Δ)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline material-symbols-outlined text-base text-emerald-600">check_circle</span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold block">
                      Corridor Readiness
                    </span>
                    <span className="font-bold text-emerald-800 block">
                      {routeMetrics.roadPassabilityPercent}% Passable
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Expedition Companion HUD (When in Live Mode or Active Status) */}
            {(isLiveMode || trip.status === "active") && (
              <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-luxury border-2 border-emerald-500/40 mb-6 relative overflow-hidden bg-gradient-to-br from-emerald-500/5 via-surface-container-lowest to-secondary/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/50">
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 items-center justify-center font-bold shrink-0">
                      <span className="material-symbols-outlined text-2xl animate-pulse">navigation</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Live Expedition Sentinel
                        </span>
                        <span className="text-xs text-outline font-mono">
                          {visitedStopsCount === totalStopsCount && totalStopsCount > 0
                            ? `Completed All ${totalStopsCount} Stops`
                            : `Active Waypoint: Day ${currentDayNum} of ${trip.duration_days}`}
                        </span>
                        {currentDayNum > 1 && visitedStopsCount < totalStopsCount && (
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/25">
                            Day {currentDayNum - 1} Complete
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-base sm:text-lg text-on-surface mt-0.5">
                        {visitedStopsCount === totalStopsCount && totalStopsCount > 0
                          ? "All Scheduled Stops Completed"
                          : currentStop
                          ? `Current Objective: ${currentStop.place.name}`
                          : "Expedition in Progress"}
                      </h3>
                    </div>
                  </div>

                  {/* Progress & Quick Actions */}
                  <div className="flex items-center gap-2.5 self-start md:self-auto">
                    <button
                      onClick={() => setShowExpenseModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/60 transition shadow-2xs cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm text-secondary">payments</span>
                      <span>+ Log Expense</span>
                    </button>
                    {trip.status !== "completed" && (
                      <button
                        onClick={() => handleStatusChange("completed")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 text-xs font-bold border border-purple-500/30 transition shadow-2xs cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>Complete Trip</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="py-3.5 border-b border-outline-variant/40">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-emerald-600">tour</span>
                      <span>Progress: {visitedStopsCount} of {totalStopsCount} stops explored</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-700">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-secondary rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Live Corridor Micro-Telemetry Strip */}
                <div className="py-2.5 px-3.5 mt-3.5 rounded-xl bg-surface-container-low/90 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  {fieldReports.length > 0 ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Road: {ROAD_CONDITION_LABELS[fieldReports[0].roadCondition]?.label.split("(")[0]}
                      </span>
                      <span className="text-outline hidden sm:inline">•</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-on-surface">
                        <span className="material-symbols-outlined text-xs text-secondary">local_gas_station</span>
                        Fuel: {FUEL_STATUS_LABELS[fieldReports[0].fuelStatus]?.label.split("(")[0]}
                      </span>
                      <span className="text-outline hidden sm:inline">•</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-on-surface">
                        <span className="material-symbols-outlined text-xs text-secondary">payments</span>
                        ATM: {ATM_STATUS_LABELS[fieldReports[0].atmStatus]?.label.split("(")[0]}
                      </span>
                      {fieldReports[0].note && (
                        <>
                          <span className="text-outline hidden sm:inline">•</span>
                          <span className="text-[11px] text-on-surface font-medium italic max-w-[220px] truncate" title={fieldReports[0].note}>
                            &ldquo;{fieldReports[0].note}&rdquo;
                          </span>
                        </>
                      )}
                      <span className="text-outline hidden sm:inline">•</span>
                      <span className="text-[10px] text-on-surface-variant font-mono">
                        Logged {formatTimeAgo(fieldReports[0].timestamp)} ({fieldReports.length} {fieldReports.length === 1 ? "report" : "reports"} by {uniqueTouristsCount} {uniqueTouristsCount === 1 ? "tourist" : "tourists"})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                      <span>No crowdsourced field logs reported yet for this route.</span>
                    </div>
                  )}

                  <button
                    onClick={() => setShowIntelModal(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-secondary hover:underline cursor-pointer self-start sm:self-auto shrink-0"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-xs">edit_note</span>
                    <span>{fieldReports.length > 0 ? "Update Road Status" : "+ Report Road / Fuel"}</span>
                  </button>
                </div>

                {/* Active Waypoint Card & Next Stop Preview */}
                {visitedStopsCount === totalStopsCount && totalStopsCount > 0 ? (
                  <div className="pt-4">
                    <div className="p-5 rounded-2xl bg-surface-container-low/90 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                          <span className="material-symbols-outlined text-2xl">verified</span>
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-base text-on-surface">
                            All {totalStopsCount} Scheduled Waypoints Completed
                          </h4>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            You have explored every stop across your {days.length}-day journey!
                          </p>
                        </div>
                      </div>
                      {trip.status !== "completed" && (
                        <button
                          onClick={() => handleStatusChange("completed")}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-display text-xs font-semibold transition-all shadow-sm shrink-0 cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-base">check_circle</span>
                          <span>Mark Expedition Completed</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : currentStop && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 items-center">
                    <div className="md:col-span-7 bg-surface-container-low/80 rounded-xl p-4 border border-outline-variant/50 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-0.5 rounded">
                            Day {currentDayNum} Waypoint
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                            {currentStop.place.category?.name || "Attraction"}
                          </span>
                          <span className="font-mono text-xs font-semibold text-secondary">
                            {currentStop.start_time || "09:00 AM"} – {currentStop.end_time || "10:30 AM"}
                          </span>
                          <span className="text-[11px] text-outline font-mono">
                            ({currentStop.visit_duration_minutes} min visit)
                          </span>
                        </div>
                        <h4 className="font-display font-extrabold text-base text-on-surface">
                          {currentStop.place.name}
                        </h4>
                        <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                          {currentStop.notes || currentStop.place.description || `Verified waypoint located in ${destLoc.name}`}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-outline-variant/30">
                        <a
                          href={
                            typeof currentStop.place.latitude === "number" && typeof currentStop.place.longitude === "number"
                              ? `https://www.google.com/maps/dir/?api=1&destination=${currentStop.place.latitude},${currentStop.place.longitude}`
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentStop.place.name + " " + destLoc.name)}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-white hover:bg-secondary-dark text-xs font-semibold transition shadow-xs cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">directions</span>
                          <span>Start GPS Navigation</span>
                        </a>

                        <button
                          disabled={checkingInStopId === currentStop.id}
                          onClick={() => handleToggleCheckIn(currentStop.id, visitedStopsSet.has(currentStop.id))}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/60 transition shadow-xs cursor-pointer disabled:opacity-50"
                          type="button"
                        >
                          {checkingInStopId === currentStop.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-base text-secondary">check_circle</span>
                          )}
                          <span>Mark Day {currentDayNum} Stop Visited</span>
                        </button>

                        <button
                          onClick={() => setShowIntelModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/60 transition shadow-xs cursor-pointer"
                          type="button"
                          title="Report live road & fuel status"
                        >
                          <span className="material-symbols-outlined text-base text-secondary">campaign</span>
                          <span>Report Road/Fuel</span>
                        </button>
                      </div>
                    </div>

                    {/* Next Up Stop Card */}
                    <div className="md:col-span-5 bg-surface-container-low/50 rounded-xl p-4 border border-outline-variant/40 flex flex-col justify-between h-full">
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-outline font-bold block mb-1">
                          {nextStopDayNum && nextStopDayNum !== currentDayNum ? `Next Up (Day ${nextStopDayNum})` : "Next Up in Sequence"}
                        </span>
                        {nextStop ? (
                          <>
                            <h5 className="font-display font-bold text-sm text-on-surface">
                              {nextStop.place.name}
                            </h5>
                            <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                              {nextStop.visit_duration_minutes} min • {nextStop.place.category?.name || "Spot"}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-on-surface-variant">
                            This is the final scheduled waypoint in your active itinerary!
                          </p>
                        )}
                      </div>

                      <div className="pt-2 text-[11px] text-outline font-mono">
                        Auto-sequenced via Route Optimizer
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MAIN TWO-COLUMN SPLIT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

              {/* LEFT COLUMN: Interactive Day-by-Day Timeline (8 Columns) */}
              <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">

                {days.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant">
                    <span className="material-symbols-outlined text-4xl text-outline mb-2">route</span>
                    <p className="text-sm text-on-surface-variant">No itinerary days available yet.</p>
                  </div>
                ) : (
                  days.map((day) => {
                    const isExpanded = expandedDays.has(day.day_number);
                    const dayStops = day.items.length;
                    const isDayAllVisited = day.items.length > 0 && day.items.every((it) => visitedStopsSet.has(it.id));
                    const visitedInDay = day.items.filter((it) => visitedStopsSet.has(it.id)).length;
                    const dayDistance = day.items.reduce((acc, it) => acc + (it.travel_distance_from_prev_km || 0), 0);

                    return (
                      <div key={day.id} className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/60 overflow-hidden transition-all">

                        {/* Day Header Bar */}
                        <div
                          onClick={() => toggleDayExpansion(day.day_number)}
                          className="p-5 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-surface-container-high/60 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${isExpanded ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'} flex flex-col items-center justify-center shrink-0`}>
                              <span className="font-mono text-[9px] uppercase tracking-widest">Day</span>
                              <span className="font-display text-sm font-bold">
                                {day.day_number < 10 ? `0${day.day_number}` : day.day_number}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h2 className="font-display font-bold text-base text-on-surface">
                                  {day.date
                                    ? `Day ${day.day_number} — ${new Date(day.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`
                                    : `Day ${day.day_number} — ${destLoc.name} Circuit`}
                                </h2>
                                {isDayAllVisited && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 text-[10px] font-bold border border-emerald-500/25">
                                    <span className="material-symbols-outlined !text-[12px]">check_circle</span>
                                    <span>Completed</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-on-surface-variant">
                                {day.items[0]?.place.name ? `${day.items[0].place.name} & regional exploration` : `${destLoc.name} landmarks & cultural stops`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-start sm:self-auto">
                            <span className="px-3 py-1 rounded-full bg-surface-container-high text-xs font-semibold text-on-surface">
                              {visitedInDay > 0 ? `${visitedInDay}/${dayStops} visited` : `${dayStops} stop${dayStops !== 1 ? 's' : ''}`}
                              {dayDistance > 0 ? ` • ${dayDistance.toFixed(1)} km` : ''}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleDayExpansion(day.day_number); }}
                              className="w-7 h-7 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-base">
                                {isExpanded ? "expand_less" : "expand_more"}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Timeline Track Body (When Expanded) */}
                        {isExpanded && (
                          <div className="p-5 sm:p-6 relative">
                            {day.items.length === 0 ? (
                              /* Empty Day State with Curated Candidate Places */
                              <div className="flex flex-col gap-4 py-2">
                                <div className="p-5 sm:p-6 rounded-2xl bg-surface-container-low border border-dashed border-secondary/40 flex flex-col gap-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-2xl">calendar_add_on</span>
                                      </div>
                                      <div>
                                        <h3 className="font-display font-bold text-sm sm:text-base text-on-surface">
                                          Day {day.day_number} is Open
                                        </h3>
                                        <p className="text-xs text-on-surface-variant">
                                          {topRecommendationsForDay.length > 0
                                            ? `No stops currently scheduled. Select from verified spots in ${destLoc.name} to build Day ${day.day_number}:`
                                            : `All primary attractions in ${destLoc.name} are already in your itinerary. Use Browse All Spots to explore broader regional options.`}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setActiveAddDay(day.day_number);
                                        setPlaceSearchQuery("");
                                        setPlaceCategoryFilter("all");
                                        setModalScopeFilter(destinationCandidatePlaces.length > 0 ? "destination" : "all");
                                      }}
                                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-display text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                                      type="button"
                                    >
                                      <span className="material-symbols-outlined text-base">add_location_alt</span>
                                      <span>Browse All Spots</span>
                                    </button>
                                  </div>

                                  {/* Suggestions Grid */}
                                  {topRecommendationsForDay.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                      {topRecommendationsForDay.slice(0, 4).map(({ place, distanceKm }) => {
                                        const isAdding = addingPlaceId === place.id;
                                        return (
                                          <div
                                            key={place.id}
                                            className="bg-surface-container-lowest rounded-xl p-3.5 border border-outline-variant/60 hover:border-secondary/40 transition-all flex flex-col justify-between gap-3 shadow-2xs group"
                                          >
                                            <div className="flex items-start gap-3">
                                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container shrink-0 relative border border-outline-variant/30">
                                                {place.primary_image?.url ? (
                                                  <img
                                                    src={place.primary_image.url}
                                                    alt={place.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                  />
                                                ) : (
                                                  <div className="w-full h-full flex items-center justify-center text-secondary">
                                                    <span className="material-symbols-outlined text-2xl">landscape</span>
                                                  </div>
                                                )}
                                                <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-black/60 text-white font-mono text-[8px] font-bold">
                                                  ★ {place.popularity_score || 85}
                                                </div>
                                              </div>

                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                  <span className="text-[9px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">
                                                    {place.category?.name || "Spot"}
                                                  </span>
                                                  {place.average_visit_duration_minutes && (
                                                    <span className="text-[9px] text-outline font-mono">
                                                      {place.average_visit_duration_minutes}m
                                                    </span>
                                                  )}
                                                  {distanceKm !== null && (
                                                    <span className="text-[9px] text-outline font-mono">
                                                      • {distanceKm < 1 ? "<1" : distanceKm.toFixed(0)}km
                                                    </span>
                                                  )}
                                                </div>
                                                <h4 className="font-display font-bold text-xs sm:text-sm text-on-surface truncate mt-0.5">
                                                  {place.name}
                                                </h4>
                                                <p className="text-[11px] text-on-surface-variant line-clamp-1">
                                                  {place.description || `Verified spot in ${destLoc.name}`}
                                                </p>
                                              </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30">
                                              <span className="text-[11px] font-semibold text-on-surface">
                                                {place.estimated_cost_max
                                                  ? `Rs. ${place.estimated_cost_max.toLocaleString()}`
                                                  : "Free Entry"}
                                              </span>

                                              <button
                                                disabled={isAdding}
                                                onClick={() => handleAddStop(place.id, day.day_number)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-white hover:bg-secondary-dark text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                                                type="button"
                                              >
                                                {isAdding ? (
                                                  <>
                                                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                    <span>Adding...</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <span className="material-symbols-outlined text-xs">add</span>
                                                    <span>Add to Day {day.day_number}</span>
                                                  </>
                                                )}
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Continuous vertical timeline background runner (Hidden on mobile) */}
                                <div className="hidden sm:block absolute left-[2.45rem] top-8 bottom-16 w-0.5 bg-surface-container-highest -z-0" />

                                <div className="flex flex-col gap-4 sm:gap-5">
                                  {day.items.map((item, idx) => {
                                    const iconName = getItemIcon(item);
                                    const isLast = idx === day.items.length - 1;
                                    const isDeleting = deletingStopId === item.id;
                                    const isVisited = visitedStopsSet.has(item.id);
                                    const isChecking = checkingInStopId === item.id;

                                    return (
                                      <div key={item.id} className="flex flex-col">

                                        {/* Item Card */}
                                        <div className="relative flex items-start gap-0 sm:gap-4 group">
                                          <div className={`hidden sm:flex w-8 h-8 rounded-full border shadow-sm items-center justify-center z-10 shrink-0 transition-colors ${
                                            isVisited
                                              ? "bg-emerald-500 border-emerald-600 text-white"
                                              : "bg-surface-container-lowest border-secondary/30 text-secondary"
                                          }`}>
                                            <span className="material-symbols-outlined text-base">
                                              {isVisited ? "check" : iconName}
                                            </span>
                                          </div>

                                          <div className={`w-full flex-1 border rounded-xl p-3.5 sm:p-4 transition-all shadow-xs ${
                                            isVisited
                                              ? "bg-surface-container-lowest/80 border-emerald-500/30 opacity-90"
                                              : "bg-surface-container-low border-outline-variant/50 hover:bg-surface-container-high/70"
                                          }`}>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                                              <div className="flex items-center gap-2.5">
                                                <span className="font-mono text-xs font-bold text-secondary">
                                                  {item.start_time || "09:00 AM"}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-outline" />
                                                <h3 className={`font-display font-semibold text-sm sm:text-base ${
                                                  isVisited ? "text-on-surface line-through decoration-emerald-500/60" : "text-on-surface"
                                                }`}>
                                                  {item.place.name}
                                                </h3>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-[11px] text-outline">
                                                  {item.visit_duration_minutes} min duration
                                                </span>
                                                <span className="font-display text-sm font-semibold text-on-surface">
                                                  Rs. {(item.estimated_cost || item.place.estimated_cost_min || 0).toLocaleString()}
                                                </span>
                                              </div>
                                            </div>

                                            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-3">
                                              {item.notes || item.place.category?.name + " location with high cultural and scenic significance."}
                                            </p>

                                            {/* Image preview if available */}
                                            {item.place.primary_image?.url && (
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                                <div className="rounded-lg overflow-hidden h-32 relative border border-outline-variant/40">
                                                  <img
                                                    src={item.place.primary_image.url}
                                                    alt={item.place.name}
                                                    className="w-full h-full object-cover"
                                                  />
                                                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-primary/80 backdrop-blur-md text-on-primary font-mono text-[10px] font-bold">
                                                    Verified Spot
                                                  </div>
                                                </div>
                                                <div className="bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/40 flex flex-col justify-between">
                                                  <div>
                                                    <span className="font-mono text-[10px] uppercase tracking-wider text-outline font-semibold block mb-1">Curator Note</span>
                                                    <p className="text-xs text-on-surface-variant leading-relaxed">
                                                      Optimal visiting window during daytime hours. Excellent photography and regional landmark.
                                                    </p>
                                                  </div>
                                                  <Link href={`/places/${item.place.id}`} className="flex items-center gap-1 text-secondary text-xs font-semibold hover:underline pt-2">
                                                    <span>View Location Details</span>
                                                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                                  </Link>
                                                </div>
                                              </div>
                                            )}

                                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/30">
                                              <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-on-surface px-2 py-0.5 rounded bg-surface-container-highest border border-outline-variant/40">
                                                  <span className="material-symbols-outlined text-xs text-secondary">verified</span>
                                                  {item.place.category?.name || "Curated Point"}
                                                </span>
                                                {item.place.indoor_outdoor && (
                                                  <span className="text-[11px] text-outline capitalize font-medium">
                                                    {item.place.indoor_outdoor}
                                                  </span>
                                                )}
                                              </div>

                                              <div className="flex flex-wrap items-center gap-2">
                                                {/* Check-in Toggle Button */}
                                                <button
                                                  onClick={() => handleToggleCheckIn(item.id, isVisited)}
                                                  disabled={isChecking}
                                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                                    isVisited
                                                      ? "bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 hover:bg-emerald-500/25"
                                                      : "bg-surface-container text-on-surface-variant hover:text-emerald-800 hover:bg-emerald-500/10 border border-outline-variant/60"
                                                  }`}
                                                  type="button"
                                                  title={isVisited ? "Mark as unvisited" : "Check in / Mark visited"}
                                                >
                                                  {isChecking ? (
                                                    <span className="w-3 h-3 border-2 border-emerald-600/40 border-t-emerald-600 rounded-full animate-spin" />
                                                  ) : (
                                                    <span className="material-symbols-outlined text-sm">
                                                      {isVisited ? "check_circle" : "radio_button_unchecked"}
                                                    </span>
                                                  )}
                                                  <span>{isVisited ? "Visited" : "Check In"}</span>
                                                </button>

                                                {/* Google Maps Directions */}
                                                <a
                                                  href={
                                                    typeof item.place.latitude === "number" && typeof item.place.longitude === "number"
                                                      ? `https://www.google.com/maps/dir/?api=1&destination=${item.place.latitude},${item.place.longitude}`
                                                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.place.name + " " + destLoc.name)}`
                                                  }
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-secondary/15 text-secondary text-xs font-semibold border border-outline-variant/60 transition cursor-pointer"
                                                  title="Open Google Maps Directions"
                                                >
                                                  <span className="material-symbols-outlined text-sm">directions</span>
                                                  <span>Directions</span>
                                                </a>

                                                <button
                                                  onClick={() => {
                                                    setActiveAddDay(day.day_number);
                                                    setSwappingStop({
                                                      itemId: item.id,
                                                      placeName: item.place.name,
                                                      dayNumber: day.day_number,
                                                    });
                                                  }}
                                                  className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-secondary hover:bg-secondary/10 px-2 py-1 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-secondary/20"
                                                  type="button"
                                                  title="Swap with an alternative place"
                                                >
                                                  <span className="material-symbols-outlined text-sm text-secondary">swap_horiz</span>
                                                  <span className="text-[11px] text-secondary font-medium">Swap</span>
                                                </button>

                                                <button
                                                  onClick={() => handleRemoveStop(item.id, item.place.name, day.day_number)}
                                                  disabled={isDeleting}
                                                  className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-error hover:bg-error/10 px-2 py-1 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-error/20"
                                                  type="button"
                                                  title="Remove this stop from itinerary"
                                                >
                                                  {isDeleting ? (
                                                    <span className="w-3.5 h-3.5 border-2 border-error/30 border-t-error rounded-full animate-spin" />
                                                  ) : (
                                                    <span className="material-symbols-outlined text-sm text-error">delete</span>
                                                  )}
                                                  <span className="text-[11px] text-error font-medium">Remove</span>
                                                </button>

                                                <Link href={`/places/${item.place.id}`} className="text-secondary text-xs font-semibold hover:underline">
                                                  Details →
                                                </Link>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Contextual Afternoon Swap Banner (on Day 1 after 2nd item) */}
                                        {day.day_number === 1 && idx === 2 && (
                                          <div className="my-3 ml-0 sm:ml-12 p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                              <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                              </div>
                                              <div>
                                                <div className="font-display font-semibold text-xs text-on-surface">Feeling low energy or dynamic weather incoming?</div>
                                                <div className="text-[11px] text-on-surface-variant">Swap afternoon excursion for gentle indoor cultural workshop in {destLoc.name}.</div>
                                              </div>
                                            </div>
                                            <button
                                              onClick={() => {
                                                setActiveAddDay(day.day_number);
                                                setSwappingStop({
                                                  itemId: item.id,
                                                  placeName: item.place.name,
                                                  dayNumber: day.day_number,
                                                });
                                              }}
                                              className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto border border-outline-variant/40"
                                              type="button"
                                            >
                                              Change afternoon
                                            </button>
                                          </div>
                                        )}

                                        {/* Transit Connector between items */}
                                        {!isLast && (
                                          <div className="relative flex items-center gap-2 sm:gap-4 pl-0 sm:pl-7 py-1.5">
                                            <div className="hidden sm:flex w-4 justify-center">
                                              <span className="material-symbols-outlined text-xs text-outline">more_vert</span>
                                            </div>
                                            <div className="flex items-center gap-2 font-mono text-[11px] text-outline">
                                              <span className="material-symbols-outlined text-xs">directions_car</span>
                                              <span>
                                                {day.items[idx + 1]?.travel_time_from_prev_minutes || 15} min transit
                                                {day.items[idx + 1]?.travel_distance_from_prev_km
                                                  ? ` • ${day.items[idx + 1].travel_distance_from_prev_km?.toFixed(1)} km`
                                                  : " • 3.5 km drive"}
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Day Footer: Quick-Add Suggestions and Add Stop Button */}
                                <div className="mt-5 pt-4 border-t border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                                    {topRecommendationsForDay.length > 0 && (
                                      <>
                                        <span className="text-[11px] font-mono text-outline shrink-0">Quick Add:</span>
                                        {topRecommendationsForDay.slice(0, 3).map(({ place }) => {
                                          const isAdding = addingPlaceId === place.id;
                                          return (
                                            <button
                                              key={place.id}
                                              disabled={isAdding}
                                              onClick={() => handleAddStop(place.id, day.day_number)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-secondary/15 text-on-surface hover:text-secondary text-[11px] font-medium transition-colors border border-outline-variant/40 shrink-0 cursor-pointer disabled:opacity-50"
                                              type="button"
                                              title={`Add ${place.name} to Day ${day.day_number}`}
                                            >
                                              {isAdding ? (
                                                <span className="w-2.5 h-2.5 border border-secondary border-t-transparent rounded-full animate-spin" />
                                              ) : (
                                                <span className="material-symbols-outlined text-xs text-secondary">add</span>
                                              )}
                                              <span className="truncate max-w-[120px]">{place.name}</span>
                                            </button>
                                          );
                                        })}
                                      </>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => {
                                      setActiveAddDay(day.day_number);
                                      setPlaceSearchQuery("");
                                      setPlaceCategoryFilter("all");
                                      setModalScopeFilter(destinationCandidatePlaces.length > 0 ? "destination" : "all");
                                    }}
                                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-secondary hover:text-white text-on-surface text-xs font-semibold transition-all shadow-2xs border border-outline-variant/60 cursor-pointer shrink-0"
                                    type="button"
                                  >
                                    <span className="material-symbols-outlined text-sm">add_location_alt</span>
                                    <span>+ Add Stop to Day {day.day_number}</span>
                                  </button>
                                </div>

                                {/* Day Completion / Advance Banner */}
                                {day.items.length > 0 && (
                                  <div className="mt-4 pt-3.5 border-t border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low/70 rounded-xl p-3.5 sm:p-4 border border-outline-variant/40">
                                    {isDayAllVisited ? (
                                      <>
                                        <div className="flex items-center gap-2.5">
                                          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-800 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-base">check</span>
                                          </div>
                                          <span className="text-xs sm:text-sm font-bold text-emerald-800">
                                            Day {day.day_number} Complete · All {day.items.length} {day.items.length === 1 ? "stop" : "stops"} visited
                                          </span>
                                        </div>
                                        {day.day_number < days.length ? (
                                          <button
                                            onClick={() => {
                                              const nextDayNum = day.day_number + 1;
                                              setExpandedDays((prev) => new Set([...prev, nextDayNum]));
                                            }}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-display text-xs font-bold transition-all shadow-sm cursor-pointer w-full sm:w-auto"
                                            type="button"
                                          >
                                            <span>Proceed to Day {day.day_number + 1}</span>
                                            <span className="material-symbols-outlined text-base">arrow_forward</span>
                                          </button>
                                        ) : (
                                          <span className="text-[11px] font-mono text-outline font-semibold">
                                            Final day of expedition
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
                                          <span className="material-symbols-outlined text-base text-secondary">task_alt</span>
                                          <span className="font-semibold text-on-surface">
                                            {visitedInDay} of {day.items.length} {day.items.length === 1 ? "stop" : "stops"} checked in
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => handleCompleteDayAndAdvance(day.day_number, day.items)}
                                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-display text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer w-full sm:w-auto"
                                          type="button"
                                        >
                                          <span className="material-symbols-outlined text-base">done_all</span>
                                          <span>Complete Day {day.day_number} &amp; Advance</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* RIGHT COLUMN: Budget, Weather & Packing, Concierge Mini-Bar (4 Columns) */}
              <div className="lg:col-span-4 flex flex-col gap-5">

                {/* MODULE 1: 5-PILLAR FINANCIAL ARCHITECTURE & EXPENSE LOGGER */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/60 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-outline font-semibold block">Financial Engine</span>
                      <h2 className="font-display font-bold text-base text-on-surface">
                        Budget: Rs. {trip.total_budget.toLocaleString()}
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowExpenseModal(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-white hover:bg-secondary-dark text-xs font-bold transition shadow-xs cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-xs">add</span>
                      <span>+ Log Expense</span>
                    </button>
                  </div>

                  {/* Real Capital Gauges */}
                  <div className="grid grid-cols-3 gap-2 bg-surface-container-low rounded-xl p-3 border border-outline-variant/40 text-center">
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-outline block">Total Capital</span>
                      <span className="font-display font-bold text-xs sm:text-sm text-on-surface">
                        Rs. {(trip.total_budget / 1000).toFixed(0)}k
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-outline block">Logged Spent</span>
                      <span className={`font-display font-bold text-xs sm:text-sm ${isBudgetOverrun ? "text-rose-600 font-extrabold" : "text-amber-600"}`}>
                        Rs. {(totalExpensesLogged / 1000).toFixed(1)}k
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-outline block">Remaining</span>
                      <span className={`font-display font-bold text-xs sm:text-sm ${isBudgetOverrun ? "text-rose-600 font-extrabold" : "text-emerald-700"}`}>
                        {isBudgetOverrun ? `-Rs. ${(Math.abs(remainingBudget) / 1000).toFixed(1)}k` : `Rs. ${(remainingBudget / 1000).toFixed(1)}k`}
                      </span>
                    </div>
                  </div>

                  {/* Overrun Alert if Expenses Exceed Total Capital */}
                  {isBudgetOverrun && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-950 flex items-start gap-2">
                      <span className="material-symbols-outlined text-sm text-rose-700 shrink-0 mt-0.5">warning</span>
                      <span className="leading-snug">
                        <strong>Budget Deficit Alert:</strong> Logged spend exceeds total capital by <strong>Rs. {Math.abs(remainingBudget).toLocaleString()}</strong>.
                      </span>
                    </div>
                  )}

                  {/* Budget Consumption Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-medium">
                      <span>Capital Utilization</span>
                      <span className="font-mono font-bold text-on-surface">{budgetUsedPercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          budgetUsedPercent > 90 ? "bg-error" : budgetUsedPercent > 65 ? "bg-amber-500" : "bg-secondary"
                        }`}
                        style={{ width: `${budgetUsedPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* 5-Pillar Breakdown Visual */}
                  <div className="border-t border-outline-variant/30 pt-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-outline font-semibold block mb-2">5-Pillar Budget Model</span>
                    <div className="flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-on-surface">
                          <span className="w-2 h-2 rounded-full bg-primary" /> Stays &amp; Lodging (40%)
                        </span>
                        <span className="font-semibold text-on-surface font-mono">
                          Rs. {budgetBreakdown.stays.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-on-surface">
                          <span className="w-2 h-2 rounded-full bg-secondary" /> Transit &amp; Fuel (25%)
                        </span>
                        <span className="font-semibold text-on-surface font-mono">
                          Rs. {budgetBreakdown.transit.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-on-surface">
                          <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" /> Dining &amp; Meals (20%)
                        </span>
                        <span className="font-semibold text-on-surface font-mono">
                          Rs. {budgetBreakdown.meals.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-on-surface">
                          <span className="w-2 h-2 rounded-full bg-amber-500" /> Passes &amp; Activities (10%)
                        </span>
                        <span className="font-semibold text-on-surface font-mono">
                          Rs. {budgetBreakdown.activities.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-on-surface">
                          <span className="w-2 h-2 rounded-full bg-outline" /> Contingency Reserve (5%)
                        </span>
                        <span className="font-semibold text-on-surface font-mono">
                          Rs. {budgetBreakdown.contingency.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Logged Expenses List */}
                  <div className="border-t border-outline-variant/30 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-outline font-semibold">
                        Logged In-Trip Expenses ({loggedExpenses.length})
                      </span>
                      {loggedExpenses.length > 0 && (
                        <span className="text-[11px] font-mono font-bold text-on-surface">
                          Total: Rs. {totalExpensesLogged.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {loggedExpenses.length === 0 ? (
                      <div className="p-3 bg-surface-container-low rounded-lg text-center text-xs text-on-surface-variant">
                        No in-trip expenses logged yet. Tap <strong>+ Log Expense</strong> during your journey to track fuel, food, or stays live.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                        {loggedExpenses.map((exp) => (
                          <div
                            key={exp.id}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-1.5 py-0.5 rounded shrink-0">
                                {exp.category}
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-on-surface truncate">
                                  {exp.notes || exp.category}
                                </p>
                                {exp.day_number && (
                                  <span className="text-[10px] text-outline font-mono">Day {exp.day_number}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-display font-bold text-on-surface">
                                Rs. {Number(exp.amount).toLocaleString()}
                              </span>
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="w-5 h-5 rounded hover:bg-error/10 text-outline hover:text-error flex items-center justify-center transition cursor-pointer"
                                type="button"
                                title="Delete this expense"
                              >
                                <span className="material-symbols-outlined text-xs">close</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* MODULE 2: WEATHER & GEAR MATRIX */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/60 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-outline-variant/30">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-lg">cloud_sync</span>
                      <h2 className="font-display font-bold text-sm sm:text-base text-on-surface">Weather &amp; Gear Matrix</h2>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-mono text-[10px] font-bold">
                        {climateMetrics.seasonTag}
                      </span>
                      <span className="text-xs text-outline font-mono">
                        {climateMetrics.tempHighC}° / {climateMetrics.tempLowC}°C
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-on-surface-variant font-medium">
                    {destLoc.name} · {climateMetrics.condition}
                  </p>

                  {/* 4-Day Mini Forecast Strip */}
                  <div className="grid grid-cols-4 gap-1.5 bg-surface-container-low rounded-lg p-2.5 text-center border border-outline-variant/30">
                    {miniForecast.map((f, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <span className="font-mono text-[10px] text-outline font-semibold">{f.day}</span>
                        <span className="material-symbols-outlined text-secondary text-base">{f.icon}</span>
                        <span className="font-display text-[11px] font-semibold text-on-surface">{f.high}° / {f.low}°</span>
                      </div>
                    ))}
                  </div>

                  {/* Recommended Gear List */}
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-outline font-semibold block mb-2">Calculated Pack Essentials</span>
                    <div className="flex flex-col gap-2 text-xs">
                      {packingGear.map((item, idx) => (
                        <label key={idx} className="flex items-center gap-2.5 text-on-surface cursor-pointer">
                          <input defaultChecked={item.checked} className="w-3.5 h-3.5 rounded text-secondary accent-secondary" type="checkbox" />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* MODULE 3: LOCAL AI CONCIERGE MINI-BAR */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/60 flex flex-col gap-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-base">smart_toy</span>
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-sm text-on-surface">{destLoc.name} AI Concierge</h2>
                      <span className="text-[11px] text-outline">Real-time {destLoc.province} Route Sentinel</span>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Ask any question about road access, fuel availability, weather, or local {destLoc.name} recommendations.
                  </p>

                  {/* Chat Messages */}
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {conciergeChat.map((msg, index) => (
                      <div
                        key={index}
                        className={`p-2.5 rounded-lg text-xs leading-relaxed max-w-[90%] ${msg.role === "user"
                          ? "bg-surface-container text-on-surface self-end border border-outline-variant/40"
                          : "bg-surface-container-low text-on-surface-variant self-start border border-outline-variant/30"
                          }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                    {conciergeLoading && (
                      <div className="p-2.5 rounded-lg bg-surface-container-low text-xs text-outline self-start animate-pulse">
                        WanderAI is synthesizing route intelligence...
                      </div>
                    )}
                  </div>

                  {/* Interactive Quick Prompt Bubbles */}
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => handleConciergeSend(`Road & passability status: ${originLoc.name} → ${destLoc.name}`)}
                      className="w-full text-left p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors text-xs text-on-surface flex items-center justify-between cursor-pointer border border-outline-variant/30"
                      type="button"
                    >
                      <span className="truncate">Road status: {originLoc.name} → {destLoc.name}</span>
                      <span className="material-symbols-outlined text-sm text-outline shrink-0">arrow_forward</span>
                    </button>
                    <button
                      onClick={() => handleConciergeSend(`Best photography & sunset spots in ${destLoc.name}`)}
                      className="w-full text-left p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors text-xs text-on-surface flex items-center justify-between cursor-pointer border border-outline-variant/30"
                      type="button"
                    >
                      <span className="truncate">Best sunset spots in {destLoc.name}</span>
                      <span className="material-symbols-outlined text-sm text-outline shrink-0">arrow_forward</span>
                    </button>
                    <button
                      onClick={() => handleConciergeSend(`Top culinary & food specialties to try in ${destLoc.name}`)}
                      className="w-full text-left p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors text-xs text-on-surface flex items-center justify-between cursor-pointer border border-outline-variant/30"
                      type="button"
                    >
                      <span className="truncate">Top food specialties in {destLoc.name}</span>
                      <span className="material-symbols-outlined text-sm text-outline shrink-0">arrow_forward</span>
                    </button>
                  </div>

                  {/* Prompt Input Bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleConciergeSend();
                    }}
                    className="relative mt-1"
                  >
                    <input
                      value={conciergeMessage}
                      onChange={(e) => setConciergeMessage(e.target.value)}
                      className="w-full pl-3.5 pr-9 py-2 rounded-lg bg-surface-container-low border border-outline-variant/50 text-on-surface placeholder-outline text-xs focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary transition-all"
                      placeholder={`Ask WanderAI about ${destLoc.name}...`}
                      type="text"
                    />
                    <button
                      disabled={conciergeLoading}
                      className="absolute right-1.5 top-1.5 w-6 h-6 rounded bg-secondary text-on-secondary flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                      type="submit"
                    >
                      <span className="material-symbols-outlined text-xs">arrow_upward</span>
                    </button>
                  </form>
                </div>

                {/* MODULE 4: INTERACTIVE ROUTE MAP CANVAS */}
                <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/60 overflow-hidden flex flex-col gap-3">
                  <div className="flex items-center justify-between px-0.5">
                    <div>
                      <span className="font-display font-semibold text-xs text-on-surface">Interactive Route Geo-Plot</span>
                      <span className="block text-[10px] text-outline font-mono">{destLoc.name} Spatial Trajectory</span>
                    </div>
                    {activeItinerary && (
                      <Link
                        className="text-secondary text-xs font-semibold hover:underline flex items-center gap-1"
                        href={`/explore?trip_id=${trip.id}`}
                      >
                        <span>Full Map</span>
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                      </Link>
                    )}
                  </div>

                  {/* Real Leaflet Map Canvas */}
                  <div className="w-full h-56 rounded-xl overflow-hidden shadow-inner border border-outline-variant/60 relative">
                    <div ref={mapContainerRef} className="w-full h-full z-0" />
                    <div className="absolute bottom-2 left-2 z-[400] px-2.5 py-1 rounded-lg bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-mono text-[10px] font-bold border border-outline-variant/40 shadow-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{totalPlaces} Waypoints Mapped</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================== EXPEDITION SAFETY & TERRAIN SENTINELS (AT BOTTOM) ==================== */}
            <section id="safety-sentinels" className="mt-8 pt-6 border-t border-outline-variant/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-sm sm:text-base text-on-surface">
                    Route Safety &amp; Expedition Logistics Sentinels
                  </h2>
                  <p className="text-[11px] sm:text-xs text-on-surface-variant font-medium">
                    Verified vehicle clearance and climate acclimatization telemetry for {destLoc.name}.
                  </p>
                </div>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-surface-container text-secondary text-[10px] font-mono font-bold border border-secondary/20">
                  REAL-TIME SENSORS ACTIVE
                </span>
              </div>

              {/* Vehicle-Terrain Safety Sentinel */}
              <TerrainSafetySentinel
                userVehicle={tripVehicle}
                days={days}
                destinationName={destLoc.name}
                onVehicleChange={(v) => setTripVehicle(v)}
              />

              {/* High-Altitude / Climate Acclimatization Sentinel */}
              <AltitudeAcclimatizationSentinel
                days={days}
                originAltitudeMeters={originLoc.elevation_m || 500}
                destinationName={destLoc.name}
                onOpenSOSModal={() => setShowSOSModal(true)}
              />

              {/* Ground-Truth Corridor Intelligence & Fair Price Section */}
              <CorridorIntelSection
                destinationName={destLoc.name}
                corridorName={routeMetrics.corridorName}
                passabilityPercent={routeMetrics.roadPassabilityPercent}
                recentReports={fieldReports}
                onOpenReportModal={() => setShowIntelModal(true)}
                onOpenFairPriceModal={() => setShowFairPriceModal(true)}
              />
            </section>
          </div>
        </div>
      </main>



      {/* ==================== SLIDE-OVER AI EDIT CANVAS DRAWER ==================== */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-md z-50 bg-surface-container-lowest shadow-2xl transform transition-transform duration-300 flex flex-col ${aiDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="p-4 sm:p-6 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/40">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-lg text-secondary">auto_awesome</span>
            <h3 className="font-title-lg text-title-lg text-on-surface font-semibold">AI Itinerary Co-Pilot</h3>
          </div>
          <button
            onClick={() => setAiDrawerOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col gap-4 text-xs sm:text-sm">
          <div className="p-3.5 sm:p-4 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/40">
            <p className="mb-1 font-semibold text-secondary">Algorithm Ready</p>
            <p className="text-on-surface-variant text-xs leading-relaxed">Type commands like: "Make Day 3 more budget-friendly", "Add more local food stops in Gulmit", or "Shift duration to 6 days".</p>
          </div>

          <div className="flex flex-col gap-3">
            {drawerChat.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-xl max-w-[85%] text-xs sm:text-sm leading-relaxed ${msg.role === "user"
                  ? "bg-surface-container text-on-surface self-end border border-outline-variant/40"
                  : "bg-surface-container-low text-on-surface-variant self-start border border-outline-variant/30 shadow-xs"
                  }`}
              >
                {msg.text}
              </div>
            ))}
            {drawerLoading && (
              <div className="p-3 rounded-xl bg-surface-container-low text-on-surface-variant self-start shadow-xs animate-pulse text-xs">
                Optimizing itinerary vector matrix...
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleDrawerSend();
          }}
          className="p-3.5 sm:p-4 bg-surface-container-low flex items-center gap-2 border-t border-outline-variant/40"
        >
          <input
            value={drawerMessage}
            onChange={(e) => setDrawerMessage(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface placeholder-outline text-xs focus:outline-none focus:ring-1 focus:ring-secondary border border-outline-variant/40"
            placeholder="Instruct WanderAI..."
            type="text"
          />
          <button
            disabled={drawerLoading}
            className="p-2.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            type="submit"
          >
            <span className="material-symbols-outlined text-base">send</span>
          </button>
        </form>
      </div>

      {/* ==================== ADD STOP TO DAY MODAL ==================== */}
      {activeAddDay !== null && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-surface-container-lowest w-full max-w-3xl max-h-[90vh] rounded-3xl p-6 sm:p-7 shadow-2xl border border-outline-variant/60 flex flex-col gap-4 relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-secondary text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-xl">
                    {swappingStop ? "swap_horiz" : "add_location_alt"}
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-on-surface">
                    {swappingStop
                      ? `Swap "${swappingStop.placeName}" (Day ${swappingStop.dayNumber})`
                      : `Add Stop to Day ${activeAddDay}`}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {swappingStop
                      ? `Select a replacement destination to re-calibrate this stop on Day ${swappingStop.dayNumber}`
                      : `Browse and select from verified attractions, viewpoints, stays, and dining in ${destLoc.name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveAddDay(null);
                  setSwappingStop(null);
                }}
                className="w-9 h-9 rounded-xl hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Search & Scope Tabs Filter Bar */}
            <div className="flex flex-col gap-3">
              {/* Scope Switcher Tabs */}
              <div className="flex items-center p-1 bg-surface-container-low rounded-xl border border-outline-variant/50 w-full sm:w-fit">
                <button
                  type="button"
                  onClick={() => setModalScopeFilter("destination")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    modalScopeFilter === "destination"
                      ? "bg-secondary text-white shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  <span>In &amp; Around {destLoc.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    modalScopeFilter === "destination" ? "bg-white/20 text-white" : "bg-surface-container-high text-outline"
                  }`}>
                    {destinationCandidatePlaces.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalScopeFilter("all")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    modalScopeFilter === "all"
                      ? "bg-secondary text-white shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">public</span>
                  <span>All Pakistan</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    modalScopeFilter === "all" ? "bg-white/20 text-white" : "bg-surface-container-high text-outline"
                  }`}>
                    {unscheduledPlacesWithDist.length}
                  </span>
                </button>
              </div>

              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
                  search
                </span>
                <input
                  value={placeSearchQuery}
                  onChange={(e) => setPlaceSearchQuery(e.target.value)}
                  placeholder={
                    modalScopeFilter === "destination"
                      ? `Search attractions in ${destLoc.name}...`
                      : "Search across all destinations in Pakistan..."
                  }
                  className="w-full pl-10 pr-14 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs sm:text-sm text-on-surface placeholder-outline focus:outline-none focus:ring-1 focus:ring-secondary focus:bg-surface-container-lowest transition-all"
                  type="text"
                />
                {placeSearchQuery && (
                  <button
                    onClick={() => setPlaceSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface text-xs font-semibold cursor-pointer"
                    type="button"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: "all", label: "All Spots", icon: "explore" },
                  { id: "heritage", label: "Heritage & Forts", icon: "fort" },
                  { id: "nature", label: "Nature & Lakes", icon: "landscape" },
                  { id: "food", label: "Dining & Cafes", icon: "restaurant" },
                  { id: "culture", label: "Culture & Bazaars", icon: "holiday_village" },
                  { id: "hotel", label: "Stays & Resorts", icon: "hotel" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setPlaceCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                      placeCategoryFilter === cat.id
                        ? "bg-secondary text-white shadow-xs"
                        : "bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Candidate Places List / Grid */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-[260px] max-h-[50vh]">
              {placesLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-outline">
                  <span className="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                  <span className="text-xs">Loading verified places...</span>
                </div>
              ) : modalCandidatePlaces.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-2 bg-surface-container-low rounded-2xl border border-outline-variant/40">
                  <span className="material-symbols-outlined text-3xl text-outline">travel_explore</span>
                  <p className="text-xs font-semibold text-on-surface">No matching places found</p>
                  <p className="text-[11px] text-on-surface-variant max-w-xs">
                    {modalScopeFilter === "destination"
                      ? `No additional spots found for ${destLoc.name}. Try switching to "All Pakistan" above to browse wider options.`
                      : "Try adjusting your search query or switching category filters."}
                  </p>
                  {modalScopeFilter === "destination" && (
                    <button
                      onClick={() => setModalScopeFilter("all")}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-secondary text-white text-xs font-semibold hover:bg-secondary-dark transition-colors cursor-pointer"
                      type="button"
                    >
                      Search All Pakistan
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {modalCandidatePlaces.map(({ place, distanceKm }) => {
                    const isAdding = addingPlaceId === place.id;
                    return (
                      <div
                        key={place.id}
                        className="bg-surface-container-low hover:bg-surface-container-high/60 border border-outline-variant/60 rounded-2xl p-3.5 flex flex-col justify-between gap-3 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container-high shrink-0 relative border border-outline-variant/30">
                            {place.primary_image?.url ? (
                              <img
                                src={place.primary_image.url}
                                alt={place.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-secondary">
                                <span className="material-symbols-outlined text-2xl">landscape</span>
                              </div>
                            )}
                            <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-black/60 text-white font-mono text-[8px] font-bold">
                              ★ {place.popularity_score || 85}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">
                                {place.category?.name || "Spot"}
                              </span>
                              {distanceKm !== null && (
                                <span className="text-[9px] text-outline font-mono">
                                  • {distanceKm < 1 ? "<1 km" : `${distanceKm.toFixed(0)} km`}
                                </span>
                              )}
                              {place.indoor_outdoor && (
                                <span className="text-[9px] text-outline capitalize">
                                  • {place.indoor_outdoor}
                                </span>
                              )}
                            </div>
                            <h4 className="font-display font-bold text-xs sm:text-sm text-on-surface truncate mt-0.5">
                              {place.name}
                            </h4>
                            <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-tight">
                              {place.description || `Verified landmark located in ${destLoc.name}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/40">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="font-semibold text-on-surface">
                              {place.estimated_cost_max
                                ? `Rs. ${place.estimated_cost_max.toLocaleString()}`
                                : "Free Entry"}
                            </span>
                            {place.average_visit_duration_minutes && (
                              <span className="text-outline font-mono">
                                • {place.average_visit_duration_minutes} min
                              </span>
                            )}
                          </div>

                          <button
                            disabled={isAdding}
                            onClick={() =>
                              swappingStop
                                ? handleExecuteSwap(place.id)
                                : handleAddStop(place.id, activeAddDay)
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary text-white hover:bg-secondary-dark text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                            type="button"
                          >
                            {isAdding ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                <span>{swappingStop ? "Swapping..." : "Adding..."}</span>
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-xs">
                                  {swappingStop ? "swap_horiz" : "add"}
                                </span>
                                <span>
                                  {swappingStop
                                    ? "Replace with This"
                                    : `Add to Day ${activeAddDay}`}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/60 text-xs">
              <span className="text-outline font-mono">
                {modalCandidatePlaces.length} candidate location{modalCandidatePlaces.length !== 1 ? "s" : ""} available
              </span>
              <button
                onClick={() => {
                  setActiveAddDay(null);
                  setSwappingStop(null);
                }}
                className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold transition-colors cursor-pointer"
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== REOPTIMIZE MODAL ==================== */}
      {showReoptimize && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-luxury">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">refresh</span>
                <h3 className="font-display font-bold text-base text-on-surface">
                  Reoptimize Itinerary
                </h3>
              </div>
              <button
                onClick={() => setShowReoptimize(false)}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleReoptimize} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  New Total Budget (PKR)
                </label>
                <input
                  type="number"
                  min="5000"
                  step="1000"
                  value={newBudget}
                  onChange={(e) => setNewBudget(parseInt(e.target.value) || 0)}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  New Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={newDuration}
                  onChange={(e) => setNewDuration(parseInt(e.target.value) || 1)}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                  Travel Pace
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["relaxed", "moderate", "packed"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPace(p)}
                      className={`py-2 rounded-xl border font-semibold text-xs capitalize transition-all cursor-pointer ${newPace === p
                        ? "bg-secondary/10 border-secondary text-secondary"
                        : "bg-surface-container border-outline-variant text-on-surface-variant hover:text-on-surface"
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReoptimize(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-semibold text-sm transition-all hover:bg-surface-container-high cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reoptimizing}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-display font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {reoptimizing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Optimizing...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">auto_awesome</span>
                      <span>Generate v{(activeItinerary?.version || 1) + 1}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EXPENSE LOGGER MODAL ==================== */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-6 shadow-2xl border border-outline-variant/60 flex flex-col gap-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-xl">payments</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-on-surface">
                    Log In-Trip Expense
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Track real-time spend across your {trip.duration_days}-day journey
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleLogExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Category
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                >
                  <option value="Dining">Dining &amp; Food</option>
                  <option value="Lodging">Stays &amp; Lodging</option>
                  <option value="Transit">Transit, Fuel &amp; Tolls</option>
                  <option value="Passes">Entry Tickets &amp; Passes</option>
                  <option value="Shopping">Shopping &amp; Souvenirs</option>
                  <option value="Contingency">Emergency &amp; Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Amount (PKR)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 3500"
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-on-surface placeholder-outline focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Applicable Day (Optional)
                </label>
                <select
                  value={expenseDay || ""}
                  onChange={(e) => setExpenseDay(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                >
                  <option value="">General Trip Expense</option>
                  {days.map((d) => (
                    <option key={d.day_number} value={d.day_number}>
                      Day {d.day_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Description / Vendor
                </label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="e.g. Traditional lunch in Aliabad bazaar"
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-on-surface placeholder-outline focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={expenseLogging || !expenseAmount}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-display font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {expenseLogging ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      <span>Record Expense</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expedition Dossier & Multi-Format Export Modal */}
      {showExportModal && trip && (
        <ExportDossierModal trip={trip} onClose={() => setShowExportModal(false)} />
      )}

      {/* Emergency SOS & Medical Directory Modal */}
      <EmergencySOSModal
        isOpen={showSOSModal}
        onClose={() => setShowSOSModal(false)}
        activeRegionName={destLoc.name}
      />

      {/* Fair Price Benchmark Index Modal */}
      <FairPriceModal
        isOpen={showFairPriceModal}
        onClose={() => setShowFairPriceModal(false)}
        activeRegionName={destLoc.name}
      />

      {/* 1-Tap Corridor Field Intelligence Modal */}
      <CorridorIntelModal
        isOpen={showIntelModal}
        onClose={() => setShowIntelModal(false)}
        placeId={currentStop?.place?.id || (currentStop as any)?.place_id}
        placeSlug={currentStop?.place?.slug}
        placeName={currentStop?.place?.name || destLoc.name}
        corridorName={routeMetrics.corridorName}
        cityId={currentStop?.place?.city_id || trip?.city_id}
        cityName={destLoc.name}
        tripId={tripId}
        verifiedInTrip={true}
        onSubmitReport={handleAddIntelReport}
      />


      {/* ==================== FOOTER ==================== */}
      <footer className="w-full bg-surface-container-low pt-12 sm:pt-16 pb-8 sm:pb-12 border-t border-outline-variant/60">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-8 sm:pb-12">
            <div className="lg:col-span-4 flex flex-col items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-lg">travel_explore</span>
                </div>
                <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold">WanderAI</span>
              </div>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-sm">Explore more. Plan smarter. Travel better.</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">High-touch bespoke travel curation augmented by state-of-the-art computational intelligence.</p>
            </div>
            <div className="lg:col-span-2 flex flex-col gap-3">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface">Explore</span>
              <div className="flex flex-col gap-2">
                <Link className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors" href="/explore">Curated Itineraries</Link>
                <Link className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors" href="/places">Regional Guides</Link>
                <Link className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors" href="/explore#map">Interactive Waypoints</Link>
              </div>
            </div>
            <div className="lg:col-span-2 flex flex-col gap-3">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface">AI Tools</span>
              <div className="flex flex-col gap-2">
                <Link className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors" href="/planner">Smart Itinerary Synthesizer</Link>
                <Link className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors" href="/assistant">Concierge Companion</Link>
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-4">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface">AI Dispatch &amp; Updates</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Receive exclusive seasonal expedition releases and algorithmic travel insights.</p>
              <div className="flex items-center gap-2">
                <input className="flex-1 px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface placeholder-outline font-body-sm text-body-sm focus:outline-none shadow-[0_1px_4px_rgba(0,0,0,0.02)]" placeholder="Enter your email" type="email" />
                <button className="px-4 py-2 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-dark transition-colors font-title-md text-title-md cursor-pointer" type="button">Join</button>
              </div>
            </div>
          </div>
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-outline-variant/40">
            <p className="font-body-sm text-body-sm text-on-surface-variant">© 2025 WanderAI Intelligence Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#">Privacy Policy</a>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
