/**
 * Custom hook for Checkout Flow & Backend Order Engine integration
 */

import { useDispatch, useSelector } from 'react-redux';
import { useCart, useCoupon } from './useCommerceHooks';
import {
  setBillingAddress,
  setPaymentMethod,
  setActiveStep,
  createOrderStart,
  createOrderSuccess,
  createOrderFailure,
  resetCheckout,
} from '../slices/checkoutSlice';
import { commerceApi } from '../services/commerceApi';

export function useCheckout() {
  const dispatch = useDispatch();
  const { items, subtotal, originalTotal, discountTotal, appliedCoupon, emptyCart } = useCart();
  const { validateAndApply, detachCoupon } = useCoupon();

  const checkoutState = useSelector((state) => state.checkout || {});
  const authState = useSelector((state) => state.auth || {});

  const activeStep = checkoutState.activeStep || 1;
  const billingAddress = checkoutState.billingAddress || {};
  const paymentMethod = checkoutState.paymentMethod || 'razorpay';
  const activeOrder = checkoutState.activeOrder;
  const isProcessing = checkoutState.isProcessing;
  const error = checkoutState.error;

  const user = authState.user;

  const updateBilling = (addressData) => dispatch(setBillingAddress(addressData));
  const changeStep = (step) => dispatch(setActiveStep(step));
  const changePaymentMethod = (method) => dispatch(setPaymentMethod(method));

  /**
   * Create Order via Backend Order Engine (never calculates price locally)
   */
  const initiateOrder = async () => {
    if (items.length === 0) {
      throw new Error('Your cart is empty');
    }

    dispatch(createOrderStart());

    try {
      // Primary item or polymorphic payload
      const primaryItem = items[0];
      const payload = {
        orderable_type: primaryItem.productable_type,
        orderable_id: primaryItem.productable_id,
        amount: subtotal,
        coupon_code: appliedCoupon?.code || null,
        billing_address: billingAddress,
        payment_method: paymentMethod,
      };

      const response = await commerceApi.createOrder(payload);

      if (response.success && response.data) {
        dispatch(createOrderSuccess(response.data));
        return response.data;
      } else {
        throw new Error(response.message || 'Order generation failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to initiate order';
      dispatch(createOrderFailure(msg));
      throw new Error(msg);
    }
  };

  return {
    items,
    subtotal,
    originalTotal,
    discountTotal,
    appliedCoupon,
    activeStep,
    billingAddress,
    paymentMethod,
    activeOrder,
    isProcessing,
    error,
    user,
    updateBilling,
    changeStep,
    changePaymentMethod,
    initiateOrder,
    validateAndApplyCoupon: validateAndApply,
    removeCoupon: detachCoupon,
    reset: () => dispatch(resetCheckout()),
  };
}
