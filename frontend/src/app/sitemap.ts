import { MetadataRoute } from "next";
import { SITE_URL, API_BASE_URL } from "@/lib/siteConfig";
import { CURATED_ITINERARIES } from "@/lib/itinerariesData";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // Core verified public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/places`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/itineraries`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/explore`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/planner`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/recommendations`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/assistant`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // High-Intent Productized Itinerary Landing Routes
  const itineraryRoutes: MetadataRoute.Sitemap = CURATED_ITINERARIES.map((itinerary) => ({
    url: `${SITE_URL}/itineraries/${itinerary.slug}`,
    lastModified: currentDate,
    changeFrequency: "weekly" as const,
    priority: 0.95,
  }));

  // Dynamically query verified destination pages from backend
  let placeRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/places?limit=500`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.items || [];
      const seenUrls = new Set<string>();

      items.forEach((place: any) => {
        const slugOrId = place?.slug || place?.id;
        if (slugOrId) {
          const placeUrl = `${SITE_URL}/places/${slugOrId}`;
          if (!seenUrls.has(placeUrl)) {
            seenUrls.add(placeUrl);
            placeRoutes.push({
              url: placeUrl,
              lastModified: place.updated_at ? new Date(place.updated_at) : currentDate,
              changeFrequency: "weekly",
              priority: 0.9,
            });
          }
        }
      });
    }
  } catch (err) {
    console.warn("Dynamic sitemap generation using static routes:", err);
  }

  return [...staticRoutes, ...itineraryRoutes, ...placeRoutes];
}
