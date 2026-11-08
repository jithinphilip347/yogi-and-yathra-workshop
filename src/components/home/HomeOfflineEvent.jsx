"use client";
import React from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import EventCard from "../eventCard/EventCard";
import ElseDesign from "../elseDesign/ElseDesign";

import EventImg1 from "@/assets/images/courseImg-1.webp";
import EventImg2 from "@/assets/images/courseImg-2.webp";
import EventImg3 from "@/assets/images/courseImg-3.webp";
import EventImg4 from "@/assets/images/courseImg-4.webp";
import EventImg5 from "@/assets/images/courseImg-5.webp";

import "@/assets/css/HomeOfflineEvent.scss";

export const DEFAULT_OFFLINE_EVENTS = [
  {
    id: 1,
    title: "Sunset Beach Yoga & Meditation Workshop",
    description: "Experience inner tranquility with traditional Hatha yoga practices during the sunset.",
    image: EventImg1,
    category: "Offline Workshop",
    status: "Booking Open",
    date: "24 - 27 Nov 2026",
    duration: "4 Days",
    venue: "Cherai Beach",
    location: "Kochi, Kerala",
    price: "1,499",
    seats: "8 Seats Left",
    tags: ["In-Person", "Mats Provided", "Sunset View"],
    slug: "sunset-beach-yoga",
    link: "/event/event-details",
    videoUrl: "https://www.youtube.com/embed/inpok4MKVLM",
  },
  {
    id: 2,
    title: "Chakra Healing & Sound Therapy Retreat",
    description: "Deep restorative immersion with Tibetan sound bowls and guided breathwork.",
    image: EventImg2,
    category: "Wellness Retreat",
    status: "Almost Full",
    date: "02 - 08 Dec 2026",
    duration: "1 Week",
    venue: "Yogify Studio",
    location: "Angamaly, Kerala",
    price: "2,499",
    seats: "3 Seats Left",
    tags: ["Sound Bath", "Herbal Tea", "Certificate"],
    slug: "chakra-healing-sound-therapy",
    link: "/event/event-details",
    videoUrl: "https://www.youtube.com/embed/sTANio_2E0Q",
  },
  {
    id: 3,
    title: "Pranayama & Advanced Asana Intensive",
    description: "Master vital life force control with structured breathwork and alignment postures.",
    image: EventImg3,
    category: "Masterclass",
    status: "Booking Open",
    date: "14 - 17 Dec 2026",
    duration: "4 Days",
    venue: "Heritage Cultural Hall",
    location: "Fort Kochi, Kerala",
    price: "1,999",
    seats: "12 Seats Left",
    tags: ["In-Person", "Certificate", "Alignment"],
    slug: "pranayama-advanced-asana",
    link: "/event/event-details",
    videoUrl: "https://www.youtube.com/embed/4pKly2JojMw",
  },
  {
    id: 4,
    title: "Mindfulness & Forest Meditation Camp",
    description: "A full day rejuvenating nature retreat surrounded by misty pine forests.",
    image: EventImg4,
    category: "Nature Retreat",
    status: "Upcoming",
    date: "28 Dec 2026 - 03 Jan 2027",
    duration: "1 Week",
    venue: "Pine Forest Camp",
    location: "Vagamon Hills, Kerala",
    price: "3,999",
    seats: "Early Bird",
    tags: ["Forest Trek", "Organic Food", "Campfire"],
    slug: "mindfulness-forest-meditation",
    link: "/event/event-details",
    videoUrl: "https://www.youtube.com/embed/g_tea8ZNk5A",
  },
  {
    id: 5,
    title: "Therapeutic Yoga for Back Pain & Posture",
    description: "Clinical approach to spinal health, core stabilization, and posture recovery.",
    image: EventImg5,
    category: "Therapy Workshop",
    status: "Booking Open",
    date: "08 - 11 Jan 2027",
    duration: "4 Days",
    venue: "Wellness Center",
    location: "Kozhikode, Kerala",
    price: "1,799",
    seats: "Limited Group",
    tags: ["Physio-Led", "Spine Care", "1-on-1 Help"],
    slug: "therapeutic-yoga-backpain",
    link: "/event/event-details",
    videoUrl: "https://www.youtube.com/embed/inpok4MKVLM",
  },
  {
    id: 6,
    title: "Sunrise Beach Vinyasa & Ocean Meditation",
    description: "Energizing morning flows with gentle sea breeze, dynamic sun salutations, and mindfulness practice.",
    image: EventImg1,
    category: "Offline Workshop",
    status: "Booking Open",
    date: "18 - 21 Jan 2027",
    duration: "4 Days",
    venue: "Marari Beach",
    location: "Alappuzha, Kerala",
    price: "1,699",
    seats: "6 Seats Left",
    tags: ["In-Person", "Morning Chai", "Beach Mat"],
    slug: "sunrise-beach-vinyasa",
    link: "/event/event-details",
    videoUrl: "https://www.youtube.com/embed/sTANio_2E0Q",
  },
  {
    id: 7,
    title: "Tibetan Singing Bowl Sound Bath & Yoga Nidra",
    description: "Restorative deep relaxation using authentic handcrafted singing bowls, gong bath, and conscious sleep practice.",
    image: EventImg2,
    category: "Wellness Retreat",
    status: "Almost Full",
    date: "25 - 28 Jan 2027",
    duration: "4 Days",
    venue: "Cultural Center",
    location: "Kochi, Kerala",
    price: "2,199",
    seats: "2 Seats Left",
    tags: ["Sound Therapy", "Aromatherapy", "Guided Nidra"],
    slug: "sound-bath-yoga-nidra",
    link: "/event/event-details",
    videoUrl: "https://www.youtube.com/embed/4pKly2JojMw",
  },
];

const HomeOfflineEvent = ({ events }) => {
  const items = events !== undefined ? events : DEFAULT_OFFLINE_EVENTS;

  // Show 2 spacious creative cards per view
  const isSlider = items && items.length > 2;

  return (
    <div id="HomeOfflineEvent">
      <div className="container">
        <div className="HomeOfflineEventHead">
          <h2>
            <span>Offline</span> Events
          </h2>

          <div className="headRightActions">
            {isSlider && (
              <div className="offlineNavArrows">
                <button
                  type="button"
                  className="navArrowBtn offline-prev"
                  aria-label="Previous events"
                >
                  <FaChevronLeft />
                </button>
                <button
                  type="button"
                  className="navArrowBtn offline-next"
                  aria-label="Next events"
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
            {items && items.length > 0 && (
              <Link href="/event" className="viewAllBtn">
                View All
              </Link>
            )}
          </div>
        </div>

        <div className="HomeOfflineEventMain">
          {!items || items.length === 0 ? (
            <ElseDesign
              title="No Offline Events Found"
              message="There are currently no offline events scheduled. Please check back later!"
            />
          ) : isSlider ? (
            <Swiper
              modules={[Navigation]}
              navigation={{
                nextEl: ".offline-next",
                prevEl: ".offline-prev",
              }}
              loop={items.length > 2}
              slidesPerView={2}
              spaceBetween={24}
              breakpoints={{
                320: { slidesPerView: 1, spaceBetween: 16 },
                768: { slidesPerView: 1.15, spaceBetween: 18 },
                1024: { slidesPerView: 2, spaceBetween: 24 },
              }}
            >
              {items.map((event, i) => (
                <SwiperSlide key={event?.id || i}>
                  <EventCard event={event} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className={`offlineEventsGrid count-${items.length}`}>
              {items.map((event, i) => (
                <div key={event?.id || i} className="offlineGridItem">
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeOfflineEvent;
