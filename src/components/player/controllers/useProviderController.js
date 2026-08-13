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
  setAutoNextCountdown,
  countdownTimerRef,
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

  const resolveStreamUrl = useCallback((url) => {
    if (!url || typeof url !== 'string') return '';
    return resolveMediaUrl(url);
  }, []);

  function strtolower(str) {
    return typeof str === 'string' ? str.toLowerCase() : '';
  }

  // Runs ONLY when the actual lesson ID changes (new lesson navigation)
  useEffect(() => {
    if (!lesson?.id) return;
    if (prevLessonIdRef.current === lesson.id) return;
    prevLessonIdRef.current = lesson.id;

    // Reset the frozen URL so the new lesson's stream URL gets applied
    frozenStreamUrlRef.current = '';

    let isMounted = true;
    const abortController = new AbortController();

    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
    // NOTE: Do NOT call setCurrentTime(0) here — the video element will reset
    // naturally when the new src is assigned. Calling setCurrentTime(0) here
    // creates a false reset visible in the UI before the new video loads.
    setAutoNextCountdown(null);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

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

    courseApi.getLessonStream(lesson.id, { signal: abortController.signal })
      .then((res) => {
        const data = res.data?.data || res.data;
        if (!isMounted) return;
        if (data?.stream_url) {
          const resolved = resolveStreamUrl(data.stream_url);
          // Only update the stream URL if it hasn't been frozen yet
          if (!frozenStreamUrlRef.current) {
            frozenStreamUrlRef.current = resolved;
            setActiveStreamUrl(resolved);
          }
          setActiveProvider(data.provider || 'html5');
          setActiveFormat(data.format || 'mp4');
          setIsLoading(false);
        } else {
          const direct = resolveStreamUrl(lesson.video_url);
          if (!frozenStreamUrlRef.current) {
            frozenStreamUrlRef.current = direct;
            setActiveStreamUrl(direct);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        if (!isMounted) return;
        if (lesson?.video_url) {
          const direct = resolveStreamUrl(lesson.video_url);
          if (!frozenStreamUrlRef.current) {
            frozenStreamUrlRef.current = direct;
            setActiveStreamUrl(direct);
          }
          setIsLoading(false);
        } else {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  
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
  };
}
