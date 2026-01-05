"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";
import { BiSolidQuoteLeft } from "react-icons/bi";
import "swiper/css";
import User1 from "../../assets/images/instructor-1.jpg";
import User2 from "../../assets/images/instructor-2.jpg";
import User3 from "../../assets/images/instructor-3.jpg";
import User4 from "../../assets/images/instructor-4.jpg";
import Image from "next/image";

const testimonials = [
  {
    img: User1,
    name: "Aarav Menon",
    role: "Yoga Retreat Participant",
    quote:
      "These meditation classes help me slow down, find balance, and reconnect with myself after hectic workdays.",
    location: "Rishikesh, India",
  },
  {
    img: User2,
    name: "Sneha Kapoor",
    role: "Mindfulness Coach",
    quote:
      "Their guided sessions are deeply calming and perfectly structured for every level of experience.",
    location: "Bangalore, India",
  },
  {
    img: User3,
    name: "Rahul Das",
    role: "Software Engineer",
    quote:
      "Just 20 minutes of morning meditation completely shifted my energy and mental clarity!",
    location: "Kochi, India",
  },
  {
    img: User4,
    name: "Nitya Pillai",
    role: "Yoga Trainer",
    quote:
      "A perfect blend of ancient yogic wisdom and practical lifestyle guidance for modern lives!",
    location: "Chennai, India",
  }
];

const HomeTestimonial = () => {
  return (
    <div id="HomeTestimonial">
      <div className="container">
        <div className="HomeTestimonialMain">

          {/* Header */}
          <div className="TestimonialHead">
            <div className="HeadLeft">
              <span className="badge">OUR REVIEWS</span>
              <h2>
                What Our <span>Clients</span> Say
              </h2>
            </div>

            <div className="ArrowGroup">
              <button className="ArrowBtn testimonial-prev">
                <BsArrowLeft />
              </button>
              <button className="ArrowBtn testimonial-next">
                <BsArrowRight />
              </button>
            </div>
          </div>

          {/* Swiper */}
          <Swiper
            modules={[Navigation]}
            navigation={{
              nextEl: ".testimonial-next",
              prevEl: ".testimonial-prev",
            }}
            loop={true}
            spaceBetween={30}
            slidesPerView={3}
            breakpoints={{
              320: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1200: { slidesPerView: 3 },
            }}
          >
            {testimonials.map((item, index) => (
              <SwiperSlide key={index}>
                <div className="TestimonialCard">
                  
                  <Image src={item.img} alt={item.name} className="ProfileImg" />

                  <div className="QuoteIcon">
                    <BiSolidQuoteLeft />
                  </div>

                  <p className="QuoteText">{item.quote}</p>

                  <div className="ReviewerInfo">
                    <p className="ReviewerName">{item.name}</p>
                    <p className="ReviewerRole">{item.role}</p>
                    <p className="ReviewerLocation">{item.location}</p>
                  </div>

                </div>
              </SwiperSlide>
            ))}
          </Swiper>

        </div>
      </div>
    </div>
  );
};

export default HomeTestimonial;
