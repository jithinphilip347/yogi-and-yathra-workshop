"use client";

import React from 'react';
import LessonAccordion from './LessonAccordion';
import { FiX } from 'react-icons/fi';

export default React.memo(function LessonSidebar({
  sections = [],
  currentLessonId,
  courseSlug,
  isEnrolled,
  isOpen,
  onToggleSidebar
}) {
  const totalLessons = sections.reduce(
    (acc, sec) => acc + (Array.isArray(sec.lessons) ? sec.lessons.length : 0),
    0
  );

  return (
    <aside className={`LessonSidebar ${!isOpen ? 'Collapsed' : ''}`}>
      <div className="SidebarHeader" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3>Course content</h3>
        <button 
          className="CloseSidebarBtn" 
          onClick={onToggleSidebar}
          title="Close Sidebar"
          style={{
            background: 'none',
            border: 'none',
            color: '#1c1d1f',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            borderRadius: '4px',
            transition: 'background 0.2s'
          }}
        >
          <FiX />
        </button>
      </div>

      <div className="SidebarScroll">
        {sections.map((section) => (
          <LessonAccordion
            key={section.id}
            section={section}
            currentLessonId={currentLessonId}
            courseSlug={courseSlug}
            isEnrolled={isEnrolled}
          />
        ))}
      </div>
    </aside>
  );
});
