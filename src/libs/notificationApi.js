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

  /**
   * Get VAPID public key for Web Push subscription.
   */
  getPushPublicKey: () => apiClient.get("notifications/push/public-key"),

  /**
   * Register device endpoint for Web Push notifications (POST /notifications/devices).
   * @param {Object} data - { endpoint, keys: { p256dh, auth }, browser, platform, device_name }
   */
  registerDevice: (data) => apiClient.post("notifications/devices", data),

  /**
   * Delete / revoke device endpoint from Web Push notifications (DELETE /notifications/devices).
   * @param {Object} data - { endpoint }
   */
  deleteDevice: (data) => apiClient.delete("notifications/devices", { data }),

  /**
   * Subscribe device endpoint for Web Push notifications.
   * @param {Object} data - { endpoint, keys: { p256dh, auth }, browser, platform, device_name }
   */
  subscribePush: (data) => apiClient.post("notifications/devices", data),

  /**
   * Unsubscribe device endpoint from Web Push notifications.
   * @param {Object} data - { endpoint }
   */
  unsubscribePush: (data) => apiClient.delete("notifications/devices", { data }),

  /**
   * Get user notification delivery preferences.
   */
  getNotificationPreferences: () => apiClient.get("notifications/preferences"),

  /**
   * Update user notification delivery preferences.
   * @param {Object} preferences - Nested category -> channel boolean map
   */
  updateNotificationPreferences: (preferences) =>
    apiClient.put("notifications/preferences", { preferences }),
};

export default notificationApi;
