"use client";
import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./EventCard.css";

const EventCardSkeleton = () => {
  return (
    <SkeletonTheme baseColor="#edf2f7" highlightColor="#f7fafc">
      <div
        className="eventCard horizontalEventCard eventCardSkeleton"
        aria-busy="true"
        aria-label="Loading event card"
      >
        {/* Left: Thumbnail & Badges Skeleton */}
        <div className="eventImgWrapper skeletonImgWrapper">
          <Skeleton
            height="100%"
            containerClassName="skeletonFillContainer"
            className="skeletonFillItem"
          />

          {/* Category Badge Placeholder */}
          <div className="eventCategoryBadge skeletonBadgeOverlay">
            <Skeleton width={90} height={12} borderRadius={20} />
          </div>

          {/* Center Play Button Overlay */}
          <div className="eventPlayBtn skeletonPlayOverlay">
            <Skeleton circle width={24} height={24} />
          </div>
        </div>

        {/* Right: Content Area Skeleton */}
        <div className="eventContent">
          {/* 1. Header: Schedule Pill + Status Badge */}
          <div className="eventMetaHeader">
            <div className="eventSchedulePill skeletonPillWrapper">
              <Skeleton width={145} height={14} borderRadius={20} />
            </div>

            <div className="eventStatusBadge skeletonStatusWrapper">
              <Skeleton width={85} height={14} borderRadius={20} />
            </div>
          </div>

          {/* 2. Event Title */}
          <div className="eventTitle skeletonTitleBox">
            <Skeleton height={18} width="88%" borderRadius={4} />
            <Skeleton
              height={18}
              width="60%"
              borderRadius={4}
              style={{ marginTop: 6 }}
            />
          </div>

          {/* 3. Venue & Location */}
          <div className="eventVenueRow skeletonVenueBox">
            <Skeleton width={14} height={14} circle style={{ marginRight: 6 }} />
            <Skeleton width="55%" height={13} borderRadius={4} />
          </div>

          {/* 4. Event Perks / Tags */}
          <div className="eventTagsRow skeletonTagsBox">
            <Skeleton width={80} height={22} borderRadius={20} />
            <Skeleton width={90} height={22} borderRadius={20} />
            <Skeleton width={82} height={22} borderRadius={20} />
          </div>

          {/* 5. Bottom Ticket Bar: Price & Book Button */}
          <div className="eventBottomBox skeletonBottomBox">
            <div className="eventPriceBox">
              <Skeleton width={52} height={10} borderRadius={3} style={{ marginBottom: 4 }} />
              <Skeleton width={100} height={22} borderRadius={4} />
            </div>

            <div className="eventViewBtn skeletonBtnWrapper">
              <Skeleton width={135} height={38} borderRadius={24} />
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
};

export default EventCardSkeleton;

