"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import courseApi from '@/libs/courseApi';
import { playerSessionCache, mergeLightSession } from '@/libs/playerSessionCache';
import { store } from '../../../../../../store';
import LearningPlayerLayout from '@/components/player/LearningPlayerLayout';

export default function CoursePlayerPage() {
  const params = useParams();
  const router = useRouter();

  const slug = params?.slug;
  const lessonId = params?.lessonId;

  const [playerSession, setPlayerSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const fetchPlayerSession = async (signal) => {
      setLoading(true);

      // The cache key is scoped to the current authenticated user so a cached
      // session from a previous user can never be reused after logout/login.
      const userId = store.getState().auth.user?.id ?? null;
      const cached = playerSessionCache.get(slug, userId);
      const requestedLessonId = lessonId ? String(lessonId) : null;
      const cachedLessonId = cached?.current_lesson?.id != null ? String(cached.current_lesson.id) : null;

      // The course structure is stable while navigating between lessons. When
      // this course's session is already cached and only the lesson changed,
      // fetch the light current-lesson slice and merge it into the cached
      // session instead of re-fetching the entire player payload.
      if (cached?.course && requestedLessonId && cachedLessonId && cachedLessonId !== requestedLessonId) {
        try {
          const res = await courseApi.getCoursePlayer(slug, lessonId, { light: true, signal });
          const lightData = res.data?.data || res.data;

          if (signal.aborted) return;

          if (lightData?.current_lesson) {
            const merged = mergeLightSession(cached, lightData);

            // Write the merged session back so the cache is the single source
            // of truth even if the layout never re-renders with the result.
            playerSessionCache.set(slug, merged, userId);
            setPlayerSession(merged);
            setError(null);
            return;
          }
        } catch (lightErr) {
          // Fall through to a full session fetch — this preserves the original
          // error semantics (e.g. the student lost access to the course).
          if (signal.aborted) return;
        }
      }

      // Full session fetch (initial load / direct lesson URL / cache miss).
      const res = await courseApi.getCoursePlayer(slug, lessonId, { signal });
      const data = res.data?.data || res.data;

      if (signal.aborted) return;

      if (!data || !data.course) {
        setError('Course or lesson not found.');
        return;
      }

      playerSessionCache.set(slug, data, userId);
      setPlayerSession(data);
      setError(null);
    };

    if (slug) {
      const controller = new AbortController();

      // Abort the previous in-flight session request so a rapid lesson
      // navigation can never be overwritten by a stale response.
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = controller;

      fetchPlayerSession(controller.signal)
        .catch((err) => {
          if (controller.signal.aborted || err?.name === 'CanceledError' || err?.name === 'AbortError') return;
          console.error('Failed to load course player session:', err);
          setError('Unable to load course player. Please check your network or login session.');
        })
        .finally(() => {
          // Only the latest request may clear the loading state.
          if (abortRef.current === controller) {
            setLoading(false);
          }
        });

      return () => {
        if (abortRef.current === controller) {
          abortRef.current = null;
          controller.abort();
        }
      };
    }
  }, [slug, lessonId]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0b0f19',
        color: '#9ca3af'
      }}>
        <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>Loading Course Player...</div>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Preparing your learning session</p>
      </div>
    );
  }

  if (error || !playerSession) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0b0f19',
        color: '#ef4444',
        padding: '24px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '12px', color: '#f3f4f6' }}>
          Player Loading Error
        </h2>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px', maxWidth: '400px' }}>
          {error || 'Unable to access the requested course player.'}
        </p>
        <button
          onClick={() => router.push(`/course/${slug}`)}
          style={{
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Return to Course Details
        </button>
      </div>
    );
  }

  return <LearningPlayerLayout playerSession={playerSession} />;
}
