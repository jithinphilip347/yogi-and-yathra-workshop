"use client";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { FaRegPlayCircle, FaRegClock, FaRupeeSign, FaStar, FaUsers } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import CourseCard from "@/components/coursebox/CourseCard";
import useWishlist from "@/hooks/useWishlist";
import courseApi from "@/libs/courseApi";
import { resolveMediaUrl } from "@/utils/mediaUrl";

const Wishlist = () => {
  const wishlist = useSelector((state) => state.wishlist?.wishlist || []);
  const { findWishlistIcon } = useWishlist();
  const [visibleCourses, setVisibleCourses] = useState(8);
  const savedCourses = wishlist.filter((item) => item.type === "course");
  const savedIds = savedCourses.map((item) => item.id).filter(Boolean);
  const { data: catalogResponse, isLoading } = useQuery({
    queryKey: ["wishlist-published-courses", savedIds],
    queryFn: () => courseApi.all({ ids: savedIds.join(","), per_page: Math.max(savedIds.length, 1), page: 1 }),
    enabled: savedIds.length > 0,
    staleTime: 60_000,
  });
  const catalogCourses = catalogResponse?.data?.data || [];
  const courses = catalogCourses.map((course) => {
    const saved = savedCourses.find((item) => String(item.id) === String(course.id));
    return { ...saved, ...course, image: course.thumbnail || saved?.image };
  });

  return (
    <div id="Wishlist">
      <div className="container">
        <div className="WishlistHeader">
          <h2>My Wishlist</h2>
          <p>{courses.length} {courses.length === 1 ? "Course" : "Courses"} Saved</p>
        </div>
        {isLoading ? <div className="WishlistEmpty"><p>Loading saved courses…</p></div> : courses.length === 0 ? (
          <div className="WishlistEmpty">
            <FiHeart aria-hidden="true" />
            <h3>Your Wishlist is Empty</h3>
            <p>Courses you save will appear here. Start exploring and add your favorite courses.</p>
          </div>
        ) : (
          <>
            <div className="WishlistGrid">
              {courses.slice(0, visibleCourses).map((course) => (
                <CourseCard
                  key={`${course.type}-${course.id}`}
                  {...course}
                  image={course.image ? resolveMediaUrl(course.image) : "/images/course-placeholder.webp"}
                  rating={course.rating ?? 0}
                  students={course.students ?? 0}
                  lessons={course.lessons ?? 0}
                  duration={course.duration || "—"}
                  price={course.effective_price ?? course.price ?? 0}
                  oldPrice={course.original_price ?? course.oldPrice}
                  wishlistIcon={findWishlistIcon(course.id, course.type)}
                  lessonsLabel="Lessons"
                  lessonsIcon={<FaRegPlayCircle />}
                  clockIcon={<FaRegClock />}
                  priceIcon={<FaRupeeSign />}
                  ratingIcon={<FaStar />}
                  userIcon={<FaUsers />}
                  buttonText="View Course"
                  type="course"
                  slug={course.slug || "details"}
                />
              ))}
            </div>
            {visibleCourses < courses.length && (
              <div className="LoadMoreBox">
                <button onClick={() => setVisibleCourses((count) => count + 4)}>Load More Courses</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
