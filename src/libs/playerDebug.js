/**
 * playerDebug.js
 *
 * Lightweight, gated runtime instrumentation system for the Course Player.
 *
 * Enabled when:
 *   - `window.__PLAYER_DEBUG__ === true` is set, OR
 *   - URL parameter contains `?debug=1`, OR
 *   - localStorage contains `PLAYER_DEBUG=true`, OR
 *   - NODE_ENV === 'development'.
 *
 * In production this maintains zero runtime overhead when disabled.
 */

const isBrowser = typeof window !== 'undefined';

const isEnabled = () =>
  isBrowser &&
  (window.__PLAYER_DEBUG__ === true ||
    (window.location && window.location.search.includes('debug=1')) ||
    (window.localStorage && window.localStorage.getItem('PLAYER_DEBUG') === 'true') ||
    (typeof process !== 'undefined' &&
      process.env &&
      process.env.NODE_ENV === 'development'));

// In-memory chronological timeline event buffer (max 200 items)
const MAX_TIMELINE_EVENTS = 200;
let timelineEvents = [];

const recordEvent = (name, payload = {}) => {
  const eventObj = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    timestamp: Date.now(),
    timeStr: new Date().toLocaleTimeString(),
    ...payload,
  };
  timelineEvents.push(eventObj);
  if (timelineEvents.length > MAX_TIMELINE_EVENTS) {
    timelineEvents.shift();
  }
  return eventObj;
};

const emit = (kind, payload) => {
  recordEvent(kind, payload);
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
  isEnabled,
  getTimeline: () => [...timelineEvents],
  clearTimeline: () => { timelineEvents = []; },

  /** Record explicit timeline event */
  record: (name, payload) => recordEvent(name, payload),

  /** Phase 2 — progress request */
  progressRequest({ lessonId, position, watchedSeconds, duration, version }) {
    emit('progress.request', { lessonId, position, watchedSeconds, duration, version });
  },

  /** Phase 2 — progress response */
  progressResponse({ lessonId, returnedPosition, status, percentage, localPosition, reqVersion }) {
    emit('progress.response', {
      lessonId,
      returnedPosition,
      status,
      percentage,
      localPosition,
      reqVersion,
      staleVsLocal: returnedPosition < localPosition,
    });
  },

  /** Phase 3 — lesson identity */
  lessonIdentity({ lessonId, prevRef, nextRef, changedFields }) {
    emit('lesson.identity', {
      lessonId,
      sameReference: prevRef === nextRef,
      changedFields,
    });
  },

  /** Phase 4 — HTML5 video identity */
  videoIdentity({ lessonId, videoEl, elementChanged }) {
    emit('video.identity', { lessonId, elementChanged, videoEl: videoEl ? 'present' : 'null' });
  },

  /** Phase 5 — assignment to video.currentTime */
  currentTimeAssign({ prev, next, reason, lessonId }) {
    emit('currentTime.assign', { prev, next, reason, lessonId });
  },

  /** Phase 6 — media events */
  mediaEvent({ name, video }) {
    emit(`media.${name}`, {
      currentTime: video ? video.currentTime : null,
      readyState: video ? video.readyState : null,
      seeking: video ? video.seeking : null,
      paused: video ? video.paused : null,
    });
  },

  /** Sprint 7 — stream refresh (expired signed URL recovery) */
  streamRefresh({ lessonId, action, attempt }) {
    emit('stream.refresh', { lessonId, action, attempt });
  },

  /** Phase 10 — session actions */
  session({ lessonId, action, session }) {
    emit('session', { lessonId, action, sessionId: session?.sessionId });
  },

  /** Phase 12 — export session diagnostics to downloadable JSON */
  exportSessionDiagnostics({ session, metrics, renderCount, providerType, lessonId, videoEl }) {
    if (!isBrowser) return;

    const exportData = {
      exportedAt: new Date().toISOString(),
      lessonId: lessonId || 'N/A',
      providerType: providerType || 'html5',
      sessionInfo: session ? {
        sessionId: session.sessionId,
        lessonId: session.lessonId,
        localPosition: session.localPosition,
        lastSyncedPosition: session.lastSyncedPosition,
        resumeState: session.resumeState,
        resumePosition: session.resumePosition,
        dirty: session.dirty,
        syncVersion: session.syncVersion || session.version || 0,
      } : null,
      elementState: videoEl ? {
        currentTime: videoEl.currentTime,
        duration: videoEl.duration,
        paused: videoEl.paused,
        seeking: videoEl.seeking,
        readyState: videoEl.readyState,
        playbackRate: videoEl.playbackRate,
      } : null,
      metrics: metrics || {},
      renderCount: renderCount || 1,
      timelineEvents: [...timelineEvents],
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `player-debug-session-${lessonId || 'audit'}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
};
