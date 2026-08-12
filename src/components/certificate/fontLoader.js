/**
 * Dynamic Google Fonts loader for the Student Certificate Renderer (Sprint 4).
 *
 * Mirrors the admin Mapping Builder's loader so the player requests the SAME
 * families with the SAME weights that the builder uses:
 *
 *   - only non-system families are fetched (native fonts are never requested)
 *   - the css2 URL asks for the exact weights used by the mapped fields
 *     (e.g. `family=Inter:wght@400;600` instead of a hardcoded 400/600/700 set)
 *   - per-family readiness is awaited via document.fonts.load(...) — a <link>
 *     being inserted does NOT mean the font is available yet
 *   - failures are reported back (never thrown) so the certificate stays
 *     usable, and the caller can log a diagnosable warning
 */

import { isSystemFontFamily, normalizeFontWeight } from "./certificateTypography";

const FONTS_BASE = "https://fonts.googleapis.com/css2";

// family -> "loading" | "loaded"
const state = new Map();
// css url -> Promise (dedupes concurrent requests for the same batch)
const inFlight = new Map();

function weightsFor(family, weightsByFamily) {
  const requested = (weightsByFamily && weightsByFamily[family]) || [];
  const weights = [...new Set(requested.map(normalizeFontWeight))];
  if (!weights.length) weights.push(400);
  return weights;
}

let preconnectAdded = false;

function buildUrl(families, weightsByFamily) {
  const parts = families.map((family) => {
    const fam = family.trim().replace(/\s+/g, "+");
    const rawWeights = (weightsByFamily && weightsByFamily[family]) || [];
    const weights = [...new Set(rawWeights.map(normalizeFontWeight))];
    if (!weights.includes(400)) weights.push(400);
    const unique = [...new Set(weights)].sort((a, b) => a - b);
    if (unique.length === 1 && unique[0] === 400) return `family=${fam}`;
    return `family=${fam}:wght@${unique.join(";")}`;
  });
  return `${FONTS_BASE}?${parts.join("&")}&display=swap`;
}

/**
 * Resolve once the family's requested faces are actually available to the
 * page — loading the stylesheet <link> is NOT enough, the face must be in the
 * FontFaceSet before text is rendered (Sprint 4 §7 / §25).
 */
function waitForFont(family, weights = []) {
  return new Promise((resolve) => {
    try {
      if (document.fonts && typeof document.fonts.load === "function") {
        const loads = weights.length
          ? weights.map((w) => document.fonts.load(`${w} 16px "${family}"`))
          : [document.fonts.load(`16px "${family}"`)];
        Promise.allSettled(loads).then(() => resolve(true));
        return;
      }
    } catch {
      /* fall through to the timeout path */
    }
    setTimeout(() => resolve(true), 400);
  });
}

/**
 * Check whether the requested numeric weight is actually available for the
 * family (e.g. Pacifico only ships 400 — a 600 request must not silently
 * pretend to be exact).
 */
function checkWeightAvailability(family, weight) {
  try {
    if (!document.fonts || typeof document.fonts.check !== "function") return null;
    return document.fonts.check(`${weight} 16px "${family}"`);
  } catch {
    return null;
  }
}

function ensurePreconnect() {
  if (preconnectAdded || typeof document === "undefined") return;
  preconnectAdded = true;
  const base = (url) => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = url;
    document.head.appendChild(link);
    return link;
  };
  base("https://fonts.googleapis.com");
  base("https://fonts.gstatic.com").crossOrigin = "anonymous";
}

/**
 * Load the given font families from Google Fonts.
 *
 * @param {string[]} families            Family names exactly as stored by the
 *                                       Mapping Builder (e.g. "Pacifico").
 * @param {Object<string, number[]>} [weightsByFamily]
 *                                       Optional per-family numeric weights to
 *                                       request (derived from mapped fields).
 * @returns {Promise<{failed: string[], unavailable: Array<{family, weights}>}>}
 *                                       Never rejects — the certificate must
 *                                       remain usable on font failure. The
 *                                       report lets callers log diagnostics.
 */
export function ensureFontsLoaded(families = [], weightsByFamily) {
  if (typeof document === "undefined") {
    return Promise.resolve({ failed: [], unavailable: [] });
  }

  const list = [...new Set((families || []).map((f) => String(f).trim()).filter(Boolean))];
  const missing = list.filter((f) => !isSystemFontFamily(f) && !state.has(f));

  if (missing.length === 0) {
    return Promise.resolve({ failed: [], unavailable: [] });
  }

  const url = buildUrl(missing, weightsByFamily);
  if (inFlight.has(url)) return inFlight.get(url);

  ensurePreconnect();

  const settle = () => inFlight.delete(url);

  const promise = new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;

    // Safety net: if the stylesheet request hangs (offline/CDN outage) never
    // block the certificate — resolve with the empty report so the UI stays
    // usable on fallback fonts.
    const hangTimer = setTimeout(() => {
      settle();
      resolve({ failed: [...missing], unavailable: [] });
    }, 8000);

    link.onload = () => {
      clearTimeout(hangTimer);
      // We deliberately do NOT await document.fonts.ready here: that promise
      // only settles when EVERY font on the page has loaded, which could hang
      // the certificate behind unrelated page fonts. The per-family
      // document.fonts.load above is the correct readiness gate.
      Promise.all(missing.map((family) => waitForFont(family, weightsFor(family, weightsByFamily)))).then(() => {
        const unavailable = [];
        const failed = [];

        missing.forEach((family) => {
          const weights = weightsFor(family, weightsByFamily);

          const missingWeights = weights.filter((w) => checkWeightAvailability(family, w) === false);
          if (missingWeights.length > 0) {
            unavailable.push({ family, weights: missingWeights });
          }

          // A family is considered failed only when its faces are CONFIRMED
          // missing — an unavailable check() API (null) is treated as unknown,
          // never as a failure.
          const anyFace = weights.some((w) => checkWeightAvailability(family, w) !== false);
          if (!anyFace) {
            failed.push(family);
          }

          state.set(family, "loaded");
        });

        settle();
        resolve({ failed, unavailable });
      });
    };
    link.onerror = () => {
      clearTimeout(hangTimer);
      // CDN unreachable or unknown family — do not block the certificate.
      missing.forEach((f) => state.set(f, "loaded"));
      settle();
      resolve({ failed: missing });
    };
    document.head.appendChild(link);
  });

  missing.forEach((f) => state.set(f, "loading"));
  inFlight.set(url, promise);
  return promise;
}
