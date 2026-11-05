"use client";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { FiBookOpen, FiClock, FiUsers } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import CourseCard from "@/components/coursebox/CourseCard";
import useWishlist from "@/hooks/useWishlist";

const Wishlist = () => {
  const { wishlist, findWishlistIcon } = useWishlist();
  const [visibleCourses, setVisibleCourses] = useState(8);

  const loadMore = () => {
    setVisibleCourses((prev) => prev + 4);
  };

  return (
    <div id="Wishlist">
      <div className="container">
        <div className="WishlistHeader">
          <h2>My Wishlist</h2>
          <p>{wishlist?.length || 0} {wishlist?.length === 1 ? "Course" : "Courses"} Saved</p>
        </div>

        {!wishlist || wishlist.length === 0 ? (
          <div className="WishlistEmpty">
            <h3>Your Wishlist is Empty</h3>
            <p>
              Courses you save will appear here. Start exploring and add your
              favorite courses.
            </p>
            <div style={{ marginTop: "25px" }}>
              <Link
                href="/course"
                style={{
                  display: "inline-block",
                  padding: "10px 24px",
                  background: "var(--primaryColor, #874429)",
                  color: "#fff",
                  borderRadius: "25px",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "15px",
                  transition: "opacity 0.2s ease",
                }}
              >
                Explore Courses
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="WishlistGrid">
              {wishlist.slice(0, visibleCourses).map((course) => (
                <CourseCard
                  key={`${course.type || "course"}-${course.id}`}
                  id={course.id}
                  slug={course.slug || "course"}
                  type={course.type || "course"}
                  image={course.image}
                  title={course.title}
                  lessons={course.lessons}
                  duration={course.duration}
                  price={Number(course.price) || 0}
                  oldPrice={Number(course.oldPrice) || 0}
                  rating={course.rating ?? 0}
                  students={course.students}
                  instructorName={course.instructorName}
                  instructorImg={course.instructorImg}
                  instructorLabel={course.instructorLabel}
                  lessonsLabel="Lessons"
                  buttonText="View Details"
                  wishlistIcon={findWishlistIcon(course.id, course.type || "course")}
                  lessonsIcon={<FiBookOpen />}
                  clockIcon={<FiClock />}
                  priceIcon="₹"
                  oldPriceIcon="₹"
                  ratingIcon={<AiFillStar />}
                  userIcon={<FiUsers />}
                />
              ))}
            </div>

            {visibleCourses < wishlist.length && (
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
