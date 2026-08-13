"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LearningHeader from './LearningHeader';
import PlayerContainer from './PlayerContainer';
import PlayerTabs from './PlayerTabs';
import LessonSidebar from './LessonSidebar';
import courseApi from '@/libs/courseApi';
import { playerSessionCache } from '@/libs/playerSessionCache';
import { playerDebug } from '@/libs/playerDebug';
import { mergeProgressRecord } from '@/libs/playbackSync';
import { store } from '../../../store';
import toast from 'react-hot-toast';
import '@/assets/css/learning-player.scss';
import { CommunicationProvider } from '@/communication/CommunicationStore';

import CompletionModal from './CompletionModal';

// Completion modal dismissal is persisted per course so a closed modal is not
// shown again for 24 hours (instead of popping up on every visit to a finished
// course).
const COMPLETION_MODAL_STORAGE_PREFIX = 'completion-modal-dismissed-at';
const COMPLETION_MODAL_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

const getCompletionModalDismissedAt = (courseId) => {
  if (typeof window === 'undefined' || !courseId) return 0;
  try {
    const raw = window.localStorage.getItem(`${COMPLETION_MODAL_STORAGE_PREFIX}:${courseId}`);
    const ts = raw ? Number(raw) : 0;
    return Number.isFinite(ts) && ts > 0 ? ts : 0;
  } catch {
    return 0;
  }
};

const setCompletionModalDismissedAt = (courseId) => {
  if (typeof window === 'undefined' || !courseId) return;
  try {
    window.localStorage.setItem(`${COMPLETION_MODAL_STORAGE_PREFIX}:${courseId}`, String(Date.now()));
  } catch {
    // Ignore storage errors (private mode / quota) — modal may show again.
  }
};

const isCompletionModalDismissed = (courseId) => {
  const dismissedAt = getCompletionModalDismissedAt(courseId);
  return dismissedAt > 0 && Date.now() - dismissedAt < COMPLETION_MODAL_COOLDOWN_MS;
};

export default function LearningPlayerLayout({ playerSession: initialSession }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePlayerTab, setActivePlayerTab] = useState('overview');
  const [sessionData, setSessionData] = useState(initialSession);
  const [isBookmarked, setIsBookmarked] = useState(initialSession?.current_lesson?.is_bookmarked ?? false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const courseIdRef = useRef(initialSession?.course?.id);
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
    courseIdRef.current = initialSession?.course?.id;

    if (initialSession?.current_lesson?.id) {
      courseApi.recordRecentView(initialSession.current_lesson.id).catch(() => {});
    }

    // Only celebrate on load if the student hasn't dismissed it within 24h.
    if (
      initialSession?.completion_summary?.percentage >= 100 &&
      !isCompletionModalDismissed(courseIdRef.current)
    ) {
      setShowCompletionModal(true);
    }
  }, [initialSession]);

  // Keep the session-scoped cache in sync so lesson navigation can reuse the
  // course structure (including live progress updates) without re-fetching the
  // entire player session. Single source of truth: the latest sessionData.
  // The cache is keyed by the current user so a session can never leak across
  // authenticated users (belt-and-braces on top of logout/401 cache clearing).
  useEffect(() => {
    if (sessionData?.course?.slug) {
      const userId = store.getState().auth.user?.id ?? null;
      playerSessionCache.set(sessionData.course.slug, sessionData, userId);
    }
  }, [sessionData]);

  // Fresh certificate eligibility (e.g. fetched once when completion crosses
  // 100%) is written back into the session state so the Overview tab, the
  // header and the session cache all observe the unlocked certificate.
  const handleCertificateEligibilityUpdate = useCallback((eligibility) => {
    if (!eligibility) return;
    setSessionData((prev) => (prev ? { ...prev, certificate_eligibility: eligibility } : prev));
  }, []);

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

      if (percentage >= 100 && !isCompletionModalDismissed(courseIdRef.current)) {
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
  }, []);

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

  // The ControlBar notes shortcut opens the Notes tab below the player.
  const handleOpenNotes = useCallback(() => setActivePlayerTab('notes'), []);

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
              // Persist the dismissal so the modal is not shown again for 24h.
              setCompletionModalDismissedAt(courseIdRef.current);
            }}
            onClaimSuccess={(certificate) => {
              // A claim from the completion modal must also reach the session
              // (and therefore the cache) so the Overview tab never shows a
              // stale "locked" certificate state.
              handleCertificateEligibilityUpdate({
                ...(sessionData?.certificate_eligibility || {}),
                is_claimed: true,
                certificate,
              });
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
              onOpenNotes={handleOpenNotes}
            />

            {/* Overview, Notes, Resources & Questions & Discussion Tabs */}
            <PlayerTabs
              course={course}
              sections={sections}
              currentLesson={current_lesson}
              getCurrentTime={handleGetCurrentTime}
              onSeek={handleSeek}
              completionSummary={completion_summary}
              certificateEligibility={sessionData?.certificate_eligibility}
              onEligibilityUpdate={handleCertificateEligibilityUpdate}
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
