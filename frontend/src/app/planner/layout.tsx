import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import { SITE_URL } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "AI Trip & Expedition Generator — Algorithmic Pakistan Itineraries",
  description:
    "Generate custom multi-day Pakistan travel itineraries in seconds. Algorithmic route optimization, budget tracking, seasonal windows, and day-by-day waypoint scheduling.",
  alternates: {
    canonical: "/planner",
  },
  openGraph: {
    title: "AI Trip & Expedition Generator | WanderAI",
    description:
      "Synthesize personalized multi-day itineraries across Pakistan with verified road routes, elevation windows, and cost optimization.",
    url: `${SITE_URL}/planner`,
    type: "website",
    images: [
      {
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAky2BntZW4gkilTOyaiD7E5EPAGPseUMIn8FQk5P-rlcUcyojZR5yj3i8j3uRTzkCVi3A2gRsux4uRF8PhB1MxYnGRMVcBmMzOAz6k7n5MsYfs8Vr_0CRi_ZnkptQ_gIRC1vA1OLLZyT5Qdxu9IhduBm1WSqIxE6bfMPBWXUD1xlvScKhQnvAFSXNiY1AiaVKBED75Bh8MR9Jexe-CSdM9EYARPKP-usB2K4Pg_1w9XmRTfbuIuw1a8w",
        width: 1200,
        height: 630,
        alt: "AI Pakistan Itinerary Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Trip Generator for Pakistan | WanderAI",
    description: "Generate optimized multi-day travel itineraries in seconds with WanderAI.",
  },
};

const plannerStructuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "WanderAI Expedition Synthesizer",
  operatingSystem: "Web Browser, iOS, Android",
  applicationCategory: "TravelApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "340",
  },
  description:
    "Algorithmic itinerary generator for multi-day road trips, cultural heritage tours, and trekking expeditions across Pakistan.",
};

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData data={plannerStructuredData} />
      {children}
    </>
  );
}
