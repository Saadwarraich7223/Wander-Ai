import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WanderAI — Algorithmic Travel Planning for Pakistan",
    short_name: "WanderAI",
    description:
      "Synthesize verified routes, real-time weather windows, local budget controls, and bespoke itineraries across Pakistan.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF9F5",
    theme_color: "#1E3D34",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
