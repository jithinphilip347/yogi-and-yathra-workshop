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
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [src, videoRef]);

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
    >
      <source src={src} type={format === 'mov' ? 'video/quicktime' : format === 'webm' ? 'video/webm' : 'video/mp4'} />
      Your browser does not support video playback.
    </video>
  );
}
