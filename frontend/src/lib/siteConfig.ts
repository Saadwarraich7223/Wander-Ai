/**
 * Centralized Site Configuration
 * Strictly fixes canonical metadata, sitemap.xml, robots.txt, and OpenGraph URLs
 * to the production domain (https://wander-ai-delta.vercel.app).
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://wander-ai-delta.vercel.app"
).replace(/\/+$/, "");

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000"
).replace(/\/+$/, "");
