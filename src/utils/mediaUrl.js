import { MEDIA_BASE_URL, PRODUCT_MEDIA_BASE_URL } from "./constants";

/**
 * Keys inspected when a media *object* (from the Media Library / DAM API) is
 * passed in instead of a plain string path.
 */
const MEDIA_OBJECT_KEYS = [
  "thumbnail_url",
  "preview_url",
  "url",
  "file_path",
  "path",
  "src",
];

/**
 * Resolve a media asset into a complete, displayable URL.
 *
 * This is the ONLY place in the frontend that turns API-provided image paths
 * into absolute URLs. Components receive an image path from the API and pass
 * it straight through here — they never need to know where images are stored.
 *
 * Supported inputs:
 *   - absolute http(s) URLs        → returned unchanged
 *   - protocol-relative URLs (//)  → promoted to https
 *   - blob:, data:, file: URLs     → returned unchanged (browser-generated)
 *   - "/storage/..." paths         → {MEDIA_BASE_URL} + rest
 *   - "storage/..." paths          → {MEDIA_BASE_URL} + rest
 *   - any other relative path      → {MEDIA_BASE_URL} + path
 *   - media objects                → resolved via url/thumbnail_url/... keys
 *
 * Safe to call multiple times: already-resolved URLs pass through unchanged.
 *
 * @param {string|object|null|undefined} value - Image path / media object from the API
 * @param {string|null} fallback - Value returned when nothing can be resolved (default "")
 * @param {string} [base] - Optional override base for relative paths (e.g.
 *   PRODUCT_MEDIA_BASE_URL for the separate commerce backend)
 * @returns {string|null}
 */
export function resolveMediaUrl(value, fallback = "", base) {
  if (!value) return fallback;

  // Media object from the Media Library API
  if (typeof value === "object") {
    for (const key of MEDIA_OBJECT_KEYS) {
      if (value[key]) return resolveMediaUrl(value[key], fallback, base);
    }
    return fallback;
  }

  const str = String(value).trim();
  if (!str) return fallback;

  // Absolute http(s) URLs — use as-is.
  if (/^https?:\/\//i.test(str)) return str;

  // Protocol-relative URLs (//cdn.example.com/x.jpg) — resolve to https.
  if (str.startsWith("//")) return `https:${str}`;

  // Browser-generated / inline URLs — never rewrite.
  if (/^(blob:|data:|file:)/i.test(str)) return str;

  // Relative path — strip leading slashes and a leading "storage/" segment,
  // then join against the configured media base (single slash, no doubles).
  const cleanPath = str
    .replace(/^\/+/, "")
    .replace(/^storage\//i, "")
    .replace(/^\/+/, "");
  const baseUrl = (base || MEDIA_BASE_URL).replace(/\/+$/, "");
  return `${baseUrl}/${cleanPath}`;
}

/**
 * Resolve a relative image path against the separate commerce/product backend.
 * Convenience wrapper so components never concatenate PRODUCT_MEDIA_BASE_URL.
 */
export function resolveProductMediaUrl(value, fallback = "") {
  return resolveMediaUrl(value, fallback, PRODUCT_MEDIA_BASE_URL);
}
