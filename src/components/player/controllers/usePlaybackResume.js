"use client";

import { useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

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
    if (!videoRef.current) return;
    const vidDur = videoRef.current.duration || 0;
    if (typeof setDuration === 'function') {
      setDuration(vidDur);
    }
    videoRef.current.playbackRate = playbackSpeed;

    // Apply any pending user seek first (user intent takes precedence over resume)
    if (typeof applyPendingSeek === 'function') {
      const appliedPending = applyPendingSeek();
      if (appliedPending) return;
    }

    // Auto-Resume playback ONLY ONCE during initial lesson load
    const resumePos = lesson?.last_position_seconds || 0;
    const session = playbackSessionRef.current;

    if (
      resumePos > 5 &&
      session &&
      !session.resumed &&
      hasResumedLessonIdRef.current !== lesson?.id &&
      vidDur > 0 &&
      resumePos < vidDur - 5 &&
      (videoRef.current.currentTime || 0) < resumePos - 1
    ) {
      hasResumedLessonIdRef.current = lesson?.id;
      if (typeof applySeek === 'function') {
        applySeek(resumePos, 'resume');
      }
      if (typeof setCurrentTime === 'function') {
        setCurrentTime(resumePos);
      }
      const m = Math.floor(resumePos / 60);
      const s = Math.floor(resumePos % 60);
      const timeStr = `${m}:${s < 10 ? '0' : ''}${s}`;
      toast.success(`Resumed playback from ${timeStr}`, { id: `resume-${lesson?.id}` });
    }
  }, []);

  return {
    hasResumedLessonIdRef,
    attemptResume,
  };
}
