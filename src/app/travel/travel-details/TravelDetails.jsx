"use client";
import React, { useState, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Breadcrumbs from "@/components/breadcrumbs/Breadcrumbs";
import TravelCard from "@/components/travelCard/TravelCard";
import { DEFAULT_TRAVEL_RETREATS } from "@/components/home/HomeTravel";
import TravelImg1 from "@/assets/images/courseImg-6.webp";
import CoordinatorImg from "@/assets/images/instructor-2.webp";
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
  FiAward,
  FiCompass,
  FiNavigation,
  FiHome,
  FiCoffee,
  FiTruck,
} from "react-icons/fi";
import { FaPlay } from "react-icons/fa";
import "@/assets/css/TravelDetails.scss";

const TravelDetailsContent = () => {
  const searchParams = useSearchParams();
  const travelId = searchParams?.get("id");
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // Find retreat by ID if provided, otherwise default to first retreat
  const currentRetreat = useMemo(() => {
    if (travelId) {
      const match = DEFAULT_TRAVEL_RETREATS.find(
        (t) => String(t.id) === String(travelId) || t.slug === travelId
      );
      if (match) return match;
    }
    return DEFAULT_TRAVEL_RETREATS[0];
  }, [travelId]);

  // Related retreats: exclude current retreat and show up to 3
  const relatedRetreats = useMemo(() => {
    return DEFAULT_TRAVEL_RETREATS.filter(
      (t) => String(t.id) !== String(currentRetreat?.id || 1)
    ).slice(0, 3);
  }, [currentRetreat]);

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
    currentRetreat?.videoUrl && String(currentRetreat.videoUrl).trim() !== ""
      ? String(currentRetreat.videoUrl).trim()
      : sampleFallbackVideo;

  const retreatTitle = currentRetreat?.title || "Rishikesh Himalayan Yoga & Spiritual Retreat";
  const retreatCategory = currentRetreat?.category || "Yoga Retreat";
  const retreatStatus = currentRetreat?.status || "Booking Open";
  const destination = currentRetreat?.destination || "Rishikesh, Himalayas, Uttarakhand";
  const startingPoint = "New Delhi (IGI Airport) / Dehradun Airport (DED)";
  const startDate = currentRetreat?.startDate || "15 Dec 2026";
  const endDate = currentRetreat?.endDate || "20 Dec 2026";
  const duration = currentRetreat?.duration || "6 Days / 5 Nights";
  const totalSlots = currentRetreat?.totalSlots || 20;
  const bookedSlots = currentRetreat?.bookedSlots || 14;
  const availableSlots = Math.max(0, totalSlots - bookedSlots);
  const progressPercent = Math.round((bookedSlots / totalSlots) * 100);
  const pricePerPerson = currentRetreat?.price || "24,999";
  const discountPrice = currentRetreat?.originalPrice || "29,999";
  const coordinatorName = "Swami Shivananda & Acharya Meera";

  const travelHighlights = [
    {
      title: "Daily Sunrise Ganga Aarti & River Meditation",
      desc: "Awaken to Vedic chants and sacred fire ceremonies at Parmarth Niketan ghats.",
    },
    {
      title: "Vashishta Cave Silent Meditation Immersion",
      desc: "Practice deep Dhyana inside the historic 3,000-year-old Himalayan sage cave.",
    },
    {
      title: "Ancient Kundalini & Himalayan Pranayama",
      desc: "Master sacred breath retention techniques with traditional Himalayan yogis.",
    },
    {
      title: "Tibetan Sound Bowl & Chakra Rebalancing",
      desc: "Evening restorative sound frequencies resonating under the starlit Himalayan sky.",
    },
    {
      title: "Guided Forest Bathing & Waterfall Hike",
      desc: "Mindful nature walks through pristine oak forests and holy Himalayan springs.",
    },
    {
      title: "1-on-1 Personalized Ayurvedic Consultation",
      desc: "Comprehensive Nadi Pariksha (pulse reading) and dosha balance regimen with resident Vaidya.",
    },
  ];

  const itineraryDays = [
    {
      day: "Day 1",
      title: "Arrival, Sacred Welcome & Ganga Aarti",
      desc: "Pickup from Dehradun Airport, check-in to riverside resort, evening traditional welcome circle and private sunset Ganga Aarti.",
    },
    {
      day: "Day 2",
      title: "Sunrise Hatha Sadhana & Vashishta Guha",
      desc: "Morning energizing asana practice on the wooden deck, Sattvic breakfast, followed by guided silence meditation at Vashishta Cave.",
    },
    {
      day: "Day 3",
      title: "Himalayan Forest Trail & Sound Bath",
      desc: "Forest bathing meditation walk to Neer Garh waterfall, outdoor breathwork, and evening Tibetan singing bowl sound healing session.",
    },
    {
      day: "Day 4",
      title: "Ayurvedic Lifestyle Workshop & Yoga Nidra",
      desc: "Personalized Ayurvedic consultation, Sattvic cooking demonstration, and sunset deep restorative Yoga Nidra under starry skies.",
    },
    {
      day: "Day 5",
      title: "Kunjapuri Temple Sunrise & Sacred Yajna",
      desc: "Early morning drive for sunrise view of Himalayan snow peaks, sacred fire prayer ceremony, and closing bonfire sharing circle.",
    },
    {
      day: "Day 6",
      title: "Closing Circle, Blessing & Departure",
      desc: "Morning gratitude meditation, farewell organic brunch, certificate handover, and comfortable coach transfer back to Dehradun.",
    },
  ];

  return (
    <div id="TravelDetailsPage">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <div className="travelBreadcrumbsWrapper">
          <Breadcrumbs
            items={[
              { label: "Travel & Retreats", path: "/travel" },
              { label: retreatTitle },
            ]}
          />
        </div>

        {/* ════════ 1. FULL-WIDTH THUMBNAIL & INLINE VIDEO BANNER ════════ */}
        <div className="travelFullWidthMedia">
          <div className="travelMediaWrapper">
            {isVideoOpen ? (
              <div className="travelInlineVideoWrapper">
                <video
                  src="/travel.mp4"
                  controls
                  autoPlay
                  playsInline
                  className="travelInlineVideoPlayer"
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
                  src={currentRetreat?.image || TravelImg1}
                  alt={retreatTitle}
                  fill
                  priority
                  sizes="(max-width: 1440px) 100vw, 1400px"
                  className="travelFullImg"
                />
                <div className="travelMediaOverlay" />

                {/* Top Corner Badges */}
                <div className="mediaTopBadges">
                  <span className="travelCategoryBadge">{retreatCategory}</span>
                  <span
                    className={`travelStatusBadge ${
                      retreatStatus.toLowerCase().includes("almost") ? "almost" : "open"
                    }`}
                  >
                    <span className="dot" />
                    {retreatStatus}
                  </span>
                </div>

                {/* Intro Video Play Button in Center */}
                <button
                  type="button"
                  className="travelIntroPlayBtn"
                  onClick={() => setIsVideoOpen(true)}
                  aria-label="Play retreat intro video"
                >
                  <FaPlay className="playIcon" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ════════ 2-COLUMN LAYOUT: Content (Left) + Sticky Pass Box (Right) ════════ */}
        <div className="travelDetailsGrid">
          {/* ════════ LEFT COLUMN: Overview, Specs, Accommodations, Itinerary ════════ */}
          <div className="travelMainCol">
            {/* Header: Title & Meta */}
            <div className="travelHeaderSection">
              <div className="travelHeaderMetaTop">
                <span className="slotsAvailableBadge">
                  <FiUsers /> {availableSlots} Slots Available (Out of {totalSlots})
                </span>
                <span className="durationBadge">
                  <FiClock /> {duration}
                </span>
              </div>

              <h1 className="travelMainTitle">{retreatTitle}</h1>

              <p className="travelShortDescription">
                {currentRetreat?.description ||
                  "Escape the frantic pace of modern life and immerse yourself in the foothills of the Himalayas. Guided by revered yoga masters, this soul-nourishing retreat brings together daily Ganga sunrise yoga, sacred cave meditation, pristine mountain trails, and restorative Ayurvedic therapies for complete body and spirit rejuvenation."}
              </p>
            </div>

            {/* Retreat Overview & Specifications Grid */}
            <div className="travelSpecsSection">
              <h2 className="sectionTitle">Retreat Overview & Specifications</h2>
              <div className="specsGrid">
                {/* Destination */}
                <div className="specCard">
                  <div className="specIconBox">
                    <FiMapPin />
                  </div>
                  <div className="specInfo">
                    <span className="specLabel">Destination</span>
                    <span className="specValue">{destination}</span>
                  </div>
                </div>

                {/* Starting Point */}
                <div className="specCard">
                  <div className="specIconBox">
                    <FiNavigation />
                  </div>
                  <div className="specInfo">
                    <span className="specLabel">Starting Point</span>
                    <span className="specValue">{startingPoint}</span>
                  </div>
                </div>

                {/* Travel Start Date */}
                <div className="specCard">
                  <div className="specIconBox">
                    <FiCalendar />
                  </div>
                  <div className="specInfo">
                    <span className="specLabel">Travel Start Date</span>
                    <span className="specValue">{startDate}</span>
                  </div>
                </div>

                {/* Travel End Date */}
                <div className="specCard">
                  <div className="specIconBox">
                    <FiCalendar />
                  </div>
                  <div className="specInfo">
                    <span className="specLabel">Travel End Date</span>
                    <span className="specValue">{endDate}</span>
                  </div>
                </div>

                {/* Duration (Days / Nights) */}
                <div className="specCard">
                  <div className="specIconBox">
                    <FiClock />
                  </div>
                  <div className="specInfo">
                    <span className="specLabel">Duration (Days / Nights)</span>
                    <span className="specValue">{duration}</span>
                  </div>
                </div>

                {/* Price Per Person & Discount Price */}
                <div className="specCard">
                  <div className="specIconBox">
                    <FiAward />
                  </div>
                  <div className="specInfo">
                    <span className="specLabel">Price Per Person</span>
                    <span className="specValue">
                      ₹{pricePerPerson}{" "}
                      {discountPrice && (
                        <span className="strikePrice">₹{discountPrice}</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Slot Availability & Booking Progress Bar */}
                <div className="specCard fullWidthSpec slotProgressCard">
                  <div className="slotProgressTop">
                    <div className="slotCounts">
                      <span className="totalSlots">Total: <strong>{totalSlots} Slots</strong></span>
                      <span className="bookedSlots">Booked: <strong>{bookedSlots} Slots</strong></span>
                      <span className="availSlots">Available: <strong>{availableSlots} Slots Left</strong></span>
                    </div>
                    <span className="percentLabel">{progressPercent}% Filled</span>
                  </div>

                  {/* Booking Progress Bar */}
                  <div className="bookingProgressBar">
                    <div
                      className="progressFill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Accommodation Details */}
            <div className="travelSectionBlock">
              <h2 className="sectionTitle">
                <FiHome className="titleIcon" /> Accommodation Details
              </h2>
              <div className="contentCard">
                <p className="cardIntroText">
                  Enjoy tranquil comfort at our partner eco-wellness resort & riverside boutique ashram,
                  situated directly on the banks of the sacred Ganga River:
                </p>
                <div className="featureListGrid">
                  <div className="featureItem">
                    <FiCheckCircle className="featIcon" />
                    <div>
                      <strong>5 Nights Deluxe Stay:</strong> Choose between private cottage or twin-sharing luxury rooms.
                    </div>
                  </div>
                  <div className="featureItem">
                    <FiCheckCircle className="featIcon" />
                    <div>
                      <strong>Breathtaking Views:</strong> Private balcony overlooking forested Himalayan hills and the emerald Ganga.
                    </div>
                  </div>
                  <div className="featureItem">
                    <FiCheckCircle className="featIcon" />
                    <div>
                      <strong>Modern Amenities:</strong> En-suite modern bathrooms, solar 24/7 hot showers, organic toiletries & Wi-Fi.
                    </div>
                  </div>
                  <div className="featureItem">
                    <FiCheckCircle className="featIcon" />
                    <div>
                      <strong>Peaceful Shala:</strong> Open-air teakwood yoga shala surrounded by fruit orchards and flowering gardens.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Food & Meals Information */}
            <div className="travelSectionBlock">
              <h2 className="sectionTitle">
                <FiCoffee className="titleIcon" /> Food & Meals Information
              </h2>
              <div className="contentCard">
                <p className="cardIntroText">
                  Nourish your body and clarify your mind with fresh, chef-curated Sattvic cuisine:
                </p>
                <div className="featureListGrid">
                  <div className="featureItem">
                    <FiCheckCircle className="featIcon" />
                    <div>
                      <strong>3 Organic Meals Daily:</strong> Wholesome Breakfast, energizing Lunch, and light Ayurvedic Dinner.
                    </div>
                  </div>
                  <div className="featureItem">
                    <FiCheckCircle className="featIcon" />
                    <div>
                      <strong>Farm-to-Table Freshness:</strong> Prepared with certified organic Himalayan grains, seasonal vegetables & cold-pressed oils.
                    </div>
                  </div>
                  <div className="featureItem">
                    <FiCheckCircle className="featIcon" />
                    <div>
                      <strong>Herbal Drinks & Infusions:</strong> Morning warm herbal decoctions, freshly squeezed detox juices, and evening spiced chai.
                    </div>
                  </div>
                  <div className="featureItem">
                    <FiCheckCircle className="featIcon" />
                    <div>
                      <strong>Dietary Customization:</strong> Vegan, dairy-free, and gluten-free dietary preferences accommodated upon request.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transportation Details */}
            <div className="travelSectionBlock">
              <h2 className="sectionTitle">
                <FiTruck className="titleIcon" /> Transportation Details
              </h2>
              <div className="contentCard">
                <p className="cardIntroText">
                  Complete seamless transit arranged from the moment you land:
                </p>
                <div className="featureListGrid">
                  <div className="featureItem">
                    <FiCheckCircle className="featIcon" />
                    <div>
                      <strong>Airport / Station Transfers:</strong> Complimentary AC luxury coach pickup and drop-off from Dehradun Airport (DED) and Haridwar Junction.
                    </div>
                  </div>
                  <div className="featureItem">
                    <FiCheckCircle className="featIcon" />
                    <div>
                      <strong>Excursion Transit:</strong> All temple visits, cave trails, and mountain sightseeing in private sanitized vehicles.
                    </div>
                  </div>
                  <div className="featureItem">
                    <FiCheckCircle className="featIcon" />
                    <div>
                      <strong>Experienced Drivers:</strong> Certified mountain chauffeurs ensuring safe, smooth hill driving throughout.
                    </div>
                  </div>
                  <div className="featureItem">
                    <FiCheckCircle className="featIcon" />
                    <div>
                      <strong>Coordinator Assistance:</strong> Dedicated travel lead accompanying group at all departure and transit points.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Travel Highlights & Day-Wise Itinerary */}
            <div className="travelSectionBlock">
              <h2 className="sectionTitle">
                <FiCompass className="titleIcon" /> Travel Highlights & Day-Wise Itinerary
              </h2>
              <div className="highlightsGrid">
                {travelHighlights.map((hl, idx) => (
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

              {/* Day-Wise Breakdown */}
              <div className="itineraryTimeline">
                <h3 className="subSectionTitle">Detailed Day-Wise Journey</h3>
                {itineraryDays.map((item, idx) => (
                  <div key={idx} className="timelineItem">
                    <div className="timelineMarker">
                      <span className="markerCircle">{item.day}</span>
                      {idx !== itineraryDays.length - 1 && <span className="markerLine" />}
                    </div>
                    <div className="timelineContent">
                      <h4 className="timelineTitle">{item.title}</h4>
                      <p className="timelineDesc">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor / Travel Coordinator Profile */}
            <div className="travelSectionBlock">
              <h2 className="sectionTitle">
                <FiShield className="titleIcon" /> Instructor & Travel Coordinator
              </h2>
              <div className="coordinatorCard">
                <div className="coordinatorAvatarCol">
                  <Image
                    src={CoordinatorImg}
                    alt={coordinatorName}
                    width={90}
                    height={90}
                    className="coordinatorImg"
                  />
                  <span className="verifiedPill">
                    <FiShield /> Certified Guide
                  </span>
                </div>
                <div className="coordinatorDetailsCol">
                  <h3 className="coordinatorName">{coordinatorName}</h3>
                  <p className="coordinatorRole">Lead Spiritual Mentor & Senior Retreat Coordinator</p>
                  <p className="coordinatorBio">
                    Swami Shivananda brings over 30 years of traditional Vedic study and Himalayan meditation
                    lineage. Assisted by senior yoga instructor Acharya Meera, the duo crafts deeply immersive,
                    safe, and transformational journeys that leave participants renewed for months after returning home.
                  </p>
                  <div className="coordinatorTags">
                    <span className="cTag">Vedic Meditation</span>
                    <span className="cTag">Pranayama</span>
                    <span className="cTag">Ayurvedic Wisdom</span>
                    <span className="cTag">Himalayan Trails</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ════════ RIGHT COLUMN: Sticky Package Pass Box (Beside Title) ════════ */}
          <div className="travelSidebarCol">
            <div className="travelPassStickyCard">
              <div className="passHeader">
                <span className="passLabel">All-Inclusive Retreat Package</span>
                <div className="passPriceWrapper">
                  <span className="currency">₹</span>
                  <span className="priceAmount">{pricePerPerson}</span>
                  <span className="priceUnit">/ person</span>
                </div>
                {discountPrice && (
                  <div className="savingsRow">
                    <span className="originalPrice">₹{discountPrice}</span>
                    <span className="discountTag">Save ₹5,000 (17% OFF)</span>
                  </div>
                )}
              </div>

              {/* Slot Availability & Progress Bar */}
              <div className="slotStatusBox">
                <div className="slotTopRow">
                  <span className="slotAvailableText">
                    <FiUsers /> Only <strong>{availableSlots} Slots Left</strong>
                  </span>
                  <span className="slotTotalText">{totalSlots} Total</span>
                </div>
                <div className="slotProgressBar">
                  <div
                    className="progressBarFill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="progressSubtext">
                  {bookedSlots} of {totalSlots} slots booked • High demand
                </span>
              </div>

              {/* Quick Trip Details Recap */}
              <div className="quickRecapBox">
                <div className="recapRow">
                  <FiCalendar className="rIcon" />
                  <div>
                    <span className="rLabel">Dates</span>
                    <span className="rVal">{startDate} - {endDate}</span>
                  </div>
                </div>
                <div className="recapRow">
                  <FiClock className="rIcon" />
                  <div>
                    <span className="rLabel">Duration</span>
                    <span className="rVal">{duration}</span>
                  </div>
                </div>
                <div className="recapRow">
                  <FiNavigation className="rIcon" />
                  <div>
                    <span className="rLabel">Starting Point</span>
                    <span className="rVal">{startingPoint.split("/")[0]}</span>
                  </div>
                </div>
              </div>

              {/* Explore Journey / Book Your Spot Button */}
              <Link
                href={`/checkout?type=travel&id=${currentRetreat?.id || 1}`}
                className="exploreJourneyPrimaryBtn"
              >
                <span>Explore Journey & Reserve Spot</span>
                <FiArrowRight />
              </Link>

              {/* Package Inclusions Recap List */}
              <div className="packageInclusionsList">
                <div className="inclusionItem">
                  <FiCheckCircle className="iIcon" />
                  <span>5 Nights Luxury Ashram / Resort Stay</span>
                </div>
                <div className="inclusionItem">
                  <FiCheckCircle className="iIcon" />
                  <span>All 3 Organic Sattvic Meals Daily</span>
                </div>
                <div className="inclusionItem">
                  <FiCheckCircle className="iIcon" />
                  <span>Airport / Railway Station Transfers</span>
                </div>
                <div className="inclusionItem">
                  <FiCheckCircle className="iIcon" />
                  <span>All Yoga, Pranayama & Meditation Classes</span>
                </div>
                <div className="inclusionItem">
                  <FiShield className="iIcon" />
                  <span>100% Guaranteed Safe Departure</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════ RELATED TRAVELS SECTION (Title Only, Left-Aligned) ════════ */}
        <section className="relatedTravelsSection">
          <h2 className="relatedSectionTitle">Related Yoga Travels & Retreats</h2>
          <div className="relatedTravelsGrid">
            {relatedRetreats.map((item) => (
              <TravelCard key={item.id} travel={item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default function TravelDetails({ retreatData }) {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "120px 20px", textAlign: "center", fontFamily: "myFont1" }}>
          Loading Retreat Details...
        </div>
      }
    >
      <TravelDetailsContent retreatData={retreatData} />
    </Suspense>
  );
}
