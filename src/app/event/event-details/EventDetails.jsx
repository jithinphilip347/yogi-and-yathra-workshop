"use client";
import React, { useState, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Breadcrumbs from "@/components/breadcrumbs/Breadcrumbs";
import EventCard from "@/components/eventCard/EventCard";
import { DEFAULT_OFFLINE_EVENTS } from "@/components/home/HomeOfflineEvent";
import EventImg1 from "@/assets/images/courseImg-1.webp";
import InstructorImg from "@/assets/images/instructor-1.webp";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiCheckCircle,
  FiArrowRight,
  FiShield,
  FiPhoneCall,
  FiMessageSquare,
  FiX,
  FiAlertCircle,
  FiAward,
  FiCompass,
  FiNavigation,
} from "react-icons/fi";
import { FaPlay } from "react-icons/fa";
import "@/assets/css/EventDetails.scss";

const EventDetailsContent = () => {
  const searchParams = useSearchParams();
  const eventId = searchParams?.get("id");
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // Find event by ID if provided, otherwise default to first event
  const currentEvent = useMemo(() => {
    if (eventId) {
      const match = DEFAULT_OFFLINE_EVENTS.find(
        (e) => String(e.id) === String(eventId) || e.slug === eventId
      );
      if (match) return match;
    }
    return DEFAULT_OFFLINE_EVENTS[0];
  }, [eventId]);

  // Related events: exclude current event and show up to 2
  const relatedEvents = useMemo(() => {
    return DEFAULT_OFFLINE_EVENTS.filter(
      (e) => String(e.id) !== String(currentEvent?.id || 1)
    ).slice(0, 2);
  }, [currentEvent]);

  // Video URL helper
  const formatVideoUrl = (url) => {
    if (!url) return "";
    const trimmed = url.trim();
    if (trimmed.includes("youtube.com/embed/")) {
      const separator = trimmed.includes("?") ? "&" : "?";
      return `${trimmed}${separator}autoplay=1`;
    }
    const ytMatch = trimmed.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    }
    return trimmed;
  };

  const sampleFallbackVideo = "https://www.youtube.com/embed/inpok4MKVLM";
  const activeVideoUrl =
    currentEvent?.videoUrl && String(currentEvent.videoUrl).trim() !== ""
      ? String(currentEvent.videoUrl).trim()
      : sampleFallbackVideo;

  const eventTitle = currentEvent?.title || "Sunset Beach Yoga & Meditation Workshop";
  const eventCategory = currentEvent?.category || "Offline Workshop";
  const eventStatus = currentEvent?.status || "Booking Open";
  const eventDate = currentEvent?.date || "24 - 27 Nov 2026";
  const eventTime = "05:00 PM - 07:00 PM IST (Daily)";
  const eventDuration = currentEvent?.duration || "4 Days";
  const venueName = currentEvent?.venue || "Cherai Beach Eco Pavilion";
  const locationAddress = currentEvent?.location
    ? `${currentEvent.location}, Kerala, India`
    : "Cherai Beach Road, Vypin Island, Kochi, Kerala 683514";
  const fullAddress = "Cherai Beach Road, Vypin Island, Kochi, Kerala 683514";
  const instructorName = "Acharya Meera Sharma";
  const ticketPrice = currentEvent?.price || "1,499";
  const totalSeats = 25;
  const availableSeats = 8;
  const bookedSeats = totalSeats - availableSeats;
  const registrationDeadline = "22 Nov 2026, 11:59 PM";

  const eventHighlights = [
    {
      title: "100% In-Person Physical Guidance",
      desc: "Live, hands-on posture alignment and adjustments from master instructors.",
    },
    {
      title: "Complimentary Mats & Props Provided",
      desc: "Eco-friendly natural cork yoga mats, bolsters, and straps ready for your use.",
    },
    {
      title: "Organic Sattvic Brew & Refreshments",
      desc: "Daily fresh herbal detox teas and ayurvedic light post-practice refreshments.",
    },
    {
      title: "Sunset Breathwork & Sound Healing",
      desc: "Guided oceanfront Pranayama combined with authentic Tibetan singing bowl sound bath.",
    },
    {
      title: "Official Certificate of Completion",
      desc: "Certified Yogi & Yathra Workshop Certificate upon completion of all sessions.",
    },
    {
      title: "1-on-1 Personalized Yogic Consultation",
      desc: "Direct personalized advice with Acharya Meera for daily home sadhana and wellness.",
    },
  ];

  const dailySchedule = [
    {
      time: "04:45 PM - 05:00 PM",
      title: "Arrival, Herbal Tea & Mat Allocation",
      desc: "Check-in at the oceanfront pavilion, sip warm herbal infusion, and settle into your designated space.",
    },
    {
      time: "05:00 PM - 05:20 PM",
      title: "Opening Chants & Grounding Breathwork",
      desc: "Traditional Vedic Om invocation, centering breath, and setting positive personal intentions.",
    },
    {
      time: "05:20 PM - 06:15 PM",
      title: "Sunset Hatha & Vinyasa Flow Asanas",
      desc: "Mindful sequence for joint mobility, core vitality, and hip-opening as the sun dips into the sea.",
    },
    {
      time: "06:15 PM - 06:40 PM",
      title: "Pranayama & Tibetan Sound Bath",
      desc: "Nadi Shodhana & Bhramari breathwork leading into restorative singing bowl sound resonance.",
    },
    {
      time: "06:40 PM - 07:00 PM",
      title: "Yoga Nidra, Q&A & Sunset Community Circle",
      desc: "Deep conscious relaxation, direct Q&A with Acharya Meera, and distribution of participation passes.",
    },
  ];

  return (
    <div id="EventDetailsPage">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <div className="eventBreadcrumbsWrapper">
          <Breadcrumbs
            items={[
              { label: "Offline Events", path: "/event" },
              { label: eventTitle },
            ]}
          />
        </div>

        {/* ════════ 1. FULL-WIDTH THUMBNAIL & INLINE VIDEO BANNER ════════ */}
        <div className="eventFullWidthMedia">
          <div className="eventMediaWrapper">
            {isVideoOpen ? (
              <div className="eventInlineVideoWrapper">
                <video
                  src="/offline-event.mp4"
                  controls
                  autoPlay
                  playsInline
                  className="eventInlineVideoPlayer"
                />
                <button
                  type="button"
                  className="closeInlineVideoBtn"
                  onClick={() => setIsVideoOpen(false)}
                  aria-label="Close video and show thumbnail"
                >
                  <FiX />
                </button>
              </div>
            ) : (
              <>
                <Image
                  src={currentEvent?.image || EventImg1}
                  alt={eventTitle}
                  fill
                  priority
                  sizes="(max-width: 1440px) 100vw, 1400px"
                  className="eventFullImg"
                />
                <div className="eventMediaOverlay" />

                {/* Top Corner Badges */}
                <div className="mediaTopBadges">
                  <span className="eventCategoryBadge">{eventCategory}</span>
                  <span
                    className={`eventStatusBadge ${
                      eventStatus.toLowerCase().includes("almost") ? "almost" : "open"
                    }`}
                  >
                    <span className="dot" />
                    {eventStatus}
                  </span>
                </div>

                {/* Intro Video Play Button in Center */}
                <button
                  type="button"
                  className="eventIntroPlayBtn"
                  onClick={() => setIsVideoOpen(true)}
                  aria-label="Play intro video"
                >
                  <FaPlay className="playIcon" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ════════ 2-COLUMN LAYOUT: Content (Left) + Sticky Pass Box (Right) ════════ */}
        <div className="eventDetailsGrid">
          {/* ════════ LEFT COLUMN: Title, Logistics, Specs, Flow ════════ */}
          <div className="eventMainCol">
            {/* Header: Title & Description */}
            <div className="eventHeaderSection">
              <div className="eventHeaderMetaTop">
                <span className="seatsLeftBadge">
                  <FiUsers />
                  {availableSeats} Seats Left out of {totalSeats}
                </span>
                <span className="deadlineNotice">
                  <FiClock /> Registration Closes: {registrationDeadline}
                </span>
              </div>

              <h1 className="eventMainTitle">{eventTitle}</h1>

              <p className="eventShortDescription">
                {currentEvent?.description ||
                  "Immerse yourself in a serene in-person wellness sanctuary. Designed to melt away mental stress and awaken physical vitality, this offline workshop combines traditional Hatha Yoga postures, deep Pranayama breathwork, and oceanfront sound meditation under the guidance of our certified masters."}
              </p>
            </div>

            {/* Event Logistics & Specs Grid */}
            <div className="eventSpecsSection">
              <h2 className="sectionTitle">Event Details & Logistics</h2>
              <div className="specsGrid">
                {/* Event Date */}
                <div className="specCard">
                  <div className="specIconBox">
                    <FiCalendar />
                  </div>
                  <div className="specInfo">
                    <span className="specLabel">Event Date</span>
                    <span className="specValue">{eventDate}</span>
                  </div>
                </div>

                {/* Event Time */}
                <div className="specCard">
                  <div className="specIconBox">
                    <FiClock />
                  </div>
                  <div className="specInfo">
                    <span className="specLabel">Event Time</span>
                    <span className="specValue">{eventTime}</span>
                  </div>
                </div>

                {/* Event Duration */}
                <div className="specCard">
                  <div className="specIconBox">
                    <FiCompass />
                  </div>
                  <div className="specInfo">
                    <span className="specLabel">Event Duration</span>
                    <span className="specValue">{eventDuration} (8 Hours Total)</span>
                  </div>
                </div>

                {/* Venue Name */}
                <div className="specCard">
                  <div className="specIconBox">
                    <FiMapPin />
                  </div>
                  <div className="specInfo">
                    <span className="specLabel">Venue Name</span>
                    <span className="specValue">{venueName}</span>
                  </div>
                </div>

                {/* Location / Address */}
                <div className="specCard fullWidthSpec">
                  <div className="specIconBox">
                    <FiNavigation />
                  </div>
                  <div className="specInfo">
                    <span className="specLabel">Location / Address</span>
                    <span className="specValue">{fullAddress}</span>
                  </div>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="mapLinkBtn"
                  >
                    View on Map
                  </a>
                </div>
              </div>
            </div>

            {/* Instructor Profile */}
            <div className="eventInstructorSection">
              <h2 className="sectionTitle">Instructor Profile</h2>
              <div className="instructorCard">
                <div className="instructorAvatarCol">
                  <Image
                    src={InstructorImg}
                    alt={instructorName}
                    width={90}
                    height={90}
                    className="instructorImg"
                  />
                  <span className="verifiedPill">
                    <FiShield /> Certified
                  </span>
                </div>
                <div className="instructorDetailsCol">
                  <h3 className="instructorName">{instructorName}</h3>
                  <p className="instructorRole">Senior Yoga Acharya (E-RYT 500, Yoga Alliance)</p>
                  <p className="instructorBio">
                    With over 14 years of teaching experience across Kerala, Rishikesh, and Bali,
                    Acharya Meera specializes in classical Hatha alignment, meditative Pranayama,
                    and restorative singing bowl therapies. She has guided over 5,000 students to
                    deeper mindfulness and physical harmony.
                  </p>
                  <div className="instructorTags">
                    <span className="iTag">Hatha Flow</span>
                    <span className="iTag">Pranayama</span>
                    <span className="iTag">Sound Bath</span>
                    <span className="iTag">Posture Alignment</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Highlights & Inclusions */}
            <div className="eventHighlightsSection">
              <h2 className="sectionTitle">Event Highlights & Inclusions</h2>
              <div className="highlightsGrid">
                {eventHighlights.map((hl, idx) => (
                  <div key={idx} className="highlightCard">
                    <div className="highlightCheck">
                      <FiCheckCircle />
                    </div>
                    <div className="highlightText">
                      <h4>{hl.title}</h4>
                      <p>{hl.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Workshop Schedule / Daily Agenda */}
            <div className="eventScheduleSection">
              <h2 className="sectionTitle">Workshop Flow & Schedule</h2>
              <div className="scheduleTimeline">
                {dailySchedule.map((item, idx) => (
                  <div key={idx} className="timelineItem">
                    <div className="timelineMarker">
                      <span className="markerCircle">{idx + 1}</span>
                      {idx !== dailySchedule.length - 1 && <span className="markerLine" />}
                    </div>
                    <div className="timelineContent">
                      <span className="timelineTime">{item.time}</span>
                      <h4 className="timelineTitle">{item.title}</h4>
                      <p className="timelineDesc">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Venue Facilities & Preparation */}
            <div className="eventVenueFacilities">
              <h2 className="sectionTitle">Venue Facilities & Preparation</h2>
              <div className="facilitiesBox">
                <div className="facilityItem">
                  <FiCheckCircle className="fIcon" />
                  <div>
                    <strong>Open-Air Oceanfront Pavilion:</strong> Clean wooden decking with refreshing sea breeze and ambient sunset light.
                  </div>
                </div>
                <div className="facilityItem">
                  <FiCheckCircle className="fIcon" />
                  <div>
                    <strong>Amenities on Site:</strong> Filtered drinking water, clean changing rooms, sanitized restrooms, and shoe racks available.
                  </div>
                </div>
                <div className="facilityItem">
                  <FiCheckCircle className="fIcon" />
                  <div>
                    <strong>What to Wear:</strong> Breathable, comfortable yoga clothing. Props and mats are provided complimentary.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ════════ RIGHT COLUMN: Sticky Pass Box (Beside Title & Scrolls with Left) ════════ */}
          <div className="eventSidebarCol">
            <div className="eventPassStickyCard">
              <div className="passHeader">
                <span className="passLabel">Official Event Pass</span>
                <div className="passPriceWrapper">
                  <span className="currency">₹</span>
                  <span className="priceAmount">{ticketPrice}</span>
                  <span className="priceUnit">/ spot</span>
                </div>
              </div>

              {/* Available Seats Progress Indicator */}
              <div className="seatsStatusBox">
                <div className="seatsTopRow">
                  <span className="seatsAvailableText">
                    <FiUsers /> Only <strong>{availableSeats} Seats Left</strong>
                  </span>
                  <span className="seatsTotalText">{totalSeats} Total</span>
                </div>
                <div className="seatsProgressBar">
                  <div
                    className="progressBarFill"
                    style={{ width: `${(bookedSeats / totalSeats) * 100}%` }}
                  />
                </div>
                <span className="progressSubtext">
                  {bookedSeats} spots confirmed • Book early to ensure spot
                </span>
              </div>

              {/* Registration Deadline Alert */}
              <div className="deadlineAlertBox">
                <FiAlertCircle className="alertIcon" />
                <div>
                  <strong>Registration Deadline:</strong>
                  <p>{registrationDeadline}</p>
                </div>
              </div>

              {/* Book Your Spot Button */}
              <Link
                href={`/checkout?type=event&id=${currentEvent?.id || 1}`}
                className="bookSpotPrimaryBtn"
              >
                <span>Book Your Spot Now</span>
                <FiArrowRight />
              </Link>

              {/* Guarantee Perks List */}
              <div className="passGuaranteeList">
                <div className="guaranteeItem">
                  <FiShield className="gIcon" />
                  <span>100% In-Person Physical Guarantee</span>
                </div>
                <div className="guaranteeItem">
                  <FiCheckCircle className="gIcon" />
                  <span>Instant Pass Confirmation via Email</span>
                </div>
                <div className="guaranteeItem">
                  <FiAward className="gIcon" />
                  <span>Verified Master Instructor Certificate</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════ RELATED EVENTS SECTION (Title Only, Left-Aligned) ════════ */}
        <section className="relatedEventsSection">
          <h2 className="relatedSectionTitle">Related Offline Workshops</h2>
          <div className="relatedEventsGrid">
            {relatedEvents.map((item) => (
              <EventCard key={item.id} event={item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default function EventDetails({ eventData }) {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "120px 20px", textAlign: "center", fontFamily: "myFont1" }}>
          Loading Event Details...
        </div>
      }
    >
      <EventDetailsContent eventData={eventData} />
    </Suspense>
  );
}
