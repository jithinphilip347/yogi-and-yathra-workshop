"use client";
import React from "react";
import CourseCard from "../coursebox/CourseCard";
import CourseImg1 from "../../assets/images/medi.jpg";
import UserImg from "../../assets/images/user.jpg";

const HomeCourse = () => {
  return (
    <div style={{ padding: "50px" }}>
      <CourseCard
        image={CourseImg1}
        title="Mindful Meditation for Beginners"
        lessons="25"
        duration="20 hrs"
        price="499"
        oldPrice="699"
        rating="4.9"
        students="320"
        instructorImg={UserImg}
        instructorName="Maya Krishna"
        onClick={() => console.log("Course Opened!")}
      />

    </div>
  );
};

export default HomeCourse;
