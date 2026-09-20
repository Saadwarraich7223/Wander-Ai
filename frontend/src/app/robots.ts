import { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://wanderai.travel").replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/places",
          "/places/*",
          "/explore",
          "/planner",
          "/recommendations",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/dashboard",
          "/dashboard/*",
          "/profile",
          "/profile/*",
          "/assistant",
          "/assistant/*",
          "/login",
          "/register",
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
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
