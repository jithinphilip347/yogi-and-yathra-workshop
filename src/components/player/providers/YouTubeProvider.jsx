"use client";

import React, { useEffect, useRef } from 'react';
import { loadScriptOnce } from '@/libs/scriptLoader';
import { createSyntheticPlayer } from '@/libs/syntheticPlayer';

const YT_SCRIPT = 'https://www.youtube.com/iframe_api';

let ytApiPromise = null;

function getYtApi() {
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.YT && typeof window.YT.Player === 'function') {
        resolve(window.YT);
        return;
      }
      // The IFrame API calls this global immediately once loaded.
      window.onYouTubeIframeAPIReady = () => resolve(window.YT);
      loadScriptOnce(YT_SCRIPT).catch(reject);
    });
  }
  return ytApiPromise;
}

function getVideoId(url) {
  if (!url) return '';
  if (url.includes('embed/')) {
    return url.split('embed/')[1]?.split('?')[0] || '';
  }
  if (url.includes('v=')) {
    return url.split('v=')[1]?.split('&')[0] || '';
  }
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split('?')[0] || '';
  }
  return url;
}

/**
 * YouTube provider backed by the official IFrame API.
 *
 * The SDK's real events (ready / state changes / errors) are translated into
 * the internal player contract (ready, play, pause, timeupdate, duration,
 * ended, error) via a synthetic player bound to videoRef — never faked. This
 * makes resume, seek, watched-time accounting, progress persistence and
 * auto-next work for YouTube lessons exactly like HTML5/HLS.
 */
export default function YouTubeProvider({
  src,
  title,
  videoRef,
  onLoadedMetadata,
  onLoadedData,
  onCanPlay,
  onPlaying,
  onWaiting,
  onDurationChange,
  onProgress,
  onTimeUpdate,
  onSeeking,
  onSeeked,
  onPause,
  onEnded,
  onError,
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const stateRef = useRef({ currentTime: 0, duration: 0, paused: true, playbackRate: 1 });

  // Always invoke the LATEST callbacks (parent may re-render mid-session).
  const cbRef = useRef({});
  useEffect(() => {
    cbRef.current = {
      onLoadedMetadata, onLoadedData, onCanPlay, onPlaying, onWaiting,
      onDurationChange, onProgress, onTimeUpdate, onSeeking, onSeeked,
      onPause, onEnded, onError,
    };
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !src) return;

    let cancelled = false;
    let raf = null;
    let ytPlayer = null;

    const videoId = getVideoId(src);

    getYtApi()
      .then((YT) => {
        if (cancelled) return;

        ytPlayer = new YT.Player(el, {
          videoId,
          playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
          events: {
            onReady: (e) => {
              if (cancelled) return;
              stateRef.current.duration = Number(e.target.getDuration()) || 0;

              // Bridge the REAL SDK player into the internal contract.
              const synthetic = createSyntheticPlayer(
                () => stateRef.current,
                {
                  seekTo: (seconds) => e.target.seekTo(seconds, true),
                  play: () => e.target.playVideo(),
                  pause: () => e.target.pauseVideo(),
                  setPlaybackRate: (rate) => {
                    try { e.target.setPlaybackRate(rate); } catch { /* unsupported rate */ }
                  },
                  readyState: () => 4,
                },
              );
              if (videoRef) videoRef.current = synthetic;

              // Surface the real duration + readiness into the player flow.
              cbRef.current.onLoadedMetadata?.();
              cbRef.current.onDurationChange?.();
              cbRef.current.onCanPlay?.();
              cbRef.current.onLoadedData?.();

              // Poll currentTime (rAF) so timeupdate drives the same
              // watched-time accounting used by native elements.
              const tick = () => {
                if (cancelled || !ytPlayer || !ytPlayer.getCurrentTime) return;
                stateRef.current.currentTime = Number(ytPlayer.getCurrentTime()) || 0;
                const playing = ytPlayer.getPlayerState?.() === 1;
                stateRef.current.paused = !playing;
                cbRef.current.onTimeUpdate?.();
                raf = requestAnimationFrame(tick);
              };
              raf = requestAnimationFrame(tick);
            },
            onStateChange: (e) => {
              if (cancelled) return;
              const YTNS = window.YT;
              switch (e.data) {
                case YTNS?.PlayerState?.PLAYING:
                  stateRef.current.paused = false;
                  cbRef.current.onPlaying?.();
                  break;
                case YTNS?.PlayerState?.PAUSED:
                  stateRef.current.paused = true;
                  cbRef.current.onPause?.();
                  break;
                case YTNS?.PlayerState?.ENDED:
                  stateRef.current.paused = true;
                  cbRef.current.onEnded?.();
                  break;
                case YTNS?.PlayerState?.BUFFERING:
                  cbRef.current.onWaiting?.();
                  break;
                default:
                  break;
              }
            },
            onError: () => {
              if (!cancelled) cbRef.current.onError?.();
            },
          },
        });
      })
      .catch(() => {
        // SDK failed to load (offline/CDN blocked) — surface the error so the
        // player shows the recovery UI instead of a silent dead iframe.
        if (!cancelled) cbRef.current.onError?.();
      });

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (ytPlayer && typeof ytPlayer.destroy === 'function') {
        try { ytPlayer.destroy(); } catch { /* already destroyed */ }
      }
      if (videoRef && videoRef.current && videoRef.current._synthetic) {
        videoRef.current = null;
      }
    };
  }, [src, videoRef]);

  return (
    <div
      ref={containerRef}
      className="EngineMediaElement"
      title={title || 'YouTube Video Player'}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
