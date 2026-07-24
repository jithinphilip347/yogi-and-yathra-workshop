import { MEDIA_BASE_URL } from "./constants";

/**
 * Resolves a media asset object or path into a full storage URL.
 */
export function resolveMediaUrl(asset, fallback = "") {
  if (!asset) return fallback;

  if (typeof asset === "string") {
    if (asset.startsWith("http://") || asset.startsWith("https://")) {
      return asset;
    }
    const cleanPath = asset.startsWith("/") ? asset.slice(1) : asset;
    return `${MEDIA_BASE_URL}${cleanPath}`;
  }

  if (typeof asset === "object") {
    const path = asset.url || asset.file_path || asset.path || asset.preview_url || asset.thumbnail_url;
    if (path) {
      if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
      }
      const cleanPath = path.startsWith("/") ? path.slice(1) : path;
      return `${MEDIA_BASE_URL}${cleanPath}`;
    }
  }

  return fallback;
}
