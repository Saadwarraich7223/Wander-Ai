import { cache } from "react";
import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import { SITE_URL, API_BASE_URL } from "@/lib/siteConfig";

export const revalidate = 3600;

const FALLBACK_PLACES: Record<string, any> = {
  "hunza-express": {
    name: "Hunza Valley & Karimabad",
    city: "Gilgit",
    description:
      "Explore the majestic Karakoram peaks, ancient Altit & Baltit forts, and serene apricot orchards of Hunza Valley in Gilgit-Baltistan.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAky2BntZW4gkilTOyaiD7E5EPAGPseUMIn8FQk5P-rlcUcyojZR5yj3i8j3uRTzkCVi3A2gRsux4uRF8PhB1MxYnGRMVcBmMzOAz6k7n5MsYfs8Vr_0CRi_ZnkptQ_gIRC1vA1OLLZyT5Qdxu9IhduBm1WSqIxE6bfMPBWXUD1xlvScKhQnvAFSXNiY1AiaVKBED75Bh8MR9Jexe-CSdM9EYARPKP-usB2K4Pg_1w9XmRTfbuIuw1a8w",
    latitude: 36.3167,
    longitude: 74.8833,
  },
  "skardu-deosai": {
    name: "Skardu & Deosai National Park",
    city: "Skardu",
    description:
      "Gateway to K2, the Land of Giants (Deosai Plains), Shangrila Lower Kachura Lake, and high-altitude desert dunes.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB8oU4AY82kHH1ALHhXPtqQ-fRcr0VC4DPRUaV7_rBsoAv780fjGuIfOwvwRT-RL_mpjmsrWRXNJ5Uz75jHpnMpy4kpxZm4J_59F4AAscOeV0pUQaW2znpFW5gLcV2fBKH5qhyslfTME9i6O8XfTE1NGGe8fbq-j8x6JZCeDxNoBMjFFkog6XnXdN6XGj0A3KJ--_YcoaSKLpiuArSb1tt3nKHO28BX9rTxw8a6WtoNjdvrqdirDQxNlw",
    latitude: 35.2989,
    longitude: 75.6337,
  },
  "lahore-walled-city": {
    name: "Lahore Walled City & Badshahi",
    city: "Lahore",
    description:
      "Centuries of Mughal architecture, Shahi Hammam, Delhi Gate, and world-renowned street food on Fort Road.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBP1qU8Z8g2yYO4vLQCCobey_pLadT_F2rwGqYr54EcD93hWeJvXwJDyAjCJ-FH7ZsoBYhyib8LEWQsp4I3cnKWKwOix1Zsf8aMTFd99O0xTTY2d13KtAOwyKMfX5L_qjVzvOSEa91EorToae0ajkhkFlzlntye9IUUBKVj8wQgQoJFaEeLu021DRs3SWJVKuFYfqS4uOMEwrnsvs2S3wlPGonrPwk4pNiNQ8qAYgyQAGw_7N0U1qCTXw",
    latitude: 31.5882,
    longitude: 74.3094,
  },
  "swat-kalam": {
    name: "Swat Valley & Kalam Alpine Waters",
    city: "Swat",
    description:
      "Known as the Switzerland of the East, featuring lush pine forests, Ushu Forest, Mahodand Lake, and Buddhist archaeological heritage.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAky2BntZW4gkilTOyaiD7E5EPAGPseUMIn8FQk5P-rlcUcyojZR5yj3i8j3uRTzkCVi3A2gRsux4uRF8PhB1MxYnGRMVcBmMzOAz6k7n5MsYfs8Vr_0CRi_ZnkptQ_gIRC1vA1OLLZyT5Qdxu9IhduBm1WSqIxE6bfMPBWXUD1xlvScKhQnvAFSXNiY1AiaVKBED75Bh8MR9Jexe-CSdM9EYARPKP-usB2K4Pg_1w9XmRTfbuIuw1a8w",
    latitude: 35.4947,
    longitude: 72.5857,
  },
};

