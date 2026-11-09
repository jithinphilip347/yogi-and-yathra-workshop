import { describe, expect, it } from "vitest";
import { adaptTravelPackage } from "@/services/travelPackageApi";

describe("travel package public data adapter", () => {
  it("maps saved package fields and uses a discount only when it is lower than the regular price", () => {
    const travel = adaptTravelPackage({
      id: 42,
      title: "Mountain retreat",
      category: "yoga_retreat",
      short_description: "A quiet guided journey.",
      thumbnail: "travel/mountains.webp",
      start_date: "2027-02-10",
      end_date: "2027-02-14",
      duration_days: 5,
      duration_nights: 4,
      price_per_person: "45000.00",
      discount_price: "42000.00",
      total_slots: 18,
      booked_slots: 7,
      available_slots: 11,
      public_booking_status: "open",
    });
    expect(travel.title).toBe("Mountain retreat");
    expect(travel.description).toBe("A quiet guided journey.");
    expect(travel.categoryName).toBe("Yoga Retreat");
    expect(travel.duration).toBe("5 Days / 4 Nights");
    expect(travel.effectivePrice).toBe(42000);
    expect(travel.originalPrice).toBe("45,000");
    expect(travel.availableSlots).toBe(11);
    expect(travel.link).toBe("/travel/travel-details?id=42");
  });

  it("does not show an invalid or non-discount price as a discount", () => {
    const travel = adaptTravelPackage({ id: 5, price_per_person: 1000, discount_price: 1200 });
    expect(travel.effectivePrice).toBe(1000);
    expect(travel.hasDiscount).toBe(false);
    expect(travel.originalPrice).toBe("");
    expect(travel.image).toBe("");
  });
});
