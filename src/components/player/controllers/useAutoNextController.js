"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { createCountdownTimer } from '@/libs/countdownTimer';

export function useAutoNextController({ nextLesson, courseSlug, router }) {
  const [autoNextCountdown, setAutoNextCountdown] = useState(null);
  const countdownTimerRef = useRef(null);

  // The completion callback must always navigate using the LATEST props. The
  // countdown object is created once; onComplete reads through this ref so a
  // mid-session props change can never be captured stale.
  const onCompleteRef = useRef(null);
  useEffect(() => {
    onCompleteRef.current = () => {
      if (nextLesson && courseSlug) {
        router.push(`/course/${courseSlug}/learn/${nextLesson.id}`);
      }
    };
  }, [nextLesson, courseSlug, router]);

  // Create the countdown timer exactly once, after mount. It owns the interval
  // lifecycle: start() clears any existing interval first, and cancel()/clear()
  // are invoked on every exit path (complete / cancel / lesson change / unmount).
  useEffect(() => {
    const timer = createCountdownTimer({
      duration: 5,
      onTick: (remaining) => setAutoNextCountdown(remaining),
      onComplete: () => onCompleteRef.current?.(),
    });
    countdownTimerRef.current = timer;
    // CRITICAL: clear the countdown interval when the player unmounts so a
    // pending countdown can never fire `router.push()` (or update state) after
    // the player has been destroyed.
    return () => timer.cancel();
  }, []);

  const triggerAutoNext = useCallback(() => {
    if (!nextLesson || !courseSlug) return;
    // start() clears any existing interval first, so repeated `ended` events
    // can never create a second countdown.
    countdownTimerRef.current?.start();
  }, [nextLesson, courseSlug]);

  const cancelAutoNext = useCallback(() => {
    countdownTimerRef.current?.cancel();
    setAutoNextCountdown(null);
  }, []);

  const handlePlayNextImmediately = useCallback(() => {
    countdownTimerRef.current?.cancel();
    if (nextLesson && courseSlug) {
      router.push(`/course/${courseSlug}/learn/${nextLesson.id}`);
    }
  }, [nextLesson, courseSlug, router]);

  return {
    autoNextCountdown,
    triggerAutoNext,
    cancelAutoNext,
    handlePlayNextImmediately,
  };
}
