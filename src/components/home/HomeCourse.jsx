"use client";
import React, { useEffect, useState } from "react";
import CourseCard from "../coursebox/CourseCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { MEDIA_BASE_URL } from "@/utils/constants";
import { FaChevronLeft, FaChevronRight, FaHeart } from "react-icons/fa";
import { FiUsers, FiClock, FiBookOpen } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import useCourse from "@/hooks/useCourse";
import useWishlist from "@/hooks/useWishlist";

const HomeCourse = () => {
  const queries = {
    order_by: "desc",
    sort: "created_at",
  };
  const { courseQuery } = useCourse({ queries });
  const { data, isLoading } = courseQuery;
  const courses = data?.data || [];

  const { findWishlistIcon } = useWishlist();
  
  return (
    <div id="HomeCourse">
      <div className="container">
        <div className="HomeCourseMain">
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
              1024: { slidesPerView: 4 },
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
                  duration={(course.duration || 0) + " hrs"}
                  price={Number(course.price)}
                  oldPrice={Number(course.discount_price)}
                  rating="4.5"
                  students="100"
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
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default HomeCourse;
