"use client";
import React, { useEffect } from "react";
import { FiX, FiStar } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import { formatReviewDate } from "@/components/reviews/useCourseReviews";

const ReviewPopup = ({ onClose, reviews = [] }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="ReviewPopupOverlay" onClick={onClose}>
      <div
        className="RePopupContent ReviewContainer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="PopupHeader">
          <h3>All Student Reviews ({reviews.length})</h3>
          <button className="CloseBtn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="PopupBody Scrollable">
          {reviews.length > 0 ? (
            reviews.map((rev) => (
              <div key={rev.id} className="SingleReviewItem">
                <div className="ReviewTop">
                  <div className="UserMeta">
                    {rev.user_image ? (
                      <img
                        src={rev.user_image}
                        alt={rev.user_name || "Reviewer"}
                        className="UserImg"
                      />
                    ) : (
                      <div className="UserImg UserImgFallback">
                        {(rev.user_name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="UserInfo">
                      <h5>{rev.user_name || "Anonymous"}</h5>
                      <span>{formatReviewDate(rev.created_at)}</span>
                    </div>
                  </div>
                  <div className="UserStars">
                    {[1, 2, 3, 4, 5].map((s) =>
                      s <= (rev.rating || 0) ? (
                        <AiFillStar key={s} />
                      ) : (
                        <FiStar key={s} style={{ opacity: 0.35 }} />
                      )
                    )}
                    <span className="RatingNum">{rev.rating || 0}.0</span>
                  </div>
                </div>
                <p className="Comment">{rev.content}</p>
              </div>
            ))
          ) : (
            <p className="NoReviewsText">
              No reviews yet. Be the first to review this course.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewPopup;
