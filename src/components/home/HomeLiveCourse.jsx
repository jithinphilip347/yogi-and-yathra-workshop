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
import { MEDIA_BASE_URL } from "@/utils/constants";

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
      <Image src={image} alt="Live Yoga" className="MainImage" priority width={1000} height={1000} />
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

const HomeLiveCourse = ({ liveSections }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const activeSection = liveSections && liveSections[activeSlide];

  return (
    <section id="HomeLiveCourse">
      <div className="HomeLiveCourseMain">
        <div className="container">
          <div className="LiveCourseContent fadeAnim">
            <h2 key={activeSlide}>{activeSection?.title}</h2>
            <p key={activeSlide + "-p"}>
              {activeSection?.description ||
                `Join our exclusive ${activeSection?.title} session with ${activeSection?.instructor?.name}.`}
            </p>

            <a href={`/course/${activeSection?.slug}`} className="scrollDown">
              Discover More <MdKeyboardArrowRight />
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
              {liveSections?.map((event) => (
                <SwiperSlide key={event.id}>
                  <EventSlide
                    image={
                      event.thumbnail
                        ? `${MEDIA_BASE_URL}${event.thumbnail}`
                        : null
                    }
                    targetDate={new Date(event.date).getTime()}
                  />
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
