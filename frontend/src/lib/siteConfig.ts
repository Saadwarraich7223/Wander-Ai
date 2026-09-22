/**
 * Centralized Site Configuration
 * Ensures canonical metadata, sitemap.xml, robots.txt, and OpenGraph URLs
 * always resolve to the live domain (https://wander-ai-delta.vercel.app).
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "https://wander-ai-delta.vercel.app"
).replace(/\/+$/, "");

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000"
).replace(/\/+$/, "");
