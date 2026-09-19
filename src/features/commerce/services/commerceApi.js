/**
 * Commerce API Client Service
 *
 * Consumes backend Billing & Payment endpoints without duplicating backend logic.
 */

import axios from 'axios';
import { store } from '../../../../store';
import { normalizeItemType } from '../utils/cartClassification';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const getAuthHeaders = () => {
  const token = store.getState()?.auth?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const commerceApi = {
  /**
   * Authoritative Live Cart Validation across Workshop & E-commerce domains
   */
  async validateCart(items = []) {
    const formattedItems = (items || []).map((item) => ({
      cart_key: item.cart_key || undefined,
      // Canonicalised via the shared classifier so a legacy/variant spelling
      // (`ComboProduct`, `combo_product`) reaches the backend as `combo` instead
      // of being rejected as an unsupported item type.
      type: normalizeItemType(item.productable_type || item.type || 'course'),
      id: item.productable_id ?? item.id ?? item.value,
      quantity: item.quantity || 1,
      price: Number(item.price || 0),
    }));

    const res = await axios.post(
      `${API_BASE_URL}/cart/validate`,
      { items: formattedItems },
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  /**
   * Validate a promotional coupon code against backend Coupon Engine
   */
  async validateCoupon(code, amount = 0, userId = null) {
    const res = await axios.post(
      `${API_BASE_URL}/billing/coupons/validate`,
      { code, amount, user_id: userId },
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  /**
   * Create a new Billing Order via backend Order Engine
   */
  async createOrder(orderPayload) {
    const res = await axios.post(
      `${API_BASE_URL}/payments/orders`,
      orderPayload,
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  /**
   * Delegate physical product order creation to E-commerce backend (Sprint 5)
   */
  async delegatePhysicalOrder(payload) {
    const res = await axios.post(
      `${API_BASE_URL}/checkout/delegate-physical-order`,
      payload,
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  /**
   * Create a UNIFIED checkout order (learning + delegated physical) — Sprint 7.
   *
   * The backend resolves learning pricing from the Workshop database, verifies
   * the delegated physical order against the e-commerce store, and creates the
   * Razorpay order backend-only. The browser receives only the public
   * `order_id` + `key_id` (zero secret leakage).
   */
  async createUnifiedOrder(payload) {
    const res = await axios.post(
      `${API_BASE_URL}/payments/unified-order`,
      payload,
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  /**
   * Verify Razorpay Payment Signature
   *
   * `checkout_session_id` and `delegated_order_id` are forwarded (when known)
   * so the backend can bind the payment to the originating checkout session and
   * synchronize the delegated physical order during verification.
   */
  async verifyPayment(paymentPayload) {
    const res = await axios.post(
      `${API_BASE_URL}/payments/verify`,
      paymentPayload,
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  /**
   * Release the physical inventory hold for an abandoned checkout (Sprint 8).
   *
   * Best-effort only: the backend proves ownership of the checkout session,
   * refuses to release an already-paid order, and is idempotent, so this is safe
   * to fire on every dismissal. If the call never lands, the E-commerce
   * reservation TTL reclaims the units anyway. The browser never talks to
   * E-commerce inventory directly.
   */
  async releaseInventory(checkoutSessionId, reason = 'checkout_cancelled') {
    const res = await axios.post(
      `${API_BASE_URL}/payments/release-inventory`,
      { checkout_session_id: checkoutSessionId, reason },
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  /**
   * Convert Academic Fee Demand into a Billing Order
   */
  async checkoutFeeDemand(feeCollectionId, couponCode = null) {
    const res = await axios.post(
      `${API_BASE_URL}/fee-collections/${feeCollectionId}/checkout-order`,
      { coupon_code: couponCode },
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  // ─── Subscription (Daily Class AutoPay) ──────────────────────────

  /**
   * Create a Daily Class subscription (server resolves pricing plan,
   * creates the Razorpay plan + subscription, returns the AutoPay payload).
   */
  async createSubscription({ daily_class_id, pricing_plan_id, user_id }) {
    const res = await axios.post(
      `${API_BASE_URL}/subscriptions/create`,
      { daily_class_id, pricing_plan_id, user_id },
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  /**
   * Activate a subscription after the AutoPay mandate is authorized.
   * The backend verifies the actual Razorpay subscription state before
   * activating — the frontend callback is never the source of truth.
   */
  async activateSubscription({ subscription_id, razorpay_subscription_id }) {
    const res = await axios.post(
      `${API_BASE_URL}/subscriptions/activate`,
      { subscription_id, razorpay_subscription_id },
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  /**
   * Fetch the current subscription + access state for a Daily Class
   * (used on page load / return from the AutoPay checkout).
   */
  async getSubscriptionStatus(dailyClassId) {
    const res = await axios.get(
      `${API_BASE_URL}/subscriptions/status`,
      { params: { daily_class_id: dailyClassId }, headers: getAuthHeaders() }
    );
    return res.data;
  },

  /**
   * Cancel a subscription (ownership verified server-side).
   */
  async cancelSubscription(subscriptionId, reason = null) {
    const res = await axios.post(
      `${API_BASE_URL}/subscriptions/${subscriptionId}/cancel`,
      { reason },
      { headers: getAuthHeaders() }
    );
    return res.data;
  },
};
