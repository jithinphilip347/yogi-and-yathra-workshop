"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import TravelCard from "../travelCard/TravelCard";
import ElseDesign from "../elseDesign/ElseDesign";
import { adaptTravelPackage, travelPackageApi } from "@/services/travelPackageApi";
import "@/assets/css/HomeTravel.scss";

const HomeTravel = ({ travels }) => {
  const [items, setItems] = useState(() => Array.isArray(travels) ? travels.map(adaptTravelPackage) : []);
  const [loading, setLoading] = useState(!Array.isArray(travels));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (Array.isArray(travels)) return undefined;
    let active = true;
    travelPackageApi.list({ per_page: 12 })
      .then((records) => { if (active) setItems(records.map(adaptTravelPackage).filter(Boolean).slice(0, 6)); })
      .catch(() => { if (active) setFailed(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [travels]);

  const isSlider = items.length > 3;
  return <div id="HomeTravel"><div className="container">
    <div className="HomeTravelHead"><h2><span>Travel</span> &amp; Retreats</h2><div className="headRightActions">
      {isSlider && <div className="travelNavArrows"><button type="button" className="navArrowBtn travel-prev" aria-label="Previous retreats"><FaChevronLeft /></button><button type="button" className="navArrowBtn travel-next" aria-label="Next retreats"><FaChevronRight /></button></div>}
      {items.length > 0 && <Link href="/travel" className="viewAllBtn">View All</Link>}
    </div></div>
    <div className="HomeTravelMain">
      {loading ? <div className="travelContentState" role="status">Loading travel packages…</div>
        : failed ? <ElseDesign title="Travel packages unavailable" message="We could not load travel packages right now. Please try again later." />
          : !items.length ? <ElseDesign title="No Travel Programs Found" message="There are currently no travel retreats or journeys available right now. Please check back soon!" />
            : isSlider ? <Swiper modules={[Navigation]} navigation={{ nextEl: ".travel-next", prevEl: ".travel-prev" }} loop={items.length > 3} slidesPerView={3} spaceBetween={24} breakpoints={{ 320: { slidesPerView: 1.1, spaceBetween: 14 }, 640: { slidesPerView: 1.6, spaceBetween: 18 }, 768: { slidesPerView: 2, spaceBetween: 20 }, 1024: { slidesPerView: 3, spaceBetween: 24 } }}>{items.map((travel) => <SwiperSlide key={travel.id}><TravelCard travel={travel} /></SwiperSlide>)}</Swiper>
              : <div className={`travelGrid count-${items.length}`}>{items.map((travel) => <div key={travel.id} className="travelGridItem"><TravelCard travel={travel} /></div>)}</div>}
    </div>
  </div></div>;
};

export default HomeTravel;
