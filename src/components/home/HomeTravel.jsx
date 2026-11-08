"use client";
import React from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import TravelCard from "../travelCard/TravelCard";
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
    link: "/traveldetails",
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
    link: "/traveldetails",
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
    link: "/traveldetails",
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
    link: "/traveldetails",
    videoUrl: "https://www.youtube.com/embed/g_tea8ZNk5A",
  },
];

const HomeTravel = ({ travels }) => {
  const items = travels !== undefined ? travels : DEFAULT_TRAVEL_RETREATS;

  const isSlider = items && items.length > 3;

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
