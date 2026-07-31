/**
 * Centralized Checkout Redux Slice
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
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
      state.activeStep = 1;
      state.activeOrder = null;
      state.isProcessing = false;
      state.error = null;
    },
  },
});

export const {
  setBillingAddress,
  setPaymentMethod,
  setActiveStep,
  createOrderStart,
  createOrderSuccess,
  createOrderFailure,
  resetCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
