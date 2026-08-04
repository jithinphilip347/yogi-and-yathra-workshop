import apiClient from "@/services/apiClient";

const courseApi = {
  all: (queries) =>
    apiClient.get("home/courses", {
      params: queries,
    }),

  enrollments: () => apiClient.get("enrolled-courses"),
  
  userEnrollments: (userId, productType) => {
    const params = {};
    if (productType) params.product_type = productType;
    return apiClient.get(userId ? `enrollments/user/${userId}` : "enrolled-courses", { params });
  },

  dailyClasses: () => apiClient.get("home/daily-classes"),

  liveSections: () => apiClient.get("home/live-sections"),

  upcomingEvents: () => apiClient.get("dashboard/upcoming-events"),
};

export default courseApi;