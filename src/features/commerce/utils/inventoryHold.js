/**
 * Inventory-hold release for abandoned checkouts (Sprint 8).
 *
 * The E-commerce backend is the only physical-inventory authority. Workshop
 * merely *asks* it to release a hold it created for a checkout session, and the
 * server decides whether that is allowed (ownership, not-already-paid) and
 * whether anything was actually held.
 *
 * Two invariants live here, so they are testable in isolation:
 *
 *   1. AT MOST ONE release request per checkout attempt — a re-fired Razorpay
 *      `ondismiss` / `payment.failed` callback must not issue a second request.
 *   2. The request is fire-and-forget. A failed, refused, or timed-out release
 *      changes nothing in the UI; the server-side reservation TTL reclaims the
 *      units on its own.
 *
 * Neither the response nor a local timer is ever treated as inventory truth.
 */

export const RELEASE_REASON_CHECKOUT_CANCELLED = 'checkout_cancelled';
export const RELEASE_REASON_PAYMENT_FAILED = 'payment_failed';

/**
 * @param {(checkoutSessionId: string, reason: string) => Promise<any>} release
 *        Transport that asks the Workshop backend to release the hold
 *        (normally `commerceApi.releaseInventory`).
 */
export function createInventoryHoldReleaser(release) {
  let released = false;

  return {
    /**
     * Ask the backend to release this session's hold.
     *
     * @returns {Promise<any>} Always resolves — never rejects, never throws, so
     *          callers can invoke it straight from a browser callback.
     */
    release(checkoutSessionId, reason = RELEASE_REASON_CHECKOUT_CANCELLED) {
      // A learning-only checkout returns no session-bound physical order, so
      // there is nothing to release and no request to make.
      if (!checkoutSessionId || released) {
        return Promise.resolve(null);
      }

      released = true;

      return Promise.resolve()
        .then(() => release(checkoutSessionId, reason))
        .catch(() => null);
    },

    alreadyReleased() {
      return released;
    },

    reset() {
      released = false;
    },
  };
}
