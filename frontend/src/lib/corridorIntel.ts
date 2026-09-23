import { intelApi } from "./api";

export interface FieldIntelReport {
  id: string;
  placeId?: string;
  placeSlug?: string;
  placeName: string;
  corridorName: string;
  cityId?: string;
  cityName?: string;
  tripId?: string;
  reporterName?: string;
  verifiedInTrip?: boolean;
  roadCondition: "paved_clear" | "patchy_potholes" | "jeep_4x4_only" | "landslide_blockage" | "snow_chains_req";
  fuelStatus: "fuel_ok" | "petrol_only" | "diesel_only" | "no_fuel";
  atmStatus: "atm_ok" | "atm_empty" | "cash_only";
  note?: string;
  timestamp: string;
}

export const ROAD_CONDITION_LABELS: Record<FieldIntelReport["roadCondition"], { label: string; icon: string; color: string; alert: boolean }> = {
  paved_clear: { label: "Smooth Asphalt (100% Clear)", icon: "check_circle", color: "text-emerald-700 bg-emerald-500/15 border-emerald-500/30", alert: false },
  patchy_potholes: { label: "Patchy / Potholes (Drive with Care)", icon: "warning", color: "text-amber-700 bg-amber-500/15 border-amber-500/30", alert: true },
  jeep_4x4_only: { label: "4x4 Jeep Trail Only (High Clearance)", icon: "minor_crash", color: "text-amber-800 bg-amber-500/20 border-amber-500/35", alert: true },
  landslide_blockage: { label: "Active Landslide Alert (Road Blocked)", icon: "block", color: "text-red-700 bg-red-500/20 border-red-500/35", alert: true },
  snow_chains_req: { label: "Snow Chains Required (Ice / Slush)", icon: "ac_unit", color: "text-blue-700 bg-blue-500/20 border-blue-500/35", alert: true },
};

export const FUEL_STATUS_LABELS: Record<FieldIntelReport["fuelStatus"], { label: string; icon: string; color: string }> = {
  fuel_ok: { label: "Fuel Available (Petrol & Diesel in Stock)", icon: "local_gas_station", color: "text-emerald-700" },
  petrol_only: { label: "Petrol Only (Diesel Low / Unavailable)", icon: "local_gas_station", color: "text-amber-700" },
  diesel_only: { label: "Diesel Only (Petrol Low / Unavailable)", icon: "local_gas_station", color: "text-amber-700" },
  no_fuel: { label: "Station Dry / No Fuel Available", icon: "error", color: "text-red-700" },
};

export const ATM_STATUS_LABELS: Record<FieldIntelReport["atmStatus"], { label: string; icon: string; color: string }> = {
  atm_ok: { label: "ATM Cash OK (Dispensing)", icon: "payments", color: "text-emerald-700" },
  atm_empty: { label: "Local ATMs Out of Cash / Offline", icon: "money_off", color: "text-red-700" },
  cash_only: { label: "100% Cash-Only Sector (No Cards/POS)", icon: "payments", color: "text-amber-800" },
};

export function normalizeKey(str?: string | null): string {
  if (!str) return "";
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
}

export function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return "Yesterday";
    return `${diffDay}d ago`;
  } catch {
    return "Recently";
  }
}

const MASTER_KEY = "wander_intel_all_reports";

/**
 * Reads all stored reports from the master list AND scans existing localStorage keys
 * to guarantee instantaneous cached rendering before network responses arrive.
 */
export function getAllReports(): FieldIntelReport[] {
  if (typeof window === "undefined") return [];
  const map = new Map<string, FieldIntelReport>();

  try {
    // 1. Read master list
    const masterSaved = localStorage.getItem(MASTER_KEY);
    if (masterSaved) {
      const parsed: FieldIntelReport[] = JSON.parse(masterSaved);
      if (Array.isArray(parsed)) {
        for (const r of parsed) {
          if (r && r.id) map.set(r.id, r);
        }
      }
    }

    // 2. Scan legacy and entity-specific keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("wander_intel_") && key !== MASTER_KEY) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (Array.isArray(parsed)) {
              for (const r of parsed) {
                if (r && r.id && !map.has(r.id)) {
                  map.set(r.id, r);
                }
              }
            } else if (parsed && parsed.id && !map.has(parsed.id)) {
              map.set(parsed.id, parsed);
            }
          }
        } catch {
          // ignore corrupted keys
        }
      }
    }
  } catch (err) {
    console.error("Error reading field intelligence reports", err);
  }

  // Sort newest first
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function getStoredReports(key: string): FieldIntelReport[] {
  if (typeof window === "undefined") return [];
  try {
    const norm = normalizeKey(key);
    const all = getAllReports();
    return all.filter((r) => {
      if (r.id === key) return true;
      if (r.tripId === key) return true;
      if (r.placeId === key) return true;
      if (r.placeSlug === key) return true;
      if (normalizeKey(r.placeName) === norm) return true;
      if (normalizeKey(r.corridorName) === norm) return true;
      return false;
    });
  } catch {
    return [];
  }
}

