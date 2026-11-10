"use client";
import React from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import TravelCard, { TravelCardSkeleton } from "../travelCard/TravelCard";
import ElseDesign from "../elseDesign/ElseDesign";

import TravelImg1 from "@/assets/images/courseImg-6.webp";
import TravelImg2 from "@/assets/images/courseImg-7.webp";
import TravelImg3 from "@/assets/images/courseImg-4.webp";
import TravelImg4 from "@/assets/images/courseImg-5.webp";

import "@/assets/css/HomeTravel.scss";

export const DEFAULT_TRAVEL_RETREATS = [
  {
    id: 1,
    title: "Rishikesh Himalayan Yoga & Spiritual Retreat",
    description: "Immerse in morning Ganga aarti, sacred meditation caves, and masterclasses in the world yoga capital.",
    image: TravelImg1,
    category: "Spiritual Journey",
    status: "Booking Open",
    destination: "Rishikesh, Himalayas",
    startDate: "15 Dec 2026",
    endDate: "20 Dec 2026",
    duration: "6 Days / 5 Nights",
    totalSlots: 20,
    bookedSlots: 14,
    price: "24,999",
    originalPrice: "29,999",
    slug: "rishikesh-himalayan-retreat",
    link: "/travel/travel-details",
    videoUrl: "https://www.youtube.com/embed/inpok4MKVLM",
  },
  {
    id: 2,
    title: "Wayanad Rainforest Wellness & Ayurveda Escape",
    description: "Rejuvenating forest bathing, authentic Kerala Panchakarma therapies, and daily sunrise pranayama.",
    image: TravelImg2,
    category: "Wellness Tour",
    status: "Almost Full",
    destination: "Wayanad, Kerala",
    startDate: "08 Jan 2027",
    endDate: "12 Jan 2027",
    duration: "5 Days / 4 Nights",
    totalSlots: 15,
    bookedSlots: 12,
    price: "18,499",
    originalPrice: "22,000",
    slug: "wayanad-rainforest-escape",
    link: "/travel/travel-details",
    videoUrl: "https://www.youtube.com/embed/sTANio_2E0Q",
  },
  {
    id: 3,
    title: "Gokarna Cliffside Sunset Yoga & Beach Camp",
    description: "Ocean breeze meditation, cliffside vinyasa flows, and sound healing under the coastal starlit sky.",
    image: TravelImg3,
    category: "Yoga Retreat",
    status: "Booking Open",
    destination: "Gokarna, Karnataka",
    startDate: "22 Jan 2027",
    endDate: "26 Jan 2027",
    duration: "5 Days / 4 Nights",
    totalSlots: 18,
    bookedSlots: 9,
    price: "15,999",
    originalPrice: "19,500",
    slug: "gokarna-sunset-camp",
    link: "/travel/travel-details",
    videoUrl: "https://www.youtube.com/embed/4pKly2JojMw",
  },
  {
    id: 4,
    title: "Varkala Cliff Tantra & Breathwork Immersion",
    description: "Transformative breathwork and restorative sound baths overlooking the red cliffs of the Arabian Sea.",
    image: TravelImg4,
    category: "Wellness Tour",
    status: "Upcoming",
    destination: "Varkala, Kerala",
    startDate: "10 Feb 2027",
    endDate: "14 Feb 2027",
    duration: "5 Days / 4 Nights",
    totalSlots: 16,
    bookedSlots: 4,
    price: "16,499",
    originalPrice: "19,999",
    slug: "varkala-cliff-immersion",
    link: "/travel/travel-details",
    videoUrl: "https://www.youtube.com/embed/g_tea8ZNk5A",
  },
  {
    id: 5,
    title: "Munnar Misty Hills Tea Garden Yoga Retreat",
    description: "High altitude pranayama, organic herbal tea tasting tours, and cliffside sunrise meditations in the Western Ghats.",
    image: TravelImg1,
    category: "Wellness Tour",
    status: "Booking Open",
    destination: "Munnar, Kerala",
    startDate: "20 Feb 2027",
    endDate: "24 Feb 2027",
    duration: "5 Days / 4 Nights",
    totalSlots: 15,
    bookedSlots: 8,
    price: "17,999",
    originalPrice: "21,500",
    slug: "munnar-misty-hills-retreat",
    link: "/travel/travel-details",
    videoUrl: "https://www.youtube.com/embed/inpok4MKVLM",
  },
  {
    id: 6,
    title: "Pondicherry French Quarter & Seaside Yoga Escape",
    description: "Serene French heritage ashram stays, sunrise beach asanas, and mindful walks through Auroville spiritual community.",
    image: TravelImg2,
    category: "Spiritual Journey",
    status: "Almost Full",
    destination: "Pondicherry, Tamil Nadu",
    startDate: "05 Mar 2027",
    endDate: "09 Mar 2027",
    duration: "5 Days / 4 Nights",
    totalSlots: 14,
    bookedSlots: 11,
    price: "19,999",
    originalPrice: "24,000",
    slug: "pondicherry-coastal-escape",
    link: "/travel/travel-details",
    videoUrl: "https://www.youtube.com/embed/sTANio_2E0Q",
  },
];

