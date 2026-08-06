"use client";

import React, { useEffect, useRef } from 'react';

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
    if (videoRef.current && src && prevSrcRef.current !== src) {
      prevSrcRef.current = src;
      videoRef.current.load();
    }
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
