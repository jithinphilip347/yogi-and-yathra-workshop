"use client";
import React, { useState } from "react";
import "./CourseCard.css";
import { FiUsers } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import { FiClock, FiBookOpen } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import Image from "next/image";

const CourseCard = ({
  image,
  title,
  lessons,
  duration,
  price,
  oldPrice,
  rating,
  students,
  instructorImg,
  instructorName,
  buttonText = "View Details",
  onClick,
  loading = false,
}) => {
  const [btnLoading, setBtnLoading] = useState(false);

  const handleClick = () => {
    setBtnLoading(true);
    setTimeout(() => {
      setBtnLoading(false);
      onClick && onClick();
    }, 800);
  };

  return (
    <div className="courseCard">
      {loading ? (
        <div className="skeleton-wrapper">
          <div className="skeleton-img"></div>
          <div className="skeleton-text title"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-profile"></div>
          <div className="skeleton-btn"></div>
        </div>
      ) : (
        <>
          <div className="courseImgWrapper">
            <Image src={image} alt={title} fill className="courseImage" />
            <button className="wishlistBtn">
              <FaHeart />
            </button>
          </div>

          <h3 className="courseTitle">{title}</h3>

          <div className="courseMeta">
            <span><FiBookOpen /> {lessons} Lessons</span>
            <span><FiClock /> {duration}</span>
          </div>

          <div className="Priceratebox">
            <div className="priceBox">
              <h4>₹{price}</h4>
              <span className="old">₹{oldPrice}</span>
            </div>

            <div className="rating">
              <div className="RateBox">
                <AiFillStar /> {rating}
              </div>
              <div className="RateUsers">
                <FiUsers /> {students}
              </div>
            </div>
          </div>

          <div className="TutorBtnBox">
            <div className="TutorBox">
              <div className="TutorImg">
                {instructorImg && (
                  <Image src={instructorImg} alt="Instructor" width={35} height={35} />
                )}
              </div>
              <div className="TutorDetails">
                <span className="TutorLabel">Instructor</span>
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
