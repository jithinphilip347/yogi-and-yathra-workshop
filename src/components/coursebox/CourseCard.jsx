

"use client";
import React, { useState } from "react";
import "./CourseCard.css";

import Image from "next/image";
import CourseCardSkeleton from "./CourseCardSkeleton";
import useWishlist from "@/hooks/useWishlist";

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
  id
}) => {
  const [btnLoading, setBtnLoading] = useState(false);

  const handleClick = () => {
    setBtnLoading(true);
    setTimeout(() => {
      setBtnLoading(false);
      onClick && onClick();
    }, 800);
  };

  const { handleWishlist } = useWishlist();

  return (
    <div className="courseCard">
      {loading ? (
        <CourseCardSkeleton />
      ) : (
        <>
          <div className="courseImgWrapper">
            <Image src={image} alt={title} fill className="courseImage" />
            <button className="wishlistBtn" onClick={() => handleWishlist({ id, title, image, price, oldPrice, rating, students, instructorName, lessons, duration, instructorImg, instructorLabel }, type)}>
                {wishlistIcon} 
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

            <button className="viewBtn" onClick={handleClick}>
              {btnLoading ? <div className="spinner"></div> : buttonText}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CourseCard;

