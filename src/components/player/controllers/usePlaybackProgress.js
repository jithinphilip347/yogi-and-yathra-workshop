"use client";

import { useRef, useCallback, useEffect, useState } from 'react';
import courseApi from '@/libs/courseApi';
import { playerDebug } from '@/libs/playerDebug';

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
  const isOnlineRef = useRef(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Error-tolerant retry queue for offline/failed progress flushes
  const pendingProgressQueueRef = useRef([]);

  // Telemetry sync metrics
  const syncMetricsRef = useRef({
    saveRequests: 0,
    saveAcks: 0,
    ignoredStale: 0,
    retriesCount: 0,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });

  // Network recovery handler: automatically replay retry queue when back online
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      syncMetricsRef.current.isOnline = true;
      if (pendingProgressQueueRef.current.length > 0 && lesson?.id) {
        const queued = pendingProgressQueueRef.current.shift();
        syncMetricsRef.current.retriesCount += 1;
        courseApi.saveLessonProgress(queued.lessonId, queued.currentPos, queued.vidDur, queued.realWatched)
          .then((res) => {
            syncMetricsRef.current.saveAcks += 1;
            const record = res.data?.data || res.data;
            if (typeof onProgressUpdated === 'function' && record) {
              onProgressUpdated(record, queued.lessonId);
            }
          })
          .catch(() => {});
      }
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
      syncMetricsRef.current.isOnline = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [lesson?.id, onProgressUpdated]);

  // Flush progress update to backend
  const flushProgress = useCallback((forcedPos = null, { force = false } = {}) => {
    if (!lesson?.id || !videoRef.current) return;
    const currentPos = Math.floor(forcedPos !== null ? forcedPos : (videoRef.current.currentTime || 0));
    const vidDur = Math.floor(videoRef.current.duration || duration || 0);

    if (currentPos <= 0 && vidDur <= 0) return;
    if (Math.abs(currentPos - lastSavedPosRef.current) < 2 && forcedPos === null && !force) return;

    const session = playbackSessionRef.current;
    // Monotonic sync: never flush an unforced position older than last synced position
    if (forcedPos === null && !force && session && currentPos < session.lastSyncedPosition) return;

    lastSavedPosRef.current = currentPos;
    const reqVersion = session ? (session.syncVersion || session.version || 0) : 0;
    if (session) {
      session.lastSyncedPosition = currentPos;
      session.lastSyncTimestamp = Date.now();
    }
    const realWatched = Math.floor(activeWatchedSecondsRef.current);

    syncMetricsRef.current.saveRequests += 1;
    playerDebug.progressRequest({ lessonId: lesson.id, position: currentPos, watchedSeconds: realWatched, duration: vidDur, version: reqVersion });

    // Process any queued items first if online
    if (pendingProgressQueueRef.current.length > 0 && isOnlineRef.current) {
      const queued = pendingProgressQueueRef.current.shift();
      syncMetricsRef.current.retriesCount += 1;
      courseApi.saveLessonProgress(queued.lessonId, queued.currentPos, queued.vidDur, queued.realWatched)
        .catch(() => {}); // Retries are best-effort background
    }

    // Offline mode guard: buffer directly into queue (capped at max 50 items)
    if (!isOnlineRef.current) {
      if (pendingProgressQueueRef.current.length < 50) {
        pendingProgressQueueRef.current.push({
          lessonId: lesson.id,
          currentPos,
          vidDur,
          realWatched,
          reqVersion,
          timestamp: Date.now(),
        });
      }
      return;
    }

    courseApi.saveLessonProgress(lesson.id, currentPos, vidDur, realWatched)
      .then((res) => {
        syncMetricsRef.current.saveAcks += 1;
        const record = res.data?.data || res.data;
        const currentSession = playbackSessionRef.current;
        if (currentSession && reqVersion < (currentSession.syncVersion || currentSession.version || 0) - 10) {
          syncMetricsRef.current.ignoredStale += 1;
        }

        playerDebug.progressResponse({
          lessonId: lesson.id,
          returnedPosition: Number(record?.last_position_seconds ?? 0),
          status: record?.status,
          percentage: record?.percentage_watched,
          localPosition: currentPos,
          reqVersion,
        });

        // Unidirectional ACK update to parent layout state for passive observers ONLY
        if (typeof onProgressUpdated === 'function' && record) {
          onProgressUpdated(record, lesson.id);
        }
      })
      .catch((err) => {
        // 429 Too Many Requests: the request reached the server and was
        // throttled — stored progress is intact. Do NOT queue a retry (it
        // would only re-trigger the limiter); the next regular flush re-sends
        // the cumulative value anyway.
        if (err?.response?.status === 429) return;

        // Error-tolerant fallback: push to retry queue (capped at max 50 items)
        console.warn("[CoursePlayer Sync] Progress save deferred (retry queued):", err?.message || err);
        if (pendingProgressQueueRef.current.length < 50) {
          pendingProgressQueueRef.current.push({
            lessonId: lesson.id,
            currentPos,
            vidDur,
            realWatched,
            reqVersion,
            timestamp: Date.now(),
          });
        }
      });
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
        flushProgress(null, { force: true });
      }
    };
  }, [lesson?.id, flushProgress, videoRef]);

  return {
    lastSavedPosRef,
    activeWatchedSecondsRef,
    lastTimeRef,
    progressTimerRef,
    pendingProgressQueueRef,
    syncMetricsRef,
    flushProgress,
  };
}
