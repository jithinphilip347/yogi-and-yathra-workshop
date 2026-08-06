"use client";

import { useCallback } from 'react';
import courseApi from '@/libs/courseApi';
import toast from 'react-hot-toast';

export function useCompletionController({ completionThreshold = 0.90 } = {}) {
  const isEligibleForAutoCompletion = useCallback((watchedSeconds, durationSeconds) => {
    if (!durationSeconds || durationSeconds <= 0) return false;
    return (watchedSeconds / durationSeconds) >= completionThreshold;
  }, [completionThreshold]);

  const toggleManualCompletion = useCallback(async (currentLesson, onProgressUpdated) => {
    if (!currentLesson?.id) return;
    try {
      const res = await courseApi.toggleLessonCompletion(currentLesson.id);
      const record = res.data?.data || res.data;
      if (record) {
        if (typeof onProgressUpdated === 'function') {
          onProgressUpdated(record, currentLesson.id, true);
        }
        const isComp = record.status === 'completed';
        toast.success(isComp ? "Marked lesson as completed!" : "Lesson completion reset");
      }
    } catch (err) {
      toast.error("Failed to toggle completion");
    }
  }, []);

  return {
    completionThreshold,
    isEligibleForAutoCompletion,
    toggleManualCompletion,
  };
}
