/**
 * Checkout success — confirmed-order view model (WORKSHOP-DS-07B).
 *
 * WHERE THE DATA COMES FROM, AND WHY IT IS ONLY THIS
 * --------------------------------------------------
 * `usePayment` dispatches `clearCheckoutItems()` BEFORE
 * `router.replace('/checkout/success')`, and that reducer empties `items`, nulls
 * `delegatedPhysicalOrder` and resets `ecommerceCustomer`. So by the time this
 * page renders, the basket, the courier fee and the delegated order are
 * deliberately gone. The only commerce state that survives is:
 *
 *   checkout.activeOrder        the server's unified-order payload
 *   checkout.courierPartner     the chosen partner value
 *   payment.*                   status, activeTransactionId, verificationData
 *
 * `activeOrder` is rich enough to carry the whole confirmation: the backend
 * (`CheckoutController::createUnifiedOrder`) returns `domain`, `order`,
 * `payment`, `amounts` and `ecommerce_order`. Nothing below invents a field or
 * calls a new endpoint; anything not in that payload is simply not shown.
 *
 * THE MONEY, AND WHY THE GROSS IS RECONSTRUCTED
 * --------------------------------------------
 * The backend computes:
 *
 *     $learningPayable = max(0, $regularPrice - $discount - $couponDiscount)
 *     $totalPayable    = round($learningPayable + $physicalTotal, 2)
 *
 * and stores `order.subtotal = $learningPayable` — i.e. **already net** of both
 * discounts — with `order.discount_amount` and `order.coupon_discount` recorded
 * beside it. Printing `subtotal` next to those discounts would double-count them
 * and the rows would visibly fail to add up to the total. So the gross learning
 * price is reconstructed as `subtotal + discount + coupon_discount`, which makes
 * the table reconcile exactly. `buildConfirmationSummary` proves it reconciles
 * and degrades to a single Total row if it ever does not.
 */

export const CONFIRMATION_STATE = {
  CONFIRMED: 'confirmed',
  UNCONFIRMED: 'unconfirmed',
  NONE: 'none',
};

export const CONFIRMATION_DOMAIN = {
  LEARNING: 'learning',
  PHYSICAL: 'physical',
  MIXED: 'mixed',
};

/**
 * Real destinations only. There is no `/orders` or `/invoices` route in this
 * app, so "view your order" resolves to the profile's Billing & Invoices tab
 * (`Profile.jsx` normalises `billing` / `invoices` to that tab) rather than to a
 * page that does not exist.
 */
export const CONFIRMATION_ROUTES = {
  myCourses: '/auth/profile?tab=my-courses',
  billing: '/auth/profile?tab=billing',
  continueShopping: '/course',
};

/** Whether there is anything to confirm, and how strong that evidence is. */
export function confirmationState({ paymentStatus, activeOrder } = {}) {
  if (paymentStatus === 'completed') return CONFIRMATION_STATE.CONFIRMED;
  if (activeOrder) return CONFIRMATION_STATE.UNCONFIRMED;
  return CONFIRMATION_STATE.NONE;
}

/** Which leg(s) of the checkout this order covers. */
export function confirmationDomain(activeOrder) {
  const labelled = activeOrder?.domain;
  if (
    labelled === CONFIRMATION_DOMAIN.LEARNING ||
    labelled === CONFIRMATION_DOMAIN.PHYSICAL ||
    labelled === CONFIRMATION_DOMAIN.MIXED
  ) {
    return labelled;
  }

  // Never trust the label alone — fall back to the amounts actually present.
  const hasLearning = Number(activeOrder?.order?.subtotal || 0) > 0;
  const hasPhysical = physicalAmount(activeOrder) > 0;
  if (hasLearning && hasPhysical) return CONFIRMATION_DOMAIN.MIXED;
  if (hasPhysical) return CONFIRMATION_DOMAIN.PHYSICAL;
  if (hasLearning) return CONFIRMATION_DOMAIN.LEARNING;
  return null;
}

/** The physical leg's total, as the server reported it. */
export function physicalAmount(activeOrder) {
  if (!activeOrder) return 0;
  if (activeOrder.amounts && activeOrder.amounts.physical != null) {
    return Number(activeOrder.amounts.physical) || 0;
  }
  return Number(activeOrder.ecommerce_order?.total) || 0;
}

/**
 * The Order Summary rows, guaranteed to sum to the server's total.
 *
 * Returns `rows: []` for an unknown order — the caller shows the state card
 * instead, never an empty table of zeroes.
 */
