import apiClient from "./apiClient";

export const faqApi = {
  /**
   * Fetch featured FAQs for homepage.
   * GET /api/v1/faqs/public/featured
   */
  getFeaturedFaqs: () => apiClient.get("/faqs/public/featured"),

  /**
   * Fetch FAQs by entity type and ID.
   * GET /api/v1/faqs/public/entity
   */
  getByEntity: (entity_type, entity_id) =>
    apiClient.get("/faqs/public/entity", { params: { entity_type, entity_id } }),

  /**
   * Fetch FAQs by category slug.
   * GET /api/v1/faqs/public/category/{slug}
   */
  getByCategory: (slug) => apiClient.get(`/faqs/public/category/${slug}`),

  /**
   * Fetch all public FAQs with optional filters.
   * GET /api/v1/faqs/public
   */
  getAllPublic: (params = {}) => apiClient.get("/faqs/public", { params }),
};
