/**
 * PlaybackSession.js
 *
 * Enterprise-grade Playback Session Manager.
 * Single runtime authority for an active learning lesson session.
 */

export class PlaybackSession {
  constructor(lessonId, initialPosition = 0) {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.lessonId = lessonId;
    this.streamId = null;
    this.provider = 'html5';
    this.playbackMode = 'vod';

    // Playback state
    this.localPosition = Math.max(0, Number(initialPosition) || 0);
    this.duration = 0;
    this.bufferedPosition = 0;
    this.playbackRate = 1.0;
    this.volume = 1.0;
    this.muted = false;
    this.fullscreen = false;
    this.pictureInPicture = false;

    // Status flags
    this.playing = false;
    this.paused = true;
    this.seeking = false;
    this.buffering = false;
    this.loading = true;
    this.completed = false;
    this.ended = false;
    this.error = null;
    this.resumed = false;
    this.resumeState = 'IDLE'; // IDLE | WAITING_FOR_METADATA | VALIDATING | APPLYING_RESUME | RESUME_LOCKED
    this.resumePosition = 0;

    // Progress & Consumption
    this.watchedSeconds = 0;
    this.realWatchedSeconds = 0;
    this.completionPercentage = 0;
    this.completedAt = null;

    // Synchronization & Versioning
    this.lastSyncedPosition = 0;
    this.lastSyncTimestamp = null;
    this.pendingSave = false;
    this.dirty = false;
    this.retryCount = 0;
    this.syncVersion = 1;

    // Timestamps & Lifecycle
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
    this.destroyed = false;

    // Event Pub/Sub Registry
    this.listeners = new Map();

    this.emit('SessionCreated', { sessionId: this.sessionId, lessonId: this.lessonId });
  }

  // Event Pub/Sub methods
  on(event, callback) {
    if (typeof callback !== 'function') return () => {};
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, payload = {}) {
    if (this.destroyed) return;
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try { cb({ event, sessionId: this.sessionId, lessonId: this.lessonId, timestamp: Date.now(), ...payload }); }
        catch (err) { console.error(`[PlaybackSession Error in ${event} handler]:`, err); }
      });
    }
  }

  // Runtime Mutations
  updatePosition(pos) {
    if (this.destroyed) return;
    const nextPos = Math.max(0, Number(pos) || 0);
    if (Math.abs(this.localPosition - nextPos) > 0.05) {
      this.localPosition = nextPos;
      this.syncVersion += 1;
      this.updatedAt = Date.now();
      if (Math.abs(nextPos - this.lastSyncedPosition) >= 2) {
        this.dirty = true;
      }
      this.emit('ProgressChanged', { position: nextPos, version: this.syncVersion });
    }
  }

  setPlaying(isPlaying) {
    if (this.destroyed) return;
    if (this.playing !== isPlaying) {
      this.playing = isPlaying;
      this.paused = !isPlaying;
      this.syncVersion += 1;
      this.updatedAt = Date.now();
      this.emit(isPlaying ? 'PlaybackStarted' : 'PlaybackPaused', { position: this.localPosition });
    }
  }

  setSeeking(isSeeking) {
    if (this.destroyed) return;
    if (this.seeking !== isSeeking) {
      this.seeking = isSeeking;
      this.syncVersion += 1;
      this.updatedAt = Date.now();
      this.emit(isSeeking ? 'SeekStarted' : 'SeekCompleted', { position: this.localPosition });
    }
  }

  markSynced(syncedPos) {
    if (this.destroyed) return;
    this.lastSyncedPosition = syncedPos;
    this.lastSyncTimestamp = Date.now();
    this.dirty = false;
    this.pendingSave = false;
    this.emit('ProgressSaved', { lastSyncedPosition: syncedPos, version: this.syncVersion });
  }

  markCompleted() {
    if (this.destroyed) return;
    if (!this.completed) {
      this.completed = true;
      this.completedAt = Date.now();
      this.emit('CompletionAchieved', { lessonId: this.lessonId });
    }
  }

  setResumeState(state, pos = null) {
    if (this.destroyed) return;
    this.resumeState = state;
    if (pos !== null) this.resumePosition = pos;
    if (state === 'RESUME_LOCKED') this.resumed = true;
    this.emit('ResumeStateChanged', { resumeState: state, resumePosition: this.resumePosition });
  }

  destroy() {
    if (this.destroyed) return;
    this.emit('SessionDestroyed', { sessionId: this.sessionId, lessonId: this.lessonId });
    this.destroyed = true;
    this.listeners.clear();
  }
}
