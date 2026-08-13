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
 * (one source of truth) scoped to the SPA session, keyed by course slug AND
 * the authenticated user id. A full page load resets it naturally.
 *
 * Isolation guarantees:
 * - Course isolation: the cache key includes the course slug, so Course B can
 *   never receive Course A's session (different key = cache miss → full fetch).
 * - User isolation: the cache key includes the authenticated user id, so a
 *   different user always starts from a cache miss even when no explicit
 *   logout cleanup ran. The cache is also explicitly cleared on logout/401.
 * - Versioning: CACHE_VERSION is part of the key, so stale in-memory entries
 *   from a previous build (hot reload / deploy while the tab stays open) can
 *   never be consumed as if they were the current session shape.
 * - Invalid payloads: `set` refuses sessions without a course, so undefined,
 *   null or partial error payloads are never stored as a valid session.
 * - Memory: exactly one session is held at a time; navigating to another
 *   course replaces it, and only the CURRENT lesson's heavy media is retained
 *   (the light merge replaces the current lesson slice instead of appending).
 */

// Bump when the session object shape changes so old in-memory entries from a
// previous build cannot be reused against the new contract.
const CACHE_VERSION = 2;

const buildKey = (slug, userId) =>
  `${CACHE_VERSION}|${userId ? `u${userId}` : 'anon'}|${slug}`;

let cache = null; // { key, session }

export const playerSessionCache = {
  /**
   * Read the cached session for a course, or null on cache miss / key mismatch
   * (different course, different user, or a different cache version).
   */
  get(slug, userId) {
    if (!cache) return null;
    return cache.key === buildKey(slug, userId) ? cache.session : null;
  },

  /**
   * Store a session for a course under the current user. Sessions without a
   * course (invalid/partial payloads) are never cached.
   */
  set(slug, session, userId) {
    if (!slug || !session || !session.course) return;
    cache = { key: buildKey(slug, userId), session };
  },

  /**
   * Drop the cached session entirely (logout / 401 / explicit invalidation).
   */
  clear() {
    cache = null;
  },
};

/**
 * Merge a light (lesson-navigation) response into the cached full session.
 *
 * The light response is the authoritative source for the current-lesson slice:
 * current_lesson, next_lesson, previous_lesson, permissions and
 * completion_summary. Everything else (course, sections, enrollment,
 * certificate_eligibility) is preserved from the cached session.
 *
 * Notes:
 * - next_lesson / previous_lesson are replaced even when null — a stale
 *   neighbor from the previous lesson position must never survive navigation
 *   (e.g. moving to the last lesson must clear next_lesson).
 * - permissions and completion_summary are merged shallowly so extra keys from
 *   the full session survive while light values win.
 * - The cached session is never mutated; a new object is returned.
 */
export function mergeLightSession(cachedSession, lightData) {
  if (!cachedSession || !lightData) return cachedSession;

  const merged = { ...cachedSession };

  if (lightData.current_lesson !== undefined) {
    merged.current_lesson = lightData.current_lesson;
  }

  if ('next_lesson' in lightData) {
    merged.next_lesson = lightData.next_lesson;
  }

  if ('previous_lesson' in lightData) {
    merged.previous_lesson = lightData.previous_lesson;
  }

  if (lightData.permissions) {
    merged.permissions = { ...(merged.permissions || {}), ...lightData.permissions };
  }

  if (lightData.completion_summary) {
    merged.completion_summary = {
      ...(merged.completion_summary || {}),
      ...lightData.completion_summary,
    };
  }

  return merged;
}

export default playerSessionCache;
