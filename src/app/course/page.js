"use client";
import React, { useState, useEffect, useRef, Suspense, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import CourseCard from "../../components/coursebox/CourseCard";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import {
  FiUsers,
  FiClock,
  FiBookOpen,
  FiChevronDown,
  FiFilter,
} from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import useCourse from "@/hooks/useCourse";
import useWishlist from "@/hooks/useWishlist";
import FilterBox from "@/components/filter/FilterBox";
import Breadcrumbs from "../../components/breadcrumbs/Breadcrumbs";
import { fetchCategories } from "@/libs/course";
import courseApi from "@/libs/courseApi";
import { useQuery } from "@tanstack/react-query";
import useGlobalSearch from "@/hooks/useGlobalSearch";

const unwrapList = (response) => {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(response)) return response;
  return [];
};

const getCurrentPrice = (item) => {
  if (item?.effective_price !== null && item?.effective_price !== undefined) {
    return item.effective_price;
  }
  const regular = Number(item?.price);
  const discounted = Number(item?.discount_price);
  return Number.isFinite(discounted) && discounted > 0 && discounted < regular
    ? item.discount_price
    : item?.price;
};

const getOriginalPrice = (item) => {
  if (item?.original_price !== null && item?.original_price !== undefined) {
    return item.original_price;
  }
  const regular = Number(item?.price);
  const discounted = Number(item?.discount_price);
  return Number.isFinite(discounted) && discounted > 0 && discounted < regular
    ? item.price
    : null;
};

