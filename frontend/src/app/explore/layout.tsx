import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://wanderai.travel").replace(/\/+$/, "");

export const metadata: Metadata = {
  title: "Interactive Pakistan Travel Map & Waypoint Explorer",
  description:
    "Visually discover Pakistan's mountain passes, alpine lakes, heritage monuments, and coastal highways on an interactive geospatial map.",
  alternates: {
    canonical: "/explore",
  },
  openGraph: {
    title: "Interactive Pakistan Travel Map & Waypoint Explorer | WanderAI",
    description:
      "Explore Pakistan's geography, mountain passes, cultural heritage sites, and hidden gems on an interactive map.",
    url: `${SITE_URL}/explore`,
    type: "website",
    images: [
      {
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAky2BntZW4gkilTOyaiD7E5EPAGPseUMIn8FQk5P-rlcUcyojZR5yj3i8j3uRTzkCVi3A2gRsux4uRF8PhB1MxYnGRMVcBmMzOAz6k7n5MsYfs8Vr_0CRi_ZnkptQ_gIRC1vA1OLLZyT5Qdxu9IhduBm1WSqIxE6bfMPBWXUD1xlvScKhQnvAFSXNiY1AiaVKBED75Bh8MR9Jexe-CSdM9EYARPKP-usB2K4Pg_1w9XmRTfbuIuw1a8w",
        width: 1200,
        height: 630,
        alt: "Interactive Pakistan Travel Map",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Interactive Pakistan Travel Map | WanderAI",
    description: "Visual exploration of Pakistan's northern valleys, historical cities, and road trip waypoints.",
  },
};

const exploreStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Interactive Pakistan Travel Map & Waypoint Explorer",
  url: `${SITE_URL}/explore`,
  description:
    "Geospatial visualization tool for planning multi-destination Pakistan itineraries with real-time waypoint data.",
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData data={exploreStructuredData} />
      {children}
    </>
  );
}
