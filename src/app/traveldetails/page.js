"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import Breadcrumbs from "@/components/breadcrumbs/Breadcrumbs";
import TravelImg1 from "@/assets/images/courseImg-6.webp";
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiCheckCircle, FiArrowRight, FiShield } from "react-icons/fi";
import "@/assets/css/TravelDetails.scss";

export default function TravelDetailsPage() {
  const retreat = {
    title: "Rishikesh Himalayan Yoga & Spiritual Retreat",
    category: "Spiritual Journey",
    status: "Booking Open",
    destination: "Rishikesh, Himalayas, Uttarakhand",
    startingPoint: "New Delhi Airport / Dehradun",
    startDate: "15 Dec 2026",
    endDate: "20 Dec 2026",
    duration: "6 Days / 5 Nights",
    totalSlots: 20,
    bookedSlots: 14,
    price: "24,999",
    originalPrice: "29,999",
    coordinator: "Swami Shivananda & Meera Sharma",
    description:
      "Embark on a sacred journey into the foothills of the Himalayas. This retreat brings together daily Ganga sunrise yoga, traditional Pranayama breathwork, evening Aarti ceremony at Parmarth Niketan, guided Himalayan nature walks, and rejuvenating Ayurvedic wellness sessions. Experience mindful living in luxury ashram accommodation.",
    perks: [
      "5 Nights luxury resort & ashram stay",
      "All organic Sattvic meals (Breakfast, Lunch & Dinner)",
      "Daily guided Sunrise Vinyasa & Sunset Hatha classes",
      "Private Ganga Aarti & Sacred Cave meditation tour",
      "Air-conditioned private coach from Dehradun airport",
      "Ayurvedic consultation & therapeutic massage session",
    ],
  };

  const availableSlots = retreat.totalSlots - retreat.bookedSlots;
  const progressPercent = Math.round((retreat.bookedSlots / retreat.totalSlots) * 100);

  return (
    <div className="TravelDetailsPage">
      <div className="container">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Travel & Retreats", href: "/#HomeTravel" },
            { label: retreat.title },
          ]}
        />

        <div className="travelDetailsGrid">
          {/* Main Left Column */}
          <div className="travelMainCol">
            {/* Banner Image */}
            <div className="travelBannerBox">
              <Image
                src={TravelImg1}
                alt={retreat.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 750px"
              />
              <span className="bannerBadge">{retreat.category}</span>
            </div>

            {/* Header Box */}
            <div className="travelHeaderBox">
              <div className="statusPill">
                <span className="dot" />
                <span>{retreat.status} ({availableSlots} Slots Left)</span>
              </div>
              <h1>{retreat.title}</h1>
            </div>

            {/* Info Card */}
            <div className="travelInfoCard">
              <div className="infoBlock">
                <FiMapPin />
                <div className="infoText">
                  <span className="label">Destination</span>
                  <strong className="val">{retreat.destination}</strong>
                </div>
              </div>

              <div className="infoBlock">
                <FiCalendar />
                <div className="infoText">
                  <span className="label">Dates</span>
                  <strong className="val">{retreat.startDate} - {retreat.endDate}</strong>
                </div>
              </div>

              <div className="infoBlock">
                <FiClock />
                <div className="infoText">
                  <span className="label">Duration</span>
                  <strong className="val">{retreat.duration}</strong>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="travelSection">
              <h3>About This Journey</h3>
              <p>{retreat.description}</p>
            </div>

            {/* What's Included */}
            <div className="travelSection">
              <h3>What is Included</h3>
              <div className="perksGrid">
                {retreat.perks.map((perk, i) => (
                  <div key={i} className="perkItem">
                    <FiCheckCircle />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Booking Card */}
          <div className="travelSidebarCol">
            <div className="bookingCard">
              <div className="priceHeader">
                <span className="label">Retreat Package</span>
                <div className="priceRow">
                  <span className="cur">₹</span>
                  <span className="amt">{retreat.price}</span>
                  <span className="unit">/ person</span>
                  {retreat.originalPrice && (
                    <span className="orig">₹{retreat.originalPrice}</span>
                  )}
                </div>
              </div>

              {/* Slot Progress */}
              <div className="slotProgressSidebar">
                <div className="slotHead">
                  <span><strong>{retreat.bookedSlots}/{retreat.totalSlots}</strong> Slots Booked</span>
                  <span className="left">{availableSlots} Left</span>
                </div>
                <div className="barTrack">
                  <div
                    className="barFill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="bookingDetailsList">
                <div className="detailItem">
                  <span>Starting Point</span>
                  <strong>{retreat.startingPoint}</strong>
                </div>
                <div className="detailItem">
                  <span>Travel Coordinator</span>
                  <strong>{retreat.coordinator}</strong>
                </div>
                <div className="detailItem">
                  <span>Duration</span>
                  <strong>{retreat.duration}</strong>
                </div>
              </div>

              <Link href="/checkout" className="bookBtn">
                <span>Reserve Your Spot</span>
                <FiArrowRight />
              </Link>

              <p className="guaranteeNote">
                <FiShield style={{ marginRight: 4, verticalAlign: "middle" }} />
                Guaranteed departure & instant confirmation receipt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

