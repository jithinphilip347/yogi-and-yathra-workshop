"use client";
import React, { useState } from "react";
import "./CourseCard.css";
import { FiUsers } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import { FiClock, FiBookOpen } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

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
        <>
     {/* Image with Wishlist icon placeholder */}
    <div 
    style={{
      //  position: "relative" 
          position: "relative",
    width: "100%",
    aspectRatio: "4 / 5",
    borderRadius: 12,
    overflow: "hidden",
       }}>
      {/* <Skeleton height={200} borderRadius={12} /> */}
        <Skeleton style={{ width: "100%", height: "100%" }} />

      <div style={{ position: "absolute", top: 10, right: 10 }}>
        <Skeleton circle width={32} height={32} />
      </div>
    </div>

    {/* Title */}
    <Skeleton height={18} width="80%" style={{ marginTop: 12 }} />

    {/* Lessons + Duration icons */}
    <div className="courseMeta" style={{ marginTop: 10 }}>
      <span>
        <Skeleton circle width={14} height={14} />
        <Skeleton width={50} height={12} />
      </span>
      <span>
        <Skeleton circle width={14} height={14} />
        <Skeleton width={45} height={12} />
      </span>
    </div>

    {/* Price + Rating icons */}
    <div className="Priceratebox" style={{ marginTop: 12 }}>
      <div className="priceBox">
        <Skeleton width={50} height={18} />
        <Skeleton width={40} height={14} />
      </div>

      <div className="rating">
        <Skeleton circle width={14} height={14} />
        <Skeleton width={20} height={12} />

        <Skeleton circle width={14} height={14} />
        <Skeleton width={30} height={12} />
      </div>
    </div>

    {/* Instructor */}
    <div className="TutorBtnBox" style={{ marginTop: 18 }}>
      <div className="TutorBox">
        <Skeleton circle width={28} height={28} />
        <div>
          <Skeleton width={60} height={10} />
          <Skeleton width={80} height={12} />
        </div>
      </div>

      {/* Button */}
      <Skeleton height={38} width={110} borderRadius={8} />
    </div>
  </>
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

