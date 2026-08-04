"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
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

import courseApi from '@/libs/courseApi';
import HTML5Provider from './providers/HTML5Provider';
import HLSProvider from './providers/HLSProvider';
import YouTubeProvider from './providers/YouTubeProvider';
import VimeoProvider from './providers/VimeoProvider';

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

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

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [activeStreamUrl, setActiveStreamUrl] = useState('');
  const [activeProvider, setActiveProvider] = useState('html5');
  const [activeFormat, setActiveFormat] = useState('mp4');

  // Auto-Next Countdown
  const [autoNextCountdown, setAutoNextCountdown] = useState(null);
  const countdownTimerRef = useRef(null);

  const resolveStreamUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    if (cleanPath.startsWith('storage/')) {
      return `http://localhost:8000/${cleanPath}`;
    }
    return `http://localhost:8000/storage/${cleanPath}`;
  };

  function strtolower(str) {
    return typeof str === 'string' ? str.toLowerCase() : '';
  }

  // Fetch signed stream payload or resolve direct URL on lesson change
  useEffect(() => {
    if (!lesson?.id) return;
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setAutoNextCountdown(null);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    courseApi.getLessonStream(lesson.id)
      .then((res) => {
        const data = res.data?.data || res.data;
        if (isMounted && data?.stream_url) {
          setActiveStreamUrl(resolveStreamUrl(data.stream_url));
          setActiveProvider(data.provider || 'html5');
          setActiveFormat(data.format || 'mp4');
          setIsLoading(false);
        } else if (isMounted) {
          const direct = resolveStreamUrl(lesson.video_url);
          setActiveStreamUrl(direct);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Stream endpoint fallback to direct URL:", err);
        if (isMounted) {
          if (lesson?.video_url) {
            setActiveStreamUrl(resolveStreamUrl(lesson.video_url));
            setIsLoading(false);
          } else {
            setHasError(true);
            setIsLoading(false);
          }
        }
      });

    return () => { isMounted = false; };
  }, [lesson?.id, lesson?.video_url]);

  useEffect(() => {
    if (typeof onRegisterPlayerCallbacks === 'function') {
      onRegisterPlayerCallbacks({
        getCurrentTime: () => currentTime,
        seekTo: (seconds) => {
          if (videoRef.current) {
            videoRef.current.currentTime = seconds;
            setCurrentTime(seconds);
            videoRef.current.play().catch(() => {});
          }
        }
      });
    }
  }, [currentTime, onRegisterPlayerCallbacks]);

  const rawUrl = activeStreamUrl || resolveStreamUrl(lesson?.video_url);
  const lessonType = strtolower(lesson?.type || '');
  let providerType = activeProvider || 'html5';
  let formatType = activeFormat || 'mp4';

  if (rawUrl.includes('.m3u8') || lessonType === 'hls') {
    providerType = 'hls';
    formatType = 'm3u8';
  } else if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be') || lessonType === 'youtube') {
    providerType = 'youtube';
    formatType = 'youtube';
  } else if (rawUrl.includes('vimeo.com') || lessonType === 'vimeo') {
    providerType = 'vimeo';
    formatType = 'vimeo';
  } else if (rawUrl.includes('.mov')) {
    providerType = 'html5';
    formatType = 'mov';
  } else if (rawUrl.includes('.webm')) {
    providerType = 'html5';
    formatType = 'webm';
  }

  // Unified Play / Pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [isPlaying]);

  // Unified Seek
  const handleSeek = (e) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  // Unified Volume
  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  // Unified Speed Selector
  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Picture-in-Picture Toggle
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (err) {
      console.warn('PiP not supported or failed:', err);
    }
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in form inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5);
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
  }, [togglePlay, duration]);

  // Video Events
  const handleLoadedMetadata = () => {
    setIsLoading(false);
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      videoRef.current.playbackRate = playbackSpeed;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime || 0);
      setIsPlaying(!videoRef.current.paused);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);

    // Auto Next Countdown
    if (nextLesson && courseSlug) {
      setAutoNextCountdown(5);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      countdownTimerRef.current = setInterval(() => {
        setAutoNextCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            router.push(`/course/${courseSlug}/learn/${nextLesson.id}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const cancelAutoNext = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setAutoNextCountdown(null);
  };

  const handlePlayNextImmediately = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (nextLesson && courseSlug) {
      router.push(`/course/${courseSlug}/learn/${nextLesson.id}`);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={playerContainerRef}
      className="VideoEngineContainer"
      tabIndex={0}
      style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', backgroundColor: '#000', overflow: 'hidden' }}
    >
      {/* Auto Next Countdown Modal */}
      {autoNextCountdown !== null && autoNextCountdown > 0 && (
        <div className="AutoNextOverlay" style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(11, 15, 25, 0.92)',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primaryColor, #874429)', marginBottom: '8px' }}>
            Up Next in {autoNextCountdown}s
          </h4>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', textAlign: 'center', padding: '0 20px' }}>
            {nextLesson?.title || 'Next Lesson'}
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handlePlayNextImmediately}
              style={{
                backgroundColor: 'var(--primaryColor, #874429)',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontWeight: '600',
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
                backgroundColor: 'transparent',
                color: '#9ca3af',
                border: '1px solid #374151',
                padding: '10px 20px',
                borderRadius: '6px',
                fontWeight: '500',
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
              backgroundColor: 'var(--primaryColor, #874429)',
              color: '#ffffff',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '6px',
              fontWeight: '600',
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
          onTimeUpdate={handleTimeUpdate}
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
          onTimeUpdate={handleTimeUpdate}
          onPause={handlePause}
          onEnded={handleEnded}
          onError={() => setHasError(true)}
        />
      )}

      {/* Custom Control Bar for Direct & HLS Streams */}
      {['html5', 'hls'].includes(providerType) && !hasError && (
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
            value={currentTime}
            onChange={handleSeek}
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
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Speed Selector */}
              <select
                value={playbackSpeed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                style={{
                  backgroundColor: '#1f2937',
                  color: '#fff',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {SPEED_OPTIONS.map((speed) => (
                  <option key={speed} value={speed}>
                    {speed}x
                  </option>
                ))}
              </select>

              {/* PiP */}
              <button onClick={togglePiP} title="Picture in Picture" style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>
                <FiAirplay />
              </button>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} title="Fullscreen" style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>
                {isFullscreen ? <FiMinimize /> : <FiMaximize />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
