"use client";

import { useCallback } from 'react';
import courseApi from '@/libs/courseApi';

export function useAnalyticsController({ lessonId }) {
  const logAnalytics = useCallback((eventName, payload = {}) => {
    if (!lessonId) return;
    courseApi.logPlayerEvent(eventName, lessonId, payload).catch(() => {});
  }, [lessonId]);

  return {
    logAnalytics,
  };
}
