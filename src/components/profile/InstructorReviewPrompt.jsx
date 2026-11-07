"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FaStar } from "react-icons/fa";
import { reviewApi } from "@/services/reviewApi";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import toast from "react-hot-toast";

export default function InstructorReviewPrompt({ enrollmentId = null, autoPrompt = true, showTrigger = true }) {
  const [available, setAvailable] = useState([]);
  const [allAvailable, setAllAvailable] = useState([]);
  const [selected, setSelected] = useState(null);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const autoPrompted = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [pendingResponse, allResponse] = await Promise.all([
        reviewApi.getEligibleInstructorReviews(false),
        reviewApi.getEligibleInstructorReviews(true),
      ]);
      const pending = pendingResponse.data?.data || [];
      const all = allResponse.data?.data || [];
      const scopedPending = enrollmentId ? pending.filter((item) => Number(item.enrollment_id) === Number(enrollmentId)) : pending;
      const scopedAll = enrollmentId ? all.filter((item) => Number(item.enrollment_id) === Number(enrollmentId)) : all;
      setAvailable(scopedPending);
      setAllAvailable(scopedAll);
      if (autoPrompt && !autoPrompted.current && scopedPending.length) {
        autoPrompted.current = true;
        setSelected(scopedPending[0]);
      }
    } catch (error) {
      console.error("Unable to load instructor review eligibility:", error);
    } finally {
      setLoading(false);
    }
  }, [autoPrompt, enrollmentId]);

  useEffect(() => { refresh(); }, [refresh]);

  const close = () => {
    setSelected(null);
    setRating(0);
    setContent("");
  };

  const handleDismiss = async () => {
    if (!selected) return;
    try {
      await reviewApi.dismissInstructorReview(selected.enrollment_id);
      toast.success("You can review this instructor later from here.");
      close();
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save this reminder.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selected || !rating || saving) return;
    setSaving(true);
    try {
      await reviewApi.submitInstructorReview({
        enrollment_id: selected.enrollment_id,
        rating,
        content: content.trim() || null,
      });
      toast.success("Instructor review submitted for moderation.");
      close();
      await refresh();
    } catch (error) {
      const validation = error.response?.data?.errors;
      toast.error(Object.values(validation || {})[0]?.[0] || error.response?.data?.message || "Unable to submit your review.");
    } finally {
      setSaving(false);
    }
  };

  const chooseForLater = (item) => {
    setSelected(item);
    setRating(0);
    setContent("");
  };

  return (
    <>
      {showTrigger && !loading && allAvailable.length > 0 && (
        <button type="button" className="InstructorReviewLaterLink" onClick={() => chooseForLater(available[0] || allAvailable[0])}>
          Review an instructor{allAvailable.length > 1 ? ` (${allAvailable.length})` : ""}
        </button>
      )}
      {selected && (
        <div className="InstructorReviewOverlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) handleDismiss(); }}>
          <section className="InstructorReviewDialog" role="dialog" aria-modal="true" aria-labelledby="instructor-review-title">
            <header className="InstructorReviewHeader">
              <div>
                <h2 id="instructor-review-title">Review your instructor</h2>
                <p>Share feedback about your completed learning experience.</p>
              </div>
              <button type="button" className="InstructorReviewClose" onClick={handleDismiss} aria-label="Review later">×</button>
            </header>
            <div className="InstructorReviewSubject">
              {selected.instructor?.avatar_url ? (
                <Image src={resolveMediaUrl(selected.instructor.avatar_url)} alt="" width={48} height={48} unoptimized />
              ) : <span>{selected.instructor?.name?.charAt(0) || "I"}</span>}
              <div>
                <strong>{selected.instructor?.name}</strong>
                <small>{selected.experience?.title} · {String(selected.experience?.type || "").replace(/([A-Z])/g, " $1")}</small>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="InstructorReviewForm">
              <fieldset>
                <legend>Your rating <span aria-hidden="true">*</span></legend>
                <div className="InstructorReviewStars" role="radiogroup" aria-label="Instructor rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} star${value > 1 ? "s" : ""}`} onClick={() => setRating(value)}>
                      <FaStar className={value <= rating ? "isSelected" : ""} />
                    </button>
                  ))}
                </div>
              </fieldset>
              <label htmlFor="instructor-review-content">Written feedback <span>(optional)</span></label>
              <textarea id="instructor-review-content" value={content} maxLength={2000} onChange={(event) => setContent(event.target.value)} placeholder="What was your experience with this instructor?" />
              <div className="InstructorReviewActions">
                <button type="button" className="InstructorReviewLater" onClick={handleDismiss} disabled={saving}>Review later</button>
                <button type="submit" className="InstructorReviewSubmit" disabled={!rating || saving}>{saving ? "Submitting…" : "Submit instructor review"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