const CourseListContent = () => {
  const searchParams = useSearchParams();
  const catalogSearch = searchParams.get("q")?.trim() || "";
  const isSearchMode = catalogSearch.length > 0;
  const categoryParam = searchParams.get("category") || searchParams.get("category_id");

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [level, setLevel] = useState("");
  const [price, setPrice] = useState(0);
  const [instructorId, setInstructorId] = useState("");
  const [contentType, setContentType] = useState("all");
  const [sort, setSort] = useState("Newest");
  const [sortValue, setSortValue] = useState("created_at");
  const [page, setPage] = useState(1);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { data: filterOptionsResponse } = useQuery({
    queryKey: ["course-filter-options"],
    queryFn: courseApi.filterOptions,
    enabled: !isSearchMode,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const filterOptions = filterOptionsResponse?.data || {};
  const { data: dailyClassesResponse, isLoading: isDailyClassesLoading } = useQuery({
    queryKey: ["public-daily-classes-catalog"],
    queryFn: courseApi.dailyClasses,
    enabled: !isSearchMode,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const { data: liveSectionsResponse, isLoading: isLiveSectionsLoading } = useQuery({
    queryKey: ["public-live-sections-catalog"],
    queryFn: courseApi.liveSections,
    enabled: !isSearchMode,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const dailyClasses = useMemo(() => unwrapList(dailyClassesResponse), [dailyClassesResponse]);
  const liveSections = useMemo(() => unwrapList(liveSectionsResponse), [liveSectionsResponse]);
  const maxPrice = [
    Number(filterOptions.max_price) || 5000,
    ...dailyClasses.map((item) => Number(getCurrentPrice(item)) || 0),
    ...liveSections.map((item) => Number(getCurrentPrice(item)) || 0),
  ].reduce((highest, value) => Math.max(highest, value), 100);
  const instructorOptions = useMemo(() => {
    const options = new Map(
      (filterOptions.instructors || []).map((instructor) => [String(instructor.id), instructor])
    );
    [...dailyClasses, ...liveSections].forEach((item) => {
      const instructor = item.instructor;
      const id = item.instructor_id ?? instructor?.id;
      if (id && instructor?.name && !options.has(String(id))) {
        options.set(String(id), { id, name: instructor.name });
      }
    });
    return [...options.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [filterOptions.instructors, dailyClasses, liveSections]);
  const activePrice = price > 0 ? Math.min(price, maxPrice) : maxPrice;

  useEffect(() => {
    if (isSearchMode) return;
    fetchCategories().then((data) => {
      setCategories(data || []);
    });
  }, [isSearchMode]);

  const category = React.useMemo(() => {
    if (selectedCategory !== null) return selectedCategory;
    if (!categoryParam) return "All";
    if (categories.length > 0) {
      const found = categories.find(
        (c) =>
          String(c.id) === String(categoryParam) ||
          c.slug === categoryParam ||
          c.name?.toLowerCase() === categoryParam.toLowerCase()
      );
      if (found) return found.id;
    }
    if (!isNaN(Number(categoryParam))) return Number(categoryParam);
    return categoryParam;
  }, [selectedCategory, categoryParam, categories]);

  const setCategory = (newCat) => {
    setSelectedCategory(newCat);
    setPage(1);
  };

  const handleSortChange = (item) => {
    const sorts = {
      Newest: "created_at",
      Price: "price",
      Rating: "rating",
    };
    setSort(item);
    setSortValue(sorts[item]);
    setSortOpen(false);
    setPage(1);
  };

  const categoryRef = useRef(null);
  const sortRef = useRef(null);
  const drawerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const loadMoreLockRef = useRef(false);

  const breadcrumbItems = [{ label: "Courses" }];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target))
        setCategoryOpen(false);
      if (sortRef.current && !sortRef.current.contains(event.target))
        setSortOpen(false);
      if (
        isDrawerOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(event.target)
      )
        setIsDrawerOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDrawerOpen]);

  const queries = {
    sort: sortValue,
    category_id: category,
    level,
    min_price: 0,
    max_price: activePrice,
    ...(instructorId ? { instructor_id: instructorId } : {}),
    order_by: "desc",
    per_page: 12,
    page,
  };

  const {
    data: globalSearchResponse,
    isLoading: isSearchLoading,
    isFetching: isSearchFetching,
    isError: isSearchError,
  } = useGlobalSearch(catalogSearch, { perPage: 100 });
  const globalSearchResults = globalSearchResponse?.data || [];

  const { courseQuery } = useCourse({ queries: isSearchMode ? null : queries });
  const { data, isLoading, isFetching } = courseQuery;

  const [coursesList, setCoursesList] = useState([]);

  useEffect(() => {
    if (data?.data?.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoursesList((prev) => (page === 1 ? data.data.data : [...prev, ...data.data.data]));
    }
  }, [data, page]);

  const { findWishlistIcon } = useWishlist();

  const hasMore = Boolean(data?.data?.next_page_url);
  const canLoadMore = !isSearchMode && hasMore && (contentType === "all" || contentType === "course");
  const loadNextPage = useCallback(() => {
    if (!canLoadMore || isFetching || loadMoreLockRef.current) return;
    loadMoreLockRef.current = true;
    setPage((currentPage) => currentPage + 1);
  }, [canLoadMore, isFetching]);

  useEffect(() => {
    const currentPage = Number(data?.data?.current_page);
    if (!isFetching && (currentPage >= page || courseQuery.isError)) {
      loadMoreLockRef.current = false;
    }
  }, [courseQuery.isError, data, isFetching, page]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (typeof IntersectionObserver === "undefined" || !sentinel || !canLoadMore || isFetching) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadNextPage();
      },
      { rootMargin: "500px 0px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canLoadMore, isFetching, loadNextPage]);

  const listingItems = useMemo(() => {
    const items = isSearchMode
      ? globalSearchResults.map((item) => ({
          ...item,
          contentType: item.type,
          instructor: { name: item.instructor_name },
        }))
      : [
          ...coursesList.map((item) => ({ ...item, contentType: "course" })),
          ...dailyClasses.map((item) => ({ ...item, contentType: "daily_class" })),
          ...liveSections.map((item) => ({ ...item, contentType: "live_section" })),
        ];

    const filtered = items.filter((item) => {
      if (contentType !== "all" && item.contentType !== contentType) return false;

      const itemCategoryId = item.category_id ?? item.category?.id;
      if (category !== "All" && itemCategoryId != null && String(itemCategoryId) !== String(category)) return false;

      const itemLevel = item.level || item.difficulty;
      if (level && itemLevel && String(itemLevel).toLowerCase() !== String(level).toLowerCase()) return false;

      const itemInstructorId = item.instructor_id ?? item.instructor?.id;
      if (instructorId && itemInstructorId != null && String(itemInstructorId) !== String(instructorId)) return false;

      const itemPrice = getCurrentPrice(item);
      if (price > 0 && itemPrice != null && Number(itemPrice) > activePrice) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (sortValue === "price") return Number(getCurrentPrice(b) || 0) - Number(getCurrentPrice(a) || 0);
      if (sortValue === "rating") return Number(b.average_rating ?? b.rating ?? 0) - Number(a.average_rating ?? a.rating ?? 0);
      const dateA = new Date(a.created_at || a.date || a.start_date || 0).getTime();
      const dateB = new Date(b.created_at || b.date || b.start_date || 0).getTime();
      return dateB - dateA;
    });
  }, [isSearchMode, globalSearchResults, coursesList, dailyClasses, liveSections, contentType, category, level, instructorId, price, activePrice, sortValue]);

  const contentTypes = [
    { id: "all", label: "All" },
    { id: "course", label: "Courses" },
    { id: "daily_class", label: "Daily Classes" },
    { id: "live_section", label: "Live Sections" },
  ];

  const isCatalogLoading = isSearchMode
    ? isSearchLoading || isSearchFetching
    : isLoading || isDailyClassesLoading || isLiveSectionsLoading;

  const renderCatalogCard = (item) => {
    const type = item.contentType;
    const isCourse = type === "course";
    const currentPrice = getCurrentPrice(item);
    const instructor = item.instructor || {};
    const displaySlug = item.slug || item.title?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const classDate = item.human_start_date || item.human_date || item.start_date;
    const classTime = item.human_class_time || item.human_start_time || item.start_time;
    const duration = item.duration != null && item.duration !== ""
      ? (isCourse ? `${item.duration} hrs` : type === "live_section" ? `${item.duration} min` : item.duration)
      : null;
    const sessionCount = item.sessions_count ?? item.session_count;

    return (
      <CourseCard
        key={`${type}-${item.id}`}
        loading={false}
        image={item.thumbnail ? resolveMediaUrl(item.thumbnail) : "/images/course-placeholder.webp"}
        title={item.title}
        lessons={isCourse ? item.lessons_count : sessionCount}
        duration={duration}
        price={currentPrice}
        oldPrice={getOriginalPrice(item)}
        rating={item.average_rating ?? item.rating}
        students={item.enrollments_count ?? item.booked_seats ?? item.students_count}
        instructorName={instructor.name}
        wishlistIcon={findWishlistIcon(item.id, type)}
        lessonsIcon={<FiBookOpen />}
        clockIcon={<FiClock />}
        dateIcon={<FiClock />}
        dateFormat={!isCourse ? classDate : null}
        time={!isCourse ? classTime : null}
        timeIcon={<FiClock />}
        userIcon={<FiUsers />}
        ratingIcon={<AiFillStar />}
        buttonText="View Details"
        instructorImg={instructor.avatar_url || instructor.avatar ? resolveMediaUrl(instructor.avatar_url || instructor.avatar) : null}
        type={type}
        instructorLabel={instructor.role || "Instructor"}
        id={item.id}
        slug={displaySlug}
        lessonsLabel={isCourse ? "Lessons" : "Sessions"}
      />
    );
  };

  return (
    <div id="CourseList">
      <div className="BreadCrumbsBox">
        <div className="container">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>
      <div className="container">
        {!isSearchMode && <div className="TopActions">
          <button
            className="MobileFilterBtn"
            onClick={() => setIsDrawerOpen(true)}
          >
            <FiFilter /> <span>Filter</span>
          </button>

          <div className="SortWrapper" ref={sortRef}>
            <span className="SortLabel">Sort by:</span>
            <div
              className="CustomDropdown"
              onClick={() => setSortOpen(!sortOpen)}
            >
              <span>{sort}</span>
              <FiChevronDown />
              {sortOpen && (
                <ul className="DropdownList">
                  {["Newest", "Price", "Rating"].map((item) => (
                    <li key={item} onClick={() => handleSortChange(item)}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>}

        <div className="CourseMain">
          {/* Desktop Filter */}
          {!isSearchMode && <div className="DesktopFilterWrapper">
            <FilterBox
              category={category}
              setCategory={setCategory}
              categoryOpen={categoryOpen}
              setCategoryOpen={setCategoryOpen}
              categoryRef={categoryRef}
              level={level}
              setLevel={setLevel}
              price={price}
              setPrice={setPrice}
              maxPrice={maxPrice}
              instructors={instructorOptions}
              instructorId={instructorId}
              setInstructorId={setInstructorId}
              categories={categories}
            />
          </div>}

          {/* Mobile Filter Drawer */}
          {!isSearchMode && isDrawerOpen && (
            <div className="DrawerOverlay">
              <div ref={drawerRef} className="DrawerContent">
                <FilterBox
                  isMobile={true}
                  onClose={() => setIsDrawerOpen(false)}
                  category={category}
                  setCategory={setCategory}
                  categoryOpen={categoryOpen}
                  setCategoryOpen={setCategoryOpen}
                  categoryRef={categoryRef}
                  level={level}
                  setLevel={setLevel}
                  price={price}
                  setPrice={setPrice}
                  maxPrice={maxPrice}
                  instructors={instructorOptions}
                  instructorId={instructorId}
                  setInstructorId={setInstructorId}
                  categories={categories}
                />
              </div>
            </div>
          )}

          <div className="ContentArea">
            {isSearchMode && (
              <div className="CatalogSearchHeading">
                <h1 className="text-2xl font-semibold text-gray-900">Search results</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {globalSearchResponse?.meta?.total ?? globalSearchResults.length} results for “{catalogSearch}”
                </p>
              </div>
            )}
            <div className="ContentTypeFilters" role="group" aria-label="Filter by content type">
              {contentTypes.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={contentType === option.id ? "active" : ""}
                  aria-pressed={contentType === option.id}
                  onClick={() => {
                    setContentType(option.id);
                    setPage(1);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="CourseGrid">
              {isCatalogLoading && (isSearchMode || page === 1)
                ? Array(8)
                    .fill({})
                    .map((_, i) => <CourseCard key={i} loading={true} />)
                : isSearchError ? (
                    <div className="NoData">Search failed. Please try again.</div>
                  )
                : listingItems.length > 0
                  ? listingItems.map(renderCatalogCard)
                  : !isCatalogLoading && (
                      <div className="NoData">
                        {isSearchMode
                          ? `No results found for “${catalogSearch}”.`
                          : "No content found matching your filters."}
                      </div>
                    )}
              {isFetching &&
                page > 1 &&
                Array(4)
                  .fill({})
                  .map((_, i) => <CourseCard key={i} loading={true} />)}
            </div>

            {!isSearchMode && !isLoading && hasMore && (contentType === "all" || contentType === "course") && (
              <div className="LoadMoreWrapper">
                <div ref={loadMoreRef} className="LoadMoreSentinel" aria-hidden="true" />
                <button
                  className="LoadMoreBtn"
                  onClick={loadNextPage}
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

const Page = () => {
  return (
    <Suspense fallback={<div className="container" style={{ padding: "40px", textAlign: "center" }}>Loading courses...</div>}>
      <CourseListContent />
    </Suspense>
  );
};

export default Page;
