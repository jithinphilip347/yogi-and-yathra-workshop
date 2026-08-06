"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import courseApi from '@/libs/courseApi';
import { playerDebug } from '@/libs/playerDebug';

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
  const prevLessonIdRef = useRef(null);

  const resolveStreamUrl = useCallback((url) => {
    if (!url || typeof url !== 'string') return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    if (cleanPath.startsWith('storage/')) {
      return `http://localhost:8000/${cleanPath}`;
    }
    return `http://localhost:8000/storage/${cleanPath}`;
  }, []);

  function strtolower(str) {
    return typeof str === 'string' ? str.toLowerCase() : '';
  }

  // Fetch signed stream payload or resolve direct URL on actual lesson ID change
  useEffect(() => {
    if (!lesson?.id) return;
    if (prevLessonIdRef.current === lesson.id) return;
    prevLessonIdRef.current = lesson.id;

    let isMounted = true;
    const abortController = new AbortController();

    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setAutoNextCountdown(null);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    // Fresh in-memory playback session per lesson.
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
        if (isMounted && data?.stream_url) {
          const resolved = resolveStreamUrl(data.stream_url);
          setActiveStreamUrl((prev) => (prev === resolved ? prev : resolved));
          setActiveProvider(data.provider || 'html5');
          setActiveFormat(data.format || 'mp4');
          setIsLoading(false);
        } else if (isMounted) {
          const direct = resolveStreamUrl(lesson.video_url);
          setActiveStreamUrl((prev) => (prev === direct ? prev : direct));
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        if (isMounted) {
          if (lesson?.video_url) {
            const direct = resolveStreamUrl(lesson.video_url);
            setActiveStreamUrl((prev) => (prev === direct ? prev : direct));
            setIsLoading(false);
          } else {
            setHasError(true);
            setIsLoading(false);
          }
        }
      });

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [
    lesson?.id,
    lesson?.video_url,
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
    resolveStreamUrl,
  ]);

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
