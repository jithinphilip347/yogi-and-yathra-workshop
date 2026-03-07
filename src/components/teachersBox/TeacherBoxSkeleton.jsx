import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./TeacherBox.css";

const TeacherBoxSkeleton = () => {
  return (
    <div className="card image-card" style={{ padding: 0 }}>
      <Skeleton height={480} style={{ borderRadius: "24px" }} />
    </div>
  );
};

export default TeacherBoxSkeleton;
