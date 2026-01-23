"use client";
import React, { useEffect, useState } from "react";
import { MEDIA_BASE_URL } from "@/utils/constants";
import CourseCard from "../coursebox/CourseCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import CourseImg1 from "../../assets/images/courseImg-1.jpg";
import CourseImg2 from "../../assets/images/courseImg-2.jpg";
import CourseImg3 from "../../assets/images/courseImg-3.jpg";
import CourseImg4 from "../../assets/images/courseImg-4.jpg";
import CourseImg5 from "../../assets/images/courseImg-5.jpg";
import CourseImg6 from "../../assets/images/courseImg-6.jpg";

import User1 from "../../assets/images/instructor-1.jpg";
import User2 from "../../assets/images/instructor-2.jpg";
import User3 from "../../assets/images/instructor-3.jpg";
import User4 from "../../assets/images/instructor-4.jpg";
import User5 from "../../assets/images/instructor-5.jpg";
import User6 from "../../assets/images/instructor-6.jpg";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

import { FiUsers } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import { FiClock, FiBookOpen } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { GoDotFill } from "react-icons/go";
import { MdDateRange } from "react-icons/md";
import useWishlist from "@/hooks/useWishlist";



const HomeLiveClass = ({ dailyClasses }) => {
  const [loading, setLoading] = useState(true);
  const { findWishlistIcon } = useWishlist();

  useEffect(() => {
    setTimeout(() => setLoading(false), 2000);
  }, []);

  return (
    <div id="HomeLiveClass">
      <div className="container">
        <div className="HomeLiveClassHead">
          <h2>Live & Interactive Classes</h2>
          <a href="/live-class/live-class-details" className="viewAllBtn">View All</a>
        </div>
        <div className="HomeLiveClassMain">
          <div className="swiper-btn prev-btn">
            <FaChevronLeft />
          </div>
          <div className="swiper-btn next-btn">
            <FaChevronRight />
          </div>

          <Swiper
            modules={[Navigation]}
            navigation={{
              nextEl: ".next-btn",
              prevEl: ".prev-btn",
            }}
            loop={true}
            slidesPerView={2}
            spaceBetween={30}
            breakpoints={{
              320: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
            }}
          >
            {(loading ? Array(6).fill({}) : dailyClasses).map((course, i) => (
              <SwiperSlide key={i}>
                <CourseCard
                  loading={loading}
                  image={course?.thumbnail ? `${MEDIA_BASE_URL}${course.thumbnail}` : null}
                  title={course?.title}
                  wishlistIcon={findWishlistIcon(course.id, "daily_class")}
                  dateIcon={<MdDateRange />}
                  time={course?.human_class_time}
                  timeIcon={<FiClock />}
                  dateFormat={course?.human_start_date}
                  dotsIcon={<GoDotFill />}
                  liveText="Live"
                  buttonText="Join Now"
                  instructorLabel="Instructor"
                  instructorImg={
                    course?.instructor?.avatar
                      ? `${MEDIA_BASE_URL}${course.instructor.avatar}`
                      : null
                  }
                  instructorName={course?.instructor?.name}
                  tutorImageSize='medium'
                  id={course.id}
                  type="daily_class"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default HomeLiveClass;
