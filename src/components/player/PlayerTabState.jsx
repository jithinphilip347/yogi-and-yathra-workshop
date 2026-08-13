"use client";

import React from 'react';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

/**
 * PlayerTabState
 *
 * Lightweight shared state presentation for the player tabs (Notes, Resources,
 * Discussion, Reviews, Overview). Every tab must distinguish loading, success,
 * empty, and error — and offer retry where a failure is actionable. An empty
 * result is never presented as an error, and an error is never silently shown
 * as an empty list.
 */
export default function PlayerTabState({ state, loadingLabel, errorTitle, errorHint, emptyTitle, emptyHint, onRetry }) {
  if (state === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: '#6a6f73', fontSize: '13.5px' }}>
        {loadingLabel || 'Loading...'}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px dashed #fecaca',
        color: '#6a6f73',
      }}>
        <FiAlertCircle style={{ fontSize: '28px', color: '#ef4444', marginBottom: '8px' }} />
        <p style={{ fontSize: '14.5px', fontWeight: '700', color: '#1c1d1f', margin: '0 0 4px' }}>
          {errorTitle || 'Unable to load.'}
        </p>
        {errorHint && <p style={{ fontSize: '13px', color: '#6a6f73', margin: '0 0 12px' }}>{errorHint}</p>}
        {typeof onRetry === 'function' && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '700',
              borderRadius: '6px',
              border: '1px solid var(--primaryColor, #874429)',
              backgroundColor: '#ffffff',
              color: 'var(--primaryColor, #874429)',
              cursor: 'pointer',
            }}
          >
            <FiRefreshCw />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  // Empty state
  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 20px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px dashed #d1d7dc',
      color: '#6a6f73',
    }}>
      <p style={{ fontSize: '14.5px', fontWeight: '700', color: '#1c1d1f', margin: '0 0 4px' }}>
        {emptyTitle || 'Nothing here yet.'}
      </p>
      {emptyHint && <p style={{ fontSize: '13px', color: '#6a6f73', margin: 0 }}>{emptyHint}</p>}
    </div>
  );
}
