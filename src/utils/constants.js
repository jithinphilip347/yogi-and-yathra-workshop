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
  "http://localhost:8001";

export const IMAGE_URL = envImageBase
  .replace(/\/+$/, "")
  .replace(/\/api\/v1\/?$/, "");

export const API_BASE_URL = `${IMAGE_URL}/api/v1/`;
export const MEDIA_BASE_URL = `${IMAGE_URL}/storage/`;

// Separate commerce/product backend — NOT the main LMS storage.
export const PRODUCT_API_BASE_URL = "https://api.yogiandyathra.com/public/api/";
export const PRODUCT_MEDIA_BASE_URL = "https://api.yogiandyathra.com/public";
