"use client";

import React, { useEffect } from 'react';
import Hls from 'hls.js';

export default function HLSProvider({
  videoRef,
  src,
  autoPlay = true,
  onLoadedMetadata,
  onTimeUpdate,
  onPause,
  onEnded,
  onError
}) {
  useEffect(() => {
    let hls = null;
    const video = videoRef.current;

    if (!video || !src) return;

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
              if (onError) onError(data);
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
  }, [src, videoRef, onError]);

  return (
    <video
      ref={videoRef}
      className="EngineMediaElement"
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
