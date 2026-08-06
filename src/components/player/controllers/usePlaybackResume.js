"use client";

import { useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { playerDebug } from '@/libs/playerDebug';

export function usePlaybackResume() {
  const hasResumedLessonIdRef = useRef(null);

  const attemptResume = useCallback(({
    lesson,
    videoRef,
    playbackSessionRef,
    applySeek,
    applyPendingSeek,
    setCurrentTime,
    setDuration,
    playbackSpeed,
  }) => {
    if (!videoRef.current || !lesson?.id) return;

    const session = playbackSessionRef.current;
    if (session) {
      session.setResumeState('WAITING_FOR_METADATA');
    }

    const vidDur = Number(videoRef.current.duration) || 0;
    if (typeof setDuration === 'function') {
      setDuration(vidDur);
    }
    videoRef.current.playbackRate = playbackSpeed;

    // Apply any pending user seek first (user intent overrides auto-resume)
    if (typeof applyPendingSeek === 'function') {
      const appliedPending = applyPendingSeek();
      if (appliedPending) {
        if (session) session.setResumeState('RESUME_LOCKED', videoRef.current.currentTime);
        hasResumedLessonIdRef.current = lesson.id;
        return;
      }
    }

    // 1. One-Shot Lock Check: if already resumed for this lesson session, exit immediately
    if (hasResumedLessonIdRef.current === lesson.id || (session && session.resumed)) {
      if (session) session.setResumeState('RESUME_LOCKED', session.resumePosition);
      return;
    }

    if (session) session.setResumeState('VALIDATING');

    // 2. Resume Position Validation Rules
    const resumePos = Number(lesson?.last_position_seconds) || 0;
    const isValid = (
      resumePos > 5 &&
      vidDur > 0 &&
      resumePos < vidDur - 5 &&
      (videoRef.current.currentTime || 0) < resumePos - 1
    );

    if (isValid) {
      // 3. Apply One-Time Resume
      if (session) session.setResumeState('APPLYING_RESUME', resumePos);
      hasResumedLessonIdRef.current = lesson.id;

      if (typeof applySeek === 'function') {
        applySeek(resumePos, 'one-time-resume');
      }
      if (typeof setCurrentTime === 'function') {
        setCurrentTime(resumePos);
      }

      if (session) session.setResumeState('RESUME_LOCKED', resumePos);

      const m = Math.floor(resumePos / 60);
      const s = Math.floor(resumePos % 60);
      const timeStr = `${m}:${s < 10 ? '0' : ''}${s}`;
      toast.success(`Resumed playback from ${timeStr}`, { id: `resume-${lesson.id}` });
    } else {
      // 4. Lock engine even if resume was skipped (validation failed / position near start or end)
      hasResumedLessonIdRef.current = lesson.id;
      if (session) session.setResumeState('RESUME_LOCKED', 0);
    }
  }, []);

  return {
    hasResumedLessonIdRef,
    attemptResume,
  };
}
