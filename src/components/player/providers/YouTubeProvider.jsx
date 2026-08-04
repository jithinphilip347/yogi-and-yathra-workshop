"use client";

import React from 'react';

export default function YouTubeProvider({ src, title }) {
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('embed/')) return url;
    let videoId = '';
    if (url.includes('v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0` : url;
  };

  return (
    <iframe
      className="EngineMediaElement"
      src={getYouTubeEmbedUrl(src)}
      title={title || 'YouTube Video Player'}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      style={{ border: 'none', width: '100%', height: '100%' }}
    />
  );
}
