"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiSidebar, FiChevronRight } from 'react-icons/fi';

export default function LearningHeader({
  courseTitle,
  lessonTitle,
  courseSlug,
  completionSummary,
  onToggleSidebar,
  sidebarOpen
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
        
        <div className="BreadcrumbsNav" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#9ca3af' }}>
          <span style={{ cursor: 'pointer', hover: { color: '#fff' } }} onClick={() => router.push('/course')}>Courses</span>
          <FiChevronRight style={{ fontSize: '12px', color: '#4b5563' }} />
          <span style={{ color: '#d1d5db', fontWeight: '500' }}>{courseTitle || 'Course'}</span>
          {lessonTitle && (
            <>
              <FiChevronRight style={{ fontSize: '12px', color: '#4b5563' }} />
              <span style={{ color: '#ff7a1a', fontWeight: '600' }}>{lessonTitle}</span>
            </>
          )}
        </div>
      </div>

      <div className="HeaderRight">
        <div className="ProgressPlaceholder" style={{ minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px 14px', backgroundColor: '#161b22', borderRadius: '8px', border: '1px solid #21262d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '12px', fontWeight: '600', color: '#10b981' }}>
            <span>{percentage}% Completed</span>
            <span style={{ color: '#8b949e' }}>{completedCount}/{totalLessons} Lessons</span>
          </div>
          <div style={{ width: '100%', height: '5px', backgroundColor: '#21262d', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.3s ease' }} />
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
