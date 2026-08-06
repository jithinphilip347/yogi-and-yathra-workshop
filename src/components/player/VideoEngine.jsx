"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiPlay, 
  FiPause, 
  FiVolume2, 
  FiVolumeX, 
  FiMaximize, 
  FiMinimize, 
  FiRotateCcw, 
  FiAirplay, 
  FiChevronRight, 
  FiAlertCircle, 
  FiRefreshCw 
} from 'react-icons/fi';

import { playerDebug } from '@/libs/playbackSync';
import HTML5Provider from './providers/HTML5Provider';
import HLSProvider from './providers/HLSProvider';
import YouTubeProvider from './providers/YouTubeProvider';
import VimeoProvider from './providers/VimeoProvider';
import ControlBar from './ControlBar';
import PlaybackDebugOverlay from './PlaybackDebugOverlay';

import { usePlaybackSession } from './controllers/usePlaybackSession';
import { usePlaybackController } from './controllers/usePlaybackController';
import { useSeekController } from './controllers/useSeekController';
import { usePlaybackResume } from './controllers/usePlaybackResume';
import { usePlaybackProgress } from './controllers/usePlaybackProgress';
import { useProviderController } from './controllers/useProviderController';
import { useAutoNextController } from './controllers/useAutoNextController';
import { useAnalyticsController } from './controllers/useAnalyticsController';

