import React from "react";
import CourseCard from "@/components/coursebox/CourseCard";
import { FaHeart } from "react-icons/fa";
import { FiBookOpen, FiClock, FiUsers } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import { MEDIA_BASE_URL } from "@/utils/constants";
import useWishlist from "@/hooks/useWishlist";

const MyCourses = ({ courses = [] }) => {
  const { findWishlistIcon } = useWishlist();
  return (
    <div className="MyCourseBox">
      <div className="DashBoardHead">
        <h2>Purchased Courses</h2>
        <p>Manage and continue your learning journey.</p>
      </div>

      <div className="CourseGrid">
        {courses?.map((course, i) => (
          <div className="CourseItem" key={i}>
            <CourseCard
                  image={
                    course.thumbnail
                      ? `${MEDIA_BASE_URL}${course.thumbnail}`
                      : null
                  }
                  title={course.title}
                  lessons={course?.lessons_count}
                  duration={(course.duration || 0) + " hrs"}
                  price={Number(course.price)}
                  oldPrice={Number(course.discount_price)}
                  rating="4.5" 
                  students={course.enrollments_count}
                  instructorName={course?.instructor?.name}
                  wishlistIcon={findWishlistIcon(course.id, "course")}
                  lessonsIcon={<FiBookOpen />}
                  clockIcon={<FiClock />}
                  priceIcon="₹"
                  oldPriceIcon="₹"
                  lessonsLabel="Lessons"
                  ratingIcon={<AiFillStar />}
                  userIcon={<FiUsers />}
                  buttonText="View Details"
                  instructorImg={
                    course?.instructor?.avatar
                      ? `${MEDIA_BASE_URL}${course.instructor.avatar}`
                      : null
                  }
                  instructorLabel={course?.instructor?.role}
                  id={course.id}
                  type="course"
                />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyCourses;
