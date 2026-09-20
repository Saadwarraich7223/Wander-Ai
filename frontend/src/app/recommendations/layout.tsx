import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://wanderai.travel").replace(/\/+$/, "");

export const metadata: Metadata = {
  title: "Personalized Travel Recommendations & Vibe Matcher",
  description:
    "Tailored destination recommendations aligned with your travel pace, budget style, and seasonal preferences across Pakistan.",
  alternates: {
    canonical: "/recommendations",
  },
  openGraph: {
    title: "Personalized Travel Recommendations | WanderAI",
    description:
      "Get bespoke travel suggestions tailored to your travel vibes: adventure, culinary, heritage, or mountain relaxation.",
    url: `${SITE_URL}/recommendations`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Personalized Travel Recommendations | WanderAI",
    description: "Algorithmic travel recommendations based on your preferences.",
  },
};

const recStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Personalized Pakistan Travel Recommendations",
  url: `${SITE_URL}/recommendations`,
  description: "AI-driven recommendation engine matching travelers to optimal destinations across Pakistan.",
};

export default function RecommendationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData data={recStructuredData} />
      {children}
    </>
  );
}
