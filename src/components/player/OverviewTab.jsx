"use client";

import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiAward, FiDownload, FiLock } from 'react-icons/fi';
import { MEDIA_BASE_URL } from '@/utils/constants';
import courseApi from '@/libs/courseApi';
import toast from 'react-hot-toast';

export default function OverviewTab({ course, currentLesson, completionSummary }) {
  const [eligibility, setEligibility] = useState(null);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (!course?.id) return;
    courseApi.getCertificateEligibility(course.id)
      .then((res) => {
        const data = res.data?.data || res.data;
        setEligibility(data);
      })
      .catch(() => {});
  }, [course?.id, completionSummary?.percentage]);

  const handleClaim = async () => {
    if (!course?.id) return;
    try {
      setIsClaiming(true);
      const res = await courseApi.claimCertificate(course.id);
      const data = res.data?.data || res.data;
      toast.success("Certificate claimed!");
      setEligibility(prev => ({
        ...prev,
        is_claimed: true,
        certificate: data
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to claim certificate");
    } finally {
      setIsClaiming(false);
    }
  };

  if (!course) return null;

  const instructorAvatar = course.instructor?.avatar
    ? (course.instructor.avatar.startsWith('http')
        ? course.instructor.avatar
        : `${MEDIA_BASE_URL.replace(/\/+$/, '')}/${course.instructor.avatar.replace(/^\/+/, '')}`)
    : '/images/avatar-placeholder.webp';

  const percentage = completionSummary?.percentage ?? 0;
  const isCompleted = percentage >= 100;

  // Clean HTML from strings if we render as plain text, or render rich HTML safely
  const courseDescriptionHtml = course.description || course.short_description || "Welcome to this comprehensive workshop course.";
  const lessonDescriptionHtml = currentLesson?.description || currentLesson?.short_description || "";

  return (
    <div className="OverviewTab" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Certificate Status Card */}
      <div className="CertificateStatusCard" style={{
        backgroundColor: isCompleted ? '#fff7ed' : '#ffffff',
        border: isCompleted ? '1px solid rgba(135, 68, 41, 0.3)' : '1px solid #d1d7dc',
        borderRadius: '8px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="AwardIconWrapper" style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: isCompleted ? 'var(--primaryColor, #874429)' : '#f1f5f9',
            color: isCompleted ? '#ffffff' : '#6a6f73',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            <FiAward />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#1c1d1f' }}>
              Course Completion Certificate
            </span>
            <span style={{ fontSize: '13px', color: '#6a6f73' }}>
              {eligibility?.is_claimed
                ? `Issued Certificate #${eligibility.certificate?.certificate_number || ''}`
                : isCompleted
                ? 'Congratulations! Course 100% completed.'
                : `Complete all lessons to earn certificate (${percentage}% finished)`}
            </span>
          </div>
        </div>

        <div>
          {eligibility?.is_claimed && eligibility?.certificate?.download_url ? (
            <a
              href={eligibility.certificate.download_url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="DownloadCertificateBtn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '700',
                borderRadius: '4px',
                backgroundColor: 'var(--primaryColor, #874429)',
                color: '#ffffff',
                textDecoration: 'none'
              }}
            >
              <FiDownload />
              <span>Download PDF</span>
            </a>
          ) : isCompleted ? (
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '700',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'var(--primaryColor, #874429)',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <FiAward />
              <span>{isClaiming ? 'Claiming...' : 'Claim Certificate'}</span>
            </button>
          ) : (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '4px',
              backgroundColor: '#f1f5f9',
              color: '#6a6f73'
            }}>
              <FiLock />
              <span>Locked ({percentage}%)</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Current Lesson Description (Rich Text Rendered Safely) */}
      {currentLesson && (
        <div className="SectionBlock">
          <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1c1d1f', marginBottom: '8px' }}>
            About This Lesson: {currentLesson.title}
          </h4>
          {lessonDescriptionHtml ? (
            <div 
              className="RichDescriptionText" 
              style={{ fontSize: '14.5px', color: '#1c1d1f', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: lessonDescriptionHtml }} 
            />
          ) : (
            <p style={{ fontSize: '14.5px', color: '#1c1d1f', lineHeight: '1.6', margin: 0 }}>
              In this lesson, you will explore step-by-step guidance on {currentLesson.title}. Practice along with the video to master key techniques.
            </p>
          )}
        </div>
      )}

      {/* 3. Course Description (Rich Text Rendered Safely) */}
      <div className="SectionBlock">
        <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1c1d1f', marginBottom: '8px' }}>
          About The Course
        </h4>
        <div 
          className="RichDescriptionText" 
          style={{ fontSize: '14.5px', color: '#1c1d1f', lineHeight: '1.6' }}
          dangerouslySetInnerHTML={{ __html: courseDescriptionHtml }} 
        />
      </div>

      {/* 4. Learning Outcomes */}
      {Array.isArray(course.learning_outcomes) && course.learning_outcomes.length > 0 && (
        <div className="SectionBlock">
          <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1c1d1f', marginBottom: '8px' }}>
            What You&apos;ll Learn
          </h4>
          <ul className="OutcomesList" style={{ listStyle: 'none', paddingLeft: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {course.learning_outcomes.map((outcome, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1c1d1f' }}>
                <FiCheckCircle style={{ color: 'var(--primaryColor, #874429)', flexShrink: 0, fontSize: '16px' }} />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. Instructor Section */}
      {course.instructor && (
        <div className="SectionBlock">
          <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1c1d1f', marginBottom: '8px' }}>
            Your Instructor
          </h4>
          <div className="InstructorCard" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={instructorAvatar}
              alt={course.instructor.name}
              className="Avatar"
              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div className="InstructorInfo" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span className="Name" style={{ fontSize: '15px', fontWeight: '700', color: '#1c1d1f' }}>
                {course.instructor.name}
              </span>
              <span className="Bio" style={{ fontSize: '13px', color: '#6a6f73' }}>
                {course.instructor.bio || "Certified Yoga & Wellness Instructor"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
