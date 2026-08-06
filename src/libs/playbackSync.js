/**
 * playbackSync.js
 *
 * Pure, framework-free helpers that enforce the Course Player synchronization
 * contract (Phases 9 & 10):
 *
 *   1. While watching, the LOCAL player position is authoritative. The backend
 *      only persists progress; its responses must never move playback backward.
 *   2. Server responses are applied monotonically: positions and percentages
 *      may only rise, never fall. Completion status is sticky.
 *
 * These functions are pure so they can be unit-tested without React.
 */

export { playerDebug } from './playerDebug';

/**
 * Create a new in-memory playback session for a lesson.
 *
 * The player always reads `localPosition` while watching. `lastSyncedPosition`
 * tracks what has already been flushed to the backend (dedup + monotonicity).
 * `resumed` guards the one-shot auto-resume: it may only run during the initial
 * load of a lesson, never after playback has begun.
 */
export function createPlaybackSession(lessonId, initialPosition = 0) {
  return {
    lessonId,
    localPosition: Math.max(0, Number(initialPosition) || 0),
    lastSyncedPosition: 0,
    lastSyncAt: null,
    resumed: false,
    version: 0,
  };
}

/**
 * Monotonic check: is a server-returned position stale (older) than what has
 * already been applied locally?
 */
export function isStaleServerPosition(prevAppliedPosition, incomingPosition) {
  return Number(incomingPosition) < Number(prevAppliedPosition);
}

/**
 * Merge a server progress record into the current lesson object without ever
 * moving playback state backward:
 *
 * - `last_position_seconds` and `percentage_watched` may only rise (stale
 *   responses keep the current value, so an out-of-order response can never
 *   downgrade state).
 * - `status` / `is_completed` are sticky unless `forceStatus` is true (used by
 *   the manual completion toggle, which must be able to reset a lesson).
 *
 * Returns `{ merged, isStale, nextAppliedPosition }` so callers can persist the
 * running max per lesson.
 */
export function mergeProgressRecord(currentLesson, record, prevAppliedPosition = 0, { forceStatus = false } = {}) {
  const incomingPosition = Math.max(0, Number(record?.last_position_seconds ?? 0));
  const isStale = !forceStatus && isStaleServerPosition(prevAppliedPosition, incomingPosition);
  const nextAppliedPosition = Math.max(Number(prevAppliedPosition) || 0, incomingPosition);

  const currentPosition = Number(currentLesson?.last_position_seconds) || 0;
  const currentPercentage = Number(currentLesson?.percentage_watched) || 0;
  const incomingPercentage = Number(record?.percentage_watched) || 0;
  const wasCompleted = Boolean(currentLesson?.is_completed);

  const merged = {
    ...currentLesson,
    // A stale response may not regress status either — completion is sticky
    // unless forceStatus (manual toggle) explicitly overrides it.
    status: isStale ? currentLesson?.status : record?.status || currentLesson?.status,
    is_completed: forceStatus
      ? record?.status === 'completed'
      : record?.status === 'completed' || wasCompleted,
    last_position_seconds: isStale ? currentPosition : incomingPosition,
    percentage_watched: Math.max(currentPercentage, incomingPercentage),
  };

  return { merged, isStale, nextAppliedPosition };
}
