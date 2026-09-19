import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { authStorage } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return Promise.reject(refreshErr);
        }
      } else {
        authStorage.clearAuth();
      }
    }
    return Promise.reject(error);
  }
);

export const tripsApi = {
  create: async (data: any) => {
    const res = await api.post("/trips", data);
    return res.data;
  },
  list: async () => {
    const res = await api.get("/trips");
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/trips/${id}`);
    return res.data;
  },
  remove: async (id: string) => {
    await api.delete(`/trips/${id}`);
  },
  reoptimize: async (id: string, data: any) => {
    const res = await api.post(`/trips/${id}/reoptimize`, data);
    return res.data;
  },
  addStop: async (tripId: string, data: { place_id: string; preferred_day_number?: number }) => {
    const res = await api.post(`/trips/${tripId}/stops`, data);
    return res.data;
  },
};

export const placesApi = {
  list: async (params?: Record<string, any>) => {
    const res = await api.get("/places", { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/places/${id}`);
    return res.data;
  },
  getCities: async () => {
    const res = await api.get("/cities");
    return res.data;
  },
  getCategories: async () => {
    const res = await api.get("/categories");
    return res.data;
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


