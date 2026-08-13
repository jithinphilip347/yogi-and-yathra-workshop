/**
 * playerSessionCache
 *
 * Session-scoped in-memory cache for the Course Player session.
 *
 * The course structure (course, sections, enrollment, permissions,
 * certificate_eligibility) is stable while navigating between lessons, so the
 * player reuses the cached structure and only refreshes the current-lesson
 * slice (via the player endpoint's `light` mode) instead of re-fetching the
 * entire session on every lesson change.
 *
 * This is intentionally NOT a global data layer — it is a single entry
 * (one source of truth) scoped to the SPA session, keyed by course slug.
 * A full page load resets it naturally.
 */
let cache = null; // { slug, session }

export const playerSessionCache = {
  get(slug) {
    return cache && cache.slug === slug ? cache.session : null;
  },
  set(slug, session) {
    if (!slug || !session) return;
    cache = { slug, session };
  },
  clear() {
    cache = null;
  },
};

export default playerSessionCache;
