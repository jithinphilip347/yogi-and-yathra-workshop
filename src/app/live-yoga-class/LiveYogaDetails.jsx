"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MdOutlineDateRange, 
  MdOutlineAccessTime, 
  MdPlayLesson, 
  MdOutlineLanguage,
  MdStar,
  MdKeyboardArrowRight,
  MdOutlineOndemandVideo,
  MdCheckCircle,
  MdOutlineKeyboardArrowDown,
  MdTrendingUp,
  MdLock
} from 'react-icons/md';
import { FiUsers, FiAward, FiClock, FiPlayCircle, FiCheck, FiXCircle } from 'react-icons/fi';
import { FaChalkboardTeacher, FaRegCalendarAlt } from 'react-icons/fa';
import { MEDIA_BASE_URL } from '@/utils/constants';
import '../../assets/css/live-yoga-details.css';

const LiveYogaDetails = ({ liveSection }) => {
  const data = liveSection || {};
  const instructor = data.instructor || {};

  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [openFaq, setOpenFaq] = useState(null);

  // ─── Compute derived values ──────────────────────────────────────────

  const categoryName = data.category?.name || "Live Yoga";
  const averageRating = data.average_rating || 0;
  const reviewCount = data.review_count || 0;
  const humanDate = data.human_date || "";
  const humanStartTime = data.human_start_time || "";
  const timezone = data.timezone || "";
  const timeDisplay = timezone ? `${humanStartTime} (${timezone})` : humanStartTime;
  const duration = data.duration ? `${data.duration} Minutes` : "";
  const capacity = data.capacity || 0;
  const bookedSeats = data.booked_seats ?? 0;
  const availableSeats = data.available_seats ?? 0;
  const price = data.effective_price || data.discount_price || data.price || 0;
  const originalPrice = data.price || 0;
  const discountPercentage = data.discount_percentage;
  const discountLabel = discountPercentage ? `${discountPercentage}% OFF` : "";
  const hasDiscount = discountPercentage > 0 && originalPrice > price;

  // Learning content
  const whatYoullLearn = Array.isArray(data.what_youll_learn) ? data.what_youll_learn : [];
  const perfectFor = Array.isArray(data.perfect_for) ? data.perfect_for : [];
  const notRecommendedFor = Array.isArray(data.not_recommended_for) ? data.not_recommended_for : [];

  // Instructor
  const instructorName = instructor.name || "Instructor";
  const instructorTitle = instructor.professional_title || "Yoga Instructor";
  const instructorRating = instructor.average_rating || 0;
  const instructorExperience = instructor.years_of_experience
    ? `${instructor.years_of_experience}+ Years`
    : "";
  const instructorImage = instructor.avatar
    ? `${MEDIA_BASE_URL}${instructor.avatar}`
    : null;
  const instructorExpertise = Array.isArray(instructor.expertise)
    ? instructor.expertise
    : typeof instructor.expertise === "string"
      ? instructor.expertise.split(",").map((s) => s.trim())
      : [];

  // Reviews
  const reviews = Array.isArray(data.reviews) ? data.reviews : [];

  // FAQs
  const faqs = Array.isArray(data.faqs) ? data.faqs : [];

  // Static content
  const joiningGuide = [
    "Join the meeting 10 mins early.",
    "Ensure a stable internet connection.",
    "Laptop/Tablet preferred over mobile.",
    "Keep a water bottle nearby."
  ];
  const refundPolicy = "Cancellation is allowed up to 24 hours before the session starts for a full refund.";

  // ─── Countdown ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!data.class_date_time) return;

    const targetTime = new Date(data.class_date_time).getTime();

    const calcTimeLeft = () => {
      const distance = targetTime - Date.now();
      if (distance <= 0) return { days: "00", hours: "00", minutes: "00", seconds: "00" };
      return {
        days: String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, "0"),
        hours: String(Math.floor((distance / (1000 * 60 * 60)) % 24)).padStart(2, "0"),
        minutes: String(Math.floor((distance / (1000 * 60)) % 60)).padStart(2, "0"),
        seconds: String(Math.floor((distance / 1000) % 60)).padStart(2, "0"),
      };
    };

    setTimeLeft(calcTimeLeft());
    const timer = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [data.class_date_time]);

  // ─── Empty state ─────────────────────────────────────────────────────

  if (!liveSection) {
    return (
      <div id="LiveYogaDetails">
        <div className="container" style={{ textAlign: "center", padding: "100px 20px" }}>
          <h2>No Live Session Available</h2>
          <p style={{ color: "#636e72", marginTop: 10 }}>
            There are no upcoming live sessions right now. Please check back later.
          </p>
          <Link href="/" style={{ textDecoration: "none" }}>
            <button
              style={{
                marginTop: 20,
                padding: "12px 30px",
                background: "var(--primaryColor)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div id='LiveYogaDetails'>
      {/* Breadcrumb */}
      <div className="container BreadcrumbWrap">
        <span>Home</span> &gt; <span>Live Sessions</span> &gt; <span className="CurrentPath">{data.title}</span>
      </div>

      {/* Hero Banner */}
      <section
        className="HeroBanner"
        style={data.banner_image ? {
          backgroundImage: `url(${MEDIA_BASE_URL}${data.banner_image})`,
        } : undefined}
      >
        <div className="HeroOverlay"></div>
        <div className="container">
          <div className="HeroContent fadeUp">
            <div className="BadgesWrap">
              <span className="LiveBadge"><span className="Pulse"></span>Upcoming in {timeLeft.days} Days</span>
              <span className="CategoryBadge">{categoryName}</span>
            </div>
            
            <h1>{data.title}</h1>
            
            {averageRating > 0 && (
              <div className="RatingBox">
                <MdStar className="StarIcon" />
                <span>{averageRating}</span>
                <span className="ReviewCount">({reviewCount} Reviews)</span>
              </div>
            )}
            
            {/* Hero Summary */}
            <div className="HeroSummaryGrid">
              {humanDate && (
                <div className="SumItem"><MdOutlineDateRange /> {humanDate}</div>
              )}
              {timeDisplay && (
                <div className="SumItem"><MdOutlineAccessTime /> {timeDisplay}</div>
              )}
              {duration && (
                <div className="SumItem"><FiClock /> {duration}</div>
              )}
              {capacity > 0 && (
                <div className="SumItem"><FiUsers /> {bookedSeats} / {capacity} Filled</div>
              )}
              <div className="SumItem"><MdOutlineLanguage /> {data.language || "English"}</div>
              <div className="SumItem"><MdOutlineOndemandVideo /> Live Online</div>
            </div>
          </div>
        </div>
      </section>

      <div className="container ContentLayout">
        <div className="LeftColumn">
          
          {/* About Section */}
          <section className="AboutSection card">
            <h2>About This Live Session</h2>
            <p>{data.description || "No description available."}</p>

            <div className="QuickHighlights">
              <div className="HighlightItem"><MdOutlineOndemandVideo /> <span>Live Session</span></div>
              <div className="HighlightItem"><FiAward /> <span>Certificate</span></div>
              <div className="HighlightItem"><MdOutlineLanguage /> <span>Live Q&A</span></div>
              <div className="HighlightItem"><FiPlayCircle /> <span>Recording</span></div>
              <div className="HighlightItem"><FaChalkboardTeacher /> <span>Expert Instructor</span></div>
              <div className="HighlightItem"><MdOutlineDateRange /> <span>Flexible</span></div>
            </div>
          </section>

          {/* What You'll Learn */}
          {whatYoullLearn.length > 0 && (
            <section className="WhatYouLearnSection card">
              <h2>What You&apos;ll Learn</h2>
              <div className="LearnGrid">
                {whatYoullLearn.map((item, i) => (
                  <div className="LearnItem" key={i}>
                    <MdCheckCircle className="CheckIcon" /> {item}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Perfect For / Not Recommended For */}
          {(perfectFor.length > 0 || notRecommendedFor.length > 0) && (
            <div className="AudienceGrid">
              {perfectFor.length > 0 && (
                <section className="AudienceCard PerfectFor">
                  <h3><MdTrendingUp className="Icon" /> Perfect For</h3>
                  <ul>
                    {perfectFor.map((item, i) => (
                      <li key={i}><FiCheck className="ListIcon" /> {item}</li>
                    ))}
                  </ul>
                </section>
              )}
              
              {notRecommendedFor.length > 0 && (
                <section className="AudienceCard AvoidFor">
                  <h3><FiXCircle className="Icon" /> Not Recommended For</h3>
                  <ul>
                    {notRecommendedFor.map((item, i) => (
                      <li key={i}><FiXCircle className="ListIcon" /> {item}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {/* Features Included (static) */}
          <section className="FeaturesGridSection card">
            <h2>Features Included</h2>
            <div className="FeaturesGrid">
              <div><FiCheck className="FeatIcon" /> Live Chat Support</div>
              <div><FiCheck className="FeatIcon" /> Ask Questions Direct</div>
              <div><FiCheck className="FeatIcon" /> 30-Day Recording Access</div>
              <div><FiCheck className="FeatIcon" /> E-Certificate</div>
              <div><FiCheck className="FeatIcon" /> Lifetime Community</div>
              <div><FiCheck className="FeatIcon" /> Mobile & Web Friendly</div>
            </div>
          </section>

          {/* Instructor Section */}
          {instructorName && (
            <section className="InstructorSection card">
              <h2>Meet Your Instructor</h2>
              <div className="InstructorProfile">
                <div className="InstImage">
                  {instructorImage ? (
                    <Image src={instructorImage} alt={instructorName} fill />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "#eee",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 32,
                        color: "#999",
                      }}
                    >
                      {instructorName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="InstDetails">
                  <h3>{instructorName}</h3>
                  <p className="Profession">{instructorTitle}</p>
                  <div className="InstStats">
                    {instructorRating > 0 && (
                      <div className="Stat"><MdStar className="Icon" /> {instructorRating} Rating</div>
                    )}
                    {instructorExperience && (
                      <div className="Stat"><FiAward className="Icon" /> {instructorExperience} Exp.</div>
                    )}
                  </div>
                  
                  {instructorExpertise.length > 0 && (
                    <div className="InstExtraInfo">
                      <div className="InfoBlock">
                        <strong>Specialization:</strong>
                        <div className="ChipWrap">
                          {instructorExpertise.map((spec, i) => (
                            <span key={i} className="Chip">{spec}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Joining Guide & Refund Policy (STATIC) */}
          <div className="InfoSplitGrid">
            <section className="JoiningGuide card">
              <h3>Joining Guide</h3>
              <ul className="SimpleList">
                {joiningGuide.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </section>
            
            <section className="RefundPolicy card">
              <h3>Refund Policy</h3>
              <p>{refundPolicy}</p>
            </section>
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <section className="ReviewsSection card">
              <h2>Student Reviews</h2>
              <div className="ReviewGrid">
                {reviews.map((rev, i) => (
                  <div className="ReviewCard" key={rev.id || i}>
                    <div className="Stars">
                      {[...Array(Math.min(rev.rating, 5))].map((_, idx) => (
                        <MdStar key={idx} className="StarFill" />
                      ))}
                    </div>
                    <p>&quot;{rev.content || rev.text || rev.comment}&quot;</p>
                    <h4>- {rev.user_name || rev.name || "Anonymous"}</h4>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FAQ Section */}
          {faqs.length > 0 && (
            <section className="FAQSection card">
              <h2>Frequently Asked Questions</h2>
              <div className="FAQList">
                {faqs.map((faq, i) => (
                  <div className={`FAQItem ${openFaq === i ? 'active' : ''}`} key={faq.id || i}>
                    <div className="FAQHead" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <h4>{faq.question || faq.q}</h4>
                      <MdOutlineKeyboardArrowDown className="Arrow" />
                    </div>
                    <div className="FAQBody">
                      <p>{faq.answer || faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Right Sticky Column - Pricing Sidebar */}
        <div className="RightColumn">
          <div className="StickySidebar">
            
            <div className="PricingCard SidebarCard">
              <div className="CardHeaderBadge">Next Live • {humanDate}</div>
              
              <div className="PriceHeader">
                <h2>₹{price}</h2>
                {hasDiscount && (
                  <>
                    <span className="OriginalPrice">₹{originalPrice}</span>
                    <span className="DiscountBadge">{discountLabel}</span>
                  </>
                )}
              </div>

              {/* Countdown inside card */}
              <div className="CountdownBlock">
                <p>Starts In</p>
                <div className="CountdownGrid">
                  {['days', 'hours', 'minutes', 'seconds'].map((label) => (
                    <div className="TimeBox" key={label}>
                      <span className="TimeVal">{timeLeft[label]}</span>
                      <span className="TimeLabel">{label.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
                <button className="CalendarBtn"><FaRegCalendarAlt /> Add to Calendar</button>
              </div>
              
              {/* Seats Visualization */}
              {capacity > 0 && (
                <div className="SeatsVisualBlock">
                  <div className="SeatHeader">
                    <span><strong>{capacity}</strong> Total Seats</span>
                  </div>
                  <div className="ProgressBar">
                    <div
                      className="ProgressFill"
                      style={{ width: `${capacity > 0 ? (bookedSeats / capacity) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="SeatFooter">
                    <span>{bookedSeats} Booked</span>
                    <span className="HurryText"><strong>{availableSeats}</strong> Remaining</span>
                  </div>
                </div>
              )}

              <Link href="/checkout" style={{ textDecoration: 'none' }}>
                <button className="BookBtnSidebar">
                  Pre Book Now <MdKeyboardArrowRight className="ArrowAnim" />
                </button>
              </Link>
              <p className="SecureCheckout"><MdLock /> Secure Checkout</p>
            </div>
            
          </div>
        </div>
      </div>

    </div>
  )
}

export default LiveYogaDetails;
