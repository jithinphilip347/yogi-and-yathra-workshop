"use client";
import React, { useEffect, useState } from "react";
import TeacherBox from "../teachersBox/TeacherBox";

import Team1 from "../../assets/images/team-1.webp";
import Team2 from "../../assets/images/team-2.webp";
import Team3 from "../../assets/images/team-3.webp";
import Team4 from "../../assets/images/instructor-1.webp";
import Link from "next/link";

const HomeTeacher = () => {
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setTeamMembers([
        {
          id: 1,
          name: "Alice Johnson",
          role: "CEO & Founder",
          img: Team1,
          twitter: "#",
          instagram: "#",
          link: "/teacher-list/teacher-details",
        },
        {
          id: 2,
          name: "Carter Botosh",
          role: "Chief Financial Officer",
          img: Team2,
          twitter: "#",
          instagram: "#",
          link: "/teacher-list/teacher-details",
        },
        {
          id: 3,
          name: "Phillip Ekstrom",
          role: "Head of Technology",
          img: Team3,
          twitter: "#",
          instagram: "#",
          link: "/teacher-list/teacher-details",
        },
        {
          id: 4,
          name: "Abram Culhane",
          role: "Lead Developer",
          img: Team4,
          twitter: "#",
          instagram: "#",
          link: "/teacher-list/teacher-details",
        },
      ]);

      setLoading(false);
    }, 1500);
  }, []);

  return (
    <div id="HomeTeacher">
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
              ? Array(4)
                  .fill(0)
                  .map((_, i) => <TeacherBox key={i} loading />)
              : teamMembers
                  .slice(0, 4)
                  .map((member) => (
                    <TeacherBox
                      key={member.id}
                      image={member.img}
                      name={member.name}
                      position={member.role}
                      twitter={member.twitter}
                      instagram={member.instagram}
                      profileLink={member.link}
                    />
                  ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeTeacher;
