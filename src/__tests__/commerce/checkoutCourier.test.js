import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import checkoutReducer, {
  createCheckout,
  setCourierPartner,
  setBillingAddress,
  resetCheckout,
  delegateOrderSuccess,
} from "@/features/commerce/slices/checkoutSlice";
import {
  COURIER_PARTNERS,
  DEFAULT_COURIER_PARTNER,
  computeCourierFee,
  courierPartnerLabel,
  isValidCourierPartner,
} from "@/features/commerce/utils/courierPartners";

/**
 * Courier selection & shipping fee.
 *
 * The fee rule belongs to E-commerce (`CheckoutPricingService::shippingFeeFor`).
 * The frontend mirrors it only to show a total before the order is placed, so the
 * first group below pins the mirror to the authoritative rule — the values are the
 * ones exercised against the real service, not invented ones. The remaining groups
 * are source assertions, because this suite runs without jsdom.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (...segments) =>
  fs.readFileSync(path.resolve(__dirname, ...segments), "utf8");

const checkoutJsx = read("../../app/checkout/Checkout.jsx");
const useCheckoutJs = read("../../features/commerce/hooks/useCheckout.js");
const checkoutScss = read("../../assets/css/checkout.scss");
const styleScss = read("../../assets/css/style.scss");

/** The slice of `source` between two markers, exclusive of the end marker. */
const between = (source, startMarker, endMarker) => {
  const start = source.indexOf(startMarker);
  expect(start).toBeGreaterThan(-1);
  const end = source.indexOf(endMarker, start);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
};

describe("Courier fee mirrors the E-commerce rule", () => {
  it("offers exactly the partners the E-commerce storefront offers", () => {
    expect(COURIER_PARTNERS).toEqual([
      { value: "speed&fast", label: "Speed And Safe" },
      { value: "dtdc", label: "DTDC (Express Delivery)" },
    ]);
    expect(DEFAULT_COURIER_PARTNER).toBe("speed&fast");
  });

  it("charges the express partner more below the free-shipping threshold", () => {
    // Matches CheckoutPricingService::shippingFeeFor(): below 2050 the express
    // rate costs 60 and every other partner 50.
    expect(computeCourierFee(500, "speed&fast")).toBe(50);
    expect(computeCourierFee(1598, "speed&fast")).toBe(50);
    expect(computeCourierFee(500, "dtdc")).toBe(60);
    expect(computeCourierFee(1598, "dtdc")).toBe(60);
  });

  it("ships free at or above the threshold", () => {
    expect(computeCourierFee(2049, "speed&fast")).toBe(50);
    expect(computeCourierFee(2050, "speed&fast")).toBe(0);
    expect(computeCourierFee(2700, "dtdc")).toBe(0);
  });

  it("gives the bulk partners their own lower threshold", () => {
    // E-Kart and Indian Speed Post clear at 850, not 2050.
    expect(computeCourierFee(800, "ecart")).toBe(50);
    expect(computeCourierFee(850, "ecart")).toBe(0);
    expect(computeCourierFee(800, "indianpost")).toBe(50);
    expect(computeCourierFee(850, "indianpost")).toBe(0);
  });

  it("treats a missing or malformed subtotal as zero rather than NaN", () => {
    expect(computeCourierFee(undefined, "speed&fast")).toBe(50);
    expect(computeCourierFee(null, "dtdc")).toBe(60);
    expect(computeCourierFee("not-a-number", "speed&fast")).toBe(50);
  });

  it("resolves a label for known partners and never throws for unknown ones", () => {
    expect(courierPartnerLabel("speed&fast")).toBe("Speed And Safe");
    expect(courierPartnerLabel("dtdc")).toBe("DTDC (Express Delivery)");
    expect(courierPartnerLabel("ecart")).toBe("Standard Delivery");
    expect(isValidCourierPartner("dtdc")).toBe(true);
    expect(isValidCourierPartner("blue-dart")).toBe(false);
  });
});

describe("Courier selection state", () => {
  it("defaults to the storefront default", () => {
    const state = checkoutReducer(undefined, { type: "@@INIT" });
    expect(state.courierPartner).toBe(DEFAULT_COURIER_PARTNER);
  });

  it("stores the selected partner", () => {
    const state = checkoutReducer(undefined, setCourierPartner("dtdc"));
    expect(state.courierPartner).toBe("dtdc");
  });

  it("returns to the default for a new checkout session", () => {
    let state = checkoutReducer(undefined, setCourierPartner("dtdc"));
    state = checkoutReducer(state, setBillingAddress({ city: "Kochi" }));
    state = checkoutReducer(state, createCheckout([{ id: 1, type: "product" }]));

    expect(state.courierPartner).toBe(DEFAULT_COURIER_PARTNER);
  });

  it("returns to the default after the checkout is reset", () => {
    let state = checkoutReducer(undefined, setCourierPartner("dtdc"));
    state = checkoutReducer(state, resetCheckout());

    expect(state.courierPartner).toBe(DEFAULT_COURIER_PARTNER);
  });

  it("survives an unrelated state update, so the choice is not lost mid-checkout", () => {
    let state = checkoutReducer(undefined, setCourierPartner("dtdc"));
    state = checkoutReducer(state, delegateOrderSuccess({ order: { id: 5 } }));

    expect(state.courierPartner).toBe("dtdc");
  });
});

