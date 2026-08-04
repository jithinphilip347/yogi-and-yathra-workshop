"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiSidebar } from 'react-icons/fi';

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
        <div className="CourseTitleGroup">
          <h1 className="CourseName">{courseTitle || 'Course Player'}</h1>
          <p className="LessonName">{lessonTitle || 'Select a Lesson'}</p>
        </div>
      </div>

      <div className="HeaderRight">
        <div className="ProgressPlaceholder" style={{ minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '12px', fontWeight: '600', color: '#10b981' }}>
            <span>{percentage}% Complete</span>
            <span style={{ color: '#9ca3af' }}>{completedCount}/{totalLessons} Lessons</span>
          </div>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#1f2937', borderRadius: '2px', overflow: 'hidden' }}>
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
