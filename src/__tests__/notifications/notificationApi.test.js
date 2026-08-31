import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "../../services/apiClient";
import notificationApi from "../../libs/notificationApi";

vi.mock("../../services/apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("notificationApi client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls GET notifications with query parameters", async () => {
    const mockParams = { page: 2, per_page: 15, unread: 1, category: "live_class" };
    apiClient.get.mockResolvedValueOnce({ data: { success: true, data: [] } });

    const result = await notificationApi.getNotifications(mockParams);

    expect(apiClient.get).toHaveBeenCalledWith("notifications", { params: mockParams });
    expect(result.data.success).toBe(true);
  });

  it("calls GET notifications/unread-count", async () => {
    apiClient.get.mockResolvedValueOnce({ data: { success: true, data: { count: 5 } } });

    const result = await notificationApi.getUnreadCount();

    expect(apiClient.get).toHaveBeenCalledWith("notifications/unread-count");
    expect(result.data.data.count).toBe(5);
  });

  it("calls PATCH notifications/{id}/read", async () => {
    const uuid = "9d9016e7-1234-4b56-7890-abcdef123456";
    apiClient.patch.mockResolvedValueOnce({ data: { success: true, data: { is_read: true } } });

    const result = await notificationApi.markRead(uuid);

    expect(apiClient.patch).toHaveBeenCalledWith(`notifications/${uuid}/read`);
    expect(result.data.data.is_read).toBe(true);
  });

  it("calls POST notifications/read-all", async () => {
    apiClient.post.mockResolvedValueOnce({ data: { success: true, data: { updated: 3 } } });

    const result = await notificationApi.markAllRead();

    expect(apiClient.post).toHaveBeenCalledWith("notifications/read-all");
    expect(result.data.data.updated).toBe(3);
  });

  it("calls DELETE notifications/{id}", async () => {
    const uuid = "9d9016e7-1234-4b56-7890-abcdef123456";
    apiClient.delete.mockResolvedValueOnce({ data: { success: true, message: "Deleted successfully" } });

    const result = await notificationApi.deleteNotification(uuid);

    expect(apiClient.delete).toHaveBeenCalledWith(`notifications/${uuid}`);
    expect(result.data.success).toBe(true);
  });

  it("calls GET notifications/{id}", async () => {
    const uuid = "9d9016e7-1234-4b56-7890-abcdef123456";
    apiClient.get.mockResolvedValueOnce({ data: { success: true, data: { id: uuid } } });

    const result = await notificationApi.getNotification(uuid);

    expect(apiClient.get).toHaveBeenCalledWith(`notifications/${uuid}`);
    expect(result.data.data.id).toBe(uuid);
  });
});
