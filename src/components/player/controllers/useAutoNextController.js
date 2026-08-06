"use client";

import { useState, useRef, useCallback } from 'react';

export function useAutoNextController({ nextLesson, courseSlug, router }) {
  const [autoNextCountdown, setAutoNextCountdown] = useState(null);
  const countdownTimerRef = useRef(null);

  const triggerAutoNext = useCallback(() => {
    if (!nextLesson || !courseSlug) return;
    setAutoNextCountdown(5);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = setInterval(() => {
      setAutoNextCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          router.push(`/course/${courseSlug}/learn/${nextLesson.id}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [nextLesson, courseSlug, router]);

  const cancelAutoNext = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setAutoNextCountdown(null);
  }, []);

  const handlePlayNextImmediately = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (nextLesson && courseSlug) {
      router.push(`/course/${courseSlug}/learn/${nextLesson.id}`);
    }
  }, [nextLesson, courseSlug, router]);

  return {
    autoNextCountdown,
    setAutoNextCountdown,
    countdownTimerRef,
    triggerAutoNext,
    cancelAutoNext,
    handlePlayNextImmediately,
  };
}
