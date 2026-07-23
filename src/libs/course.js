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

export {
  fetchLiveSections,
  fetchDailyClasses,
  fetchCategories,
  fetchCourseDetails,
  fetchDailyClassDetails,
};