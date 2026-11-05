"use client";
import React, { useEffect, useState } from "react";
import CourseCard from "../coursebox/CourseCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { FaChevronLeft, FaChevronRight, FaHeart } from "react-icons/fa";
import { FiUsers, FiClock, FiBookOpen } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import useCourse from "@/hooks/useCourse";
import useWishlist from "@/hooks/useWishlist";
import Link from "next/link";

const HomeTrending = () => {
  const queries = {
    order_by: "desc",
    sort: "created_at",
  };
  const { findWishlistIcon } = useWishlist();
  const { courseQuery } = useCourse({ queries });
  const { data, isLoading } = courseQuery;
  const courses = data?.data?.data || [];


  return (
    <div id="HomeTrending">
      <div className="container">
        <div className="HomeTrendingHead">
          <h2><span>Trending</span> This Week</h2>
          <Link href="/course" className="viewAllBtn">View All</Link>
        </div>
        <div className="HomeTrendingMain">
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
                    course?.thumbnail ? resolveMediaUrl(course.thumbnail) : null
                  }
                  title={course.title}
                  lessons={course?.lessons_count}
                  duration={(course.duration || 0) + " hrs"}
                  price={course?.effective_price ?? course?.discount_price ?? course?.price}
                  oldPrice={course?.original_price ?? (course?.discount_price > 0 && course.discount_price < course.price ? course.price : null)}
                  rating={course?.average_rating ?? course?.rating ?? 0}
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
                    course?.instructor?.avatar_url || course?.instructor?.avatar
                      ? resolveMediaUrl(course.instructor.avatar_url || course.instructor.avatar)
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

export default HomeTrending;
