"use client";

import { useRef, useCallback, useEffect } from 'react';
import courseApi from '@/libs/courseApi';
import { playerDebug } from '@/libs/playbackSync';

export function usePlaybackProgress({
  lesson,
  duration,
  isPlaying,
  videoRef,
  playbackSessionRef,
  onProgressUpdated,
}) {
  const lastSavedPosRef = useRef(0);
  const activeWatchedSecondsRef = useRef(0);
  const lastTimeRef = useRef(0);
  const progressTimerRef = useRef(null);

  // Flush progress update to backend
  const flushProgress = useCallback((forcedPos = null) => {
    if (!lesson?.id || !videoRef.current) return;
    const currentPos = Math.floor(forcedPos !== null ? forcedPos : (videoRef.current.currentTime || 0));
    const vidDur = Math.floor(videoRef.current.duration || duration || 0);

    if (currentPos <= 0 && vidDur <= 0) return;
    if (Math.abs(currentPos - lastSavedPosRef.current) < 2 && forcedPos === null) return;

    const session = playbackSessionRef.current;
    // Monotonic sync: never flush an unforced position older than last synced position
    if (forcedPos === null && session && currentPos < session.lastSyncedPosition) return;

    lastSavedPosRef.current = currentPos;
    if (session) {
      session.lastSyncedPosition = currentPos;
      session.lastSyncAt = Date.now();
    }
    const realWatched = Math.floor(activeWatchedSecondsRef.current);
    playerDebug.progressRequest({ lessonId: lesson.id, position: currentPos, watchedSeconds: realWatched, duration: vidDur });

    courseApi.saveLessonProgress(lesson.id, currentPos, vidDur, realWatched)
      .then((res) => {
        const record = res.data?.data || res.data;
        playerDebug.progressResponse({
          lessonId: lesson.id,
          returnedPosition: Number(record?.last_position_seconds ?? 0),
          status: record?.status,
          percentage: record?.percentage_watched,
          localPosition: currentPos,
        });
        if (typeof onProgressUpdated === 'function' && record) {
          onProgressUpdated(record, lesson.id);
        }
      })
      .catch(() => {});
  }, [lesson?.id, duration, videoRef, playbackSessionRef, onProgressUpdated]);

  // Debounced 5-second interval progress sync during playback
  useEffect(() => {
    if (isPlaying) {
      progressTimerRef.current = setInterval(() => {
        flushProgress();
      }, 5000);
    } else {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, flushProgress]);

  // Flush progress on unmount or lesson change
  useEffect(() => {
    return () => {
      if (videoRef.current && lesson?.id) {
        flushProgress();
      }
    };
  }, [lesson?.id, flushProgress, videoRef]);

  return {
    lastSavedPosRef,
    activeWatchedSecondsRef,
    lastTimeRef,
    progressTimerRef,
    flushProgress,
  };
}
