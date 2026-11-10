"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaPlay } from "react-icons/fa";
import { FiMapPin, FiX, FiArrowRight, FiCalendar, FiUsers } from "react-icons/fi";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import "./EventCard.css";

const EventCard = ({ event }) => {
  const router = useRouter();
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  if (!event) return null;

  const {
    id,
    slug,
    title = "",
    image,
    category = "",
    status = "",
    date = "",
    duration = "",
    venue = "",
    location = "",
    price = "",
    seats = "",
    videoUrl = "",
    link,
  } = event;

  const targetLink = link || (slug || id ? `/event/${encodeURIComponent(slug || id)}` : "/event");

  const handleCardClick = (e) => {
    // If clicked inside play button or video modal, don't navigate
    if (
      e.target.closest(".eventPlayBtn") ||
      e.target.closest(".EventVideoModalBackdrop")
    ) {
      return;
    }
    router.push(targetLink);
  };

  const handlePlayVideo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVideoOpen(true);
  };

  const getStatusClass = (st) => {
    const s = String(st || "").toLowerCase();
    if (s.includes("almost") || s.includes("full")) return "status-warning";
    if (s.includes("open")) return "status-open";
    return "status-upcoming";
  };

  const fullLocation = venue ? `${venue}, ${location}` : location;
  const cleanPrice = String(price).replace(/[₹\s]/g, "");

  const activeVideoUrl = videoUrl ? resolveMediaUrl(videoUrl, "") : "";

  const formatVideoUrl = (url) => {
    if (!url) return "";
    const trimmed = url.trim();
    if (trimmed.includes("youtube.com/embed/")) {
      return trimmed.includes("autoplay=1")
        ? trimmed
        : `${trimmed}${trimmed.includes("?") ? "&" : "?"}autoplay=1`;
    }
    const ytMatch = trimmed.match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }
    return trimmed;
  };

  const finalVideoUrl = formatVideoUrl(activeVideoUrl);
  const isEmbedVideo = finalVideoUrl.includes("youtube.com") || finalVideoUrl.includes("player.vimeo.com");

  return (
    <>
      <div
        className="eventCard horizontalEventCard"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleCardClick(e);
          }
        }}
      >
        {/* Left: Thumbnail & Badges */}
        <div className="eventImgWrapper">
          {isVideoOpen ? (
            <div className="cardInlineVideoWrapper" onClick={(e) => e.stopPropagation()}>
              {isEmbedVideo ? <iframe src={finalVideoUrl} title={`${title} introduction`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="cardInlineVideoPlayer" /> : <video src={finalVideoUrl} controls autoPlay playsInline className="cardInlineVideoPlayer" />}
              <button
                type="button"
                className="cardCloseVideoBtn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVideoOpen(false);
                }}
                aria-label="Close video"
              >
                <FiX />
              </button>
            </div>
          ) : (
            <>
              {image && (
                <img src={resolveMediaUrl(image, "")} alt={title || "Offline Event"} className="eventImage" />
              )}

              {/* Category Badge on Image */}
              {category && (
                <span className="eventCategoryBadge">{category}</span>
              )}

              {/* Center Play Button Overlay */}
              {videoUrl && <button
                type="button"
                className="eventPlayBtn"
                onClick={handlePlayVideo}
                aria-label="Play intro video"
              >
                <FaPlay />
              </button>}
            </>
          )}
        </div>

        {/* Right: Content Area */}
        <div className="eventContent">
          {/* 1. Header: Schedule Pill + Status Badge */}
          <div className="eventMetaHeader">
            <div className="eventSchedulePill">
              <FiCalendar className="icon" />
              <span>{date}</span>
              {duration && (
                <>
                  <span className="dotDivider">•</span>
                  <span className="durationBadge">{duration}</span>
                </>
              )}
            </div>

            {status && (
              <span className={`eventStatusBadge ${getStatusClass(status)}`}>
                <span className="statusDot" />
                {status}
              </span>
            )}
          </div>

          {/* 2. Event Title */}
          <h3 className="eventTitle" title={title}>
            <Link
              href={targetLink}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {title}
            </Link>
          </h3>

          {/* 3. Venue & Location */}
          <div className="eventVenueRow" title={fullLocation}>
            <FiMapPin className="venueIcon" />
            <span className="venueText">
              {venue && <strong>{venue}, </strong>}
              <span>{location}</span>
            </span>
          </div>

          {/* 4. Event Perks / Tags */}
          <div className="eventTagsRow">
            {seats && (
              <span className="eventTagItem seatsHighlight">
                <FiUsers className="tagIcon" /> {seats}
              </span>
            )}
          </div>

          {/* 5. Bottom Ticket Bar: Price & Book Button */}
          <div className="eventBottomBox">
            <div className="eventPriceBox">
              <span className="priceLabel">Event Pass</span>
              <div className="priceValue">
                <span className="currency">₹</span>
                <span className="amount">{cleanPrice}</span>
                <span className="perUnit">/ spot</span>
              </div>
            </div>

            <Link
              href={targetLink}
              className="eventViewBtn"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <span>Book Your Spot</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventCard;
