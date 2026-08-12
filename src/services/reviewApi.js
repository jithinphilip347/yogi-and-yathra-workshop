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

  // Get review eligibility for the current user against a target
  // → { can_review, has_review, review, reason }
  getEligibility: (targetType, targetId) =>
    apiClient.get("/reviews/eligibility", {
      params: { target_type: targetType, target_id: targetId },
    }),

  // Submit review
  submitReview: (data) => apiClient.post("/reviews", data),

  // Update own review (or admin moderation)
  updateReview: (id, data) => apiClient.put(`/reviews/${id}`, data),

  // Delete own review (or admin moderation)
  deleteReview: (id) => apiClient.delete(`/reviews/${id}`),
};