describe("Checkout payload", () => {
  it("sends the partner, never a fee the server would have to trust", () => {
    expect(useCheckoutJs).toContain("delivery_partner: courierPartner");

    // The fee is derived by E-commerce from the catalogue subtotal. Forwarding a
    // client-side amount would let the browser — or this app — decide what
    // shipping costs.
    expect(useCheckoutJs).not.toMatch(/shipping_fee/);
  });

  it("derives the displayed fee from the physical items only", () => {
    // A learning product is not shipped, so its price must not push a shipment
    // over the free-shipping threshold.
    expect(useCheckoutJs).toMatch(
      /physicalSubtotal\s*=\s*classifiedItems\.ecommerceItems\.reduce/
    );
    expect(useCheckoutJs).toMatch(
      /computeCourierFee\(physicalSubtotal,\s*courierPartner\)/
    );
  });

  it("shows no courier fee at all for a cart with nothing to ship", () => {
    expect(useCheckoutJs).toMatch(
      /courierFee\s*=\s*classifiedItems\.hasPhysicalItems\s*\?\s*computeCourierFee/
    );
  });
});

describe("Checkout page", () => {
  it("renders the courier options from the shared partner list", () => {
    expect(checkoutJsx).toContain('className="CourierSelector"');
    expect(checkoutJsx).toContain("COURIER_PARTNERS.map");
    expect(checkoutJsx).toContain('name="courier-partner"');
    expect(checkoutJsx).toContain("changeCourierPartner(partner.value)");
  });

  it("places the courier choice in the delivery step, not in the order summary", () => {
    // The E-commerce checkout renders its partner picker inside the delivery
    // information form, so the Workshop keeps it with the shipping address.
    const shippingSection = between(
      checkoutJsx,
      "Shipping Address (for Physical Delivery)",
      '<div className="FormActions">'
    );
    expect(shippingSection).toContain('className="CourierSelector"');

    const summary = checkoutJsx.slice(checkoutJsx.indexOf('className="SummaryCard"'));
    expect(summary).not.toContain("CourierSelector");
  });

  it("shows the partner on the courier fee line and adds the fee to the total", () => {
    expect(checkoutJsx).toMatch(/Courier Fee \(\{courierPartnerLabel\(courierPartner\)\}\)/);
    expect(checkoutJsx).toMatch(/courierFee === 0 \? 'Free'/);
    expect(checkoutJsx).toMatch(/\+ courierFee\)/);
  });
});

describe("Sticky order summary", () => {
  const rightColumn = between(checkoutScss, ".CheckoutRight {", ".SummaryCard {");

  it("sticks the summary column rather than the card inside it", () => {
    // The container is `align-items: flex-start`, so the card shrink-wraps to its
    // own height and a sticky card has no room to travel — the rule would look
    // correct and do nothing.
    expect(rightColumn).toMatch(/position:\s*sticky/);
    expect(checkoutScss).not.toMatch(
      /\.SummaryCard\s*\{[^}]*position:\s*sticky/
    );
  });

  it("offsets the sticky column clear of the site header", () => {
    const stickyTop = Number(rightColumn.match(/top:\s*(\d+)px/)?.[1]);
    const navHeight = Number(
      styleScss.slice(styleScss.indexOf("#Nav {")).match(/height:\s*(\d+)px/)?.[1]
    );

    expect(stickyTop).toBeGreaterThan(navHeight);
  });

  it("drops back into normal flow on mobile so it cannot cover the form", () => {
    expect(rightColumn).toMatch(
      /@media \(max-width: 768px\)\s*\{[^}]*position:\s*static/
    );
    expect(rightColumn).toMatch(/@media \(max-width: 768px\)\s*\{[^}]*width:\s*100%/
    );
  });
});

describe("API boundary", () => {
  it("never reaches E-commerce directly from the courier UI", () => {
    const courierSources = [checkoutJsx, useCheckoutJs];

    for (const source of courierSources) {
      expect(source).not.toMatch(/X-Internal-Service-Key/);
      expect(source).not.toMatch(/\/internal\/v1/);
      expect(source).not.toMatch(/yogiandyathra/);
    }
  });
});
