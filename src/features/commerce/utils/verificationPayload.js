/**
 * Verification payload builder (Sprint 7 — dual payment orchestration).
 *
 * Pure and dependency-free so it can be unit-tested without React/Redux.
 *
 * The client NEVER infers success from the Razorpay callback alone: the
 * backend validates the HMAC-SHA256 signature, fetches the payment from
 * Razorpay and matches the captured amount before anything is marked paid.
 * This builder simply forwards the raw provider response plus the checkout
 * correlation keys (`checkout_session_id`, `delegated_order_id`) so the
 * backend can bind the session and synchronize the delegated physical order.
 *
 * @param {object} response  Razorpay Checkout handler response
 *                           ({ razorpay_order_id, razorpay_payment_id, razorpay_signature })
 * @param {object} orderData Backend-created order payload
 *                           ({ payment, order, razorpay, key_id, checkout_session_id, ecommerce_order })
 * @returns {object} Payload for POST /payments/verify
 */
export function buildVerificationPayload(response, orderData) {
  const checkoutSessionId =
    orderData?.checkout_session_id ||
    orderData?.order?.metadata?.checkout_session_id ||
    null;

  const delegatedOrderId =
    orderData?.ecommerce_order?.id ||
    orderData?.order?.metadata?.ecommerce_order_id ||
    null;

  return {
    razorpay_order_id: response?.razorpay_order_id,
    razorpay_payment_id: response?.razorpay_payment_id,
    razorpay_signature: response?.razorpay_signature,
    payment_id: orderData?.payment?.id,
    ...(checkoutSessionId ? { checkout_session_id: checkoutSessionId } : {}),
    ...(delegatedOrderId ? { delegated_order_id: delegatedOrderId } : {}),
  };
}

export default buildVerificationPayload;
