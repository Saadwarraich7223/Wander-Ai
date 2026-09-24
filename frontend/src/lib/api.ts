import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { authStorage } from "./auth";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Bearer Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = authStorage.getRefreshToken();

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });

          authStorage.setTokens(res.data);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
          }
          return api(originalRequest);
        } catch (refreshErr) {
          authStorage.clearAuth();
          return Promise.reject(refreshErr);
        }
      } else {
        authStorage.clearAuth();
      }
    }
    return Promise.reject(error);
  }
);

// --- High-Performance In-Memory Cache & In-Flight Request Deduplication ---
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

function getFromCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setInCache<T>(key: string, data: T, ttlMs: number): void {
  memoryCache.set(key, { data, expiry: Date.now() + ttlMs });
}

function invalidateCache(keyPrefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      memoryCache.delete(key);
    }
  }
}

async function cachedFetch<T>(
  cacheKey: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  bypassCache = false
): Promise<T> {
  if (!bypassCache) {
    const cached = getFromCache<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  const existingPromise = inFlightRequests.get(cacheKey);
  if (existingPromise) {
    return existingPromise as Promise<T>;
  }

  const promise = fetcher()
    .then((result) => {
      setInCache(cacheKey, result, ttlMs);
      inFlightRequests.delete(cacheKey);
      return result;
    })
    .catch((err) => {
      inFlightRequests.delete(cacheKey);
      throw err;
    });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

export const tripsApi = {
  create: async (data: any) => {
    invalidateCache("trips");
    const res = await api.post("/trips", data);
    return res.data;
  },
  list: async (forceRefresh = false) => {
    return cachedFetch("trips:list", 30 * 1000, async () => {
      const res = await api.get("/trips");
      return res.data;
    }, forceRefresh);
  },
  getById: async (id: string, forceRefresh = false) => {
    return cachedFetch(`trips:${id}`, 30 * 1000, async () => {
      const res = await api.get(`/trips/${id}`);
      return res.data;
    }, forceRefresh);
  },
  remove: async (id: string) => {
    invalidateCache("trips");
    await api.delete(`/trips/${id}`);
  },
  reoptimize: async (id: string, data: any) => {
    invalidateCache("trips");
    const res = await api.post(`/trips/${id}/reoptimize`, data);
    return res.data;
  },
  addStop: async (tripId: string, data: { place_id: string; preferred_day_number?: number }) => {
    invalidateCache("trips");
    const res = await api.post(`/trips/${tripId}/stops`, data);
    return res.data;
  },
  removeStop: async (tripId: string, itemId: string) => {
    invalidateCache("trips");
    const res = await api.delete(`/trips/${tripId}/stops/${itemId}`);
    return res.data;
  },
  updateStatus: async (id: string, status: "planning" | "active" | "completed" | "cancelled") => {
    invalidateCache("trips");
    const res = await api.patch(`/trips/${id}/status`, { status });
    return res.data;
  },
  toggleCheckIn: async (tripId: string, itemId: string, isVisited: boolean = true) => {
    invalidateCache("trips");
    const res = await api.post(`/trips/${tripId}/checkin`, { item_id: itemId, is_visited: isVisited });
    return res.data;
  },
  logExpense: async (tripId: string, expense: { category: string; amount: number; notes?: string; day_number?: number }) => {
    invalidateCache("trips");
    const res = await api.post(`/trips/${tripId}/expenses`, expense);
    return res.data;
  },
  deleteExpense: async (tripId: string, expenseId: string) => {
    invalidateCache("trips");
    const res = await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
    return res.data;
  },
  invalidateCache: () => invalidateCache("trips"),
};

export const placesApi = {
  list: async (params?: Record<string, any>, forceRefresh = false) => {
    const key = `places:list:${params ? JSON.stringify(params) : "default"}`;
    return cachedFetch(key, 2 * 60 * 1000, async () => {
      const res = await api.get("/places", { params });
      const data = res.data;
      if (data?.items && Array.isArray(data.items)) {
        // Pre-seed individual place cache so any click opens instantaneously
        for (const item of data.items) {
          if (item?.id) {
            setInCache(`places:item:${item.id}`, item, 5 * 60 * 1000);
            if (item.slug) {
              setInCache(`places:item:${item.slug}`, item, 5 * 60 * 1000);
            }
          }
        }
      }
      return data;
    }, forceRefresh);
  },
  getById: async (id: string, forceRefresh = false) => {
    const key = `places:item:${id}`;
    return cachedFetch(key, 5 * 60 * 1000, async () => {
      const res = await api.get(`/places/${id}`);
      const data = res.data;
      if (data?.id) {
        setInCache(`places:item:${data.id}`, data, 5 * 60 * 1000);
        if (data.slug) {
          setInCache(`places:item:${data.slug}`, data, 5 * 60 * 1000);
        }
      }
      return data;
    }, forceRefresh);
  },
  getCachedPlace: (id: string) => {
    return getFromCache<any>(`places:item:${id}`);
  },
  seedPlaceCache: (place: any) => {
    if (!place) return;
    if (place.id) {
      setInCache(`places:item:${place.id}`, place, 5 * 60 * 1000);
    }
    if (place.slug) {
      setInCache(`places:item:${place.slug}`, place, 5 * 60 * 1000);
    }
  },
  prefetchPlace: (id: string, initialData?: any) => {
    if (initialData) {
      placesApi.seedPlaceCache(initialData);
    }
    placesApi.getById(id).catch(() => {});
  },
  getCities: async (forceRefresh = false) => {
    return cachedFetch("static:cities", 15 * 60 * 1000, async () => {
      const res = await api.get("/cities");
      return res.data;
    }, forceRefresh);
  },
  getCachedCities: () => {
    return getFromCache<any[]>("static:cities");
  },
  getCategories: async (forceRefresh = false) => {
    return cachedFetch("static:categories", 15 * 60 * 1000, async () => {
      const res = await api.get("/categories");
      return res.data;
    }, forceRefresh);
  },
  getCachedCategories: () => {
    return getFromCache<any[]>("static:categories");
  },
  invalidateCache: () => {
    invalidateCache("places");
    invalidateCache("static");
  },
};

export const recApi = {
  getRecommendations: async (params?: Record<string, any>) => {
    const res = await api.get("/recommendations", { params });
    return res.data;
  },
};

export const aiApi = {
  chat: async (data: { message: string; trip_id?: string; city_id?: string }) => {
    const res = await api.post("/ai/chat", data);
    return res.data;
  },
};

export const interactionsApi = {
  log: async (data: { place_id: string; interaction_type: string; rating?: number; context?: any }) => {
    const res = await api.post("/interactions", data);
    return res.data;
  },
  getMyInteractions: async () => {
    const res = await api.get("/interactions/me");
    return res.data;
  },
};

export const usersApi = {
  getMe: async () => {
    const res = await api.get("/users/me");
    return res.data;
  },
  updateMe: async (data: { name?: string; avatar_url?: string }) => {
    const res = await api.patch("/users/me", data);
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get("/users/me/profile");
    return res.data;
  },
  upsertProfile: async (data: any) => {
    const res = await api.put("/users/me/profile", data);
    return res.data;
  },
  getPreferences: async () => {
    const res = await api.get("/users/me/preferences");
    return res.data;
  },
  upsertPreferences: async (data: { preferences: { category_id: string; preference_score: number }[] }) => {
    const res = await api.put("/users/me/preferences", data);
    return res.data;
  },
};

export const intelApi = {
  list: async (params?: Record<string, any>) => {
    const res = await api.get("/corridor-intel", { params });
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post("/corridor-intel", data);
    return res.data;
  },
};

export function getErrorMessage(err: any, fallback = "An error occurred"): string {
  const detail = err?.response?.data?.detail;
  if (!detail) return err?.message || fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: any) => {
        if (typeof d === "string") return d;
        const loc = Array.isArray(d.loc)
          ? d.loc.filter((l: any) => l !== "body" && l !== "query" && l !== "path").join(".")
          : "";
        const msg = d.msg || JSON.stringify(d);
        return loc ? `${loc}: ${msg}` : msg;
      })
      .join("; ");
  }
  if (typeof detail === "object") return JSON.stringify(detail);
  return fallback;
}


