export const API_BASE_URL = "http://localhost:8000/api/v1/";
export const MEDIA_BASE_URL = "http://localhost:8000/storage/";
// export const API_BASE_URL = 'https://admin.varixialabs.com/workshopapi/public/api/v1/'
// export const MEDIA_BASE_URL = 'https://admin.varixialabs.com/workshopapi/public/storage/'
export const PRODUCT_API_BASE_URL = "https://api.yogiandyathra.com/public/api/";
export const PRODUCT_MEDIA_BASE_URL = "https://api.yogiandyathra.com/public";

/**
 * Resolve a media/storage path or asset URL to a complete displayable URL.
 */
export const resolveMediaUrl = (path) => {
  if (!path) return "";
  if (
    typeof path === "string" &&
    (path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("data:") ||
      path.startsWith("blob:"))
  ) {
    return path;
  }
  let cleanPath = String(path)
    .replace(/^\/storage\//, "")
    .replace(/^storage\//, "")
    .replace(/^\/+/, "");

  const base = MEDIA_BASE_URL.endsWith("/") ? MEDIA_BASE_URL : MEDIA_BASE_URL + "/";
  return base + cleanPath;
};