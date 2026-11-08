"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import Breadcrumbs from "@/components/breadcrumbs/Breadcrumbs";
import EventImg1 from "@/assets/images/courseImg-1.webp";
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiCheckCircle, FiArrowRight, FiShield } from "react-icons/fi";
import "@/assets/css/EventDetails.scss";

export default function EventDetailsPage() {
  const event = {
    title: "Sunset Beach Yoga & Meditation Workshop",
    category: "Offline Workshop",
    status: "Booking Open",
    date: "24 - 27 Nov 2026",
    duration: "4 Days",
    venue: "Cherai Beach",
    location: "Kochi, Kerala",
    price: "1,499",
    seats: "8 Seats Left",
    instructor: "Acharya Meera Sharma",
    description:
      "Join us for an immersive offline wellness experience at Cherai Beach. Designed to help you unwind and rejuvenate, this physical workshop combines traditional Hatha Yoga flow, guided Pranayama breathwork, and deep restorative meditation as the sun sets over the Arabian Sea. Suitable for both beginners and experienced practitioners.",
    perks: [
      "In-person expert guidance",
      "Complimentary organic yoga mats & props",
      "Herbal tea & light refreshments",
      "Guided sunset meditation & breathwork",
      "Certificate of participation",
      "1-on-1 posture correction & assistance",
    ],
  };

  return (
    <div className="EventDetailsPage">
      <div className="container">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Offline Events", href: "/#HomeOfflineEvent" },
            { label: event.title },
          ]}
        />

        <div className="eventDetailsGrid">
          {/* Main Left Column */}
          <div className="eventMainCol">
            {/* Banner Image */}
            <div className="eventBannerBox">
              <Image
                src={EventImg1}
                alt={event.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 750px"
              />
              <span className="bannerBadge">{event.category}</span>
            </div>

            {/* Header Box */}
            <div className="eventHeaderBox">
              <div className="eventStatusPill">
                <span className="dot" />
                <span>{event.status} ({event.seats})</span>
              </div>
              <h1>{event.title}</h1>
            </div>

            {/* Schedule & Venue Card */}
            <div className="eventScheduleCard">
              <div className="scheduleBlock">
                <FiCalendar />
                <div className="info">
                  <span className="label">Dates</span>
                  <strong className="val">{event.date}</strong>
                </div>
              </div>

              <div className="scheduleBlock">
                <FiClock />
                <div className="info">
                  <span className="label">Duration</span>
                  <strong className="val">{event.duration}</strong>
                </div>
              </div>

              <div className="scheduleBlock">
                <FiMapPin />
                <div className="info">
                  <span className="label">Venue</span>
                  <strong className="val">{event.venue}, {event.location}</strong>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="eventSection">
              <h3>About This Workshop</h3>
              <p>{event.description}</p>
            </div>

            {/* What's Included */}
            <div className="eventSection">
              <h3>What is Included</h3>
              <div className="perksGrid">
                {event.perks.map((perk, i) => (
                  <div key={i} className="perkItem">
                    <FiCheckCircle />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Booking Card */}
          <div className="eventSidebarCol">
            <div className="bookingCard">
              <div className="priceHeader">
                <span className="label">Workshop Pass</span>
                <div className="priceRow">
                  <span className="cur">₹</span>
                  <span className="amt">{event.price}</span>
                  <span className="unit">/ person</span>
                </div>
              </div>

              <div className="bookingDetailsList">
                <div className="detailItem">
                  <span>Event Format</span>
                  <strong>In-Person Physical</strong>
                </div>
                <div className="detailItem">
                  <span>Lead Instructor</span>
                  <strong>{event.instructor}</strong>
                </div>
                <div className="detailItem">
                  <span>Available Spots</span>
                  <strong style={{ color: "#b91c1c" }}>{event.seats}</strong>
                </div>
                <div className="detailItem">
                  <span>Location</span>
                  <strong>{event.venue}</strong>
                </div>
              </div>

              <Link href="/checkout" className="bookBtn">
                <span>Book Your Spot Now</span>
                <FiArrowRight />
              </Link>

              <p className="guaranteeNote">
                <FiShield style={{ marginRight: 4, verticalAlign: "middle" }} />
                Instant confirmation & ticket sent to your email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

