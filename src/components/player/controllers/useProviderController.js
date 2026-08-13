"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import courseApi from '@/libs/courseApi';
import { playerDebug } from '@/libs/playerDebug';
import { resolveMediaUrl } from '@/utils/mediaUrl';

export function useProviderController({
  lesson,
  setIsLoading,
  setHasError,
  setIsPlaying,
  setCurrentTime,
  cancelAutoNext,
  initSession,
  lastSavedPosRef,
  activeWatchedSecondsRef,
  lastTimeRef,
  pendingSeekRef,
  committedSeekRef,
  seekGuardTimerRef,
}) {
  const [activeStreamUrl, setActiveStreamUrl] = useState('');
  const [activeProvider, setActiveProvider] = useState('html5');
  const [activeFormat, setActiveFormat] = useState('mp4');
  // Track lesson.id separately so we never re-run the effect on the same lesson
  const prevLessonIdRef = useRef(null);
  // Freeze the stream URL once loaded so mid-session ACKs never change it
  const frozenStreamUrlRef = useRef('');
  // Component liveness + the current in-flight stream request (lesson change
  // or refresh aborts any previous fetch).
  const mountedRef = useRef(true);
  const streamAbortRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const resolveStreamUrl = useCallback((url) => {
    if (!url || typeof url !== 'string') return '';
    return resolveMediaUrl(url);
  }, []);

  function strtolower(str) {
    return typeof str === 'string' ? str.toLowerCase() : '';
  }

  /**
   * Fetch the lesson's stream payload from the AUTHENTICATED endpoint and
   * install the resulting URL. This is the ONLY way a stream URL is obtained —
   * refreshes always re-request the authorized payload (never raw storage URLs
   * or unauthenticated fallbacks). Aborts any previous in-flight request.
   */
  const loadStream = useCallback((lessonId, lessonVideoUrl) => {
    if (streamAbortRef.current) streamAbortRef.current.abort();
    const controller = new AbortController();
    streamAbortRef.current = controller;

    courseApi.getLessonStream(lessonId, { signal: controller.signal })
      .then((res) => {
        if (!mountedRef.current || controller.signal.aborted) return;
        const data = res.data?.data || res.data;
        if (data?.stream_url) {
          const resolved = resolveStreamUrl(data.stream_url);
          // Only update the stream URL if it hasn't been frozen yet
          if (!frozenStreamUrlRef.current) {
            frozenStreamUrlRef.current = resolved;
            setActiveStreamUrl(resolved);
          }
          setActiveProvider(data.provider || 'html5');
          setActiveFormat(data.format || 'mp4');
          setHasError(false);
          setIsLoading(false);
        } else {
          const direct = resolveStreamUrl(lessonVideoUrl);
          if (!frozenStreamUrlRef.current) {
            frozenStreamUrlRef.current = direct;
            setActiveStreamUrl(direct);
          }
          setHasError(false);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        if (!mountedRef.current) return;
        if (lessonVideoUrl) {
          // Fall back to the lesson's own (already authorized/signed) video URL
          // from the session — never an unauthenticated public storage URL.
          const direct = resolveStreamUrl(lessonVideoUrl);
          if (!frozenStreamUrlRef.current) {
            frozenStreamUrlRef.current = direct;
            setActiveStreamUrl(direct);
          }
          setHasError(false);
          setIsLoading(false);
        } else {
          setHasError(true);
          setIsLoading(false);
        }
      });
  }, [resolveStreamUrl, setHasError, setIsLoading]);

  // Runs ONLY when the actual lesson ID changes (new lesson navigation)
  useEffect(() => {
    if (!lesson?.id) return;
    if (prevLessonIdRef.current === lesson.id) return;
    prevLessonIdRef.current = lesson.id;

    // Reset the frozen URL so the new lesson's stream URL gets applied
    frozenStreamUrlRef.current = '';

    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
    // NOTE: Do NOT call setCurrentTime(0) here — the video element will reset
    // naturally when the new src is assigned. Calling setCurrentTime(0) here
    // creates a false reset visible in the UI before the new video loads.
    // Cancel any in-flight auto-next countdown from the previous lesson so a
    // stale timer can never navigate to (or re-navigate to) the old next
    // lesson.
    cancelAutoNext();

    // Reset all per-lesson bookkeeping
    if (typeof initSession === 'function') {
      initSession(lesson.id, lesson?.last_position_seconds || 0);
    }
    if (lastSavedPosRef) lastSavedPosRef.current = 0;
    if (activeWatchedSecondsRef) activeWatchedSecondsRef.current = lesson?.watched_seconds || 0;
    if (lastTimeRef) lastTimeRef.current = 0;
    if (pendingSeekRef) pendingSeekRef.current = null;
    if (committedSeekRef) committedSeekRef.current = null;
    if (seekGuardTimerRef && seekGuardTimerRef.current) {
      clearTimeout(seekGuardTimerRef.current);
      seekGuardTimerRef.current = null;
    }

    loadStream(lesson.id, lesson?.video_url);

    return () => {
      if (streamAbortRef.current) streamAbortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  /**
   * Re-fetch the CURRENT lesson's stream from the authorized endpoint.
   *
   * Used after a playback failure (typically an expired signed stream URL).
   * The frozen URL is deliberately released so the fresh authorized URL takes
   * effect. Playback position is preserved: the local PlaybackSession is
   * untouched and resume re-applies on loadedmetadata. The caller (VideoEngine)
   * bounds how many times this may run before showing the error UI.
   */
  const refreshStream = useCallback(() => {
    const lessonId = prevLessonIdRef.current;
    if (!lessonId) return;

    frozenStreamUrlRef.current = '';
    setHasError(false);
    setIsLoading(true);
    playerDebug.streamRefresh({ lessonId, action: 'refresh-requested' });
    loadStream(lessonId, lesson?.video_url);
  }, [lesson?.video_url, loadStream, setHasError, setIsLoading]);

  const rawUrl = activeStreamUrl || resolveStreamUrl(lesson?.video_url);

  const lessonType = strtolower(lesson?.type || '');
  let providerType = activeProvider || 'html5';
  let formatType = activeFormat || 'mp4';

  if (rawUrl.includes('.m3u8') || lessonType === 'hls') {
    providerType = 'hls';
    formatType = 'm3u8';
  } else if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be') || lessonType === 'youtube') {
    providerType = 'youtube';
    formatType = 'youtube';
  } else if (rawUrl.includes('vimeo.com') || lessonType === 'vimeo') {
    providerType = 'vimeo';
    formatType = 'vimeo';
  } else if (rawUrl.includes('.mov')) {
    providerType = 'html5';
    formatType = 'mov';
  } else if (rawUrl.includes('.webm')) {
    providerType = 'html5';
    formatType = 'webm';
  }

  return {
    rawUrl,
    providerType,
    formatType,
    resolveStreamUrl,
    refreshStream,
  };
}
