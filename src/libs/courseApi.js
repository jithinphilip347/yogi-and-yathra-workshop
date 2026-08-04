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

  getCoursePlayer: (courseId, lessonId) => {
    const params = {};
    if (lessonId) params.lesson_id = lessonId;
    return apiClient.get(`course/${courseId}/player`, { params });
  },

  getLessonPlayer: (lessonId) => apiClient.get(`lesson/${lessonId}/player`),

  saveLessonProgress: (lessonId, positionSeconds, durationSeconds) =>
    apiClient.post(`lesson/${lessonId}/progress`, {
      position_seconds: Math.floor(positionSeconds),
      duration_seconds: durationSeconds ? Math.floor(durationSeconds) : null,
    }),

  getLessonResume: (lessonId) => apiClient.post(`lesson/${lessonId}/resume`),

  getCourseProgress: (courseId) => apiClient.get(`course/${courseId}/progress`),

  continueLearning: () => apiClient.get("student/continue-learning"),

  getLessonStream: (lessonId) => apiClient.get(`lesson/${lessonId}/stream`),
};

export default courseApi;