"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiChevronDown, FiChevronUp, FiPlay, FiFolder, FiLock, FiCheck } from 'react-icons/fi';

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

  // Calculate approximate total section duration
  const totalMinutes = lessons.reduce((acc, l) => {
    if (!l.duration) return acc;
    const clean = l.duration.toLowerCase().replace('min', '').trim();
    const parsed = parseInt(clean);
    return acc + (isNaN(parsed) ? 10 : parsed);
  }, 0);

  return (
    <div className="ChapterAccordion">
      <button
        className={`AccordionHeader ${isOpen ? 'Expanded' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', paddingRight: '12px' }}>
          <span className="TitleText">{section.title}</span>
          <div className="AccordionMeta">
            <span>{completedInSec} / {secTotal}</span>
            <span className="MetaSeparator">|</span>
            <span>{totalMinutes}min</span>
          </div>
        </div>
        <span className="AccordionChevron">
          {isOpen ? <FiChevronUp /> : <FiChevronDown />}
        </span>
      </button>

      {isOpen && (
        <div className="LessonList">
          {lessons.map((lesson) => {
            const isActive = Number(currentLessonId) === Number(lesson.id);
            const isLocked = lesson.is_locked;
            const isCompleted = lesson.is_completed;

            return (
              <div
                key={lesson.id}
                className={`LessonItem ${isActive ? 'Active' : ''}`}
                onClick={() => handleLessonClick(lesson)}
              >
                {/* Square checkbox styling exactly like Udemy */}
                <div className="LessonCheckboxContainer">
                  <div className={`CustomCheckbox ${isCompleted ? 'Checked' : ''}`}>
                    {isCompleted && <FiCheck className="CheckMark" />}
                  </div>
                </div>

                <div className="LessonInfoCol">
                  <span className="LessonTitle">
                    {lesson.title}
                  </span>
                  
                  <div className="LessonMetaRow">
                    <FiPlay className="MetaIcon" />
                    <span>{lesson.duration || '10min'}</span>
                  </div>
                </div>

                <div className="LessonItemRight">
                  {lesson.resources && lesson.resources.length > 0 && (
                    <button className="ResourcesPill" onClick={(e) => {
                      e.stopPropagation();
                      // Navigate to resources tab or toggle sub-dropdown
                      router.push(`/course/${courseSlug}/learn/${lesson.id}?tab=resources`);
                    }}>
                      <FiFolder style={{ marginRight: '4px' }} />
                      Resources
                    </button>
                  )}
                  {isLocked && !isCompleted && (
                    <span className="LockIcon" title="Locked">
                      <FiLock />
                    </span>
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
