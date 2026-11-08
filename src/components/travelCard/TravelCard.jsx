"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaPlay } from "react-icons/fa";
import { FiClock, FiMapPin, FiX, FiArrowRight, FiCalendar, FiUsers } from "react-icons/fi";
import "./TravelCard.css";

const TravelCard = ({ travel }) => {
  const router = useRouter();
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  if (!travel) return null;

  const {
    id,
    slug = "",
    title = "Rishikesh Himalayan Yoga & Spiritual Retreat",
    description = "Immerse in morning Ganga aarti, sacred meditation caves, and masterclasses in the world yoga capital.",
    image,
    category = "Yoga Retreat",
    status = "Booking Open",
    destination = "Rishikesh, Himalayas",
    startDate = "15 Dec 2026",
    endDate = "20 Dec 2026",
    duration = "6 Days / 5 Nights",
    totalSlots = 20,
    bookedSlots = 14,
    price = "24,999",
    originalPrice = "29,999",
    videoUrl = "",
    link = "/traveldetails",
  } = travel;

  const targetLink = link || "/traveldetails";

  const handleCardClick = (e) => {
    // Prevent routing if clicking inside play button or video modal
    if (
      e.target.closest(".travelPlayBtn") ||
      e.target.closest(".TravelVideoModalBackdrop")
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

  const availableSlots = Math.max(0, totalSlots - bookedSlots);
  const cleanPrice = String(price).replace(/[₹\s]/g, "");
  const cleanOriginalPrice = originalPrice ? String(originalPrice).replace(/[₹\s]/g, "") : null;

  // Sample retreat preview video fallback if not provided
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
        className="travelCard"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleCardClick(e);
          }
        }}
      >
        {/* Top Thumbnail Section */}
        <div className="travelImgWrapper">
          {image && (
            <Image
              src={image}
              alt={title || "Travel Retreat"}
              fill
              className="travelImage"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}

          {/* Top-Left Category Badge */}
          {category && (
            <span className="travelCategoryBadge">{category}</span>
          )}

          {/* Top-Right Booking Status */}
          {status && (
            <span className={`travelStatusBadge ${getStatusClass(status)}`}>
              <span className="statusDot" />
              {status}
            </span>
          )}

          {/* Bottom-Left Duration Pill */}
          {duration && (
            <span className="travelDurationPill">
              <FiClock className="icon" />
              <span>{duration}</span>
            </span>
          )}

          {/* Video Play Button */}
          <button
            type="button"
            className="travelPlayBtn"
            onClick={handlePlayVideo}
            aria-label="Play travel intro video"
          >
            <FaPlay />
          </button>
        </div>

        {/* Content Body */}
        <div className="travelContent">
          {/* Destination & Date Row */}
          <div className="travelMetaHeader">
            <span className="destinationPill" title={destination}>
              <FiMapPin className="icon" />
              <span>{destination}</span>
            </span>
            <span className="datePill">
              <FiCalendar className="icon" />
              <span>{startDate}</span>
            </span>
          </div>

          {/* Title */}
          <h3 className="travelTitle" title={title}>
            <Link
              href={targetLink}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {title}
            </Link>
          </h3>

          {/* Description */}
          {description && (
            <p className="travelDesc" title={description}>
              {description}
            </p>
          )}

          {/* Slot Availability Info */}
          <div className="travelSlotBox">
            <div className="slotLabels">
              <span className="slotCount">
                <FiUsers className="icon" />
                <span><strong>{bookedSlots}/{totalSlots}</strong> Booked</span>
              </span>
              <span className={`slotRemaining ${availableSlots <= 4 ? "urgent" : ""}`}>
                {availableSlots <= 4 ? `Only ${availableSlots} Slots Left` : `${availableSlots} Slots Left`}
              </span>
            </div>
          </div>

          {/* Bottom Bar: Price & CTA Button */}
          <div className="travelBottomBox">
            <div className="travelPriceBox">
              <span className="priceLabel">Per Person</span>
              <div className="priceValue">
                <span className="currency">₹</span>
                <span className="amount">{cleanPrice}</span>
                {cleanOriginalPrice && (
                  <span className="originalPrice">₹{cleanOriginalPrice}</span>
                )}
              </div>
            </div>

            <Link
              href={targetLink}
              className="travelViewBtn"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <span>Explore Journey</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>

      {/* Video Modal Popup */}
      {isVideoOpen && (
        <div
          className="TravelVideoModalBackdrop"
          onClick={() => setIsVideoOpen(false)}
        >
          <div
            className="TravelVideoModalContent"
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
                className="TravelModalIframe"
              />
            ) : finalVideoUrl ? (
              <video
                src={finalVideoUrl}
                controls
                autoPlay
                className="TravelModalVideo"
              />
            ) : (
              <div className="NoVideoPlaceholder">
                <FaPlay style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.85 }} />
                <h4>Journey Preview Coming Soon</h4>
                <p>We are preparing the retreat teaser video for {title}.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default TravelCard;
