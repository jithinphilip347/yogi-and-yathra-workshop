import { configuredBaseUrl } from "./url";

/**
 * Centralized application constants.
 *
 * IMAGE_URL is the backend origin that serves media files. Relative image
 * paths returned by the API (e.g. "/storage/media/x.jpg" or
 * "profile/avatar.png") are resolved against this base by the single
 * centralized resolver in `utils/mediaUrl.js` — components must never
 * concatenate backend image URLs themselves.
 *
 * Override at build/deploy time with NEXT_PUBLIC_IMAGE_URL. When it is not
 * set, we fall back to the project's existing NEXT_PUBLIC_API_URL convention
 * (and finally to the local dev default).
 */
const envImageBase =
  process.env.NEXT_PUBLIC_IMAGE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

export const IMAGE_URL = envImageBase
  .replace(/\/+$/, "")
  .replace(/\/api\/v1\/?$/, "");

export const API_BASE_URL = `${IMAGE_URL}/api/v1/`;
export const MEDIA_BASE_URL = `${IMAGE_URL}/storage/`;


/* ------------------------------------------------------------------------- *
 * Product (E-commerce) integration
 * ------------------------------------------------------------------------- *
 * Two INDEPENDENT configuration values. They may point at the same host in a
 * given environment, but one is never derived from the other:
 *
 *   NEXT_PUBLIC_PRODUCT_API_BASE_URL    product APIs (Workshop proxy)
 *   NEXT_PUBLIC_PRODUCT_MEDIA_BASE_URL  product media (shop storage / CDN)
 *
 * Both are public, build-time values — Next.js inlines NEXT_PUBLIC_* into the
 * browser bundle, so never put credentials here. The E-commerce internal
 * service key stays on the Workshop backend only.
 */

/** Documented default so an unconfigured environment keeps working as before. */
const DEFAULT_PRODUCT_MEDIA_BASE_URL = "https://api.yogiandyathra.com/public";

/**
 * Product API base URL.
 *
 * Points at the Workshop Backend proxy (`…/api/v1/ecommerce`), which is what
 * keeps the Browser → Workshop → E-commerce boundary intact (Sprint 1 S2S).
 * It must NOT point at the E-commerce host directly.
 */
export const PRODUCT_API_BASE_URL = `${configuredBaseUrl(
  process.env.NEXT_PUBLIC_PRODUCT_API_BASE_URL,
  `${API_BASE_URL}ecommerce`,
  "NEXT_PUBLIC_PRODUCT_API_BASE_URL"
)}/`;

/**
 * Product media base URL — where the E-commerce backend serves product images.
 *
 * Intentionally independent of PRODUCT_API_BASE_URL. Relative paths returned
 * by the product payload are resolved against this base by
 * `resolveProductMediaUrl()`, never against the API base.
 *
 * `NEXT_PUBLIC_ECOMMERCE_MEDIA_URL` is honoured as a deprecated alias so an
 * environment that already sets it keeps working.
 */
export const PRODUCT_MEDIA_BASE_URL = configuredBaseUrl(
  process.env.NEXT_PUBLIC_PRODUCT_MEDIA_BASE_URL ||
    process.env.NEXT_PUBLIC_ECOMMERCE_MEDIA_URL,
  DEFAULT_PRODUCT_MEDIA_BASE_URL,
  "NEXT_PUBLIC_PRODUCT_MEDIA_BASE_URL"
);

