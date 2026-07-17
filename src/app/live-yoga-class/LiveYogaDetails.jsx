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
  MdEventSeat,
  MdTrendingUp,
  MdOutlineLocationOn,
  MdShare
} from 'react-icons/md';
import { FiUsers, FiAward, FiClock, FiPlayCircle, FiCheck, FiXCircle } from 'react-icons/fi';
import { FaChalkboardTeacher, FaWhatsapp, FaFacebook, FaRegCalendarAlt, FaCopy } from 'react-icons/fa';
import '../../assets/css/live-yoga-details.css';

// Expanded Mock Data
const sessionData = {
  title: "Advanced Vinyasa Flow for Core Strength",
  category: "Vinyasa Yoga",
  rating: 4.9,
  reviews: 128,
  date: "25 Oct 2026",
  time: "07:00 AM (IST)",
  duration: "90 Minutes",
  price: 499,
  originalPrice: 999,
  discount: "50% OFF",
  totalSeats: 50,
  bookedSeats: 35,
  remainingSeats: 15,
  language: "English",
  level: "Beginner / Intermediate",
  format: "Live Online",
  targetDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).getTime(), // 2 days from now
  about: "Join us for an invigorating 90-minute Advanced Vinyasa Flow designed to build heat, endurance, and deep core strength. This session will guide you through complex transitions, arm balances, and deep stretches, leaving you feeling energized and centered.",
  
  whatYouWillLearn: [
    "Sun Salutation Variations",
    "Breath Synchronization",
    "Hip Opening Techniques",
    "Shoulder Mobility",
    "Deep Core Strength",
    "Guided Meditation"
  ],

  perfectFor: [
    "Beginners looking for basics",
    "Office Employees with back pain",
    "Students needing focus",
    "Stress & Anxiety Relief",
    "Weight Loss Goals",
    "Improving Flexibility"
  ],

  notRecommendedFor: [
    "Recent Surgery Recovery",
    "High Fever or Illness",
    "Pregnancy (unless doctor approved)",
    "Serious Joint Injuries"
  ],

  agenda: [
    { time: "07:00 AM", task: "Introduction & Intention Setting" },
    { time: "07:10 AM", task: "Gentle Warm Up & Breathing" },
    { time: "07:25 AM", task: "Main Vinyasa Core Flow" },
    { time: "08:00 AM", task: "Cool Down & Deep Stretches" },
    { time: "08:15 AM", task: "Guided Meditation (Savasana)" },
    { time: "08:20 AM", task: "Live Q&A Session" },
    { time: "08:30 AM", task: "Closing & Gratitude" }
  ],

  objectives: [
    "Master advanced Vinyasa transitions and breath synchronization.",
    "Build profound core stability and upper body strength.",
    "Learn proper alignment for intermediate to advanced arm balances."
  ],
  requirements: [
    "Basic understanding of foundational yoga poses.",
    "A yoga mat, water bottle, and towel."
  ],
  instructor: {
    name: "Sarah Jenkins",
    profession: "E-RYT 500 Yoga Instructor",
    rating: 4.95,
    sessions: 320,
    experience: "8+ Years",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&auto=format&fit=crop&q=60",
    specialization: ["Hatha Yoga", "Vinyasa", "Meditation", "Weight Loss"],
    languages: ["English", "Malayalam", "Hindi"]
  },
  
  studentReviews: [
    { name: "Anjali M.", rating: 5, text: "Amazing session! I feel so much lighter and relaxed. Highly recommend for office workers." },
    { name: "Rahul S.", rating: 5, text: "Instructor explained every pose very well. The Q&A at the end was super helpful." }
  ],

  joiningGuide: [
    "Join the meeting 10 mins early.",
    "Ensure a stable internet connection.",
    "Laptop/Tablet preferred over mobile.",
    "Keep a water bottle nearby."
  ],
  refundPolicy: "Cancellation is allowed up to 24 hours before the session starts for a full refund.",

  faqs: [
    {
      q: "Will I get access to the recording?",
      a: "Yes, all registered participants will receive access to the full recording for 30 days after the live session."
    },
    {
      q: "What platform will be used for the live stream?",
      a: "We use a high-quality Zoom integration directly embedded within our platform for a seamless experience."
    }
  ],
  tags: ["Meditation", "Core", "Strength", "Morning", "Live Yoga", "Flexibility"],
  related: [
    {
      id: 1,
      title: "Morning Hatha Yoga & Meditation",
      instructor: "David Chen",
      date: "28 Oct 2026",
      price: 299,
      level: "Beginner",
      image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=500&auto=format&fit=crop&q=60"
    },
    {
      id: 2,
      title: "Yin Yoga for Deep Tissue Release",
      instructor: "Maya Patel",
      date: "30 Oct 2026",
      price: 399,
      level: "Intermediate",
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&auto=format&fit=crop&q=60"
    }
  ]
};

