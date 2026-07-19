"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { MdKeyboardArrowRight, MdOutlineTimer, MdWhatshot } from "react-icons/md";
import { RiArrowRightUpLine } from "react-icons/ri";
import { AiFillStar } from "react-icons/ai";
import { FiRadio, FiUsers, FiTarget, FiCalendar, FiClock, FiUser, FiGlobe, FiVideo, FiMessageCircle, FiAward, FiLock } from "react-icons/fi";

import LiveBg1 from "../../assets/images/live1.webp";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { MEDIA_BASE_URL } from "@/utils/constants";

const EventSlide = ({ event }) => {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  const targetDate = new Date(event.date).getTime();

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

  const handleCardClick = () => {
    router.push('/live-yoga-class');
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    router.push('/checkout');
  };

  return (
    <div className="LiveEventCard" onClick={handleCardClick}>
      <div className="EventDetails">
        <div className="CategoryBadge">
          <FiRadio className="icon" /> {event?.type || "LIVE WORKSHOP"}
        </div>
        
        <h2>{event?.title}</h2>
        
        <p className="desc">
          {event?.description || `Join our exclusive ${event?.title} session with ${event?.instructor?.name}. Explore the fundamentals of wellness and start your journey today with our expert guidance.`}
        </p>

        <div className="MetaRow1">
           <div className="Badge"><AiFillStar className="icon star" /> {event?.rating || "4.9"} ({event?.reviews || "128"} Reviews)</div>
           <span className="dot">•</span>
           <div className="Badge"><FiUsers className="icon" /> {event?.participants || "245"} Joined</div>
           <span className="dot">•</span>
           <div className="Badge difficulty"><FiTarget className="icon" /> {event?.difficulty || "Beginner"}</div>
        </div>

        <div className="InfoChips">
           <span className="Chip"><FiCalendar className="icon" /> {event?.date ? new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "25 Oct 2026"}</span>
           <span className="Chip"><FiClock className="icon" /> {event?.time || "07:00 PM"}</span>
           <span className="Chip"><MdOutlineTimer className="icon" /> {event?.duration || "90"} Min</span>
        </div>

        <div className="InstructorRow">
           <div className="InstructorInfo">
             {event?.instructor?.image ? (
                <Image src={event.instructor.image} alt="Instructor" width={28} height={28} className="ProfileImg" />
             ) : (
                <div className="ProfilePlaceholder"><FiUser /></div>
             )}
             <span className="Name">{event?.instructor?.name || "Sarah Jenkins"}</span>
           </div>
           <span className="dot">•</span>
           <span className="Language"><FiGlobe className="icon" /> {event?.language || "English + Malayalam"}</span>
        </div>

        <div className="CtaWrapper">
           <button className="PrimaryBtn" onClick={handleButtonClick}>
             {event?.status === 'Live' ? 'Join Live' : 'Pre Book Now'}
             <RiArrowRightUpLine className="arrowAnim" />
           </button>
        </div>
      </div>

      <div className="EventImageWrapper">
        <Image
          src={event.image}
          alt={event.title || "Live Yoga"}
          className="MainImage"
          priority
          width={1000}
          height={1000}
        />

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
      </div>
    </div>
  );
};

const HomeLiveCourse = ({ liveSections }) => {
  return (
    <section id="HomeLiveCourse">
      <div className="HomeLiveCourseMain">
        <div className="container">
          
          <div className="SectionHeader fadeAnim">
            <h2>Upcoming Live Sessions</h2>
            <p>Join our expert-led live classes and interactive workshops designed for your wellness journey.</p>
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
            >
              {liveSections?.map((event) => (
                <SwiperSlide key={event.id}>
                  <EventSlide
                    event={{
                      ...event,
                      image: event.thumbnail
                        ? `${MEDIA_BASE_URL}${event.thumbnail}`
                        : LiveBg1
                    }}
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
