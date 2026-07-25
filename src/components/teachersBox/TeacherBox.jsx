"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FaXTwitter, FaInstagram } from "react-icons/fa6";
import "./TeacherBox.css";
const TeacherBox = ({
  image,
  name,
  position,
  twitter,
  instagram,
  profileLink,
  loading = false,
}) => {

  

  if (loading) {
    return (
      <div className="TeacherBox skeleton">
        <div className="TeacherImage skeleton-img"></div>

        <div className="TeacherContent">
          <div className="TeacherInfo">
            <div className="skeleton-text name"></div>
            <div className="skeleton-text role"></div>
          </div>

          <div className="TeacherSocial">
            <div className="skeleton-icon"></div>
            <div className="skeleton-icon"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    
    <div className="TeacherBox">
      <div className="TeacherImage">
        <Image src={image} alt={name} fill className="img" />
      </div>

      <div className="TeacherContent">
        <div className="TeacherInfo">
          <h4>{name}</h4>
          <p>{position}</p>
        </div>

        <div className="TeacherSocial">
          {twitter && (
            <Link href={twitter}>
              <FaXTwitter />
            </Link>
          )}

          {instagram && (
            <Link href={instagram}>
              <FaInstagram />
            </Link>
          )}
        </div>
      </div>

      <Link href={profileLink} className="TeacherOverlay"></Link>
    </div>
  );
};

export default TeacherBox;