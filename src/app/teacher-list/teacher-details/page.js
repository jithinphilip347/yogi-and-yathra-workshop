"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaStar,
  FaUsers,
  FaLeaf,
  FaEnvelope,
  FaHeartbeat,
  FaRegPlayCircle,
  FaRegClock,
  FaRupeeSign,
  FaInstagram,
  FaFacebook,
  FaLinkedin,
  FaYoutube,
  FaCheckCircle,
  FaCalendarAlt,
  FaVideo,
  FaArrowRight,
  FaUserGraduate,
  FaBookOpen,
  FaMicrophone,
  FaTrophy
} from "react-icons/fa";
import TeacherBox from "../../../components/teachersBox/TeacherBox";
import Team1 from "../../../assets/images/team-1.webp";

import course1 from "../../../assets/images/courseImg-5.webp";
import course2 from "../../../assets/images/courseImg-7.webp";

import CourseCard from "../../../components/coursebox/CourseCard";

import userImg1 from "../../../assets/images/st-1.webp";
import userImg2 from "../../../assets/images/st-2.webp";

const Page = () => {
  const teacher = {
    name: "Aadhya Sharma",
    role: "Master Yoga Instructor & Wellness Coach",
    image: Team1,
    rating: 4.9,
    reviewsCount: 128,
    isFeatured: true,
    socials: [
      { icon: <FaInstagram />, link: "#" },
      { icon: <FaFacebook />, link: "#" },
      { icon: <FaLinkedin />, link: "#" },
      { icon: <FaYoutube />, link: "#" }
    ],
    stats: [
      { icon: <FaStar />, value: "4.9", label: "Rating" },
      { icon: <FaUsers />, value: "12,000", label: "Students" },
      { icon: <FaBookOpen />, value: "12", label: "Courses" },
      { icon: <FaLeaf />, value: "8", label: "Daily Classes" },
      { icon: <FaMicrophone />, value: "25", label: "Live Workshops" },
      { icon: <FaTrophy />, value: "15+ Years", label: "Experience" }
    ],
    about:
      "Aadhya is a certified Master Yoga Instructor with over 15 years of experience specializing in Hatha, Vinyasa, and Ashtanga yoga. She believes in the transformative power of yoga to align the mind, body, and spirit. Her classes are designed to build physical strength, increase flexibility, and foster a profound sense of inner peace. Aadhya's holistic approach flawlessly incorporates breathwork (Pranayama) and meditation, ensuring that every student leaves the mat feeling completely rejuvenated, balanced, and deeply connected to their true self.",
    philosophy: "I believe yoga is not only physical exercise, but a daily practice for creating balance, strength, and mindfulness.",
    expertise: ["Hatha Yoga", "Vinyasa Flow", "Meditation", "Pranayama", "Breathwork"],
    languages: ["English", "Malayalam", "Hindi"],
    courses: [
      {
        id: 1,
        title: "200-Hour Master Vinyasa Flow Journey",
        image: course1,
        lessons: "45",
        duration: "30h 15m",
        price: "4,500",
        oldPrice: "6,000",
        rating: "4.8",
        students: "2.1k",
      },
      {
        id: 2,
        title: "Beginner's Guide to Ashtanga Yoga",
        image: course2,
        lessons: "28",
        duration: "15h 30m",
        price: "2,200",
        oldPrice: "3,500",
        rating: "4.9",
        students: "3.5k",
      },
    ],
    dailyClasses: [
      { id: 1, title: "Morning Meditation", days: "Tue • Wed", time: "07:00 PM", duration: "20 Minutes", level: "Beginner" },
      { id: 2, title: "Evening Vinyasa Flow", days: "Mon • Thu", time: "06:00 PM", duration: "45 Minutes", level: "All Levels" }
    ],
    workshops: [
      { id: 1, title: "Power Yoga Workshop", date: "25 Oct", time: "07:00 PM", duration: "90 Minutes", seatsLeft: 8 },
      { id: 2, title: "Breathwork Intensive", date: "12 Nov", time: "10:00 AM", duration: "120 Minutes", seatsLeft: 3 }
    ],
    ratingBreakdown: [
      { stars: 5, count: 120 },
      { stars: 4, count: 30 },
      { stars: 3, count: 6 },
      { stars: 2, count: 1 },
      { stars: 1, count: 0 }
    ],
    reviews: [
      {
        id: 1,
        user: "Isabella Martinez",
        image: userImg1,
        rating: 5,
        date: "October 12, 2025",
        text: "Aadhya's Vinyasa class completely changed my perspective on yoga. Her precise instructions and holistic approach towards breathwork were exactly what I needed. Highly recommended for anyone looking to deepen their practice!",
      },
      {
        id: 2,
        user: "Michael Chen",
        image: userImg2,
        rating: 5,
        date: "September 02, 2025",
        text: "The perfect balance of strength and mindfulness. I took her Beginner's guide course and she breaks down the hardest poses into manageable steps. A true master of her craft.",
      },
    ],
    relatedTeachers: [
      { id: 1, name: "Arjun Das", specialization: "Meditation", rating: 4.8, image: Team1 },
      { id: 2, name: "Meera Nair", specialization: "Hatha Yoga", rating: 4.9, image: Team1 },
      { id: 3, name: "Rohan Varma", specialization: "Vinyasa", rating: 4.7, image: Team1 }
    ]
  };

  const totalReviewsInBreakdown = teacher.ratingBreakdown.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div id="TeacherDetails">
      <div className="container">
        <div className="TeacherProfileWrapper">
          {/* LEFT SIDEBAR */}
          <div className="ProfileSidebar">
            <div className="ProfileImageWrapper">
              <Image src={teacher.image} alt={teacher.name} />
              <div className="ImageOverlay"></div>
            </div>

            <div className="ProfileBasicInfo">
              <h1>{teacher.name}</h1>
              <p className="Role">{teacher.role}</p>
              
              <div className="HeaderTrustBadge">
                <div className="Stars">
                  <FaStar className="star-icon" />
                  <span>{teacher.rating}</span>
                </div>
                <div className="ReviewCount">({teacher.reviewsCount} Reviews)</div>
              </div>
              {teacher.isFeatured && <div className="FeaturedBadge">Featured Instructor</div>}

              {teacher.socials && teacher.socials.length > 0 && (
                <div className="SocialLinks">
                  {teacher.socials.map((social, index) => (
                    <a key={index} href={social.link} className="social-icon">
                      {social.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="ProfileContent">
            
            {/* ABOUT SECTION */}
            <div className="ContentSection AboutSection">
              <h2>About me</h2>
              <p className="BioText">{teacher.about}</p>

              {teacher.philosophy && (
                <div className="TeachingPhilosophy">
                  <h4>Teaching Philosophy</h4>
                  <blockquote>&quot;{teacher.philosophy}&quot;</blockquote>
                </div>
              )}

              <div className="ProfileStatsRight">
                {teacher.stats.map((stat, index) => (
                  <div className="StatBox" key={index}>
                    <div className="StatIcon">{stat.icon}</div>
                    <div className="StatInfo">
                      <h4>{stat.value}</h4>
                      <p>{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ExpertiseArea">
                <h4>Areas of Expertise</h4>
                <ul className="ExpertiseList">
                  {teacher.expertise.map((item, index) => (
                    <li key={index}><FaCheckCircle className="check-icon" /> {item}</li>
                  ))}
                </ul>
              </div>

              <div className="LanguagesArea">
                <h4>Languages</h4>
                <div className="LangList">
                  {teacher.languages.map((lang, index) => (
                    <span key={index} className="LangBadge">{lang}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* PUBLISHED COURSES */}
            <div className="ContentSection CoursesSection">
              <div className="SectionHeader">
                <h2>{teacher.courses.length} Published Courses</h2>
                <Link href="#" className="ViewAllLink">View All <FaArrowRight /></Link>
              </div>
              
              <div className="TeacherCoursesGrid">
                {teacher.courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    slug="yoga-course"
                    image={course.image}
                    title={course.title}
                    lessons={course.lessons}
                    duration={course.duration}
                    price={course.price}
                    oldPrice={course.oldPrice}
                    rating={course.rating}
                    students={course.students}
                    lessonsLabel="Lessons"
                    buttonText="View Course"
                    lessonsIcon={<FaRegPlayCircle />}
                    clockIcon={<FaRegClock />}
                    priceIcon={<FaRupeeSign />}
                    ratingIcon={<FaStar />}
                    userIcon={<FaUsers />}
                  />
                ))}
              </div>
            </div>

            {/* UPCOMING DAILY LIVE CLASSES */}
            {teacher.dailyClasses && teacher.dailyClasses.length > 0 && (
              <div className="ContentSection LiveClassesSection">
                <h2>Upcoming Daily Live Classes</h2>
                <div className="DailyClassesGrid">
                  {teacher.dailyClasses.map((cls) => (
                    <div className="DailyClassCard" key={cls.id}>
                      <div className="ClassInfo">
                        <h4>{cls.title}</h4>
                        <div className="ClassMeta">
                          <span><FaCalendarAlt /> {cls.days}</span>
                          <span><FaRegClock /> {cls.time}</span>
                          <span><FaVideo /> {cls.duration}</span>
                          <span><FaUserGraduate /> {cls.level}</span>
                        </div>
                      </div>
                      <button className="EnrollBtn">View Details</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* UPCOMING LIVE SESSIONS / WORKSHOPS */}
            {teacher.workshops && teacher.workshops.length > 0 && (
              <div className="ContentSection WorkshopsSection">
                <h2>Upcoming Live Sessions</h2>
                <div className="WorkshopsGrid">
                  {teacher.workshops.map((ws) => (
                    <div className="WorkshopCard" key={ws.id}>
                      <div className="WsDate">
                        <span className="WsDay">{ws.date.split(" ")[0]}</span>
                        <span className="WsMonth">{ws.date.split(" ")[1]}</span>
                      </div>
                      <div className="WsInfo">
                        <h4>{ws.title}</h4>
                        <div className="WsMeta">
                          <span><FaRegClock /> {ws.time}</span>
                          <span><FaVideo /> {ws.duration}</span>
                        </div>
                        <div className="SeatsLeft">Only {ws.seatsLeft} Seats Left</div>
                      </div>
                      <button className="PreBookBtn">Pre Book</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STUDENT REVIEWS */}
            <div className="ContentSection ReviewsSection">
              <div className="ReviewsTop">
                <div className="OverallRating">
                  <h2>{teacher.rating}</h2>
                  <div className="Stars">
                    {[...Array(5)].map((_, i) => <FaStar key={i} className={i < Math.floor(teacher.rating) ? "star-active" : ""} />)}
                  </div>
                  <p>{teacher.reviewsCount} Reviews</p>
                </div>
                
                <div className="RatingBreakdown">
                  {teacher.ratingBreakdown.map((breakdown) => (
                    <div className="BreakdownRow" key={breakdown.stars}>
                      <div className="StarLabel">{breakdown.stars} <FaStar className="star-icon" /></div>
                      <div className="ProgressBar">
                        <div className="ProgressFill" style={{ width: `${(breakdown.count / totalReviewsInBreakdown) * 100}%` }}></div>
                      </div>
                      <div className="CountLabel">{breakdown.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ReviewsList">
                <h3 className="LatestReviewsTitle">Latest Reviews</h3>
                {teacher.reviews.map((review) => (
                  <div className="ReviewCard" key={review.id}>
                    <div className="ReviewHeader">
                      <div className="ReviewUser">
                        <Image src={review.image} alt={review.user} width={50} height={50} className="UserAvat" />
                        <div className="UserInfo">
                          <h4>{review.user}</h4>
                          <span>{review.date}</span>
                        </div>
                      </div>
                      <div className="ReviewStars">
                        {[...Array(review.rating)].map((_, i) => (
                          <FaStar key={i} className="star-active" />
                        ))}
                      </div>
                    </div>
                    <p className="ReviewText">&quot;{review.text}&quot;</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* RELATED TEACHERS - FULL WIDTH */}
        {teacher.relatedTeachers && teacher.relatedTeachers.length > 0 && (
          <div className="RelatedTeachersFullWidth">
            <h2>Meet More Instructors</h2>
            <div className="RelatedTeachersGrid">
              {teacher.relatedTeachers.map((rel) => (
                <TeacherBox
                  key={rel.id}
                  image={rel.image}
                  name={rel.name}
                  position={rel.specialization}
                  twitter="#"
                  instagram="#"
                  profileLink="/teacher-list/teacher-details"
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Page;
