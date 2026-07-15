"use client";
import React, { useState, useEffect } from "react";
import Team1 from "../../assets/images/team-1.webp";
import Team2 from "../../assets/images/team-2.webp";
import Team3 from "../../assets/images/team-3.webp";
import Team4 from "../../assets/images/instructor-1.webp";
import TeacherBox from "../../components/teachersBox/TeacherBox";

const teacherData = [
  ...Array.from({ length: 12 }).map((_, i) => ({
    id: i + 1,
    name: [
      "Alice Johnson",
      "Carter Botosh",
      "Phillip Ekstrom",
      "Abram Culhane",
      "Eleanor Pena",
      "Darrell Steward",
      "Wade Warren",
      "Bessie Cooper",
      "Courtney Henry",
      "Cody Fisher",
      "Ralph Edwards",
      "Theresa Webb",
    ][i],
    role: [
      "CEO & Founder",
      "Chief Financial Officer",
      "Head of Technology",
      "Lead Developer",
      "Marketing Head",
      "UI/UX Designer",
      "Product Manager",
      "HR Manager",
      "Software Engineer",
      "QA Engineer",
      "DevOps Engineer",
      "Content Writer",
    ][i],
    img: [
      Team1,
      Team2,
      Team3,
      Team4,
      Team1,
      Team2,
      Team3,
      Team4,
      Team1,
      Team2,
      Team3,
      Team4,
    ][i],
    twitter: "#",
    instagram: "#",
    link: "/teacher-list/teacher-details",
  })),
];

const Page = () => {
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 4);
  };

  return (
    <div id="TeacherList">
      <div className="container">
        <div className="TeacherListHeader">
          <h2>Our Instructors</h2>
          <p>
            Discover our team of experienced and dedicated professionals
            committed to your success. <br /> Learn from the best in the
            industry.
          </p>
        </div>

        <div className="TeacherListMain">
          <div className="TeacherGrid">
            {loading
              ? Array(8)
                  .fill(0)
                  .map((_, i) => <TeacherBox key={i} loading={true} />)
              : teacherData
                  .slice(0, visibleCount)
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

          {visibleCount < teacherData.length && !loading && (
            <div className="loadMoreContainer">
              <button onClick={handleLoadMore} className="loadMoreBtn">
                Load More Teachers
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
