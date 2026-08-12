"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { reviewApi } from "@/services/reviewApi";

/**
 * Shared course-review logic consumed by BOTH the Course Details page and the
 * Course Player Reviews tab, so the two surfaces always use the same backend
 * business rules and never drift apart.
 *
 * - eligibility: { can_review, has_review, review, reason } resolved from the
 *   backend (purchase/enrollment enforced server-side).
 * - submit / update / remove: review mutations with ownership enforcement.
 */
export function useCourseReviews(courseId) {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadEligibility = useCallback(async () => {
    if (!courseId) {
      setEligibility(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await reviewApi.getEligibility("course", courseId);
      setEligibility(res.data?.data ?? res.data ?? null);
    } catch (err) {
      // 401s are handled globally by apiClient; other failures just leave the
      // review surface hidden rather than breaking the page.
      setEligibility(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadEligibility();
  }, [loadEligibility]);

  const submitReview = useCallback(
    async ({ rating, content, title }) => {
      if (!courseId) return null;
      setSubmitting(true);
      try {
        const res = await reviewApi.submitReview({
          target_type: "course",
          target_id: courseId,
          rating,
          content,
          title: title || undefined,
        });
        await loadEligibility();
        toast.success("Thank you for your feedback! Your review has been published.");
        return res.data?.data ?? res.data ?? null;
      } catch (err) {
        const message =
          err.response?.data?.message || "Failed to submit review. Please try again.";
        toast.error(message);
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [courseId, loadEligibility]
  );

  const updateReview = useCallback(
    async (reviewId, { rating, content, title }) => {
      if (!reviewId) return null;
      setSubmitting(true);
      try {
        const res = await reviewApi.updateReview(reviewId, {
          rating,
          content,
          title: title || undefined,
        });
        await loadEligibility();
        toast.success("Your review has been updated.");
        return res.data?.data ?? res.data ?? null;
      } catch (err) {
        const message =
          err.response?.data?.message || "Failed to update review. Please try again.";
        toast.error(message);
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [loadEligibility]
  );

  const removeReview = useCallback(
    async (reviewId) => {
      if (!reviewId) return false;
      try {
        await reviewApi.deleteReview(reviewId);
        await loadEligibility();
        toast.success("Your review has been deleted.");
        return true;
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete review.");
        return false;
      }
    },
    [loadEligibility]
  );

  return {
    eligibility,
    loading,
    submitting,
    submitReview,
    updateReview,
    removeReview,
    refresh: loadEligibility,
  };
}

/** Format an ISO date into a short human-readable label. */
export function formatReviewDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
