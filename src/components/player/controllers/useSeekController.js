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

  // ─── Clear the safety guard timer ───────────────────────────────────────────
  const clearSeekGuard = useCallback(() => {
    if (seekGuardTimerRef.current) {
      clearTimeout(seekGuardTimerRef.current);
      seekGuardTimerRef.current = null;
    }
  }, []);

  // ─── SINGLE authoritative point for setting video.currentTime ───────────────
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

  // ─── Apply a pending seek (called from canplay or handleProgress) ────────────
  const applyPendingSeek = useCallback(() => {
    const pending = pendingSeekRef.current;
    if (!pending) return false;
    const el = videoRef.current;
    if (!el) return false;

    // Only apply if readyState >= 2 (has current-position data) OR
    // the target is within an already-buffered range
    const target = pending.target;
    let targetBuffered = false;
    try {
      const buf = el.buffered;
      for (let i = 0; i < buf.length; i++) {
        if (buf.start(i) <= target && target <= buf.end(i) + 0.5) {
          targetBuffered = true;
          break;
        }
      }
    } catch { /* ignore */ }

    if (!targetBuffered && el.readyState < 3) {
      // Not ready yet — leave in queue, handleProgress will retry
      return false;
    }

    pendingSeekRef.current = null;
    isSeekingRef.current = true;
    committedSeekRef.current = { target };
    applySeek(target, pending.reason);
    setCurrentTime(target);
    return true;
  }, [videoRef, applySeek, setCurrentTime]);

  // ─── Request seek: validates readyState, queues if not ready ────────────────
  const requestSeek = useCallback((seconds, reason) => {
    const el = videoRef.current;
    const target = Math.max(0, Number(seconds) || 0);
    if (!el) return;

    isSeekingRef.current = true;
    setCurrentTime(target);
    setSeekingTime(target);

    // Queue the seek — always set pendingSeekRef as the source of truth
    // applyPendingSeek will execute it when buffer is ready
    pendingSeekRef.current = { target, reason };

    // Attempt immediate seek if we have enough data
    const applied = applyPendingSeek();
    if (applied) {
      committedSeekRef.current = { target };
    }

    // Safety valve: if 'seeked' never fires within 3s, unblock playback
    clearSeekGuard();
    seekGuardTimerRef.current = setTimeout(() => {
      seekGuardTimerRef.current = null;
      if (isSeekingRef.current) {
        isSeekingRef.current = false;
        committedSeekRef.current = null;
        pendingSeekRef.current = null;
        setSeekingTime(null);
        const v = videoRef.current;
        if (v) setCurrentTime(v.currentTime || 0);
      }
    }, 3000);
  }, [videoRef, applyPendingSeek, setCurrentTime, clearSeekGuard]);

  // ─── Slider drag starts ─────────────────────────────────────────────────────
  const handleSeekStart = useCallback(() => {
    isSeekingRef.current = true;
  }, []);

  // ─── Native 'seeking' event from the <video> element ───────────────────────
  const handleSeeking = useCallback(() => {
    isSeekingRef.current = true;
    if (videoRef.current) {
      playerDebug.mediaEvent({ name: 'seeking', video: videoRef.current });
    }
  }, [videoRef]);

  // ─── Native 'seeked' event ──────────────────────────────────────────────────
  // KEY FIX: If the seek landed at 0 but we wanted e.g. 73.8, the browser
  // could not serve the range (server returned 200 instead of 206, or MP4
  // moov atom not at front). We detect this failure and keep the seek queued
  // so handleProgress can retry once the buffer reaches the target.
  const handleSeeked = useCallback(() => {
    if (videoRef.current) {
      playerDebug.mediaEvent({ name: 'seeked', video: videoRef.current });
    }

    const el = videoRef.current;
    if (!el) {
      clearSeekGuard();
      isSeekingRef.current = false;
      setSeekingTime(null);
      return;
    }

    const actualTime = el.currentTime || 0;
    const committed = committedSeekRef.current;

    if (committed && Math.abs(actualTime - committed.target) > 1.5 && committed.target > 1.0) {
      // ── SEEK FAILED ──
      // The browser couldn't jump to the requested position (no range support
      // or insufficient buffer). Re-queue the seek so handleProgress retries
      // it as data buffers in.
      pendingSeekRef.current = { target: committed.target, reason: 'seek-retry-buffering' };
      committedSeekRef.current = null;
      // Keep isSeekingRef=true and seekingTime pointing at the target so the
      // UI continues to show the intended position.
      setCurrentTime(committed.target);
      // Do NOT clear seekGuard — let it keep running as the overall timeout
      return;
    }

    // ── SEEK SUCCEEDED ──
    clearSeekGuard();
    isSeekingRef.current = false;
    committedSeekRef.current = null;
    setSeekingTime(null);
    setCurrentTime(actualTime);
    if (lastTimeRef) lastTimeRef.current = actualTime;
  }, [videoRef, setCurrentTime, clearSeekGuard, lastTimeRef]);

  // ─── Called from handleProgress — retries queued seeks as data buffers ──────
  // Returns true if a pending seek was applied.
  const retryPendingSeekFromBuffer = useCallback(() => {
    if (!pendingSeekRef.current) return false;
    return applyPendingSeek();
  }, [applyPendingSeek]);

  // ─── Slider onChange (while dragging) ──────────────────────────────────────
  const handleSeekChange = useCallback((e) => {
    isSeekingRef.current = true;
    setSeekingTime(parseFloat(e.target.value));
  }, []);

  // ─── Slider onPointerUp ─────────────────────────────────────────────────────
  const handleSeekCommit = useCallback((e) => {
    const targetTime = seekingTime !== null ? seekingTime : parseFloat(e.target.value);
    if (isNaN(targetTime)) return;

    if (lessonId && hasResumedLessonIdRef) {
      hasResumedLessonIdRef.current = lessonId;
    }

    requestSeek(targetTime, 'seek-commit');

    if (typeof logAnalytics === 'function') {
      logAnalytics('seek', { to: targetTime });
    }
    if (typeof flushProgress === 'function') {
      flushProgress(targetTime);
    }
  }, [seekingTime, requestSeek, lessonId, hasResumedLessonIdRef, logAnalytics, flushProgress]);

  // ─── Keyboard / blur / cancel commit ────────────────────────────────────────
  const handleSeekPreviewCommit = useCallback((e) => {
    if (seekingTime !== null) {
      handleSeekCommit(e);
    } else {
      isSeekingRef.current = false;
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
    retryPendingSeekFromBuffer,
    handleSeekStart,
    handleSeeking,
    handleSeeked,
    handleSeekChange,
    handleSeekCommit,
    handleSeekPreviewCommit,
  };
}
