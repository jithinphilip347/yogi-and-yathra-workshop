"use client";
import React, { useEffect, useState } from "react";
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

const courses = [
  {
    image: CourseImg1,
    title: "Mindful Meditation for Beginners",
    lessons: "25",
    duration: "20 hrs",
    price: "499",
    oldPrice: "899",
    rating: "4.9",
    students: "780",
    instructorImg: User3,
    instructorName: "Maya Krishna",
  },
  {
    image: CourseImg2,
    title: "Full-Body Yoga Masterclass",
    lessons: "35",
    duration: "45 hrs",
    price: "899",
    oldPrice: "1299",
    rating: "4.8",
    students: "1260",
    instructorImg: User2,
    instructorName: "Anil Dev",
  },
  {
    image: CourseImg3,
    title: "Breathwork Healingy",
    lessons: "18",
    duration: "16 hrs",
    price: "699",
    oldPrice: "999",
    rating: "4.7",
    students: "640",
    instructorImg: User1,
    instructorName: "Akhil ",
  },
  {
    image: CourseImg4,
    title: "Spiritual Wellness & Inner Peace",
    lessons: "20",
    duration: "25 hrs",
    price: "749",
    oldPrice: "1299",
    rating: "4.6",
    students: "530",
    instructorImg: User4,
    instructorName: "Richa Kumar",
  },
  {
    image: CourseImg5,
    title: "Yoga for Stress Relief & Sleep",
    lessons: "15",
    duration: "12 hrs",
    price: "449",
    oldPrice: "899",
    rating: "4.8",
    students: "950",
    instructorImg: User6,
    instructorName: "Asha Mehta",
  },
  {
    image: CourseImg6,
    title: "Advanced Meditation with Mantras",
    lessons: "30",
    duration: "32 hrs",
    price: "1199",
    oldPrice: "1599",
    rating: "4.9",
    students: "1120",
    instructorImg: User5,
    instructorName: "Aravind Dev",
  },
];

const HomePopular = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 2000);
  }, []);

  return (
    <div id="HomePopular">

      <div className="container">
              <div className="PopularHead">
        <h2>Popular Right Now</h2>
        <button className="viewAllBtn">View All</button>
      </div>

      <div className="PopularFilters">
        {[
          "All",
          "Meditation",
          "Yoga",
          "Stress Relief",
          "Healing",
          "Beginner",
        ].map((filter, index) => (
          <button key={index} className="filterBtn">
            {filter}
          </button>
        ))}
      </div>
        <div className="HomePopularMain">
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
            {(loading ? Array(6).fill({}) : courses).map((course, i) => (
              <SwiperSlide key={i}>
                <CourseCard loading={loading} {...course} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default HomePopular;
