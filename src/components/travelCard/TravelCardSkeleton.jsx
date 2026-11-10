"use client";
import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./TravelCard.css";

const TravelCardSkeleton = () => {
  return (
    <SkeletonTheme baseColor="#edf2f7" highlightColor="#f7fafc">
      <div
        className="travelCard travelCardSkeleton"
        aria-busy="true"
        aria-label="Loading travel retreat card"
      >
        {/* Top Thumbnail Section Skeleton */}
        <div className="travelImgWrapper skeletonImgWrapper">
          <Skeleton
            height="100%"
            containerClassName="skeletonFillContainer"
            className="skeletonFillItem"
          />

          {/* Top-Left Category Badge */}
          <div className="travelCategoryBadge skeletonBadgeOverlay">
            <Skeleton width={88} height={12} borderRadius={20} />
          </div>

          {/* Top-Right Booking Status */}
          <div className="travelStatusBadge skeletonStatusOverlay">
            <Skeleton width={82} height={12} borderRadius={20} />
          </div>

          {/* Bottom-Left Duration Pill */}
          <div className="travelDurationPill skeletonDurationOverlay">
            <Skeleton width={96} height={12} borderRadius={20} />
          </div>

          {/* Center Video Play Button */}
          <div className="travelPlayBtn skeletonPlayOverlay">
            <Skeleton circle width={24} height={24} />
          </div>
        </div>

        {/* Content Body Skeleton */}
        <div className="travelContent">
          {/* Destination & Date Row */}
          <div className="travelMetaHeader skeletonMetaBox">
            <div className="travelDestination destinationPill skeletonPillWrapper">
              <Skeleton width={110} height={12} borderRadius={4} />
            </div>
            <div className="travelDates datePill skeletonPillWrapper">
              <Skeleton width={75} height={12} borderRadius={4} />
            </div>
          </div>

          {/* Title */}
          <div className="travelTitle skeletonTitleBox">
            <Skeleton height={18} width="92%" borderRadius={4} />
            <Skeleton
              height={18}
              width="68%"
              borderRadius={4}
              style={{ marginTop: 6 }}
            />
          </div>

          {/* Description */}
          <div className="travelDescription travelDesc skeletonDescBox">
            <Skeleton height={12} width="100%" borderRadius={3} />
            <Skeleton
              height={12}
              width="82%"
              borderRadius={3}
              style={{ marginTop: 5 }}
            />
          </div>

          {/* Slot Availability Info Box */}
          <div className="travelSlotBox skeletonSlotBox">
            <div className="slotLabels">
              <Skeleton width={95} height={13} borderRadius={3} />
              <Skeleton width={80} height={13} borderRadius={3} />
            </div>
          </div>

          {/* Bottom Bar: Price & CTA Button */}
          <div className="travelBottomBox skeletonBottomBox">
            <div className="travelPriceBox">
              <Skeleton width={56} height={10} borderRadius={3} style={{ marginBottom: 4 }} />
              <Skeleton width={110} height={22} borderRadius={4} />
            </div>

            <div className="travelViewBtn skeletonBtnWrapper">
              <Skeleton width={138} height={38} borderRadius={24} />
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
};

export default TravelCardSkeleton;

