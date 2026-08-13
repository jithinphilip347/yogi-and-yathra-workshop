"use client";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import courseApi from "@/libs/courseApi";

/**
 * Course Details CTA state — centralizes the "does this student have valid
 * access to this course, and how far along are they?" decision so the page
 * never scatters purchase/progress conditions through JSX.
 *
 * Source of truth (reused, not duplicated):
 *  - Access:  enrollments/user/{id} (authoritative active enrollment; covers
 *             direct purchase, admin/manual enrollment, and any mechanism that
 *             creates an enrollment). Failed/pending/refunded/cancelled
 *             enrollments are NOT "active" and therefore grant no access.
 *  - Progress: student/continue-learning (the same feed the profile Dashboard
 *             uses) which carries percentage, resume lesson and last position.
 *
 * Returns:
 *  - ctaState: "loading" | "purchase" | "watch-now" | "continue-watching" | "watch-again"
 *  - watchPath: existing Course Player route (resume-aware)
 *  - isAuthenticated / hasAccess: raw flags for callers that need them
 */
export function useCourseAccess(course) {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.id;
  const courseId = course?.id;

  // 1. Access — authoritative active enrollment for this course.
  const enrollmentsQuery = useQuery({
    queryKey: ["course-access", userId, courseId],
    queryFn: async () => {
      const res = await courseApi.userEnrollments(userId, "course");
      const list = res.data?.data || res.data || [];
      return list.some(
        (e) =>
          Number(e.enrollable_id) === Number(courseId) &&
          e.status === "active"
      );
    },
    enabled: !!userId && !!courseId,
    // Short staleness so returning to the page (e.g. after a payment) refreshes
    // the CTA automatically without a hard browser refresh.
    staleTime: 30_000,
  });

  const hasAccess = enrollmentsQuery.data === true;

  // 2. Progress — only fetched once we know the user has access.
  const resumeQuery = useQuery({
    queryKey: ["course-resume", userId, courseId],
    queryFn: async () => {
      const res = await courseApi.continueLearning();
      const list = res.data?.data || res.data || [];
      return (
        list.find((item) => Number(item.id) === Number(courseId)) || null
      );
    },
    enabled: !!userId && !!courseId && hasAccess,
    staleTime: 30_000,
  });

  const resumeItem = resumeQuery.data;

  // 3. Derived progress semantics (all server-provided).
  const progress = resumeItem?.progress ?? 0;
  const lastPosition = resumeItem?.last_position_seconds ?? 0;
  const completedCount = resumeItem?.completed_lessons ?? 0;
  const totalLessons = resumeItem?.total_lessons ?? 0;

  const hasStarted = !!resumeItem && (progress > 0 || lastPosition > 0);
  const isCompleted =
    !!resumeItem && totalLessons > 0 && completedCount >= totalLessons;

  // 4. Resume destination — existing Course Player route. The continue-learning
  //    feed already resolves the last active lesson; fall back to the course's
  //    first lesson (then the course page) only when no resume target exists.
  const firstLesson = course?.sections
    ?.find((s) => s.lessons?.length)
    ?.lessons?.[0];
  const resumeLessonId = resumeItem?.current_lesson_id ?? firstLesson?.id;
  const watchPath = course?.slug
    ? resumeLessonId
      ? `/course/${course.slug}/learn/${resumeLessonId}`
      : `/course/${course.slug}`
    : null;

  // 5. CTA state machine.
  //    While access/progress is still resolving we report "loading" so the page
  //    never flashes the purchase buttons at an already-enrolled student.
  const isLoading =
    !!userId &&
    (enrollmentsQuery.isLoading || (hasAccess && resumeQuery.isLoading));

  let ctaState = "purchase";
  if (isLoading) {
    ctaState = "loading";
  } else if (!!userId && hasAccess) {
    if (isCompleted) {
      // Completed courses must not read as "Continue Watching"; keep the same
      // player route (it already surfaces completion/certificate state).
      ctaState = "watch-again";
    } else if (hasStarted) {
      ctaState = "continue-watching";
    } else {
      ctaState = "watch-now";
    }
  }

  return {
    ctaState,
    watchPath,
    isAuthenticated: !!userId,
    hasAccess,
    isLoading,
  };
}
