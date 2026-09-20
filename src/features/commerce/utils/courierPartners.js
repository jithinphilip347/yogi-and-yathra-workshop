/**
 * Courier partners & the shipping fee each one implies.
 *
 * The partner list is the one the E-commerce storefront offers, and the fee rule
 * mirrors E-commerce's authoritative
 * `CheckoutPricingService::shippingFeeFor($subtotal, $deliveryPartner)`.
 *
 * That mirror exists only so the checkout can show the customer a total before the
 * order is placed. E-commerce recomputes and applies the fee itself when the
 * delegated order is created — from the partner this module submits, and from its
 * own catalogue prices — so the amount actually charged never comes from here.
 * If the rule ever changes, E-commerce is the source of truth and remains correct
 * regardless of what this file says.
 */

export const COURIER_PARTNERS = [
  { value: 'speed&fast', label: 'Speed And Safe' },
  { value: 'dtdc', label: 'DTDC (Express Delivery)' },
];

/**
 * The storefront's default partner, so a customer sees the same default whichever
 * checkout they reach.
 */
export const DEFAULT_COURIER_PARTNER = 'speed&fast';

/**
 * Shipping fee for a subtotal, given the selected partner.
 *
 * Mirrors `CheckoutPricingService::shippingFeeFor()`:
 *   - E-Kart / Indian Speed Post clear at a lower subtotal than the express rates;
 *   - below the threshold the fee is partner-dependent (express costs more);
 *   - at or above the threshold, shipping is free.
 *
 * @param {number} subtotal Catalogue subtotal of the items being shipped.
 * @param {string} partner  Canonical partner value, e.g. `speed&fast`.
 * @returns {number} Fee in whole rupees.
 */
export function computeCourierFee(subtotal, partner) {
  const amount = Number(subtotal) || 0;

  if (partner === 'indianpost' || partner === 'ecart') {
    return amount < 850 ? 50 : 0;
  }

  if (amount < 2050) {
    return partner === 'dtdc' ? 60 : 50;
  }

  return 0;
}

/**
 * Customer-facing name for a partner value.
 */
export function courierPartnerLabel(value) {
  const match = COURIER_PARTNERS.find((partner) => partner.value === value);
  return match ? match.label : 'Standard Delivery';
}

/**
 * Whether a value is a partner the checkout can offer.
 *
 * Only used to repair a persisted selection; the authoritative set lives in
 * E-commerce, which rejects an unrecognised partner itself.
 */
export function isValidCourierPartner(value) {
  return COURIER_PARTNERS.some((partner) => partner.value === value);
}
