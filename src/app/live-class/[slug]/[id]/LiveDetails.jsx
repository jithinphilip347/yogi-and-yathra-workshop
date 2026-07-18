"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiClock,
  FiCalendar,
  FiUsers,
  FiCheckCircle,
  FiCheck,
  FiXCircle,
  FiGlobe,
  FiTrendingUp,
  FiBookOpen,
  FiArrowRight,
  FiMonitor,
  FiPlus,
  FiMinus,
  FiAward,
} from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import Image from "next/image";
import Inst1 from "@/assets/images/instructor-1.webp";
import ThumbNail from "@/assets/images/live1.webp";
import { MEDIA_BASE_URL } from "@/utils/constants";
import Yoga1 from "@/assets/images/yoga-1.jpg";
import Yoga2 from "@/assets/images/yoga-2.jpg";
import Yoga3 from "@/assets/images/yoga-3.jpg";
import "@/assets/css/daily-live-details.scss";

const LiveDetails = ({ id, classDetails }) => {
  const liveClass = classDetails || {};
  const instructor = liveClass?.instructor;
  const days = liveClass?.schedule || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Fallback / Mock Data if backend doesn't provide
  const whatYouWillLearn = liveClass?.whatYouWillLearn || [
    "Master advanced breathing techniques",
    "Deepen your daily meditation practice",
    "Improve mental clarity and focus",
    "Reduce stress and anxiety through mindfulness",
    "Enhance your overall sleep quality",
  ];

  const language = liveClass?.language || "English / Malayalam";
  const level = liveClass?.level || "Beginner Friendly";

  const pricingPlans = liveClass?.pricingPlans || [
    {
      id: "plan_basic",
      name: "Basic Plan",
      price: "499",
      period: "/month",
      desc: "Perfect for starting your journey",
      features: [
        { name: "Live Access to Classes", available: true },
        { name: "Community Access", available: true },
        { name: "Session Recordings", available: false },
        { name: "Certificate", available: false },
        { name: "Private Q&A", available: false },
      ],
      featured: false,
    },
    {
      id: "plan_premium",
      name: "Premium Plan",
      price: "999",
      period: "/month",
      desc: "Our most popular offering",
      features: [
        { name: "Live Access to Classes", available: true },
        { name: "Community Access", available: true },
        { name: "Session Recordings", available: true },
        { name: "Certificate", available: true },
        { name: "Private Q&A", available: false },
      ],
      featured: true,
    },
    {
      id: "plan_vip",
      name: "VIP Plan",
      price: "1,499",
      period: "/month",
      desc: "For the ultimate learning experience",
      features: [
        { name: "Live Access to Classes", available: true },
        { name: "Community Access", available: true },
        { name: "Session Recordings", available: true },
        { name: "Certificate", available: true },
        { name: "Private Q&A", available: true },
      ],
      featured: false,
    },
  ];

  const reviews = liveClass?.reviews || [
    {
      name: "Arun K.",
      text: "This daily class changed my morning routine. Achu is an incredible instructor who really takes time to correct your posture.",
      rating: 5,
    },
    {
      name: "Sneha P.",
      text: "The meditation techniques are so powerful. I love the consistency of this daily program. Highly recommended!",
      rating: 5,
    },
  ];

  const faqs = liveClass?.faqs || [
    {
      q: "Can I join if I've never done yoga?",
      a: "Absolutely! This class is designed to be beginner friendly with step-by-step guidance.",
    },
    {
      q: "Will I get recordings if I miss a class?",
      a: "Recordings are available for Premium and VIP plan members.",
    },
    {
      q: "Is there a refund policy?",
      a: "Yes, we offer a 7-day money back guarantee if you are not satisfied.",
    },
    {
      q: "Do I need any special equipment?",
      a: "Just a good quality yoga mat, comfortable clothes, and a quiet space.",
    },
  ];

  const products =
    liveClass?.products?.length > 0
      ? liveClass.products
      : [
          {
            value: "prod_1",
            label: "Premium Yoga Mat",
            price: "1,299",
            image: Yoga1,
          },
          {
            value: "prod_2",
            label: "Meditation Cushion",
            price: "899",
            image: Yoga2,
          },
          {
            value: "prod_3",
            label: "Yoga Blocks (Set of 2)",
            price: "499",
            image: Yoga3,
          },
        ];

  const [activeFaq, setActiveFaq] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const toggleCartItem = (val) => {
    setCartItems((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val],
    );
  };

  const handleScrollToPricing = () => {
    document.getElementById("pricing-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const selectedPlanDetails = selectedPlan ? pricingPlans.find(p => p.id === selectedPlan) : null;

  return (
    <div id="DailyLiveClassDetails">
      {/* 1. Hero Section */}
      <section
        className="HeroBanner"
        style={{ backgroundImage: `url(${ThumbNail.src})` }}
      >
        <div className="HeroOverlay"></div>
        <div className="container">
          <div className="HeroContent">
            <span className="CategoryBadge">
              {liveClass?.category?.name || "Advanced Meditation"}
            </span>

            <h1>{liveClass?.title || "Daily Morning Flow & Meditation"}</h1>

            <div className="RatingStudents">
              <span className="Stars">
                <AiFillStar /> <AiFillStar /> <AiFillStar /> <AiFillStar />{" "}
                <AiFillStar />
                <span>4.8 Rating</span>
              </span>
              <span>
                <FiUsers style={{ marginRight: "5px" }} /> 1,234 Students
                enrolled
              </span>
            </div>

            <div className="HeroSummaryGrid">
              <div className="SumItem">
                <FiCalendar /> {liveClass?.human_start_date || "14 Jan"} -{" "}
                {liveClass?.human_end_date || "24 Jan"}
              </div>
              <div className="SumItem">
                <FiClock /> {liveClass?.human_class_time || "07:00 PM"}
              </div>
              <div className="SumItem">
                <FiMonitor /> {liveClass?.duration || 60} Minutes
              </div>
              <div className="SumItem">
                <FiUsers /> Instructor: {instructor?.name || "Achu Sivadasan"}
              </div>
            </div>

            <button className="ViewPlansBtn" onClick={handleScrollToPricing}>
              View Pricing Plans <FiArrowRight />
            </button>
          </div>
        </div>
      </section>

      <div className="container ContentLayout">
        {/* Left Main Content */}
        <div className="LeftColumn">
          {/* 2. Quick Info */}
          <div className="QuickInfoGrid">
            <div className="InfoCard">
              <div className="IconWrap">
                <FiCalendar />
              </div>
              <div className="InfoText">
                <small>Duration</small>
                <strong>10 Day Program</strong>
              </div>
            </div>
            <div className="InfoCard">
              <div className="IconWrap">
                <FiClock />
              </div>
              <div className="InfoText">
                <small>Daily Time</small>
                <strong>{liveClass?.human_class_time || "07:00 PM"}</strong>
              </div>
            </div>
            <div className="InfoCard">
              <div className="IconWrap">
                <FiCheckCircle />
              </div>
              <div className="InfoText">
                <small>Schedule</small>
                <strong>{days.join(" • ")}</strong>
              </div>
            </div>
            <div className="InfoCard">
              <div className="IconWrap">
                <FiMonitor />
              </div>
              <div className="InfoText">
                <small>Session Length</small>
                <strong>{liveClass?.duration || 60} Minutes</strong>
              </div>
            </div>
            <div className="InfoCard">
              <div className="IconWrap">
                <FiGlobe />
              </div>
              <div className="InfoText">
                <small>Language</small>
                <strong>{language}</strong>
              </div>
            </div>
            <div className="InfoCard">
              <div className="IconWrap">
                <FiTrendingUp />
              </div>
              <div className="InfoText">
                <small>Level</small>
                <strong>{level}</strong>
              </div>
            </div>
          </div>

          {/* 3. About Class */}
          <section className="card">
            <h2>About this Class</h2>
            <div
              style={{ lineHeight: 1.8, color: "#475569" }}
              dangerouslySetInnerHTML={{
                __html:
                  liveClass?.description ||
                  "<p>Join this immersive daily experience to transform your mornings. This program combines dynamic stretching with deep mindfulness meditation to help you start every day with clarity, focus, and energy. Suitable for all levels, you'll be guided step-by-step by our expert instructors.</p>",
              }}
            />
          </section>

          
          <section className="card">
            <h2>What You&apos;ll Learn</h2>
            <div className="LearnGrid">
              {whatYouWillLearn.map((item, i) => (
                <div className="LearnItem" key={i}>
                  <FiCheckCircle className="CheckIcon" /> {item}
                </div>
              ))}
            </div>
          </section>

          {/* 5. Weekly Schedule */}
          <section className="card">
            <h2>Weekly Schedule</h2>
            <div className="WeeklyScheduleModern">
              <div className="TimeBox">
                <FiClock className="Icon" />
                <div className="TimeDetails">
                  <span className="Label">Class Time</span>
                  <span className="Time">{liveClass?.human_class_time || "07:00 PM"} (IST)</span>
                </div>
              </div>
              
              <div className="DaysRowWrap">
                <span className="DaysLabel">Active Days:</span>
                <div className="DaysRow">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                    const isActive = days.some(d => day.toLowerCase().startsWith(d.toLowerCase().slice(0, 3)));
                    return (
                      <div key={day} className={`DayBadge ${isActive ? 'Active' : ''}`}>
                        {day.slice(0, 2)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

         
          <section className="card">
            <h2>Your Instructor</h2>
            <div className="InstructorProfile">
              <div className="InstImage">
                <Image
                  src={
                    instructor?.avatar
                      ? `${MEDIA_BASE_URL}${instructor.avatar}`
                      : Inst1
                  }
                  alt="Instructor"
                  width={100}
                  height={100}
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="InstDetails">
                <h3>{instructor?.name || "Achu Sivadasan"}</h3>
                <div className="Profession">
                  {instructor?.role || "Senior Yoga Teacher"}
                </div>

                <div className="InstStats">
                  <div className="Stat">
                    <FiAward /> 5+ Years Experience
                  </div>
                  <div className="Stat">
                    <FiBookOpen /> 12 Courses
                  </div>
                  <div className="Stat">
                    <FiUsers /> 10k+ Students
                  </div>
                  <div className="Stat">
                    <FiGlobe /> En & Mal
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#636e72",
                    lineHeight: 1.6,
                    marginTop: "10px",
                  }}
                >
                  An internationally certified yoga and mindfulness trainer with
                  over 5 years of experience helping individuals achieve
                  physical and mental balance.
                </p>
              </div>
            </div>
          </section>

          {/* 7. Requirements */}
          <section className="card">
            <h2>Class Requirements</h2>
            <div className="ReqGrid">
              <div className="ReqItem">
                <FiCheckCircle className="ReqIcon" /> Comfortable Clothes
              </div>
              <div className="ReqItem">
                <FiCheckCircle className="ReqIcon" /> High Speed Internet
              </div>
              <div className="ReqItem">
                <FiCheckCircle className="ReqIcon" /> Yoga Mat
              </div>
              <div className="ReqItem">
                <FiCheckCircle className="ReqIcon" /> Quiet Space
              </div>
            </div>
          </section>

          {/* 8. Pricing Plans */}
          <section className="card" id="pricing-section">
            <h2>Pricing Plans</h2>
            <div className="PricingGrid">
              {pricingPlans.map((plan) => (
                <div
                  className={`PlanCard ${plan.featured ? "FeaturedPlan" : ""}`}
                  key={plan.id}
                >
                  {plan.featured && (
                    <span className="PopularBadge">Most Popular</span>
                  )}

                  <div className="PlanName">{plan.name}</div>
                  <div className="PlanPrice">
                    ₹{plan.price} <span className="Period">{plan.period}</span>
                  </div>
                  <div className="PlanDesc">{plan.desc}</div>

                  <ul className="PlanFeatures">
                    {plan.features.map((feat, i) => (
                      <li key={i}>
                        {feat.available ? (
                          <FiCheck className="Check" />
                        ) : (
                          <FiXCircle className="Cross" />
                        )}
                        {feat.name}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`SelectPlanBtn ${selectedPlan === plan.id ? "FilledBtn" : ""}`}
                    onClick={() => setSelectedPlan(selectedPlan === plan.id ? null : plan.id)}
                  >
                    {selectedPlan === plan.id ? "Plan Selected" : "Select Plan"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 9. Related Products */}
          {products && products.length > 0 && (
            <section className="card">
              <h2>Recommended for this Class</h2>
              <div className="ProductList">
                {products.map((prod, index) => (
                  <div className="ProductItem" key={index}>
                    <div className="ProdLeft">
                      <div className="ProdImage">
                        <Image
                          src={prod.image}
                          alt={prod.label}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                      <div className="ProdInfo">
                        <h4>{prod.label}</h4>
                        <div className="PriceRow">₹{prod.price}</div>
                      </div>
                    </div>
                    <div className="ActionArea">
                      <button className="ViewDetailsBtn">View Details</button>
                      <button
                        className="AddToCartBtn"
                        onClick={() => toggleCartItem(prod.value)}
                        style={{
                          background: cartItems.includes(prod.value)
                            ? "var(--primaryColor)"
                            : "transparent",
                          color: cartItems.includes(prod.value)
                            ? "#fff"
                            : "var(--primaryColor)",
                        }}
                      >
                        {cartItems.includes(prod.value)
                          ? "Added"
                          : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 10. Reviews */}
          <section className="card">
            <h2>Student Reviews</h2>
            <div className="ReviewGrid">
              {reviews.map((rev, i) => (
                <div className="ReviewCard" key={i}>
                  <div className="Stars">
                    <AiFillStar /> <AiFillStar /> <AiFillStar /> <AiFillStar />{" "}
                    <AiFillStar />
                  </div>
                  <p>&quot;{rev.text}&quot;</p>
                  <div className="Reviewer">- {rev.name}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 11. FAQ */}
          <section className="card">
            <h2>Frequently Asked Questions</h2>
            <div className="FAQList">
              {faqs.map((faq, i) => (
                <div className="FAQItem" key={i}>
                  <div className="FAQHead" onClick={() => toggleFaq(i)}>
                    <h4>{faq.q}</h4>
                    <span className="Icon">
                      {activeFaq === i ? <FiMinus /> : <FiPlus />}
                    </span>
                  </div>
                  {activeFaq === i && <div className="FAQBody">{faq.a}</div>}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 12. Sticky Sidebar */}
        <div className="RightColumn">
          <div className="StickySidebar">
            <div className="EnrollmentCard">
              <div className="ECardItem">
                <span>Starts:</span>
                <strong>{liveClass?.human_start_date || "14 Jan 2026"}</strong>
              </div>
              <div className="ECardItem">
                <span>Ends:</span>
                <strong>{liveClass?.human_end_date || "24 Jan 2026"}</strong>
              </div>
              <div className="ECardItem">
                <span>Time:</span>
                <strong>{liveClass?.human_class_time || "07:00 PM"}</strong>
              </div>
              <div className="ECardItem">
                <span>Days:</span>
                <strong>{days.join(" • ")}</strong>
              </div>

              <div className="PriceRow">
                <span className="Label">{selectedPlan ? "Total Price" : "Starts from"}</span>
                <span className="Price">₹{selectedPlan ? selectedPlanDetails?.price : "499"}</span>
              </div>

              <button
                className="EnrollSidebarBtn"
                onClick={selectedPlan ? () => router.push('/checkout') : handleScrollToPricing}
              >
                {selectedPlan ? "Enroll Now" : "Choose Plan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDetails;
