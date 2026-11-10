"use client";
import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumbs from "@/components/breadcrumbs/Breadcrumbs";
import EventCard from "@/components/eventCard/EventCard";
import InstructorProfileCard from "@/components/instructorProfile/InstructorProfileCard";
import { offlineEventApi, adaptOfflineEvent, formatOfflineEventDate, formatOfflineEventStatus } from "@/services/offlineEventApi";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiCheckCircle, FiArrowRight, FiX, FiCompass, FiNavigation } from "react-icons/fi";
import { FaPlay } from "react-icons/fa";
import ExperiencePricingPlans from "@/components/experiences/ExperiencePricingPlans";
import { ExperienceDetailsSkeleton } from "@/components/experiences/ExperienceSkeletons";
import "@/assets/css/EventDetails.scss";

const formatTime = (value) => {
  if (!value) return "";
  const [hour, minute] = String(value).slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "";
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
};
const formatDateRange = (start, end) => {
  const first = formatOfflineEventDate(start);
  const last = formatOfflineEventDate(end);
  if (!first) return "Date to be announced";
  return start === end || !end ? first : `${first} – ${last}`;
};
const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Not specified";
const formatVideo = (url) => {
  if (!url) return "";
  const value = String(url).trim();
  const match = value.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0` : resolveMediaUrl(value, "");
};

function EventDetailsContent({ slug }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyId = searchParams?.get("id");
  const eventId = slug === "event-details" && legacyId ? legacyId : slug || legacyId;
  const [event, setEvent] = useState(null);
  const [related, setRelated] = useState([]);
  const [loadedEventId, setLoadedEventId] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  useEffect(() => {
    let active = true;
    if (!eventId) return () => { active = false; };
    offlineEventApi.get(eventId)
      .then((record) => {
        if (!active) return;
        if (!record) {
          setEvent(null);
          setLoadedEventId(eventId);
          setLoadError("This event is no longer available.");
          return;
        }
        setEvent(record);
        setSelectedPlanId((current) => current || String(record?.pricing_plans?.find((plan) => plan.is_featured)?.id || record?.pricing_plans?.[0]?.id || ""));
        setLoadedEventId(record?.slug || eventId);
        setLoadError("");
        if (record?.slug && window.location.pathname !== `/event/${record.slug}`) {
          router.replace(`/event/${encodeURIComponent(record.slug)}`);
        }
        // Related events are supplementary. A failed list request must never
        // turn a successfully loaded event detail into a page-level error.
        offlineEventApi.list({ per_page: 100 })
          .then((events) => {
            if (active) setRelated(events.filter((item) => String(item.id) !== String(record.id)).slice(0, 3));
          })
          .catch(() => {
            if (active) setRelated([]);
          });
      })
      .catch((error) => {
        if (!active) return;
        setEvent(null);
        setLoadedEventId(eventId);
        setLoadError(error?.response?.status === 404 ? "This event is no longer available." : "We could not load this event. Please try again.");
      });
    return () => { active = false; };
  }, [eventId, router]);

  const highlights = useMemo(() => (Array.isArray(event?.highlights) ? event.highlights : []).map((item) => typeof item === "string" ? { heading: item, description: "" } : item).filter((item) => item?.heading), [event]);
  const schedule = Array.isArray(event?.workshop_schedule) ? event.workshop_schedule : [];
  const instructor = event?.instructor;
  const status = formatOfflineEventStatus(event?.public_booking_status);
  const registrationCloses = event?.registration_closes_at || (event?.registration_deadline ? `${event.registration_deadline}T23:59:00` : null);
  const selectedPlan = event?.pricing_plans?.find((plan) => String(plan.id) === String(selectedPlanId));
  const planPrice = selectedPlan ? (Number(selectedPlan.discount_price) >= 0 && Number(selectedPlan.discount_price) < Number(selectedPlan.price) ? Number(selectedPlan.discount_price) : Number(selectedPlan.price)) : null;
  const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(planPrice ?? (Number(event?.ticket_price) || 0));
  const introVideoUrl = formatVideo(event?.intro_video);
  const videoIsEmbed = /youtube\.com\/embed|player\.vimeo\.com/.test(introVideoUrl);
  const bookedSeats = Number(event?.booked_seats) || 0;
  const totalSeats = event?.total_seats == null ? null : Number(event.total_seats);
  const availableSeats = event?.available_seats == null ? null : Number(event.available_seats);
  const filled = totalSeats ? Math.min(100, Math.round((bookedSeats / totalSeats) * 100)) : 0;
  const isLoading = Boolean(eventId) && loadedEventId !== eventId;

  if (!eventId) return <div id="EventDetailsPage"><div className="container"><div className="eventLoadingState" role="alert"><h1>Event not found</h1><Link href="/event">Browse events</Link></div></div></div>;
  if (isLoading) return <div id="EventDetailsPage"><ExperienceDetailsSkeleton type="event" /></div>;
  if (!event) return <div id="EventDetailsPage"><div className="container"><div className="eventLoadingState" role="alert"><h1>{loadError || "Event not found"}</h1><Link href="/event">Browse events</Link>{loadError && !loadError.includes("no longer") && <button type="button" onClick={() => window.location.reload()}>Retry</button>}</div></div></div>;

  return <div id="EventDetailsPage"><div className="container">
    <div className="eventBreadcrumbsWrapper"><Breadcrumbs items={[{ label: "Offline Events", path: "/event" }, { label: event.title }]} /></div>

    <div className="eventFullWidthMedia"><div className="eventMediaWrapper">
      {isVideoOpen ? <div className="eventInlineVideoWrapper">
        {videoIsEmbed ? <iframe src={introVideoUrl} title={`${event.title} introduction`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="eventInlineVideoPlayer" /> : <video src={introVideoUrl} controls autoPlay playsInline className="eventInlineVideoPlayer" />}
        <button type="button" className="closeInlineVideoBtn" onClick={() => setIsVideoOpen(false)} aria-label="Close video and show thumbnail"><FiX /></button>
      </div> : <>
        {event.thumbnail && <img src={resolveMediaUrl(event.thumbnail, "")} alt={event.title} className="eventFullImg" />}
        <div className="eventMediaOverlay" />
        <div className="mediaTopBadges"><span className="eventCategoryBadge">{event.category}</span><span className={`eventStatusBadge ${event.public_booking_status === "almost_full" ? "almost" : "open"}`}><span className="dot" />{status}</span></div>
        {introVideoUrl && <button type="button" className="eventIntroPlayBtn" onClick={() => setIsVideoOpen(true)} aria-label="Play introduction video"><FaPlay className="playIcon" /></button>}
      </>}
    </div></div>

    <div className="eventDetailsGrid">
      <div className="eventMainCol">
        <div className="eventHeaderSection"><div className="eventHeaderMetaTop">
          <span className="seatsLeftBadge"><FiUsers />{availableSeats == null ? "Unlimited capacity" : `${availableSeats} seats left out of ${totalSeats}`}</span>
          {event.registration_opens_at && <span className="deadlineNotice"><FiClock /> Registration opens: {formatDateTime(event.registration_opens_at)}</span>}
          {registrationCloses && <span className="deadlineNotice"><FiClock /> Registration closes: {formatDateTime(registrationCloses)}</span>}
        </div><h1 className="eventMainTitle">{event.title}</h1>{event.short_description && <p className="eventShortDescription">{event.short_description}</p>}</div>

        <div className="eventSpecsSection"><h2 className="sectionTitle">Event Details &amp; Logistics</h2><div className="specsGrid">
          <div className="specCard"><div className="specIconBox"><FiCalendar /></div><div className="specInfo"><span className="specLabel">Event Dates</span><span className="specValue">{formatDateRange(event.event_start_date, event.event_end_date)}</span></div></div>
          <div className="specCard"><div className="specIconBox"><FiClock /></div><div className="specInfo"><span className="specLabel">Daily Event Time</span><span className="specValue">{formatTime(event.daily_start_time)}{event.daily_end_time ? ` – ${formatTime(event.daily_end_time)}` : ""}</span></div></div>
          {event.duration_minutes && <div className="specCard"><div className="specIconBox"><FiCompass /></div><div className="specInfo"><span className="specLabel">Session Duration</span><span className="specValue">{event.duration_minutes} minutes</span></div></div>}
          {event.venue_name && <div className="specCard"><div className="specIconBox"><FiMapPin /></div><div className="specInfo"><span className="specLabel">Venue</span><span className="specValue">{event.venue_name}</span></div></div>}
          {(event.address || event.google_maps_url) && <div className="specCard fullWidthSpec"><div className="specIconBox"><FiNavigation /></div><div className="specInfo"><span className="specLabel">Location / Address</span><span className="specValue">{event.address}</span></div>{event.google_maps_url && <a href={event.google_maps_url} target="_blank" rel="noreferrer" className="mapLinkBtn">View on Map</a>}</div>}
        </div></div>

        <InstructorProfileCard person={instructor} sectionTitle="Instructor Profile" fallbackRole="Instructor" />

        {highlights.length > 0 && <div className="eventHighlightsSection"><h2 className="sectionTitle">Event Highlights &amp; Inclusions</h2><div className="highlightsGrid">{highlights.map((item, index) => <div key={`${item.heading}-${index}`} className="highlightCard"><div className="highlightCheck"><FiCheckCircle /></div><div className="highlightText"><h4>{item.heading}</h4>{item.description && <p>{item.description}</p>}</div></div>)}</div></div>}

        {schedule.length > 0 && <div className="eventScheduleSection"><h2 className="sectionTitle">Workshop Flow &amp; Schedule</h2><div className="scheduleTimeline">{schedule.map((item, index) => <div key={`${item.day}-${item.time_period}-${index}`} className="timelineItem"><div className="timelineMarker"><span className="markerCircle">{index + 1}</span>{index !== schedule.length - 1 && <span className="markerLine" />}</div><div className="timelineContent"><span className="timelineTime">{[item.day, item.time_period].filter(Boolean).join(" · ")}</span><h4 className="timelineTitle">{item.heading}</h4><p className="timelineDesc">{item.description}</p></div></div>)}</div></div>}

        {event.facilities_preparation && <div className="eventVenueFacilities"><h2 className="sectionTitle">Venue Facilities &amp; Preparation</h2><div className="facilitiesBox"><div className="facilityItem"><FiCheckCircle className="fIcon" /><div className="whitespace-pre-line">{event.facilities_preparation}</div></div></div></div>}
      </div>

      <aside className="eventSidebarCol"><div className="eventPassStickyCard"><div className="passHeader"><span className="passLabel">Event Pass</span><div className="passPriceWrapper"><span className="priceAmount">{currency}</span><span className="priceUnit">/ spot</span></div></div>
        <ExperiencePricingPlans plans={event.pricing_plans || []} value={selectedPlanId} onChange={setSelectedPlanId} />
        <div className="seatsStatusBox"><div className="seatsTopRow"><span className="seatsAvailableText"><FiUsers />{availableSeats == null ? <strong>Unlimited capacity</strong> : <><strong>{availableSeats} seats left</strong></>}</span>{totalSeats != null && <span className="seatsTotalText">{totalSeats} total</span>}</div>{totalSeats != null && <><div className="seatsProgressBar"><div className="progressBarFill" style={{ width: `${filled}%` }} /></div><span className="progressSubtext">{bookedSeats} booked · {filled}% filled</span></>}</div>
        {registrationCloses && <div className="deadlineAlertBox"><FiClock className="alertIcon" /><div><strong>Registration closes</strong><p>{formatDateTime(registrationCloses)}</p></div></div>}
        {selectedPlan ? <Link href={`/experience-checkout?type=event&id=${encodeURIComponent(event.slug || event.id)}&pricing_plan_id=${encodeURIComponent(selectedPlan.id)}`} className="bookSpotPrimaryBtn"><span>{event.booking_cta_label || "Book Your Spot"}</span><FiArrowRight /></Link> : <button type="button" className="bookSpotPrimaryBtn" disabled><span>Booking unavailable</span></button>}
      </div></aside>
    </div>

    {related.length > 0 && <section className="relatedEventsSection"><h2 className="relatedSectionTitle">Related Offline Workshops</h2><div className="relatedEventsGrid">{related.map((item) => <EventCard key={item.id} event={adaptOfflineEvent(item)} />)}</div></section>}
  </div></div>;
}

export default function EventDetails({ slug }) {
  return <Suspense fallback={<ExperienceDetailsSkeleton type="event" />}><EventDetailsContent slug={slug} /></Suspense>;
}
