"use client";

import React from 'react';
import HTML5Provider from './providers/HTML5Provider';
import HLSProvider from './providers/HLSProvider';
import YouTubeProvider from './providers/YouTubeProvider';
import VimeoProvider from './providers/VimeoProvider';

export default React.memo(function MediaProviderAdapter({
  videoRef,
  providerType,
  formatType,
  rawUrl,
  title,
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
  onError,
}) {
  if (!rawUrl) return null;

  switch (providerType) {
    case 'hls':
      return (
        <HLSProvider
          videoRef={videoRef}
          src={rawUrl}
          autoPlay={autoPlay}
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

    case 'youtube':
      return (
        <YouTubeProvider
          src={rawUrl}
          title={title}
        />
      );

    case 'vimeo':
      return (
        <VimeoProvider
          src={rawUrl}
          title={title}
        />
      );

    case 'html5':
    default:
      return (
        <HTML5Provider
          videoRef={videoRef}
          src={rawUrl}
          format={formatType}
          autoPlay={autoPlay}
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
});
