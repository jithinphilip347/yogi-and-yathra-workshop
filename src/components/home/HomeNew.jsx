"use client";
import React, { useEffect, useState } from "react";
import CourseCard from "../coursebox/CourseCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { MEDIA_BASE_URL } from "@/utils/constants";
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
import Link from "next/link";

import { FiUsers } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import { FiClock, FiBookOpen } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import useCourse from "@/hooks/useCourse";
import useWishlist from "@/hooks/useWishlist";


const HomeNew = () => {
  const queries = {
    order_by: "desc",
    sort: "created_at",
  };
  const { courseQuery } = useCourse({ queries });

  const { data, isLoading } = courseQuery;
  const courses = data?.data?.data || [];
  const { findWishlistIcon } = useWishlist();


  return (
    <div id="HomeNew">
      <div className="container">
        <div className="HomeNewHead">
          <h2>Newly Launched Programs</h2>
          <Link href="/course" className="viewAllBtn">View All</Link>
        </div>
        <div className="HomeNewMain">
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
            slidesPerView={5}
            spaceBetween={25}
            breakpoints={{
              320: { slidesPerView: 1 },
              480: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              1024: { slidesPerView: 3 },
              1200: { slidesPerView: 4 },
              1400: { slidesPerView: 5 },
            }}
          >
            {(isLoading ? Array(6).fill({}) : courses).map((course, i) => (
              <SwiperSlide key={i}>
                <CourseCard
                  loading={isLoading}
                  image={
                    course.thumbnail
                      ? `${MEDIA_BASE_URL}${course.thumbnail}`
                      : null
                  }
                  title={course.title}
                  lessons={course?.lessons_count}
                  duration={(course.duration_in_hours || 0) + " hrs"}
                  price={Number(course.price)}
                  oldPrice={Number(course.discount_price)}
                  rating="4.5" 
                  students={course?.enrollments_count} 
                  instructorName={course?.instructor?.name}
                  wishlistIcon={findWishlistIcon(course.id, "course")}
                  lessonsIcon={<FiBookOpen />}
                  clockIcon={<FiClock />}
                  priceIcon="₹"
                  oldPriceIcon="₹"
                  lessonsLabel="Lessons"
                  ratingIcon={<AiFillStar />}
                  userIcon={<FiUsers />}
                  buttonText="View Details"
                  instructorImg={
                    course?.instructor?.avatar
                      ? `${MEDIA_BASE_URL}${course.instructor.avatar}`
                      : null
                  }
                  instructorLabel={course?.instructor?.role}
                  id={course.id}
                  type="course"
                  slug={course.slug}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default HomeNew;