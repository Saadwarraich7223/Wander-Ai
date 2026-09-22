import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import { SITE_URL } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Explore Curated Destinations in Pakistan — Valleys, Heritage & Coastlines",
  description:
    "Discover and filter curated destinations across Pakistan. Filter by vibe, season, elevation, budget, and outdoor activity levels from Hunza to Gwadar.",
  alternates: {
    canonical: "/places",
  },
  openGraph: {
    title: "Explore Pakistan Destinations & Travel Waypoints | WanderAI",
    description:
      "Filter curated destinations across Pakistan by seasonal weather windows, budget, altitude, and adventure style.",
    url: `${SITE_URL}/places`,
    type: "website",
    images: [
      {
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAky2BntZW4gkilTOyaiD7E5EPAGPseUMIn8FQk5P-rlcUcyojZR5yj3i8j3uRTzkCVi3A2gRsux4uRF8PhB1MxYnGRMVcBmMzOAz6k7n5MsYfs8Vr_0CRi_ZnkptQ_gIRC1vA1OLLZyT5Qdxu9IhduBm1WSqIxE6bfMPBWXUD1xlvScKhQnvAFSXNiY1AiaVKBED75Bh8MR9Jexe-CSdM9EYARPKP-usB2K4Pg_1w9XmRTfbuIuw1a8w",
        width: 1200,
        height: 630,
        alt: "Explore Curated Pakistan Travel Destinations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Pakistan Destinations | WanderAI",
    description: "Curated Pakistani destinations with real-time seasonal data, elevation, and budget controls.",
  },
};

const placesStructuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Curated Pakistan Travel Destinations Directory",
  url: `${SITE_URL}/places`,
  description:
    "Comprehensive directory of tourist destinations, mountain valleys, heritage sites, and alpine lakes across Pakistan.",
  mainEntity: {
    "@type": "ItemList",
    name: "Featured Pakistan Tourist Destinations",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Hunza Valley & Karimabad",
        url: `${SITE_URL}/places/hunza-express`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Skardu & Deosai National Park",
        url: `${SITE_URL}/places/skardu-deosai`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Lahore Walled City & Badshahi",
        url: `${SITE_URL}/places/lahore-walled-city`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Swat Valley & Kalam Alpine Waters",
        url: `${SITE_URL}/places/swat-kalam`,
      },
    ],
  },
};

export default function PlacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData data={placesStructuredData} />
      {children}
    </>
  );
}
