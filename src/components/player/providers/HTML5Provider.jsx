"use client";

import React, { useEffect, useRef } from 'react';
import { extractUrlKey } from '@/libs/streamRefresh';

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
    const prevKey = extractUrlKey(prevSrcRef.current);
    const nextKey = extractUrlKey(src);
    if (prevKey !== nextKey) {
      // Genuine source change — reload the media element. The key includes the
      // query string, so a refreshed signed URL (new signature/expiry) IS a
      // change and reloads; a different origin with the same path+search
      // (e.g. localhost vs localhost:8000) is the same media and skips reload.
      prevSrcRef.current = src;
      videoRef.current.load();
    }
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