const fetchPlaceData = cache(async (id: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/places/${id}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful fallback to static dictionary or placeholder
  }
  return FALLBACK_PLACES[id] || {
    name: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    city: "Pakistan",
    description: `Complete travel guide, route planning, weather windows, and itinerary optimization for ${id.replace(/-/g, " ")}.`,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAky2BntZW4gkilTOyaiD7E5EPAGPseUMIn8FQk5P-rlcUcyojZR5yj3i8j3uRTzkCVi3A2gRsux4uRF8PhB1MxYnGRMVcBmMzOAz6k7n5MsYfs8Vr_0CRi_ZnkptQ_gIRC1vA1OLLZyT5Qdxu9IhduBm1WSqIxE6bfMPBWXUD1xlvScKhQnvAFSXNiY1AiaVKBED75Bh8MR9Jexe-CSdM9EYARPKP-usB2K4Pg_1w9XmRTfbuIuw1a8w",
    latitude: 33.6844,
    longitude: 73.0479,
  };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const place = await fetchPlaceData(resolvedParams.id);
  const placeName = place.name || "Destination";
  const cityName = place.city?.name || place.city || "Pakistan";
  const canonicalSlug = place.slug || resolvedParams.id;
  const desc =
    place.description?.slice(0, 160) ||
    `Complete travel guide, estimated costs, seasonality, and itinerary synthesis for ${placeName} in ${cityName}, Pakistan.`;
  const imgUrl =
    place.primary_image?.url ||
    place.image ||
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAky2BntZW4gkilTOyaiD7E5EPAGPseUMIn8FQk5P-rlcUcyojZR5yj3i8j3uRTzkCVi3A2gRsux4uRF8PhB1MxYnGRMVcBmMzOAz6k7n5MsYfs8Vr_0CRi_ZnkptQ_gIRC1vA1OLLZyT5Qdxu9IhduBm1WSqIxE6bfMPBWXUD1xlvScKhQnvAFSXNiY1AiaVKBED75Bh8MR9Jexe-CSdM9EYARPKP-usB2K4Pg_1w9XmRTfbuIuw1a8w";

  return {
    title: `${placeName}, ${cityName} — Tourism Guide, Timings & Itinerary | WanderAI`,
    description: desc,
    keywords: [
      placeName,
      cityName,
      `${placeName} travel guide`,
      `${placeName} ticket price`,
      `best time to visit ${placeName}`,
      `places to visit in ${cityName}`,
      "Pakistan tourism",
      "Northern Pakistan travel",
    ],
    alternates: {
      canonical: `/places/${canonicalSlug}`,
    },
    openGraph: {
      title: `${placeName}, ${cityName} | WanderAI Pakistan Tourism Guide`,
      description: desc,
      url: `${SITE_URL}/places/${canonicalSlug}`,
      type: "article",
      images: [
        {
          url: imgUrl,
          width: 1200,
          height: 630,
          alt: `${placeName} in ${cityName}, Pakistan`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${placeName}, ${cityName} Tourism Guide | WanderAI`,
      description: desc,
      images: [imgUrl],
    },
  };
}

export default async function PlaceDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const place = await fetchPlaceData(resolvedParams.id);
  const placeName = place.name || "Destination";
  const cityName = place.city?.name || place.city || "Pakistan";
  const canonicalSlug = place.slug || resolvedParams.id;
  const imgUrl =
    place.primary_image?.url ||
    place.image ||
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAky2BntZW4gkilTOyaiD7E5EPAGPseUMIn8FQk5P-rlcUcyojZR5yj3i8j3uRTzkCVi3A2gRsux4uRF8PhB1MxYnGRMVcBmMzOAz6k7n5MsYfs8Vr_0CRi_ZnkptQ_gIRC1vA1OLLZyT5Qdxu9IhduBm1WSqIxE6bfMPBWXUD1xlvScKhQnvAFSXNiY1AiaVKBED75Bh8MR9Jexe-CSdM9EYARPKP-usB2K4Pg_1w9XmRTfbuIuw1a8w";

  const placeJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: placeName,
      alternateName: place.name_ur || undefined,
      description: place.description || `Travel and tourism guide for ${placeName}.`,
      image: imgUrl,
      url: `${SITE_URL}/places/${canonicalSlug}`,
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: cityName,
        containedInPlace: {
          "@type": "Country",
          name: "Pakistan",
        },
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: place.latitude || 33.6844,
        longitude: place.longitude || 73.0479,
      },
      publicAccess: true,
      touristType: ["Nature", "Cultural", "Adventure", "Heritage"],
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
          name: "Destinations",
          item: `${SITE_URL}/places`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: placeName,
          item: `${SITE_URL}/places/${canonicalSlug}`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `What is the best time to visit ${placeName}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `${placeName} in ${cityName} offers peak sightseeing windows during spring and autumn. Seasonal conditions vary by elevation${place.elevation_meters ? ` (${place.elevation_meters}m AMSL)` : ''}.`,
          },
        },
        {
          "@type": "Question",
          name: `What are the vehicle access and entry requirements for ${placeName}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `Vehicle access: ${place.vehicle_access || 'Accessible by standard road vehicles'}. Pacing tier: ${place.activity_level || 'Moderate'}. Suitable for ${place.family_suitable ? 'families and vacationers' : 'guided adventurers'}.`,
          },
        },
      ],
    },
  ];

  return (
    <>
      <StructuredData data={placeJsonLd} />
      {children}
    </>
  );
}
