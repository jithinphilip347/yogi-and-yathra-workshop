/**
 * streamRefresh.js
 *
 * Pure helpers for the bounded stream-refresh flow (expired signed stream
 * URLs). Kept framework-free so the decision logic is unit-testable:
 *
 *   - shouldRefreshStream(): bounds how many automatic refreshes may run
 *     before the error UI is shown (prevents infinite retry loops),
 *   - extractUrlKey(): canonical key for comparing media URLs. Two URLs are
 *     "the same media" when pathname + search match — the origin is ignored
 *     so dev-environment origin differences (localhost vs localhost:8000)
 *     never cause an unnecessary media reload, while a fresh signed URL
 *     (new signature/expiry in the query string) is detected as a real change
 *     and reloaded.
 */

export const MAX_STREAM_REFRESH_ATTEMPTS = 2;

/**
 * Whether another automatic stream refresh is permitted.
 *
 * @param {number} attempts completed refresh attempts
 * @param {number} maxAttempts maximum allowed automatic refreshes
 * @returns {boolean}
 */
export function shouldRefreshStream(attempts, maxAttempts = MAX_STREAM_REFRESH_ATTEMPTS) {
  return attempts < maxAttempts;
}

/**
 * Canonical key for a media URL: pathname + search (origin-agnostic).
 *
 * @param {string} url
 * @returns {string}
 */
export function extractUrlKey(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
}
