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
    <div className="LessonNavigation">
      <button
        className="NavBtn"
        disabled={!previousLesson}
        onClick={() => handleNavigate(previousLesson)}
        title={previousLesson ? `Previous: ${previousLesson.title}` : 'No Previous Lesson'}
      >
        <FiChevronLeft />
        <span>{previousLesson ? `Prev: ${previousLesson.title}` : 'Previous Lesson'}</span>
      </button>

      <button
        className="NavBtn"
        onClick={() => router.push(`/course/${courseSlug || ''}`)}
      >
        <FiGrid />
        <span>Course Overview</span>
      </button>

      <button
        className="NavBtn PrimaryNavBtn"
        disabled={!nextLesson}
        onClick={() => handleNavigate(nextLesson)}
        title={nextLesson ? `Next: ${nextLesson.title}` : 'No Next Lesson'}
        style={{ backgroundColor: nextLesson ? '#ff7a1a' : undefined, borderColor: nextLesson ? '#ff7a1a' : undefined, color: nextLesson ? '#fff' : undefined }}
      >
        <span>{nextLesson ? `Next: ${nextLesson.title}` : 'Next Lesson'}</span>
        <FiChevronRight />
      </button>
    </div>
  );
}
