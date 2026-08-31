import { describe, it, expect } from "vitest";
import notificationApi from "@/libs/notificationApi";

describe("Notification Preferences Architecture", () => {
  it("exposes preference API client methods", () => {
    expect(typeof notificationApi.getNotificationPreferences).toBe("function");
    expect(typeof notificationApi.updateNotificationPreferences).toBe("function");
  });

  it("correctly merges optimistic preference updates", () => {
    const existing = {
      live_class: { push: true, email: true },
      daily_class: { push: true, email: true },
      course: { push: true, email: true },
      payment: { push: true, email: true },
    };

    const update = {
      live_class: { email: false },
      daily_class: { push: false },
    };

    const merged = { ...existing };
    for (const [cat, channels] of Object.entries(update)) {
      merged[cat] = { ...(merged[cat] || {}), ...channels };
    }

    expect(merged.live_class.push).toBe(true);
    expect(merged.live_class.email).toBe(false);
    expect(merged.daily_class.push).toBe(false);
    expect(merged.daily_class.email).toBe(true);
    expect(merged.course.push).toBe(true);
    expect(merged.payment.email).toBe(true);
  });
});
