"use client";

import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { MEDIA_BASE_URL } from '@/utils/constants';

export default function OverviewTab({ course, currentLesson }) {
  if (!course) return null;

  const instructorAvatar = course.instructor?.avatar
    ? (course.instructor.avatar.startsWith('http')
        ? course.instructor.avatar
        : `${MEDIA_BASE_URL.replace(/\/+$/, '')}/${course.instructor.avatar.replace(/^\/+/, '')}`)
    : '/images/avatar-placeholder.webp';

  return (
    <div className="OverviewTab">
      {/* Current Lesson Description */}
      {currentLesson && (
        <div className="SectionBlock">
          <h4>About This Lesson: {currentLesson.title}</h4>
          <p>
            {currentLesson.short_description ||
              currentLesson.description ||
              `In this lesson, you will explore step-by-step guidance on ${currentLesson.title}. Practice along with the video to master key techniques.`}
          </p>
        </div>
      )}

      {/* Course Description */}
      <div className="SectionBlock">
        <h4>About The Course</h4>
        <p>{course.description || course.short_description || "Welcome to this comprehensive workshop course."}</p>
      </div>

      {/* Learning Outcomes */}
      {Array.isArray(course.learning_outcomes) && course.learning_outcomes.length > 0 && (
        <div className="SectionBlock">
          <h4>What You&apos;ll Learn</h4>
          <ul className="OutcomesList">
            {course.learning_outcomes.map((outcome, idx) => (
              <li key={idx}>
                <FiCheckCircle className="CheckIcon" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructor Section */}
      {course.instructor && (
        <div className="SectionBlock">
          <h4>Your Instructor</h4>
          <div className="InstructorCard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={instructorAvatar}
              alt={course.instructor.name}
              className="Avatar"
            />
            <div className="Info">
              <h5>{course.instructor.name}</h5>
              <p>{course.instructor.bio || "Certified Yoga & Wellness Master Instructor"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
