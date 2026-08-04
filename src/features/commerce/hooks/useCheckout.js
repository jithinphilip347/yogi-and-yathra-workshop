/**
 * Custom hook for Checkout Flow & Backend Order Engine integration
 *
 * Reads Order Review items from the checkout session (checkout.items),
 * which is created via createCheckout() when the user proceeds to checkout
 * (from the cart) or clicks Buy Now.
 */

import { useDispatch, useSelector } from 'react-redux';
import { useCoupon } from './useCommerceHooks';
import {
  setBillingAddress,
  setPaymentMethod,
  setActiveStep,
  createOrderStart,
  createOrderSuccess,
  createOrderFailure,
  resetCheckout,
} from '../slices/checkoutSlice';
import {
  selectCheckoutItems,
  selectCheckoutItemCount,
  selectCheckoutSubtotal,
  selectCheckoutOriginalTotal,
  selectCheckoutDiscounts,
} from '../selectors/commerceSelectors';
import { commerceApi } from '../services/commerceApi';

export function useCheckout() {
  const dispatch = useDispatch();
  const { appliedCoupon, validateAndApply, detachCoupon } = useCoupon();

  const checkoutState = useSelector((state) => state.checkout || {});
  const authState = useSelector((state) => state.auth || {});

  const checkoutSessionItems = useSelector(selectCheckoutItems);
  const cartItems = useSelector((state) => state.cart?.items || []);

  // Use active checkout session items snapshot; if missing but cart has items, fallback to cart items
  const items = checkoutSessionItems.length > 0 ? checkoutSessionItems : cartItems;

  const itemCount = items.reduce((total, item) => total + (item.quantity || 1), 0);
  const subtotal = items.reduce((total, item) => total + (Number(item.price) || 0) * (item.quantity || 1), 0);
  const originalTotal = items.reduce((total, item) => total + (Number(item.original_price || item.price) || 0) * (item.quantity || 1), 0);
  const discountTotal = Math.max(0, originalTotal - subtotal);

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
      
      // Map frontend normalized type to backend expected product_type enum (course, daily_class, live_section)
      let productType = (primaryItem.productable_type || 'course').toLowerCase();
      if (productType === 'coursedetails' || productType === 'course') productType = 'course';
      if (productType === 'dailyclass' || productType === 'daily_class') productType = 'daily_class';
      if (productType === 'livesection' || productType === 'live_section') productType = 'live_section';

      const payload = {
        product_type: productType,
        product_id: Number(primaryItem.productable_id),
        user_id: user?.id || undefined, // Backend falls back to the authenticated user
        pricing_plan_id: primaryItem.meta?.pricing_plan_id || null,
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
    itemCount,
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
    validateAndApplyCoupon: (code) => validateAndApply(code, subtotal),
    removeCoupon: detachCoupon,
    reset: () => dispatch(resetCheckout()),
  };
}
