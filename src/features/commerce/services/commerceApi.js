/**
 * Commerce API Client Service
 *
 * Consumes backend Billing & Payment endpoints without duplicating backend logic.
 */

import axios from 'axios';
import { store } from '../../../../store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

const getAuthHeaders = () => {
  const token = store.getState()?.auth?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const commerceApi = {
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
   * Verify Razorpay Payment Signature
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
