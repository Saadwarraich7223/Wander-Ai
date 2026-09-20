import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import AIChatWidget from "@/components/AIChatWidget";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
});

import StructuredData from "@/components/StructuredData";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://wanderai.travel").replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "WanderAI — Smarter, Algorithmic Travel Planning for Pakistan & Beyond",
    template: "%s | WanderAI — Pakistan Travel Planner",
  },
  description:
    "Say goodbye to chaotic trip planning. WanderAI synthesizes verified routes, real-time weather windows, local budget controls, and bespoke itineraries across Pakistan.",
  keywords: [
    "Pakistan travel planner",
    "AI itinerary generator",
    "Hunza valley tour",
    "Skardu trip planner",
    "Pakistan tourism SaaS",
    "Northern Pakistan road trips",
    "Lahore heritage guide",
    "Karakoram highway route planner",
    "Swat Kalam travel guide",
    "Algorithmic travel planning",
  ],
  authors: [{ name: "WanderAI Intelligence Inc.", url: SITE_URL }],
  creator: "WanderAI",
  publisher: "WanderAI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "WanderAI — Smarter, Algorithmic Travel Planning for Pakistan & Beyond",
    description:
      "Say goodbye to chaotic trip planning. WanderAI synthesizes verified routes, real-time weather windows, local budget controls, and bespoke itineraries in seconds.",
    url: SITE_URL,
    siteName: "WanderAI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAky2BntZW4gkilTOyaiD7E5EPAGPseUMIn8FQk5P-rlcUcyojZR5yj3i8j3uRTzkCVi3A2gRsux4uRF8PhB1MxYnGRMVcBmMzOAz6k7n5MsYfs8Vr_0CRi_ZnkptQ_gIRC1vA1OLLZyT5Qdxu9IhduBm1WSqIxE6bfMPBWXUD1xlvScKhQnvAFSXNiY1AiaVKBED75Bh8MR9Jexe-CSdM9EYARPKP-usB2K4Pg_1w9XmRTfbuIuw1a8w",
        width: 1200,
        height: 630,
        alt: "WanderAI — Pakistan Algorithmic Travel Planning",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WanderAI — Smarter, Algorithmic Travel Planning for Pakistan & Beyond",
    description:
      "Say goodbye to chaotic trip planning. WanderAI synthesizes verified routes, real-time weather windows, and bespoke itineraries in seconds.",
    creator: "@WanderAITravel",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAky2BntZW4gkilTOyaiD7E5EPAGPseUMIn8FQk5P-rlcUcyojZR5yj3i8j3uRTzkCVi3A2gRsux4uRF8PhB1MxYnGRMVcBmMzOAz6k7n5MsYfs8Vr_0CRi_ZnkptQ_gIRC1vA1OLLZyT5Qdxu9IhduBm1WSqIxE6bfMPBWXUD1xlvScKhQnvAFSXNiY1AiaVKBED75Bh8MR9Jexe-CSdM9EYARPKP-usB2K4Pg_1w9XmRTfbuIuw1a8w",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "j3rxMTu4vcCf9dwuDW5Gvxb-9bxH-E2HntLHXLgFpoI",
  },
  category: "travel",
};

const rootStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "WanderAI",
    url: SITE_URL,
    description:
      "Algorithmic travel planning platform for Pakistan and beyond.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/places?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "WanderAI Intelligence Inc.",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    sameAs: [
      "https://twitter.com/WanderAITravel",
      "https://github.com/Saadwarraich7223/Wander-Ai",
    ],
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${dmSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-background text-on-surface antialiased font-sans selection:bg-secondary/15 selection:text-secondary-dark min-h-screen flex flex-col">
        <StructuredData data={rootStructuredData} />
        {children}
        <AIChatWidget />
      </body>
    </html>
  );
}


