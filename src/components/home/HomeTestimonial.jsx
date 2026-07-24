"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";
import { BiSolidQuoteLeft } from "react-icons/bi";
import { AiFillStar } from "react-icons/ai";
import "swiper/css";
import { reviewApi } from "@/services/reviewApi";
import { resolveMediaUrl } from "@/utils/mediaUrl";

// ─── Skeleton Card ──────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="TestimonialCard" style={{ animationName: "pulse" }}>
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        background: "#e2e8f0",
        marginBottom: 16,
      }}
    />
    <div
      style={{
        height: 14,
        background: "#e2e8f0",
        borderRadius: 4,
        marginBottom: 8,
        width: "90%",
      }}
    />
    <div
      style={{
        height: 14,
        background: "#e2e8f0",
        borderRadius: 4,
        marginBottom: 8,
        width: "80%",
      }}
    />
    <div
      style={{
        height: 14,
        background: "#e2e8f0",
        borderRadius: 4,
        marginBottom: 24,
        width: "65%",
      }}
    />
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "#e2e8f0",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            height: 12,
            background: "#e2e8f0",
            borderRadius: 4,
            marginBottom: 6,
            width: "60%",
          }}
        />
        <div
          style={{
            height: 11,
            background: "#e2e8f0",
            borderRadius: 4,
            width: "45%",
          }}
        />
      </div>
    </div>
  </div>
);

// ─── Star Row ────────────────────────────────────────────────────────────────
const StarRow = ({ rating }) => (
  <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <AiFillStar
        key={s}
        style={{
          color: s <= rating ? "var(--primaryColor)" : "#e2e8f0",
          fontSize: 15,
        }}
      />
    ))}
  </div>
);

// ─── Avatar Fallback ─────────────────────────────────────────────────────────
const Avatar = ({ src, name }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="ProfileImg"
        onError={(e) => {
          e.currentTarget.style.display = "none";
          e.currentTarget.nextSibling.style.display = "flex";
        }}
      />
    );
  }
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "var(--primaryColor)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 16,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const HomeTestimonial = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["testimonials", "homepage"],
    queryFn: async () => {
      const res = await reviewApi.getTestimonials(12);
      return res.data?.data ?? [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  const testimonials = data ?? [];

  // Show 4 skeleton placeholders while loading
  const skeletonCount = 4;

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
              <button className="ArrowBtn testimonial-prev" aria-label="Previous testimonial">
                <BsArrowLeft />
              </button>
              <button className="ArrowBtn testimonial-next" aria-label="Next testimonial">
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
            loop={!isLoading && testimonials.length > 1}
            spaceBetween={30}
            slidesPerView={4}
            breakpoints={{
              320: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
              1200: { slidesPerView: 4 },
            }}
          >
            {/* Loading skeletons */}
            {isLoading &&
              Array.from({ length: skeletonCount }).map((_, i) => (
                <SwiperSlide key={`skeleton-${i}`}>
                  <SkeletonCard />
                </SwiperSlide>
              ))}

            {/* Error state */}
            {isError && !isLoading && (
              <SwiperSlide>
                <div
                  className="TestimonialCard"
                  style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}
                >
                  <p style={{ color: "#718096", fontSize: 15 }}>
                    Unable to load reviews right now.
                  </p>
                </div>
              </SwiperSlide>
            )}

            {/* Actual testimonials */}
            {!isLoading &&
              !isError &&
              testimonials.map((item) => {
                const reviewerName =
                  item.user?.name || item.guest_name || "Anonymous";

                const avatarSrc = resolveMediaUrl(
                  item.guestAvatar || item.user?.avatar,
                  null
                );

                const roleLabel =
                  item.designation || item.user?.designation || item.role || "";
                const company = item.company || item.user?.company || "";
                const subLabel =
                  company && roleLabel
                    ? `${roleLabel} · ${company}`
                    : roleLabel || company;

                return (
                  <SwiperSlide key={item.id}>
                    <div className="TestimonialCard">
                      <div className="QuoteIcon">
                        <BiSolidQuoteLeft />
                      </div>

                      {/* Star rating */}
                      {item.rating > 0 && <StarRow rating={item.rating} />}

                      {/* Review content */}
                      <p className="QuoteText">
                        {item.content}
                      </p>

                      {/* Reviewer info */}
                      <div className="ReviewerProfile">
                        <Avatar src={avatarSrc} name={reviewerName} />
                        <div className="ReviewerInfo">
                          <p className="ReviewerName">{reviewerName}</p>
                          {subLabel && (
                            <p className="ReviewerRole">{subLabel}</p>
                          )}
                          {item.reviewable?.title && (
                            <p className="ReviewerLocation">
                              {item.reviewable.title}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}

            {/* Empty state */}
            {!isLoading && !isError && testimonials.length === 0 && (
              <SwiperSlide>
                <div
                  className="TestimonialCard"
                  style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}
                >
                  <p style={{ color: "#718096", fontSize: 15 }}>
                    No featured testimonials yet.
                  </p>
                </div>
              </SwiperSlide>
            )}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default HomeTestimonial;
