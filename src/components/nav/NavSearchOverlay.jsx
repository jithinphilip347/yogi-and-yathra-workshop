"use client";
import React from "react";
import Image from "next/image";
import { BiSearch } from "react-icons/bi";
import { MdClose } from "react-icons/md";
import courseImg1 from "../../assets/images/courseImg-1.jpg"; 

const NavSearchOverlay = ({ isOpen, onClose, searchQuery, setSearchQuery }) => {
  if (!isOpen) return null;

  const yogaSuggestions = [
    "Hatha Yoga for Beginners",
    "Morning Meditation Guide",
    "Pranayama Breathing Techniques",
    "Vinyasa Flow Advanced",
    "Stress Relief Meditation",
    "Yoga Anatomy and Alignment"
  ];

  return (
    <div className="NavSearchOverlay">
      <div className="SearchHeader">
        <div className="SearchInputWrapper">
          <BiSearch className="mainSearchIcon" />
          <input
            type="text"
            placeholder="Search for yoga or meditation courses..."
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="CloseBtn" onClick={onClose}>
          <MdClose />
        </button>
      </div>

      <div className="SearchContent container">
        {/* Recent Yoga & Meditation Suggestions */}
        <div className="SuggestionSection">
          {yogaSuggestions.map((text, index) => (
            <div className="SuggestItem" key={index} onClick={() => setSearchQuery(text)}>
              <BiSearch /> <p>{text}</p>
            </div>
          ))}
        </div>

        {/* Recommended Yoga Courses */}
        <div className="RecommendedSection">
          <h4>Recommended for You</h4>
          <div className="CourseList">
            <div className="SearchCourseBox">
              <div className="CourseImg">
                <Image src={courseImg1} alt="Yoga Course" />
              </div>
              <div className="CourseDetails">
                <h5>Mastering Mindfulness: 21 Days Meditation Challenge</h5>
                <p className="instructor">Course · Swami Satyananda, Meditation Expert</p>
              </div>
            </div>

            <div className="SearchCourseBox">
              <div className="CourseImg">
                <Image src={courseImg1} alt="Yoga Course" />
              </div>
              <div className="CourseDetails">
                <h5>The Art of Yoga: Complete Guide to Hatha & Vinyasa</h5>
                <p className="instructor">Course · Anjali Sharma, International Yoga Trainer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavSearchOverlay;