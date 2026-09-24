import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteConfig";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/places",
          "/places/*",
          "/itineraries",
          "/itineraries/*",
          "/explore",
          "/planner",
          "/recommendations",
          "/assistant",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/dashboard",
          "/dashboard/*",
          "/profile",
          "/profile/*",
          "/trips",
          "/trips/*",
          "/api/*",
        ],
      },
      {
        userAgent: "Googlebot-Image",
        allow: [
          "/",
          "/places/*",
          "/itineraries/*",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
