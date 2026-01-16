"use client";

import React, { useEffect, useState } from "react";
import UserProfileImg from "../../../assets/images/user-img.jpg";
import CourseImg1 from "../../../assets/images/courseImg-1.jpg";
import CourseImg2 from "../../../assets/images/courseImg-2.jpg";
import CourseImg3 from "../../../assets/images/courseImg-3.jpg";

import User1 from "../../../assets/images/instructor-1.jpg";
import User2 from "../../../assets/images/instructor-2.jpg";
import User3 from "../../../assets/images/instructor-3.jpg";

import { FiUsers } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import { FiClock, FiBookOpen } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";

import ProfileSidebar from "@/components/profile/ProfileSidebar";
import Dashboard from "@/components/profile/Dashboard";
import EditProfile from "@/components/profile/EditProfile";
import MyCourses from "@/components/profile/MyCourses";
import LiveClasses from "@/components/profile/LiveClasses";
import Events from "@/components/profile/Events";
import Settings from "@/components/profile/Settings";
import HelpSupport from "@/components/profile/HelpSupport";
import { useSelector } from "react-redux";
import { MEDIA_BASE_URL } from "@/utils/constants";
import useCourse from "@/hooks/useCourse";

const courses = [
  {
    image: CourseImg1,
    wishlistIcon: <FaHeart />,
    lessonsIcon: <FiBookOpen />,
    clockIcon: <FiClock />,
    priceIcon: "₹",
    oldPriceIcon: "₹",
    lessonsLabel: "Lessons",
    ratingIcon: <AiFillStar />,
    userIcon: <FiUsers />,
    buttonText: "Enrolled",
    instructorLabel: "Instructor",
    title: "Mindful Meditation for Beginners",
    lessons: "25",
    duration: "20 hrs",
    price: "499",
    oldPrice: "899",
    rating: "4.9",
    students: "780",
    instructorImg: User3,
    instructorName: "Maya Krishna",
  },
  {
    image: CourseImg2,
    wishlistIcon: <FaHeart />,
    lessonsIcon: <FiBookOpen />,
    clockIcon: <FiClock />,
    priceIcon: "₹",
    oldPriceIcon: "₹",
    lessonsLabel: "Lessons",
    ratingIcon: <AiFillStar />,
    userIcon: <FiUsers />,
    buttonText: "Enrolled",
    instructorLabel: "Instructor",

    title: "Full-Body Yoga Masterclass",
    lessons: "35",
    duration: "45 hrs",
    price: "899",
    oldPrice: "1299",
    rating: "4.8",
    students: "1260",
    instructorImg: User2,
    instructorName: "Anil Dev",
  },
  {
    image: CourseImg3,
    wishlistIcon: <FaHeart />,
    lessonsIcon: <FiBookOpen />,
    clockIcon: <FiClock />,
    priceIcon: "₹",
    oldPriceIcon: "₹",
    lessonsLabel: "Lessons",
    ratingIcon: <AiFillStar />,
    userIcon: <FiUsers />,
    buttonText: "Enrolled",
    instructorLabel: "Instructor",

    title: "Breathwork Healingy",
    lessons: "18",
    duration: "16 hrs",
    price: "699",
    oldPrice: "999",
    rating: "4.7",
    students: "640",
    instructorImg: User1,
    instructorName: "Akhil ",
  },
];

const continueCourses = [
  {
    image: CourseImg1,
    title: "Mindful Meditation for Beginners",
    instructorImg: User3,
    instructorName: "Maya Krishna",
    progress: 65,
  },
  {
    image: CourseImg2,
    title: "Full-Body Yoga Masterclass",
    instructorImg: User2,
    instructorName: "Anil Dev",
    progress: 40,
  },
];

const upcomingEvents = [
  {
    date: "Feb 15, 2026",
    time: "7:00am - 8:30am",
    type: "Live Session",
    title: "Sunrise Vinyasa Flow: Awakening the Spirit",
    buttonText: "Join Now",
  },
  {
    date: "Feb 22, 2026",
    time: "6:00pm - 7:30pm",
    type: "Workshop",
    title: "Deep Sleep Meditation & Yoga Nidra Workshop",
    buttonText: "Book Spot",
  },
  {
    date: "Mar 05, 2026",
    time: "10:00am - 12:00pm",
    type: "Announcement",
    title: "New Course Release: Ayurvedic Nutrition Fundamentals",
    buttonText: "View Details",
  },
  {
    date: "Mar 12, 2026",
    time: "9:00am - 10:30am",
    type: "Community Event",
    title: "International Yoga Day Preparation Meeting",
    buttonText: "RSVP",
  },
];

const Profile = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [profileImg, setProfileImg] = useState(UserProfileImg);
  const { user } = useSelector(state => state.auth)

  useEffect(() => {
    if (user?.avatar) {
      setProfileImg(user.avatar)
    }
  },[user])

  const { enrollmentsQuery } = useCourse({});
  const { data: data, isLoading, error } = enrollmentsQuery;
  const enrollments = data?.data.courses;

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return (
          <Dashboard
            courses={enrollments?.map((course) => course.course)}
            continueCourses={continueCourses}
            upcomingEvents={upcomingEvents}
            user={user}
          />
        );
      case "Edit Profile":
        return (
          <EditProfile profileImg={profileImg} setProfileImg={setProfileImg} user={user} />
        );
      case "My Courses":
        return <MyCourses courses={enrollments.map((course) => course.course)} />;
      case "Live Classes":
        return <LiveClasses />;
      case "Events":
        return <Events upcomingEvents={upcomingEvents} />;
      case "Settings":
        return <Settings />;
      case "Help & Support":
        return <HelpSupport />;
      default:
        return <div>Select an option from the menu</div>;
    }
  };

  return (
    <div id="Profile">
      <div className="container">
        <div className="ProfileMain">
          <ProfileSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            profileImg={profileImg}
            user={user}
            setProfileImg={setProfileImg}
          />

          <div className="ProfileMainRight">
            <div className="ContentCard">{renderContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