export function buildConfirmationSummary(activeOrder) {
  const order = activeOrder?.order || {};
  const learningNet = Number(order.subtotal || 0);
  const catalogueDiscount = Number(order.discount || 0);
  const couponDiscount = Number(order.coupon_discount || 0);
  const physical = physicalAmount(activeOrder);
  const total = Number(order.amount ?? activeOrder?.amounts?.total ?? 0);
  const currency = order.currency || 'INR';

  const base = { currency, learningNet, catalogueDiscount, couponDiscount, physical, total };

  if (!activeOrder) return { ...base, rows: [], reconciles: false };

  const rows = [];

  // Only present the gross list price when something was genuinely payable for
  // the learning leg. A fully-discounted order (subtotal clamped to 0) would
  // otherwise print a list price larger than the single discount that produced
  // it, which reads as an error.
  if (learningNet > 0) {
    rows.push({
      key: 'learning',
      label: 'Learning Program',
      amount: learningNet + catalogueDiscount + couponDiscount,
      kind: 'charge',
    });
    if (catalogueDiscount > 0) {
      rows.push({
        key: 'catalogue-discount',
        label: 'Catalogue Discount',
        amount: -catalogueDiscount,
        kind: 'discount',
      });
    }
    if (couponDiscount > 0) {
      rows.push({
        key: 'coupon-discount',
        label: 'Coupon Discount',
        amount: -couponDiscount,
        kind: 'discount',
      });
    }
  }

  if (physical > 0) {
    rows.push({ key: 'physical', label: 'Physical Items', amount: physical, kind: 'charge' });
  }

  const summed = rows.reduce((acc, row) => acc + row.amount, 0);
  const reconciles = Math.round(summed * 100) === Math.round(total * 100);

  // A table that does not add up is worse than no table. If the reconstruction
  // ever disagrees with the server's total, show only the total.
  if (!reconciles) {
    return {
      ...base,
      rows: [{ key: 'total-only', label: 'Total Paid', amount: total, kind: 'charge' }],
      reconciles: false,
    };
  }

  return { ...base, rows, reconciles: true };
}

/** Order references, with no placeholder fallbacks that could fake a success. */
export function confirmationReferences({ activeOrder, transactionId } = {}) {
  return {
    orderNumber:
      activeOrder?.order?.order_number || activeOrder?.order_number || activeOrder?.id || null,
    transactionId: transactionId || null,
    physicalOrderId: activeOrder?.ecommerce_order?.id || null,
    physicalOrderStatus: activeOrder?.ecommerce_order?.status ?? null,
    paymentStatus: activeOrder?.payment?.status || null,
    paymentGateway: activeOrder?.payment?.gateway || null,
  };
}

/** The next-step copy and the one primary action, derived from the domain. */
export function buildNextSteps(domain) {
  const steps = [];

  if (domain === CONFIRMATION_DOMAIN.LEARNING || domain === CONFIRMATION_DOMAIN.MIXED) {
    steps.push({
      key: 'learning',
      title: 'Your learning access is ready',
      body: 'The courses and classes in this order are already in your library. Open My Courses to begin.',
      action: { label: 'Start Learning', href: CONFIRMATION_ROUTES.myCourses, primary: true },
    });
  }

  if (domain === CONFIRMATION_DOMAIN.PHYSICAL || domain === CONFIRMATION_DOMAIN.MIXED) {
    steps.push({
      key: 'physical',
      title: 'Your items are being prepared',
      body: 'The physical part of this order has been sent to the store for fulfilment. Delivery updates are emailed to the address on the order.',
      action: { label: 'Continue Shopping', href: CONFIRMATION_ROUTES.continueShopping, primary: false },
    });
  }

  return steps;
}

/**
 * `pending_fulfillment` -> `Pending Fulfillment`.
 *
 * The gateway and store statuses are machine enums, and printing
 * `PENDING_FULFILLMENT` in a customer-facing badge is not an answer. This only
 * reformats the words the server sent — it never maps one status onto another,
 * so nothing is claimed that the payload does not say.
 */
export function humanizeStatus(value) {
  if (value == null || value === '') return null;
  return String(value)
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Currency formatting, in one place so every row and total agrees. */
export function formatAmount(amount, currency = 'INR') {
  const value = Number(amount) || 0;
  const sign = value < 0 ? '-' : '';
  const body = Math.abs(value).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });
  return `${sign}${currency === 'INR' ? '₹' : `${currency} `}${body}`;
}