const LiveYogaDetails = () => {
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const calcTimeLeft = () => {
      const distance = sessionData.targetDate - Date.now();
      if (distance <= 0) return { days: "00", hours: "00", minutes: "00", seconds: "00" };
      return {
        days: String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, "0"),
        hours: String(Math.floor((distance / (1000 * 60 * 60)) % 24)).padStart(2, "0"),
        minutes: String(Math.floor((distance / (1000 * 60)) % 60)).padStart(2, "0"),
        seconds: String(Math.floor((distance / 1000) % 60)).padStart(2, "0"),
      };
    };

    const timer = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div id='LiveYogaDetails'>
      {/* Breadcrumb */}
      <div className="container BreadcrumbWrap">
        <span>Home</span> &gt; <span>Live Sessions</span> &gt; <span className="CurrentPath">{sessionData.title}</span>
      </div>

      {/* 1 & 15. Hero Banner */}
      <section className="HeroBanner">
        <div className="HeroOverlay"></div>
        <div className="container">
          <div className="HeroContent fadeUp">
            <div className="BadgesWrap">
              <span className="LiveBadge"><span className="Pulse"></span>Upcoming in {timeLeft.days} Days</span>
              <span className="CategoryBadge">{sessionData.category}</span>
            </div>
            
            <h1>{sessionData.title}</h1>
            
            <div className="RatingBox">
              <MdStar className="StarIcon" />
              <span>{sessionData.rating}</span>
              <span className="ReviewCount">({sessionData.reviews} Reviews)</span>
            </div>
            
            {/* Expanded Hero Summary */}
            <div className="HeroSummaryGrid">
              <div className="SumItem">📅 {sessionData.date}</div>
              <div className="SumItem">🕒 {sessionData.time}</div>
              <div className="SumItem">⏱ {sessionData.duration}</div>
              <div className="SumItem">👥 {sessionData.bookedSeats} / {sessionData.totalSeats} Filled</div>
              <div className="SumItem">🌐 {sessionData.language}</div>
              <div className="SumItem">⭐ {sessionData.level}</div>
              <div className="SumItem">💻 {sessionData.format}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="container ContentLayout">
        <div className="LeftColumn">
          
     
          <section className="AboutSection card">
            <h2>About This Live Session</h2>
            <p>{sessionData.about}</p>

            <div className="QuickHighlights">
              <div className="HighlightItem"><MdOutlineOndemandVideo /> <span>Live Session</span></div>
              <div className="HighlightItem"><FiAward /> <span>Certificate</span></div>
              <div className="HighlightItem"><MdOutlineLanguage /> <span>Live Q&A</span></div>
              <div className="HighlightItem"><FiPlayCircle /> <span>Recording</span></div>
              <div className="HighlightItem"><FaChalkboardTeacher /> <span>Expert Instructor</span></div>
              <div className="HighlightItem"><MdOutlineDateRange /> <span>Flexible</span></div>
            </div>
          </section>

         
          <section className="WhatYouLearnSection card">
            <h2>What You&apos;ll Learn</h2>
            <div className="LearnGrid">
              {sessionData.whatYouWillLearn.map((item, i) => (
                <div className="LearnItem" key={i}>
                  <MdCheckCircle className="CheckIcon" /> {item}
                </div>
              ))}
            </div>
          </section>

         
          <div className="AudienceGrid">
            <section className="AudienceCard PerfectFor">
              <h3><MdTrendingUp className="Icon" /> Perfect For</h3>
              <ul>
                {sessionData.perfectFor.map((item, i) => (
                  <li key={i}><FiCheck className="ListIcon" /> {item}</li>
                ))}
              </ul>
            </section>
            
            <section className="AudienceCard AvoidFor">
              <h3><FiXCircle className="Icon" /> Not Recommended For</h3>
              <ul>
                {sessionData.notRecommendedFor.map((item, i) => (
                  <li key={i}><FiXCircle className="ListIcon" /> {item}</li>
                ))}
              </ul>
            </section>
          </div>

          
          <section className="AgendaSection card">
            <h2>Session Agenda</h2>
            <div className="Timeline">
              {sessionData.agenda.map((step, i) => (
                <div className="TimelineItem" key={i}>
                  <div className="TimePoint"></div>
                  <div className="TimeLabel">{step.time}</div>
                  <div className="TaskLabel">{step.task}</div>
                </div>
              ))}
            </div>
          </section>

         
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

          
          <section className="InstructorSection card">
            <h2>Meet Your Instructor</h2>
            <div className="InstructorProfile">
              <div className="InstImage">
                <Image src={sessionData.instructor.image} alt={sessionData.instructor.name} fill />
              </div>
              <div className="InstDetails">
                <h3>{sessionData.instructor.name}</h3>
                <p className="Profession">{sessionData.instructor.profession}</p>
                <div className="InstStats">
                  <div className="Stat"><MdStar className="Icon" /> {sessionData.instructor.rating} Rating</div>
                  <div className="Stat"><MdPlayLesson className="Icon" /> {sessionData.instructor.sessions} Sessions</div>
                  <div className="Stat"><FiAward className="Icon" /> {sessionData.instructor.experience} Exp.</div>
                </div>
                
                <div className="InstExtraInfo">
                  <div className="InfoBlock">
                    <strong>Specialization:</strong>
                    <div className="ChipWrap">
                      {sessionData.instructor.specialization.map((spec, i) => <span key={i} className="Chip">{spec}</span>)}
                    </div>
                  </div>
                  <div className="InfoBlock">
                    <strong>Languages:</strong>
                    <div className="ChipWrap">
                      {sessionData.instructor.languages.map((lang, i) => <span key={i} className="Chip">{lang}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          
          <div className="InfoSplitGrid">
            <section className="JoiningGuide card">
              <h3>Joining Guide</h3>
              <ul className="SimpleList">
                {sessionData.joiningGuide.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </section>
            
            <section className="RefundPolicy card">
              <h3>Refund Policy</h3>
              <p>{sessionData.refundPolicy}</p>
            </section>
          </div>

         
          <section className="ReviewsSection card">
            <h2>Student Reviews</h2>
            <div className="ReviewGrid">
              {sessionData.studentReviews.map((rev, i) => (
                <div className="ReviewCard" key={i}>
                  <div className="Stars">
                    {[...Array(rev.rating)].map((_, idx) => <MdStar key={idx} className="StarFill" />)}
                  </div>
                  <p>&quot;{rev.text}&quot;</p>
                  <h4>- {rev.name}</h4>
                </div>
              ))}
            </div>
          </section>

        
          <section className="FAQSection card">
            <h2>Frequently Asked Questions</h2>
            <div className="FAQList">
              {sessionData.faqs.map((faq, i) => (
                <div className={`FAQItem ${openFaq === i ? 'active' : ''}`} key={i}>
                  <div className="FAQHead" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <h4>{faq.q}</h4>
                    <MdOutlineKeyboardArrowDown className="Arrow" />
                  </div>
                  <div className="FAQBody">
                    <p>{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Removed Tags, Share, and Related Sections based on feedback */}

        </div>

        {/* Right Sticky Column */}
        <div className="RightColumn">
          <div className="StickySidebar">
            
            <div className="PricingCard SidebarCard">
            <div className="CardHeaderBadge">Next Live • {sessionData.date}</div>
            
            <div className="PriceHeader">
              <h2>₹{sessionData.price}</h2>
              <span className="OriginalPrice">₹{sessionData.originalPrice}</span>
              <span className="DiscountBadge">{sessionData.discount}</span>
            </div>

            {/* 3. Countdown Inside Card */}
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
              {/* 11. Add to calendar */}
              <button className="CalendarBtn"><FaRegCalendarAlt /> Add to Calendar</button>
            </div>
            
            {/* 16. Seats Visualization */}
            <div className="SeatsVisualBlock">
              <div className="SeatHeader">
                <span><strong>{sessionData.totalSeats}</strong> Total Seats</span>
              </div>
              <div className="ProgressBar">
                <div className="ProgressFill" style={{ width: `${(sessionData.bookedSeats / sessionData.totalSeats) * 100}%` }}></div>
              </div>
              <div className="SeatFooter">
                <span>{sessionData.bookedSeats} Booked</span>
                <span className="HurryText"><strong>{sessionData.remainingSeats}</strong> Remaining</span>
              </div>
            </div>

            <Link href="/checkout" style={{ textDecoration: 'none' }}>
              <button className="BookBtnSidebar">
                Pre Book Now <MdKeyboardArrowRight className="ArrowAnim" />
              </button>
            </Link>
            <p className="SecureCheckout">Secure Checkout</p>
          </div>
            
          </div>
        </div>
      </div>



    </div>
  )
}

export default LiveYogaDetails;