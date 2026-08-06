"use client";

import { useRef, useCallback } from 'react';
import { createPlaybackSession, playerDebug } from '@/libs/playbackSync';

export function usePlaybackSession() {
  const playbackSessionRef = useRef(null);

  const initSession = useCallback((lessonId, initialPos = 0) => {
    const session = createPlaybackSession(lessonId, initialPos);
    playbackSessionRef.current = session;
    playerDebug.session({ lessonId, action: 'init', session });
    return session;
  }, []);

  const markResumed = useCallback(() => {
    if (playbackSessionRef.current) {
      playbackSessionRef.current.resumed = true;
    }
  }, []);

  const syncFromElement = useCallback((videoElement) => {
    if (!videoElement || !playbackSessionRef.current) return;
    const session = playbackSessionRef.current;
    const elPos = Math.max(0, Number(videoElement.currentTime) || 0);
    session.localPosition = elPos;
    session.version += 1;
    session.playbackState = videoElement.seeking ? 'seeking' : videoElement.paused ? 'paused' : 'playing';
    if (Math.abs(elPos - session.lastSyncedPosition) >= 2) {
      session.dirty = true;
    }
  }, []);

  const markSynced = useCallback((syncedPos) => {
    if (playbackSessionRef.current) {
      const session = playbackSessionRef.current;
      session.lastSyncedPosition = syncedPos;
      session.lastSyncAt = Date.now();
      session.dirty = false;
      session.pendingSync = false;
    }
  }, []);

  return {
    playbackSessionRef,
    initSession,
    markResumed,
    syncFromElement,
    markSynced,
  };
}
