export interface User {
  id: string;
  email: string;
  full_name?: string;
  name?: string;
  role?: "user" | "admin";
  is_admin?: boolean;
  is_active?: boolean;
  profile?: UserProfile;
  preferences?: UserPreference[];
}

export interface UserProfile {
  id: string;
  user_id: string;
  home_city?: string;
  preferred_language: string;
  bio?: string;
  avatar_url?: string;
  phone_number?: string;
  preferred_budget_tier?: "budget" | "moderate" | "luxury";
  travel_style?: string;
}

export interface UserPreference {
  id: string;
  preference_key: string;
  weight: number;
}

export interface Region {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  description?: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  is_featured: boolean;
  region: Region;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface PlaceImage {
  id: string;
  url: string;
  caption?: string;
  license?: string;
  attribution?: string;
  is_primary: boolean;
}

export interface PlaceSummary {
  id: string;
  name: string;
  name_ur?: string;
  slug: string;
  wikidata_id?: string;
  city_id: string;
  category: Category;
  description?: string;
  estimated_cost_min?: number;
  estimated_cost_max?: number;
  average_visit_duration_minutes?: number;
  popularity_score: number;
  indoor_outdoor: "indoor" | "outdoor" | "both";
  family_suitable: boolean;
  activity_level: "low" | "moderate" | "high";
  latitude: number;
  longitude: number;
  elevation_meters?: number;
  vehicle_access?: "sedan" | "4x4_jeep" | "trekking_only";
  is_unesco_heritage?: boolean;
  primary_image?: PlaceImage;
}

export interface PlaceDetail extends PlaceSummary {
  description?: string;
  address?: string;
  opening_hours?: Record<string, any>;
  seasonality?: Record<string, any>;
  extra_info?: Record<string, any>;
  historical_significance?: number;
  food_relevance?: number;
  tags: Tag[];
  images: PlaceImage[];
  source?: string;
  source_url?: string;
  last_verified?: string;
  data_confidence?: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ItineraryItem {
  id: string;
  day_id: string;
  place: PlaceSummary;
  item_order: number;
  start_time: string;
  end_time: string;
  visit_duration_minutes: number;
  travel_time_from_prev_minutes?: number;
  travel_distance_from_prev_km?: number;
  estimated_cost?: number;
  notes?: string;
}

export interface ItineraryDay {
  id: string;
  itinerary_id: string;
  day_number: number;
  date?: string;
  weather_context?: Record<string, any>;
  items: ItineraryItem[];
}

export interface Itinerary {
  id: string;
  trip_id: string;
  version: number;
  total_cost: number;
  total_travel_time_minutes: number;
  total_travel_distance_km: number;
  feasibility_score: number;
  preference_satisfaction_score: number;
  algorithm: string;
  narrative?: string;
  generated_at: string;
  days: ItineraryDay[];
}

export interface Trip {
  id: string;
  user_id: string;
  city_id: string;
  title: string;
  duration_days: number;
  total_budget: number;
  pace: "relaxed" | "moderate" | "packed";
  start_date?: string;
  active_itinerary?: Itinerary;
  created_at: string;
}

export interface TripCreatePayload {
  city_id: string;
  title: string;
  duration_days: number;
  total_budget: number;
  pace: "relaxed" | "moderate" | "packed";
  start_date?: string;
  group_size?: number;
}

export interface ReoptimizePayload {
  new_total_budget?: number;
  new_duration_days?: number;
  new_pace?: "relaxed" | "moderate" | "packed";
}

export interface RAGSource {
  title: string;
  source: string;
  source_url?: string;
  last_verified?: string;
  confidence: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  sources?: RAGSource[];
  suggested_actions?: { label: string; action: string; payload?: any }[];
  timestamp: string;
}

