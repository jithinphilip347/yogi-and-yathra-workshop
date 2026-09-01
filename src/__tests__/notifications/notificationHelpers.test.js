import { describe, it, expect } from "vitest";
import {
  formatRelativeTime,
  formatNotificationDateTime,
  getNotificationCategoryMeta,
  getSafeActionUrl,
} from "../../utils/notificationHelpers";

describe("Notification Helpers & Route Utilities", () => {
  describe("formatRelativeTime", () => {
    it("handles falsy and invalid values safely", () => {
      expect(formatRelativeTime(null)).toBe("");
      expect(formatRelativeTime(undefined)).toBe("");
      expect(formatRelativeTime("invalid-date-string")).toBe("");
    });

    it("formats recent seconds as Just now", () => {
      const now = new Date().toISOString();
      expect(formatRelativeTime(now)).toBe("Just now");
    });

    it("formats minutes ago correctly", () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinsAgo)).toBe("5m ago");
    });

    it("formats hours ago correctly for today", () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
      expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
    });

    it("formats days ago correctly within a week", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
      expect(formatRelativeTime(threeDaysAgo)).toBe("3d ago");
    });
  });

  describe("formatNotificationDateTime", () => {
    it("handles null or malformed dates gracefully", () => {
      expect(formatNotificationDateTime(null)).toEqual({ date: "", time: "" });
      expect(formatNotificationDateTime("bad-date")).toEqual({ date: "", time: "" });
    });

    it("formats valid date and time", () => {
      const now = new Date();
      const result = formatNotificationDateTime(now.toISOString());
      expect(result.date).toBe("Today");
      expect(typeof result.time).toBe("string");
      expect(result.time.length).toBeGreaterThan(0);
    });
  });

  describe("getNotificationCategoryMeta", () => {
    it("resolves Live Class category metadata", () => {
      const meta = getNotificationCategoryMeta("live_class", "live_class_starting");
      expect(meta.label).toBe("Live Class");
      expect(meta.variant).toBe("live");
    });

    it("resolves Daily Class category metadata", () => {
      const meta = getNotificationCategoryMeta("daily_class", "daily_class_reminder");
      expect(meta.label).toBe("Daily Class");
      expect(meta.variant).toBe("daily");
    });

    it("resolves Course category metadata", () => {
      const meta = getNotificationCategoryMeta("course", "course_enrolled");
      expect(meta.label).toBe("Course");
      expect(meta.variant).toBe("course");
    });

    it("resolves Payment category metadata", () => {
      const meta = getNotificationCategoryMeta("payment", "payment_success");
      expect(meta.label).toBe("Payment");
      expect(meta.variant).toBe("payment");
    });

    it("resolves Certificate category metadata", () => {
      const meta = getNotificationCategoryMeta("certificate", "certificate_generated");
      expect(meta.label).toBe("Certificate");
      expect(meta.variant).toBe("certificate");
    });

    it("falls back to General category for unknown", () => {
      const meta = getNotificationCategoryMeta("random_cat", "custom_type");
      expect(meta.label).toBe("General");
      expect(meta.variant).toBe("general");
    });
  });

  describe("getSafeActionUrl Security & Deep Link Sanitation", () => {
    it("returns null for non-string or falsy input", () => {
      expect(getSafeActionUrl(null)).toBeNull();
      expect(getSafeActionUrl(undefined)).toBeNull();
      expect(getSafeActionUrl("")).toBeNull();
    });

    it("blocks dangerous schemes (javascript:, data:, vbscript:, file:)", () => {
      expect(getSafeActionUrl("javascript:alert(1)")).toBeNull();
      expect(getSafeActionUrl("javascript:evilCode()")).toBeNull();
      expect(getSafeActionUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
      expect(getSafeActionUrl("vbscript:MsgBox(1)")).toBeNull();
      expect(getSafeActionUrl("file:///etc/passwd")).toBeNull();
    });

    it("allows valid internal routes", () => {
      expect(getSafeActionUrl("/live-stream/10/morning-vinyasa")).toBe("/live-stream/10/morning-vinyasa");
      expect(getSafeActionUrl("/daily-class/5/core-power")).toBe("/daily-class/5/core-power");
      expect(getSafeActionUrl("/course/ashtanga-foundations")).toBe("/course/ashtanga-foundations");
      expect(getSafeActionUrl("/notifications")).toBe("/notifications");
      expect(getSafeActionUrl("/checkout?order_id=123")).toBe("/checkout?order_id=123");
    });

    it("extracts internal path safely from absolute HTTP URLs", () => {
      expect(getSafeActionUrl("http://localhost:3000/live-stream/42/flow")).toBe("/live-stream/42/flow");
      expect(getSafeActionUrl("https://yogify.app/course/advanced-pranayama?ref=notif#section-2")).toBe(
        "/course/advanced-pranayama?ref=notif#section-2"
      );
    });
  });
});
