"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FiCheckCircle, 
  FiAward, 
  FiDownload, 
  FiEye,
  FiLock, 
  FiUsers, 
  FiStar, 
  FiShoppingCart 
} from 'react-icons/fi';
import { AiFillStar } from 'react-icons/ai';
import { resolveMediaUrl, resolveProductMediaUrl } from '@/utils/mediaUrl';
import courseApi from '@/libs/courseApi';
import { useCart } from "@/features/commerce/hooks/useCommerceHooks";
import CertificateViewerModal from "@/components/certificate/CertificateViewerModal";
import toast from "react-hot-toast";

export default function OverviewTab({ course, currentLesson, completionSummary, certificateEligibility, onEligibilityUpdate }) {
  // Certificate eligibility ships inside the player session
  // (sessionData.certificate_eligibility) — no separate request on mount.
  const [eligibility, setEligibility] = useState(certificateEligibility || null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Commerce hooks
  const { addItem, removeItem, isInCart } = useCart();

  // The server is only re-consulted once, when the course crosses the 100%
  // completion threshold, to verify the certificate state transition — never
  // on ordinary progress updates or re-renders.
  const prevPercentageRef = useRef(completionSummary?.percentage ?? 0);

  // Fresh eligibility is pushed back into the session state (and therefore the
  // session cache) so the unlocked certificate survives tab switches and is
  // observed by the header / Overview on the next mount.
  const applyEligibility = useCallback((data) => {
    if (!data) return;
    setEligibility(data);
    onEligibilityUpdate?.(data);
  }, [onEligibilityUpdate]);

  useEffect(() => {
    const percentage = completionSummary?.percentage ?? 0;
    const prev = prevPercentageRef.current;
    prevPercentageRef.current = percentage;

    if (!course?.id) return;
    if (prev < 100 && percentage >= 100) {
      courseApi.getCertificateEligibility(course.id)
        .then((res) => applyEligibility(res.data?.data || res.data))
        .catch(() => {});
    }
  }, [course?.id, completionSummary?.percentage, applyEligibility]);

  const handleClaim = async () => {
    if (!course?.id) return;
    try {
      setIsClaiming(true);
      const res = await courseApi.claimCertificate(course.id);
      const data = res.data?.data || res.data;
      toast.success("Certificate claimed successfully! 🎉");
      const claimed = {
        ...eligibility,
        is_claimed: true,
        certificate: data
      };
      setEligibility(claimed);
      onEligibilityUpdate?.(claimed);
      setIsViewerOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to claim certificate");
    } finally {
      setIsClaiming(false);
    }
  };

  if (!course) return null;

  const instructor = course.instructor;
  const instructorAvatar = instructor?.avatar_url || instructor?.avatar
    ? resolveMediaUrl(instructor.avatar_url || instructor.avatar)
    : '/images/avatar-placeholder.webp';

  const percentage = completionSummary?.percentage ?? 0;
  const isCompleted = percentage >= 100;

  // Rich texts
  const courseDescriptionHtml = course.description || course.short_description || "Welcome to this comprehensive workshop course.";
  const lessonDescriptionHtml = currentLesson?.description || currentLesson?.short_description || "";

  const products = course.products || [];
  const requirements = course.requirements || [];

  return (
    <div className="OverviewTab">
      
      {/* ─── Banner Header Info Row ─────────────────────────────────── */}
      <div className="CourseOverviewBanner">
        <h2>
          {course.title}
        </h2>
        <p>
          {course.short_description}
        </p>

        <div className="BannerMetaRow">
          <div className="InstructorMetaBlock">
            <img src={instructorAvatar} alt="Instructor" />
            <span>Created by <strong>{instructor?.name || 'Instructor'}</strong></span>
          </div>

          <div className="RatingMetaBlock">
            <AiFillStar />
            <span>4.5</span>
            <span className="RatingCount">(250 ratings)</span>
          </div>

          <div className="StudentsMetaBlock">
            <FiUsers />
            <span>{course.enrollments_count || '1,234'} students</span>
          </div>
        </div>
      </div>

      {/* ─── Certificate Status Card ────────────────────────────────── */}
      {eligibility?.has_certificate !== false && (
        <div className={`CertificateStatusCard ${isCompleted ? 'IsCompleted' : ''}`}>
          <div className="CardLeft">
            <div className="AwardIconWrapper">
              <FiAward />
            </div>

            <div className="TextWrapper">
              <span className="CardTitle">
                Course Completion Certificate
              </span>
              <span className="CardDesc">
                {eligibility?.is_claimed
                  ? `Issued Certificate #${eligibility.certificate?.certificate_number || ''}`
                  : isCompleted
                  ? 'Congratulations! Course 100% completed. Your official certificate is unlocked.'
                  : `Complete all lessons to earn your certificate (${percentage}% finished)`}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", items: "center", gap: "8px" }}>
            {eligibility?.is_claimed && eligibility?.certificate ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsViewerOpen(true)}
                  className="ClaimCertificateBtn"
                  style={{ backgroundColor: "#0f172a" }}
                >
                  <FiEye />
                  <span>View Certificate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsViewerOpen(true)}
                  className="DownloadCertificateBtn"
                >
                  <FiDownload />
                  <span>Download</span>
                </button>
              </>
            ) : isCompleted ? (
              <button
                onClick={handleClaim}
                disabled={isClaiming}
                className="ClaimCertificateBtn"
              >
                <FiAward />
                <span>{isClaiming ? 'Claiming...' : 'Claim & View Certificate'}</span>
              </button>
            ) : (
              <span className="LockedBadge">
                <FiLock />
                <span>Locked ({percentage}%)</span>
              </span>
            )}
          </div>

          {/* Certificate Preview & Download Modal */}
          <CertificateViewerModal
            isOpen={isViewerOpen}
            onClose={() => setIsViewerOpen(false)}
            certificate={eligibility?.certificate}
            course={course}
          />
        </div>
      )}

      {/* ─── Current Lesson Description ─────────────────────────────── */}
      {currentLesson && (
        <div className="SectionBlock">
          <h4>
            About This Lesson: {currentLesson.title}
          </h4>
          {lessonDescriptionHtml ? (
            <div 
              className="RichDescriptionText" 
              dangerouslySetInnerHTML={{ __html: lessonDescriptionHtml }} 
            />
          ) : (
            <p>
              In this lesson, you will explore step-by-step guidance on {currentLesson.title}. Practice along with the video to master key techniques.
            </p>
          )}
        </div>
      )}

      {/* ─── What You'll Learn Card ─────────────────────────────────── */}
      {Array.isArray(course.learning_outcomes) && course.learning_outcomes.length > 0 && (
        <div className="HighlightOutlineCard">
          <h3>
            What you&apos;ll learn
          </h3>
          <div className="OutcomeGrid">
            {course.learning_outcomes.map((item, idx) => (
              <div key={idx} className="OutcomeItem">
                <FiCheckCircle />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Description Section ────────────────────────────────────── */}
      <div className="SectionBlock">
        <h3>
          Description
        </h3>
        <div 
          className="ContentText" 
          dangerouslySetInnerHTML={{ __html: courseDescriptionHtml }} 
        />
      </div>

      {/* ─── Requirements & Gear (Products list) Section ─────────────── */}
      <div className="HighlightOutlineCard RequirementsSection">
        <h3>
          Course Requirements & Gear
        </h3>
        <p className="OutlinesSub">
          To get the best results from this course, we recommend the following gear:
        </p>

        <ul className="OutlinesList">
          {requirements.length > 0 ? (
            requirements.map((item, idx) => (
              <li key={idx}>
                <FiCheckCircle />
                <span>{item}</span>
              </li>
            ))
          ) : (
            <li>
              <FiCheckCircle />
              <span>No requirements mentioned.</span>
            </li>
          )}
        </ul>

        {/* Recommended Gear Products listing */}
        {products.length > 0 && (
          <div className="ProductList">
            <h4>
              Recommended Gear:
            </h4>
            {products.map((prod, index) => {
              const isAdded = isInCart(prod.value, 'Product');
              return (
                <div key={index} className="ProductItem">
                  <div className="ProductLeft">
                    <img
                      src={prod.image ? resolveProductMediaUrl(prod.image) : '/images/placeholder.webp'}
                      alt="Product"
                    />
                    <div className="ProductMeta">
                      <h5>{prod.label}</h5>
                      <span className="ProductPrice">₹{prod.price}</span>
                    </div>
                  </div>

                  <div className="ProductActions">
                    <button
                      className={`AddToCartBtn ${isAdded ? "added" : ""}`}
                      onClick={() => isAdded ? removeItem('Product', prod.value) : addItem(prod, 'Product')}
                    >
                      <FiShoppingCart />
                      <span>{isAdded ? "Remove" : "Add to Cart"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Instructor Section ────────────────────────────────────── */}
      {instructor && (
        <div className="SectionBlock InstructorDetails">
          <h3>
            Instructor
          </h3>
          <div className="InstructorCard">
            <img
              src={instructorAvatar}
              alt="Instructor"
            />
            <div className="InsMeta">
              <h4>
                {instructor.name}
              </h4>
              <p>
                {instructor.role || 'Instructor'}
              </p>
              <div className="InstructorStatsRow">
                <span className="StatsRatings">
                  <FiStar /> 4.8 Ratings
                </span>
                <span className="StatsStudents">
                  <FiUsers /> 1,234 Students
                </span>
              </div>
            </div>
          </div>
          <div 
            className="Bio" 
            dangerouslySetInnerHTML={{ __html: instructor.bio_graphy || "Instructor biography not available." }}
          />
        </div>
      )}

    </div>
  );
}