export interface PlaceReportQuery {
  placeId?: string;
  placeSlug?: string;
  placeName?: string;
  cityId?: string;
  cityName?: string;
  corridorName?: string;
}

/**
 * Synchronous client filter for instant cached rendering.
 */
export function getReportsForPlace(query: PlaceReportQuery): FieldIntelReport[] {
  const all = getAllReports();
  if (all.length === 0) return [];

  const targetId = query.placeId?.toLowerCase().trim();
  const targetSlug = query.placeSlug?.toLowerCase().trim();
  const targetNameNorm = normalizeKey(query.placeName);
  const targetCityId = query.cityId?.toLowerCase().trim();
  const targetCityNorm = normalizeKey(query.cityName);
  const targetCorridorNorm = normalizeKey(query.corridorName);

  const directPlaceReports: FieldIntelReport[] = [];
  const corridorReports: FieldIntelReport[] = [];
  const seenIds = new Set<string>();

  for (const r of all) {
    if (seenIds.has(r.id)) continue;

    const rId = r.placeId?.toLowerCase().trim();
    const rSlug = r.placeSlug?.toLowerCase().trim();
    const rNameNorm = normalizeKey(r.placeName);

    // 1. Direct Place Match
    const isDirectPlace =
      (targetId && rId && rId === targetId) ||
      (targetSlug && rSlug && rSlug === targetSlug) ||
      (targetNameNorm && rNameNorm && (rNameNorm === targetNameNorm || rNameNorm.includes(targetNameNorm) || targetNameNorm.includes(rNameNorm)));

    if (isDirectPlace) {
      directPlaceReports.push(r);
      seenIds.add(r.id);
      continue;
    }

    // 2. Regional / Corridor Match
    const isCorridorMatch =
      (targetCityId && r.cityId && r.cityId === targetCityId) ||
      (targetCityNorm && r.cityName && normalizeKey(r.cityName) === targetCityNorm) ||
      (targetCorridorNorm && r.corridorName && normalizeKey(r.corridorName) === targetCorridorNorm);

    if (isCorridorMatch) {
      corridorReports.push(r);
      seenIds.add(r.id);
    }
  }

  return [...directPlaceReports, ...corridorReports];
}

export interface TripReportQuery {
  tripId: string;
  waypoints?: Array<{ id?: string; name?: string; slug?: string }>;
  cityId?: string;
  corridorName?: string;
}

/**
 * Synchronous query to retrieve all reports for a trip and all its waypoints.
 */
export function getReportsForTrip(query: TripReportQuery): FieldIntelReport[] {
  const all = getAllReports();
  if (all.length === 0) return [];

  const waypointIds = new Set((query.waypoints || []).map((w) => w.id?.toLowerCase().trim()).filter(Boolean));
  const waypointSlugs = new Set((query.waypoints || []).map((w) => w.slug?.toLowerCase().trim()).filter(Boolean));
  const waypointNamesNorm = new Set((query.waypoints || []).map((w) => normalizeKey(w.name)).filter(Boolean));
  const tripCityId = query.cityId?.toLowerCase().trim();
  const corridorNorm = normalizeKey(query.corridorName);

  const matched: FieldIntelReport[] = [];
  const seenIds = new Set<string>();

  for (const r of all) {
    if (seenIds.has(r.id)) continue;

    if (r.tripId && r.tripId === query.tripId) {
      matched.push(r);
      seenIds.add(r.id);
      continue;
    }

    const rId = r.placeId?.toLowerCase().trim();
    const rSlug = r.placeSlug?.toLowerCase().trim();
    const rNameNorm = normalizeKey(r.placeName);

    const isWaypointMatch =
      (rId && waypointIds.has(rId)) ||
      (rSlug && waypointSlugs.has(rSlug)) ||
      (rNameNorm && waypointNamesNorm.has(rNameNorm));

    if (isWaypointMatch) {
      matched.push(r);
      seenIds.add(r.id);
      continue;
    }

    if (tripCityId && r.cityId && r.cityId === tripCityId) {
      matched.push(r);
      seenIds.add(r.id);
      continue;
    }
    if (corridorNorm && r.corridorName && normalizeKey(r.corridorName) === corridorNorm) {
      matched.push(r);
      seenIds.add(r.id);
      continue;
    }
  }

  return matched;
}

/**
 * Saves a report into the master local cache.
 */
