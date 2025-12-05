"use client";
import Image from "next/image";
import React from "react";
import BannerImg from "../../assets/images/bannerimg.png";
import { MdKeyboardArrowRight } from "react-icons/md";
import { AiFillStar } from "react-icons/ai";
import StudentImg1 from '../../assets/images/st-1.jpg'
import StudentImg2 from '../../assets/images/st-2.jpg'
import StudentImg3 from '../../assets/images/st-3.jpg'
import StudentImg4 from '../../assets/images/st-4.jpg'
const HomeBanner = () => {
  return (
    <section id="HomeBanner">
      <div className="container">
        <div className="HomeBannerMain">
          <div className="HomeBannerLeft">
            <div className="HomeBannerTopBox">
             <div className="HomeBannerSubTitle">
                <p>Online Platform</p>
             </div>
             <div className="HomeBannerMainTitle">
            <h2>Start Your Learning Journey Today</h2>
             </div>
             <div className="HomeBannerDesc">
            <p>
              Join a vibrant community of learners and transform your aspirations 
              into achievements, starting today.
            </p>
             </div>
             <div className="HomeBannerBtn">
            <button className="PrimaryBtn">
              Get Started <MdKeyboardArrowRight />
            </button>
             </div>
            </div>
            <div className="HomeBannerBottomBox">
                <div className="HomeBannerBottomLeft">
                <div className="StatItem">
                <h3>20+</h3>
                <p>Partners</p>
              </div>
              <div className="StatItem">
                <h3>108k+</h3>
                <p>Students</p>
              </div>
                <div className="StatItem">
                <h3>723+</h3>
                <p>Students</p>
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
                         <Image src={StudentImg1} alt="" />
                         <Image src={StudentImg2} alt="" />
                         <Image src={StudentImg3} alt="" />
                         <Image src={StudentImg4} alt="" />
                       </div>
                        <div className="StudentsReviewBox">
                            <h2>100k+</h2>
                            <p>Student Reviews</p>
                        </div>
                   </div>
                </div>
            </div>
          </div>
          <div className="HomeBannerRight">
            <div className="ImageWrapper">
              <Image src={BannerImg} alt="Learning Banner" priority />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HomeBanner;
