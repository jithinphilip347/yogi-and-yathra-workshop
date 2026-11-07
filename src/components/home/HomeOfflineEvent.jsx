"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import EventCard from "../eventCard/EventCard";
import ElseDesign from "../elseDesign/ElseDesign";
import "@/assets/css/HomeOfflineEvent.scss";

const HomeOfflineEvent = ({ events = [] }) => {
  const [items] = useState(events);

  return (
    <div id="HomeOfflineEvent">
      <div className="container">
        <div className="HomeOfflineEventHead">
          <h2>
            <span>Offline</span> Events
          </h2>
          {items && items.length > 0 && (
            <Link href="/events" className="viewAllBtn">
              View All
            </Link>
          )}
        </div>

        <div className="HomeOfflineEventMain">
          {!items || items.length === 0 ? (
            <ElseDesign
              title="No Offline Events Found"
              message="There are currently no offline events scheduled. Please check back later!"
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
                {items.map((event, i) => (
                  <SwiperSlide key={event?.id || i}>
                    <EventCard event={event} />
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

export default HomeOfflineEvent;

