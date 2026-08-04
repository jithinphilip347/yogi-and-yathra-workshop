"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiChevronDown, FiChevronUp, FiPlayCircle, FiTv, FiLock, FiCheckCircle } from 'react-icons/fi';

export default function LessonAccordion({
  section,
  currentLessonId,
  courseSlug,
  isEnrolled
}) {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();

  const lessons = Array.isArray(section.lessons) ? section.lessons : [];

  const handleLessonClick = (lesson) => {
    if (courseSlug) {
      router.push(`/course/${courseSlug}/learn/${lesson.id}`);
    }
  };

  const completedInSec = lessons.filter(l => l.is_completed).length;
  const secTotal = lessons.length;
  const secPercent = secTotal > 0 ? Math.round((completedInSec / secTotal) * 100) : 0;

  return (
    <div className="ChapterAccordion">
      <button
        className="AccordionHeader"
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="TitleText">{section.title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b' }}>
            <span>{completedInSec}/{secTotal} Completed</span>
            {secPercent > 0 && (
              <span style={{ fontWeight: '600', color: 'var(--primaryColor, #874429)' }}>
                ({secPercent}%)
              </span>
            )}
          </div>
        </div>
        {isOpen ? <FiChevronUp /> : <FiChevronDown />}
      </button>

      {isOpen && (
        <div className="LessonList">
          {lessons.map((lesson) => {
            const isActive = Number(currentLessonId) === Number(lesson.id);
            const isLocked = lesson.is_locked;
            const isCompleted = lesson.is_completed;
            const isYouTube = lesson.type === 'youtube';

            return (
              <div
                key={lesson.id}
                className={`LessonItem ${isActive ? 'Active' : ''}`}
                onClick={() => handleLessonClick(lesson)}
                style={{
                  borderLeft: isActive ? '3px solid var(--primaryColor, #874429)' : '3px solid transparent',
                  backgroundColor: isActive ? 'rgba(135, 68, 41, 0.08)' : 'transparent'
                }}
              >
                <div className="ItemLeft">
                  {isCompleted ? (
                    <FiCheckCircle className="TypeIcon" style={{ color: '#10b981' }} title="Completed" />
                  ) : isYouTube ? (
                    <FiTv className="TypeIcon" />
                  ) : (
                    <FiPlayCircle className="TypeIcon" />
                  )}
                  <span className="LessonTitle" style={{ textDecoration: isCompleted ? 'line-through' : 'none', opacity: isCompleted ? 0.8 : 1 }}>
                    {lesson.title}
                  </span>
                </div>

                <div className="ItemRight">
                  {isCompleted && (
                    <span className="Badge Completed" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                      Completed
                    </span>
                  )}
                  {lesson.is_preview && !isCompleted && (
                    <span className="Badge Preview">Preview</span>
                  )}
                  {isLocked && !isCompleted && (
                    <span className="Badge Locked" title="Locked - Enrollment Required">
                      <FiLock />
                    </span>
                  )}
                  {lesson.duration && (
                    <span className="Duration">{lesson.duration}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
