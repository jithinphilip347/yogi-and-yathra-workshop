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
      >
        <FiChevronLeft />
        <span>Previous Lesson</span>
      </button>

      <button
        className="NavBtn"
        onClick={() => router.push(`/course/${courseSlug || ''}`)}
      >
        <FiGrid />
        <span>Course Overview</span>
      </button>

      <button
        className="NavBtn"
        disabled={!nextLesson}
        onClick={() => handleNavigate(nextLesson)}
      >
        <span>Next Lesson</span>
        <FiChevronRight />
      </button>
    </div>
  );
}
