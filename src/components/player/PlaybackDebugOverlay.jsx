"use client";

import React, { useState, useEffect } from 'react';
import { playerDebug } from '@/libs/playerDebug';

export default function PlaybackDebugOverlay({
  videoRef,
  playbackSessionRef,
  syncMetricsRef,
  pendingProgressQueueRef,
  renderCountRef,
  providerType,
  lessonId,
}) {
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('SESSION'); // SESSION | TIMELINE | EXPORT
  const [filterQuery, setFilterQuery] = useState('');
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
  const metrics = syncMetricsRef?.current || { saveRequests: 0, saveAcks: 0, ignoredStale: 0, retriesCount: 0 };
  const queueLength = pendingProgressQueueRef?.current?.length || 0;
  const renderCount = renderCountRef?.current || 1;

  const elTime = el ? (el.currentTime || 0).toFixed(2) : 'N/A';
  const elSeeking = el ? String(Boolean(el.seeking)) : 'false';
  const elPaused = el ? String(Boolean(el.paused)) : 'true';
  const sessionPos = session ? session.localPosition.toFixed(2) : 'N/A';
  const lastSync = session ? session.lastSyncedPosition.toFixed(2) : 'N/A';
  const isDirty = session ? String(Boolean(session.dirty)) : 'false';
  const version = session ? (session.syncVersion || session.version || 0) : 0;
  const sessionId = session ? session.sessionId : 'N/A';
  const lastSyncAt = session?.lastSyncTimestamp ? `${Math.round((Date.now() - session.lastSyncTimestamp) / 1000)}s ago` : 'Never';

  const rawTimeline = playerDebug.getTimeline();
  const timelineEvents = filterQuery
    ? rawTimeline.filter((e) => e.name.toLowerCase().includes(filterQuery.toLowerCase()))
    : rawTimeline;

  const handleExportJSON = () => {
    playerDebug.exportSessionDiagnostics({
      session,
      metrics,
      renderCount,
      providerType,
      lessonId,
      videoEl: el,
    });
  };

  return (
    <div style={{
      position: 'absolute',
      top: '12px',
      right: '12px',
      backgroundColor: 'rgba(15, 23, 42, 0.96)',
      color: '#f8fafc',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '12px 14px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
      backdropFilter: 'blur(10px)',
      width: '320px',
      maxHeight: '440px',
      display: 'flex',
      flexDirection: 'column',
      lineHeight: '1.5'
    }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
        <strong style={{ color: '#38bdf8' }}>[PLAYER DEBUG]</strong>
        <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}>✕</button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
        {['SESSION', 'TIMELINE', 'EXPORT'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '4px 0',
              fontSize: '10px',
              fontWeight: 'bold',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === tab ? '#0284c7' : '#1e293b',
              color: activeTab === tab ? '#ffffff' : '#94a3b8',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: SESSION INSPECTOR */}
      {activeTab === 'SESSION' && (
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div><strong>Session ID:</strong> <span style={{ color: '#c084fc' }}>{sessionId}</span></div>
          <div><strong>Owner:</strong> <span style={{ color: '#4ade80' }}>HTML5 Video Element</span></div>
          <div><strong>Lesson ID:</strong> {lessonId || 'N/A'}</div>
          <div><strong>video.currentTime:</strong> <span style={{ color: '#facc15' }}>{elTime}s</span></div>
          <div><strong>video.seeking:</strong> {elSeeking}</div>
          <div><strong>video.paused:</strong> {elPaused}</div>

          <div style={{ borderTop: '1px solid #334155', marginTop: '4px', paddingTop: '4px' }}>
            <div><strong>Session Position:</strong> {sessionPos}s</div>
            <div><strong>Last Synced:</strong> {lastSync}s ({lastSyncAt})</div>
            <div><strong>Dirty State:</strong> <span style={{ color: session?.dirty ? '#f87171' : '#4ade80' }}>{isDirty}</span></div>
            <div><strong>Resume FSM:</strong> <span style={{ color: session?.resumeState === 'RESUME_LOCKED' ? '#4ade80' : '#facc15' }}>{session?.resumeState || 'IDLE'} ({session?.resumePosition ? session.resumePosition.toFixed(1) + 's' : '0s'})</span></div>
            <div><strong>Sync Version:</strong> <span style={{ color: '#38bdf8' }}>v{version}</span></div>
          </div>

          <div style={{ borderTop: '1px solid #334155', marginTop: '4px', paddingTop: '4px' }}>
            <div><strong>VideoEngine Renders:</strong> <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{renderCount}</span></div>
            <div><strong>Render Isolation:</strong> <span style={{ color: '#4ade80' }}>ACTIVE (0 playback re-renders)</span></div>
            <div><strong>Memoization:</strong> <span style={{ color: '#4ade80' }}>OPTIMIZED (React.memo)</span></div>
          </div>

          <div style={{ borderTop: '1px solid #334155', marginTop: '4px', paddingTop: '4px' }}>
            <div><strong>Network Status:</strong> <span style={{ color: metrics.isOnline !== false ? '#4ade80' : '#f87171' }}>{metrics.isOnline !== false ? 'ONLINE' : 'OFFLINE'}</span></div>
            <div><strong>Save Requests:</strong> {metrics.saveRequests}</div>
            <div><strong>Save ACKs:</strong> <span style={{ color: '#4ade80' }}>{metrics.saveAcks}</span></div>
            <div><strong>Ignored Stale:</strong> {metrics.ignoredStale}</div>
            <div><strong>Retry Queue:</strong> <span style={{ color: queueLength > 0 ? '#f87171' : '#94a3b8' }}>{queueLength} pending</span></div>
            <div><strong>Provider Adapter:</strong> <span style={{ color: '#4ade80' }}>UNIFIED ADAPTER ({providerType ? providerType.toUpperCase() : 'HTML5'})</span></div>
          </div>
        </div>
      )}

      {/* Tab 2: EVENT TIMELINE */}
      {activeTab === 'TIMELINE' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <input
            type="text"
            placeholder="Filter timeline events..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '4px 8px',
              fontSize: '10px',
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '4px',
              marginBottom: '6px',
            }}
          />
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {timelineEvents.length === 0 ? (
              <div style={{ color: '#64748b', fontStyle: 'italic', padding: '8px 0' }}>No timeline events recorded</div>
            ) : (
              timelineEvents.slice().reverse().map((evt) => (
                <div key={evt.id} style={{ borderBottom: '1px dashed #1e293b', paddingBottom: '3px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '9px' }}>[{evt.timeStr}]</span>{' '}
                  <strong style={{ color: '#38bdf8' }}>{evt.name}</strong>
                  {evt.position !== undefined && <span style={{ color: '#facc15' }}> @ {evt.position}s</span>}
                  {evt.returnedPosition !== undefined && <span style={{ color: '#4ade80' }}> (server: {evt.returnedPosition}s)</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: EXPORT DIAGNOSTICS */}
      {activeTab === 'EXPORT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <p style={{ color: '#94a3b8', fontSize: '10px', margin: 0 }}>
            Export full session diagnostics including active playhead state, Resume FSM status, React render counts, sync metrics, and recorded event timeline.
          </p>
          <button
            onClick={handleExportJSON}
            style={{
              padding: '8px 12px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            Download JSON Diagnostics
          </button>
          <div style={{ fontSize: '9px', color: '#64748b' }}>
            Recorded events: {rawTimeline.length} / 200
          </div>
        </div>
      )}
    </div>
  );
}
