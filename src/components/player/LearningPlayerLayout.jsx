"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LearningHeader from './LearningHeader';
import PlayerContainer from './PlayerContainer';
import LessonNavigation from './LessonNavigation';
import PlayerTabs from './PlayerTabs';
import LessonSidebar from './LessonSidebar';
import courseApi from '@/libs/courseApi';
import { playerDebug } from '@/libs/playerDebug';
import { mergeProgressRecord } from '@/libs/playbackSync';
import toast from 'react-hot-toast';
import '@/assets/css/learning-player.scss';
import { CommunicationProvider } from '@/communication/CommunicationStore';

import CompletionModal from './CompletionModal';

export default function LearningPlayerLayout({ playerSession: initialSession }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePlayerTab, setActivePlayerTab] = useState('overview');
  const [sessionData, setSessionData] = useState(initialSession);
  const [isBookmarked, setIsBookmarked] = useState(initialSession?.current_lesson?.is_bookmarked ?? false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [modalDismissed, setModalDismissed] = useState(false);
  const playerCallbacksRef = useRef(null);

  // Monotonic server-response protection (Phase 9): tracks the highest position
  // applied per lesson so stale / out-of-order responses can never downgrade
  // playback state. The player is authoritative locally; responses persist only.
  const lastAppliedServerPosRef = useRef({});

  // Phase 3 instrumentation
  const prevLessonRef = useRef(null);

  useEffect(() => {
    setSessionData(initialSession);
    setIsBookmarked(initialSession?.current_lesson?.is_bookmarked ?? false);

    if (initialSession?.current_lesson?.id) {
      courseApi.recordRecentView(initialSession.current_lesson.id).catch(() => {});
    }

    if (initialSession?.completion_summary?.percentage >= 100 && !modalDismissed) {
      setShowCompletionModal(true);
    }
  }, [initialSession, modalDismissed]);

  const handleToggleBookmark = useCallback(async () => {
    const activeLessonId = sessionData?.current_lesson?.id;
    if (!activeLessonId) return;
    try {
      const res = await courseApi.toggleBookmark(activeLessonId);
      const data = res.data?.data || res.data;
      const newStatus = data?.is_bookmarked ?? !isBookmarked;
      setIsBookmarked(newStatus);
      toast.success(newStatus ? "Lesson bookmarked" : "Bookmark removed");
    } catch (err) {
      toast.error("Failed to update bookmark");
    }
  }, [sessionData?.current_lesson?.id, isBookmarked]);

  const handleRegisterPlayerCallbacks = useCallback((callbacks) => {
    playerCallbacksRef.current = callbacks;
  }, []);

  // Phase 3 — lesson object identity: log every recreation + changed fields.
  useEffect(() => {
    const lessonObj = sessionData?.current_lesson || null;
    const prev = prevLessonRef.current;
    prevLessonRef.current = lessonObj;
    if (prev && lessonObj && prev !== lessonObj) {
      const changedFields = ['id', 'title', 'last_position_seconds', 'percentage_watched', 'watched_seconds', 'status', 'is_completed']
        .filter((f) => prev[f] !== lessonObj[f]);
      playerDebug.lessonIdentity({ lessonId: lessonObj.id, prevRef: prev, nextRef: lessonObj, changedFields });
    }
  }, [sessionData?.current_lesson]);

  const handleGetCurrentTime = useCallback(() => {
    return playerCallbacksRef.current?.getCurrentTime ? playerCallbacksRef.current.getCurrentTime() : 0;
  }, []);

  const handleSeek = useCallback((seconds) => {
    if (playerCallbacksRef.current?.seekTo) {
      playerCallbacksRef.current.seekTo(seconds);
    }
  }, []);

  const handleProgressUpdated = useCallback((updatedProgressRecord, lessonId, forceStatus = false) => {
    if (!updatedProgressRecord) return;

    // Monotonic position validation (Phase 9): never allow stale server state to
    // move playback backward. Only newer progress is accepted; a stale response
    // may still carry authoritative completion status but never a position.
    const key = String(lessonId);
    const prevApplied = lastAppliedServerPosRef.current[key] ?? 0;
    const incomingPos = Math.max(0, Number(updatedProgressRecord?.last_position_seconds ?? 0));
    const isStale = !forceStatus && incomingPos < prevApplied;
    if (!isStale) {
      lastAppliedServerPosRef.current[key] = Math.max(prevApplied, incomingPos);
    }
    playerDebug.progressResponse({
      lessonId,
      returnedPosition: incomingPos,
      status: updatedProgressRecord?.status,
      percentage: updatedProgressRecord?.percentage_watched,
      incomingPosition: incomingPos,
      stale: isStale,
    });

    setSessionData((prev) => {
      if (!prev) return prev;

      // Update lesson in sections array (monotonic merge per lesson)
      const updatedSections = (prev.sections || []).map((sec) => ({
        ...sec,
        lessons: (sec.lessons || []).map((l) => {
          if (Number(l.id) === Number(lessonId)) {
            return mergeProgressRecord(l, updatedProgressRecord, prevApplied, { forceStatus }).merged;
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

      if (percentage >= 100 && !modalDismissed) {
        setShowCompletionModal(true);
      }

      const isCurrentLessonTarget = Number(prev.current_lesson?.id) === Number(lessonId);
      const updatedCurrentLesson = isCurrentLessonTarget
        ? mergeProgressRecord(prev.current_lesson, updatedProgressRecord, prevApplied, { forceStatus }).merged
        : prev.current_lesson;

      return {
        ...prev,
        current_lesson: updatedCurrentLesson,
        sections: updatedSections,
        completion_summary: {
          ...prev.completion_summary,
          completed_count: completed,
          total_lessons: total,
          percentage: percentage,
        },
      };
    });
  }, [modalDismissed]);

  const handleToggleManualCompletion = useCallback(async () => {
    const activeLessonId = sessionData?.current_lesson?.id;
    if (!activeLessonId) return;
    try {
      const res = await courseApi.toggleLessonCompletion(activeLessonId);
      const record = res.data?.data || res.data;
      if (record) {
        // forceStatus: the toggle must be able to reset a lesson, so completion
        // status is applied exactly (not sticky) for this response.
        handleProgressUpdated(record, activeLessonId, true);
        const isComp = record.status === 'completed';
        toast.success(isComp ? "Marked lesson as completed!" : "Lesson completion reset");
      }
    } catch (err) {
      toast.error("Failed to toggle completion");
    }
  }, [sessionData?.current_lesson?.id, handleProgressUpdated]);

  const handleNavigate = useCallback((targetLesson) => {
    const courseSlug = sessionData?.course?.slug;
    if (targetLesson && courseSlug) {
      router.push(`/course/${courseSlug}/learn/${targetLesson.id}`);
    }
  }, [sessionData?.course?.slug, router]);

  // All hooks above must run unconditionally — this guard may only come after them.
  const {
    course,
    sections,
    current_lesson,
    next_lesson,
    previous_lesson,
    permissions,
    enrollment,
    completion_summary
  } = sessionData || {};

  const handleToggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);

  const handleLeaveReview = useCallback(() => setActivePlayerTab('reviews'), []);

  if (!sessionData) return null;

  return (
    <CommunicationProvider courseId={course?.id} lessonId={current_lesson?.id}>
      <div className="LearningPlayerRoot">
        {/* Celebration Modal when Course is 100% Completed */}
        {showCompletionModal && (
          <CompletionModal
            course={course}
            onClose={() => {
              setShowCompletionModal(false);
              setModalDismissed(true);
            }}
          />
        )}

        {/* 1. Top Header with Prev/Next Navigation & Bookmark */}
        <LearningHeader
          courseTitle={course?.title}
          lessonTitle={current_lesson?.title}
          courseSlug={course?.slug}
          previousLesson={previous_lesson}
          nextLesson={next_lesson}
          onNavigate={handleNavigate}
          completionSummary={completion_summary}
          onToggleSidebar={handleToggleSidebar}
          sidebarOpen={sidebarOpen}
          isBookmarked={isBookmarked}
          onToggleBookmark={handleToggleBookmark}
          isLessonCompleted={current_lesson?.is_completed}
          onToggleCompletion={handleToggleManualCompletion}
          onLeaveReview={handleLeaveReview}
        />

        {/* 2. Main Player Body (Video + Tabs on Left, Course Sidebar on Right) */}
        <div className="PlayerBody">
          <main className="MainContentArea">
            {/* Video Player Container */}
            <PlayerContainer
              lesson={current_lesson}
              nextLesson={next_lesson}
              previousLesson={previous_lesson}
              onNavigate={handleNavigate}
              permissions={permissions}
              courseSlug={course?.slug}
              onProgressUpdated={handleProgressUpdated}
              onRegisterPlayerCallbacks={handleRegisterPlayerCallbacks}
            />

            {/* Overview, Notes, Resources & Questions & Discussion Tabs */}
            <PlayerTabs
              course={course}
              sections={sections}
              currentLesson={current_lesson}
              getCurrentTime={handleGetCurrentTime}
              onSeek={handleSeek}
              completionSummary={completion_summary}
              activeTab={activePlayerTab}
              onTabChange={setActivePlayerTab}
            />
          </main>

          {/* Course Chapter Sidebar */}
          <LessonSidebar
            sections={sections}
            currentLessonId={current_lesson?.id}
            courseSlug={course?.slug}
            isEnrolled={enrollment?.is_enrolled}
            isOpen={sidebarOpen}
            onToggleSidebar={handleToggleSidebar}
          />
        </div>
      </div>
    </CommunicationProvider>
  );
}
