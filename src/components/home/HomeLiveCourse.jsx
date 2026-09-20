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
  FiLock,
} from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import courseApi from "@/libs/courseApi";

import LiveBg1 from "../../assets/images/live1.webp";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { registrationViewerState } from "@/utils/registrationWindow";
import { useCart } from "@/features/commerce/hooks/useCommerceHooks";

const EventSlide = ({ event, hasAccess = false }) => {
  const router = useRouter();
  const { buyNow } = useCart();
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  // Status & CTA determination
  const isEnded = Boolean(event?.is_ended || event?.time_status === "completed");
  const isLive = Boolean(event?.time_status === "live" || event?.can_join);
  const isSoldOut = Boolean(
    event?.registration_status === "full" ||
      (event?.available_seats !== undefined &&
        Number(event?.available_seats) <= 0 &&
        Number(event?.capacity) > 0)
  );
  // ── Registration window vs. entitlement ──────────────────────────────
  // The window governs NEW registrations only. A viewer who already holds an
  // active enrollment must keep seeing — and reaching — their session after the
  // public window closes (src/utils/registrationWindow.js holds the rule, and the
  // backend re-validates every new registration regardless of what we render).
  const registration = registrationViewerState(event, { hasAccess, isEnded });

  const isRegistrationClosed = registration.showClosedState;
  // Closed-window and sold-out are both registration constraints, so neither may
  // lock out someone who is already registered.
  const registrationBlocked =
    !hasAccess && (registration.showClosedState || isSoldOut);

  const getCtaText = () => {
    if (isEnded) return "Session Ended";
    if (isLive) return "Join Live";
    if (hasAccess) return "View Session";
    if (isSoldOut) return "Sold Out";
    if (isRegistrationClosed) return "Registration Closed";
    return "Pre Book Now";
  };

  const isButtonDisabled = isEnded || registrationBlocked;

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

    // An entitled viewer opens their session; they must not be pushed into buying
    // it a second time.
    if (hasAccess) {
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

  const dateParts = formattedDate ? formattedDate.split(" ") : ["--", "---"];
  const ticketDay = dateParts[0];
  const ticketMonth = dateParts[1];

  // Formatted start time string
  const formattedTime =
    event?.human_start_time ||
    event?.human_class_time ||
    event?.start_time ||
    null;

  return (
    <div className="LiveEventCard" onClick={handleCardClick}>
      {/* LEFT: IMAGE & TIMER */}
      <div className="EventImageWrapper">
        <Image
          src={mainImageSrc}
          alt={event?.title || "Live Session"}
          className="MainImage"
          priority
          width={1000}
          height={1000}
        />
        <div className="ImageOverlay"></div>
        
        <div className="TopBadges">
          <div className="CategoryBadge">
            <FiRadio className="icon" />{" "}
            {event?.category?.name || event?.type || "LIVE"}
          </div>
          {difficultyBadge && (
             <div className="Badge difficulty">
               <FiTarget className="icon" /> {difficultyBadge}
             </div>
          )}
        </div>

        <div className="ImageCenterContent">
            {/* Kept this just in case they still want the lock on the image */}
            {isRegistrationClosed && !hasAccess && (
              <div className="LockIconWrapper">
                <FiLock />
              </div>
            )}
        </div>
      </div>

      {/* RIGHT: CONTENT & DETAILS */}
      <div className="EventDetails">
        <h3 className="EventTitle">{event?.title || "Upcoming Live Session"}</h3>

        {event?.short_description ? (
          <p className="desc">{event.short_description}</p>
        ) : event?.description ? (
          <p
            className="desc"
            dangerouslySetInnerHTML={{ __html: event.description }}
          />
        ) : null}

        <div className="TicketBox">
          <div className="TicketDate">
            <span className="TDay">{ticketDay}</span>
            <span className="TMonth">{ticketMonth}</span>
          </div>
          <div className="TicketDivider"></div>
          <div className="TicketInfo">
            {formattedTime && (
              <span className="TTime">
                <FiClock className="icon" /> {formattedTime}
              </span>
            )}
            {event?.duration && (
              <span className="TDuration">
                <MdOutlineTimer className="icon" /> {event.duration} Min
              </span>
            )}
          </div>
        </div>

        <div className="MetaRow1">
          {Number(event?.review_count) > 0 || Number(event?.average_rating) > 0 ? (
            <div className="Badge rating">
              <AiFillStar className="icon star" />{" "}
              <span>{Number(event?.average_rating || 5).toFixed(1)}</span>
              <span className="dim">({event?.review_count})</span>
            </div>
          ) : (
            <div className="Badge new">
              <AiFillStar className="icon star" /> New Session
            </div>
          )}

          {Number(event?.booked_seats) > 0 ? (
            <div className="Badge users">
              <FiUsers className="icon" /> {event.booked_seats} Joined
            </div>
          ) : Number(event?.available_seats) > 0 ? (
            <div className="Badge users">
              <FiUsers className="icon" /> {event.available_seats} Seats Left
            </div>
          ) : null}
          
          {eventLanguage && (
            <div className="Badge lang">
               <FiGlobe className="icon" /> {eventLanguage}
            </div>
          )}
        </div>

        <div className="BottomRow">
          <div className="InstructorInfo">
            {instructorAvatar ? (
              <Image
                src={instructorAvatar}
                alt={instructorName}
                width={44}
                height={44}
                className="ProfileImg"
              />
            ) : (
              <div className="ProfilePlaceholder">
                <FiUser />
              </div>
            )}
            <div className="HostDetails">
              <span className="HostLabel">Hosted by</span>
              <span className="Name">{instructorName}</span>
            </div>
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

  // One enrollment lookup for the whole rail (not one per card), reusing the same
  // endpoint the LiveSection detail page trusts. Cache-only until it resolves: an
  // unknown viewer is treated as unentitled, which only ever shows the *public*
  // state — never a wrong unlock.
  const { user } = useSelector((state) => state.auth);
  const { data: enrolledLiveSectionIds } = useQuery({
    queryKey: ["viewer-live-section-enrollments", user?.id],
    queryFn: async () => {
      const res = await courseApi.userEnrollments(user.id, "live_section");
      const list = res.data?.data || res.data || [];
      return list
        .filter((e) => e.status === "active")
        .map((e) => Number(e.enrollable_id));
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const enrolledIds = useMemo(
    () => new Set(Array.isArray(enrolledLiveSectionIds) ? enrolledLiveSectionIds : []),
    [enrolledLiveSectionIds]
  );

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
                  <EventSlide
                    event={event}
                    hasAccess={enrolledIds.has(Number(event.id))}
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
