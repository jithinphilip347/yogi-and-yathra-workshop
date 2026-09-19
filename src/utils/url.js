/**
 * Shared URL helpers for the configuration layer.
 *
 * This is the ONLY place in the app that normalizes a configured base URL or
 * joins a base URL with a path. Nothing else should call `.replace(/\/+$/, "")`
 * or hand-concatenate bases — one helper keeps every product API/media URL
 * free of double slashes and `undefined/...` prefixes.
 */

/** A usable base is an absolute http(s) URL or a root-relative path. */
const USABLE_BASE = /^(https?:\/\/|\/)/i;

/**
 * Trim a configured base URL and drop its trailing slashes.
 *
 * @param {unknown} value
 * @returns {string} normalized base, or "" when nothing usable was given
 */
export function normalizeBaseUrl(value) {
  if (value === null || value === undefined) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  return trimmed.replace(/\/+$/, "");
}

/**
 * Resolve a configured base URL, falling back to a documented default when it
 * is absent or malformed. Malformed values are reported instead of silently
 * producing broken URLs such as `undefined/products`.
 *
 * @param {unknown} value - raw configured value (env var)
 * @param {string} fallback - documented default used when `value` is unusable
 * @param {string} [name] - label used in the warning message
 * @returns {string} normalized base URL
 */
export function configuredBaseUrl(value, fallback, name = "base URL") {
  const normalized = normalizeBaseUrl(value);
  if (!normalized) return normalizeBaseUrl(fallback);

  if (!USABLE_BASE.test(normalized)) {
    console.warn(
      `[config] Ignoring invalid ${name} "${normalized}": expected an absolute http(s) URL ` +
        `or a root-relative path. Falling back to "${normalizeBaseUrl(fallback)}".`
    );
    return normalizeBaseUrl(fallback);
  }

  return normalized;
}

/**
 * Join a base URL and a path with exactly one slash between them.
 *
 * joinUrl("https://api.example.com/", "/products/10") -> "https://api.example.com/products/10"
 *
 * @param {string} base
 * @param {string|null|undefined} path
 * @returns {string}
 */
export function joinUrl(base, path) {
  const safeBase = normalizeBaseUrl(base);
  const safePath =
    path === null || path === undefined ? "" : String(path).trim().replace(/^\/+/, "");

  if (!safeBase) return safePath;
  if (!safePath) return safeBase;
  return `${safeBase}/${safePath}`;
}
