"use client";

import React, { useEffect, useRef, useState } from "react";
import { FiX, FiCheckCircle } from "react-icons/fi";
import { resolveMediaUrl } from "@/utils/mediaUrl";

const getYouTubeEmbedUrl = (source) => {
  if (typeof source !== "string") return null;

  try {
    const url = new URL(source);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "youtube-nocookie.com") {
      const pathParts = url.pathname.split("/").filter(Boolean);
      const id = url.searchParams.get("v") ||
        (pathParts[0] === "embed" || pathParts[0] === "shorts" || pathParts[0] === "live"
          ? pathParts[1]
          : null);
      return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null;
    }
  } catch {
    return null;
  }

  return null;
};

const VideoPreviewPopup = ({ course, onClose }) => {
  const source = course?.demo_video_url;
  const videoUrl = resolveMediaUrl(source);
  const youtubeUrl = getYouTubeEmbedUrl(source);
  const [playbackError, setPlaybackError] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCloseRef.current?.();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const outcomes = Array.isArray(course?.learning_outcomes)
    ? course.learning_outcomes.filter((item) => typeof item === "string" && item.trim())
    : [];

  return (
    <div className="PopupOverlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="PopupContent VideoContainer" role="dialog" aria-modal="true" aria-labelledby="course-preview-title">
        <button className="CloseBtn" type="button" onClick={onClose} aria-label="Close course preview">
          <FiX />
        </button>

        <div className="VideoArea">
          {youtubeUrl ? (
            <div className="VideoWrapper">
              <iframe
                src={youtubeUrl}
                title={`${course?.title || "Course"} introduction video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ) : videoUrl && !playbackError ? (
            <video
              key={videoUrl}
              src={videoUrl}
              controls
              autoPlay
              playsInline
              preload="metadata"
              aria-label={`${course?.title || "Course"} introduction video`}
              onError={() => setPlaybackError(true)}
              className="CoursePreviewVideo"
            >
              Your browser does not support video playback.
            </video>
          ) : (
            <div className="CoursePreviewUnavailable" role="status">
              {videoUrl
                ? "The introduction video could not be played. Please try again later."
                : "An introduction video has not been added to this course yet."}
            </div>
          )}
        </div>

        <div className="PopupBodyScroll">
          <div className="VideoInfo">
            <span className="Label">Course Preview</span>
            <h2 id="course-preview-title">{course?.title || "Course Introduction"}</h2>
            {course?.short_description && <p className="ShortDesc">{course.short_description}</p>}

            {outcomes.length > 0 && (
              <div className="CourseBriefInfo">
                <h3>What you&apos;ll learn</h3>
                <ul className="Highlights">
                  {outcomes.map((outcome, index) => (
                    <li key={`${index}-${outcome}`}><FiCheckCircle /> {outcome}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewPopup;
