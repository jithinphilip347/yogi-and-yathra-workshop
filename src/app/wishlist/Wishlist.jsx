"use client";
import React, { useState } from "react";
import {
  FaRegPlayCircle,
  FaRegClock,
  FaRupeeSign,
  FaStar,
  FaUsers,
} from "react-icons/fa";
import CourseCard from "@/components/coursebox/CourseCard";
import course1 from "../../assets/images/courseImg-1.webp";
import course2 from "../../assets/images/courseImg-2.webp";

const Wishlist = () => {
  const courses = [
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
    {
      id: 3,
      title: "Meditation Masterclass",
      image: course1,
      lessons: "20",
      duration: "10h",
      price: "1,800",
      oldPrice: "3,000",
      rating: "4.7",
      students: "1.2k",
    },
    {
      id: 4,
      title: "Yoga For Beginners",
      image: course2,
      lessons: "15",
      duration: "8h",
      price: "1,200",
      oldPrice: "2,500",
      rating: "4.6",
      students: "900",
    },
    {
      id: 5,
      title: "Power Yoga Training",
      image: course1,
      lessons: "40",
      duration: "25h",
      price: "3,500",
      oldPrice: "5,000",
      rating: "4.8",
      students: "1.9k",
    },
    {
      id: 6,
      title: "Mindfulness Meditation",
      image: course2,
      lessons: "22",
      duration: "12h",
      price: "2,000",
      oldPrice: "3,200",
      rating: "4.9",
      students: "1.5k",
    },
    {
      id: 7,
      title: "Advanced Vinyasa Yoga",
      image: course1,
      lessons: "35",
      duration: "18h",
      price: "2,900",
      oldPrice: "4,500",
      rating: "4.7",
      students: "1.3k",
    },
    {
      id: 8,
      title: "Yoga Flexibility Training",
      image: course2,
      lessons: "30",
      duration: "16h",
      price: "2,400",
      oldPrice: "3,900",
      rating: "4.8",
      students: "1.6k",
    },
    {
      id: 9,
      title: "Breathing Techniques",
      image: course1,
      lessons: "12",
      duration: "5h",
      price: "900",
      oldPrice: "1,500",
      rating: "4.6",
      students: "600",
    },
  ];

  const [visibleCourses, setVisibleCourses] = useState(8);

  const loadMore = () => {
    setVisibleCourses((prev) => prev + 4);
  };

  return (
    <div id="Wishlist">
      <div className="container">
        <div className="WishlistHeader">
          <h2>My Wishlist</h2>

          <p>{courses.length} Courses Saved</p>
        </div>

        {courses.length === 0 ? (
          <div className="WishlistEmpty">
            <h3>Your Wishlist is Empty</h3>

            <p>
              Courses you save will appear here. Start exploring and add your
              favorite courses.
            </p>
          </div>
        ) : (
          <>
            <div className="WishlistGrid">
              {courses.slice(0, visibleCourses).map((course) => (
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

            {visibleCourses < courses.length && (
              <div className="LoadMoreBox">
                <button onClick={loadMore}>Load More Courses</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
