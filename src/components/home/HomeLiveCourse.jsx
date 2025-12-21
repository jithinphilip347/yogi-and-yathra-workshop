"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { MdKeyboardArrowRight } from "react-icons/md";
import { RiArrowRightUpLine } from "react-icons/ri";

import LiveBg1 from "../../assets/images/live1.jpg";
import LiveBg2 from "../../assets/images/live2.jpg";
import LiveBg3 from "../../assets/images/live3.jpg";
import LiveBg4 from "../../assets/images/live4.jpg";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const EventSlide = ({ image, targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  const format = (v) => String(v).padStart(2, "0");

  const calcTimeLeft = () => {
    const now = Date.now();
    const distance = targetDate - now;

    if (distance <= 0) {
      return { days: "00", hours: "00", minutes: "00", seconds: "00" };
    }

    return {
      days: format(Math.floor(distance / (1000 * 60 * 60 * 24))),
      hours: format(Math.floor((distance / (1000 * 60 * 60)) % 24)),
      minutes: format(Math.floor((distance / (1000 * 60)) % 60)),
      seconds: format(Math.floor((distance / 1000) % 60)),
    };
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="LiveCourseImgBox">
      <Image src={image} alt="Live Yoga" className="MainImage" priority />
      <div className="Overlay"></div>

      <div className="TimingBox">
        <div className="TimeTitle">REMAINING TIME</div>
        <div className="TimerGrid">
          {["days", "hours", "minutes", "seconds"].map((label, i) => (
            <div className="TimerItem" key={i}>
              <div className="TimerCard">
                <span className="TimerNumber">{timeLeft[label]}</span>
              </div>
              <p>{label.toUpperCase()}</p>
            </div>
          ))}
        </div>
      </div>

      <button className="BookBtn">
        Pre Book Now <RiArrowRightUpLine className="arrowAnim" />
      </button>
    </div>
  );
};

const HomeLiveCourse = () => {
  const events = [
    {
      id: 1,
      image: LiveBg1,
      heading: <>Join Our <span>Live Yoga Meditation</span> Event</>,
      description: "Calm your mind & refresh your body with relaxing meditation.",
      scrollText: "Scroll Down To Discover",
      targetDate: new Date("2025-12-30T18:30:00").getTime(),
    },
    {
      id: 2,
      image: LiveBg2,
      heading: <>Sunrise <span>Pranayam</span> Session</>,
      description: "Start your morning with positive breathing & fresh energy.",
      scrollText: "Explore More",
      targetDate: new Date("2026-01-05T17:00:00").getTime(),
    },
    {
      id: 3,
      image: LiveBg3,
      heading: <>Advanced <span>Yoga Challenge</span></>,
      description: "Build strength & flexibility with expert instructors.",
      scrollText: "Discover More",
      targetDate: new Date("2026-02-10T19:00:00").getTime(),
    },
    {
      id: 4,
      image: LiveBg4,
      heading: <>Night <span>Mind Healing</span> Therapy</>,
      description: "Deep healing meditation for emotional peace & better sleep.",
      scrollText: "Learn More",
      targetDate: new Date("2026-03-10T19:00:00").getTime(),
    },
  ];

  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <section id="HomeLiveCourse">
      <div className="HomeLiveCourseMain">
      <div className="container">
        
        <div className="LiveCourseContent fadeAnim">
          <h2 key={activeSlide}>{events[activeSlide].heading}</h2>
          <p key={activeSlide + "-p"}>{events[activeSlide].description}</p>

          <a href="#courseDetails" className="scrollDown">
            {events[activeSlide].scrollText} <MdKeyboardArrowRight />
          </a>
        </div>

        <div className="LiveCourseMainBox">
          <Swiper
                modules={[Navigation]}
                navigation={true}
                loop={true}
                grabCursor={true}
                slidesPerView={1}
                speed={700}              
                className="LiveCourseSwiper"
                onSlideChange={(swiper) => setActiveSlide(swiper.realIndex)}

          >
            {events.map((event) => (
              <SwiperSlide key={event.id}>
                <EventSlide image={event.image} targetDate={event.targetDate} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        </div>
      </div>
    </section>
  );
};

export default HomeLiveCourse;
