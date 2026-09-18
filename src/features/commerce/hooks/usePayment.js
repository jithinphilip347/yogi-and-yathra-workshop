/**
 * Custom hook for Razorpay SDK Execution & Payment Signature Verification
 *
 * IMPORTANT: This hook NEVER constructs Razorpay payloads from scratch.
 * The backend returns the authoritative checkout payload
 *   { order: {...}, payment: {...}, razorpay: { id, amount, currency, ... }, key_id }
 * after creating the order. This hook simply passes those values to the
 * Razorpay Checkout SDK, and forwards the callback response to the backend
 * /payments/verify endpoint for server-side signature verification.
 */

import { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  startPayment,
  startVerification,
  paymentSuccess,
  paymentFailure,
  resetPaymentState,
} from '../slices/paymentSlice';
import { clearCart } from '../slices/cartSlice';
import { clearCheckoutItems } from '../slices/checkoutSlice';
import { commerceApi } from '../services/commerceApi';
import { buildVerificationPayload } from '../utils/verificationPayload';
import {
  createInventoryHoldReleaser,
  RELEASE_REASON_CHECKOUT_CANCELLED,
  RELEASE_REASON_PAYMENT_FAILED,
} from '../utils/inventoryHold';

export function usePayment() {
  const dispatch = useDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Guarantees a single verification submission per payment attempt, so a
  // double-click / re-fired SDK callback can never dispatch two verifications.
  const verificationGuard = useRef(false);

  // Guarantees at most one inventory-release request per checkout attempt.
  const holdReleaser = useRef(null);
  if (!holdReleaser.current) {
    holdReleaser.current = createInventoryHoldReleaser(commerceApi.releaseInventory);
  }

  const paymentState = useSelector((state) => state.payment || {});
  const status = paymentState.status || 'idle';
  const paymentError = paymentState.paymentError;
  const activeTransactionId = paymentState.activeTransactionId;
  const receipt = paymentState.receipt;

  /**
   * Dynamically load Razorpay SDK Script
   */
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  /**
   * Execute Razorpay PSP Checkout Modal
   *
   * @param {object} orderData  The full checkout payload returned by the
   *                            backend createOrder endpoint:
   *                            { order, payment, razorpay, key_id }
   * @param {object} userProfile The logged-in user profile for prefill.
   */
  const executeRazorpay = async (orderData, userProfile) => {
    dispatch(startPayment());

    // Backend is the single source of truth for the Razorpay payload.
    const razorpayOrder = orderData?.razorpay;
    const keyId = orderData?.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY;
    const paymentId = orderData?.payment?.id;
    const orderNumber = orderData?.order?.order_number || orderData?.order?.id;

    if (!razorpayOrder?.id || !keyId || !paymentId) {
      const msg = 'Missing Razorpay checkout details. Please retry the order.';
      dispatch(paymentFailure(msg));
      throw new Error(msg);
    }

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      const msg = 'Razorpay SDK failed to load. Please check your internet connection.';
      dispatch(paymentFailure(msg));
      throw new Error(msg);
    }

    // Sprint 8 — physical inventory hold. `createUnifiedOrder` may have reserved
    // E-commerce stock for this session with a 15-minute TTL. If the customer
    // walks away (modal dismissed / payment declined), we ask the Workshop
    // backend to release the hold immediately instead of making other shoppers
    // wait out the TTL. Fire-and-forget by design: the response changes nothing
    // in the UI, and the server TTL is the real backstop.
    const checkoutSessionId =
      orderData?.checkout_session_id || orderData?.order?.checkout_session_id || null;

    const releaseInventoryHold = (reason) => {
      // Fire-and-forget: never awaited, never surfaces an error, and a re-fired
      // callback can never issue a second request.
      holdReleaser.current.release(checkoutSessionId, reason);
    };

    const options = {
      // key_id is returned by the backend (never hardcoded in source)
      key: keyId,
      // amount is already in paise, as returned by Razorpay order creation
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || 'INR',
      name: 'Yogify Workshop',
      description: orderNumber ? `Order #${orderNumber}` : 'Yogify Workshop',
      order_id: razorpayOrder.id,
      prefill: {
        name: userProfile?.name || '',
        email: userProfile?.email || '',
        contact: userProfile?.phone || '',
      },
      theme: {
        color: '#1a56db',
      },
      handler: async function (response) {
        if (verificationGuard.current) {
          return; // Duplicate callback — a verification is already in flight.
        }
        verificationGuard.current = true;

        dispatch(startVerification());
        try {
          // Server-side verification — never trust the frontend alone.
          // The backend validates the HMAC signature and fetches the
          // payment from Razorpay to confirm it was captured.
          const verificationPayload = buildVerificationPayload(response, orderData);

          const verifyRes = await commerceApi.verifyPayment(verificationPayload);

          if (verifyRes.success || verifyRes.status === 'success') {
            const result = verifyRes.data || verifyRes;
            const syncStatus = result.synchronization?.status || null;

            dispatch(paymentSuccess({
              ...result,
              payment_id: paymentId,
              synchronization_status: syncStatus,
            }));

            if (queryClient) {
              queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
              queryClient.invalidateQueries({ queryKey: ['course-access'] });
              queryClient.invalidateQueries({ queryKey: ['course-resume'] });
              queryClient.invalidateQueries({ queryKey: ['student-continue-learning'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard-upcoming-events'] });
              queryClient.invalidateQueries({ queryKey: ['profile'] });
              queryClient.invalidateQueries({ queryKey: ['user-orders'] });
            }

            dispatch(clearCart());
            dispatch(clearCheckoutItems());

            // NOTE: `partially_synchronized` is NOT a failure — the customer's
            // payment is captured and Workshop access is fulfilled. The physical
            // order sync is retried server-side (idempotently) via the webhook
            // reconciliation path, so the user still lands on success.
            router.replace('/checkout/success');
          } else {
            throw new Error(verifyRes.message || 'Payment signature verification failed.');
          }
        } catch (err) {
          // Allow a legitimate retry after a failed verification.
          verificationGuard.current = false;
          const msg = err.response?.data?.message || err.message || 'Verification Error';
          dispatch(paymentFailure(msg));
          router.push('/checkout/failure');
        }
      },
      modal: {
        ondismiss: function () {
          verificationGuard.current = false;
          // Abandoned checkout: hand the reserved units straight back.
          releaseInventoryHold(RELEASE_REASON_CHECKOUT_CANCELLED);
          dispatch(paymentFailure('Payment cancelled by user.'));
        },
      },
    };

    const rzp = new window.Razorpay(options);

    // Surface payment failures reported by the SDK (e.g. bank declined)
    rzp.on('payment.failed', function (response) {
      verificationGuard.current = false;
      // Declined payment: the customer will not be charged, so the hold goes back.
      releaseInventoryHold(RELEASE_REASON_PAYMENT_FAILED);
      const description = response?.error?.description || 'Payment failed. Please try again.';
      dispatch(paymentFailure(description));
    });

    rzp.open();
  };

  return {
    status,
    paymentError,
    activeTransactionId,
    receipt,
    executeRazorpay,
    resetPayment: () => dispatch(resetPaymentState()),
  };
}
