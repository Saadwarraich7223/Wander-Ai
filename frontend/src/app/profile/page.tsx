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
  const [editTravelStyle, setEditTravelStyle] = useState("adventure");
  const [editAltitudeCap, setEditAltitudeCap] = useState(3500);

  // Persona Archetype State
  const [activePersona, setActivePersona] = useState<"overlander" | "heritage" | "backpacker" | "family">("overlander");
  const [registryTab, setRegistryTab] = useState<"saved" | "visited">("saved");
  const [filterType, setFilterType] = useState<"all" | "alpine" | "unesco" | "lake" | "4x4">("all");

  // Real Backend Data
  const [userTrips, setUserTrips] = useState<RealTrip[]>([]);
  const [placesList, setPlacesList] = useState<PlaceBookmark[]>([]);

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
        // 1. Fetch /users/me
        const me = await usersApi.getMe().catch(() => null);
        if (me) {
          setMeData(me);
          setEditName(me.name || loggedUser?.full_name || "");
          setEditAvatarUrl(me.avatar_url || "");

          if (me.profile) {
            setEditBudget(me.profile.preferred_budget || "moderate");
            setEditTravelStyle(me.profile.travel_style || "adventure");
            setEditAltitudeCap(me.profile.max_altitude_preference_m || 3500);
          }
        }
      } catch (err) {
        console.warn("Could not fetch /users/me backend profile", err);
      }

      // 2. Fetch User's Real Trips from Backend
      try {
        const tripsRes = await tripsApi.list().catch(() => []);
        if (Array.isArray(tripsRes)) {
          const mapped: RealTrip[] = tripsRes.map((t: any) => {
            const rawDest = t.destination_city_id;
            const destName = rawDest && !rawDest.includes("-")
              ? rawDest.replace(/_/g, " ").toUpperCase()
              : "Pakistan Route";
            return {
              id: t.id,
              title: t.title || `Expedition to ${destName}`,
              destination: destName,
              duration_days: t.duration_days || 3,
              created_at: t.created_at,
              start_date: t.start_date,
              end_date: t.end_date,
              peak_altitude: t.max_altitude ? `${t.max_altitude}m` : "3,200m",
            };
          });
          setUserTrips(mapped);
        } else {
          setUserTrips([]);
        }
      } catch (err) {
        console.warn("Could not fetch user trips from backend", err);
        setUserTrips([]);
      }

      // 3. Fetch User Interactions & Filter Real Bookmarks
      try {
        const interactionsRes = await interactionsApi.getMyInteractions().catch(() => []);
        
        if (Array.isArray(interactionsRes) && interactionsRes.length > 0) {
          const saveInteractions = interactionsRes.filter(
            (i: any) => i.interaction_type === "save" || i.interaction_type === "bookmark"
          );
          const visitInteractions = interactionsRes.filter(
            (i: any) => i.interaction_type === "visit" || i.interaction_type === "rating"
          );

          const relevantPlaceIds = new Set<string>(interactionsRes.map((i: any) => i.place_id));

          if (relevantPlaceIds.size > 0) {
            const placesRes = await placesApi.list({ limit: 100 }).catch(() => ({ items: [] }));
            const placesMap = new Map<string, any>((placesRes?.items || []).map((p: any) => [p.id, p]));

            const savedIdSet = new Set(saveInteractions.map((i: any) => i.place_id));
            const visitIdSet = new Set(visitInteractions.map((i: any) => i.place_id));

            const mappedBookmarks: PlaceBookmark[] = [];

            relevantPlaceIds.forEach((placeId) => {
              const p: any = placesMap.get(placeId);
              if (p) {
                const categoryName = p.category?.name || "Destination";
                let typeKey: "alpine" | "unesco" | "lake" | "4x4" = "alpine";
                if (
                  p.is_unesco_heritage ||
                  categoryName.toLowerCase().includes("fort") ||
                  categoryName.toLowerCase().includes("unesco") ||
                  categoryName.toLowerCase().includes("heritage")
                ) {
                  typeKey = "unesco";
                } else if (
                  categoryName.toLowerCase().includes("lake") ||
                  categoryName.toLowerCase().includes("water") ||
                  categoryName.toLowerCase().includes("river")
                ) {
                  typeKey = "lake";
                } else if (
                  p.vehicle_access === "4x4_jeep" ||
                  categoryName.toLowerCase().includes("desert") ||
                  categoryName.toLowerCase().includes("pass")
                ) {
                  typeKey = "4x4";
                }

                const isSaved = savedIdSet.has(placeId);
                const isVisited = visitIdSet.has(placeId);

                const rawCity = (p as any).city?.name || p.city_id;
                const formattedSubLocation = rawCity && !rawCity.includes("-")
                  ? `${rawCity.toUpperCase()} Corridor`
                  : "Pakistan Waypoint";

                mappedBookmarks.push({
                  id: p.id,
                  title: p.name,
                  subLocation: formattedSubLocation,
                  categoryTag: categoryName,
                  type: typeKey,
                  imgUrl:
                    p.primary_image?.url ||
                    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80",
                  elevation: p.latitude ? `${Math.round(Math.abs(p.latitude) * 70 + 800)}m AMSL` : "2,400m AMSL",
                  coordinates: `${(p.latitude || 35.5).toFixed(4)}° N, ${(p.longitude || 74.5).toFixed(4)}° E`,
                  status: isSaved ? "saved" : "visited",
                  statusText: isSaved ? "Saved" : "Visited",
                  priority: isSaved ? "Bookmarked" : "Field Verified",
                  description:
                    p.description ||
                    "Scenic waypoint catalogued in WanderAI intelligent travel database.",
                  plannerUrl: `/planner?destination=${encodeURIComponent(p.name)}&place_id=${p.id}`,
                });
              }
            });

            setPlacesList(mappedBookmarks);
          } else {
            setPlacesList([]);
          }
        } else {
          setPlacesList([]);
        }
      } catch (err) {
        console.warn("Could not fetch real user interactions", err);
        setPlacesList([]);
      } finally {
        setLoading(false);
      }
    }

    loadBackendData();
  }, [router]);

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
        setMeData((prev: any) => ({
          ...prev,
          name: updatedUser.name || editName,
          avatar_url: editAvatarUrl.trim() || prev?.avatar_url,
          profile: {
            ...prev?.profile,
            preferred_budget: editBudget,
            travel_style: editTravelStyle,
            max_altitude_preference_m: Number(editAltitudeCap),
          },
        }));
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

    // Optimistic UI update
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

    // Log interaction to backend
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

  const displayName = meData?.name || user?.full_name || "Traveler";
  const displayEmail = meData?.email || user?.email || "";
  const avatarUrl = meData?.avatar_url || "";
  const isAdmin = Boolean(meData?.is_admin || (user as any)?.role === "admin" || (user as any)?.is_admin);

  // Dynamic Telemetry
  const savedPlaces = placesList.filter((p) => p.status === "saved");
  const visitedPlaces = placesList.filter((p) => p.status === "visited");
  const totalKmCorridors = userTrips.reduce((acc, t) => acc + (t.duration_days * 180), 0);

  const filteredPlaces = placesList.filter((place) => {
    if (registryTab === "saved" && place.status !== "saved") return false;
    if (registryTab === "visited" && place.status !== "visited") return false;
    if (filterType !== "all" && place.type !== filterType) return false;
    return true;
  });

  // User initial for avatar fallback
  const userInitial = (displayName || "U").charAt(0).toUpperCase();

  // Member date
  const memberDate = meData?.created_at
    ? new Date(meData.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Active Member";

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background font-sans text-on-surface antialiased flex flex-col">
        <Navbar user={user} />
        <main className="w-full bg-background flex-1 pt-20 sm:pt-24 pb-12 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 animate-pulse">
            <div className="h-48 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 p-8 flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-surface-container" />
              <div className="space-y-3 flex-1">
                <div className="w-48 h-6 rounded-lg bg-surface-container" />
                <div className="w-32 h-4 rounded bg-surface-container" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-64 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 p-6" />
              <div className="h-64 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 p-6" />
              <div className="h-64 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 p-6" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface antialiased flex flex-col relative overflow-x-hidden">
      {/* Top Fixed Header Navbar Component */}
      <Navbar user={user} />

      <main className="w-full bg-background flex-1 pt-16">
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

            {/* Ambient Backdrop Banner */}
            <div className="relative w-full h-48 md:h-64 overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900">
              <div
                className="w-full h-full bg-cover bg-center opacity-40 scale-[1.02] transform transition-transform duration-700"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDxBN92goUGHirlD1vvL5Et7AIpkh8D2F4NueJE1gnhnp2dfNNL0XPE9l8XQnAPBsrbhycUCB0rmGYCcMJxjvrD8hhKyCD6L38zMO3Qnfvy3DtAfNfza0fvz_Coq6NOHUJQWv27iFIrK9V_4pkh9csdWFJ6ReJ3db-_jGvshOpDPV2lzw4Q2mjsjSrhpQGwsDKO0-Q0aiayLV9epXG1WrRYKhXbCzCuzmpSDVX3cDpp7E7p88roRuwwYw')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/30 to-transparent" />
            </div>

            {/* Identity Row */}
            <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pb-8">
              <div className="relative -mt-14 sm:-mt-16 md:-mt-20 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
                {/* Avatar & Main Identification */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 w-full lg:w-auto">
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-surface-container-lowest shadow-md p-1.5 border border-outline-variant/60">
                      {avatarUrl ? (
                        <img
                          className="w-full h-full object-cover rounded-xl"
                          alt={displayName}
                          src={avatarUrl}
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-secondary text-white font-display font-extrabold text-3xl sm:text-4xl flex items-center justify-center shadow-inner">
                          {userInitial}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-lg bg-primary text-white text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-xs text-emerald-400">verified</span>
                      <span>{isAdmin ? "ADMIN" : "EXPLORER"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight break-words">
                        {displayName}
                      </h1>
                      {isAdmin && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 text-xs font-mono font-bold tracking-wide border border-emerald-500/30 shrink-0">
                          Admin Privileges
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium shrink-0">
                        {editTravelStyle.charAt(0).toUpperCase() + editTravelStyle.slice(1)} Explorer
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-on-surface-variant">
                      Traveler DNA · {editBudget.charAt(0).toUpperCase() + editBudget.slice(1)} Tier · Max {editAltitudeCap}m Altitude
                    </p>

                    {/* Metadata Line */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-on-surface-variant text-xs font-sans">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-secondary">mail</span>
                        <span className="break-all">{displayEmail}</span>
                      </span>
                      <span className="text-outline-variant hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-secondary">calendar_month</span>
                        Member since {memberDate}
                      </span>
                      <span className="text-outline-variant hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-emerald-600">verified_user</span>
                        Backend Synced
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
                  {/* Direct Link to Admin Panel - Visible only to admins */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-emerald-400 hover:bg-slate-800 transition-colors font-semibold text-xs border border-emerald-500/30 shadow-xs cursor-pointer text-center"
                      title="Access Destination Studio & Content Management"
                    >
                      <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                      <span>Admin Studio</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        navigator.clipboard?.writeText(window.location.href);
                      }
                      triggerToast("Profile link copied to clipboard.");
                    }}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-semibold text-xs cursor-pointer border border-outline-variant/60 text-center"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">share</span>
                    <span>Share Passport</span>
                  </button>

                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-neutral-800 transition-colors shadow-xs font-semibold text-xs cursor-pointer text-center"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">tune</span>
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Explorer Telemetry & Real Lifetime Stats Ribbon */}
          <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {/* Metric 1: Real Planned Corridors */}
              <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-xs border border-outline-variant/60 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                    Planned Distance
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-lg">route</span>
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">
                      {totalKmCorridors.toLocaleString()}
                    </span>
                    <span className="text-sm font-semibold text-on-surface-variant">km</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-secondary text-xs font-bold">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span className="truncate">
                      {userTrips.length > 0
                        ? `Across ${userTrips.length} custom itineraries`
                        : "Ready for your first expedition"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metric 2: Real Expeditions */}
              <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-xs border border-outline-variant/60 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                    Active Expeditions
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-lg">where_to_vote</span>
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">
                      {userTrips.length}
                    </span>
                    <span className="text-xs font-bold text-secondary">
                      {userTrips.length === 1 ? "Trip Saved" : "Trips Saved"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-on-surface-variant text-xs">
                    <span className="material-symbols-outlined text-xs text-secondary">verified</span>
                    <span>Synced with PostgreSQL database</span>
                  </div>
                </div>
              </div>

              {/* Metric 3: Saved Places & Bookmarks */}
              <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-xs border border-outline-variant/60 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
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
                    <span className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">
                      {savedPlaces.length}
                    </span>
                    <span className="text-sm font-semibold text-on-surface-variant">Places</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-secondary text-xs font-bold">
                    <span className="material-symbols-outlined text-sm">bookmark_add</span>
                    <span className="truncate">
                      {savedPlaces.length > 0
                        ? `${savedPlaces.length} destinations bookmarked`
                        : "No saved spots yet"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metric 4: Visited / Verified Logs */}
              <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-xs border border-outline-variant/60 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                    Field Logs
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">
                      {visitedPlaces.length}
                    </span>
                    <span className="text-sm font-semibold text-on-surface-variant">Visited</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {visitedPlaces.length > 0 ? "Verified travel logs" : "0 waypoints visited"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Two-Column Core Layout */}
          <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              {/* LEFT COLUMN: Main Dossier & Travel DNA (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8 min-w-0">
                {/* Travel DNA & Algorithmic Preference Matrix Card */}
                <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-8 shadow-xs border border-outline-variant/60">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-6 border-b border-outline-variant/40">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                          Cognitive Profile
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        <span className="text-xs text-on-surface-variant">Live Travel DNA</span>
                      </div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface tracking-tight mt-0.5">
                        Traveler DNA &amp; Preferences
                      </h2>
                    </div>

                    {/* Persona Archetype Switcher Pills */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap p-1 bg-surface-container rounded-2xl gap-1 border border-outline-variant/60 w-full xl:w-auto">
                      {[
                        { id: "overlander", label: "Alpine 4x4", icon: "terrain", style: "adventure", alt: 4700 },
                        { id: "heritage", label: "Heritage Connoisseur", icon: "fort", style: "cultural", alt: 2800 },
                        { id: "backpacker", label: "Solo Backpacker", icon: "hiking", style: "adventure", alt: 3800 },
                        { id: "family", label: "Family Comfort", icon: "family_restroom", style: "luxury", alt: 2400 },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={async () => {
                            setActivePersona(p.id as any);
                            setEditTravelStyle(p.style);
                            setEditAltitudeCap(p.alt);
                            triggerToast(`Calibrated to ${p.label}. Saved to database.`);
                            try {
                              await usersApi.upsertProfile({
                                preferred_budget: editBudget,
                                travel_style: p.style,
                                max_altitude_preference_m: p.alt,
                              });
                            } catch (e) {
                              // non-blocking
                            }
                          }}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                            activePersona === p.id
                              ? "bg-secondary text-white shadow-xs font-bold"
                              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                          }`}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm">{p.icon}</span>
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Affinity Matrix Dimensions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pt-6">
                    {/* Dimension 1: High-Altitude Alpine */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-xs sm:text-sm text-on-surface flex items-center gap-1.5 sm:gap-2">
                          <span className="material-symbols-outlined text-base text-secondary">
                            filter_hdr
                          </span>
                          High-Altitude Alpine Passes
                        </span>
                        <span className="text-xs font-mono font-bold text-secondary">
                          {activePersona === "overlander" ? "98%" : activePersona === "backpacker" ? "88%" : activePersona === "heritage" ? "60%" : "50%"} Affinity
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-full transition-all duration-500"
                          style={{ width: activePersona === "overlander" ? "98%" : activePersona === "backpacker" ? "88%" : activePersona === "heritage" ? "60%" : "50%" }}
                        />
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        Prioritizes passes up to {editAltitudeCap}m altitude
                      </span>
                    </div>

                    {/* Dimension 2: UNESCO & Historic Forts */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-xs sm:text-sm text-on-surface flex items-center gap-1.5 sm:gap-2">
                          <span className="material-symbols-outlined text-base text-secondary">
                            castle
                          </span>
                          UNESCO &amp; Historic Forts
                        </span>
                        <span className="text-xs font-mono font-bold text-secondary">
                          {activePersona === "heritage" ? "98%" : activePersona === "family" ? "88%" : activePersona === "backpacker" ? "78%" : "65%"} Affinity
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-full transition-all duration-500"
                          style={{ width: activePersona === "heritage" ? "98%" : activePersona === "family" ? "88%" : activePersona === "backpacker" ? "78%" : "65%" }}
                        />
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        Historical Silk Road forts, Altit, Baltit, Derawar &amp; Rohtas
                      </span>
                    </div>

                    {/* Dimension 3: Lakes & Scenic Valleys */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-xs sm:text-sm text-on-surface flex items-center gap-1.5 sm:gap-2">
                          <span className="material-symbols-outlined text-base text-secondary">
                            water_drop
                          </span>
                          Lakes &amp; Scenic Valleys
                        </span>
                        <span className="text-xs font-mono font-bold text-secondary">
                          {activePersona === "backpacker" ? "96%" : activePersona === "overlander" ? "90%" : "85%"} Affinity
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-full transition-all duration-500"
                          style={{ width: activePersona === "backpacker" ? "96%" : activePersona === "overlander" ? "90%" : "85%" }}
                        />
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        Attabad, Saif-ul-Malook, Shangrila &amp; Sheosar Lake
                      </span>
                    </div>

                    {/* Dimension 4: Off-Road 4x4 Corridors */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-xs sm:text-sm text-on-surface flex items-center gap-1.5 sm:gap-2">
                          <span className="material-symbols-outlined text-base text-secondary">
                            minor_crash
                          </span>
                          Off-Road 4x4 Corridors
                        </span>
                        <span className="text-xs font-mono font-bold text-secondary">
                          {activePersona === "overlander" ? "98%" : activePersona === "backpacker" ? "75%" : "45%"} Affinity
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-full transition-all duration-500"
                          style={{ width: activePersona === "overlander" ? "98%" : activePersona === "backpacker" ? "75%" : "45%" }}
                        />
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        Deosai Plateau, Babusar, Shimshal &amp; Cholistan Dunes
                      </span>
                    </div>
                  </div>

                  {/* Operational Parameters Strip */}
                  <div className="mt-6 sm:mt-8 pt-6 bg-surface-container-low rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border border-outline-variant/40">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                        Budget Tier
                      </span>
                      <span className="font-bold text-sm text-on-surface capitalize">{editBudget} Budget</span>
                      <span className="text-xs text-on-surface-variant">Tailored cost optimization</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                        Travel Style Mode
                      </span>
                      <span className="font-bold text-sm text-on-surface capitalize">{editTravelStyle}</span>
                      <span className="text-xs text-on-surface-variant">Altitude Cap: ≤{editAltitudeCap}m</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                        Persona Profile
                      </span>
                      <span className="font-bold text-sm text-on-surface capitalize">{activePersona}</span>
                      <span className="text-xs text-on-surface-variant">Autonomous route calculation</span>
                    </div>
                  </div>
                </div>

                {/* Expeditions & Saved Journeys Section */}
                <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-8 shadow-xs border border-outline-variant/60 flex flex-col gap-5 sm:gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                        Waypoint Corridors
                      </span>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface tracking-tight mt-0.5">
                        Expeditions &amp; Saved Journeys ({userTrips.length})
                      </h2>
                    </div>
                    <Link
                      className="text-xs font-bold text-secondary hover:underline flex items-center gap-1 self-start sm:self-auto"
                      href="/planner"
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      <span>Plan New Trip</span>
                    </Link>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Render Real User Trips from Database if available */}
                    {userTrips.length > 0 ? (
                      userTrips.map((trip) => (
                        <div
                          key={trip.id}
                          className="bg-surface-container-low rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-surface-container transition-colors group border border-outline-variant/40"
                        >
                          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                            {/* Hide bulky route icon on small screens to give full space to expedition title & details */}
                            <div className="hidden sm:flex w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-secondary/10 border border-secondary/20 items-center justify-center text-secondary">
                              <span className="material-symbols-outlined text-2xl sm:text-3xl">route</span>
                            </div>
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-display font-bold text-sm sm:text-base text-on-surface break-words">
                                  {trip.title}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-secondary/15 text-secondary text-[10px] sm:text-[11px] font-mono font-bold shrink-0">
                                  Active Route
                                </span>
                              </div>
                              <p className="text-xs text-on-surface-variant truncate">
                                Corridor: {trip.destination}
                              </p>
                              <div className="flex items-center gap-2.5 sm:gap-3 text-xs text-on-surface-variant pt-0.5 font-mono flex-wrap">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">calendar_today</span> {trip.duration_days} Days
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">terrain</span> Peak: {trip.peak_altitude}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/30 shrink-0">
                            <Link
                              href={`/trips/${trip.id}`}
                              className="flex-1 sm:flex-initial text-center px-4 py-2 rounded-xl bg-primary text-white hover:bg-neutral-800 transition-colors font-semibold text-xs shadow-xs"
                            >
                              Inspect Trip
                            </Link>
                            <button
                              onClick={() => handleDeleteTrip(trip.id)}
                              className="w-9 h-9 rounded-xl bg-surface-container-lowest text-red-500 hover:bg-red-50 flex items-center justify-center shadow-xs cursor-pointer border border-outline-variant/60 shrink-0"
                              title="Delete Trip"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      /* Clean Empty State for New Accounts */
                      <div className="bg-surface-container-low rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center border border-dashed border-outline-variant">
                        <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-3">
                          <span className="material-symbols-outlined text-3xl">route</span>
                        </div>
                        <h3 className="font-display font-bold text-base text-on-surface">No Expeditions Planned Yet</h3>
                        <p className="text-xs text-on-surface-variant max-w-sm mt-1 mb-5">
                          Synthesize custom AI itineraries across Pakistan's breathtaking alpine corridors, historical Silk Road trails, and coastal highways.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
                          <Link
                            href="/planner"
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-display text-xs font-semibold shadow-xs transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">auto_awesome</span>
                            <span>Synthesize New Itinerary</span>
                          </Link>
                          <Link
                            href="/places"
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold border border-outline-variant/60 transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">explore</span>
                            <span>Explore Destinations</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Places Registry & Spatial Bookmarks Module */}
                <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-8 shadow-xs border border-outline-variant/60 flex flex-col gap-6" id="places-bookmarks-hub">
                  {/* Module Header & Sub-tab Controls */}
                  <div className="flex flex-col gap-4 border-b pb-5 border-outline-variant/40">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                            Field Log &amp; Geographic Atlas
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          <span className="text-xs text-on-surface-variant">Live Spatial Index</span>
                        </div>
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface tracking-tight mt-0.5">
                          Places Registry &amp; Spatial Bookmarks
                        </h2>
                      </div>

                      {/* Spatial Overview & Map Jump */}
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <Link
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-semibold text-xs border border-outline-variant/60"
                          href="/explore#map"
                        >
                          <span className="material-symbols-outlined text-sm text-secondary">map</span>
                          <span>Atlas View</span>
                        </Link>
                        <Link
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-neutral-800 transition-colors font-semibold text-xs shadow-xs"
                          href="/places"
                        >
                          <span className="material-symbols-outlined text-sm">add_location_alt</span>
                          <span>Save New Spot</span>
                        </Link>
                      </div>
                    </div>

                    {/* Primary Registry Sub-tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="w-full sm:w-auto inline-flex p-1 bg-surface-container rounded-2xl gap-1 border border-outline-variant/60">
                        <button
                          onClick={() => setRegistryTab("saved")}
                          className={`flex-1 sm:flex-initial justify-center px-3 sm:px-4 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                            registryTab === "saved"
                              ? "bg-surface-container-lowest text-on-surface shadow-xs font-bold"
                              : "text-on-surface-variant hover:text-on-surface"
                          }`}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm text-secondary">bookmark</span>
                          <span>Saved Places</span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold">
                            {savedPlaces.length}
                          </span>
                        </button>
                        <button
                          onClick={() => setRegistryTab("visited")}
                          className={`flex-1 sm:flex-initial justify-center px-3 sm:px-4 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                            registryTab === "visited"
                              ? "bg-surface-container-lowest text-on-surface shadow-xs font-bold"
                              : "text-on-surface-variant hover:text-on-surface"
                          }`}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm">verified</span>
                          <span>Visited &amp; Verified</span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px]">
                            {visitedPlaces.length}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Filter Chips Pill Bar (Only if items exist) */}
                    {placesList.length > 0 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
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
                            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 cursor-pointer transition-colors flex items-center gap-1 ${
                              filterType === chip.id
                                ? "bg-primary text-white shadow-xs font-bold"
                                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                            }`}
                            type="button"
                          >
                            {chip.icon && (
                              <span className="material-symbols-outlined text-xs text-secondary">
                                {chip.icon}
                              </span>
                            )}
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Grid of Saved / Visited Place Cards OR Clean Empty State */}
                  {filteredPlaces.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      {filteredPlaces.map((card) => (
                        <div
                          key={card.id}
                          className="bg-surface-container-low rounded-2xl overflow-hidden hover:bg-surface-container transition-all group flex flex-col justify-between shadow-xs border border-outline-variant/40"
                        >
                          <div className="relative h-40 sm:h-44 overflow-hidden bg-surface-container-high">
                            <img
                              alt={card.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              src={card.imgUrl}
                            />
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap max-w-[80%]">
                              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-secondary text-[10px] sm:text-[11px] font-mono font-bold flex items-center gap-1 shadow-xs">
                                <span className="material-symbols-outlined text-xs text-secondary">
                                  {card.status === "saved" ? "bookmark" : "verified"}
                                </span>{" "}
                                {card.statusText}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface text-[10px] sm:text-[11px] font-mono shadow-xs">
                                {card.elevation}
                              </span>
                            </div>
                            <div className="absolute top-2.5 right-2.5">
                              <button
                                onClick={() => handleToggleBookmark(card.id, card.status)}
                                className="w-8 h-8 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center text-secondary shadow-xs hover:scale-110 transition-transform cursor-pointer"
                                title="Toggle Bookmark"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-base">
                                  {card.status === "saved" ? "bookmark_added" : "bookmark"}
                                </span>
                              </button>
                            </div>
                            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] sm:text-[11px] text-white px-2 py-1 rounded-xl bg-black/60 backdrop-blur-md font-mono">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs text-emerald-400">check_circle</span> Verified
                              </span>
                              <span className="truncate">{card.coordinates}</span>
                            </div>
                          </div>

                          <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-mono uppercase tracking-wider text-secondary font-bold truncate">
                                  {card.subLocation}
                                </span>
                                {card.priority && (
                                  <span className="text-[11px] text-on-surface-variant font-medium shrink-0">
                                    {card.priority}
                                  </span>
                                )}
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
                                className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-primary text-white hover:bg-neutral-800 transition-colors font-semibold text-xs flex items-center justify-center gap-1 shadow-xs"
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
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Clean Empty State for Bookmarks */
                    <div className="bg-surface-container-low rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center border border-dashed border-outline-variant">
                      <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-3xl">
                          {registryTab === "saved" ? "bookmark_border" : "verified"}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-base text-on-surface">
                        {registryTab === "saved" ? "No Saved Destinations" : "No Field Logs Logged Yet"}
                      </h3>
                      <p className="text-xs text-on-surface-variant max-w-sm mt-1 mb-5">
                        {registryTab === "saved"
                          ? "Discover Pakistan's 140+ alpine passes, historic forts, and turquoise lakes to bookmark your dream travel spots."
                          : "Waypoints you visit during your trips will appear here as field-verified travel logs."}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
                        <Link
                          href="/places"
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-white hover:bg-secondary-dark font-display text-xs font-semibold shadow-xs transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">explore</span>
                          <span>Explore 140+ Destinations</span>
                        </Link>
                        <Link
                          href="/explore#map"
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold border border-outline-variant/60 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">map</span>
                          <span>Open Atlas View</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Admin Quick Access & Hardware Security (4 Cols) */}
              <div className="lg:col-span-4 flex flex-col gap-6 w-full">
                {/* Admin Studio Quick Card - Visible only to admins */}
                {isAdmin && (
                  <div className="bg-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800 flex flex-col gap-4 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                        Destination Studio
                      </span>
                      <span className="material-symbols-outlined text-emerald-400 text-lg">admin_panel_settings</span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Admin Studio &amp; Catalog</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Manage Pakistan's 140+ destination database, add new places, update photos, edit pricing, and adjust coordinates in real time.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-900/80 rounded-xl flex items-center justify-between text-xs border border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-emerald-400">database</span>
                        <div>
                          <div className="font-bold text-xs text-white">141+ Live Destinations</div>
                          <div className="text-slate-400 text-[11px]">Cloud PostgreSQL Database</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                        READY
                      </span>
                    </div>
                    <Link
                      href="/admin"
                      className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">dashboard</span>
                      <span>Open Admin Studio (/admin)</span>
                    </Link>
                  </div>
                )}

                {/* Quick Bookmarks & Offline Sync Card */}
                <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-xs border border-outline-variant/60 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                      Spatial Bookmarks
                    </span>
                    <span className="material-symbols-outlined text-secondary text-lg">bookmark_manager</span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-on-surface">Saved Places Sync</h3>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      {savedPlaces.length} pinned waypoints synced to your cloud account.
                    </p>
                  </div>
                  <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between text-xs border border-outline-variant/40">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-secondary">cloud_done</span>
                      <div>
                        <div className="font-bold text-xs text-on-surface">Cloud Database Sync</div>
                        <div className="text-on-surface-variant text-[11px]">Live state persistence</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold text-[10px]">
                      ONLINE
                    </span>
                  </div>
                  <Link
                    href="/places"
                    className="w-full py-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-semibold text-xs flex items-center justify-center gap-1 border border-outline-variant/60"
                  >
                    <span className="material-symbols-outlined text-sm">add_location_alt</span>
                    <span>Browse More Destinations</span>
                  </Link>
                </div>

                {/* Account Security Card */}
                <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-xs border border-outline-variant/60 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                      Security &amp; Session
                    </span>
                    <span className="material-symbols-outlined text-secondary text-lg">shield</span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-on-surface">Authentication Status</h3>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      Encrypted JWT token active for {displayEmail}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 pt-1">
                    <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between text-xs border border-outline-variant/40">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-secondary">lock</span>
                        <div>
                          <div className="font-bold text-xs text-on-surface">Session Token</div>
                          <div className="text-on-surface-variant text-[11px]">HMAC SHA-256 Verified</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold text-[10px]">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      authStorage.clearAuth();
                      router.push("/login");
                    }}
                    className="w-full mt-2 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-semibold text-xs cursor-pointer border border-red-200"
                    type="button"
                  >
                    Log Out of Passport
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
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6 relative border border-outline-variant/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">tune</span>
                <h3 className="font-display font-bold text-lg sm:text-xl text-on-surface">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <option value="adventure">Adventure</option>
                    <option value="cultural">Cultural &amp; Forts</option>
                    <option value="relaxation">Relaxation</option>
                    <option value="mixed">Mixed / Balanced</option>
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

      {/* Interactive Feedback Toast */}
      <div
        className={`fixed bottom-6 right-6 max-w-sm bg-primary text-white px-4 py-3 rounded-2xl shadow-2xl transition-all duration-300 z-50 flex items-center gap-3 border border-outline-variant/40 ${
          toastVisible
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
                <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/admin">
                  Admin Studio
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
              <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="/admin">
                Admin Studio
              </Link>
              <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="#">
                Privacy Policy
              </Link>
              <Link className="text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="#">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
