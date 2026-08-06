"use client";

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

/**
 * HLS provider.
 *
 * CRITICAL FIX (stale playback sync): the HLS.js instance must live exactly as
 * long as its `src`. The previous effect depended on the `onError` callback,
 * which VideoEngine passes as a fresh inline arrow on EVERY render — React then
 * ran the effect cleanup (hls.destroy()) on every re-render, and the
 * `prevSrcRef` guard prevented recreation. That tore down the HLS pipeline
 * mid-playback (stalls / buffer resets / position jumps).
 *
 * The callback is now captured via a ref so the effect only depends on `src`
 * and the (stable) `videoRef`. This makes the provider immune to parent
 * re-renders while still recreating HLS on genuine source changes.
 */
export default function HLSProvider({
  videoRef,
  src,
  autoPlay = true,
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
  onError
}) {
  const prevSrcRef = useRef(null);

  // Keep the latest error handler without making it an effect dependency.
  // The ref is refreshed after every render so the HLS error handler always
  // calls the current callback, while the media effect stays stable.
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let hls = null;
    const video = videoRef.current;

    if (!video || !src) return;
    if (prevSrcRef.current === src) return;

    prevSrcRef.current = src;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              if (onErrorRef.current) onErrorRef.current(data);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, videoRef]);

  return (
    <video
      ref={videoRef}
      className="EngineMediaElement"
      autoPlay={autoPlay}
      controlsList="nodownload"
      playsInline
      onLoadedMetadata={onLoadedMetadata}
      onLoadedData={onLoadedData}
      onCanPlay={onCanPlay}
      onPlaying={onPlaying}
      onWaiting={onWaiting}
      onDurationChange={onDurationChange}
      onProgress={onProgress}
      onTimeUpdate={onTimeUpdate}
      onSeeking={onSeeking}
      onSeeked={onSeeked}
      onPause={onPause}
      onEnded={onEnded}
      onError={onError}
    />
  );
}
