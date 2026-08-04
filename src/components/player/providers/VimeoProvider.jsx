"use client";

import React from 'react';

export default function VimeoProvider({ src, title }) {
  const getVimeoEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('player.vimeo.com')) return url;
    const match = url.match(/vimeo\.com\/(\d+)/);
    const videoId = match ? match[1] : '';
    return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : url;
  };

  return (
    <iframe
      className="EngineMediaElement"
      src={getVimeoEmbedUrl(src)}
      title={title || 'Vimeo Video Player'}
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      style={{ border: 'none', width: '100%', height: '100%' }}
    />
  );
}
