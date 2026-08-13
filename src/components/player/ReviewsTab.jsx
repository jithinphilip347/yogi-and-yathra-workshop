"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { FiStar } from 'react-icons/fi';
import { AiFillStar } from 'react-icons/ai';
import toast from 'react-hot-toast';
import { reviewApi } from '@/services/reviewApi';
import { useCourseReviews, formatReviewDate } from '@/components/reviews/useCourseReviews';
import { resolveMediaUrl } from '@/utils/mediaUrl';

export default function ReviewsTab({ course }) {
  const courseId = course?.id;

  const {
    eligibility,
    loading: eligibilityLoading,
    submitting: isSubmittingReview,
    submitReview,
    updateReview,
    removeReview,
  } = useCourseReviews(courseId);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(() => !courseId);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isEditingReview, setIsEditingReview] = useState(false);

  // Approved reviews for the course (same backend data as the details page).
  const loadReviews = useCallback(async () => {
    if (!courseId) return;
    try {
      setReviewsLoading(true);
      const res = await reviewApi.getReviews({
        target_type: 'course',
        target_id: courseId,
        per_page: 5,
      });
      setReviews(res.data?.data || []);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) loadReviews();
  }, [courseId, loadReviews]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    const result = isEditingReview
      ? await updateReview(eligibility.review.id, {
          rating,
          content: reviewComment,
        })
      : await submitReview({ rating, content: reviewComment });
    if (result) {
      setIsEditingReview(false);
      setReviewComment('');
      setRating(5);
      // Reviews are published instantly — show the new one right away.
      loadReviews();
    }
  };

  const startEditReview = () => {
    setIsEditingReview(true);
    setRating(eligibility?.review?.rating ?? 5);
    setReviewComment(eligibility?.review?.content ?? '');
  };

  const handleDeleteReview = async () => {
    if (!eligibility?.review?.id) return;
    if (!window.confirm('Delete your review? This cannot be undone.')) return;
    const deleted = await removeReview(eligibility.review.id);
    if (deleted) loadReviews();
  };

  return (
    <div className="OverviewTab" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* 1. Student Feedback Reviews List */}
      <div className="SectionBlock ReviewsSection">
        <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1c1d1f', marginBottom: '16px' }}>
          Student Feedback
        </h3>
        {reviewsLoading ? (
          <p className="ReviewHint">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <div className="ReviewsList">
            {reviews.map((rev) => (
              <div key={rev.id} className="SingleReview">
                <div className="ReviewHeader">
                  <div className="ReviewerMeta">
                    {rev.user_image ? (
                      <img
                        src={resolveMediaUrl(rev.user_image)}
                        alt={rev.user_name || 'Reviewer'}
                        className="InitialsAvatar"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="InitialsAvatar">
                        {(rev.user_name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="ReviewerName">{rev.user_name || 'Anonymous'}</span>
                    <span className="ReviewTime">{formatReviewDate(rev.created_at)}</span>
                  </div>
                  <div className="ReviewStarsRow">
                    {[1, 2, 3, 4, 5].map((s) =>
                      s <= (rev.rating || 0) ? (
                        <AiFillStar key={s} />
                      ) : (
                        <FiStar key={s} style={{ opacity: 0.35 }} />
                      )
                    )}
                  </div>
                </div>
                <p className="ReviewCommentText">{rev.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="ReviewHint">No reviews yet. Be the first to review this course.</p>
        )}
      </div>

      {/* 2. Write a Review / Your Review */}
      <div className="SubmitReview">
        {eligibilityLoading ? (
          <>
            <h3>Write a Review</h3>
            <p className="ReviewHint">Loading your review status…</p>
          </>
        ) : !eligibility ? (
          <>
            <h3>Write a Review</h3>
            <p className="ReviewHint">Please refresh the page and try again later.</p>
          </>
        ) : eligibility.reason === 'auth_required' ? (
          <>
            <h3>Write a Review</h3>
            <p className="ReviewHint">
              <a href="/auth/login" className="ReviewLoginLink">Log in</a> to review this course.
            </p>
          </>
        ) : eligibility.reason === 'purchase_required' ? (
          <>
            <h3>Write a Review</h3>
            <p className="ReviewHint">Purchase this course to share your review.</p>
          </>
        ) : eligibility.has_review && !isEditingReview ? (
          <>
            <h3>Your Review</h3>
            <div className="SubmitReviewForm">
              <div className="FormRateRow">
                <span>Your rating</span>
                <div className="StarsSelector">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} style={{ cursor: 'default' }}>
                      {star <= (eligibility.review?.rating || 0) ? <AiFillStar /> : <FiStar />}
                    </span>
                  ))}
                </div>
              </div>
              <p className="MyReviewText">{eligibility.review?.content}</p>
              <div className="FormBottomRow">
                <button type="button" className="CancelBtn" onClick={handleDeleteReview}>
                  Delete
                </button>
                <button type="button" className="SubmitReviewBtn" onClick={startEditReview}>
                  Edit Review
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h3>{isEditingReview ? 'Edit Your Review' : 'Write a Review'}</h3>
            <form onSubmit={handleSubmitReview} className="SubmitReviewForm">
              <div className="FormRateRow">
                <span>Rate this course</span>
                <div className="StarsSelector">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} onClick={() => setRating(star)}>
                      {star <= rating ? <AiFillStar /> : <FiStar />}
                    </span>
                  ))}
                </div>
              </div>

              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this course..."
                className="ReviewTextarea"
                required
              />

              <div className="FormBottomRow">
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="SubmitReviewBtn"
                >
                  {isSubmittingReview
                    ? 'Submitting...'
                    : isEditingReview
                      ? 'Update Review'
                      : 'Submit Review'}
                </button>
                {isEditingReview && (
                  <button
                    type="button"
                    className="CancelBtn"
                    onClick={() => setIsEditingReview(false)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>

    </div>
  );
}
