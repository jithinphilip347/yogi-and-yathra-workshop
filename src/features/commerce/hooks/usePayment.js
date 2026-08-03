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

import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
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

export function usePayment() {
  const dispatch = useDispatch();
  const router = useRouter();

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
        dispatch(startVerification());
        try {
          // Server-side verification — never trust the frontend alone.
          // The backend validates the HMAC signature and fetches the
          // payment from Razorpay to confirm it was captured.
          const verificationPayload = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            payment_id: paymentId,
          };

          const verifyRes = await commerceApi.verifyPayment(verificationPayload);

          if (verifyRes.success || verifyRes.status === 'success') {
            dispatch(paymentSuccess(verifyRes.data || verifyRes));
            dispatch(clearCart());
            dispatch(clearCheckoutItems());
            router.push('/checkout/success');
          } else {
            throw new Error(verifyRes.message || 'Payment signature verification failed.');
          }
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Verification Error';
          dispatch(paymentFailure(msg));
          router.push('/checkout/failure');
        }
      },
      modal: {
        ondismiss: function () {
          dispatch(paymentFailure('Payment cancelled by user.'));
        },
      },
    };

    const rzp = new window.Razorpay(options);

    // Surface payment failures reported by the SDK (e.g. bank declined)
    rzp.on('payment.failed', function (response) {
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
