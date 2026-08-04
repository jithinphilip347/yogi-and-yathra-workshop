"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiSidebar, FiChevronLeft, FiChevronRight, FiBookmark } from 'react-icons/fi';

export default function LearningHeader({
  courseTitle,
  lessonTitle,
  courseSlug,
  previousLesson,
  nextLesson,
  onNavigate,
  completionSummary,
  onToggleSidebar,
  sidebarOpen,
  isBookmarked,
  onToggleBookmark
}) {
  const router = useRouter();

  const handleBack = () => {
    if (courseSlug) {
      router.push(`/course/${courseSlug}`);
    } else {
      router.push('/auth/profile');
    }
  };

  const percentage = completionSummary?.percentage ?? 0;
  const completedCount = completionSummary?.completed_count ?? 0;
  const totalLessons = completionSummary?.total_lessons ?? 0;

  return (
    <header className="LearningHeader">
      <div className="HeaderLeft">
        <button className="BackBtn" onClick={handleBack} title="Back to Course">
          <FiArrowLeft />
          <span>Back to Course</span>
        </button>
        
        <div className="BreadcrumbsNav" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#64748b' }}>
          <span className="BreadcrumbLink" onClick={() => router.push('/course')}>Courses</span>
          <FiChevronRight style={{ fontSize: '12px', color: '#94a3b8' }} />
          <span className="BreadcrumbCurrent">{courseTitle || 'Course'}</span>
          {lessonTitle && (
            <>
              <FiChevronRight style={{ fontSize: '12px', color: '#94a3b8' }} />
              <span className="BreadcrumbActiveLesson">{lessonTitle}</span>
            </>
          )}
        </div>
      </div>

      <div className="HeaderRight" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Bookmark Toggle Button */}
        <button
          onClick={onToggleBookmark}
          title={isBookmarked ? "Remove Bookmark" : "Bookmark Lesson"}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            border: isBookmarked ? '1px solid var(--primaryColor, #874429)' : '1px solid #cbd5e1',
            backgroundColor: isBookmarked ? 'rgba(135, 68, 41, 0.1)' : '#ffffff',
            color: isBookmarked ? 'var(--primaryColor, #874429)' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '17px',
            transition: 'all 0.2s ease'
          }}
        >
          <FiBookmark style={{ fill: isBookmarked ? 'currentColor' : 'none' }} />
        </button>

        {/* Previous & Next Icon Navigation */}
        <div className="HeaderLessonNav" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="NavIconHeaderBtn"
            disabled={!previousLesson}
            onClick={() => onNavigate && onNavigate(previousLesson)}
            title={previousLesson ? `Previous: ${previousLesson.title}` : 'No Previous Lesson'}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: previousLesson ? '#334155' : '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: previousLesson ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              fontSize: '18px'
            }}
          >
            <FiChevronLeft />
          </button>

          <button
            className="NavIconHeaderBtn Primary"
            disabled={!nextLesson}
            onClick={() => onNavigate && onNavigate(nextLesson)}
            title={nextLesson ? `Next: ${nextLesson.title}` : 'No Next Lesson'}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              border: nextLesson ? '1px solid var(--primaryColor, #874429)' : '1px solid #cbd5e1',
              backgroundColor: nextLesson ? 'var(--primaryColor, #874429)' : '#f8fafc',
              color: nextLesson ? '#ffffff' : '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: nextLesson ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              fontSize: '18px',
              boxShadow: nextLesson ? '0 2px 6px rgba(135, 68, 41, 0.2)' : 'none'
            }}
          >
            <FiChevronRight />
          </button>
        </div>

        {/* Progress summary pill */}
        <div className="ProgressPlaceholder" style={{ minWidth: '190px', display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '12px', fontWeight: '600', color: 'var(--primaryColor, #874429)' }}>
            <span>{percentage}% Completed</span>
            <span style={{ color: '#64748b' }}>{completedCount}/{totalLessons} Lessons</span>
          </div>
          <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: 'var(--primaryColor, #874429)', transition: 'width 0.3s ease' }} />
          </div>
        </div>

        <button
          className="SidebarToggleBtn"
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        >
          <FiSidebar />
        </button>
      </div>
    </header>
  );
}
