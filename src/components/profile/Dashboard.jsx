"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import CourseCard from "@/components/coursebox/CourseCard";
import { FiBookOpen, FiClock, FiUsers, FiCalendar, FiPlayCircle, FiMoreVertical } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import { MdEvent, MdAccessTime, MdMoreVert, MdLiveTv } from 'react-icons/md';
import { FaChalkboardTeacher } from 'react-icons/fa';
import { MEDIA_BASE_URL } from "@/utils/constants";
import useWishlist from "@/hooks/useWishlist";

import CourseImg1 from "@/assets/images/courseImg-1.webp";
import CourseImg2 from "@/assets/images/courseImg-2.webp";
import LiveImg1 from "@/assets/images/live1.webp";
import LiveThumb1 from "@/assets/images/live2.webp";

const Dashboard = ({ courses = [], continueCourses = [], user }) => {
  const { findWishlistIcon } = useWishlist();

  const displayCourses = courses.length > 0 ? courses : [
    {
      id: 101,
      title: "Mindful Meditation for Beginners",
      lessons_count: 25,
      duration: 20,
      price: 499,
      discount_price: 899,
      enrollments_count: 780,
      instructor: { name: "Maya Krishna", role: "Instructor" },
      staticImage: CourseImg1,
      slug: "mindful-meditation"
    },
    {
      id: 102,
      title: "Full-Body Yoga Masterclass",
      lessons_count: 35,
      duration: 45,
      price: 899,
      discount_price: 1299,
      enrollments_count: 1260,
      instructor: { name: "Anil Dev", role: "Instructor" },
      staticImage: CourseImg2,
      slug: "full-body-yoga"
    }
  ];

  return (
    <div className="DashBoard">
      
      {/* Continue Learning */}
      <div className="ContinueWatchBox">
        <div className="DashBoardHead">
          <h2>Continue Learning</h2>
          <p>Pick up right where you left off.</p>
        </div>
        <div className="ContinueGrid">
          {continueCourses.map((item, index) => (
            <div className="ContinueCard" key={index}>
              <div className="Thumb">
                <Image src={item.image} alt={item.title} />
              </div>
              <div className="Details">
                <h4>{item.title}</h4>

                <div className="ProgressContainer">
                  <div className="Bar">
                    <div
                      className="Fill"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                  <p>{item.progress}% Complete</p>
                </div>

                <div className="CardFooter">
                  <div className="Instructor">
                    <Image
                      src={item.instructorImg}
                      alt={item.instructorName}
                      width={30}
                      height={30}
                    />
                    <span>{item.instructorName}</span>
                  </div>
                  <button className="ContinueBtn">Continue</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Daily Live Class */}
      <div className="UpcomingDailyClassBox">
        <div className="DashBoardHead">
          <h2>Today&apos;s Daily Live Class</h2>
          <p>Your daily routine awaits. Join today&apos;s session.</p>
        </div>
        
        <div className="LiveClasses">
          <div className="ClassList">
            <div className="ProgramCard active">
              <div className="ActiveBadge">ACTIVE</div>
              <div className="MoreOptions">
                <button className="MoreBtn"><FiMoreVertical /></button>
              </div>

              <div className="CardLeft">
                <div className="Header">
                  <div className="Thumb">
                    <Image src={LiveThumb1} alt="Advanced Meditation" width={100} height={70} className="Img" />
                    <span className="Category">POWER YOGA</span>
                  </div>
                  <div className="TitleInfo">
                    <h3>Advanced Meditation</h3>
                    <p className="Instructor">Instructor: <span>Achu Sivadasan</span></p>
                  </div>
                </div>

                <div className="ScheduleMeta">
                  <div className="MetaItem">
                    <FiCalendar className="Icon" />
                    <span>14 Jan - 24 Jan</span>
                  </div>
                  <div className="MetaItem">
                    <FiClock className="Icon" />
                    <span>07:00 PM</span>
                  </div>
                </div>

                <div className="WeeklyChips">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day, idx) => (
                    <span key={idx} className={`Chip ${['Tu', 'We'].includes(day) ? "Active" : ""}`}>
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              <div className="CardRight">
                <div className="ProgressHero">
                  <div className="ProgressHeader">
                    <span className="Label">PROGRESS</span>
                    <span className="Value">Day 4 / 10</span>
                  </div>
                  <div className="ProgressBar">
                    <div className="Fill" style={{ width: "40%" }}></div>
                  </div>
                </div>

                <div className="TodayStatusBox">
                  <div className="StatusHeader">
                    <span className="Title">Today&apos;s Class</span>
                  </div>
                  <div className="StatusMessage">Starts in 01:22:10</div>
                  <div className="HelperText">Join opens 15 mins before</div>
                </div>

                <button className="ActionBtn primary">
                  <FiPlayCircle className="BtnIcon" /> Join Today&apos;s Class
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Live Session */}
      <div className="UpcomingSessionBox">
        <div className="DashBoardHead">
          <h2>Upcoming Live Session</h2>
          <p>Don&apos;t miss out on your booked special events.</p>
        </div>
        
        <div className="LiveYoga">
          <div className="SessionsList">
            <div className="SessionCard">
              <div className="ThumbnailWrapper">
                <Image src={LiveImg1} alt="Advanced Vinyasa Flow" width={150} height={150} className="Thumbnail" />
              </div>

              <div className="SessionDetails">
                <div className="CardHeader">
                  <div className="TitleArea">
                    <span className="StatusBadge status-upcoming">
                      Upcoming • Starts in 2 Days
                    </span>
                    <h3 className="Title">Advanced Vinyasa Flow</h3>
                  </div>
                  
                  <div className="MoreMenuWrapper">
                    <MdMoreVert className="MoreIcon" />
                  </div>
                </div>

                <div className="InfoGrid">
                  <span className="InfoItem">
                    <MdEvent className="Icon" /> 25 Oct 2026
                  </span>
                  <span className="InfoItem">
                    <MdAccessTime className="Icon" /> 07:00 AM - 08:30 AM
                  </span>
                  <span className="InfoItem">
                    <FaChalkboardTeacher className="Icon" /> Sarah Jenkins
                  </span>
                </div>

                <div className="CardFooter">
                  <div className="FooterLeft">
                    <div className="BookingId">ID: #LS1024</div>
                  </div>
                  <div className="FooterRight">
                    <Link href="/live-stream" passHref>
                      <button className="ActionBtn primary live-btn">
                        <MdLiveTv style={{ marginRight: '6px' }} /> Join Live
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchased Courses */}
      <div className="EnrolldCourseBox">
        <div className="DashBoardHead">
          <h2>Purchased Courses</h2>
          <p>Access your complete library of courses.</p>
        </div>
        <div className="CourseGrid">
          {displayCourses.filter(Boolean).map((course, i) => (
            <div className="CourseItem" key={course?.id || i}>
              <CourseCard
                image={course?.staticImage || (course?.thumbnail ? `${MEDIA_BASE_URL}${course.thumbnail}` : null)}
                title={course?.title}
                lessons={course?.lessons_count}
                duration={(course?.duration || 0) + " hrs"}
                price={Number(course?.price || 0)}
                oldPrice={Number(course?.discount_price || 0)}
                rating="4.5" 
                students={course?.enrollments_count}
                instructorName={course?.instructor?.name}
                wishlistIcon={findWishlistIcon(course?.id, "course")}
                lessonsIcon={<FiBookOpen />}
                clockIcon={<FiClock />}
                priceIcon="₹"
                oldPriceIcon="₹"
                lessonsLabel="Lessons"
                ratingIcon={<AiFillStar />}
                userIcon={<FiUsers />}
                buttonText="Continue Learning"
                instructorImg={course?.instructor?.avatar ? `${MEDIA_BASE_URL}${course.instructor.avatar}` : null}
                instructorLabel={course?.instructor?.role}
                id={course?.id}
                type="course"
                slug={course?.slug}
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
