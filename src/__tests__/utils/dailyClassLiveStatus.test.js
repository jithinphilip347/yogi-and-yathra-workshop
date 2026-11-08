import { describe, expect, it } from "vitest";
import { isDailyClassLiveNow } from "@/utils/dailyClassLiveStatus";

const openEndedClass = {
  start_date: "2026-11-01",
  end_date: null,
  class_time: "07:00",
  duration: 60,
  schedule: ["Mon"],
  timezone: "Asia/Kolkata",
};

describe("daily class live status with optional end date", () => {
  it("recognizes a currently scheduled session when the class has no end date", () => {
    // Monday, 07:30 in Asia/Kolkata.
    expect(
      isDailyClassLiveNow(openEndedClass, new Date("2026-11-02T02:00:00.000Z"))
    ).toBe(true);
  });

  it("continues to recognize a later session in an open-ended class", () => {
    // Monday, 07:30 in Asia/Kolkata, several weeks after its start date.
    expect(
      isDailyClassLiveNow(openEndedClass, new Date("2026-11-23T02:00:00.000Z"))
    ).toBe(true);
  });

  it("still respects an explicitly configured end date", () => {
    expect(
      isDailyClassLiveNow(
        { ...openEndedClass, end_date: "2026-11-10" },
        new Date("2026-11-23T02:00:00.000Z")
      )
    ).toBe(false);
  });
});
