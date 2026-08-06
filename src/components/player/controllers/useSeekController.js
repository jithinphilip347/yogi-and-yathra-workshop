"use client";

import { useState, useRef, useCallback } from 'react';
import { playerDebug } from '@/libs/playerDebug';

export function useSeekController({
  videoRef,
  playbackSessionRef,
  lessonId,
  setCurrentTime,
  hasResumedLessonIdRef,
  flushProgress,
  logAnalytics,
  lastTimeRef,
}) {
  const isSeekingRef = useRef(false);
  const [seekingTime, setSeekingTime] = useState(null);
  const pendingSeekRef = useRef(null);
  const committedSeekRef = useRef(null);
  const seekGuardTimerRef = useRef(null);

  // SINGLE point of truth for setting video.currentTime
  const applySeek = useCallback((seconds, reason) => {
    const el = videoRef.current;
    if (!el) return null;
    const prev = Number(el.currentTime) || 0;
    const next = Math.max(0, Number(seconds) || 0);
    const session = playbackSessionRef.current;
    if (session) {
      session.localPosition = next;
      session.version += 1;
      session.resumed = true;
    }
    if (lastTimeRef) {
      lastTimeRef.current = next;
    }
    if (Math.abs(prev - next) > 0.05) {
      playerDebug.currentTimeAssign({ prev, next, reason, lessonId });
    }
    el.currentTime = next;
    setCurrentTime(next);
    return next;
  }, [videoRef, playbackSessionRef, lessonId, lastTimeRef, setCurrentTime]);

  // Request seek with readyState validation & safety guard timer
  const requestSeek = useCallback((seconds, reason) => {
    const el = videoRef.current;
    const target = Math.max(0, Number(seconds) || 0);
    if (!el) return;

    setCurrentTime(target);
    setSeekingTime(target);
    isSeekingRef.current = true;

    if (el.readyState >= 1 && !(isNaN(el.duration) || el.duration <= 0)) {
      applySeek(target, reason);
      committedSeekRef.current = { target };
    } else {
      pendingSeekRef.current = { target, reason };
    }

    if (seekGuardTimerRef.current) clearTimeout(seekGuardTimerRef.current);
    seekGuardTimerRef.current = setTimeout(() => {
      seekGuardTimerRef.current = null;
      isSeekingRef.current = false;
      setSeekingTime(null);
      committedSeekRef.current = null;
      const v = videoRef.current;
      if (v) {
        setCurrentTime(v.currentTime || 0);
      }
    }, 1500);
  }, [videoRef, applySeek, setCurrentTime]);

  // Apply queued seek when media element becomes seekable (canplay/loadedmetadata)
  const applyPendingSeek = useCallback(() => {
    const pending = pendingSeekRef.current;
    if (!pending) return false;
    pendingSeekRef.current = null;
    applySeek(pending.target, pending.reason);
    setCurrentTime(pending.target);
    committedSeekRef.current = { target: pending.target };
    return true;
  }, [applySeek, setCurrentTime]);

  const handleSeekStart = useCallback(() => {
    isSeekingRef.current = true;
  }, []);

  const handleSeeking = useCallback(() => {
    isSeekingRef.current = true;
    if (videoRef.current) {
      playerDebug.mediaEvent({ name: 'seeking', video: videoRef.current });
    }
  }, [videoRef]);

  const handleSeeked = useCallback(() => {
    isSeekingRef.current = false;
    if (seekGuardTimerRef.current) {
      clearTimeout(seekGuardTimerRef.current);
      seekGuardTimerRef.current = null;
    }
    setSeekingTime(null);
    if (videoRef.current) {
      playerDebug.mediaEvent({ name: 'seeked', video: videoRef.current });
      const el = videoRef.current;
      const committed = committedSeekRef.current;
      if (committed) {
        if (Math.abs((el.currentTime || 0) - committed.target) < 0.5) {
          committedSeekRef.current = null;
          setCurrentTime(el.currentTime || 0);
        } else {
          setCurrentTime(committed.target);
        }
      } else {
        setCurrentTime(el.currentTime || 0);
      }
    }
  }, [videoRef, setCurrentTime]);

  const handleSeekChange = useCallback((e) => {
    isSeekingRef.current = true;
    setSeekingTime(parseFloat(e.target.value));
  }, []);

  const handleSeekCommit = useCallback((e) => {
    const targetTime = seekingTime !== null ? seekingTime : parseFloat(e.target.value);
    requestSeek(targetTime, 'seek-commit');
    isSeekingRef.current = false;
    setSeekingTime(null);
    if (lessonId && hasResumedLessonIdRef) {
      hasResumedLessonIdRef.current = lessonId;
    }
    if (typeof logAnalytics === 'function') {
      logAnalytics('seek', { to: targetTime });
    }
    if (typeof flushProgress === 'function') {
      flushProgress(targetTime);
    }
  }, [seekingTime, requestSeek, lessonId, hasResumedLessonIdRef, logAnalytics, flushProgress]);

  const handleSeekPreviewCommit = useCallback((e) => {
    isSeekingRef.current = false;
    if (seekingTime !== null) {
      handleSeekCommit(e);
    } else {
      setSeekingTime(null);
    }
  }, [seekingTime, handleSeekCommit]);

  return {
    isSeekingRef,
    seekingTime,
    setSeekingTime,
    pendingSeekRef,
    committedSeekRef,
    seekGuardTimerRef,
    applySeek,
    requestSeek,
    applyPendingSeek,
    handleSeekStart,
    handleSeeking,
    handleSeeked,
    handleSeekChange,
    handleSeekCommit,
    handleSeekPreviewCommit,
  };
}
