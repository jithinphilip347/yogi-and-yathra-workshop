"use client";

import React, { useEffect, useRef } from 'react';

/**
 * Extract just the pathname+search from a URL string for comparison.
 * This prevents a different origin (e.g. http://localhost vs http://localhost:8000)
 * from triggering video.load() for the same underlying media file.
 */
function extractPath(url) {
  if (!url) return '';
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export default function HTML5Provider({
  videoRef,
  src,
  format,
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

  useEffect(() => {
    if (!videoRef.current || !src) return;
    const prevPath = extractPath(prevSrcRef.current);
    const nextPath = extractPath(src);
    if (prevPath !== nextPath) {
      // Genuine source change — reload the media element
      prevSrcRef.current = src;
      videoRef.current.load();
    }
    // Same path, different origin (e.g. localhost vs localhost:8000) — skip reload
    // Update the ref so future comparisons use the latest URL string
    prevSrcRef.current = src;
  }, [src, videoRef]);

  if (!src) return null;

  return (
    <video
      ref={videoRef}
      className="EngineMediaElement"
      src={src}
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
