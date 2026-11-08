"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaPlay } from "react-icons/fa";
import { FiClock, FiMapPin, FiX, FiArrowRight, FiCalendar, FiUsers } from "react-icons/fi";
import "./EventCard.css";

const EventCard = ({ event }) => {
  const router = useRouter();
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  if (!event) return null;

  const {
    id,
    slug = "",
    title = "Sunset Beach Yoga & Meditation Workshop",
    description = "Experience inner tranquility with traditional Hatha yoga practices during the sunset.",
    image,
    category = "Offline Workshop",
    status = "Booking Open",
    date = "24 - 27 Nov 2026",
    duration = "4 Days",
    venue = "Cherai Beach",
    location = "Kochi, Kerala",
    price = "1,499",
    seats = "",
    tags = [],
    videoUrl,
    link = "/eventdetails",
  } = event;

  const targetLink = link || "/eventdetails";

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

  // Sample event preview video fallback if not provided
  const sampleFallbackVideo = "https://www.youtube.com/embed/inpok4MKVLM";
  const activeVideoUrl = videoUrl && String(videoUrl).trim() !== "" ? String(videoUrl).trim() : sampleFallbackVideo;

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
          {image && (
            <Image
              src={image}
              alt={title || "Offline Event"}
              fill
              className="eventImage"
              sizes="(max-width: 768px) 100vw, 420px"
            />
          )}

          {/* Category Badge on Image */}
          {category && (
            <span className="eventCategoryBadge">{category}</span>
          )}

          {/* Center Play Button Overlay */}
          <button
            type="button"
            className="eventPlayBtn"
            onClick={handlePlayVideo}
            aria-label="Play intro video"
          >
            <FaPlay />
          </button>
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
            <span className="eventTagItem">🌿 In-Person</span>
            {tags && tags.length > 0 && (
              <span className="eventTagItem">{tags[1] || tags[0]}</span>
            )}
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

      {/* Video Modal Popup */}
      {isVideoOpen && (
        <div
          className="EventVideoModalBackdrop"
          onClick={() => setIsVideoOpen(false)}
        >
          <div
            className="EventVideoModalContent"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="CloseModalBtn"
              onClick={() => setIsVideoOpen(false)}
              aria-label="Close video"
            >
              <FiX />
            </button>

            {isEmbedVideo ? (
              <iframe
                src={finalVideoUrl}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="EventModalIframe"
              />
            ) : finalVideoUrl ? (
              <video
                src={finalVideoUrl}
                controls
                autoPlay
                className="EventModalVideo"
              />
            ) : (
              <div className="NoVideoPlaceholder">
                <FaPlay style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.85 }} />
                <h4>Intro Video Coming Soon</h4>
                <p>We are preparing the teaser video for {title}.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default EventCard;
