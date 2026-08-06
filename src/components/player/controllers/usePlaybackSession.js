"use client";

import { useRef, useCallback, useEffect } from 'react';
import { PlaybackSession } from '@/libs/PlaybackSession';
import { playerDebug } from '@/libs/playerDebug';

export function usePlaybackSession() {
  const playbackSessionRef = useRef(null);

  const initSession = useCallback((lessonId, initialPos = 0) => {
    // Destroy previous session if active
    if (playbackSessionRef.current) {
      playbackSessionRef.current.destroy();
    }

    const session = new PlaybackSession(lessonId, initialPos);
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
    session.updatePosition(elPos);
    session.setSeeking(Boolean(videoElement.seeking));
    session.setPlaying(!videoElement.paused);
  }, []);

  const markSynced = useCallback((syncedPos) => {
    if (playbackSessionRef.current) {
      playbackSessionRef.current.markSynced(syncedPos);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackSessionRef.current) {
        playbackSessionRef.current.destroy();
        playbackSessionRef.current = null;
      }
    };
  }, []);

  return {
    playbackSessionRef,
    initSession,
    markResumed,
    syncFromElement,
    markSynced,
  };
}