export function saveReport(primaryKey: string, report: FieldIntelReport): FieldIntelReport[] {
  if (typeof window === "undefined") return [report];
  try {
    const all = getAllReports();
    const updatedMaster = [report, ...all.filter((r) => r.id !== report.id)];

    localStorage.setItem(MASTER_KEY, JSON.stringify(updatedMaster));
    localStorage.setItem(`wander_intel_${primaryKey}`, JSON.stringify(updatedMaster));

    if (report.placeId) {
      localStorage.setItem(`wander_intel_${report.placeId}`, JSON.stringify(updatedMaster));
      localStorage.setItem(`wander_intel_place_${report.placeId}`, JSON.stringify(updatedMaster));
    }
    if (report.placeSlug) {
      localStorage.setItem(`wander_intel_${report.placeSlug}`, JSON.stringify(updatedMaster));
      localStorage.setItem(`wander_intel_place_${report.placeSlug}`, JSON.stringify(updatedMaster));
    }
    if (report.placeName) {
      const pNorm = normalizeKey(report.placeName);
      if (pNorm) {
        localStorage.setItem(`wander_intel_${pNorm}`, JSON.stringify(updatedMaster));
        localStorage.setItem(`wander_intel_place_${pNorm}`, JSON.stringify(updatedMaster));
      }
    }
    if (report.tripId) {
      localStorage.setItem(`wander_intel_${report.tripId}`, JSON.stringify(updatedMaster));
      localStorage.setItem(`wander_intel_trip_${report.tripId}`, JSON.stringify(updatedMaster));
    }
    if (report.corridorName) {
      const cNorm = normalizeKey(report.corridorName);
      if (cNorm) {
        localStorage.setItem(`wander_intel_${cNorm}`, JSON.stringify(updatedMaster));
        localStorage.setItem(`wander_intel_corridor_${cNorm}`, JSON.stringify(updatedMaster));
      }
    }

    return getStoredReports(primaryKey);
  } catch (err) {
    console.error("Failed to save field intelligence report", err);
    return [report];
  }
}

/**
 * Asynchronously fetch crowdsourced intelligence from the central backend database.
 * Updates local cache seamlessly across all devices (phone, laptop, tablet).
 */
export async function fetchReportsFromApi(query: PlaceReportQuery | TripReportQuery): Promise<FieldIntelReport[]> {
  try {
    const params: Record<string, any> = {};
    if ("placeId" in query && query.placeId) params.place_id = query.placeId;
    if ("placeSlug" in query && query.placeSlug) params.place_slug = query.placeSlug;
    if ("placeName" in query && query.placeName) params.place_name = query.placeName;
    if ("cityId" in query && query.cityId) params.city_id = query.cityId;
    if ("cityName" in query && query.cityName) params.city_name = query.cityName;
    if ("corridorName" in query && query.corridorName) params.corridor_name = query.corridorName;
    if ("tripId" in query && query.tripId) params.trip_id = query.tripId;

    const data = await intelApi.list(params);
    if (data && Array.isArray(data.reports)) {
      const reports: FieldIntelReport[] = data.reports.map((r: any) => ({
        id: r.id,
        placeId: r.place_id || undefined,
        placeSlug: r.place_slug || undefined,
        placeName: r.place_name,
        corridorName: r.corridor_name,
        cityId: r.city_id || undefined,
        cityName: r.city_name || undefined,
        tripId: r.trip_id || undefined,
        reporterName: r.reporter_name,
        verifiedInTrip: r.verified_in_trip,
        roadCondition: r.road_condition,
        fuelStatus: r.fuel_status,
        atmStatus: r.atm_status,
        note: r.note || undefined,
        timestamp: r.created_at || r.timestamp || new Date().toISOString(),
      }));

      // Cache into localStorage for instant offline access
      if (typeof window !== "undefined" && reports.length > 0) {
        const existing = getAllReports();
        const map = new Map<string, FieldIntelReport>();
        for (const rep of [...reports, ...existing]) {
          if (rep && rep.id && !map.has(rep.id)) {
            map.set(rep.id, rep);
          }
        }
        localStorage.setItem(MASTER_KEY, JSON.stringify(Array.from(map.values())));
      }

      return reports;
    }
  } catch (err) {
    console.warn("Could not fetch reports from backend API, falling back to cached local storage:", err);
  }

  // Fallback to local cache if network/backend is unavailable
  if ("tripId" in query) {
    return getReportsForTrip(query as TripReportQuery);
  } else {
    return getReportsForPlace(query as PlaceReportQuery);
  }
}

/**
 * Universal broadcast: Saves to local storage and persists to the central database API.
 */
export async function submitReportToApi(report: FieldIntelReport, primaryKey: string): Promise<FieldIntelReport> {
  // 1. Save locally for instantaneous zero-latency UI update
  saveReport(primaryKey, report);

  // 2. Persist to central backend database for cross-device synchronization
  try {
    const payload = {
      place_id: report.placeId || null,
      place_slug: report.placeSlug || null,
      place_name: report.placeName,
      corridor_name: report.corridorName,
      city_id: report.cityId || null,
      city_name: report.cityName || null,
      trip_id: report.tripId || null,
      reporter_name: report.reporterName || "Verified Explorer",
      verified_in_trip: report.verifiedInTrip ?? true,
      road_condition: report.roadCondition,
      fuel_status: report.fuelStatus,
      atm_status: report.atmStatus,
      note: report.note || null,
    };

    const res = await intelApi.create(payload);
    if (res && res.id) {
      const serverReport: FieldIntelReport = {
        ...report,
        id: res.id,
        timestamp: res.created_at || res.timestamp || report.timestamp,
      };
      saveReport(primaryKey, serverReport);
      return serverReport;
    }
  } catch (err) {
    console.error("Failed to broadcast report to backend database API:", err);
  }

  return report;
}
