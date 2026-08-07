"use client";

import React, { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import { AiFillStar } from 'react-icons/ai';
import toast from 'react-hot-toast';

export default function ReviewsTab({ course }) {
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    try {
      setIsSubmittingReview(true);
      // Simulate review submission
      toast.success("Thank you for your feedback!");
      setReviewComment('');
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="OverviewTab" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Student Feedback Reviews List */}
      <div className="SectionBlock ReviewsSection">
        <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1c1d1f', marginBottom: '16px' }}>
          Student Feedback
        </h3>
        <div className="ReviewsList">
          {[1, 2].map((rev) => (
            <div key={rev} className="SingleReview">
              <div className="ReviewHeader">
                <div className="ReviewerMeta">
                  <div className="InitialsAvatar">
                    E
                  </div>
                  <span className="ReviewerName">Emma Crieght</span>
                  <span className="ReviewTime">4 months ago</span>
                </div>
                <div className="ReviewStarsRow">
                  <AiFillStar /><AiFillStar /><AiFillStar /><AiFillStar /><AiFillStar />
                </div>
              </div>
              <p className="ReviewCommentText">
                Effortless booking, unbeatable affordability! Small yet comfortable rooms in the heart of Sheffield's nightlife. Peaceful gem!
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Write a Review Form */}
      <div className="SubmitReview">
        <h3>
          Write a Review
        </h3>
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
          />

          <div className="FormBottomRow">
            <button
              type="submit"
              disabled={isSubmittingReview}
              className="SubmitReviewBtn"
            >
              {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
