"use client";
import React, { useEffect, useState } from "react";
import { MEDIA_BASE_URL } from "@/utils/constants";
import CourseCard from "../../components/coursebox/CourseCard";
import { FiClock } from "react-icons/fi";
import { GoDotFill } from "react-icons/go";
import { MdDateRange } from "react-icons/md";
import useWishlist from "@/hooks/useWishlist";

const Page = ({ dailyClasses = [] }) => {
  const [loading, setLoading] = useState(true);
  const { findWishlistIcon } = useWishlist();

  useEffect(() => {
    setTimeout(() => setLoading(false), 2000);
  }, []);

  return (
    <div id="DailyLiveClass">
      <div className="container">
        <div className="DailyLiveClassMain">
          {loading ? (
            Array(6).fill({}).map((_, i) => (
              <CourseCard key={i} loading={true} />
            ))
          ) : dailyClasses?.length > 0 ? ( // Optional chaining added
            dailyClasses.map((course, i) => (
              <CourseCard
                key={course?.id ?? i}
                loading={loading}
                image={course?.thumbnail ? `${MEDIA_BASE_URL}${course.thumbnail}` : null}
                title={course?.title}
                wishlistIcon={findWishlistIcon(course?.id, "daily_class")}
                dateIcon={<MdDateRange />}
                time={course?.human_class_time}
                timeIcon={<FiClock />}
                dateFormat={course?.human_start_date}
                dotsIcon={<GoDotFill />}
                liveText="Live"
                buttonText="Join Now"
                instructorLabel="Instructor"
                instructorImg={
                  course?.instructor?.avatar
                    ? `${MEDIA_BASE_URL}${course.instructor.avatar}`
                    : null
                }
                instructorName={course?.instructor?.name}
                tutorImageSize="medium"
                id={course?.id}
                type="daily_class"
              />
            ))
          ) : (
            <div className="NoData">No live classes available right now.</div>
          )}
        </div>

        {/* Optional chaining added here too */}
        {!loading && dailyClasses?.length > 0 && (
          <div className="LoadMoreContainer">
            <button className="LoadMoreBtn">Load More</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;