const HomeTravel = ({ travels, isLoading = false, loading = false }) => {
  const isCardLoading = isLoading || loading;
  const items = travels !== undefined ? travels : DEFAULT_TRAVEL_RETREATS;

  // Show 3 cards per view on desktop slider
  const isSlider = items && items.length > 3;

  if (isCardLoading) {
    return (
      <div id="HomeTravel">
        <div className="container">
          <div className="HomeTravelHead">
            <h2>
              <span>Travel &amp;</span> Retreats
            </h2>
          </div>
          <div className="HomeTravelMain">
            <div className="travelGrid count-3">
              <div className="travelGridItem">
                <TravelCardSkeleton />
              </div>
              <div className="travelGridItem">
                <TravelCardSkeleton />
              </div>
              <div className="travelGridItem">
                <TravelCardSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="HomeTravel">
      <div className="container">
        <div className="HomeTravelHead">
          <h2>
            <span>Travel</span> & Retreats
          </h2>

          <div className="headRightActions">
            {isSlider && (
              <div className="travelNavArrows">
                <button
                  type="button"
                  className="navArrowBtn travel-prev"
                  aria-label="Previous retreats"
                >
                  <FaChevronLeft />
                </button>
                <button
                  type="button"
                  className="navArrowBtn travel-next"
                  aria-label="Next retreats"
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
            {items && items.length > 0 && (
              <Link href="/travel" className="viewAllBtn">
                View All
              </Link>
            )}
          </div>
        </div>

        <div className="HomeTravelMain">
          {!items || items.length === 0 ? (
            <ElseDesign
              title="No Travel Programs Found"
              message="There are currently no travel retreats or journeys available right now. Please check back soon!"
            />
          ) : isSlider ? (
            <Swiper
              modules={[Navigation]}
              navigation={{
                nextEl: ".travel-next",
                prevEl: ".travel-prev",
              }}
              loop={items.length > 3}
              slidesPerView={3}
              spaceBetween={24}
              breakpoints={{
                320: { slidesPerView: 1.1, spaceBetween: 14 },
                640: { slidesPerView: 1.6, spaceBetween: 18 },
                768: { slidesPerView: 2, spaceBetween: 20 },
                1024: { slidesPerView: 3, spaceBetween: 24 },
              }}
            >
              {items.map((travel, i) => (
                <SwiperSlide key={travel?.id || i}>
                  <TravelCard travel={travel} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className={`travelGrid count-${items.length}`}>
              {items.map((travel, i) => (
                <div key={travel?.id || i} className="travelGridItem">
                  <TravelCard travel={travel} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeTravel;
