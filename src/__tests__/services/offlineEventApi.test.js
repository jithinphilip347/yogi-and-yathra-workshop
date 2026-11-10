import { describe, expect, it } from "vitest";
import { adaptOfflineEvent, formatOfflineEventStatus } from "@/services/offlineEventApi";

describe("offline event public data adapter", () => {
  it("maps backend event fields and links using the public slug", () => {
    const event = adaptOfflineEvent({
      id: 42,
      slug: "breathwork-workshop",
      title: "Breathwork workshop",
      category: "Workshop",
      thumbnail: "events/breathwork.webp",
      event_start_date: "2027-02-10",
      event_end_date: "2027-02-12",
      daily_start_time: "09:00:00",
      daily_end_time: "11:00:00",
      duration_minutes: 120,
      venue_name: "City Hall",
      address: "Central Bengaluru",
      ticket_price: "1500.00",
      available_seats: 8,
      public_booking_status: "almost_full",
    });

    expect(event.date).toContain("10 Feb 2027");
    expect(event.duration).toBe("3 Days · 120 min/session");
    expect(event.price).toBe("1,500");
    expect(event.seats).toBe("8 Seats Left");
    expect(event.status).toBe("Almost Full");
    expect(event.link).toBe("/event/breathwork-workshop");
    expect(event.image).toContain("events/breathwork.webp");
  });

  it("maps public booking states without inventing a fallback status", () => {
    expect(formatOfflineEventStatus("open")).toBe("Booking Open");
    expect(formatOfflineEventStatus("closed")).toBe("Registration Closed");
    expect(formatOfflineEventStatus("upcoming")).toBe("Registration Upcoming");
    expect(formatOfflineEventStatus("full")).toBe("Fully Booked");
  });
});
