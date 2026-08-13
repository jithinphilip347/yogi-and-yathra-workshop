"use client";

import React, { useEffect, useRef } from 'react';
import { loadScriptOnce } from '@/libs/scriptLoader';
import { createSyntheticPlayer } from '@/libs/syntheticPlayer';

const VIMEO_SCRIPT = 'https://player.vimeo.com/api/player.js';

let vimeoApiPromise = null;

function getVimeoApi() {
  if (!vimeoApiPromise) {
    vimeoApiPromise = new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.Vimeo && window.Vimeo.Player) {
        resolve(window.Vimeo);
        return;
      }
      loadScriptOnce(VIMEO_SCRIPT)
        .then(() => {
          if (window.Vimeo && window.Vimeo.Player) {
            resolve(window.Vimeo);
          } else {
            reject(new Error('Vimeo SDK loaded but unavailable'));
          }
        })
        .catch(reject);
    });
  }
  return vimeoApiPromise;
}

function getVimeoUrl(src) {
  if (!src) return '';
  if (src.includes('player.vimeo.com')) return src;
  const match = String(src).match(/vimeo\.com\/(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : src;
}

/**
 * Vimeo provider backed by the official Player SDK.
 *
 * The SDK's real events (ready / play / pause / timeupdate / ended / error)
 * are translated into the internal player contract via a synthetic player
 * bound to videoRef — never faked. This makes resume, seek, watched-time
 * accounting, progress persistence and auto-next work for Vimeo lessons.
 */
export default function VimeoProvider({
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
    let vimeoPlayer = null;

    getVimeoApi()
      .then((Vimeo) => {
        if (cancelled) return;

        vimeoPlayer = new Vimeo.Player(el, {
          url: getVimeoUrl(src),
          autoplay: true,
        });
        playerRef.current = vimeoPlayer;

        // Bridge the REAL SDK player into the internal contract.
        const synthetic = createSyntheticPlayer(
          () => stateRef.current,
          {
            seekTo: (seconds) => vimeoPlayer.setCurrentTime(seconds).catch(() => {}),
            play: () => vimeoPlayer.play().catch(() => {}),
            pause: () => vimeoPlayer.pause().catch(() => {}),
            setPlaybackRate: (rate) => vimeoPlayer.setPlaybackRate(rate).catch(() => {}),
            readyState: () => 4,
          },
        );
        if (videoRef) videoRef.current = synthetic;

        vimeoPlayer.on('ready', () => {
          if (cancelled) return;
          vimeoPlayer.getDuration().then((duration) => {
            stateRef.current.duration = Number(duration) || 0;
          }).catch(() => {});
          cbRef.current.onLoadedMetadata?.();
          cbRef.current.onDurationChange?.();
          cbRef.current.onCanPlay?.();
          cbRef.current.onLoadedData?.();
        });

        vimeoPlayer.on('play', () => {
          stateRef.current.paused = false;
          cbRef.current.onPlaying?.();
        });

        vimeoPlayer.on('pause', () => {
          stateRef.current.paused = true;
          cbRef.current.onPause?.();
        });

        vimeoPlayer.on('ended', () => {
          stateRef.current.paused = true;
          cbRef.current.onEnded?.();
        });

        vimeoPlayer.on('timeupdate', (data) => {
          if (cancelled) return;
          stateRef.current.currentTime = Number(data?.seconds) || 0;
          if (data?.duration) {
            stateRef.current.duration = Number(data.duration) || 0;
          }
          cbRef.current.onTimeUpdate?.();
        });

        vimeoPlayer.on('error', () => {
          if (!cancelled) cbRef.current.onError?.();
        });
      })
      .catch(() => {
        // SDK failed to load (offline/CDN blocked) — surface the error so the
        // player shows the recovery UI instead of a silent dead iframe.
        if (!cancelled) cbRef.current.onError?.();
      });

    return () => {
      cancelled = true;
      if (vimeoPlayer && typeof vimeoPlayer.destroy === 'function') {
        try { vimeoPlayer.destroy(); } catch { /* already destroyed */ }
      }
      playerRef.current = null;
      if (videoRef && videoRef.current && videoRef.current._synthetic) {
        videoRef.current = null;
      }
    };
  }, [src, videoRef]);

  return (
    <div
      ref={containerRef}
      className="EngineMediaElement"
      title={title || 'Vimeo Video Player'}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
