import apiClient from "@/services/apiClient";

const notificationApi = {
  /**
   * Get paginated list of notifications with optional filters.
   * @param {Object} params - { page, per_page, unread, category, type }
   */
  getNotifications: (params = {}) => apiClient.get("notifications", { params }),

  /**
   * Get unread notification count.
   */
  getUnreadCount: () => apiClient.get("notifications/unread-count"),

  /**
   * Mark a single notification as read.
   * @param {string} id - Notification UUID
   */
  markRead: (id) => apiClient.patch(`notifications/${id}/read`),

  /**
   * Mark all unread notifications as read.
   */
  markAllRead: () => apiClient.post("notifications/read-all"),

  /**
   * Delete / dismiss a single notification.
   * @param {string} id - Notification UUID
   */
  deleteNotification: (id) => apiClient.delete(`notifications/${id}`),

  /**
   * Get a single notification by ID.
   * @param {string} id - Notification UUID
   */
  getNotification: (id) => apiClient.get(`notifications/${id}`),
};

export default notificationApi;
