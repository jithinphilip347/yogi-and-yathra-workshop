import { describe, it, expect, vi } from "vitest";

describe("Notification Realtime Architecture", () => {
  it("updates unread count when broadcast arrives", () => {
    let unreadCount = 2;
    const broadcastEvent = {
      notification: {
        id: "notif-uuid-1",
        title: "Class Starting Soon",
        body: "Join your live class now.",
        action_url: "/live-stream/1",
        is_read: false,
      },
      unread_count: 3,
    };

    if (typeof broadcastEvent.unread_count === "number") {
      unreadCount = broadcastEvent.unread_count;
    } else {
      unreadCount += 1;
    }

    expect(unreadCount).toBe(3);
  });

  it("prepends new notification and deduplicates", () => {
    const existingList = [
      { id: "notif-old-1", title: "Old 1" },
      { id: "notif-old-2", title: "Old 2" },
    ];

    const newNotif = { id: "notif-new-1", title: "New 1" };

    const updateList = (list, item) => {
      if (list.some((existing) => existing.id === item.id)) {
        return list;
      }
      return [item, ...list];
    };

    const updated = updateList(existingList, newNotif);
    expect(updated).toHaveLength(3);
    expect(updated[0].id).toBe("notif-new-1");

    // Deduplication check
    const deduped = updateList(updated, newNotif);
    expect(deduped).toHaveLength(3);
  });
});
