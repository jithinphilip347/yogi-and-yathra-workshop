"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Team1 from "../../assets/images/team-1.webp";
import Team2 from "../../assets/images/team-2.webp";
import Team3 from "../../assets/images/team-3.webp";
import Team4 from "../../assets/images/instructor-1.webp";
import TeacherBox from "../teachersBox/TeacherBox";

const HomeTeacher = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  const teamMembers = [
    {
      id: 1,
      name: "Alice Johnson",
      role: "CEO & Founder",
      desc: "Alice has over 15 years of experience in strategic leadership and business development.",
      img: Team1,
    },
    {
      id: 2,
      name: "Carter Botosh",
      role: "Chief Financial Officer",
      desc: "Carter specializes in comprehensive financial strategy and corporate operations.",
      img: Team2,
    },
    {
      id: 3,
      name: "Phillip Ekstrom",
      role: "Head of Technology",
      desc: "Phillip drives our technological vision with cutting-edge innovations and execution.",
      img: Team3,
    },
    {
      id: 4,
      name: "Abram Culhane",
      role: "Lead Developer",
      desc: "Abram leads the development teams with a constant focus on code quality.",
      img: Team4,
    },
  ];

  return (
    <section id="HomeTeacher">
      <div className="container">
        <div className="HomeTeacherHeader">
          <div className="title-area">
            <span className="badge">EXPERTISE</span>
            <h2>
              Explore our comprehensive <br /> service offerings
            </h2>
          </div>

          <div className="nav-buttons">
            <Link href="/teacher-list" className="viewAllBtn">
              View All
            </Link>
          </div>
        </div>

        <div className="HomeTeacherMain">
          <div className="TeacherGrid">
            {loading
              ? // Show skeleton cards when loading
                Array(4)
                  .fill()
                  .map((_, index) => (
                    <TeacherBox key={`skeleton-${index}`} loading={true} />
                  ))
              : // Show actual cards when loaded
                teamMembers.map((member) => (
                  <TeacherBox key={member.id} member={member} loading={false} />
                ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeTeacher;
