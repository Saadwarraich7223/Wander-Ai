"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { authStorage } from "@/lib/auth";
import { usersApi, tripsApi, placesApi, interactionsApi, getErrorMessage } from "@/lib/api";
import { User as UserType, PlaceSummary } from "@/types";

interface PlaceBookmark {
  id: string;
  title: string;
  subLocation: string;
  categoryTag: string;
  type: "alpine" | "unesco" | "lake" | "4x4";
  imgUrl: string;
  elevation: string;
  coordinates: string;
  status: "saved" | "visited";
  statusText: string;
  rating?: string;
  priority?: string;
  description: string;
  plannerUrl: string;
  fieldLogAvailable?: boolean;
}

interface RealTrip {
  id: string;
  title: string;
  destination: string;
  duration_days: number;
  created_at?: string;
  start_date?: string;
  end_date?: string;
  peak_altitude?: string;
}

const FALLBACK_PLACES: PlaceBookmark[] = [
  {
    id: "passu-cones",
    title: "Passu Cathedral Cones & Glacier",
    subLocation: "Upper Hunza Corridor",
    categoryTag: "Alpine Passes & Peaks",
    type: "alpine",
    imgUrl:
      "https://lh3.googleusercontent.com/aida/AEtjO1UBoKP_M3uID4cxAsZm2o1_Aes6iDdg4uPdNMeyS-oAJWBkBQAwPQ8k8v1bOGCm9qtifZTTh6K4Cd9GgRYwWl_7gbESY4aIE1Mht9CHW_hcdYKViReZ2aXls2RKQZLywOcSXSO9M7BilN55y9Mtjgpq0uO3UdUzaSTTG9CF8IKz5KzD3_6d2X9zqYWXNWFmPmJKdGiy3INF4X3eoys0vmujzPVitAIxLsrLRvAG0bDf4iM3rVrqi3t2XnE",
    elevation: "3,100m AMSL",
    coordinates: "36.4912° N, 74.8878° E",
    status: "saved",
    statusText: "Saved Oct 12",
    priority: "Priority #1",
    description:
      "Serrated granitic needle ridges and Passu Glacier tongue. Ideal photogrammetry azimuth between 06:15 and 07:45 PKT.",
    plannerUrl: "/planner?destination=Passu%20Cones",
  },
  {
    id: "baltit-fort",
    title: "Baltit Fort & Karimabad Terraces",
    subLocation: "Hunza Central Core",
    categoryTag: "UNESCO & Forts",
    type: "unesco",
    imgUrl:
      "https://lh3.googleusercontent.com/aida/AEtjO1V9oI9A-iCMjOjiOrob3NJiXnLVI52H_-cuPPrjatCc6dZpvuHs5PGh0W5fkpwZknOenTWVgP8qDeCErO2MgL1TbjIpiy_OpNj4Oh9a5jfuMhsy9QGVIuDaUURArPn9CSVS4iZwNo1OdCw6NlZvX6S30TrxNIXujREhL2Thhknh7ppJPWT6gyxOIx_PMQD9nC4pcmw0j7ngCcmk8L9GK6q1zvo3-H-i0Hqir2cNGAjd8MBNgj5nL2Kox9wR",
    elevation: "2,480m AMSL",
    coordinates: "36.3262° N, 74.6658° E",
    status: "visited",
    statusText: "Visited Summer '24",
    rating: "5.0 ★",
    description:
      "700-year-old Mir architectural fortress overlooking Ultar Sar. Archival timber framing, ancient hearths and panoramic apricot groves.",
    plannerUrl: "/planner?destination=Karimabad",
    fieldLogAvailable: true,
  },
  {
    id: "katpana-desert",
    title: "Katpana Cold Desert & Shangrila",
    subLocation: "Skardu Baltistan",
    categoryTag: "4x4 Deserts & Valleys",
    type: "4x4",
    imgUrl:
      "https://lh3.googleusercontent.com/aida/AEtjO1W1K_86Hpsa_6lnI-y2c1ei-v8HMtjO98XegKXs-1Yg9MGWlCINrvjKaHGM-ypgmq2bqIkKPAtGN8P-by4kFDCAzhyqjA6vWEF3A9sgeoSJlzQI3fB6JtLQeTUSLhKTUI4YIkiAKCpiRY1Us2q4w4D9Z1WmrSoNLK2wtENyEYM5finEj0KkXWEKjJldmRV4IUxfdIcY-uASsb6b9kwWTDi46hiCpWW77s8DzmABj9AhZifGmoWn6iDb2eqA",
    elevation: "2,228m AMSL",
    coordinates: "35.3000° N, 75.6167° E",
    status: "saved",
    statusText: "Saved Sep 28",
    priority: "Dune Corridors",
    description:
      "High-latitude snow-covered desert dunes framed by jagged Karakoram escarpments. Excellent high-torque 4x4 sand transit corridor.",
    plannerUrl: "/planner?destination=Skardu",
  },
  {
    id: "hingol-volcanoes",
    title: "Princess of Hope & Hingol Mud Volcanoes",
    subLocation: "Makran Coastline",
    categoryTag: "UNESCO & Forts",
    type: "unesco",
    imgUrl:
      "https://lh3.googleusercontent.com/aida/AEtjO1U8y3xDB787ZoRHvXfP_7Q7N3QYci3DIOVwfhzXe0vGJmJrA8ySsjvfHwHKzBihqEhHYPOnkgx5PIUW8Ucbxcb_JY3wFU3o_6uGN3NGuu1nGBWLihaeAuvbwsXdFDVnB5UoexFQb7z9TbC2Y_zAmY6jCDU8fFtbnmOOyEeQ1dNbq1m38YWUqfjNYVCetRF0JzYXX8vv1MTVyvyFFBdEV-70m0i0ajL0H-P_sztrBO4vt2Zoz0E2uYXYHKKX",
    elevation: "120m Coastline",
    coordinates: "25.5000° N, 65.5000° E",
    status: "visited",
    statusText: "Visited Nov '23",
    rating: "4.9 ★",
    description:
      "Natural wind-sculpted sandstone obelisks and the geothermal volcanic vents of Hingol National Park along the Arabian Sea coast.",
    plannerUrl: "/planner?destination=Makran",
    fieldLogAvailable: true,
  },
  {
    id: "malam-jabba",
    title: "Malam Jabba & Swat Pine Ridges",
    subLocation: "Swat Alpine Valley",
    categoryTag: "Lakes & Glaciers",
    type: "lake",
    imgUrl:
      "https://lh3.googleusercontent.com/aida/AEtjO1Uq-YQyedwbPonZ6Z3yNs8-t8gElNawpR4Jx7jAiIqQbqL1aTV1JGxqGhqW8NBkEMkSg-NBt0APCPoEjgz4aDNIwagzXGNMMhG-kqnHVjOwzlsIeNnAZMlMeRsdjmPzPyX6Z7ZR3j7YjxEobyWmqVopaP0Xs5z8CRYbrqSPNXmRiSBS-2VEsy7gk9Hu2cmsuTOjvBGHmreBlT25MT0HvbxX6lHv47Kt3OnBo-W52ErI5yZ0YTl3r30avuC0",
    elevation: "2,804m AMSL",
    coordinates: "34.7995° N, 72.5714° E",
    status: "saved",
    statusText: "Saved Aug 14",
    description:
      "Dense deodar cedar forests, high Himalayan snow bowls, and winter sports terrain. Primary staging point for northern drone videography corridors with stable morning atmospheric conditions.",
    plannerUrl: "/planner?destination=Swat",
  },
];

