/**
 * Centralized Checkout Redux Slice
 */

import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_COURIER_PARTNER } from '../utils/courierPartners';

const initialState = {
  sessionId: null, // Unified Checkout Session ID (correlates Workshop & E-commerce orders)
  items: [], // Checkout Session snapshot (created from cart or Buy Now product)
  activeStep: 1, // 1: Order Review, 2: Student Details & Shipping/Billing, 3: Payment
  billingAddress: {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
  },
  shippingAddress: {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
  },
  sameAsBilling: true,
  // Courier partner for the physical portion of this checkout. The fee it implies
  // is never stored — it is derived from the catalogue subtotal, and E-commerce
  // remains authoritative for what is actually charged.
  courierPartner: DEFAULT_COURIER_PARTNER,
  paymentMethod: 'razorpay',
  activeOrder: null,
  delegatedPhysicalOrder: null,
  ecommerceCustomer: {
    id: null,
    email: '',
    name: '',
    status: null, // 'existing' | 'created'
  },
  isDelegating: false,
  delegationError: null,
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
      const payload = action.payload;
      const rawItems = Array.isArray(payload) ? payload : (payload?.items || []);
      state.items = rawItems.map((item) => ({ ...item }));
      state.sessionId = (!Array.isArray(payload) && payload?.sessionId)
        ? payload.sessionId
        : `cs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      state.activeStep = 1;
      state.activeOrder = null;
      state.delegatedPhysicalOrder = null;
      state.ecommerceCustomer = { id: null, email: '', name: '', status: null };
      state.courierPartner = DEFAULT_COURIER_PARTNER;
      state.isDelegating = false;
      state.delegationError = null;
      state.isProcessing = false;
      state.error = null;
    },
    /**
     * Clear the checkout session items after a completed order.
     */
    clearCheckoutItems: (state) => {
      state.items = [];
      state.sessionId = null;
      state.delegatedPhysicalOrder = null;
      state.ecommerceCustomer = { id: null, email: '', name: '', status: null };
    },
    setBillingAddress: (state, action) => {
      state.billingAddress = { ...state.billingAddress, ...action.payload };
      if (state.sameAsBilling) {
        state.shippingAddress = { ...state.shippingAddress, ...action.payload };
      }
    },
    setShippingAddress: (state, action) => {
      state.shippingAddress = { ...state.shippingAddress, ...action.payload };
    },
    setSameAsBilling: (state, action) => {
      state.sameAsBilling = action.payload;
      if (action.payload) {
        state.shippingAddress = { ...state.billingAddress };
      }
    },
    setCourierPartner: (state, action) => {
      state.courierPartner = action.payload;
    },
    setEcommerceCustomer: (state, action) => {
      state.ecommerceCustomer = { ...state.ecommerceCustomer, ...action.payload };
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
    delegateOrderStart: (state) => {
      state.isDelegating = true;
      state.delegationError = null;
    },
    delegateOrderSuccess: (state, action) => {
      state.isDelegating = false;
      const payload = action.payload || {};
      state.delegatedPhysicalOrder = payload.order || payload;
      if (payload.customer || payload.customer_account_status) {
        state.ecommerceCustomer = {
          ...(payload.customer || {}),
          status: payload.customer_account_status || 'resolved',
        };
      }
    },
    delegateOrderFailure: (state, action) => {
      state.isDelegating = false;
      state.delegationError = action.payload;
    },
    resetCheckout: (state) => {
      state.sessionId = null;
      state.items = [];
      state.activeStep = 1;
      state.activeOrder = null;
      state.delegatedPhysicalOrder = null;
      state.ecommerceCustomer = { id: null, email: '', name: '', status: null };
      state.courierPartner = DEFAULT_COURIER_PARTNER;
      state.isDelegating = false;
      state.delegationError = null;
      state.isProcessing = false;
      state.error = null;
    },
  },
});

export const {
  createCheckout,
  clearCheckoutItems,
  setBillingAddress,
  setShippingAddress,
  setSameAsBilling,
  setCourierPartner,
  setEcommerceCustomer,
  setPaymentMethod,
  setActiveStep,
  createOrderStart,
  createOrderSuccess,
  createOrderFailure,
  delegateOrderStart,
  delegateOrderSuccess,
  delegateOrderFailure,
  resetCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
