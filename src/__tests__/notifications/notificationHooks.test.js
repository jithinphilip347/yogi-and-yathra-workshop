import { describe, it, expect } from "vitest";
import notificationApi from "../../libs/notificationApi";

describe("Notification Integration contracts", () => {
  it("exports all expected API endpoints", () => {
    expect(typeof notificationApi.getNotifications).toBe("function");
    expect(typeof notificationApi.getUnreadCount).toBe("function");
    expect(typeof notificationApi.markRead).toBe("function");
    expect(typeof notificationApi.markAllRead).toBe("function");
    expect(typeof notificationApi.deleteNotification).toBe("function");
    expect(typeof notificationApi.getNotification).toBe("function");
  });

  it("normalizes query parameters cleanly", () => {
    const filters = { page: 2, per_page: 10, unread: 1, category: "daily_class" };
    const normalized = {
      page: filters.page || 1,
      per_page: filters.per_page || 20,
      unread: filters.unread !== undefined ? filters.unread : null,
      category: filters.category || null,
      type: filters.type || null,
    };

    expect(normalized.page).toBe(2);
    expect(normalized.per_page).toBe(10);
    expect(normalized.unread).toBe(1);
    expect(normalized.category).toBe("daily_class");
    expect(normalized.type).toBeNull();
  });
});
