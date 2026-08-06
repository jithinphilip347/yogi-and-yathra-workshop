"use client";

import React from 'react';
import { 
  FiPlay, 
  FiPause, 
  FiVolume2, 
  FiVolumeX, 
  FiMaximize, 
  FiMinimize, 
  FiAirplay 
} from 'react-icons/fi';

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export default React.memo(function ControlBar({
  isPlaying,
  currentTime,
  seekingTime,
  duration,
  volume,
  isMuted,
  playbackSpeed,
  isFullscreen,
  isPiPActive,
  togglePlay,
  handleVolumeChange,
  toggleMute,
  handleSpeedChange,
  toggleFullscreen,
  togglePiP,
  handleSeekStart,
  handleSeekChange,
  handleSeekCommit,
  handleSeekPreviewCommit,
}) {
  const formatTime = (secs) => {
    if (isNaN(secs) || secs === null || secs === undefined) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="CustomControlsBar" style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0))',
      padding: '12px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 25,
      transition: 'opacity 0.2s'
    }}>
      {/* Progress Seek Bar */}
      <input
        type="range"
        min={0}
        max={duration || 100}
        step={0.1}
        value={seekingTime !== null ? seekingTime : currentTime}
        onPointerDown={(e) => {
          if (e.currentTarget.setPointerCapture) {
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
          }
          handleSeekStart();
        }}
        onPointerUp={handleSeekCommit}
        onPointerCancel={handleSeekPreviewCommit}
        onChange={handleSeekChange}
        onKeyUp={handleSeekPreviewCommit}
        onBlur={handleSeekPreviewCommit}
        style={{ width: '100%', accentColor: 'var(--primaryColor, #874429)', cursor: 'pointer' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Play / Pause */}
          <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>

          {/* Volume */}
          <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>
            {isMuted ? <FiVolumeX /> : <FiVolume2 />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            style={{ width: '60px', accentColor: 'var(--primaryColor, #874429)', cursor: 'pointer' }}
          />

          {/* Time Display */}
          <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>
            {formatTime(seekingTime !== null ? seekingTime : currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Speed Selector */}
          <select
            value={playbackSpeed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {SPEED_OPTIONS.map((speed) => (
              <option key={speed} value={speed} style={{ backgroundColor: '#1e293b', color: '#fff' }}>
                {speed}x
              </option>
            ))}
          </select>

          {/* Picture-in-Picture */}
          <button onClick={togglePiP} style={{ background: 'none', border: 'none', color: isPiPActive ? '#10b981' : '#fff', fontSize: '18px', cursor: 'pointer' }} title="Picture in Picture">
            <FiAirplay />
          </button>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }} title="Fullscreen">
            {isFullscreen ? <FiMinimize /> : <FiMaximize />}
          </button>
        </div>
      </div>
    </div>
  );
});
