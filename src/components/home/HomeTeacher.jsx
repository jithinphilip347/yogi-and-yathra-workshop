"use client";
import React, { useEffect, useState } from "react";
import TeacherBox from "../teachersBox/TeacherBox";
import Link from "next/link";
import { fetchFeaturedInstructors } from "@/libs/course";
import { MEDIA_BASE_URL } from "@/utils/constants";

const HomeTeacher = () => {
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState([]);

  useEffect(() => {
    const loadInstructors = async () => {
      try {
        const res = await fetchFeaturedInstructors();
        const data = res?.data || [];
        setInstructors(
          data.map((inst) => ({
            id: inst.id,
            name: inst.name,
            role: inst.professional_title || "Instructor",
            img: inst.avatar_url
              ? MEDIA_BASE_URL + inst.avatar_url
              : "/images/placeholder-avatar.jpg",
            twitter: inst.linkdin ? "#" : undefined,
            instagram: inst.instagram ? "#" : undefined,
            link: `/teacher-list/${inst.slug || inst.id}`,
          }))
        );
      } catch (err) {
        console.error("Failed to load featured instructors:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInstructors();
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
              : instructors
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
