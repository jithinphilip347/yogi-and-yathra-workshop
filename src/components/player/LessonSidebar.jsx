"use client";

import React from 'react';
import LessonAccordion from './LessonAccordion';

export default React.memo(function LessonSidebar({
  sections = [],
  currentLessonId,
  courseSlug,
  isEnrolled,
  isOpen
}) {
  const totalLessons = sections.reduce(
    (acc, sec) => acc + (Array.isArray(sec.lessons) ? sec.lessons.length : 0),
    0
  );

  return (
    <aside className={`LessonSidebar ${!isOpen ? 'Collapsed' : ''}`}>
      <div className="SidebarHeader">
        <h3>Course Content</h3>
        <p>{sections.length} Chapters • {totalLessons} Lessons</p>
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
