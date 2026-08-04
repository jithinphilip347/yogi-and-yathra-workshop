"use client";

import React from 'react';
import { FiChevronLeft, FiChevronRight, FiGrid } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function LessonNavigation({
  previousLesson,
  nextLesson,
  courseSlug
}) {
  const router = useRouter();

  const handleNavigate = (targetLesson) => {
    if (targetLesson && courseSlug) {
      router.push(`/course/${courseSlug}/learn/${targetLesson.id}`);
    }
  };

  return (
    <div className="LessonNavigation" style={{ justifyContent: 'space-between', padding: '12px 28px' }}>
      <button
        className="NavBtn IconNavBtn"
        disabled={!previousLesson}
        onClick={() => handleNavigate(previousLesson)}
        title={previousLesson ? `Previous: ${previousLesson.title}` : 'No Previous Lesson'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '600'
        }}
      >
        <FiChevronLeft style={{ fontSize: '18px' }} />
        <span>Prev</span>
      </button>

      <button
        className="NavBtn PrimaryNavBtn IconNavBtn"
        disabled={!nextLesson}
        onClick={() => handleNavigate(nextLesson)}
        title={nextLesson ? `Next: ${nextLesson.title}` : 'No Next Lesson'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 18px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '600',
          backgroundColor: nextLesson ? 'var(--primaryColor, #874429)' : undefined,
          borderColor: nextLesson ? 'var(--primaryColor, #874429)' : undefined,
          color: nextLesson ? '#ffffff' : undefined
        }}
      >
        <span>Next</span>
        <FiChevronRight style={{ fontSize: '18px' }} />
      </button>
    </div>
  );
}
