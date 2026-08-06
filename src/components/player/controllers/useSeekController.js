"use client";

import { useState, useRef, useCallback } from 'react';
import { playerDebug } from '@/libs/playbackSync';

export function useSeekController({
  videoRef,
  playbackSessionRef,
  lessonId,
  setCurrentTime,
  hasResumedLessonIdRef,
  flushProgress,
  logAnalytics,
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
    if (Math.abs(prev - next) > 0.05) {
      playerDebug.currentTimeAssign({ prev, next, reason, lessonId });
    }
    el.currentTime = next;
    return next;
  }, [videoRef, playbackSessionRef, lessonId]);

  // Request seek with readyState validation & safety guard timer
  const requestSeek = useCallback((seconds, reason) => {
    const el = videoRef.current;
    const target = Math.max(0, Number(seconds) || 0);
    if (!el) return;
    if (Math.abs((el.currentTime || 0) - target) < 0.05) return;

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
      const v = videoRef.current;
      if (!v) return;
      if (isSeekingRef.current && !v.seeking) {
        isSeekingRef.current = false;
        setSeekingTime(null);
        committedSeekRef.current = null;
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
    if (videoRef.current && Math.abs((videoRef.current.currentTime || 0) - targetTime) < 0.05) {
      isSeekingRef.current = false;
      setSeekingTime(null);
    }
    if (lessonId && hasResumedLessonIdRef) {
      hasResumedLessonIdRef.current = lessonId;
    }
    if (typeof logAnalytics === 'function') {
      logAnalytics('seek', { to: targetTime });
    }
    if (typeof flushProgress === 'function') {
      flushProgress(targetTime);
    }
  }, [seekingTime, requestSeek, videoRef, lessonId, hasResumedLessonIdRef, logAnalytics, flushProgress]);

  const handleSeekPreviewCommit = useCallback((e) => {
    if (!isSeekingRef.current && seekingTime === null) return;
    handleSeekCommit(e);
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
