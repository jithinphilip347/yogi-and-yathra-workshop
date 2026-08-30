/**
 * Centralized Search Result Route & Presentation Resolver
 *
 * Sprint 9 — Search Result UX & Navigation
 *
 * Canonical Rules:
 * 1. result.type is the SINGLE source of truth for routing and labels.
 * 2. NEVER inspect title, slug keywords, ID ranges, or array positions to infer type.
 * 3. Search results NEVER navigate directly to external Zoom URLs (zoom_meeting_url).
 *    They always route to internal application entity/player pages.
 * 4. Missing or invalid parameters fail safely without generating broken (/undefined) URLs.
 */

export const SEARCH_ENTITY_TYPES = {
  COURSE: "course",
  LIVE_SECTION: "live_section",
  DAILY_CLASS: "daily_class",
};

/**
 * Get human-friendly label for a search entity type.
 *
 * @param {string} type - Entity type discriminator ('course', 'live_section', 'daily_class')
 * @returns {string} Presentation label
 */
export function getSearchResultTypeLabel(type) {
  switch (type) {
    case SEARCH_ENTITY_TYPES.COURSE:
      return "Course";
    case SEARCH_ENTITY_TYPES.LIVE_SECTION:
      return "Live Class";
    case SEARCH_ENTITY_TYPES.DAILY_CLASS:
      return "Daily Class";
    default:
      return "";
  }
}

/**
 * Clean and encode a slug segment safely.
 *
 * @param {string|null|undefined} slug
 * @returns {string}
 */
function sanitizeSlug(slug) {
  if (!slug || typeof slug !== "string") return "details";
  const trimmed = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-");
  return trimmed || "details";
}

/**
 * Resolve canonical destination URL for a search result item based purely on result.type and IDs.
 *
 * Canonical route mappings:
 *   - course       → /course/${slug}/${id}
 *   - live_section → /live-section/${id}/${slug}
 *   - daily_class  → /daily-class/${id}/${slug}
 *
 * @param {Object} result - Search result item
 * @param {string} result.type - 'course' | 'live_section' | 'daily_class'
 * @param {number|string} result.id - Entity identifier
 * @param {string} [result.slug] - Entity slug
 * @returns {string} Application route or '#' if invalid
 */
export function getSearchResultRoute(result) {
  if (!result || typeof result !== "object") {
    return "#";
  }

  const { type, id, slug } = result;

  // Validate ID exists and is valid
  if (id === null || id === undefined || id === "" || isNaN(Number(id))) {
    return "#";
  }

  const cleanId = String(id).trim();
  const cleanSlug = sanitizeSlug(slug);

  switch (type) {
    case SEARCH_ENTITY_TYPES.COURSE:
      return `/course/${cleanSlug}/${cleanId}`;

    case SEARCH_ENTITY_TYPES.LIVE_SECTION:
      return `/live-section/${cleanId}/${cleanSlug}`;

    case SEARCH_ENTITY_TYPES.DAILY_CLASS:
      return `/daily-class/${cleanId}/${cleanSlug}`;

    default:
      // Unknown type — fail safely, do not guess
      return "#";
  }
}

/**
 * Check if a search result has a valid navigable destination.
 *
 * @param {Object} result
 * @returns {boolean}
 */
export function isValidSearchResult(result) {
  const route = getSearchResultRoute(result);
  return route !== "#";
}
