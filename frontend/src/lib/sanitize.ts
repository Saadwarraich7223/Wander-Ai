/**
 * Input sanitization utility to prevent Cross-Site Scripting (XSS),
 * HTML injection, and control character exploits across all client forms and payloads.
 */

// Regex patterns to strip hazardous HTML tags, event attributes, javascript: URIs, and dangerous characters
const DANGEROUS_TAGS_REGEX = /<\s*(script|iframe|object|embed|style|svg|form|input|button|meta|link)[^>]*>.*?<\s*\/\s*\1\s*>|<\s*(script|iframe|object|embed|style|svg|form|input|button|meta|link)[^>]*\/?\s*>/gi;
const INLINE_EVENT_REGEX = /\s*on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi;
const JAVASCRIPT_URI_REGEX = /javascript\s*:/gi;
const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g;

/**
 * Strips script tags, HTML injection, inline event handlers, and dangerous control characters from raw text.
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return "";

  return input
    .replace(CONTROL_CHARS_REGEX, "")
    .replace(DANGEROUS_TAGS_REGEX, "")
    .replace(INLINE_EVENT_REGEX, "")
    .replace(JAVASCRIPT_URI_REGEX, "")
    .trim();
}

/**
 * Sanitizes search queries by removing special syntax exploit attempts while preserving safe text.
 */
export function sanitizeSearchQuery(query: string | null | undefined): string {
  if (!query || typeof query !== "string") return "";

  return sanitizeText(query)
    .replace(/[<>{}\\]/g, "")
    .slice(0, 150)
    .trim();
}

/**
 * Sanitizes email inputs by stripping whitespace, control characters, and normalizing to lower case.
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email || typeof email !== "string") return "";

  return email
    .replace(CONTROL_CHARS_REGEX, "")
    .replace(/[<>"'(){}\\]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Recursively sanitizes all string fields in a payload object before dispatching to backend.
 */
export function sanitizePayload<T>(payload: T): T {
  if (!payload || typeof payload !== "object") {
    if (typeof payload === "string") {
      return sanitizeText(payload) as unknown as T;
    }
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item)) as unknown as T;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") {
      // Keep passwords as-is without stripping valid special chars, just clean control characters
      if (key.toLowerCase().includes("password")) {
        result[key] = value.replace(CONTROL_CHARS_REGEX, "");
      } else if (key.toLowerCase().includes("email")) {
        result[key] = sanitizeEmail(value);
      } else {
        result[key] = sanitizeText(value);
      }
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizePayload(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
