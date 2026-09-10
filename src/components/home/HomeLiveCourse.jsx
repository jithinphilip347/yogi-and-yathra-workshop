"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { MdOutlineTimer } from "react-icons/md";
import { RiArrowRightUpLine } from "react-icons/ri";
import { AiFillStar } from "react-icons/ai";
import {
  FiRadio,
  FiUsers,
  FiTarget,
  FiCalendar,
  FiClock,
  FiUser,
  FiGlobe,
} from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import courseApi from "@/libs/courseApi";

import LiveBg1 from "../../assets/images/live1.webp";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { useCart } from "@/features/commerce/hooks/useCommerceHooks";

const EventSlide = ({ event }) => {
  const router = useRouter();
  const { buyNow } = useCart();
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  // Calculate target date from class_date_time or date + start_time
  const targetDate = useMemo(() => {
    if (!event) return null;
    if (event.class_date_time) {
      const parsed = new Date(event.class_date_time).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    if (event.date) {
      const timeStr = event.start_time || "00:00:00";
      const fullDateStr = `${event.date}T${timeStr}`;
      const parsed = new Date(fullDateStr).getTime();
      if (!isNaN(parsed)) return parsed;
      const fallbackParsed = new Date(event.date).getTime();
      if (!isNaN(fallbackParsed)) return fallbackParsed;
    }
    return null;
  }, [event?.class_date_time, event?.date, event?.start_time]);

  useEffect(() => {
    if (!targetDate) return;

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

    setTimeLeft(calcTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // Status & CTA determination
  const isEnded = Boolean(event?.is_ended || event?.time_status === "completed");
  const isLive = Boolean(event?.time_status === "live" || event?.can_join);
  const isSoldOut = Boolean(
    event?.registration_status === "full" ||
      (event?.available_seats !== undefined &&
        Number(event?.available_seats) <= 0 &&
        Number(event?.capacity) > 0)
  );
  const isRegistrationClosed = Boolean(event?.registration_status === "closed");

  const getCtaText = () => {
    if (isEnded) return "Session Ended";
    if (isLive) return "Join Live";
    if (isSoldOut) return "Sold Out";
    if (isRegistrationClosed) return "Registration Closed";
    return "Pre Book Now";
  };

  const isButtonDisabled = isEnded || isSoldOut || isRegistrationClosed;

  const handleCardClick = () => {
    const slug =
      event?.slug ||
      (event?.title
        ? event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : "session");
    router.push(`/live-section/${event.id}/${slug}`);
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    if (isButtonDisabled) return;

    if (isLive) {
      handleCardClick();
      return;
    }

    // Create a checkout session (Buy Now)
    buyNow(event, "LiveSection", router);
  };

  // Instructor Info
  const instructorName = event?.instructor?.name || "Instructor";
  const rawInstructorAvatar =
    event?.instructor?.avatar_url ||
    event?.instructor?.avatar ||
    event?.instructor?.image;
  const instructorAvatar = rawInstructorAvatar
    ? resolveMediaUrl(rawInstructorAvatar)
    : null;

  // Language resolution (from explicit language field or tags)
  const eventLanguage =
    event?.language ||
    (Array.isArray(event?.tags)
      ? event.tags.find((tag) =>
          ["English", "Hindi", "Malayalam", "Tamil", "Telugu"].some((lang) =>
            String(tag).toLowerCase().includes(lang.toLowerCase())
          )
        )
      : null);

  // Difficulty resolution
  const difficultyBadge =
    event?.difficulty ||
    event?.level ||
    (Array.isArray(event?.tags) && event.tags.length > 0
      ? event.tags[0]
      : null);

  // Main Image resolution
  const mainImageSrc = event?.image
    ? event.image
    : event?.thumbnail
      ? resolveMediaUrl(event.thumbnail)
      : event?.banner_image
        ? resolveMediaUrl(event.banner_image)
        : LiveBg1;

  // Formatted date string
  const formattedDate =
    event?.human_date ||
    (event?.date
      ? new Date(event.date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null);

  // Formatted start time string
  const formattedTime =
    event?.human_start_time ||
    event?.human_class_time ||
    event?.start_time ||
    null;

  return (
    <div className="LiveEventCard" onClick={handleCardClick}>
      <div className="EventDetails">
        <div className="CategoryBadge">
          <FiRadio className="icon" />{" "}
          {event?.category?.name || event?.type || "LIVE WORKSHOP"}
        </div>

        <h2>{event?.title}</h2>

        {event?.short_description ? (
          <p className="desc">{event.short_description}</p>
        ) : event?.description ? (
          <p
            className="desc"
            dangerouslySetInnerHTML={{ __html: event.description }}
          />
        ) : null}

        <div className="MetaRow1">
          {Number(event?.review_count) > 0 || Number(event?.average_rating) > 0 ? (
            <div className="Badge">
              <AiFillStar className="icon star" />{" "}
              {Number(event?.average_rating || 5).toFixed(1)} (
              {event?.review_count}{" "}
              {Number(event?.review_count) === 1 ? "Review" : "Reviews"})
            </div>
          ) : (
            <div className="Badge">
              <AiFillStar className="icon star" /> New Session
            </div>
          )}

          {Number(event?.booked_seats) > 0 ? (
            <>
              <span className="dot">•</span>
              <div className="Badge">
                <FiUsers className="icon" /> {event.booked_seats} Joined
              </div>
            </>
          ) : Number(event?.available_seats) > 0 ? (
            <>
              <span className="dot">•</span>
              <div className="Badge">
                <FiUsers className="icon" /> {event.available_seats} Seats Left
              </div>
            </>
          ) : null}

          {difficultyBadge && (
            <>
              <span className="dot">•</span>
              <div className="Badge difficulty">
                <FiTarget className="icon" /> {difficultyBadge}
              </div>
            </>
          )}
        </div>

        <div className="InfoChips">
          {formattedDate && (
            <span className="Chip">
              <FiCalendar className="icon" /> {formattedDate}
            </span>
          )}
          {formattedTime && (
            <span className="Chip">
              <FiClock className="icon" /> {formattedTime}
            </span>
          )}
          {event?.duration && (
            <span className="Chip">
              <MdOutlineTimer className="icon" /> {event.duration} Min
            </span>
          )}
        </div>

        <div className="InstructorRow">
          <div className="InstructorInfo">
            {instructorAvatar ? (
              <Image
                src={instructorAvatar}
                alt={instructorName}
                width={28}
                height={28}
                className="ProfileImg"
              />
            ) : (
              <div className="ProfilePlaceholder">
                <FiUser />
              </div>
            )}
            <span className="Name">{instructorName}</span>
          </div>
          {eventLanguage && (
            <>
              <span className="dot">•</span>
              <span className="Language">
                <FiGlobe className="icon" /> {eventLanguage}
              </span>
            </>
          )}
        </div>

        <div className="CtaWrapper">
          <button
            className={`PrimaryBtn ${isButtonDisabled ? "disabled" : ""}`}
            onClick={handleButtonClick}
            disabled={isButtonDisabled}
          >
            {getCtaText()}
            <RiArrowRightUpLine className="arrowAnim" />
          </button>
        </div>
      </div>

      <div className="EventImageWrapper">
        <Image
          src={mainImageSrc}
          alt={event?.title || "Live Yoga"}
          className="MainImage"
          priority
          width={1000}
          height={1000}
        />

        <div className="TimingBox">
          <div className="TimeTitle">
            {isEnded
              ? "SESSION ENDED"
              : isLive
                ? "SESSION LIVE"
                : "REMAINING TIME"}
          </div>
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
  const initialList = Array.isArray(liveSections)
    ? liveSections
    : Array.isArray(liveSections?.data)
      ? liveSections.data
      : [];

  const { data: liveSectionsData, isLoading } = useQuery({
    queryKey: ["public-live-sections"],
    queryFn: async () => {
      const res = await courseApi.liveSections();
      return res.data?.data || res.data || [];
    },
    initialData: initialList.length > 0 ? initialList : undefined,
    staleTime: 1000 * 60 * 5,
  });

  const list = Array.isArray(liveSectionsData)
    ? liveSectionsData
    : Array.isArray(liveSectionsData?.data)
      ? liveSectionsData.data
      : initialList;

  if (isLoading && list.length === 0) {
    return (
      <section id="HomeLiveCourse">
        <div className="HomeLiveCourseMain">
          <div className="container">
            <div className="SectionHeader fadeAnim">
              <h2>Upcoming Live Sessions</h2>
              <p>
                Join our expert-led live classes and interactive workshops
                designed for your wellness journey.
              </p>
            </div>
            <div className="LiveCourseMainBox">
              <div
                className="LiveEventCard skeleton"
                style={{
                  minHeight: "380px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255, 255, 255, 0.8)",
                  borderRadius: "20px",
                }}
              >
                <p style={{ opacity: 0.6, fontSize: "16px" }}>
                  Loading live sessions...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!list || list.length === 0) {
    return null;
  }

  return (
    <section id="HomeLiveCourse">
      <div className="HomeLiveCourseMain">
        <div className="container">
          <div className="SectionHeader fadeAnim">
            <h2>Upcoming Live Sessions</h2>
            <p>
              Join our expert-led live classes and interactive workshops
              designed for your wellness journey.
            </p>
          </div>

          <div className="LiveCourseMainBox">
            <Swiper
              modules={[Navigation]}
              navigation={true}
              loop={list.length > 1}
              grabCursor={true}
              slidesPerView={1}
              speed={700}
              className="LiveCourseSwiper"
            >
              {list.map((event) => (
                <SwiperSlide key={event.id}>
                  <EventSlide event={event} />
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
