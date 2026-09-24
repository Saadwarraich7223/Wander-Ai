import type { Metadata } from "next";
import { getItineraryBySlug, CURATED_ITINERARIES } from "@/lib/itinerariesData";
import StructuredData from "@/components/StructuredData";
import { SITE_URL } from "@/lib/siteConfig";

export async function generateStaticParams() {
  return CURATED_ITINERARIES.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const itinerary = getItineraryBySlug(resolvedParams.slug);

  if (!itinerary) {
    return {
      title: "Pakistan Travel Itinerary & Route Blueprint | WanderAI",
      description: "Explore algorithmic, verified day-by-day travel itineraries and expeditions across Pakistan.",
    };
  }

  const title = `${itinerary.title} (${itinerary.durationDays} Days) — Route, Budget & Map | WanderAI`;
  const desc = `${itinerary.subtitle}. Complete day-by-day route, vehicle clearance (${itinerary.vehicleAccess}), estimated budget PKR ${itinerary.estimatedBudgetPKR.moderate.toLocaleString()}, and best season.`;
  const canonicalUrl = `${SITE_URL}/itineraries/${itinerary.slug}`;

  return {
    title,
    description: desc,
    keywords: [
      itinerary.title,
      `${itinerary.durationDays} day ${itinerary.primaryCity} itinerary`,
      `${itinerary.primaryCity} tour plan`,
      `${itinerary.region} travel itinerary`,
      "Pakistan road trip planner",
      "Northern Pakistan travel guide",
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${itinerary.title} | WanderAI Pakistan Expedition`,
      description: desc,
      url: canonicalUrl,
      type: "article",
      images: [
        {
          url: itinerary.heroImage,
          width: 1200,
          height: 630,
          alt: `${itinerary.title} - ${itinerary.primaryCity}, Pakistan`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${itinerary.title} | WanderAI Pakistan`,
      description: desc,
      images: [itinerary.heroImage],
    },
  };
}

export default async function ItineraryDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const itinerary = getItineraryBySlug(resolvedParams.slug);

  if (!itinerary) {
    return <>{children}</>;
  }

  const itineraryJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: itinerary.title,
      description: itinerary.summary,
      image: itinerary.heroImage,
      url: `${SITE_URL}/itineraries/${itinerary.slug}`,
      touristType: ["Nature", "Cultural", "Adventure", "Scenic Road Trip"],
      offers: {
        "@type": "Offer",
        price: itinerary.estimatedBudgetPKR.moderate,
        priceCurrency: "PKR",
        availability: "https://schema.org/InStock",
      },
      itinerary: {
        "@type": "ItemList",
        numberOfItems: itinerary.days.length,
        itemListElement: itinerary.days.map((day) => ({
          "@type": "ListItem",
          position: day.dayNumber,
          item: {
            "@type": "TouristTrip",
            name: day.title,
            description: day.summary,
          },
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: itinerary.title,
      description: itinerary.summary,
      image: itinerary.heroImage,
      url: `${SITE_URL}/itineraries/${itinerary.slug}`,
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: itinerary.region,
        containedInPlace: {
          "@type": "Country",
          name: "Pakistan",
        },
      },
      touristType: ["Nature", "Cultural", "Adventure", "Scenic Road Trip"],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Itineraries",
          item: `${SITE_URL}/itineraries`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: itinerary.title,
          item: `${SITE_URL}/itineraries/${itinerary.slug}`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: itinerary.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

  return (
    <>
      <StructuredData data={itineraryJsonLd} />
      {children}
    </>
  );
}
