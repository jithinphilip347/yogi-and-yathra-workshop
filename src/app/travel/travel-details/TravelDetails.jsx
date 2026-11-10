"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumbs from "@/components/breadcrumbs/Breadcrumbs";
import TravelCard from "@/components/travelCard/TravelCard";
import InstructorProfileCard from "@/components/instructorProfile/InstructorProfileCard";
import { adaptTravelPackage, formatTravelDate, travelPackageApi } from "@/services/travelPackageApi";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiCheckCircle, FiArrowRight, FiX, FiAward, FiNavigation, FiHome, FiCoffee, FiTruck } from "react-icons/fi";
import { FaPlay } from "react-icons/fa";
import "@/assets/css/TravelDetails.scss";

const formatVideo = (url) => {
  if (!url) return "";
  const value = String(url).trim();
  const match = value.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0` : resolveMediaUrl(value, "");
};
const priceLabel = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);
const bookingLabels = { open: "Booking Open", almost_full: "Almost Full", full: "Fully Booked", upcoming: "Upcoming", closed: "Registration Closed", unavailable: "Unavailable" };

function TravelDetailsContent({ slug }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyId = searchParams?.get("id");
  const travelId = slug === "travel-details" && legacyId ? legacyId : slug || legacyId;
  const [record, setRecord] = useState(null);
  const [related, setRelated] = useState([]);
  const [loadedId, setLoadedId] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  useEffect(() => {
    if (!travelId) return undefined;
    let active = true;
    Promise.all([travelPackageApi.get(travelId), travelPackageApi.list({ per_page: 100 })])
      .then(([item, items]) => {
        if (!active) return;
        setRecord(item);
        setRelated(items.filter((candidate) => String(candidate.id) !== String(item?.id)).slice(0, 3).map(adaptTravelPackage).filter(Boolean));
        setLoadError("");
        setLoadedId(item?.slug || travelId);
        if (item?.slug && window.location.pathname !== `/travel/${item.slug}`) {
          router.replace(`/travel/${encodeURIComponent(item.slug)}`);
        }
      })
      .catch((error) => {
        if (!active) return;
        setRecord(null);
        setLoadedId(travelId);
        setLoadError(error?.response?.status === 404 ? "This travel package is no longer available." : "We could not load this travel package. Please try again.");
      });
    return () => { active = false; };
  }, [travelId, router]);

  const current = useMemo(() => adaptTravelPackage(record), [record]);
  const highlights = Array.isArray(record?.highlights) ? record.highlights.map((item) => typeof item === "string" ? { heading: item, description: "" } : item).filter((item) => item?.heading) : [];
  const itinerary = Array.isArray(record?.itinerary) ? record.itinerary : [];
  const accommodation = Array.isArray(record?.accommodation_items) ? record.accommodation_items : [];
  const meals = Array.isArray(record?.meal_items) ? record.meal_items : [];
  const transport = Array.isArray(record?.transportation_items) ? record.transportation_items : [];
  const coordinator = record?.coordinator;
  const status = bookingLabels[record?.public_booking_status] || "Upcoming";
  const videoUrl = formatVideo(record?.intro_video);
  const videoEmbed = /youtube\.com\/embed|player\.vimeo\.com/.test(videoUrl);
  const total = record?.total_slots == null ? null : Number(record.total_slots);
  const booked = Number(record?.booked_slots) || 0;
  const available = record?.available_slots == null ? null : Number(record.available_slots);
  const progress = total ? Math.min(100, Math.round((booked / total) * 100)) : 0;
  const hasDiscount = current?.hasDiscount;
  const busy = Boolean(travelId) && loadedId !== travelId;

  if (!travelId) return <div id="TravelDetailsPage"><div className="container"><div className="travelContentState" role="alert"><h1>Travel package not found</h1><Link href="/travel">Browse travel packages</Link></div></div></div>;
  if (busy) return <div id="TravelDetailsPage"><div className="container"><div className="travelContentState" role="status">Loading travel package…</div></div></div>;
  if (!record) return <div id="TravelDetailsPage"><div className="container"><div className="travelContentState" role="alert"><h1>{loadError || "Travel package not found"}</h1><Link href="/travel">Browse travel packages</Link>{loadError && !loadError.includes("no longer") && <button type="button" onClick={() => window.location.reload()}>Retry</button>}</div></div></div>;

  return <div id="TravelDetailsPage"><div className="container">
    <div className="travelBreadcrumbsWrapper"><Breadcrumbs items={[{ label: "Travel & Retreats", path: "/travel" }, { label: record.title }]} /></div>
    <div className="travelFullWidthMedia"><div className="travelMediaWrapper">
      {isVideoOpen ? <div className="travelInlineVideoWrapper">{videoEmbed ? <iframe src={videoUrl} title={`${record.title} introduction`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="travelInlineVideoPlayer" /> : <video src={videoUrl} controls autoPlay playsInline className="travelInlineVideoPlayer" />}<button type="button" className="closeInlineVideoBtn" onClick={() => setIsVideoOpen(false)} aria-label="Close video and show thumbnail"><FiX /></button></div> : <>
        {record.thumbnail && <img src={resolveMediaUrl(record.thumbnail, "")} alt={record.title} className="travelFullImg" />}
        <div className="travelMediaOverlay" />
        <div className="mediaTopBadges"><span className="travelCategoryBadge">{current.categoryLabel}</span><span className={`travelStatusBadge ${record.public_booking_status === "almost_full" || record.public_booking_status === "full" ? "almost" : "open"}`}><span className="dot" />{status}</span></div>
        {videoUrl && <button type="button" className="travelIntroPlayBtn" onClick={() => setIsVideoOpen(true)} aria-label="Play travel introduction"><FaPlay className="playIcon" /></button>}
      </>}
    </div></div>

    <div className="travelDetailsGrid"><div className="travelMainCol">
      <div className="travelHeaderSection"><div className="travelHeaderMetaTop"><span className="slotsAvailableBadge"><FiUsers /> {available == null ? "Unlimited slots" : `${available} Slots Available${total == null ? "" : ` (Out of ${total})`}`}</span><span className="durationBadge"><FiClock /> {current.durationLabel}</span></div><h1 className="travelMainTitle">{record.title}</h1>{record.short_description && <p className="travelShortDescription">{record.short_description}</p>}</div>

      <div className="travelSpecsSection"><h2 className="sectionTitle">Travel Overview &amp; Specifications</h2><div className="specsGrid">
        <div className="specCard"><div className="specIconBox"><FiMapPin /></div><div className="specInfo"><span className="specLabel">Destination</span><span className="specValue">{record.destination}</span></div></div>
        <div className="specCard"><div className="specIconBox"><FiNavigation /></div><div className="specInfo"><span className="specLabel">Starting Point</span><span className="specValue">{record.starting_point}</span></div></div>
        <div className="specCard"><div className="specIconBox"><FiCalendar /></div><div className="specInfo"><span className="specLabel">Travel Dates</span><span className="specValue">{current.dateLabel}</span></div></div>
        <div className="specCard"><div className="specIconBox"><FiClock /></div><div className="specInfo"><span className="specLabel">Duration</span><span className="specValue">{current.durationLabel}</span></div></div>
        <div className="specCard"><div className="specIconBox"><FiAward /></div><div className="specInfo"><span className="specLabel">Price per person</span><span className="specValue">{priceLabel(current.effectivePrice)} {hasDiscount && <span className="strikePrice">{priceLabel(current.regularPrice)}</span>}</span></div></div>
        {(record.location_details || record.google_maps_url) && <div className="specCard fullWidthSpec"><div className="specIconBox"><FiMapPin /></div><div className="specInfo"><span className="specLabel">Location / Address</span><span className="specValue whitespace-pre-line">{record.location_details}</span></div>{record.google_maps_url && <a href={record.google_maps_url} target="_blank" rel="noreferrer" className="mapLinkBtn">View on Map</a>}</div>}
        {total != null && <div className="specCard fullWidthSpec slotProgressCard"><div className="slotProgressTop"><div className="slotCounts"><span className="totalSlots">Total: <strong>{total} Slots</strong></span><span className="bookedSlots">Booked: <strong>{booked} Slots</strong></span><span className="availSlots">Available: <strong>{available} Slots Left</strong></span></div><span className="percentLabel">{progress}% Filled</span></div><div className="bookingProgressBar"><div className="progressFill" style={{ width: `${progress}%` }} /></div></div>}
      </div></div>

      {accommodation.length > 0 && <div className="travelSectionBlock"><h2 className="sectionTitle"><FiHome className="titleIcon" /> Accommodation Details</h2><div className="contentCard"><div className="featureListGrid">{accommodation.map((item, index) => <div className="featureItem" key={`${item.point || item}-${index}`}><FiCheckCircle className="featIcon" /><div>{typeof item === "string" ? item : item.point}</div></div>)}</div></div></div>}
      {meals.length > 0 && <div className="travelSectionBlock"><h2 className="sectionTitle"><FiCoffee className="titleIcon" /> Food &amp; Meals Information</h2><div className="contentCard"><div className="featureListGrid">{meals.map((item, index) => <div className="featureItem" key={`${item.point || item}-${index}`}><FiCheckCircle className="featIcon" /><div>{typeof item === "string" ? item : item.point}</div></div>)}</div></div></div>}
      {transport.length > 0 && <div className="travelSectionBlock"><h2 className="sectionTitle"><FiTruck className="titleIcon" /> Transportation Details</h2><div className="contentCard"><div className="featureListGrid">{transport.map((item, index) => <div className="featureItem" key={`${item.point || item}-${index}`}><FiCheckCircle className="featIcon" /><div>{typeof item === "string" ? item : item.point}</div></div>)}</div></div></div>}
      {highlights.length > 0 && <div className="travelSectionBlock"><h2 className="sectionTitle"><FiCheckCircle className="titleIcon" /> Travel Highlights</h2><div className="highlightsGrid">{highlights.map((item, index) => <div key={`${item.heading}-${index}`} className="highlightCard"><div className="highlightCheck"><FiCheckCircle /></div><div className="highlightText"><h4>{item.heading}</h4>{item.description && <p>{item.description}</p>}</div></div>)}</div></div>}
      {itinerary.length > 0 && <div className="travelSectionBlock"><h2 className="sectionTitle"><FiCalendar className="titleIcon" /> Detailed Day-wise Journey</h2><div className="itineraryTimeline">{itinerary.map((item, index) => <div key={`${item.day}-${index}`} className="timelineItem"><div className="timelineMarker"><span className="markerCircle">{item.day}</span>{index !== itinerary.length - 1 && <span className="markerLine" />}</div><div className="timelineContent"><h4 className="timelineTitle">{item.heading}</h4><p className="timelineDesc">{item.description}</p></div></div>)}</div></div>}
      <InstructorProfileCard person={coordinator} sectionTitle="Meet your travel instructor" fallbackRole="Travel Instructor" />
    </div>

    <aside className="travelSidebarCol"><div className="travelPassStickyCard"><div className="passHeader"><span className="passLabel">Travel Package</span><div className="passPriceWrapper"><span className="currency">₹</span><span className="priceAmount">{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(current.effectivePrice)}</span><span className="priceUnit">/ person</span></div>{hasDiscount && <div className="savingsRow"><span className="originalPrice">₹{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(current.regularPrice)}</span></div>}</div>
      <div className="slotStatusBox"><div className="slotTopRow"><span className="slotAvailableText"><FiUsers /> <strong>{available == null ? "Unlimited slots" : `${available} Slots Left`}</strong></span>{total != null && <span className="slotTotalText">{total} Total</span>}</div>{total != null && <><div className="slotProgressBar"><div className="progressBarFill" style={{ width: `${progress}%` }} /></div><span className="progressSubtext">{booked} of {total} slots booked · {progress}% filled</span></>}</div>
      {record.registration_deadline && <div className="deadlineAlertBox"><FiClock className="alertIcon" /><div><strong>Booking deadline</strong><p>{formatTravelDate(record.registration_deadline)}</p></div></div>}
      <div className="quickRecapBox"><div className="recapRow"><FiCalendar className="rIcon" /><div><span className="rLabel">Dates</span><span className="rVal">{current.dateLabel}</span></div></div><div className="recapRow"><FiClock className="rIcon" /><div><span className="rLabel">Duration</span><span className="rVal">{current.durationLabel}</span></div></div><div className="recapRow"><FiNavigation className="rIcon" /><div><span className="rLabel">Starting Point</span><span className="rVal">{record.starting_point}</span></div></div></div>
      <Link href={`/checkout?type=travel&id=${encodeURIComponent(record.id)}`} className="exploreJourneyPrimaryBtn"><span>{record.booking_cta_label || "Explore Journey"}</span><FiArrowRight /></Link>
    </div></aside></div>
    {related.length > 0 && <section className="relatedTravelsSection"><h2 className="relatedSectionTitle">Related Yoga Travels &amp; Retreats</h2><div className="relatedTravelsGrid">{related.map((item) => <TravelCard key={item.id} travel={item} />)}</div></section>}
  </div></div>;
}

export default function TravelDetails({ slug }) {
  return <Suspense fallback={<div className="travelContentState" role="status">Loading travel package…</div>}><TravelDetailsContent slug={slug} /></Suspense>;
}
