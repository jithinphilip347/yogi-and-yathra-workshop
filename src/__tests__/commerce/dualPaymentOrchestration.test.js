import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { commerceApi } from '@/features/commerce/services/commerceApi';
import { buildVerificationPayload } from '@/features/commerce/utils/verificationPayload';
import paymentReducer, {
  startPayment,
  startVerification,
  paymentSuccess,
  paymentFailure,
  resetPaymentState,
} from '@/features/commerce/slices/paymentSlice';

vi.mock('axios');

describe('Sprint 7 — Dual Razorpay Payment Orchestration (frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildVerificationPayload — signature forwarding', () => {
    it('forwards the raw signature + payment id and binds the checkout session for mixed carts', () => {
      const response = {
        razorpay_order_id: 'order_MIXED123',
        razorpay_payment_id: 'pay_MIXED456',
        razorpay_signature: 'sig_hmac_digest',
      };

      const orderData = {
        checkout_session_id: 'cs_mixed_1',
        domain: 'mixed',
        payment: { id: 42, amount: 1698 },
        ecommerce_order: { id: 88, total: 499 },
      };

      const payload = buildVerificationPayload(response, orderData);

      expect(payload).toEqual({
        razorpay_order_id: 'order_MIXED123',
        razorpay_payment_id: 'pay_MIXED456',
        razorpay_signature: 'sig_hmac_digest',
        payment_id: 42,
        checkout_session_id: 'cs_mixed_1',
        delegated_order_id: 88,
      });
    });

    it('omits delegated_order_id for learning-only carts', () => {
      const payload = buildVerificationPayload(
        {
          razorpay_order_id: 'order_LEARN1',
          razorpay_payment_id: 'pay_LEARN1',
          razorpay_signature: 'sig_learn',
        },
        {
          checkout_session_id: 'cs_learning_1',
          domain: 'learning',
          payment: { id: 7 },
          ecommerce_order: null,
        }
      );

      expect(payload.payment_id).toBe(7);
      expect(payload.checkout_session_id).toBe('cs_learning_1');
      expect(payload).not.toHaveProperty('delegated_order_id');
    });

    it('still forwards the signature when only provider fields are present', () => {
      const payload = buildVerificationPayload(
        {
          razorpay_order_id: 'order_X',
          razorpay_payment_id: 'pay_X',
          razorpay_signature: 'sig_X',
        },
        { payment: { id: 5 } }
      );

      // The signature is always sent — the client never self-verifies.
      expect(payload.razorpay_signature).toBe('sig_X');
      expect(payload.payment_id).toBe(5);
      expect(payload).not.toHaveProperty('checkout_session_id');
    });
  });

  describe('commerceApi.createUnifiedOrder', () => {
    it('posts the unified payload to /payments/unified-order', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            checkout_session_id: 'cs_mixed_2',
            domain: 'mixed',
            order: { id: 501, amount: 1698, order_number: 'ORD-2026-00001' },
            payment: { id: 900, amount: 1698 },
            razorpay: { id: 'order_rzp_501', amount: 169800, currency: 'INR' },
            key_id: 'rzp_test_key',
            ecommerce_order: { id: 77, total: 499 },
            amounts: { learning: 1199, physical: 499, total: 1698 },
          },
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      const payload = {
        checkout_session_id: 'cs_mixed_2',
        product_type: 'course',
        product_id: 12,
        ecommerce_order_id: 77,
        coupon_code: null,
        billing_address: { city: 'Kochi' },
        payment_method: 'razorpay',
      };

      const result = await commerceApi.createUnifiedOrder(payload);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/payments/unified-order'),
        payload,
        expect.any(Object)
      );

      // The backend response is the single source of truth for the Razorpay payload.
      expect(result.data.razorpay.id).toBe('order_rzp_501');
      expect(result.data.payment.id).toBe(900);
      expect(result.data.key_id).toBe('rzp_test_key');
      expect(result.data.amounts.total).toBe(1698);
    });
  });

  describe('commerceApi.verifyPayment', () => {
    it('posts the verification payload (incl. session + delegated order) to /payments/verify', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            payment: { id: 900, status: 'completed' },
            synchronization: { required: true, status: 'synchronized', ecommerce_order_id: 77 },
          },
        },
      });

      const payload = buildVerificationPayload(
        {
          razorpay_order_id: 'order_rzp_501',
          razorpay_payment_id: 'pay_rzp_900',
          razorpay_signature: 'signature_from_provider',
        },
        {
          checkout_session_id: 'cs_mixed_2',
          payment: { id: 900 },
          ecommerce_order: { id: 77 },
        }
      );

      const result = await commerceApi.verifyPayment(payload);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/payments/verify'),
        expect.objectContaining({
          razorpay_signature: 'signature_from_provider',
          payment_id: 900,
          checkout_session_id: 'cs_mixed_2',
          delegated_order_id: 77,
        }),
        expect.any(Object)
      );

      expect(result.data.payment.status).toBe('completed');
      expect(result.data.synchronization.status).toBe('synchronized');
    });
  });

  describe('paymentSlice — no client-side paid inference', () => {
    const initialState = {
      status: 'idle',
      activeTransactionId: null,
      verificationData: null,
      paymentError: null,
      receipt: null,
    };

    it('never reports a paid/completed state from the Razorpay popup alone', () => {
      // Opening the popup only marks "initiating" — never completed.
      let state = paymentReducer(initialState, startPayment());
      expect(state.status).toBe('initiating');

      // Submitting the callback only marks "verifying" — never completed.
      state = paymentReducer(state, startVerification());
      expect(state.status).toBe('verifying');

      // A failed backend verification stays failed; the client cannot
      // optimistically upgrade itself to completed.
      state = paymentReducer(state, paymentFailure('Signature verification failed'));
      expect(state.status).toBe('failed');
      expect(state.verificationData).toBeNull();

      // Only an explicit backend-confirmed success transitions to completed.
      state = paymentReducer(state, paymentSuccess({ payment_id: 900, status: 'completed' }));
      expect(state.status).toBe('completed');
      expect(state.activeTransactionId).toBe(900);

      state = paymentReducer(state, resetPaymentState());
      expect(state.status).toBe('idle');
      expect(state.activeTransactionId).toBeNull();
    });

    it('records the cross-domain synchronization status from the backend', () => {
      const state = paymentReducer(
        initialState,
        paymentSuccess({
          payment_id: 901,
          synchronization_status: 'partially_synchronized',
          synchronization: { required: true, status: 'partially_synchronized', ecommerce_order_id: 77 },
        })
      );

      // The payment is captured (success) while the physical sync is still
      // observable as pending/retryable — surfaced for the success page.
      expect(state.status).toBe('completed');
      expect(state.verificationData.synchronization_status).toBe('partially_synchronized');
    });
  });
});
