/**
 * Centralized Checkout Redux Slice
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [], // Checkout Session snapshot (created from cart or Buy Now product)
  activeStep: 1, // 1: Order Review, 2: Student Details & Billing, 3: Payment
  billingAddress: {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  },
  paymentMethod: 'razorpay',
  activeOrder: null,
  isProcessing: false,
  error: null,
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    /**
     * Snapshot cart items (or a single Buy Now product) into a checkout session.
     * Items are shallow-copied so later in-place cart mutations never leak into
     * the independent checkout session.
     */
    createCheckout: (state, action) => {
      state.items = (action.payload || []).map((item) => ({ ...item }));
      state.activeStep = 1;
      state.activeOrder = null;
      state.isProcessing = false;
      state.error = null;
    },
    /**
     * Clear the checkout session items after a completed order.
     */
    clearCheckoutItems: (state) => {
      state.items = [];
    },
    setBillingAddress: (state, action) => {
      state.billingAddress = { ...state.billingAddress, ...action.payload };
    },
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },
    setActiveStep: (state, action) => {
      state.activeStep = action.payload;
    },
    createOrderStart: (state) => {
      state.isProcessing = true;
      state.error = null;
    },
    createOrderSuccess: (state, action) => {
      state.isProcessing = false;
      state.activeOrder = action.payload;
      state.activeStep = 3;
    },
    createOrderFailure: (state, action) => {
      state.isProcessing = false;
      state.error = action.payload;
    },
    resetCheckout: (state) => {
      state.items = [];
      state.activeStep = 1;
      state.activeOrder = null;
      state.isProcessing = false;
      state.error = null;
    },
  },
});

export const {
  createCheckout,
  clearCheckoutItems,
  setBillingAddress,
  setPaymentMethod,
  setActiveStep,
  createOrderStart,
  createOrderSuccess,
  createOrderFailure,
  resetCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