export default function VideoEngine({
  lesson,
  nextLesson,
  courseSlug,
  permissions,
  onProgressUpdated,
  onRegisterPlayerCallbacks
}) {
  const router = useRouter();
  const playerContainerRef = useRef(null);
  const videoRef = useRef(null);

  // Phase 4/6/7 instrumentation refs
  const prevVideoElementRef = useRef(null);
  const prevLessonRef = useRef(null);
  const lastDebugSecondRef = useRef(-1);
  const lastProgressDebugRef = useRef(0);

  // 1. Session Controller
  const {
    playbackSessionRef,
    initSession,
  } = usePlaybackSession();

  // 2. Analytics Controller
  const { logAnalytics } = useAnalyticsController({ lessonId: lesson?.id });

  // 3. Playback Controller
  const {
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    volume,
    isMuted,
    playbackSpeed,
    isFullscreen,
    isPiPActive,
    isLoading,
    setIsLoading,
    hasError,
    setHasError,
    togglePlay,
    handleVolumeChange,
    toggleMute,
    handleSpeedChange,
    toggleFullscreen,
    togglePiP,
  } = usePlaybackController({ videoRef, playerContainerRef, logAnalytics });

  // 4. Resume Controller
  const {
    hasResumedLessonIdRef,
    attemptResume,
  } = usePlaybackResume();

  // 5. Progress Controller
  const {
    lastSavedPosRef,
    activeWatchedSecondsRef,
    lastTimeRef,
    progressTimerRef,
    flushProgress,
  } = usePlaybackProgress({
    lesson,
    duration,
    isPlaying,
    videoRef,
    playbackSessionRef,
    onProgressUpdated,
  });

  // 6. Seek Controller
  const {
    isSeekingRef,
    seekingTime,
    pendingSeekRef,
    committedSeekRef,
    seekGuardTimerRef,
    applySeek,
    requestSeek,
    applyPendingSeek,
    handleSeekStart,
    handleSeeking,
    handleSeeked,
    handleSeekChange,
    handleSeekCommit,
    handleSeekPreviewCommit,
  } = useSeekController({
    videoRef,
    playbackSessionRef,
    lessonId: lesson?.id,
    setCurrentTime,
    hasResumedLessonIdRef,
    flushProgress,
    logAnalytics,
  });

  // 7. Auto Next Controller
  const {
    autoNextCountdown,
    setAutoNextCountdown,
    countdownTimerRef,
    triggerAutoNext,
    cancelAutoNext,
    handlePlayNextImmediately,
  } = useAutoNextController({ nextLesson, courseSlug, router });

  // 8. Provider Controller
  const {
    rawUrl,
    providerType,
    formatType,
  } = useProviderController({
    lesson,
    setIsLoading,
    setHasError,
    setIsPlaying,
    setCurrentTime,
    setAutoNextCountdown,
    countdownTimerRef,
    initSession,
    lastSavedPosRef,
    activeWatchedSecondsRef,
    lastTimeRef,
    pendingSeekRef,
    committedSeekRef,
    seekGuardTimerRef,
  });

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) requestSeek(Math.max(0, videoRef.current.currentTime - 5), 'keyboard-back');
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current) requestSeek(Math.min(duration, videoRef.current.currentTime + 5), 'keyboard-forward');
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, duration, toggleFullscreen, toggleMute, requestSeek]);

  // Callback registration
  useEffect(() => {
    if (typeof onRegisterPlayerCallbacks === 'function') {
      onRegisterPlayerCallbacks({
        getCurrentTime: () => (videoRef.current ? videoRef.current.currentTime || 0 : 0),
        seekTo: (seconds) => {
          requestSeek(seconds, 'tabs-seek');
          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
        }
      });
    }
  }, [onRegisterPlayerCallbacks, requestSeek]);

  // Phase 4 — video element identity
  useEffect(() => {
    const el = videoRef.current;
    const changed = el !== prevVideoElementRef.current;
    prevVideoElementRef.current = el;
    playerDebug.videoIdentity({ lessonId: lesson?.id, videoEl: el, elementChanged: changed });
  });

  // Phase 3/7 — lesson object identity
  useEffect(() => {
    const prev = prevLessonRef.current;
    prevLessonRef.current = lesson;
    if (prev && lesson && prev !== lesson) {
      const changedFields = ['id', 'title', 'last_position_seconds', 'percentage_watched', 'watched_seconds', 'status', 'is_completed']
        .filter((f) => prev[f] !== lesson[f]);
      playerDebug.lessonIdentity({ lessonId: lesson.id, prevRef: prev, nextRef: lesson, changedFields });
    }
  });

  // Video Media Events
  const handleLoadedMetadata = useCallback(() => {
    playerDebug.mediaEvent({ name: 'loadedmetadata', video: videoRef.current });
    attemptResume({
      lesson,
      videoRef,
      playbackSessionRef,
      applySeek,
      applyPendingSeek,
      setCurrentTime,
      setDuration,
      playbackSpeed,
    });
  }, [lesson, videoRef, playbackSessionRef, applySeek, applyPendingSeek, setCurrentTime, setDuration, playbackSpeed, attemptResume]);

  const handleTimeUpdate = useCallback(() => {
    const session = playbackSessionRef.current;
    if (session) session.resumed = true;

    if (videoRef.current && !isSeekingRef.current && !videoRef.current.seeking) {
      const vTime = videoRef.current.currentTime || 0;
      const prev = lastTimeRef.current;
      const delta = vTime - prev;

      if (delta > 0 && delta < 3 && !videoRef.current.paused) {
        activeWatchedSecondsRef.current += delta;
      }
      lastTimeRef.current = vTime;

      const dbgSec = Math.floor(vTime);
      if (dbgSec !== lastDebugSecondRef.current) {
        lastDebugSecondRef.current = dbgSec;
        playerDebug.mediaEvent({ name: 'timeupdate', video: videoRef.current });
      }

      setCurrentTime(vTime);
      setIsPlaying(!videoRef.current.paused);
    }
  }, [videoRef, isSeekingRef, playbackSessionRef, lastTimeRef, activeWatchedSecondsRef, setCurrentTime, setIsPlaying]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    playerDebug.mediaEvent({ name: 'pause', video: videoRef.current });
    flushProgress();
    logAnalytics('pause', { time: currentTime });
  }, [setIsPlaying, videoRef, flushProgress, logAnalytics, currentTime]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    playerDebug.mediaEvent({ name: 'ended', video: videoRef.current });
    const finalDur = Math.floor(videoRef.current?.duration || duration || 0);
    flushProgress(finalDur);
    logAnalytics('ended');
    triggerAutoNext();
  }, [setIsPlaying, videoRef, duration, flushProgress, logAnalytics, triggerAutoNext]);

  const handleLoadedData = useCallback(() => {
    playerDebug.mediaEvent({ name: 'loadeddata', video: videoRef.current });
  }, [videoRef]);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
    playerDebug.mediaEvent({ name: 'canplay', video: videoRef.current });
    applyPendingSeek();
  }, [videoRef, setIsLoading, applyPendingSeek]);

  const handlePlaying = useCallback(() => {
    setIsLoading(false);
    setIsPlaying(true);
    playerDebug.mediaEvent({ name: 'playing', video: videoRef.current });
  }, [videoRef, setIsLoading, setIsPlaying]);

  const handleWaiting = useCallback(() => {
    playerDebug.mediaEvent({ name: 'waiting', video: videoRef.current });
  }, [videoRef]);

  const handleDurationChange = useCallback(() => {
    playerDebug.mediaEvent({ name: 'durationchange', video: videoRef.current });
  }, [videoRef]);

  const handleProgress = useCallback(() => {
    const nowMs = Date.now();
    if (nowMs - lastProgressDebugRef.current > 2000) {
      lastProgressDebugRef.current = nowMs;
      playerDebug.mediaEvent({ name: 'progress', video: videoRef.current });
    }
  }, [videoRef]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [setHasError, setIsLoading, videoRef]);

  return (
    <div
      ref={playerContainerRef}
      className={`VideoEngineRoot ${isFullscreen ? 'IsFullscreen' : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Loading Overlay */}
      {isLoading && !hasError && (
        <div className="EngineLoadingOverlay" style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(11, 15, 25, 0.7)',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <FiRefreshCw className="SpinIcon" style={{ fontSize: '32px', marginBottom: '12px' }} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Loading Video Stream...</span>
        </div>
      )}

      {/* Auto-Next Countdown Overlay */}
      {autoNextCountdown !== null && (
        <div className="AutoNextOverlay" style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(11, 15, 25, 0.92)',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          textAlign: 'center',
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Up Next</h3>
          <p style={{ fontSize: '15px', color: '#cbd5e1', marginBottom: '16px', maxWidth: '400px' }}>
            {nextLesson?.title || 'Next Lesson'}
          </p>

          <div style={{
            fontSize: '48px',
            fontWeight: '700',
            color: 'var(--primaryColor, #874429)',
            marginBottom: '24px'
          }}>
            {autoNextCountdown}s
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handlePlayNextImmediately}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--primaryColor, #874429)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Play Now</span>
              <FiChevronRight />
            </button>
            <button
              onClick={cancelAutoNext}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                color: '#9ca3af',
                border: '1px solid #4b5563',
                borderRadius: '8px',
                fontWeight: '500',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Network Error Recovery Modal */}
      {hasError && (
        <div className="ErrorOverlay" style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(11, 15, 25, 0.95)',
          zIndex: 35,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          textAlign: 'center',
          padding: '24px'
        }}>
          <FiAlertCircle style={{ fontSize: '42px', color: '#ef4444', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Video Playback Error</h3>
          <p style={{ fontSize: '14px', color: '#9ca3af', maxWidth: '380px', marginBottom: '20px' }}>
            Unable to stream this video. Please check your network connection or try reloading.
          </p>
          <button
            onClick={handleRetry}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FiRefreshCw />
            <span>Retry Playback</span>
          </button>
        </div>
      )}

      {/* Render Selected Provider */}
      {providerType === 'hls' ? (
        <HLSProvider
          videoRef={videoRef}
          src={rawUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onLoadedData={handleLoadedData}
          onCanPlay={handleCanPlay}
          onPlaying={handlePlaying}
          onWaiting={handleWaiting}
          onDurationChange={handleDurationChange}
          onProgress={handleProgress}
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onSeeked={handleSeeked}
          onPause={handlePause}
          onEnded={handleEnded}
          onError={() => setHasError(true)}
        />
      ) : providerType === 'youtube' ? (
        <YouTubeProvider src={rawUrl} title={lesson?.title} />
      ) : providerType === 'vimeo' ? (
        <VimeoProvider src={rawUrl} title={lesson?.title} />
      ) : (
        <HTML5Provider
          videoRef={videoRef}
          src={rawUrl}
          format={formatType}
          onLoadedMetadata={handleLoadedMetadata}
          onLoadedData={handleLoadedData}
          onCanPlay={handleCanPlay}
          onPlaying={handlePlaying}
          onWaiting={handleWaiting}
          onDurationChange={handleDurationChange}
          onProgress={handleProgress}
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onSeeked={handleSeeked}
          onPause={handlePause}
          onEnded={handleEnded}
          onError={() => setHasError(true)}
        />
      )}

      {/* Custom Control Bar for Direct & HLS Streams */}
      {['html5', 'hls'].includes(providerType) && !hasError && (
        <ControlBar
          isPlaying={isPlaying}
          currentTime={currentTime}
          seekingTime={seekingTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          playbackSpeed={playbackSpeed}
          isFullscreen={isFullscreen}
          isPiPActive={isPiPActive}
          togglePlay={togglePlay}
          handleVolumeChange={handleVolumeChange}
          toggleMute={toggleMute}
          handleSpeedChange={handleSpeedChange}
          toggleFullscreen={toggleFullscreen}
          togglePiP={togglePiP}
          handleSeekStart={handleSeekStart}
          handleSeekChange={handleSeekChange}
          handleSeekCommit={handleSeekCommit}
          handleSeekPreviewCommit={handleSeekPreviewCommit}
        />
      )}

      {/* Development Single Source of Truth Debug Overlay (Ctrl+Shift+D to toggle) */}
      <PlaybackDebugOverlay
        videoRef={videoRef}
        playbackSessionRef={playbackSessionRef}
        providerType={providerType}
        lessonId={lesson?.id}
      />
    </div>
  );
}
