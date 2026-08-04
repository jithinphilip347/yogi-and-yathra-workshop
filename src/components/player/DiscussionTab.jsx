"use client";

import React from 'react';
import { FiMessageSquare, FiLock, FiCheckCircle } from 'react-icons/fi';

export default function DiscussionTab() {
  return (
    <div className="DiscussionTabContainer" style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '32px 24px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px'
    }}>
      <div style={{
        width: '54px',
        height: '54px',
        borderRadius: '50%',
        backgroundColor: 'rgba(135, 68, 41, 0.08)',
        color: 'var(--primaryColor, #874429)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px'
      }}>
        <FiMessageSquare />
      </div>

      <div style={{ maxWidth: '420px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
          Lesson Discussion & Q&A Board
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
          Connect with your instructor and fellow students, ask questions, and share insights. The Discussion Engine architecture is prepared for release in an upcoming sprint!
        </p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        textAlign: 'left',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '14px 18px',
        maxWidth: '420px',
        width: '100%',
        fontSize: '12.5px',
        color: '#475569'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
          <FiLock style={{ color: 'var(--primaryColor, #874429)' }} />
          <span>Upcoming Sprint Features:</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiCheckCircle style={{ color: '#10b981' }} />
          <span>Timestamped Q&A threads linked to video markers</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiCheckCircle style={{ color: '#10b981' }} />
          <span>Instructor verified answers and discussion badges</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiCheckCircle style={{ color: '#10b981' }} />
          <span>Automated student notifications & reply digests</span>
        </div>
      </div>
    </div>
  );
}
