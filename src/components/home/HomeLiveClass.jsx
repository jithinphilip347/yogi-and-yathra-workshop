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

import { FiUsers } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import { FiClock, FiBookOpen } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { GoDotFill } from "react-icons/go";
import { MdDateRange } from "react-icons/md";

const courses = [
  {
    image: CourseImg1,
    wishlistIcon: <FaHeart />,
    dateIcon:<MdDateRange /> ,
    time: "07 : 30 AM" ,
    timeIcon:<FiClock /> ,
    dateFormat:"20 Dec 2025" ,
    dotsIcon: <GoDotFill />,
    liveText:"Live",
    buttonText: "Join Now",
    instructorLabel: "Instructor",
    title: "Mindful Meditation",
    instructorImg: User3,
    instructorName: "Maya Krishna",
  },
  {
    image: CourseImg2,
    wishlistIcon: <FaHeart />,
        dateIcon:<MdDateRange /> ,
    time: "06 : 00 AM" ,
    timeIcon:<FiClock /> ,
    dateFormat:"20 Dec 2025" ,
    dotsIcon: <GoDotFill />,
    liveText:"Live",
    buttonText: "Join Now",
    instructorLabel: "Instructor",
    title: "Full-Body Yoga Masterclass",
    instructorImg: User2,
    instructorName: "Anil Dev",
  },
  {
    image: CourseImg3,
    wishlistIcon: <FaHeart />,
      dateIcon:<MdDateRange /> ,
    time: "05 : 30 AM" ,
    timeIcon:<FiClock /> ,
    dateFormat:"20 Dec 2025" ,
    dotsIcon: <GoDotFill />,
    liveText:"Live",
    buttonText: "Join Now",
    instructorLabel: "Instructor",
    title: "Breathwork Healingy",
    instructorImg: User1,
    instructorName: "Akhil ",
  },
  {
    image: CourseImg4,
    wishlistIcon: <FaHeart />,
        dateIcon:<MdDateRange /> ,
    time: "08 : 00 AM" ,
    timeIcon:<FiClock /> ,
    dateFormat:"20 Dec 2025" ,
    dotsIcon: <GoDotFill />,
    liveText:"Live",
    buttonText: "Join Now",
    instructorLabel: "Instructor",
    title: "Spiritual Wellness ",
    instructorImg: User4,
    instructorName: "Richa Kumar",
  },
  {
    image: CourseImg5,
    wishlistIcon: <FaHeart />,
    dateIcon:<MdDateRange /> ,
    time: "08 : 30 AM" ,
    timeIcon:<FiClock /> ,
    dateFormat:"20 Dec 2025" ,
    dotsIcon: <GoDotFill />,
    liveText:"Live",
    buttonText: "Join Now",
    instructorLabel: "Instructor",
    title: "Yoga for Stress Relief",
    instructorImg: User6,
    instructorName: "Asha Mehta",
  },
  {
    image: CourseImg6,
    wishlistIcon: <FaHeart />,
        dateIcon:<MdDateRange /> ,
    time: "07 : 00 AM" ,
    timeIcon:<FiClock /> ,
    dateFormat:"20 Dec 2025" ,
    dotsIcon: <GoDotFill />,
    liveText:"Live",
    buttonText: "Join Now",
    instructorLabel: "Instructor",
    title: "Advanced Meditation ",
    instructorImg: User5,
    instructorName: "Aravind Dev",
  },
];

const HomeLiveClass = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 2000);
  }, []);

  return (
    <div id="HomeLiveClass">
      <div className="container">
        <div className="HomeLiveClassHead">
          <h2>Live & Interactive Classes</h2>
          <button className="viewAllBtn">View All</button>
        </div>
        <div className="HomeLiveClassMain">
          <div className="swiper-btn prev-btn">
            <FaChevronLeft />
          </div>
          <div className="swiper-btn next-btn">
            <FaChevronRight />
          </div>

          {/* <Swiper
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
          > */}
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

export default HomeLiveClass;
