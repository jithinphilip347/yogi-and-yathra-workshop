"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import TravelCard from "../travelCard/TravelCard";
import ElseDesign from "../elseDesign/ElseDesign";
import "@/assets/css/HomeTravel.scss";

const HomeTravel = ({ travels = [] }) => {
  const [items] = useState(travels);

  return (
    <div id="HomeTravel">
      <div className="container">
        <div className="HomeTravelHead">
          <h2>
            <span>Travel</span> & Retreats
          </h2>
          {items && items.length > 0 && (
            <Link href="/travel" className="viewAllBtn">
              View All
            </Link>
          )}
        </div>

        <div className="HomeTravelMain">
          {!items || items.length === 0 ? (
            <ElseDesign
              title="No Travel Programs Found"
              message="There are currently no travel retreats or journeys available right now. Please check back soon!"
            />
          ) : (
            <>
              <div className="swiper-btn prev-btn">
                <FaChevronLeft />
              </div>
              <div className="swiper-btn next-btn">
                <FaChevronRight />
              </div>

              <Swiper
                modules={[Navigation]}
                navigation={{
                  nextEl: ".next-btn",
                  prevEl: ".prev-btn",
                }}
                loop={items.length > 4}
                slidesPerView={4}
                spaceBetween={25}
                breakpoints={{
                  320: { slidesPerView: 1 },
                  480: { slidesPerView: 2 },
                  768: { slidesPerView: 3 },
                  1024: { slidesPerView: 3 },
                  1200: { slidesPerView: 4 },
                }}
              >
                {items.map((travel, i) => (
                  <SwiperSlide key={travel?.id || i}>
                    <TravelCard travel={travel} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeTravel;

