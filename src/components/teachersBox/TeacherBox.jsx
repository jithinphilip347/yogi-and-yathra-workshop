import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FaLinkedinIn, FaTwitter, FaInstagram } from "react-icons/fa";
import { BsArrowRight } from "react-icons/bs";
import TeacherBoxSkeleton from "./TeacherBoxSkeleton";
import "./TeacherBox.css";

const TeacherBox = ({ member, loading = false }) => {
  if (loading) {
    return <TeacherBoxSkeleton />;
  }

  return (
    <div className="card image-card">
      <div className="img-placeholder">
        <Image
          src={member?.img}
          alt={member?.name}
          fill
          style={{ objectFit: "cover" }}
          priority={member?.id <= 2}
        />
      </div>

      <div className="card-hover-info blue-card">
        <h3>{member?.name}</h3>
        <p className="role">{member?.role}</p>
        <p className="desc">{member?.desc}</p>
        <div className="social-links">
          <FaLinkedinIn /> <FaTwitter /> <FaInstagram />
        </div>
        <Link href="/teacher-list/teacher-details" className="learn-more">
          Learn More <BsArrowRight className="arrow-icon" />
        </Link>
      </div>
    </div>
  );
};

export default TeacherBox;
