/**
 * Centralized Payment Gateway Redux Slice
 */

import { createSlice } from '@reduxjs/toolkit';
import { setLogin, logout } from '../../auth/authSlice';

const initialState = {
  status: 'idle', // 'idle' | 'initiating' | 'verifying' | 'completed' | 'failed'
  activeTransactionId: null,
  verificationData: null,
  paymentError: null,
  receipt: null,
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    startPayment: (state) => {
      state.status = 'initiating';
      state.paymentError = null;
    },
    startVerification: (state) => {
      state.status = 'verifying';
    },
    paymentSuccess: (state, action) => {
      state.status = 'completed';
      state.verificationData = action.payload;
      state.activeTransactionId = action.payload.payment_id || action.payload.id;
      state.receipt = action.payload.receipt || null;
      state.paymentError = null;
    },
    paymentFailure: (state, action) => {
      state.status = 'failed';
      state.paymentError = action.payload;
    },
    resetPaymentState: (state) => {
      state.status = 'idle';
      state.activeTransactionId = null;
      state.verificationData = null;
      state.paymentError = null;
      state.receipt = null;
    },
  },
  extraReducers: (builder) => {
    // A previous account's payment result must not be visible in a new session.
    builder
      .addCase(setLogin, () => initialState)
      .addCase(logout, () => initialState);
  },
});

export const {
  startPayment,
  startVerification,
  paymentSuccess,
  paymentFailure,
  resetPaymentState,
} = paymentSlice.actions;

export default paymentSlice.reducer;
