/**
 * Commerce API Client Service
 *
 * Consumes backend Billing & Payment endpoints without duplicating backend logic.
 */

import axios from 'axios';
import { store } from '../../../../store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
};
