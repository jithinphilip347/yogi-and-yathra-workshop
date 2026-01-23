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
import { fetchCategories } from "@/libs/course";

const Page = () => {
  const [categories, setCategories] = useState([]);
  
  useEffect(() => {
    fetchCategories().then((data) => {
      setCategories(data || []);
    });
  }, []);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("");
  const [price, setPrice] = useState(5000);
  const [sort, setSort] = useState("Newest");
  const [sortValue, setSortValue] = useState("created_at");
  const [page, setPage] = useState(1);
  const [coursesList, setCoursesList] = useState([]);

  const handleSortChange = (item) => {
    const sorts = {
      "Newest": "created_at",
      "Price": "price",
      "Rating": "rating"
    }
    setSort(item)
    setSortValue(sorts[item])
    setSortOpen(false);
    setPage(1);
    setCoursesList([]);
  };



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

  useEffect(() => {
    setPage(1);
    setCoursesList([]);
    // console.log(category, level, price);
  }, [category, level, price]);

  const queries = { 
    sort: sortValue, 
    category_id: category, 
    level, 
    min_price: 0, 
    max_price: price, 
    order_by: "desc", 
    per_page: 12, 
    page 
  };

  const { courseQuery } = useCourse({ queries });
  const { data, isLoading, isFetching } = courseQuery;
  
  

  
  useEffect(() => {
    if (data?.data?.data) {
      if (page === 1) {
        setCoursesList(data.data.data);
      } else {
        setCoursesList(prev => [...prev, ...data.data.data]);
      }
    }
  }, [data, page]);

  const { findWishlistIcon } = useWishlist();

  const hasMore = data?.data?.next_page_url !== null;

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
                    <li key={item} onClick={() => handleSortChange(item)}>{item}</li>
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
              categories={categories}
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
                  categories={categories}
                />
              </div>
            </div>
          )}

          <div className="ContentArea">
            <div className="CourseGrid">
              {isLoading && page === 1 ? (
                Array(8).fill({}).map((_, i) => <CourseCard key={i} loading={true} />)
              ) : coursesList.length > 0 ? (
                coursesList.map((course) => (
                  <CourseCard
                    key={course.id}
                    loading={false}
                    image={course?.thumbnail ? `${MEDIA_BASE_URL}${course.thumbnail}` : "/images/course-placeholder.jpg"}
                    title={course?.title}
                    lessons={course?.lessons_count}
                    duration={`${course?.duration ?? 0} hrs`}
                    price={course?.discount_price}
                    oldPrice={course?.price}
                    rating="4.5"
                    students={course?.enrollments_count}
                    instructorName={course?.instructor?.name}
                    wishlistIcon={findWishlistIcon(course?.id, "course")}
                    lessonsIcon={<FiBookOpen />} clockIcon={<FiClock />} userIcon={<FiUsers />} ratingIcon={<AiFillStar />}
                    buttonText="View Details"
                    instructorImg={course?.instructor?.avatar ? `${MEDIA_BASE_URL}${course.instructor.avatar}` : null}
                    type="course"
                    instructorLabel={course?.instructor?.role}
                    id={course?.id}
                  />
                ))
              ) : (
                !isLoading && <div className="NoData">No courses found matching your filters.</div>
              )}
              {isFetching && page > 1 && Array(4).fill({}).map((_, i) => <CourseCard key={i} loading={true} />)}
            </div>
            
            {!isLoading && hasMore && (
              <div className="LoadMoreWrapper">
                <button 
                  className="LoadMoreBtn" 
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={isFetching}
                >
                  {isFetching ? "Loading..." : "Load More Courses"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;