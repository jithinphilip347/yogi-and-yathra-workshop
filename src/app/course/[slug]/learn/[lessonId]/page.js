"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import courseApi from '@/libs/courseApi';
import LearningPlayerLayout from '@/components/player/LearningPlayerLayout';

export default function CoursePlayerPage() {
  const params = useParams();
  const router = useRouter();

  const slug = params?.slug;
  const lessonId = params?.lessonId;

  const [playerSession, setPlayerSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayerSession = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch player payload by slug/course ID and target lesson ID
        const res = await courseApi.getCoursePlayer(slug, lessonId);
        const data = res.data?.data || res.data;

        if (!data || !data.course) {
          setError('Course or lesson not found.');
          return;
        }

        setPlayerSession(data);
      } catch (err) {
        console.error('Failed to load course player session:', err);
        setError('Unable to load course player. Please check your network or login session.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPlayerSession();
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
