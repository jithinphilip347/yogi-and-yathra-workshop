import apiClient from "@/services/apiClient";

/**
 * Global Search API client.
 *
 * Consumes GET /api/v1/search — the canonical backend search endpoint
 * implemented in Sprints 1–7.
 *
 * Follows the existing apiClient conventions (Axios, base URL, auth headers).
 */
const searchApi = {
  /**
   * Execute a global search across Course, LiveSection, and DailyClass.
   *
   * @param {Object} params
   * @param {string} params.q - Search query (required)
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.per_page=20] - Results per page
   * @param {string} [params.type] - Optional entity type filter
   * @returns {Promise} Axios response with { data, meta }
   */
  search: ({ q, page = 1, per_page = 20, type }) => {
    const params = { q, page, per_page };
    if (type) params.type = type;
    return apiClient.get("search", { params });
  },
};

export default searchApi;
