import apiClient from "@/services/apiClient";

/**
 * Sprint 9 — Unified order history API (Workshop backend only).
 *
 * The browser talks exclusively to the Workshop backend for the unified
 * customer experience. It never calls an E-commerce endpoint, never sends an
 * internal service key, and never supplies a user id — the server resolves the
 * customer from the authenticated session.
 */
export const orderApi = {
  /**
   * Paginated unified order history (learning + physical + mixed).
   * GET /api/v1/orders
   */
  async list({ page = 1, perPage = 10 } = {}) {
    const response = await apiClient.get(
      `orders?page=${encodeURIComponent(page)}&per_page=${encodeURIComponent(perPage)}`
    );

    return response.data;
  },

  /**
   * Unified order detail by Workshop order number or checkout session id.
   * Ownership is enforced server-side; another customer's order is a 404.
   * GET /api/v1/orders/{reference}
   */
  async detail(reference) {
    const response = await apiClient.get(`orders/${encodeURIComponent(reference)}`);

    return response.data;
  },

  /**
   * Student dashboard summary (learning metrics + physical purchase state).
   * GET /api/v1/dashboard/student-summary
   */
  async summary() {
    const response = await apiClient.get("dashboard/student-summary");

    return response.data;
  },
};

export default orderApi;
