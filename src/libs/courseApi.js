import apiClient from "@/services/apiClient";

const courseApi = {
  all: (queries) =>
    apiClient.get("home/courses", {
      params: queries,
    }),
    
  show: (courseId) => apiClient.get(`home/courses/${courseId}`),

  enrollments: () => apiClient.get("enrolled-courses"),
  
  userEnrollments: (userId, productType) => {
    const params = {};
    if (productType) params.product_type = productType;
    return apiClient.get(userId ? `enrollments/user/${userId}` : "enrolled-courses", { params });
  },

  dailyClasses: () => apiClient.get("home/daily-classes"),

  dailyClass: (id) => apiClient.get(`home/daily-classes/${id}`),

  liveSections: () => apiClient.get("home/live-sections"),

  upcomingEvents: () => apiClient.get("dashboard/upcoming-events"),

  getCoursePlayer: (courseId, lessonId, options = {}) => {
    const params = {};
    if (lessonId) params.lesson_id = lessonId;
    // `light` returns only the current-lesson slice so lesson navigation can
    // reuse the already-loaded course structure instead of re-fetching the
    // entire player session for every lesson change.
    if (options.light) params.light = 1;
    return apiClient.get(`course/${courseId}/player`, {
      params,
      ...(options.signal ? { signal: options.signal } : {}),
    });
  },

  getLessonPlayer: (lessonId) => apiClient.get(`lesson/${lessonId}/player`),

  saveLessonProgress: (lessonId, positionSeconds, durationSeconds, realWatchedSeconds = null) =>
    apiClient.post(`lesson/${lessonId}/progress`, {
      position_seconds: Math.floor(positionSeconds),
      duration_seconds: durationSeconds ? Math.floor(durationSeconds) : null,
      real_watched_seconds: realWatchedSeconds ? Math.floor(realWatchedSeconds) : null,
    }),

  toggleLessonCompletion: (lessonId) => apiClient.post(`lesson/${lessonId}/toggle-complete`),

  getLessonResume: (lessonId) => apiClient.post(`lesson/${lessonId}/resume`),

  getCourseProgress: (courseId) => apiClient.get(`course/${courseId}/progress`),

  continueLearning: () => apiClient.get("student/continue-learning"),

  getLessonStream: (lessonId, options = {}) => apiClient.get(`lesson/${lessonId}/stream`, options),

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

  // Sprint P5: Assessment & Certificate Integration
  getCertificateEligibility: (courseId) => apiClient.get(`course/${courseId}/certificate-eligibility`),
  claimCertificate: (courseId) => apiClient.post(`course/${courseId}/claim-certificate`),
  getLiveSectionCertificateEligibility: (liveSectionId) =>
    apiClient.get(`live-sections/${liveSectionId}/certificate-eligibility`),
  claimLiveSectionCertificate: (liveSectionId) =>
    apiClient.post(`live-sections/${liveSectionId}/claim-certificate`),
  getAssessmentStatus: (lessonId) => apiClient.get(`lesson/${lessonId}/assessment-status`),

  // Sprint P6: Learning Intelligence, Analytics & Telemetry
  getStudentAnalytics: () => apiClient.get("student/analytics"),
  getLessonAnalytics: (lessonId) => apiClient.get(`lesson/${lessonId}/analytics`),
  getSystemMetrics: () => apiClient.get("system/player-metrics"),
  logPlayerEvent: (eventType, lessonId = null, eventData = null) =>
    apiClient.post("player/event", {
      event_type: eventType,
      lesson_id: lessonId,
      event_data: eventData,
    }),
};

export default courseApi;