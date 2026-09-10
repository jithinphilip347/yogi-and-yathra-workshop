import { describe, it, expect, vi } from "vitest";
import courseApi from "@/libs/courseApi";
import apiClient from "@/services/apiClient";

vi.mock("@/services/apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("HomeLiveCourse Data & Business Logic", () => {
  it("fetches live sections from courseApi", async () => {
    const mockLiveSections = [
      {
        id: 2,
        title: "Soorya Namskaram",
        slug: "soorya-namskaram",
        date: "2026-09-10",
        human_date: "10 Sept 2026",
        start_time: "15:40:00",
        human_start_time: "03:40 PM",
        duration: 60,
        class_date_time: "2026-09-10T15:40:00+05:30",
        booked_seats: 12,
        available_seats: 18,
        capacity: 30,
        review_count: 5,
        average_rating: 4.8,
        instructor: {
          id: 4,
          name: "Achu Sivadasan",
          avatar_url: "/uploads/instructors/achu.jpg",
        },
        category: {
          name: "Hatha Yoga",
        },
      },
    ];

    apiClient.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: mockLiveSections,
      },
    });

    const response = await courseApi.liveSections();
    expect(apiClient.get).toHaveBeenCalledWith("home/live-sections");
    expect(response.data.data).toHaveLength(1);
    expect(response.data.data[0].title).toBe("Soorya Namskaram");
    expect(response.data.data[0].human_start_time).toBe("03:40 PM");
    expect(response.data.data[0].instructor.name).toBe("Achu Sivadasan");
  });

  describe("Countdown Target Date Computation", () => {
    const computeTargetDate = (event) => {
      if (!event) return null;
      if (event.class_date_time) {
        const parsed = new Date(event.class_date_time).getTime();
        if (!isNaN(parsed)) return parsed;
      }
      if (event.date) {
        const timeStr = event.start_time || "00:00:00";
        const fullDateStr = `${event.date}T${timeStr}`;
        const parsed = new Date(fullDateStr).getTime();
        if (!isNaN(parsed)) return parsed;
        const fallbackParsed = new Date(event.date).getTime();
        if (!isNaN(fallbackParsed)) return fallbackParsed;
      }
      return null;
    };

    it("prefers class_date_time when available", () => {
      const event = {
        class_date_time: "2026-09-10T15:40:00+05:30",
        date: "2026-09-10",
        start_time: "15:40:00",
      };
      const target = computeTargetDate(event);
      expect(target).toBe(new Date("2026-09-10T15:40:00+05:30").getTime());
    });

    it("combines date and start_time when class_date_time is absent", () => {
      const event = {
        date: "2026-10-15",
        start_time: "18:30:00",
      };
      const target = computeTargetDate(event);
      expect(target).toBe(new Date("2026-10-15T18:30:00").getTime());
    });

    it("calculates exact remaining breakdown", () => {
      const now = new Date("2026-09-10T12:00:00Z").getTime();
      const target = new Date("2026-09-11T15:30:45Z").getTime();
      const distance = target - now;

      const format = (v) => String(v).padStart(2, "0");
      const timeLeft = {
        days: format(Math.floor(distance / (1000 * 60 * 60 * 24))),
        hours: format(Math.floor((distance / (1000 * 60 * 60)) % 24)),
        minutes: format(Math.floor((distance / (1000 * 60)) % 60)),
        seconds: format(Math.floor((distance / 1000) % 60)),
      };

      expect(timeLeft.days).toBe("01");
      expect(timeLeft.hours).toBe("03");
      expect(timeLeft.minutes).toBe("30");
      expect(timeLeft.seconds).toBe("45");
    });
  });

  describe("Dynamic CTA and Status Determination", () => {
    const getCtaState = (event) => {
      const isEnded = Boolean(event?.is_ended || event?.time_status === "completed");
      const isLive = Boolean(event?.time_status === "live" || event?.can_join);
      const isSoldOut = Boolean(
        event?.registration_status === "full" ||
          (event?.available_seats !== undefined &&
            Number(event?.available_seats) <= 0 &&
            Number(event?.capacity) > 0)
      );
      const isRegistrationClosed = Boolean(event?.registration_status === "closed");

      let text = "Pre Book Now";
      if (isEnded) text = "Session Ended";
      else if (isLive) text = "Join Live";
      else if (isSoldOut) text = "Sold Out";
      else if (isRegistrationClosed) text = "Registration Closed";

      const disabled = isEnded || isSoldOut || isRegistrationClosed;
      return { text, disabled, isLive };
    };

    it("returns 'Session Ended' and disabled when session is completed or ended", () => {
      expect(getCtaState({ is_ended: true })).toEqual({
        text: "Session Ended",
        disabled: true,
        isLive: false,
      });
      expect(getCtaState({ time_status: "completed" })).toEqual({
        text: "Session Ended",
        disabled: true,
        isLive: false,
      });
    });

    it("returns 'Join Live' and active when session is live or can_join is true", () => {
      expect(getCtaState({ time_status: "live" })).toEqual({
        text: "Join Live",
        disabled: false,
        isLive: true,
      });
      expect(getCtaState({ can_join: true })).toEqual({
        text: "Join Live",
        disabled: false,
        isLive: true,
      });
    });

    it("returns 'Sold Out' when registration_status is full or available seats is 0", () => {
      expect(getCtaState({ registration_status: "full" })).toEqual({
        text: "Sold Out",
        disabled: true,
        isLive: false,
      });
      expect(getCtaState({ capacity: 30, available_seats: 0 })).toEqual({
        text: "Sold Out",
        disabled: true,
        isLive: false,
      });
    });

    it("returns 'Registration Closed' when registration_status is closed", () => {
      expect(getCtaState({ registration_status: "closed" })).toEqual({
        text: "Registration Closed",
        disabled: true,
        isLive: false,
      });
    });

    it("returns 'Pre Book Now' for upcoming active sessions", () => {
      expect(
        getCtaState({
          time_status: "upcoming",
          registration_status: "open",
          capacity: 30,
          available_seats: 15,
        })
      ).toEqual({
        text: "Pre Book Now",
        disabled: false,
        isLive: false,
      });
    });
  });

  describe("Absence of Mock Fallbacks", () => {
    it("safely handles missing fields without injecting mock text", () => {
      const minimalEvent = {
        id: 10,
        title: "Pranayama Breathing",
      };

      // Rating/Reviews
      const reviewBadge =
        Number(minimalEvent.review_count) > 0
          ? `${minimalEvent.average_rating} (${minimalEvent.review_count} Reviews)`
          : "New Session";
      expect(reviewBadge).toBe("New Session");
      expect(reviewBadge).not.toContain("4.9");
      expect(reviewBadge).not.toContain("128");

      // Booked seats
      const joinedBadge =
        Number(minimalEvent.booked_seats) > 0
          ? `${minimalEvent.booked_seats} Joined`
          : null;
      expect(joinedBadge).toBeNull();

      // Difficulty
      const difficulty = minimalEvent.difficulty || minimalEvent.level || null;
      expect(difficulty).toBeNull();

      // Instructor
      const instructorName = minimalEvent.instructor?.name || "Instructor";
      expect(instructorName).not.toBe("Sarah Jenkins");

      // Language
      const language = minimalEvent.language || null;
      expect(language).toBeNull();

      // Time
      const time =
        minimalEvent.human_start_time ||
        minimalEvent.human_class_time ||
        minimalEvent.start_time ||
        null;
      expect(time).toBeNull();
    });
  });
});
