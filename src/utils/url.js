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

/**
 * Normalizes an arbitrary link URL found in rich text or user input.
 * Ensures external domains (e.g. "instagram.com/myaccount", "www.instagram.com")
 * are not treated as relative paths by prepending "https://".
 * Preserves existing protocols (http, https, mailto, tel, sms), anchor jumps (#),
 * and legitimate relative paths (e.g. "/courses").
 * Sanitizes malicious javascript:/vbscript:/data: schemes.
 *
 * @param {string|null|undefined} url
 * @returns {string}
 */
export function normalizeRichTextUrl(url) {
  if (url === null || url === undefined) return "";
  const trimmed = String(url).trim();
  if (!trimmed) return "";

  // Sanitize malicious URI schemes
  if (/^(javascript|vbscript|data):/i.test(trimmed)) {
    return "";
  }

  // Already an absolute scheme (http://, https://, mailto:|tel:|sms:|callto:)
  if (/^(https?:\/\/|mailto:|tel:|sms:|callto:)/i.test(trimmed)) {
    return trimmed;
  }

  // Protocol-relative URL (e.g., //instagram.com/user)
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  // In-page anchor hash link (#details, #reviews)
  if (trimmed.startsWith("#")) {
    return trimmed;
  }

  // Naked email address (e.g., support@yogify.com)
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return `mailto:${trimmed}`;
  }

  // Check if starts with a slash, e.g. "/instagram.com/myaccount" or "/www.instagram.com"
  if (trimmed.startsWith("/")) {
    const withoutSlash = trimmed.replace(/^\/+/, "");
    // If what follows looks like an external domain name with TLD, strip leading slashes
    if (
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?::\d+)?(?:\/.*)?$/i.test(
        withoutSlash
      )
    ) {
      return `https://${withoutSlash}`;
    }
    // Legitimate internal relative route (e.g., /courses, /daily-class)
    return trimmed;
  }

  // Phone number without tel: (e.g., "+91 98765 43210")
  if (/^(\+|00)[0-9\s\-()]{7,}$/.test(trimmed)) {
    return `tel:${trimmed.replace(/\s+/g, "")}`;
  }

  // Any other URL without protocol (e.g., "instagram.com/username", "www.instagram.com", "yogiandyathra.com")
  return `https://${trimmed}`;
}

/**
 * Scans an HTML string and normalizes all <a> hyperlinks:
 * 1. Resolves relative-looking external URLs (e.g. href="instagram.com/account" -> href="https://instagram.com/account").
 * 2. Adds target="_blank" and rel="noopener noreferrer" to external links so they open in a new tab.
 * 3. Sanitizes dangerous hrefs (e.g. javascript:).
 *
 * @param {string|null|undefined} html
 * @returns {string}
 */
export function normalizeRichTextHtml(html) {
  if (!html || typeof html !== "string") return html || "";

  return html.replace(/<a\b([^>]*)>/gi, (match, attrs) => {
    // Extract href attribute
    const hrefMatch = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (!hrefMatch) return match;

    const rawHref = hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? "";
    const normalizedHref = normalizeRichTextUrl(rawHref);

    // If sanitized out, render safe inactive link
    if (!normalizedHref) {
      return match.replace(hrefMatch[0], 'href="javascript:void(0)"');
    }

    // Determine if it's an external link
    const isExternal =
      /^https?:\/\//i.test(normalizedHref) ||
      /^mailto:/i.test(normalizedHref) ||
      /^tel:/i.test(normalizedHref);

    let newAttrs = attrs.replace(hrefMatch[0], `href="${normalizedHref}"`);

    if (isExternal && !/^mailto:|^tel:/i.test(normalizedHref)) {
      // Ensure target="_blank"
      if (/\btarget\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i.test(newAttrs)) {
        newAttrs = newAttrs.replace(
          /\btarget\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i,
          'target="_blank"'
        );
      } else {
        newAttrs += ' target="_blank"';
      }

      // Ensure rel="noopener noreferrer"
      if (/\brel\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i.test(newAttrs)) {
        newAttrs = newAttrs.replace(
          /\brel\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i,
          'rel="noopener noreferrer"'
        );
      } else {
        newAttrs += ' rel="noopener noreferrer"';
      }
    }

    return `<a${newAttrs}>`;
  });
}

