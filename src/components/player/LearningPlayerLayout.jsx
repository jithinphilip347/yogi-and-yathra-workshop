"use client";

import React, { useEffect, useState } from 'react';
import LearningHeader from './LearningHeader';
import PlayerContainer from './PlayerContainer';
import LessonNavigation from './LessonNavigation';
import PlayerTabs from './PlayerTabs';
import LessonSidebar from './LessonSidebar';
import '@/assets/css/learning-player.scss';

export default function LearningPlayerLayout({ playerSession: initialSession }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionData, setSessionData] = useState(initialSession);

  useEffect(() => {
    setSessionData(initialSession);
  }, [initialSession]);

  if (!sessionData) return null;

  const {
    course,
    sections,
    current_lesson,
    next_lesson,
    previous_lesson,
    permissions,
    enrollment,
    completion_summary
  } = sessionData;

  const handleProgressUpdated = (updatedProgressRecord, lessonId) => {
    if (!updatedProgressRecord) return;

    setSessionData((prev) => {
      if (!prev) return prev;

      // Update lesson in sections array if completed
      const updatedSections = (prev.sections || []).map((sec) => ({
        ...sec,
        lessons: (sec.lessons || []).map((l) => {
          if (Number(l.id) === Number(lessonId)) {
            return {
              ...l,
              is_completed: updatedProgressRecord.status === 'completed' || l.is_completed,
              status: updatedProgressRecord.status || l.status,
              last_position_seconds: updatedProgressRecord.last_position_seconds ?? l.last_position_seconds,
            };
          }
          return l;
        }),
      }));

      // Calculate total & completed lessons for updated header summary
      let total = 0;
      let completed = 0;
      updatedSections.forEach((sec) => {
        (sec.lessons || []).forEach((l) => {
          total++;
          if (l.is_completed) completed++;
        });
      });

      const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

      return {
        ...prev,
        sections: updatedSections,
        completion_summary: {
          ...prev.completion_summary,
          completed_count: completed,
          total_lessons: total,
          percentage: percentage,
        },
      };
    });
  };

  return (
    <div className="LearningPlayerRoot">
      {/* 1. Top Header */}
      <LearningHeader
        courseTitle={course?.title}
        lessonTitle={current_lesson?.title}
        courseSlug={course?.slug}
        completionSummary={completion_summary}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />

      {/* 2. Main Player Body (Video + Tabs on Left, Course Sidebar on Right) */}
      <div className="PlayerBody">
        <main className="MainContentArea">
          {/* Video Player Container */}
          <PlayerContainer
            lesson={current_lesson}
            nextLesson={next_lesson}
            permissions={permissions}
            courseSlug={course?.slug}
            onProgressUpdated={handleProgressUpdated}
          />

          {/* Lesson Navigation Bar */}
          <LessonNavigation
            previousLesson={previous_lesson}
            nextLesson={next_lesson}
            courseSlug={course?.slug}
          />

          {/* Overview & Resources Tabs */}
          <PlayerTabs
            course={course}
            currentLesson={current_lesson}
          />
        </main>

        {/* Course Chapter Sidebar */}
        <LessonSidebar
          sections={sections}
          currentLessonId={current_lesson?.id}
          courseSlug={course?.slug}
          isEnrolled={enrollment?.is_enrolled}
          isOpen={sidebarOpen}
        />
      </div>
    </div>
  );
}
