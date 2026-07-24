import apiClient from "./apiClient";

export const reviewApi = {
  // Get public reviews for a target or overall
  getReviews: (params = {}) => apiClient.get("/reviews", { params }),

  // Get homepage featured testimonials
  getTestimonials: (limit = 10) => apiClient.get("/reviews/testimonials", { params: { limit } }),

  // Get rating summary for a target
  getSummary: (targetType, targetId) =>
    apiClient.get("/reviews/summary", {
      params: { target_type: targetType, target_id: targetId },
    }),

  // Submit review
  submitReview: (data) => apiClient.post("/reviews", data),
};