export default function UserProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [meData, setMeData] = useState<any>(null);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editBudget, setEditBudget] = useState("moderate");
  const [editTravelStyle, setEditTravelStyle] = useState("alpine");
  const [editAltitudeCap, setEditAltitudeCap] = useState(3500);

  // Persona State
  const [activePersona, setActivePersona] = useState<"solo" | "duo" | "expedition">("solo");
  const [registryTab, setRegistryTab] = useState<"saved" | "visited">("saved");
  const [filterType, setFilterType] = useState<"all" | "alpine" | "unesco" | "lake" | "4x4">("all");

  // Real Backend Data
  const [userTrips, setUserTrips] = useState<RealTrip[]>([]);
  const [placesList, setPlacesList] = useState<PlaceBookmark[]>(FALLBACK_PLACES);
  const [savedCount, setSavedCount] = useState(28);

  // Toast Notification
  const [toastText, setToastText] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const triggerToast = (msg: string) => {
    setToastText(msg);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3200);
  };

  // Check login & Load User, Profile, Trips, and Interactions from FastAPI Backend
  useEffect(() => {
    const loggedUser = authStorage.getUser();
    const token = authStorage.getAccessToken();

    if (!loggedUser && !token) {
      router.push("/login?redirect=/profile");
      return;
    }

    setUser(loggedUser);
    setAuthChecked(true);

    async function loadBackendData() {
      setLoading(true);
      try {
        // Fetch /users/me
        const me = await usersApi.getMe();
        if (me) {
          setMeData(me);
          setEditName(me.name || loggedUser?.full_name || "");
          setEditAvatarUrl(me.avatar_url || "");

          if (me.profile) {
            setEditBudget(me.profile.preferred_budget || "moderate");
            setEditTravelStyle(me.profile.travel_style || "alpine");
            setEditAltitudeCap(me.profile.max_altitude_preference_m || 3500);
          }
        }
      } catch (err) {
        console.warn("Could not fetch /users/me backend profile", err);
      }

      // Fetch User's Real Trips
      try {
        const tripsRes = await tripsApi.list();
        if (Array.isArray(tripsRes)) {
          const mapped: RealTrip[] = tripsRes.map((t: any) => {
            const rawDest = t.destination_city_id;
            const destName = rawDest && !rawDest.includes("-") ? rawDest.toUpperCase() : "Hunza Corridor";
            return {
              id: t.id,
              title: t.title || `Expedition to ${destName}`,
              destination: destName,
              duration_days: t.duration_days || 5,
              created_at: t.created_at,
              start_date: t.start_date,
              end_date: t.end_date,
              peak_altitude: t.max_altitude ? `${t.max_altitude}m` : "3,200m",
            };
          });
          setUserTrips(mapped);
        }
      } catch (err) {
        console.warn("Could not fetch user trips from backend", err);
      }

      // Fetch User Interactions & Places
      try {
        const [placesRes, interactionsRes] = await Promise.all([
          placesApi.list({ limit: 20 }),
          interactionsApi.getMyInteractions().catch(() => []),
        ]);

        if (placesRes && Array.isArray(placesRes.items) && placesRes.items.length > 0) {
          const savedPlaceIds = new Set(
            (interactionsRes || [])
              .filter((i: any) => i.interaction_type === "save" || i.interaction_type === "bookmark")
              .map((i: any) => i.place_id)
          );

          const liveMapped: PlaceBookmark[] = placesRes.items.map((p: PlaceSummary, idx: number) => {
            const isSaved = savedPlaceIds.has(p.id) || idx % 2 === 0;
            const categoryName = p.category?.name || "Destination";
            let typeKey: "alpine" | "unesco" | "lake" | "4x4" = "alpine";
            if (p.is_unesco_heritage || categoryName.toLowerCase().includes("fort")) typeKey = "unesco";
            else if (categoryName.toLowerCase().includes("lake") || categoryName.toLowerCase().includes("water")) typeKey = "lake";
            else if (p.vehicle_access === "4x4_jeep") typeKey = "4x4";

            const rawCity = (p as any).city?.name || p.city_id;
            const formattedSubLocation = rawCity && !rawCity.includes("-")
              ? `${rawCity.toUpperCase()} Corridor`
              : "Regional Waypoint";

            return {
              id: p.id,
              title: p.name,
              subLocation: formattedSubLocation,
              categoryTag: categoryName,
              type: typeKey,
              imgUrl:
                p.primary_image?.url ||
                FALLBACK_PLACES[idx % FALLBACK_PLACES.length].imgUrl,
              elevation: p.latitude ? `${Math.round(Math.abs(p.latitude) * 70)}m AMSL` : "2,400m AMSL",
              coordinates: `${(p.latitude || 36.4).toFixed(4)}° N, ${(p.longitude || 74.8).toFixed(4)}° E`,
              status: isSaved ? "saved" : "visited",
              statusText: isSaved ? "Saved" : "Visited",
              priority: `Priority #${idx + 1}`,
              description: p.description || "High-altitude alpine destination verified for optimal weather passability.",
              plannerUrl: `/planner?destination=${encodeURIComponent(p.name)}&place_id=${p.id}`,
            };
          });

          setPlacesList(liveMapped);
          setSavedCount(liveMapped.filter((p) => p.status === "saved").length);
        }
      } catch (err) {
        console.warn("Could not fetch real places or interactions", err);
      } finally {
        setLoading(false);
      }
    }

    loadBackendData();
  }, []);

  // Save Edit Profile Modal Form to FastAPI Backend
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Update user name & avatar URL
      const updatedUser = await usersApi.updateMe({
        name: editName.trim(),
        avatar_url: editAvatarUrl.trim() || undefined,
      });

      // 2. Update travel profile
      await usersApi.upsertProfile({
        preferred_budget: editBudget,
        travel_style: editTravelStyle,
        max_altitude_preference_m: Number(editAltitudeCap),
      });

      // 3. Update local auth storage
      if (updatedUser) {
        authStorage.setUser({
          ...user,
          full_name: updatedUser.name || editName,
          email: updatedUser.email || user?.email || "",
          id: updatedUser.id || user?.id || "",
          role: user?.role || "user",
          is_active: true,
        });
        setUser({
          ...user,
          full_name: updatedUser.name || editName,
          email: updatedUser.email || user?.email || "",
          id: updatedUser.id || user?.id || "",
          role: user?.role || "user",
          is_active: true,
        });
      }

      setIsEditModalOpen(false);
      triggerToast("Profile & Travel DNA successfully saved to server database!");
    } catch (err) {
      triggerToast(`Failed to update profile: ${getErrorMessage(err)}`);
    }
  };

  // Toggle Save / Bookmark live place
  const handleToggleBookmark = async (placeId: string, currentStatus: string) => {
    const isUnsaving = currentStatus === "saved";
    const nextStatus = isUnsaving ? "visited" : "saved";

    // 1. Optimistic UI update — immediately update status and remove from saved view
    setPlacesList((prev) =>
      prev.map((item) => {
        if (item.id === placeId) {
          return {
            ...item,
            status: nextStatus,
            statusText: nextStatus === "saved" ? "Saved" : "Visited",
          };
        }
        return item;
      })
    );

    triggerToast(
      isUnsaving
        ? "Removed place from saved bookmarks."
        : "Saved place to geographic registry."
    );

    // 2. Log interaction to backend database with valid interaction_type
    try {
      await interactionsApi.log({
        place_id: placeId,
        interaction_type: isUnsaving ? "skip" : "save",
      });
    } catch (err) {
      console.warn("Backend interaction log fallback:", err);
    }
  };

  // Remove Trip from Backend
  const handleDeleteTrip = async (tripId: string) => {
    try {
      await tripsApi.remove(tripId);
      setUserTrips((prev) => prev.filter((t) => t.id !== tripId));
      triggerToast("Trip successfully removed from server archive.");
    } catch (err) {
      triggerToast("Failed to delete trip: " + getErrorMessage(err));
    }
  };

  const displayName = meData?.name || user?.full_name || "Dr. Aamir Khan";
  const displayEmail = meData?.email || user?.email || "aamir.khan@wander.ai";
  const avatarUrl =
    meData?.avatar_url ||
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCU2FBoTPfVnMh9MbhieaxoGKIOoVnNU-YGv99oYiwLDPADwMhVWi4YGM-sZeYqNcWV5CT_GAioTdrXKM4rWtYYfHWj3R7x7pg0RwqaXUoLClI7mjTpQ1UGgJRVKb4gNabSv5B9w4fHA72Dgj_tJ-QB2z53lLXZKkj4N0tToDTK2GkVEth46FDN-XBDblZ4wrsg8JZgvQTK9yn980is0rGb90qIOoCFmQe9TpveauFZn2tUnkJLvuMnrg";
  const displayTitle = "Lead High-Altitude Geographer & Expedition Architect";
  const displayLocation = "Base: Islamabad, PK (ISB-01)";

  const filteredPlaces = placesList.filter((place) => {
    if (registryTab === "saved" && place.status !== "saved") return false;
    if (registryTab === "visited" && place.status !== "visited") return false;
    if (filterType !== "all" && place.type !== filterType) return false;
    return true;
  });

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
        </div>
        <h2 className="font-display font-bold text-lg text-on-surface mb-1">Verifying Traveler Session</h2>
        <p className="text-xs text-on-surface-variant">Accessing your WanderAI travel passport...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface antialiased flex flex-col relative overflow-x-hidden">
      {/* Top Fixed Header Navbar Component */}
      <Navbar user={user} />

      <main className="w-full  bg-background flex-1">
        <div className="flex flex-col w-full">
          {/* Dossier Header / Profile Identity Section */}
          <section className="relative w-full overflow-hidden bg-surface-container-lowest shadow-xs border-b border-outline-variant/40">
            {/* Topographic Contour SVG Mesh Graphic */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.035] text-primary">
              <svg className="w-full h-full" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="contour-pattern" width="280" height="280" patternUnits="userSpaceOnUse">
                    <path
                      d="M0 70 Q 70 20, 140 70 T 280 70 M0 140 Q 70 90, 140 140 T 280 140 M0 210 Q 70 160, 140 210 T 280 210 M70 0 Q 20 70, 70 140 T 70 280 M140 0 Q 90 70, 140 140 T 140 280 M210 0 Q 160 70, 210 140 T 210 280"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#contour-pattern)" />
              </svg>
            </div>

            {/* Editorial Ambient Backdrop Banner */}
            <div className="relative w-full h-56 md:h-72 overflow-hidden bg-surface-container">
              <div
                className="w-full h-full bg-cover bg-center opacity-85 scale-[1.02] transform transition-transform duration-700"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDxBN92goUGHirlD1vvL5Et7AIpkh8D2F4NueJE1gnhnp2dfNNL0XPE9l8XQnAPBsrbhycUCB0rmGYCcMJxjvrD8hhKyCD6L38zMO3Qnfvy3DtAfNfza0fvz_Coq6NOHUJQWv27iFIrK9V_4pkh9csdWFJ6ReJ3db-_jGvshOpDPV2lzw4Q2mjsjSrhpQGwsDKO0-Q0aiayLV9epXG1WrRYKhXbCzCuzmpSDVX3cDpp7E7p88roRuwwYw')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/20 to-transparent" />


            </div>

            {/* Identity Row */}
            <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pb-8">
              <div className="relative -mt-20 md:-mt-24 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                {/* Avatar & Main Identification */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
                  <div className="relative group">
                    <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden bg-surface-container-lowest shadow-md p-1.5 border border-outline-variant/60">
                      <img
                        className="w-full h-full object-cover rounded-xl"
                        alt={displayName}
                        src={avatarUrl}
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-lg bg-primary text-white text-[11px] font-mono font-bold flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-xs text-emerald-400">verified</span>
                      <span>TIER-1</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">
                        {displayName}
                      </h1>
                      <span className="px-3 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-mono font-bold tracking-wide">
                        ARC-9042
                      </span>
                      <span className="px-3 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                        Alpine Pioneer
                      </span>
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-on-surface-variant">
                      {displayTitle}
                    </p>

                    {/* Metadata Line */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-on-surface-variant text-xs font-sans">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-secondary">explore</span>
                        {displayLocation}
                      </span>
                      <span className="text-outline-variant">•</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-on-surface-variant">mail</span>
                        {displayEmail}
                      </span>
                      <span className="text-outline-variant">•</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-secondary">lock</span>
                        SOC-2 Hardware 2FA
                      </span>
                      <span className="text-outline-variant">•</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-on-surface-variant">share_location</span>
                        PostGIS Mesh Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => triggerToast("Expedition Dossier compiled as JSON & cryptographic summary.")}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-semibold text-xs cursor-pointer border border-outline-variant/60"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">ios_share</span>
                    <span>Export Dossier</span>
                  </button>
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        navigator.clipboard?.writeText(window.location.href);
                      }
                      triggerToast("Public Expedition DNA link copied to clipboard.");
                    }}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-semibold text-xs cursor-pointer border border-outline-variant/60"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">fingerprint</span>
                    <span>Share DNA</span>
                  </button>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-neutral-800 transition-colors shadow-xs font-semibold text-xs cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">tune</span>
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Explorer Telemetry & Lifetime Stats Ribbon (4 High-Contrast Editorial Cards) */}
          <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Autonomous Corridors */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs border border-outline-variant/60 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                    Autonomous Corridors
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-lg">route</span>
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl font-extrabold tracking-tight text-on-surface">
                      4,820
                    </span>
                    <span className="text-sm font-semibold text-on-surface-variant">km</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-secondary text-xs font-bold">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span>+18.4% across Karakoram</span>
                  </div>
                </div>
              </div>

              {/* Metric 2: Visited & Field Logged */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs border border-outline-variant/60 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                    Saved Journeys
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-lg">where_to_vote</span>
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl font-extrabold tracking-tight text-on-surface">
                      {userTrips.length > 0 ? userTrips.length : 3}
                    </span>
                    <span className="text-xs font-bold text-secondary">Active Expeditions</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-on-surface-variant text-xs">
                    <span className="material-symbols-outlined text-xs text-secondary">verified</span>
                    <span>Synced with FastAPI Backend</span>
                  </div>
                </div>
              </div>

              {/* Metric 3: Saved Places & Bookmarks */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs border border-outline-variant/60 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                    Saved Bookmarks
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-lg">bookmark</span>
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl font-extrabold tracking-tight text-on-surface">
                      {placesList.filter((p) => p.status === "saved").length}
                    </span>
                    <span className="text-sm font-semibold text-on-surface-variant">Places</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-secondary text-xs font-bold">
                    <span className="material-symbols-outlined text-sm">bookmark_add</span>
                    <span>+6 added this month</span>
                  </div>
                </div>
              </div>

              {/* Metric 4: Peak Altitude & Topo Cache */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs border border-outline-variant/60 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                    Offline Topo Cache
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-lg">download_done</span>
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl font-extrabold tracking-tight text-on-surface">
                      6
                    </span>
                    <span className="text-sm font-semibold text-on-surface-variant">Packs (142 MB)</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Khunjerab (4,733m) &amp; Babusar Crest
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Two-Column Core Layout (Left 2/3 Main Dossier, Right 1/3 Hardware, Security & Telemetry) */}
          <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Main Dossier & Travel DNA (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col gap-8">
                {/* Travel DNA & Algorithmic Preference Matrix Card */}
                <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/40">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                          Cognitive Profile
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        <span className="text-xs text-on-surface-variant">Synced with Server Database</span>
                      </div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface tracking-tight mt-0.5">
                        Travel DNA &amp; Algorithmic Biases
                      </h2>
                    </div>

                    {/* Persona Switcher Pill */}
                    <div className="flex flex-wrap sm:inline-flex p-1 bg-surface-container rounded-2xl sm:rounded-full self-start sm:self-auto border border-outline-variant/60">
                      {[
                        { id: "solo", label: "Solo Pioneer" },
                        { id: "duo", label: "Duo / Crew" },
                        { id: "expedition", label: "Expedition Lead" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setActivePersona(p.id as any);
                            triggerToast(`Switched active persona profile to ${p.label}`);
                          }}
                          className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${activePersona === p.id
                            ? "bg-surface-container-lowest text-on-surface shadow-xs"
                            : "text-on-surface-variant hover:text-on-surface"
                            }`}
                          type="button"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Radar Matrix Dimensions (Visual Segmented Bars) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pt-6">
                    {/* Dimension 1 */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-sm text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-secondary">
                            filter_hdr
                          </span>
                          High-Altitude Alpine Passes
                        </span>
                        <span className="text-xs font-mono font-bold text-secondary">94% Affinity</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: "94%" }} />
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        Prioritizes {editAltitudeCap}m+ passes with low vehicular density
                      </span>
                    </div>

                    {/* Dimension 2 */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-sm text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-secondary">
                            castle
                          </span>
                          UNESCO &amp; Historic Forts
                        </span>
                        <span className="text-xs font-mono font-bold text-secondary">88% Affinity</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: "88%" }} />
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        Archival Silk Road waypoints, Altit, Baltit &amp; Skardu Forts
                      </span>
                    </div>

                    {/* Dimension 3 */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-sm text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-secondary">
                            camera_indoor
                          </span>
                          Photogrammetry &amp; Golden Hour
                        </span>
                        <span className="text-xs font-mono font-bold text-secondary">91% Affinity</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: "91%" }} />
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        Locks azimuth angles for dawn lighting at Passu Cones
                      </span>
                    </div>

                    {/* Dimension 4 */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-sm text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-secondary">
                            minor_crash
                          </span>
                          Rugged 4x4 Off-Road Technical
                        </span>
                        <span className="text-xs font-mono font-bold text-secondary">72% Affinity</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: "72%" }} />
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        Tolerates Class IV gravel &amp; river fjord crossings
                      </span>
                    </div>
                  </div>

                  {/* Operational Parameters Strip */}
                  <div className="mt-8 pt-6 bg-surface-container-low rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border border-outline-variant/40">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                        Altitude Pacing Protocol
                      </span>
                      <span className="font-bold text-sm text-on-surface capitalize">{editBudget} Budget</span>
                      <span className="text-xs text-on-surface-variant">Max Cap: ≤{editAltitudeCap}m altitude</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                        Travel Style Mode
                      </span>
                      <span className="font-bold text-sm text-on-surface capitalize">{editTravelStyle} Explorer</span>
                      <span className="text-xs text-on-surface-variant">Caloric target: 3,200 kcal alpine baseline</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                        Chassis Preference
                      </span>
                      <span className="font-bold text-sm text-on-surface">LC70-Series / Prado</span>
                      <span className="text-xs text-on-surface-variant">Snorkel + Dual Spare + High-lift Jack</span>
                    </div>
                  </div>
                </div>

                {/* Curated Corridors & Expedition Dossiers */}
                <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/60 flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                        Waypoint Corridors
                      </span>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface tracking-tight mt-0.5">
                        Expeditions &amp; Saved Journeys ({userTrips.length})
                      </h2>
                    </div>
                    <Link
                      className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
                      href="/trips"
                    >
                      <span>View Full Archive</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Render Real User Trips from Database if available */}
                    {userTrips.map((trip) => (
                      <div
                        key={trip.id}
                        className="bg-surface-container-low rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:bg-surface-container transition-colors group border border-outline-variant/40"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-surface-container-high border border-outline-variant/40 flex items-center justify-center bg-secondary/10">
                            <span className="material-symbols-outlined text-3xl text-secondary">explore</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display font-bold text-base text-on-surface">
                                {trip.title}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-md bg-secondary/15 text-secondary text-[11px] font-mono font-bold">
                                Live Saved Trip
                              </span>
                            </div>
                            <p className="text-xs text-on-surface-variant">
                              Destination Corridor: {trip.destination}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-on-surface-variant pt-1 font-mono">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">calendar_today</span> {trip.duration_days} Days
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">altitude</span> Peak: {trip.peak_altitude}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          <Link
                            href={`/trips/${trip.id}`}
                            className="px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-neutral-800 transition-colors font-semibold text-xs shadow-xs"
                          >
                            Inspect Trip
                          </Link>
                          <button
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="w-9 h-9 rounded-xl bg-surface-container-lowest text-red-500 hover:bg-red-50 flex items-center justify-center shadow-xs cursor-pointer border border-outline-variant/60"
                            title="Delete Trip"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Default Curated Expeditions */}
                    <div className="bg-surface-container-low rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:bg-surface-container transition-colors group border border-outline-variant/40">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-surface-container-high border border-outline-variant/40">
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            alt="Karakoram Silk Highway Traverse"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqxxNeMheEtzhvIWwb0WVMJPwUgB9F_Ls4ukCeLssUuggoGBV7zWH0YS3XibFdmQ0S6d9yll-8yXl1lrhpCwyBF40MofQZc6LyKRMYD815v62QB4oFE3Fp7BpHrNP93N2mtH1-3C6jwg-8AZRLzOnV6OKszBNPAbA9kHAhSUdFV6bFbC4hEelleSD_gzIli1zr3-dmR-hBYvSvzlXmagDiZots0Cln8sD2QCXSJV06NMtIIQadK-LmvQ"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display font-bold text-base text-on-surface">
                              Karakoram Silk Highway Traverse
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md bg-secondary/15 text-secondary text-[11px] font-mono font-bold">
                              Completed · Autumn '24
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant">
                            Gilgit → Karimabad → Attabad Lake → Passu Cathedral → Khunjerab Pass
                          </p>
                          <div className="flex items-center gap-3 text-xs text-on-surface-variant pt-1 font-mono">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">calendar_today</span> 5 Days
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">pin_drop</span> 12 Waypoints
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">altitude</span> Peak: 4,693m
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                        <button
                          onClick={() => triggerToast("Opening Karakoram Telemetry Log...")}
                          className="px-3.5 py-2 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container-highest transition-colors font-semibold text-xs shadow-xs cursor-pointer border border-outline-variant/60"
                          type="button"
                        >
                          Telemetry Log
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dedicated Places Registry & Spatial Bookmarks Module */}
                <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/60 flex flex-col gap-6" id="places-bookmarks-hub">
                  {/* Module Header & Spatial Sub-tab Controls */}
                  <div className="flex flex-col gap-4 border-b pb-5 border-outline-variant/40">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                            Field Log &amp; Geographic Atlas
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          <span className="text-xs text-on-surface-variant">Spatial Index Synced</span>
                        </div>
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface tracking-tight mt-0.5">
                          Places Registry &amp; Spatial Bookmarks
                        </h2>
                      </div>

                      {/* Spatial Overview & Map Jump */}
                      <div className="flex items-center gap-3">
                        <Link
                          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-semibold text-xs border border-outline-variant/60"
                          href="/explore#map"
                        >
                          <span className="material-symbols-outlined text-sm text-secondary">map</span>
                          <span>Atlas View</span>
                        </Link>
                        <Link
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-primary text-white hover:bg-neutral-800 transition-colors font-semibold text-xs shadow-xs"
                          href="/places"
                        >
                          <span className="material-symbols-outlined text-sm">add_location_alt</span>
                          <span>Save New Spot</span>
                        </Link>
                      </div>
                    </div>

                    {/* Primary Registry Sub-tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="inline-flex p-1 bg-surface-container rounded-2xl gap-1 border border-outline-variant/60">
                        <button
                          onClick={() => setRegistryTab("saved")}
                          className={`px-4 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ${registryTab === "saved"
                            ? "bg-surface-container-lowest text-on-surface shadow-xs font-bold"
                            : "text-on-surface-variant hover:text-on-surface"
                            }`}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm text-secondary">bookmark</span>
                          <span>Saved Places</span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold">
                            {placesList.filter((p) => p.status === "saved").length}
                          </span>
                        </button>
                        <button
                          onClick={() => setRegistryTab("visited")}
                          className={`px-4 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ${registryTab === "visited"
                            ? "bg-surface-container-lowest text-on-surface shadow-xs font-bold"
                            : "text-on-surface-variant hover:text-on-surface"
                            }`}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm">verified</span>
                          <span>Visited &amp; Verified</span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px]">
                            {placesList.filter((p) => p.status === "visited").length}
                          </span>
                        </button>
                      </div>

                      {/* Sort and Display count */}
                      <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                        <span>Sort:</span>
                        <select className="bg-surface-container px-2 py-1 rounded-lg text-on-surface font-semibold text-xs border border-outline-variant/60 focus:outline-none cursor-pointer">
                          <option>Recently Saved</option>
                          <option>Highest Altitude</option>
                          <option>North to South</option>
                          <option>Field Affinity %</option>
                        </select>
                      </div>
                    </div>

                    {/* Filter Chips Pill Bar */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {[
                        { id: "all", label: `All Types (${filteredPlaces.length})` },
                        { id: "alpine", label: "Alpine Passes & Peaks", icon: "filter_hdr" },
                        { id: "unesco", label: "UNESCO & Forts", icon: "castle" },
                        { id: "lake", label: "Lakes & Glaciers", icon: "water_drop" },
                        { id: "4x4", label: "4x4 Deserts & Valleys", icon: "minor_crash" },
                      ].map((chip) => (
                        <button
                          key={chip.id}
                          onClick={() => setFilterType(chip.id as any)}
                          className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 cursor-pointer transition-colors flex items-center gap-1 ${filterType === chip.id
                            ? "bg-primary text-white shadow-xs font-bold"
                            : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                            }`}
                          type="button"
                        >
                          {chip.icon && <span className="material-symbols-outlined text-xs text-secondary">{chip.icon}</span>}
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rich Grid of Saved & Visited Place Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredPlaces.map((card) => (
                      <div
                        key={card.id}
                        className="bg-surface-container-low rounded-2xl overflow-hidden hover:bg-surface-container transition-all group flex flex-col justify-between shadow-xs border border-outline-variant/40"
                      >
                        <div className="relative h-44 overflow-hidden bg-surface-container-high">
                          <img
                            alt={card.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            src={card.imgUrl}
                          />
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-secondary text-[11px] font-mono font-bold flex items-center gap-1 shadow-xs">
                              <span className="material-symbols-outlined text-xs text-secondary">
                                {card.status === "saved" ? "bookmark" : "verified"}
                              </span>{" "}
                              {card.statusText}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface text-[11px] font-mono shadow-xs">
                              {card.elevation}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3">
                            <button
                              onClick={() => handleToggleBookmark(card.id, card.status)}
                              className="w-8 h-8 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center text-secondary shadow-xs hover:scale-110 transition-transform cursor-pointer"
                              title="Bookmark"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-base">
                                {card.status === "saved" ? "bookmark_added" : "bookmark"}
                              </span>
                            </button>
                          </div>
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white px-2 py-1 rounded-xl bg-black/60 backdrop-blur-md font-mono">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-emerald-400">check_circle</span> Passability: 100% Clear
                            </span>
                            <span>{card.coordinates}</span>
                          </div>
                        </div>

                        <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-mono uppercase tracking-wider text-secondary font-bold">
                                {card.subLocation}
                              </span>
                              {card.priority && <span className="text-[11px] text-on-surface-variant font-medium">{card.priority}</span>}
                            </div>
                            <h3 className="font-display text-base font-bold text-on-surface mt-0.5">
                              {card.title}
                            </h3>
                            <p className="text-xs text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
                              {card.description}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-outline-variant/40 flex items-center justify-between gap-2 mt-2">
                            <Link
                              className="px-3.5 py-1.5 rounded-xl bg-primary text-white hover:bg-neutral-800 transition-colors font-semibold text-xs flex items-center gap-1 shadow-xs"
                              href={card.plannerUrl}
                            >
                              <span className="material-symbols-outlined text-xs">assistant_navigation</span> Plan Route
                            </Link>
                            <div className="flex items-center gap-1">
                              <Link
                                className="w-8 h-8 rounded-xl bg-surface-container-lowest text-on-surface-variant hover:text-on-surface flex items-center justify-center shadow-xs cursor-pointer border border-outline-variant/60"
                                title="Open in Map"
                                href="/explore#map"
                              >
                                <span className="material-symbols-outlined text-sm">map</span>
                              </Link>
                              <button
                                onClick={() => triggerToast(`Added ${card.title} to dossier queue.`)}
                                className="w-8 h-8 rounded-xl bg-surface-container-lowest text-on-surface-variant hover:text-on-surface flex items-center justify-center shadow-xs cursor-pointer border border-outline-variant/60"
                                title="Add to Dossier"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-sm">playlist_add</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Curated Field Gear & Vehicle Fleet Registry */}
                <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/60">
                  <div className="flex items-center justify-between pb-4">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                        Asset Registry
                      </span>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface tracking-tight mt-0.5">
                        Field Fleet &amp; Expedition Hardware
                      </h2>
                    </div>
                    <button
                      onClick={() => triggerToast("Hardware registration portal opened.")}
                      className="inline-flex items-center gap-1 font-semibold text-xs text-secondary hover:underline cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      <span>Register Hardware</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Vehicle Asset */}
                    <div className="p-5 bg-surface-container-low rounded-2xl flex flex-col gap-3 border border-outline-variant/40">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-mono font-bold">
                          Active Fleet
                        </span>
                        <span className="material-symbols-outlined text-on-surface-variant">directions_car</span>
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base text-on-surface">
                          Toyota Land Cruiser LC76
                        </h3>
                        <p className="text-xs text-on-surface-variant">
                          Expedition Modified · ARB Bullbar, Snorkel, 130L Dual Fuel
                        </p>
                      </div>
                      <div className="pt-2 text-xs text-on-surface-variant flex items-center justify-between font-mono">
                        <span>VHF Mesh ID: #VK-76</span>
                        <span>Tires: 33" BFGoodrich KO2</span>
                      </div>
                    </div>

                    {/* Satcom & Safety Hardware */}
                    <div className="p-5 bg-surface-container-low rounded-2xl flex flex-col gap-3 border border-outline-variant/40">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-mono font-bold">
                          Live Sat-Linked
                        </span>
                        <span className="material-symbols-outlined text-on-surface-variant">satellite</span>
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base text-on-surface">
                          Garmin inReach Mini 2
                        </h3>
                        <p className="text-xs text-on-surface-variant">
                          Iridium SOS Beacon · Sync ID: #PK-771-ALPIN
                        </p>
                      </div>
                      <div className="pt-2 text-xs text-on-surface-variant flex items-center justify-between font-mono">
                        <span>Battery: 98% (Solar Trickle)</span>
                        <span className="text-secondary font-bold">Ping Interval: 10m</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Security Vault, Offline Cache & Emergency Protocol (4 Cols) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                {/* Quick Bookmarks & Offline Spatial Sync Card */}
                <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-xs border border-outline-variant/60 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                      Spatial Bookmarks
                    </span>
                    <span className="material-symbols-outlined text-secondary text-lg">bookmark_manager</span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-on-surface">Saved Places Sync</h3>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      {placesList.filter((p) => p.status === "saved").length} pinned waypoints ready for offline Garmin &amp; topo overlay
                    </p>
                  </div>
                  <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between text-xs border border-outline-variant/40">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-secondary">cloud_done</span>
                      <div>
                        <div className="font-bold text-xs text-on-surface">Garmin &amp; InReach Sync</div>
                        <div className="text-on-surface-variant text-[11px]">Waypoints synced with database</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold text-[10px]">
                      SYNCED
                    </span>
                  </div>
                  <button
                    onClick={() => triggerToast(`Syncing ${placesList.filter((p) => p.status === "saved").length} waypoints to satellite unit...`)}
                    className="w-full py-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-semibold text-xs cursor-pointer flex items-center justify-center gap-1 border border-outline-variant/60"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">sync_saved_locally</span>
                    <span>Sync New Bookmarks to Sat-Nav</span>
                  </button>
                </div>

                {/* Security & Hardware Keyphrase Vault */}
                <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-xs border border-outline-variant/60 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                      Security Clearance
                    </span>
                    <span className="material-symbols-outlined text-secondary text-lg">shield</span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-on-surface">Hardware Keyphrase Vault</h3>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      Zero-knowledge encrypted telemetry storage
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between text-xs border border-outline-variant/40">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-secondary">token</span>
                        <div>
                          <div className="font-bold text-xs text-on-surface">YubiKey 5C NFC</div>
                          <div className="text-on-surface-variant text-[11px]">Slot 01: Hardware Linked</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold text-[10px]">
                        CONNECTED
                      </span>
                    </div>

                    <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between text-xs border border-outline-variant/40">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-on-surface-variant">vpn_key</span>
                        <div>
                          <div className="font-bold text-xs text-on-surface">Vault Entropy</div>
                          <div className="text-on-surface-variant text-[11px]">Rotated 14 days ago (92 bits)</div>
                        </div>
                      </div>
                      <span className="font-mono text-on-surface-variant text-[11px]">AES-256</span>
                    </div>
                  </div>
                  <button
                    onClick={() => triggerToast("Hardware 2FA session re-authenticated. Entropy updated.")}
                    className="w-full mt-2 py-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-semibold text-xs cursor-pointer border border-outline-variant/60"
                    type="button"
                  >
                    Rotate Session Credentials
                  </button>
                </div>

                {/* Offline Corridors & Vector Pack Manager */}
                <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-xs border border-outline-variant/60 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                      Local Storage
                    </span>
                    <span className="font-mono text-xs text-on-surface-variant">104 MB / 500 MB</span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-on-surface">Offline Map Packs</h3>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      High-resolution elevation contours &amp; offline POIs
                    </p>
                  </div>

                  {/* Storage Meter */}
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: "21%" }} />
                  </div>

                  <div className="flex flex-col gap-3 pt-1">
                    <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between text-xs border border-outline-variant/40">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-on-surface">Hunza &amp; Passu Cones</span>
                        <span className="text-on-surface-variant text-[11px]">38 MB • Updated 2h ago</span>
                      </div>
                      <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                    </div>

                    <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between text-xs border border-outline-variant/40">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-on-surface">Skardu &amp; Katpana Desert</span>
                        <span className="text-on-surface-variant text-[11px]">42 MB • Ready for offline routing</span>
                      </div>
                      <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                    </div>

                    <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between text-xs border border-outline-variant/40">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-on-surface">Babusar &amp; Naran Valley</span>
                        <span className="text-on-surface-variant text-[11px]">24 MB • Vector update available</span>
                      </div>
                      <button
                        onClick={() => triggerToast("Updating Babusar vector pack...")}
                        className="text-secondary hover:text-on-surface flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                        type="button"
                      >
                        <span>Update</span>
                        <span className="material-symbols-outlined text-sm">sync</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => triggerToast("Syncing 180 MB Northern Pakistan vector tiles...")}
                    className="w-full mt-1 py-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-semibold text-xs cursor-pointer border border-outline-variant/60"
                    type="button"
                  >
                    Download All Northern Packs (180 MB)
                  </button>
                </div>

                {/* Emergency Contacts & Mountain Rescue Protocol Card */}
                <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-xs border border-outline-variant/60 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                      High-Altitude SOS
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-on-surface">Emergency Rescue Clearance</h3>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      Pre-authorized mountain extraction protocol
                    </p>
                  </div>

                  <div className="p-4 bg-surface-container-low rounded-2xl flex flex-col gap-3 text-xs border border-outline-variant/40">
                    <div className="flex justify-between items-center pb-2 border-b border-outline-variant/40">
                      <span className="text-on-surface-variant">Askari Aviation Policy</span>
                      <span className="font-mono font-bold text-on-surface">#PK-AAC-8819</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-outline-variant/40">
                      <span className="text-on-surface-variant">Field Dispatch Specialist</span>
                      <span className="font-semibold text-on-surface">Dr. Sarah Vance (Gilgit)</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-outline-variant/40">
                      <span className="text-on-surface-variant">Blood Group Identifier</span>
                      <span className="font-mono font-bold text-secondary">O Rh-Positive</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Emergency Satcom Direct</span>
                      <span className="font-mono text-on-surface font-semibold">+92 300 8599420</span>
                    </div>
                  </div>

                  <button
                    onClick={() => triggerToast("Askari SOS beacon test: Latency 210ms (Normal).")}
                    className="w-full py-2.5 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors font-semibold text-xs cursor-pointer border border-outline-variant/60"
                    type="button"
                  >
                    Test Beacon Latency (Mock Ping)
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Edit Profile Modal Dialog */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative border border-outline-variant/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">tune</span>
                <h3 className="font-display font-bold text-xl text-on-surface">
                  Edit Profile &amp; Travel DNA
                </h3>
              </div>
              <button
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                onClick={() => setIsEditModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-sm font-medium text-on-surface focus:outline-none focus:border-secondary"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-sm font-medium text-on-surface focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Budget Tier
                  </label>
                  <select
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-sm font-medium text-on-surface focus:outline-none focus:border-secondary cursor-pointer"
                  >
                    <option value="budget">Budget</option>
                    <option value="moderate">Moderate</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Travel Style
                  </label>
                  <select
                    value={editTravelStyle}
                    onChange={(e) => setEditTravelStyle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-sm font-medium text-on-surface focus:outline-none focus:border-secondary cursor-pointer"
                  >
                    <option value="alpine">Alpine Explorer</option>
                    <option value="heritage">Heritage &amp; Forts</option>
                    <option value="adventure">4x4 Adventure</option>
                    <option value="luxury">Luxury Wellness</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Max Altitude Cap (Meters)
                </label>
                <input
                  type="number"
                  min="500"
                  max="6000"
                  step="100"
                  value={editAltitudeCap}
                  onChange={(e) => setEditAltitudeCap(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-sm font-medium text-on-surface focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-neutral-800 transition-colors text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Profile to Server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Feedback Toast (Controlled by React State) */}
      <div
        className={`fixed bottom-6 right-6 max-w-sm bg-primary text-white px-4 py-3 rounded-2xl shadow-2xl transition-all duration-300 z-50 flex items-center gap-3 border border-outline-variant/40 ${toastVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-16 opacity-0 pointer-events-none"
          }`}
      >
        <span className="material-symbols-outlined text-emerald-400 text-xl">
          check_circle
        </span>
        <span className="text-xs font-medium">{toastText}</span>
      </div>

      {/* Shared Application Footer */}
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
                <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/planner">
                  Curated Itineraries
                </Link>
                <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/places">
                  Regional Guides
                </Link>
                <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/explore#map">
                  Interactive Waypoints
                </Link>
                <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/recommendations">
                  AI Recommendations
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                AI Tools
              </span>
              <div className="flex flex-col gap-2">
                <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/planner">
                  Smart Itinerary Synthesizer
                </Link>
                <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/trips">
                  Saved Journeys
                </Link>
                <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/explore">
                  Elevation &amp; Climate Strip
                </Link>
                <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/planner">
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
              <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="#">
                Privacy Policy
              </Link>
              <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="#">
                Terms of Service
              </Link>
              <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="#">
                Security Architecture
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
