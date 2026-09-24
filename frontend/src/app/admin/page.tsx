"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Plus, Trash2, ShieldCheck, MapPin, RefreshCw, Edit3, Image as ImageIcon, Search, X, Check, ExternalLink, ShieldAlert } from "lucide-react";
import { api, usersApi } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { sanitizeSearchQuery } from "@/lib/sanitize";
import { PlaceSummary, User } from "@/types";

interface EditModalState {
  isOpen: boolean;
  placeId: string | null;
  name: string;
  imageUrl: string;
  description: string;
  costMin: number | string;
  costMax: number | string;
  lat: number | string;
  lng: number | string;
}

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [places, setPlaces] = useState<PlaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  useEffect(() => {
    const user = authStorage.getUser();
    const token = authStorage.getAccessToken();

    if (!token && !user) {
      router.push("/login?redirect=/admin");
      return;
    }

    setCurrentUser(user);

    async function verifyAdmin() {
      try {
        const me = await usersApi.getMe();
        if (me) {
          const hasAdmin = Boolean(me.is_admin || me.role === "admin");
          setIsAdmin(hasAdmin);
          if (hasAdmin) {
            fetchPlaces();
          }
        } else {
          const hasAdmin = Boolean(user?.is_admin || user?.role === "admin");
          setIsAdmin(hasAdmin);
          if (hasAdmin) {
            fetchPlaces();
          }
        }
      } catch (err) {
        const hasAdmin = Boolean(user?.is_admin || user?.role === "admin");
        setIsAdmin(hasAdmin);
        if (hasAdmin) {
          fetchPlaces();
        }
      } finally {
        setAuthLoading(false);
      }
    }

    verifyAdmin();
  }, [router]);

  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    placeId: null,
    name: "",
    imageUrl: "",
    description: "",
    costMin: "",
    costMax: "",
    lat: "",
    lng: "",
  });

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const res = await api.get("/places?limit=100");
      setPlaces(res.data.items || []);
    } catch (err) {
      console.error("Failed to load admin places", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (place: PlaceSummary) => {
    setEditModal({
      isOpen: true,
      placeId: place.id,
      name: place.name,
      imageUrl: place.primary_image?.url || "",
      description: "",
      costMin: place.estimated_cost_min || 0,
      costMax: place.estimated_cost_max || 0,
      lat: place.latitude || 31.5204,
      lng: place.longitude || 74.3587,
    });
  };

  const handleSavePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.placeId) return;

    try {
      const payload: Record<string, any> = {
        name: editModal.name,
        image_url: editModal.imageUrl,
        estimated_cost_min: parseFloat(String(editModal.costMin)) || 0,
        estimated_cost_max: parseFloat(String(editModal.costMax)) || 0,
        latitude: parseFloat(String(editModal.lat)) || 31.5204,
        longitude: parseFloat(String(editModal.lng)) || 74.3587,
      };

      const res = await api.put(`/places/${editModal.placeId}`, payload);
      
      // Update local state
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === editModal.placeId
            ? {
                ...p,
                name: editModal.name,
                primary_image: editModal.imageUrl ? { id: "img-edit", url: editModal.imageUrl, is_primary: true } : p.primary_image,
                estimated_cost_min: parseFloat(String(editModal.costMin)) || 0,
                estimated_cost_max: parseFloat(String(editModal.costMax)) || 0,
              }
            : p
        )
      );

      setSaveSuccessMsg(`Updated "${editModal.name}" successfully!`);
      setTimeout(() => setSaveSuccessMsg(""), 3000);
      setEditModal((prev) => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error("Failed to update place", err);
      alert("Failed to update place. Please verify inputs.");
    }
  };

  const handleDeletePlace = async (placeId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/places/${placeId}`);
      setPlaces((prev) => prev.filter((p) => p.id !== placeId));
    } catch (err) {
      console.error("Failed to delete place", err);
    }
  };

  const filteredPlaces = places.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
        <h2 className="font-bold text-lg text-white">Verifying Admin Credentials</h2>
        <p className="text-xs text-slate-400 mt-1">Authenticating access to Destination Studio...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#090d16] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="font-bold text-xl text-white mb-2">Administrator Access Required</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          The Destination Studio is restricted to administrator accounts. Please log in with an admin profile to manage places.
        </p>
        <div className="flex gap-3">
          <Link
            href="/profile"
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 text-xs font-semibold"
          >
            Back to Profile
          </Link>
          <Link
            href="/explore"
            className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-bold"
          >
            Explore Destinations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Link href="/explore" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-400 flex items-center justify-center">
            <Compass className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="font-bold text-lg text-white">
            WanderAI <span className="text-emerald-400">Destination Studio</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPlaces}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 border border-slate-700 flex items-center gap-2 text-xs font-semibold"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-6 py-8 space-y-8 flex-1">
        {saveSuccessMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-fadeIn">
            <Check className="w-5 h-5 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Manage Destination Catalog</h1>
            <p className="text-slate-400 text-sm mt-1">
              Add new places, update image URLs, edit pricing, or remove entries in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Admin Privileges Active</span>
            </div>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search place by name, category, or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredPlaces.length} of {places.length} destinations
          </span>
        </div>

        {/* Places Table */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading destination records...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Destination</th>
                    <th className="px-6 py-4">Image Preview</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Coordinates</th>
                    <th className="px-6 py-4">Cost Range</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredPlaces.map((place) => (
                    <tr key={place.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">
                        <div className="flex flex-col">
                          <span className="text-base">{place.name}</span>
                          <span className="text-xs font-mono text-slate-500 font-normal">/{place.slug}</span>
                        </div>
                      </td>

                      {/* Image Preview & Quick Link */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-10 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700 relative group">
                            {place.primary_image?.url ? (
                              <img src={place.primary_image.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          {place.primary_image?.url && (
                            <a
                              href={place.primary_image.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-emerald-400 p-1"
                              title="Open image in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-emerald-400">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          {place.category?.name || "Attraction"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                        {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-slate-300">
                        {place.estimated_cost_min ? `PKR ${place.estimated_cost_min.toLocaleString()}` : "Free"}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(place)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                            title="Edit place details & image"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Edit Image</span>
                          </button>

                          <button
                            onClick={() => handleDeletePlace(place.id, place.name)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete place"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* EDIT MODAL */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">Edit Destination Image &amp; Details</h2>
              </div>
              <button
                onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-2 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlace} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Destination Name
                </label>
                <input
                  type="text"
                  required
                  value={editModal.name}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Image URL & Live Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Image URL (Paste High Quality Unsplash / Direct Image URL)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={editModal.imageUrl}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50"
                />

                {/* Live Preview Box */}
                {editModal.imageUrl && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Live Preview:</span>
                    <div className="w-full h-40 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 relative">
                      <img
                        src={editModal.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Cost Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Est. Cost Min (PKR)
                  </label>
                  <input
                    type="number"
                    value={editModal.costMin}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, costMin: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Est. Cost Max (PKR)
                  </label>
                  <input
                    type="number"
                    value={editModal.costMax}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, costMax: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
