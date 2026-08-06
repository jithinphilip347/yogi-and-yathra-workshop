"use client";

import React, { useState, useEffect } from 'react';

export default function PlaybackDebugOverlay({
  videoRef,
  playbackSessionRef,
  providerType,
  lessonId,
}) {
  const [visible, setVisible] = useState(false);
  const [, setTick] = useState(0);

  // Toggle debug overlay via Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault();
        setVisible((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update overlay display every 500ms when visible
  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 500);
    return () => clearInterval(timer);
  }, [visible]);

  if (!visible) return null;

  const el = videoRef?.current;
  const session = playbackSessionRef?.current;

  const elTime = el ? (el.currentTime || 0).toFixed(2) : 'N/A';
  const elSeeking = el ? String(Boolean(el.seeking)) : 'false';
  const elPaused = el ? String(Boolean(el.paused)) : 'true';
  const sessionPos = session ? session.localPosition.toFixed(2) : 'N/A';
  const lastSync = session ? session.lastSyncedPosition.toFixed(2) : 'N/A';
  const isDirty = session ? String(Boolean(session.dirty)) : 'false';
  const resumed = session ? String(Boolean(session.resumed)) : 'false';
  const version = session ? session.version : 0;
  const lastSyncAt = session?.lastSyncAt ? `${Math.round((Date.now() - session.lastSyncAt) / 1000)}s ago` : 'Never';

  return (
    <div style={{
      position: 'absolute',
      top: '12px',
      right: '12px',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      color: '#f8fafc',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
      minWidth: '220px',
      lineHeight: '1.6'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid #334155', paddingBottom: '4px' }}>
        <strong style={{ color: '#38bdf8' }}>[SINGLE SOURCE OF TRUTH]</strong>
        <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}>✕</button>
      </div>
      <div><strong>Owner:</strong> <span style={{ color: '#4ade80' }}>HTML5 Video Element</span></div>
      <div><strong>Lesson ID:</strong> {lessonId || 'N/A'}</div>
      <div><strong>video.currentTime:</strong> <span style={{ color: '#facc15' }}>{elTime}s</span></div>
      <div><strong>video.seeking:</strong> {elSeeking}</div>
      <div><strong>video.paused:</strong> {elPaused}</div>
      <div style={{ borderTop: '1px solid #334155', marginTop: '4px', paddingTop: '4px' }}>
        <div><strong>Session Position:</strong> {sessionPos}s</div>
        <div><strong>Last Synced:</strong> {lastSync}s ({lastSyncAt})</div>
        <div><strong>Dirty State:</strong> {isDirty}</div>
        <div><strong>Resume Lock:</strong> {resumed}</div>
        <div><strong>Session Version:</strong> {version}</div>
        <div><strong>Provider:</strong> {providerType}</div>
      </div>
    </div>
  );
}
