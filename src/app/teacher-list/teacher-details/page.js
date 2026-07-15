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
} from "react-icons/fa";
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
    about:
      "Aadhya is a certified Master Yoga Instructor with over 15 years of experience specializing in Hatha, Vinyasa, and Ashtanga yoga. She believes in the transformative power of yoga to align the mind, body, and spirit. Her classes are designed to build physical strength, increase flexibility, and foster a profound sense of inner peace. Aadhya's holistic approach flawlessly incorporates breathwork (Pranayama) and meditation, ensuring that every student leaves the mat feeling completely rejuvenated, balanced, and deeply connected to their true self.",
    stats: [
      { icon: <FaStar />, value: "4.9", label: "Average Rating" },
      { icon: <FaUsers />, value: "12,000+", label: "Happy Students" },
      { icon: <FaLeaf />, value: "50+", label: "Retreats Led" },
      { icon: <FaHeartbeat />, value: "15+ Years", label: "Experience" },
    ],
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
  };

  return (
    <div id="TeacherDetails">
      <div className="container">
        <div className="TeacherProfileWrapper">
          <div className="ProfileSidebar">
            <div className="ProfileImageWrapper">
              <Image src={teacher.image} alt={teacher.name} />
              <div className="ImageOverlay"></div>
            </div>

            <div className="ProfileBasicInfo">
              <h1>{teacher.name}</h1>
              <p className="Role">{teacher.role}</p>

            </div>

            <div className="ProfileStats">
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
          </div>

          <div className="ProfileContent">
            <div className="ContentSection AboutSection">
              <h2>About me</h2>
              <p>{teacher.about}</p>
            </div>


            <div className="ContentSection CoursesSection">
              <h2>My Courses</h2>
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
                    instructorName={teacher.name}
                    instructorImg={teacher.image}
                    instructorLabel="Instructor by"
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

            <div className="ContentSection ReviewsSection">
              <h2>Student Reviews</h2>
              <div className="ReviewsList">
                {teacher.reviews.map((review) => (
                  <div className="ReviewCard" key={review.id}>
                    <div className="ReviewHeader">
                      <div className="ReviewUser">
                        <Image
                          src={review.image}
                          alt={review.user}
                          width={50}
                          height={50}
                          className="UserAvat"
                        />
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
      </div>
    </div>
  );
};

export default Page;
