"use client";

import React from 'react';
import { 
  FiPlay, 
  FiPause, 
  FiVolume2, 
  FiVolumeX, 
  FiMaximize, 
  FiMinimize, 
  FiAirplay,
  FiRotateCcw,
  FiSettings,
  FiMessageSquare,
  FiEdit3
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
  onRewind,
}) {
  const formatTime = (secs) => {
    if (isNaN(secs) || secs === null || secs === undefined) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="CustomControlsBar">
      {/* 1. Full-width Progress Seek Slider */}
      <div className="SliderContainer">
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
          className="SeekRangeInput"
        />
      </div>

      {/* 2. Controls Action Row */}
      <div className="ControlsActionsRow">
        {/* Left Side Group */}
        <div className="ControlsGroup Left">
          {/* Play / Pause */}
          <button className="ControlBtn PlayPause" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>

          {/* Rewind 15s */}
          <button className="ControlBtn Rewind" onClick={onRewind} title="Rewind 15 seconds">
            <FiRotateCcw />
            <span className="RewindText">15s</span>
          </button>

          {/* Playback Speed dial */}
          <div className="SpeedSelectorContainer">
            <select
              value={playbackSpeed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="SpeedSelectorSelect"
              title="Playback Speed"
            >
              {SPEED_OPTIONS.map((speed) => (
                <option key={speed} value={speed}>
                  {speed === 1 ? '1x' : `${speed}x`}
                </option>
              ))}
            </select>
          </div>

          {/* Time Display */}
          <span className="ControlTimeDisplay">
            {formatTime(seekingTime !== null ? seekingTime : currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Right Side Group */}
        <div className="ControlsGroup Right">
          {/* Volume Control */}
          <div className="VolumeControlGroup">
            <button className="ControlBtn MuteToggle" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
              {isMuted ? <FiVolumeX /> : <FiVolume2 />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="VolumeRangeInput"
              title="Volume"
            />
          </div>

          {/* Notes shortcut button */}
          <button className="ControlBtn NotesBtn" title="Add Note">
            <FiEdit3 />
          </button>

          {/* Captions shortcut button */}
          <button className="ControlBtn CaptionsBtn" title="Toggle Captions">
            <FiMessageSquare />
          </button>

          {/* Settings shortcut button */}
          <button className="ControlBtn SettingsBtn" title="Settings">
            <FiSettings />
          </button>

          {/* Picture-in-Picture */}
          <button className="ControlBtn PiPBtn" onClick={togglePiP} title="Picture in Picture">
            <FiAirplay />
          </button>

          {/* Fullscreen */}
          <button className="ControlBtn FullscreenBtn" onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            {isFullscreen ? <FiMinimize /> : <FiMaximize />}
          </button>
        </div>
      </div>
    </div>
  );
});
