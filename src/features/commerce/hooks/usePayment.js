/**
 * Custom hook for Razorpay SDK Execution & Payment Signature Verification
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
   */
  const executeRazorpay = async (orderData, userProfile) => {
    dispatch(startPayment());

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      const msg = 'Razorpay SDK failed to load. Please check your internet connection.';
      dispatch(paymentFailure(msg));
      throw new Error(msg);
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || 'rzp_test_yogify_key',
      amount: Math.round(Number(orderData.total_amount || orderData.amount) * 100),
      currency: orderData.currency || 'INR',
      name: 'Yogify Workshop',
      description: `Order #${orderData.order_number || orderData.id}`,
      order_id: orderData.gateway_order_id || orderData.order_number,
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
          const verificationPayload = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            order_id: orderData.id,
          };

          const verifyRes = await commerceApi.verifyPayment(verificationPayload);

          if (verifyRes.success || verifyRes.status === 'success') {
            dispatch(paymentSuccess(verifyRes.data || verifyRes));
            dispatch(clearCart());
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
