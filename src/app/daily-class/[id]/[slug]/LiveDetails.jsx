"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useCart } from "@/features/commerce/hooks/useCommerceHooks";
import { useSubscription } from "@/features/commerce/hooks/useSubscription";
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
  FiLock,
  FiRefreshCw,
} from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import Image from "next/image";
import Inst1 from "@/assets/images/instructor-1.webp";
import ThumbNail from "@/assets/images/live1.webp";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import Yoga1 from "@/assets/images/yoga-1.jpg";
import Yoga2 from "@/assets/images/yoga-2.jpg";
import Yoga3 from "@/assets/images/yoga-3.jpg";
import "@/assets/css/daily-live-details.scss";

const LiveDetails = ({ id, classDetails }) => {
  const dailyClass = classDetails || {};
  const instructor = dailyClass?.instructor;
  const category = dailyClass?.category;
  const days = dailyClass?.schedule || [];
  const pricingPlans = dailyClass?.pricing_plans || [];
  const subscriptionPlans = dailyClass?.subscription_plans || [];
  const faqs = dailyClass?.active_faqs || dailyClass?.faqs || [];
  const reviewsData = dailyClass?.reviews || dailyClass?.approved_reviews || [];
  const products = dailyClass?.products || [];
  const learningOutcomes = dailyClass?.learning_outcomes || [];
  const requirements = dailyClass?.requirements || [];

  const averageRating = dailyClass?.average_rating || 4.8;
  const reviewCount = dailyClass?.review_count || 0;
  const studentCount = dailyClass?.total_enrollments || 1234;

  // Fallback image sources
  const thumbnailSrc = dailyClass?.thumbnail
    ? resolveMediaUrl(dailyClass.thumbnail)
    : ThumbNail.src;

  const instructorAvatar = instructor?.avatar_url || instructor?.avatar
    ? resolveMediaUrl(instructor.avatar_url || instructor.avatar)
    : Inst1;

  const instructorName = instructor?.name || "Achu Sivadasan";
  const instructorRole = instructor?.professional_title || instructor?.role || "Senior Yoga Teacher";
  const instructorBio = instructor?.full_biography || instructor?.bio_graphy || "";
  const instructorExperience = instructor?.years_of_experience || 5;

  const [activeFaq, setActiveFaq] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const router = useRouter();
  const { addItem, removeItem, isInCart } = useCart();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const {
    status: subStatus,
    subscription: subData,
    accessLevel,
    error: subError,
    loading: subLoading,
    startSubscription,
    fetchStatus,
    cancelSubscription,
  } = useSubscription();

  // On load (and after returning from the AutoPay checkout), fetch the
  // ACTUAL server subscription state — never trust local frontend state.
  useEffect(() => {
    if (id && isAuthenticated) {
      fetchStatus(id);
    }
  }, [id, isAuthenticated, fetchStatus]);

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const handleScrollToPricing = () => {
    document.getElementById("pricing-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const selectedPlanDetails = selectedPlan
    ? pricingPlans.find((p) => p.id === selectedPlan) || subscriptionPlans.find((p) => p.id === selectedPlan)
    : null;

  const hasPricing = pricingPlans.length > 0 || subscriptionPlans.length > 0;

  return (
    <div id="DailyLiveClassDetails">
      {/* 1. Hero Section */}
      <section className="HeroBanner" style={{ backgroundImage: `url(${thumbnailSrc})` }}>
        <div className="HeroOverlay"></div>
        <div className="container">
          <div className="HeroContent">
            <span className="CategoryBadge">
              {category?.name || "Advanced Meditation"}
            </span>

            <h1>{dailyClass?.title || "Daily Morning Flow & Meditation"}</h1>

            <div className="RatingStudents">
              <span className="Stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <AiFillStar key={star} />
                ))}
                <span>{averageRating} Rating</span>
              </span>
              <span>
                <FiUsers style={{ marginRight: "5px" }} /> {studentCount} Students enrolled
              </span>
            </div>

            <div className="HeroSummaryGrid">
              <div className="SumItem">
                <FiCalendar /> {dailyClass?.human_start_date || "14 Jan"} -{" "}
                {dailyClass?.human_end_date || "24 Jan"}
              </div>
              <div className="SumItem">
                <FiClock /> {dailyClass?.human_class_time || "07:00 PM"}
              </div>
              <div className="SumItem">
                <FiMonitor /> {dailyClass?.duration || 60} Minutes
              </div>
              <div className="SumItem">
                <FiUsers /> Instructor: {instructorName}
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
                <strong>{dailyClass?.duration || 10} Day Program</strong>
              </div>
            </div>
            <div className="InfoCard">
              <div className="IconWrap">
                <FiClock />
              </div>
              <div className="InfoText">
                <small>Daily Time</small>
                <strong>{dailyClass?.human_class_time || "07:00 PM"}</strong>
              </div>
            </div>
            <div className="InfoCard">
              <div className="IconWrap">
                <FiCheckCircle />
              </div>
              <div className="InfoText">
                <small>Schedule</small>
                <strong>
                  {days.length > 0 ? days.join(" • ") : "Mon • Tue • Wed • Thu • Fri"}
                </strong>
              </div>
            </div>
            <div className="InfoCard">
              <div className="IconWrap">
                <FiMonitor />
              </div>
              <div className="InfoText">
                <small>Session Length</small>
                <strong>{dailyClass?.duration || 60} Minutes</strong>
              </div>
            </div>
            <div className="InfoCard">
              <div className="IconWrap">
                <FiGlobe />
              </div>
              <div className="InfoText">
                <small>Language</small>
                <strong>{dailyClass?.language || "English / Malayalam"}</strong>
              </div>
            </div>
            <div className="InfoCard">
              <div className="IconWrap">
                <FiTrendingUp />
              </div>
              <div className="InfoText">
                <small>Level</small>
                <strong>{dailyClass?.level || "Beginner Friendly"}</strong>
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
                  dailyClass?.description ||
                  "<p>Join this immersive daily experience to transform your mornings. This program combines dynamic stretching with deep mindfulness meditation to help you start every day with clarity, focus, and energy. Suitable for all levels, you'll be guided step-by-step by our expert instructors.</p>",
              }}
            />
          </section>

          {/* 4. What You'll Learn */}
          {learningOutcomes.length > 0 && (
            <section className="card">
              <h2>What You&apos;ll Learn</h2>
              <div className="LearnGrid">
                {learningOutcomes.map((item, i) => (
                  <div className="LearnItem" key={i}>
                    <FiCheckCircle className="CheckIcon" /> {item}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. Weekly Schedule */}
          <section className="card">
            <h2>Weekly Schedule</h2>
            <div className="WeeklyScheduleModern">
              <div className="TimeBox">
                <FiClock className="Icon" />
                <div className="TimeDetails">
                  <span className="Label">Class Time</span>
                  <span className="Time">
                    {dailyClass?.human_class_time || "07:00 PM"} (IST)
                  </span>
                </div>
              </div>

              <div className="DaysRowWrap">
                <span className="DaysLabel">Active Days:</span>
                <div className="DaysRow">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                    const isActive =
                      days.length > 0
                        ? days.some((d) =>
                            day.toLowerCase().startsWith(d.toLowerCase().slice(0, 3))
                          )
                        : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(day);
                    return (
                      <div key={day} className={`DayBadge ${isActive ? "Active" : ""}`}>
                        {day.slice(0, 2)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* 6. Instructor Section */}
          <section className="card">
            <h2>Your Instructor</h2>
            <div className="InstructorProfile">
              <div className="InstImage">
                <Image
                  src={instructorAvatar}
                  alt={instructorName}
                  width={100}
                  height={100}
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="InstDetails">
                <h3>{instructorName}</h3>
                <div className="Profession">{instructorRole}</div>

                <div className="InstStats">
                  <div className="Stat">
                    <FiAward /> {instructorExperience}+ Years Experience
                  </div>
                  <div className="Stat">
                    <FiBookOpen /> {instructor?.taught_courses_count || 12} Courses
                  </div>
                  <div className="Stat">
                    <FiUsers /> {instructor?.total_students || "10k+"} Students
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
                  {instructorBio ||
                    "An internationally certified yoga and mindfulness trainer with over 5 years of experience helping individuals achieve physical and mental balance."}
                </p>
              </div>
            </div>
          </section>

          {/* 7. Requirements */}
          <section className="card">
            <h2>Class Requirements</h2>
            <div className="ReqGrid">
              {requirements.length > 0
                ? requirements.map((req, i) => (
                    <div className="ReqItem" key={i}>
                      <FiCheckCircle className="ReqIcon" /> {req}
                    </div>
                  ))
                : [
                    "Comfortable Clothes",
                    "High Speed Internet",
                    "Yoga Mat",
                    "Quiet Space",
                  ].map((req, i) => (
                    <div className="ReqItem" key={i}>
                      <FiCheckCircle className="ReqIcon" /> {req}
                    </div>
                  ))}
            </div>
          </section>

          {/* 8. Pricing Plans */}
          {hasPricing && (
            <section className="card" id="pricing-section">
              <h2>Pricing Plans</h2>
              <div className="PricingGrid">
                {(pricingPlans.length > 0 ? pricingPlans : subscriptionPlans).map((plan) => (
                  <div
                    className={`PlanCard ${plan.is_featured || plan.featured ? "FeaturedPlan" : ""}`}
                    key={plan.id}
                  >
                    {(plan.is_featured || plan.featured) && (
                      <span className="PopularBadge">Most Popular</span>
                    )}

                    <div className="PlanName">{plan.name || plan.title || "Plan"}</div>
                    <div className="PlanPrice">
                      ₹{plan.discount_price || plan.price}{" "}
                      <span className="Period">/month</span>
                    </div>
                    <div className="PlanDesc">{plan.description || plan.descriptions || ""}</div>
                    <ul className="PlanFeatures">
                      {[
                        ...(plan.included_features || []).map((feat) => ({ name: feat, included: true })),
                        ...(plan.excluded_features || []).map((feat) => ({ name: feat, included: false })),
                      ].map((feat, i) => (
                        <li key={i}>
                          {feat.included ? (
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
                      onClick={() =>
                        setSelectedPlan(selectedPlan === plan.id ? null : plan.id)
                      }
                    >
                      {selectedPlan === plan.id ? "Plan Selected" : "Select Plan"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 9. Related Products */}
          {products && products.length > 0 && (
            <section className="card">
              <h2>Recommended for this Class</h2>
              <div className="ProductList">
                {products.map((prod, index) => {
                  const productImage =
                    prod.image?.src || prod.image || [Yoga1, Yoga2, Yoga3][index % 3];
                  return (
                    <div className="ProductItem" key={index}>
                      <div className="ProdLeft">
                        <div className="ProdImage">
                          <Image
                            src={productImage}
                            alt={prod.label || prod.name || "Product"}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                        <div className="ProdInfo">
                          <h4>{prod.label || prod.name}</h4>
                          <div className="PriceRow">₹{prod.price}</div>
                        </div>
                      </div>
                      <div className="ActionArea">
                        <button className="ViewDetailsBtn">View Details</button>
                        <button
                          className="AddToCartBtn"
                          onClick={() =>
                            isInCart(prod.value || prod.id, 'Product')
                              ? removeItem('Product', prod.value || prod.id)
                              : addItem(prod, 'Product')
                          }
                          style={{
                            background: isInCart(prod.value || prod.id, 'Product')
                              ? "var(--primaryColor)"
                              : "transparent",
                            color: isInCart(prod.value || prod.id, 'Product')
                              ? "#fff"
                              : "var(--primaryColor)",
                          }}
                        >
                          {isInCart(prod.value || prod.id, 'Product') ? "Added" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 10. Reviews */}
          <section className="card">
            <h2>Student Reviews</h2>
            {reviewsData.length > 0 ? (
              <div className="ReviewGrid">
                {reviewsData.map((rev, i) => (
                  <div className="ReviewCard" key={rev.id || i}>
                    <div className="Stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <AiFillStar
                          key={star}
                          style={{
                            opacity: star <= (rev.rating || 5) ? 1 : 0.3,
                          }}
                        />
                      ))}
                    </div>
                    <p>&quot;{rev.content || rev.text || ""}&quot;</p>
                    <div className="Reviewer">- {rev.user_name || rev.name || "Anonymous"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ReviewGrid">
                <div className="ReviewCard">
                  <div className="Stars">
                    <AiFillStar /> <AiFillStar /> <AiFillStar /> <AiFillStar /> <AiFillStar />
                  </div>
                  <p>
                    &quot;This daily class changed my morning routine. The instructor is
                    incredible and really takes time to correct your posture.&quot;
                  </p>
                  <div className="Reviewer">- Arun K.</div>
                </div>
              </div>
            )}
          </section>

          {/* 11. FAQ */}
          <section className="card">
            <h2>Frequently Asked Questions</h2>
            {faqs.length > 0 ? (
              <div className="FAQList">
                {faqs.map((faq, i) => (
                  <div className="FAQItem" key={faq.id || i}>
                    <div className="FAQHead" onClick={() => toggleFaq(i)}>
                      <h4>{faq.question || faq.q}</h4>
                      <span className="Icon">
                        {activeFaq === i ? <FiMinus /> : <FiPlus />}
                      </span>
                    </div>
                    {activeFaq === i && (
                      <div className="FAQBody" dangerouslySetInnerHTML={{ __html: faq.answer || faq.a }}></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="FAQList">
                {[
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
                ].map((faq, i) => (
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
            )}
          </section>
        </div>

        {/* 12. Sticky Sidebar */}
        <div className="RightColumn">
          <div className="StickySidebar">
            <div className="EnrollmentCard">
              <div className="ECardItem">
                <span>Starts:</span>
                <strong>{dailyClass?.human_start_date || "14 Jan 2026"}</strong>
              </div>
              <div className="ECardItem">
                <span>Ends:</span>
                <strong>{dailyClass?.human_end_date || "24 Jan 2026"}</strong>
              </div>
              <div className="ECardItem">
                <span>Time:</span>
                <strong>{dailyClass?.human_class_time || "07:00 PM"}</strong>
              </div>
              <div className="ECardItem">
                <span>Days:</span>
                <strong>
                  {days.length > 0
                    ? days.join(" • ")
                    : "Mon • Tue • Wed • Thu • Fri"}
                </strong>
              </div>

              <div className="PriceRow">
                <span className="Label">
                  {selectedPlan ? "Monthly Subscription" : "Starts from"}
                </span>
                <span className="Price">
                  ₹
                  {selectedPlan
                    ? selectedPlanDetails?.discount_price || selectedPlanDetails?.price
                    : pricingPlans[0]?.discount_price || pricingPlans[0]?.price || "499"}
                  {selectedPlan ? <small> /month</small> : null}
                </span>
              </div>

              {subError && (
                <div
                  className="SubErrorMsg"
                  style={{
                    background: "#fef2f2",
                    color: "#b91c1c",
                    padding: "10px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    lineHeight: 1.5,
                    marginBottom: 10,
                  }}
                >
                  {subError}
                </div>
              )}

              {/* ── Subscription status / CTA ─────────────────────── */}
              {subStatus === "active" ? (
                <>
                  <div
                    className="SubActiveBadge"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#ecfdf5",
                      color: "#047857",
                      padding: "10px 12px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 10,
                    }}
                  >
                    <FiCheckCircle /> Subscription Active
                  </div>
                  {subData?.next_billing_at && (
                    <p className="SubMeta" style={{ fontSize: 12, color: "#64748b", margin: "0 0 10px" }}>
                      Next billing:{" "}
                      {new Date(subData.next_billing_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  {confirmCancel ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="EnrollSidebarBtn"
                        style={{ background: "#b91c1c", flex: 1 }}
                        disabled={subLoading}
                        onClick={async () => {
                          await cancelSubscription(subData.id);
                          setConfirmCancel(false);
                        }}
                      >
                        {subLoading ? "Cancelling…" : "Confirm Cancel"}
                      </button>
                      <button
                        className="EnrollSidebarBtn"
                        style={{ background: "#64748b", flex: 1 }}
                        onClick={() => setConfirmCancel(false)}
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <button
                      className="EnrollSidebarBtn"
                      style={{ background: "#b91c1c" }}
                      onClick={() => setConfirmCancel(true)}
                    >
                      Cancel Subscription
                    </button>
                  )}
                </>
              ) : subStatus === "pending" ? (
                <div
                  className="SubPendingBadge"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#fffbeb",
                    color: "#b45309",
                    padding: "10px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  <FiRefreshCw /> Authorization Pending
                </div>
              ) : subStatus === "creating" || subStatus === "authorizing" || subStatus === "verifying" ? (
                <button className="EnrollSidebarBtn" disabled>
                  {subStatus === "creating"
                    ? "Creating subscription…"
                    : subStatus === "authorizing"
                      ? "Authorize AutoPay to continue…"
                      : "Confirming payment…"}
                </button>
              ) : (
                <>
                  <button
                    className="EnrollSidebarBtn"
                    disabled={subLoading}
                    onClick={() => {
                      if (!isAuthenticated) {
                        router.push("/auth/login");
                        return;
                      }
                      if (!selectedPlan) {
                        document
                          .getElementById("pricing-section")
                          ?.scrollIntoView({ behavior: "smooth" });
                        return;
                      }
                      startSubscription({
                        dailyClassId: id,
                        planId: selectedPlan,
                      });
                    }}
                  >
                    <FiLock style={{ display: "inline", marginRight: 6 }} />
                    {isAuthenticated
                      ? selectedPlan
                        ? "Subscribe Now — AutoPay"
                        : "Choose a Plan & Subscribe"
                      : "Login to Subscribe"}
                  </button>
                  <p
                    className="SecureCheckoutNote"
                    style={{ fontSize: 12, color: "#64748b", textAlign: "center", marginTop: 8 }}
                  >
                    Recurring monthly billing via Razorpay AutoPay. Cancel anytime.
                  </p>
                </>
              )}

              {isInCart(dailyClass?.id, 'DailyClass') && subStatus !== 'active' && (
                <button
                  className="EnrollSidebarBtn"
                  style={{ background: "#334155", marginTop: 8 }}
                  onClick={() => router.push('/cart')}
                >
                  View Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDetails;
