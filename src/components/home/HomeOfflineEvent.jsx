"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import EventCard from "../eventCard/EventCard";
import ElseDesign from "../elseDesign/ElseDesign";
import { adaptOfflineEvent, offlineEventApi } from "@/services/offlineEventApi";
import "@/assets/css/HomeOfflineEvent.scss";

const HomeOfflineEvent = ({ events: initialEvents }) => {
  const [items, setItems] = useState(Array.isArray(initialEvents) ? initialEvents.map(adaptOfflineEvent) : []);
  const [isLoading, setIsLoading] = useState(initialEvents === undefined);

  useEffect(() => {
    if (initialEvents !== undefined) return;
    let active = true;
    offlineEventApi.list({ per_page: 12 })
      .then((events) => { if (active) setItems(events.map(adaptOfflineEvent).filter(Boolean)); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [initialEvents]);

  const isSlider = items.length > 2;
  return (
    <div id="HomeOfflineEvent">
      <div className="container">
        <div className="HomeOfflineEventHead">
          <h2><span>Offline</span> Events</h2>
          <div className="headRightActions">
            {isSlider && <div className="offlineNavArrows">
              <button type="button" className="navArrowBtn offline-prev" aria-label="Previous events"><FaChevronLeft /></button>
              <button type="button" className="navArrowBtn offline-next" aria-label="Next events"><FaChevronRight /></button>
            </div>}
            {items.length > 0 && <Link href="/event" className="viewAllBtn">View All</Link>}
          </div>
        </div>
        <div className="HomeOfflineEventMain">
          {isLoading ? <div className="eventLoadingState" role="status">Loading events…</div> : items.length === 0 ? <ElseDesign title="No Offline Events Found" message="There are currently no offline events scheduled. Please check back later!" /> : isSlider ? (
            <Swiper modules={[Navigation]} navigation={{ nextEl: ".offline-next", prevEl: ".offline-prev" }} loop={items.length > 2} slidesPerView={2} spaceBetween={24} breakpoints={{ 320: { slidesPerView: 1, spaceBetween: 16 }, 768: { slidesPerView: 1.15, spaceBetween: 18 }, 1024: { slidesPerView: 2, spaceBetween: 24 } }}>
              {items.map((event) => <SwiperSlide key={event.id}><EventCard event={event} /></SwiperSlide>)}
            </Swiper>
          ) : <div className={`offlineEventsGrid count-${items.length}`}>
            {items.map((event) => <div key={event.id} className="offlineGridItem"><EventCard event={event} /></div>)}
          </div>}
        </div>
      </div>
    </div>
  );
};

export default HomeOfflineEvent;
