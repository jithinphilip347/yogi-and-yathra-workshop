import { API_BASE_URL } from "@/utils/constants";

const fetchLiveSections = async () => {
  const res = await fetch(API_BASE_URL + "home/live-sections", {
    method: "GET",
    next: {
      revalidate: 600,
    },
  });
  const data = await res.json();
  return data;
};

const fetchDailyClasses = async () => {
  const res = await fetch(API_BASE_URL + "home/daily-classes", {
    method: "GET",
    next: {
      revalidate: 600,
    },
  });
  const data = await res.json();
  return data;
};

const fetchCategories = async () => {
  const res = await fetch(API_BASE_URL + "home/categories", {
    method: "GET",
    next: {
      revalidate: 600,
    },
  });
  const data = await res.json();
  return data;
};

const fetchCourseDetails = async (id) => {
  const res = await fetch(API_BASE_URL + "home/courses/" + id, {
    method: "GET",
    next: {
      revalidate: 600,
    },
  });
  const data = await res.json();
  return data;
};

const fetchDailyClassDetails = async (id) => {
  const res = await fetch(API_BASE_URL + "home/daily-classes/" + id, {
    method: "GET",
    next: {
      revalidate: 600,
    },
  });
  const data = await res.json();
  return data;
};

// ─── Instructor Endpoints ─────────────────────────────────────────────

/**
 * Fetch featured instructors for the home page.
 */
const fetchFeaturedInstructors = async () => {
  const res = await fetch(API_BASE_URL + "instructors/public/featured?limit=4", {
    method: "GET",
    next: {
      revalidate: 600,
    },
  });
  const data = await res.json();
  return data;
};

/**
 * Fetch paginated instructor list (for teacher-list page).
 */
const fetchInstructors = async ({ page = 1, perPage = 12, search = "" } = {}) => {
  const params = new URLSearchParams({ per_page: perPage, page });
  if (search) params.append("search", search);

  const res = await fetch(API_BASE_URL + "home/instructors?" + params.toString(), {
    method: "GET",
    next: {
      revalidate: 600,
    },
  });
  const data = await res.json();
  return data;
};

/**
 * Fetch a single instructor by slug (for teacher-detail page).
 */
const fetchInstructorDetails = async (slug) => {
  const res = await fetch(API_BASE_URL + "home/instructors/" + slug, {
    method: "GET",
    next: {
      revalidate: 600,
    },
  });
  const data = await res.json();
  console.log(data)
  return data;
};

export {
  fetchLiveSections,
  fetchDailyClasses,
  fetchCategories,
  fetchCourseDetails,
  fetchDailyClassDetails,
  fetchFeaturedInstructors,
  fetchInstructors,
  fetchInstructorDetails,
};