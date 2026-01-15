
import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./CourseCard.css";

const CourseCardSkeleton = () => {
  return (
    <>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 5",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <Skeleton circle width={32} height={32} />
        </div>
      </div>

      {/* Title */}
      <Skeleton height={18} width="80%" style={{ marginTop: 12 }} />

      {/* Lessons + Duration icons */}
      <div className="courseMeta" style={{ marginTop: 10 }}>
        <span>
          <Skeleton circle width={14} height={14} />
          <Skeleton width={50} height={12} />
        </span>
        <span>
          <Skeleton circle width={14} height={14} />
          <Skeleton width={45} height={12} />
        </span>
      </div>

      {/* Price + Rating icons */}
      <div className="Priceratebox" style={{ marginTop: 12 }}>
        <div className="priceBox">
          <Skeleton width={50} height={18} />
          <Skeleton width={40} height={14} />
        </div>

        <div className="rating">
          <Skeleton circle width={14} height={14} />
          <Skeleton width={20} height={12} />

          <Skeleton circle width={14} height={14} />
          <Skeleton width={30} height={12} />
        </div>
      </div>

      {/* Instructor */}
      <div className="TutorBtnBox" style={{ marginTop: 18 }}>
        <div className="TutorBox">
          <Skeleton circle width={28} height={28} />
          <div>
            <Skeleton width={60} height={10} />
            <Skeleton width={80} height={12} />
          </div>
        </div>

        {/* Button */}
        <Skeleton height={38} width={110} borderRadius={8} />
      </div>
    </>
  );
};

export default CourseCardSkeleton;
