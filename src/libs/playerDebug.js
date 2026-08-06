/**
 * playerDebug.js
 *
 * Lightweight, gated instrumentation for the Course Player playback-state audit.
 *
 * Enabled only when:
 *   - `window.__PLAYER_DEBUG__ === true` is set (e.g. from the browser console
 *     BEFORE the player mounts, or via a query flag), OR
 *   - NODE_ENV === 'development'.
 *
 * In production this is a no-op series of no-op functions, so it has zero
 * runtime cost when disabled. Each helper builds a labelled log entry so the
 * playback timeline can be reconstructed chronologically (Phases 2, 4, 5, 6, 7).
 */

const isBrowser = typeof window !== 'undefined';

const isEnabled = () =>
  isBrowser &&
  (window.__PLAYER_DEBUG__ === true ||
    (typeof process !== 'undefined' &&
      process.env &&
      process.env.NODE_ENV === 'development'));

const emit = (kind, payload) => {
  if (!isEnabled()) return;
  console.log(
    `%c[PlayerDebug:${kind}]`,
    'color:#f59e0b;font-weight:bold',
    {
      ts: Date.now(),
      ...payload,
    }
  );
};

export const playerDebug = {
  /** Phase 2 — every POST /lesson/{id}/progress request. */
  progressRequest({ lessonId, position, watchedSeconds, duration }) {
    emit('progress.request', { lessonId, position, watchedSeconds, duration });
  },

  /** Phase 2 — every progress response, incl. returned server position. */
  progressResponse({ lessonId, returnedPosition, status, percentage, localPosition }) {
    emit('progress.response', {
      lessonId,
      returnedPosition,
      status,
      percentage,
      localPosition,
      // Comparison demanded by the audit: is the server echo older than local playback?
      staleVsLocal: returnedPosition < localPosition,
    });
  },

  /** Phase 3 — lesson object identity change (new object reference each update?). */
  lessonIdentity({ lessonId, prevRef, nextRef, changedFields }) {
    emit('lesson.identity', {
      lessonId,
      sameReference: prevRef === nextRef,
      changedFields,
    });
  },

  /** Phase 4 — HTML5 <video> element identity change. */
  videoIdentity({ lessonId, videoEl, elementChanged }) {
    emit('video.identity', { lessonId, elementChanged, videoEl: videoEl ? 'present' : 'null' });
  },

  /** Phase 5 — EVERY assignment to video.currentTime with caller stack. */
  currentTimeAssign({ prev, next, reason, lessonId }) {
    const err = new Error('currentTime assignment');
    const stack = err.stack
      ? String(err.stack).split('\n').slice(1, 5).join(' | ')
      : '(no stack)';
    emit('currentTime.assign', { prev, next, reason, lessonId, stack });
  },

  /** Phase 6 — HTML5 media event timeline with element state. */
  mediaEvent({ name, video }) {
    emit('media.event', {
      name,
      currentTime: video ? video.currentTime : null,
      readyState: video ? video.readyState : null,
      networkState: video ? video.networkState : null,
      seeking: video ? video.seeking : null,
      paused: video ? video.paused : null,
    });
  },

  /** Phase 10 — playback session state transitions. */
  session({ lessonId, action, session }) {
    emit('session', { lessonId, action, session });
  },
};
