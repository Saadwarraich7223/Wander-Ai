import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import { SITE_URL } from "@/lib/siteConfig";
import { CURATED_ITINERARIES } from "@/lib/itinerariesData";

export const metadata: Metadata = {
  title: "Pakistan Travel Itineraries & Road Trips — Expert-Crafted Expeditions",
  description:
    "Explore expert-crafted, day-by-day travel itineraries across Pakistan: Hunza Valley, Skardu & Deosai, Swat, Neelum Valley, Lahore, and Makran Coastal Highway. 1-click AI customization.",
  keywords: [
    "Pakistan travel itineraries",
    "Northern Pakistan road trips",
    "Hunza 3 day tour plan",
    "Skardu 5 day itinerary",
    "Swat Kalam travel guide",
    "Neelum Valley Kashmir itinerary",
    "Lahore heritage weekend",
    "Makran coastal highway trip",
    "Pakistan tour packages",
  ],
  alternates: {
    canonical: `${SITE_URL}/itineraries`,
  },
  openGraph: {
    title: "Pakistan Travel Itineraries & Expedition Blueprints | WanderAI",
    description:
      "Expert-crafted multi-day road trips across Gilgit-Baltistan, KPK, Punjab, and Azad Kashmir with road feasibility, altitude profiles, and 1-click AI Trip Planner.",
    url: `${SITE_URL}/itineraries`,
    type: "website",
    images: [
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Passu_Cones_Hunza.jpg/1200px-Passu_Cones_Hunza.jpg",
        width: 1200,
        height: 630,
        alt: "Pakistan Travel Itineraries & Alpine Road Trips - WanderAI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pakistan Travel Itineraries & Road Trips | WanderAI",
    description: "Curated multi-day road trips across Pakistan with 1-click AI customization.",
    images: ["https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Passu_Cones_Hunza.jpg/1200px-Passu_Cones_Hunza.jpg"],
  },
};

const itinerariesStructuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Pakistan Travel Itineraries & Alpine Expedition Blueprints",
  url: `${SITE_URL}/itineraries`,
  description:
    "Directory of expert-crafted day-by-day road trip itineraries and alpine expeditions across Pakistan.",
  mainEntity: {
    "@type": "ItemList",
    name: "Curated Pakistan Travel Blueprints",
    itemListElement: CURATED_ITINERARIES.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.title,
      url: `${SITE_URL}/itineraries/${item.slug}`,
      description: item.summary,
    })),
  },
};

export default function ItinerariesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData data={itinerariesStructuredData} />
      {children}
    </>
  );
}
