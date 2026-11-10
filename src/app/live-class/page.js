"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import CourseCard from "../../components/coursebox/CourseCard";
import { FiClock } from "react-icons/fi";
import { GoDotFill } from "react-icons/go";
import { MdDateRange } from "react-icons/md";
import useWishlist from "@/hooks/useWishlist";
import { fetchDailyClasses } from "@/libs/course";




const Page = () => {
  const [visibleCount, setVisibleCount] = useState(6);
  const loadMoreRef = useRef(null);
  const loadMoreLockRef = useRef(false);
  const { findWishlistIcon } = useWishlist();
  const { data: dailyClasses = [], isLoading, refetch } = useQuery({
    queryKey: ["public-daily-classes-catalog"],
    queryFn: fetchDailyClasses,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });
  const hasMore = visibleCount < dailyClasses.length;
  const loadMore = useCallback(() => {
    if (!hasMore || loadMoreLockRef.current) return;
    loadMoreLockRef.current = true;
    setVisibleCount((count) => Math.min(count + 6, dailyClasses.length));
  }, [dailyClasses.length, hasMore]);

  useEffect(() => {
    loadMoreLockRef.current = false;
  }, [visibleCount]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (typeof IntersectionObserver === "undefined" || !sentinel || !hasMore) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "500px 0px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);
 

  return (
    <div id="DailyLiveClass">
      <div className="container">
        <div className="DailyLiveClassMain">
          {isLoading ? (
            Array(6).fill({}).map((_, i) => (
              <CourseCard key={i} loading={true} />
            ))
          ) : dailyClasses?.length > 0 ? ( // Optional chaining added
            dailyClasses.slice(0, visibleCount).map((course, i) => (
              <CourseCard
                key={course?.id ?? i}
                loading={false}
                image={course?.thumbnail ? resolveMediaUrl(course.thumbnail) : null}
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
                  course?.instructor?.avatar_url || course?.instructor?.avatar
                    ? resolveMediaUrl(course.instructor.avatar_url || course.instructor.avatar)
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

        {hasMore && (
          <div className="LoadMoreWrapper">
            <div ref={loadMoreRef} className="LoadMoreSentinel" aria-hidden="true" />
            <button
              type="button"
              className="LoadMoreBtn"
              onClick={loadMore}
            >
              Load More Classes
            </button>
            <span role="status" aria-live="polite">
              Showing {Math.min(visibleCount, dailyClasses.length)} of {dailyClasses.length} classes
            </span>
          </div>
        )}
        {!isLoading && !dailyClasses?.length && (
          <button type="button" className="LoadMoreBtn" onClick={() => refetch()}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default Page;
