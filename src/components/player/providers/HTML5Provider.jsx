"use client";

import React, { useEffect } from 'react';

export default function HTML5Provider({
  videoRef,
  src,
  format,
  autoPlay = true,
  onLoadedMetadata,
  onTimeUpdate,
  onPause,
  onEnded,
  onError
}) {
  useEffect(() => {
    if (videoRef.current && src) {
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
      onTimeUpdate={onTimeUpdate}
      onPause={onPause}
      onEnded={onEnded}
      onError={onError}
    />
  );
}
