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

  return (
    <div className="OverviewTab" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Certificate Status Card */}
      <div style={{
        backgroundColor: isCompleted ? '#fff7ed' : '#ffffff',
        border: isCompleted ? '1px solid rgba(135, 68, 41, 0.3)' : '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: isCompleted ? 'var(--primaryColor, #874429)' : '#f1f5f9',
            color: isCompleted ? '#ffffff' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px'
          }}>
            <FiAward />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
              Course Completion Certificate
            </span>
            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
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
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '8px',
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
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '8px',
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
              fontWeight: '500',
              borderRadius: '6px',
              backgroundColor: '#f1f5f9',
              color: '#64748b'
            }}>
              <FiLock />
              <span>Locked ({percentage}%)</span>
            </span>
          )}
        </div>
      </div>

      {/* Current Lesson Description */}
      {currentLesson && (
        <div className="SectionBlock">
          <h4>About This Lesson: {currentLesson.title}</h4>
          <p>
            {currentLesson.short_description ||
              currentLesson.description ||
              `In this lesson, you will explore step-by-step guidance on ${currentLesson.title}. Practice along with the video to master key techniques.`}
          </p>
        </div>
      )}

      {/* Course Description */}
      <div className="SectionBlock">
        <h4>About The Course</h4>
        <p>{course.description || course.short_description || "Welcome to this comprehensive workshop course."}</p>
      </div>

      {/* Learning Outcomes */}
      {Array.isArray(course.learning_outcomes) && course.learning_outcomes.length > 0 && (
        <div className="SectionBlock">
          <h4>What You&apos;ll Learn</h4>
          <ul className="OutcomesList">
            {course.learning_outcomes.map((outcome, idx) => (
              <li key={idx}>
                <FiCheckCircle className="CheckIcon" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructor Section */}
      {course.instructor && (
        <div className="SectionBlock">
          <h4>Your Instructor</h4>
          <div className="InstructorCard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={instructorAvatar}
              alt={course.instructor.name}
              className="Avatar"
            />
            <div className="InstructorInfo">
              <span className="Name">{course.instructor.name}</span>
              <span className="Bio">{course.instructor.bio || "Certified Yoga & Wellness Instructor"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
