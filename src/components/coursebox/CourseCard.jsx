

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
  const detailsHref = type === "course" ? `/course/${slug}/${id}` : `/daily-class/${id}/${slug}`;

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
            {image && <Image src={image} alt={title || "Course"} fill className="courseImage" />}
            <button
              type="button"
              className="wishlistBtn"
              aria-label="Wishlist"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleWishlist(
                  {
                    id,
                    slug,
                    title,
                    image,
                    price,
                    oldPrice,
                    rating,
                    students,
                    instructorName,
                    lessons,
                    duration,
                    instructorImg,
                    instructorLabel,
                  },
                  type
                );
              }}
            >
              {wishlistIcon || (id ? findWishlistIcon(id, type) : null)}
            </button>
          </div>
           <div className="CourseTitleBoxMain">
            <div className="CourseTitleBox">
              <h3 className="courseTitle">{title}</h3>
            </div>
               <div className="CourseLive">
                 {dotsIcon}
               <p>{liveText}</p>
              </div>
           </div>
          

          <div className="courseMeta">
            <span>{lessonsIcon}  {lessons} {lessonsLabel} </span>
            <span>{clockIcon}  {duration}</span>
          </div>

            <div className="courseLiveDate">
            <span>{dateIcon}  {dateFormat} </span>
            <span>{timeIcon}  {time}</span>
          </div>

          <div className="Priceratebox">
            <div className="priceBox">
              <h4> {priceIcon} {price}</h4>
              <span className="old">{oldPriceIcon} {oldPrice}</span>
            </div>

            <div className="rating">
              <div className="RateBox">
                {ratingIcon} {rating}
              </div>
              <div className="RateUsers">
                {userIcon} {students}
              </div>
            </div>
          </div>

          <div className="TutorBtnBox">
            <div className="TutorBox">
              <div className={`TutorImg ${tutorImageSize}`}>
                {instructorImg && (
                  <Image src={instructorImg} alt="Instructor" width={35} height={35} />
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

