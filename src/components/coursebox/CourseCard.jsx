

"use client";
import React, { useState } from "react";
import "./CourseCard.css";

import Image from "next/image";
import CourseCardSkeleton from "./CourseCardSkeleton";
import useWishlist from "@/hooks/useWishlist";
import Link from "next/link";

const CourseCard = ({
  image,
  title,
  lessons,
  duration,
  price,
  wishlistIcon,
  lessonsIcon,
  clockIcon,
  dateIcon,
  dateFormat,
  time,
  timeIcon,
  dotsIcon,
  liveText,
  priceIcon,
  oldPriceIcon,
  lessonsLabel,
  ratingIcon,
  userIcon,
  instructorLabel,
  oldPrice,
  rating,
  students,
  instructorImg,
  instructorName,
  buttonText = "View Details",
  onClick,
  loading = false,
  tutorImageSize = "small",
  type="course",
  id,
  slug
}) => {
  const [btnLoading, setBtnLoading] = useState(false);
  const [failedInstructorImg, setFailedInstructorImg] = useState(null);
  const instructorImageFailed = failedInstructorImg === instructorImg;
  const numericPrice = Number(String(price ?? "").replace(/[^\d.-]/g, ""));
  const numericOldPrice = Number(String(oldPrice ?? "").replace(/[^\d.-]/g, ""));
  const showOldPrice = Number.isFinite(numericOldPrice) && numericOldPrice > numericPrice && numericOldPrice > 0;
  const hasPrice = price !== null && price !== undefined && price !== "";
  const hasRating = rating !== null && rating !== undefined && rating !== "";
  const hasStudents = students !== null && students !== undefined && students !== "";
  const normalizedType = String(type || "course").toLowerCase();
  const typeLabel = normalizedType === "daily_class" || normalizedType === "dailyclass"
    ? "Daily Class"
    : normalizedType === "live_section" || normalizedType === "livesection"
      ? "Live Section"
      : "Course";
  const detailsHref = normalizedType === "live_section" || normalizedType === "livesection"
    ? `/live-section/${id}/${slug}`
    : normalizedType === "course"
      ? `/course/${slug}/${id}`
      : `/daily-class/${id}/${slug}`;

  const handleClick = () => {
    setBtnLoading(true);
    setTimeout(() => {
      setBtnLoading(false);
      onClick && onClick();
    }, 800);
  };

  const { handleWishlist, findWishlistIcon } = useWishlist();

  return (
    <div
      className="courseCard"
      onClick={(event) => {
        if (loading || event.target.closest("a, button")) return;
        window.location.assign(detailsHref);
      }}
      onKeyDown={(event) => {
        if (loading || event.target !== event.currentTarget || !["Enter", " "].includes(event.key)) return;
        event.preventDefault();
        window.location.assign(detailsHref);
      }}
      role={loading ? undefined : "link"}
      tabIndex={loading ? undefined : 0}
      aria-label={loading ? undefined : `View details for ${title}`}
    >
      {loading ? (
        <CourseCardSkeleton />
      ) : (
        <>
          <div className="courseImgWrapper">
            <Image src={image} alt={title} fill className="courseImage" />
            <span className="CourseTypeBadge" aria-label={`Content type: ${typeLabel}`}>
              {typeLabel}
            </span>
            <button className="wishlistBtn" aria-label={`Toggle ${title} favorite`} onClick={() => handleWishlist({ id, slug, title, image, price, oldPrice, rating, students, instructorName, lessons, duration, instructorImg, instructorLabel }, type)}>
                {wishlistIcon} 
            </button>
          </div>
          <div className="CourseTitleBoxMain">
            <div className="CourseTitleBox">
              <h3 className="courseTitle">{title}</h3>
            </div>
            {liveText && (
              <div className="CourseLive">
                {dotsIcon}
                <p>{liveText}</p>
              </div>
            )}
          </div>

          {((lessons !== null && lessons !== undefined && lessons !== "") || duration) && (
            <div className="courseMeta">
              {lessons !== null && lessons !== undefined && lessons !== "" && (
                <span>{lessonsIcon} {lessons} {lessonsLabel}</span>
              )}
              {duration && <span>{clockIcon} {duration}</span>}
            </div>
          )}

          {(dateFormat || time) && (
            <div className="courseLiveDate">
              {dateFormat && <span>{dateIcon} {dateFormat}</span>}
              {time && <span>{timeIcon} {time}</span>}
            </div>
          )}

          {(hasPrice || hasRating || hasStudents) && (
            <div className="Priceratebox">
              {hasPrice && (
                <div className="priceBox">
                  <h4> {priceIcon} {price}</h4>
                  {showOldPrice && <span className="old">{oldPriceIcon} {oldPrice}</span>}
                </div>
              )}

              {(hasRating || hasStudents) && (
                <div className="rating">
                  {hasRating && <div className="RateBox">{ratingIcon} {rating}</div>}
                  {hasStudents && <div className="RateUsers">{userIcon} {students}</div>}
                </div>
              )}
            </div>
          )}

          <div className="TutorBtnBox">
            <div className="TutorBox">
              <div className={`TutorImg ${tutorImageSize}`}>
                {instructorImg && !instructorImageFailed ? (
                  <Image
                    src={instructorImg}
                    alt={instructorName ? `${instructorName}, instructor` : "Instructor"}
                    width={35}
                    height={35}
                    onError={() => setFailedInstructorImg(instructorImg)}
                  />
                ) : (
                  <span className="TutorAvatarFallback" aria-hidden="true">
                    {instructorName?.trim()?.charAt(0)?.toUpperCase() || "I"}
                  </span>
                )}
              </div>
              <div className="TutorDetails">
                <span className="TutorLabel">{instructorLabel} </span>
                <span className="TutorName">{instructorName}</span>
              </div>
            </div>

            <Link className="viewBtn" href={detailsHref}>
              {btnLoading ? <div className="spinner"></div> : buttonText}
            </Link>
          </div>
        </> 
      )}
    </div>
  );
};

export default CourseCard;

