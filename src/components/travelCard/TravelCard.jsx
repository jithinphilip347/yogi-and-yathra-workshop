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
    slug,
    title = "",
    description = "",
    image,
    categoryName = "",
    statusName = "",
    destination = "",
    startDate = "",
    duration = "",
    totalSlots = null,
    bookedSlots = 0,
    availableSlots: availableFromApi = null,
    price = "",
    originalPrice = "",
    videoUrl = "",
    link = slug || id ? `/travel/${encodeURIComponent(slug || id)}` : "/travel",
  } = travel;

  const targetLink = link || "/travel/travel-details";

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

  const availableSlots = availableFromApi == null ? (totalSlots == null ? null : Math.max(0, totalSlots - bookedSlots)) : availableFromApi;
  const cleanPrice = String(price).replace(/[₹\s]/g, "");
  const cleanOriginalPrice = originalPrice ? String(originalPrice).replace(/[₹\s]/g, "") : null;

  const activeVideoUrl = videoUrl ? String(videoUrl).trim() : "";

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
          {isVideoOpen ? (
            <div className="cardInlineVideoWrapper" onClick={(e) => e.stopPropagation()}>
                {finalVideoUrl.includes("youtube.com/embed") || finalVideoUrl.includes("player.vimeo.com")
                  ? <iframe src={finalVideoUrl} title={`${title} introduction`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="cardInlineVideoPlayer" />
                  : <video src={finalVideoUrl} controls autoPlay playsInline className="cardInlineVideoPlayer" />}
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
                <Image
                  src={image}
                  alt={title || "Travel Retreat"}
                  fill
                  className="travelImage"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              )}

              {/* Top-Left Category Badge */}
              {categoryName && (
                <span className="travelCategoryBadge">{categoryName}</span>
              )}

              {/* Top-Right Booking Status */}
              {statusName && (
                <span className={`travelStatusBadge ${getStatusClass(statusName)}`}>
                  <span className="statusDot" />
                  {statusName}
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
              {activeVideoUrl && <button
                type="button"
                className="travelPlayBtn"
                onClick={handlePlayVideo}
                aria-label="Play travel intro video"
              >
                <FaPlay />
              </button>}
            </>
          )}
        </div>

        {/* Content Body */}
        <div className="travelContent">
          {/* Destination & Date Row */}
          <div className="travelMetaHeader">
            <span className="travelDestination destinationPill" title={destination}>
              <FiMapPin className="icon" />
              <span>{destination}</span>
            </span>
            <span className="travelDates datePill">
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
            <p className="travelDescription travelDesc" title={description}>
              {description}
            </p>
          )}

          {/* Slot Availability Info */}
          <div className="travelSlotBox">
            <div className="slotLabels">
              {totalSlots != null && <span className="slotCount">
                <FiUsers className="icon" />
                <span><strong>{bookedSlots}/{totalSlots}</strong> Booked</span>
              </span>}
              <span className={`slotRemaining ${availableSlots != null && availableSlots <= 4 ? "urgent" : ""}`}>
                {availableSlots == null ? "Availability not limited" : availableSlots <= 4 ? `Only ${availableSlots} Slots Left` : `${availableSlots} Slots Left`}
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
    </>
  );
};

export default TravelCard;
