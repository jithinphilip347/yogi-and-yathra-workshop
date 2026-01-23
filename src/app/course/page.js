"use client";
import React, { useState, useEffect, useRef } from "react";
import CourseCard from "../../components/coursebox/CourseCard";
import { MEDIA_BASE_URL } from "@/utils/constants";
import { FiUsers, FiClock, FiBookOpen, FiChevronDown, FiFilter } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import useCourse from "@/hooks/useCourse";
import useWishlist from "@/hooks/useWishlist";
import FilterBox from "@/components/filter/FilterBox";
import Breadcrumbs from "../../components/breadcrumbs/Breadcrumbs"; 
const Page = () => {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("");
  const [price, setPrice] = useState(500);
  const [sort, setSort] = useState("Newest");

  const categoryRef = useRef(null);
  const sortRef = useRef(null);
  const drawerRef = useRef(null);

  const breadcrumbItems = [

    { label: "Courses" },
  ];


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) setCategoryOpen(false);
      if (sortRef.current && !sortRef.current.contains(event.target)) setSortOpen(false);
      if (isDrawerOpen && drawerRef.current && !drawerRef.current.contains(event.target)) setIsDrawerOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDrawerOpen]);

  const queries = { sort, category, level, min_price: 0, max_price: price, order_by: "desc" };
  const { courseQuery } = useCourse({ queries });
  const { data, isLoading } = courseQuery;
  const courses = data?.data ?? [];
  const { findWishlistIcon } = useWishlist();

  return (
    <div id="CourseList">
        <div className="BreadCrumbsBox">
            <div className="container">
             <Breadcrumbs items={breadcrumbItems} />
            </div>
        </div>
      <div className="container">
        <div className="TopActions">
          <button className="MobileFilterBtn" onClick={() => setIsDrawerOpen(true)}>
            <FiFilter /> <span>Filter</span>
          </button>
          
          <div className="SortWrapper" ref={sortRef}>
            <span className="SortLabel">Sort by:</span>
            <div className="CustomDropdown" onClick={() => setSortOpen(!sortOpen)}>
              <span>{sort}</span>
              <FiChevronDown />
              {sortOpen && (
                <ul className="DropdownList">
                  {["Newest", "Price", "Rating"].map((item) => (
                    <li key={item} onClick={() => setSort(item)}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="CourseMain">
          {/* Desktop Filter */}
          <div className="DesktopFilterWrapper">
            <FilterBox
              category={category} setCategory={setCategory}
              categoryOpen={categoryOpen} setCategoryOpen={setCategoryOpen}
              categoryRef={categoryRef} level={level} setLevel={setLevel}
              price={price} setPrice={setPrice}
            />
          </div>

          {/* Mobile Filter Drawer */}
          {isDrawerOpen && (
            <div className="DrawerOverlay">
              <div ref={drawerRef} className="DrawerContent">
                <FilterBox 
                  isMobile={true} onClose={() => setIsDrawerOpen(false)}
                  category={category} setCategory={setCategory}
                  categoryOpen={categoryOpen} setCategoryOpen={setCategoryOpen}
                  categoryRef={categoryRef} level={level} setLevel={setLevel}
                  price={price} setPrice={setPrice}
                />
              </div>
            </div>
          )}

          <div className="ContentArea">
            <div className="CourseGrid">
              {isLoading ? (
                Array(8).fill({}).map((_, i) => <CourseCard key={i} loading={true} />)
              ) : courses.length > 0 ? (
                courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    loading={false}
                    image={course?.thumbnail ? `${MEDIA_BASE_URL}${course.thumbnail}` : null}
                    title={course?.title}
                    lessons={course?.lessons_count}
                    duration={`${course?.duration ?? 0} hrs`}
                    price={course?.price}
                    oldPrice={course?.discount_price}
                    rating="4.5"
                    students={course?.enrollments_count}
                    instructorName={course?.instructor?.name}
                    wishlistIcon={findWishlistIcon(course?.id, "course")}
                    lessonsIcon={<FiBookOpen />} clockIcon={<FiClock />} userIcon={<FiUsers />} ratingIcon={<AiFillStar />}
                    buttonText="View Details"
                    instructorImg={course?.instructor?.avatar ? `${MEDIA_BASE_URL}${course.instructor.avatar}` : null}
                    type="course"
                  />
                ))
              ) : (
                <div className="NoData">No courses found matching your filters.</div>
              )}
            </div>
            
            {!isLoading && courses.length > 0 && (
              <div className="LoadMoreWrapper">
                <button className="LoadMoreBtn">Load More Courses</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;