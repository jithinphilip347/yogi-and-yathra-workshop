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

  // Sprint P4: Notes, Bookmarks, Recent Views
  getLessonNotes: (lessonId, params) => apiClient.get(`lesson/${lessonId}/notes`, { params }),
  createLessonNote: (lessonId, content, timestampSeconds) =>
    apiClient.post(`lesson/${lessonId}/notes`, {
      content,
      timestamp_seconds: timestampSeconds !== null && timestampSeconds !== undefined ? Math.floor(timestampSeconds) : null,
    }),
  updateLessonNote: (noteId, content, timestampSeconds) =>
    apiClient.put(`lesson-notes/${noteId}`, {
      content,
      timestamp_seconds: timestampSeconds !== null && timestampSeconds !== undefined ? Math.floor(timestampSeconds) : null,
    }),
  deleteLessonNote: (noteId) => apiClient.delete(`lesson-notes/${noteId}`),

  toggleBookmark: (lessonId) => apiClient.post(`lesson/${lessonId}/bookmark`),
  getBookmarks: () => apiClient.get("student/bookmarks"),

  getRecentLessons: () => apiClient.get("student/recent-lessons"),
  recordRecentView: (lessonId) => apiClient.post(`lesson/${lessonId}/recent-view`),
};

export default courseApi;