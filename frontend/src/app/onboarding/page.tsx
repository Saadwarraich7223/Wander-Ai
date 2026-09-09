"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, CheckCircle2, Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import { api, placesApi, getErrorMessage } from "@/lib/api";
import { Category } from "@/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Record<string, number>>({});
  const [budgetTier, setBudgetTier] = useState<"budget" | "moderate" | "luxury">("moderate");
  const [travelStyle, setTravelStyle] = useState<"cultural" | "adventure" | "relaxation" | "mixed">("mixed");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setFetching(true);
      const data = await placesApi.getCategories();
      setCategories(data);

      // Pre-select first 2 categories if available
      if (data.length > 0) {
        const initial: Record<string, number> = {};
        initial[data[0].id] = 0.8;
        if (data.length > 1) initial[data[1].id] = 0.8;
        setSelectedCategoryIds(initial);
      }
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setFetching(false);
    }
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) => {
      const copy = { ...prev };
      if (copy[catId]) {
        delete copy[catId];
      } else {
        copy[catId] = 0.8;
      }
      return copy;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Bulk update category preferences with valid category_id UUIDs
      const preferencesPayload = Object.entries(selectedCategoryIds).map(([catId, score]) => ({
        category_id: catId,
        preference_score: score,
      }));

      if (preferencesPayload.length > 0) {
        await api.put("/users/me/preferences", { preferences: preferencesPayload });
      }

      // 2. Update profile with matching backend schema fields
      await api.put("/users/me/profile", {
        preferred_budget: budgetTier,
        travel_style: travelStyle,
      });

      router.push("/dashboard");
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to save preferences. Please check your selections."));
      console.error("Failed to save preferences", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white p-6 md:p-12 relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-emerald-600/15 rounded-full blur-[128px] pointer-events-none" />

      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-400 flex items-center justify-center">
            <Compass className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="font-bold tracking-tight text-lg">Setup Your Travel Profile</span>
        </div>
        <span className="text-xs text-emerald-400 font-semibold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          Step 1 of 1
        </span>
      </header>

      <main className="max-w-4xl mx-auto w-full my-auto space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            What interests you <span className="gradient-text">most when traveling?</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Select your travel preferences so our AI recommendation engine can build custom experiences for you.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Preference Cards */}
        {fetching ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading travel categories...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const isSelected = !!selectedCategoryIds[cat.id];
              return (
                <div
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-emerald-950/40 border-emerald-400/80 shadow-lg shadow-emerald-500/10"
                      : "glass-card hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white text-base">{cat.name}</h3>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {cat.description || `Explore top ${cat.name.toLowerCase()} destinations across Pakistan.`}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Additional Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 glass-panel p-6 rounded-2xl">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Preferred Budget Tier
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["budget", "moderate", "luxury"] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setBudgetTier(tier)}
                  className={`py-3 rounded-xl text-xs font-semibold capitalize border transition-all ${
                    budgetTier === tier
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Travel Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["cultural", "adventure", "relaxation", "mixed"] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setTravelStyle(style)}
                  className={`py-3 rounded-xl text-xs font-semibold capitalize border transition-all ${
                    travelStyle === style
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading || fetching}
            className="px-8 py-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            {loading ? (
              <span>Saving Profile...</span>
            ) : (
              <>
                <span>Complete Setup & Launch Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-slate-600 py-4">
        You can customize these preferences anytime from your account settings.
      </footer>
    </div>
  );
}
