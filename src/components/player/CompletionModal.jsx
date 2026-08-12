"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiAward, FiCheckCircle, FiDownload, FiEye, FiRefreshCw, FiGrid, FiX } from 'react-icons/fi';
import courseApi from '@/libs/courseApi';
import toast from 'react-hot-toast';
import CertificateViewerModal from '@/components/certificate/CertificateViewerModal';

export default function CompletionModal({ course, certificateData, onClose, onClaimSuccess }) {
  const router = useRouter();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedCert, setClaimedCert] = useState(certificateData?.certificate || null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleClaim = async () => {
    if (!course?.id) return;
    try {
      setIsClaiming(true);
      const res = await courseApi.claimCertificate(course.id);
      const data = res.data?.data || res.data;
      toast.success("Certificate claimed successfully! 🎉");
      setClaimedCert(data);
      if (typeof onClaimSuccess === 'function') {
        onClaimSuccess(data);
      }
      setIsViewerOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to claim certificate");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '520px',
        width: '100%',
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        position: 'relative',
        animation: 'fadeIn 0.3s ease'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '18px',
            color: '#64748b',
            cursor: 'pointer'
          }}
        >
          <FiX />
        </button>

        {/* Celebration Trophy Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'rgba(135, 68, 41, 0.1)',
          color: 'var(--primaryColor, #874429)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '34px',
          marginBottom: '16px'
        }}>
          <FiAward />
        </div>

        <span style={{
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'var(--primaryColor, #874429)',
          backgroundColor: 'rgba(135, 68, 41, 0.08)',
          padding: '4px 12px',
          borderRadius: '20px',
          marginBottom: '8px'
        }}>
          Milestone Reached! 🎉
        </span>

        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
          Congratulations!
        </h2>

        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', marginBottom: '24px' }}>
          You have successfully completed 100% of <strong>{course?.title || 'the course'}</strong>! Your dedication to learning and practice is truly inspiring.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          {claimedCert ? (
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button
                onClick={() => setIsViewerOpen(true)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '10px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
                }}
              >
                <FiEye />
                <span>View Certificate</span>
              </button>

              <button
                onClick={() => setIsViewerOpen(true)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '10px',
                  backgroundColor: 'var(--primaryColor, #874429)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(135, 68, 41, 0.25)'
                }}
              >
                <FiDownload />
                <span>Download</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: 'var(--primaryColor, #874429)',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(135, 68, 41, 0.25)'
              }}
            >
              {isClaiming ? <FiRefreshCw className="spin" /> : <FiAward />}
              <span>{isClaiming ? 'Claiming Certificate...' : 'Claim Official Certificate'}</span>
            </button>
          )}

          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              Review Lessons
            </button>

            <button
              onClick={() => router.push('/auth/profile')}
              style={{
                flex: 1,
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <FiGrid />
              <span>Student Dashboard</span>
            </button>
          </div>
        </div>

        {/* Certificate Viewer Modal */}
        <CertificateViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          certificate={claimedCert}
          course={course}
        />
      </div>
    </div>
  );
}
