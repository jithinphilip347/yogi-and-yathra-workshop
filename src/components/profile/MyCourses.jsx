import React from "react";
import CourseCard from "@/components/coursebox/CourseCard";

const MyCourses = ({ courses }) => {
  return (
    <div className="MyCourseBox">
      <div className="DashBoardHead">
        <h2>Purchased Courses</h2>
        <p>Manage and continue your learning journey.</p>
      </div>

      <div className="CourseGrid">
        {courses.map((course, i) => (
          <div className="CourseItem" key={i}>
            <CourseCard {...course} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyCourses;
