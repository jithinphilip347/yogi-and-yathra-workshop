import apiClient from "@/services/apiClient";

const courseApi = {
  all: (queries) =>
    apiClient.get("home/courses", {
      params: queries,
    }),

  enrollments: () => apiClient.get("enrolled-courses"),
};

export default courseApi;