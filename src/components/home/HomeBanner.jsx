"use client";
import Image from "next/image";
import React from "react";
import BannerImg from "../../assets/images/bannerimg.webp";
import { MdKeyboardArrowRight } from "react-icons/md";
import { AiFillStar } from "react-icons/ai";
import StudentImg1 from "../../assets/images/st-1.webp";
import StudentImg2 from "../../assets/images/st-2.webp";
import StudentImg3 from "../../assets/images/st-3.webp";
import StudentImg4 from "../../assets/images/st-4.webp";

const HomeBanner = () => {
  return (
    <section id="HomeBanner">
      <div className="container">
        <div className="HomeBannerMain">
          <div className="HomeBannerLeft">
            <div className="HomeBannerTopBox">
              <div className="HomeBannerSubTitle">
                <p>Your Online Yoga Platform</p>
              </div>
              <div className="HomeBannerMainTitle">
                <h2>Transform Your Mind & Body Through Expert Yoga</h2>
              </div>
              <div className="HomeBannerDesc">
                <p>
                  Join certified instructors through online yoga courses, daily live classes, guided meditation, and interactive workshops designed for every level.
                </p>
              </div>
              <div className="HomeBannerBtn">
                <button className="PrimaryBtn">
                  Explore Programs <MdKeyboardArrowRight />
                </button>
              </div>
            </div>
            <div className="HomeBannerBottomBox">
              <div className="HomeBannerBottomLeft">
                <div className="StatItem">
                  <h3>20+</h3>
                  <p>Certified Instructors</p>
                </div>
                <div className="StatItem">
                  <h3>108k+</h3>
                  <p>Students Enrolled</p>
                </div>
                <div className="StatItem">
                  <h3>700+</h3>
                  <p>Yoga Classes</p>
                </div>
              </div>
              <div className="HomeBannerBottomRight">
                <div className="StarRatingBox">
                  <div className="StarCount">
                    <h3>4.9</h3>
                  </div>
                  <div className="StarIconBox">
                    <AiFillStar className="Star" />
                    <AiFillStar className="Star" />
                    <AiFillStar className="Star" />
                    <AiFillStar className="Star" />
                    <AiFillStar className="Star" />
                  </div>
                </div>
                <div className="StudentsListBox">
                  <div className="StudentImgBox">
                    <Image src={StudentImg1} alt="Student" />
                    <Image src={StudentImg2} alt="Student" />
                    <Image src={StudentImg3} alt="Student" />
                    <Image src={StudentImg4} alt="Student" />
                  </div>
                  <div className="StudentsReviewBox">
                    <span className="BasedOnText">Based on</span>
                    <h2>100k+</h2>
                    <p>Student Reviews</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="HomeBannerRight">
            <div className="ImageWrapper">
              <Image src={BannerImg} alt="Yoga Learning Banner" priority />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeBanner;
