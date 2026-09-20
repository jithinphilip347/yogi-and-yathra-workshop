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
  setShippingAddress,
  setSameAsBilling,
  setCourierPartner as setCourierPartnerAction,
  setPaymentMethod,
  setActiveStep,
  createOrderStart,
  createOrderSuccess,
  createOrderFailure,
  delegateOrderStart,
  delegateOrderSuccess,
  delegateOrderFailure,
  resetCheckout,
} from '../slices/checkoutSlice';
import {
  selectCheckoutItems,
  selectCheckoutItemCount,
  selectCheckoutSubtotal,
  selectCheckoutOriginalTotal,
  selectCheckoutDiscounts,
} from '../selectors/commerceSelectors';
import { classifyCartItems, normalizeItemType } from '../utils/cartClassification';
import { DEFAULT_COURIER_PARTNER, computeCourierFee } from '../utils/courierPartners';
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

  const sessionId = checkoutState.sessionId || null;
  const classifiedItems = classifyCartItems(items);

  // ─── Courier / shipping fee ────────────────────────────────────────────
  // The threshold is applied to the physical items only: a learning product is
  // not shipped, so its price must never make a small shipment qualify as free.
  // E-commerce derives and applies the charged fee itself from the partner sent
  // with the delegated order; this is the figure the customer is shown first.
  const courierPartner = checkoutState.courierPartner || DEFAULT_COURIER_PARTNER;
  const physicalSubtotal = classifiedItems.ecommerceItems.reduce(
    (total, item) => total + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );
  const courierFee = classifiedItems.hasPhysicalItems
    ? computeCourierFee(physicalSubtotal, courierPartner)
    : 0;

  const itemCount = items.reduce((total, item) => total + (item.quantity || 1), 0);
  const subtotal = items.reduce((total, item) => total + (Number(item.price) || 0) * (item.quantity || 1), 0);
  const originalTotal = items.reduce((total, item) => total + (Number(item.original_price || item.price) || 0) * (item.quantity || 1), 0);
  const discountTotal = Math.max(0, originalTotal - subtotal);

  const activeStep = checkoutState.activeStep || 1;
  const billingAddress = checkoutState.billingAddress || {};
  const shippingAddress = checkoutState.shippingAddress || {};
  const sameAsBilling = checkoutState.sameAsBilling ?? true;
  const paymentMethod = checkoutState.paymentMethod || 'razorpay';
  const activeOrder = checkoutState.activeOrder;
  const delegatedPhysicalOrder = checkoutState.delegatedPhysicalOrder;
  const isDelegating = checkoutState.isDelegating || false;
  const delegationError = checkoutState.delegationError || null;
  const isProcessing = checkoutState.isProcessing || false;
  const error = checkoutState.error || null;

  const user = authState.user;

  const updateBilling = (addressData) => dispatch(setBillingAddress(addressData));
  const updateShipping = (addressData) => dispatch(setShippingAddress(addressData));
  const toggleSameAsBilling = (val) => dispatch(setSameAsBilling(val));
  const changeCourierPartner = (partner) => dispatch(setCourierPartnerAction(partner));
  const changeStep = (step) => dispatch(setActiveStep(step));
  const changePaymentMethod = (method) => dispatch(setPaymentMethod(method));

  /**
   * Delegate physical order creation to authoritative E-commerce backend (Sprint 5)
   */
  const delegateOrder = async (customShipping = null) => {
    if (!classifiedItems.hasPhysicalItems) {
      return { success: true, delegated: false, order: null };
    }

    const finalShipping = customShipping || (sameAsBilling ? billingAddress : shippingAddress);

    if (!finalShipping.address || !finalShipping.city || !finalShipping.state || !finalShipping.zip) {
      const msg = 'Please complete all shipping address fields before proceeding.';
      dispatch(delegateOrderFailure(msg));
      throw new Error(msg);
    }

    dispatch(delegateOrderStart());

    try {
      const payload = {
        checkout_session_id: sessionId,
        customer: {
          name: finalShipping.name || user?.name || 'Customer',
          email: finalShipping.email || user?.email || '',
          phone: finalShipping.phone || user?.phone || '',
        },
        shipping_address: {
          address: finalShipping.address,
          city: finalShipping.city,
          state: finalShipping.state,
          pincode: finalShipping.zip,
          country: finalShipping.country || 'India',
        },
        billing_address: billingAddress.address ? {
          address: billingAddress.address,
          city: billingAddress.city,
          state: billingAddress.state,
          pincode: billingAddress.zip,
          country: billingAddress.country || 'India',
        } : undefined,
        items: items.map((item) => ({
          id: item.productable_id ?? item.id ?? item.value,
          // Canonical type: the delegated order endpoint accepts `product`/`combo`,
          // so a legacy spelling must not be forwarded verbatim.
          type: normalizeItemType(item.productable_type || item.type || 'product'),
          quantity: item.quantity || 1,
          price: Number(item.price || 0),
          unit_price: Number(item.price || 0),
          domain: item.domain,
        })),
        // The courier selection travels as a partner, never as a fee: E-commerce
        // derives the shipping charge from its own catalogue prices and rejects an
        // unrecognised partner. Sending a fee here would let the client — or us —
        // decide what shipping costs.
        delivery_partner: courierPartner,
      };

      const response = await commerceApi.delegatePhysicalOrder(payload);

      if (response.success && response.order) {
        dispatch(delegateOrderSuccess(response));
        return response;
      } else {
        const errorMsg = response.message || 'Delegated order creation failed';
        dispatch(delegateOrderFailure(errorMsg));
        throw new Error(errorMsg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create delegated physical order';
      dispatch(delegateOrderFailure(msg));
      throw new Error(msg);
    }
  };

  /**
   * Create the UNIFIED order (Sprint 7) — a single Razorpay order covering the
   * learning and/or delegated physical portions of this checkout session.
   *
   * Server-authoritative: the backend re-prices the learning item from the
   * database and re-verifies the delegated physical order in e-commerce before
   * the Razorpay order is created.
   *
   * @param {object|null} delegatedOrder Order returned by delegateOrder().
   *   Passed explicitly because Redux state may not have re-rendered yet.
   */
  const initiateUnifiedOrder = async (delegatedOrder = null) => {
    if (items.length === 0) {
      throw new Error('Your cart is empty');
    }

    if (!sessionId) {
      throw new Error('Missing checkout session. Please return to your cart and retry.');
    }

    dispatch(createOrderStart());

    try {
      const physicalTypes = ['product', 'combo', 'combos'];
      const learningItem = (items || []).find((item) => {
        const type = (item.productable_type || item.type || '').toLowerCase();
        const domain = (item.domain || '').toLowerCase();
        return domain !== 'ecommerce' && !physicalTypes.includes(type);
      });

      const delegated = delegatedOrder || delegatedPhysicalOrder;

      if (!learningItem && !delegated?.id) {
        throw new Error('No payable items were found for this checkout session.');
      }

      const payload = {
        checkout_session_id: sessionId,
        ecommerce_order_id: delegated?.id ? Number(delegated.id) : undefined,
        coupon_code: appliedCoupon?.code || null,
        billing_address: billingAddress,
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
      };

      if (learningItem) {
        let productType = (learningItem.productable_type || 'course').toLowerCase();
        if (productType === 'coursedetails' || productType === 'course') productType = 'course';
        if (productType === 'dailyclass' || productType === 'daily_class') productType = 'daily_class';
        if (productType === 'livesection' || productType === 'live_section') productType = 'live_section';

        payload.product_type = productType;
        payload.product_id = Number(learningItem.productable_id ?? learningItem.id ?? learningItem.value);
        payload.pricing_plan_id = learningItem.meta?.pricing_plan_id || null;
      }

      const response = await commerceApi.createUnifiedOrder(payload);

      if (response.success && response.data) {
        dispatch(createOrderSuccess(response.data));
        return response.data;
      }

      throw new Error(response.message || 'Order generation failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to initiate order';
      dispatch(createOrderFailure(msg));
      throw new Error(msg);
    }
  };

  /**
   * Create Order via Backend Order Engine (for single Workshop learning item flows)
   */
  const initiateOrder = async () => {
    if (items.length === 0) {
      throw new Error('Your cart is empty');
    }

    dispatch(createOrderStart());

    try {
      const primaryItem = items[0];
      
      let productType = (primaryItem.productable_type || 'course').toLowerCase();
      if (productType === 'coursedetails' || productType === 'course') productType = 'course';
      if (productType === 'dailyclass' || productType === 'daily_class') productType = 'daily_class';
      if (productType === 'livesection' || productType === 'live_section') productType = 'live_section';

      const payload = {
        session_id: sessionId,
        product_type: productType,
        product_id: Number(primaryItem.productable_id),
        user_id: user?.id || undefined,
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
    sessionId,
    classifiedItems,
    hasPhysicalItems: classifiedItems.hasPhysicalItems,
    hasLearningItems: classifiedItems.hasLearningItems,
    isMixed: classifiedItems.isMixedCart,
    itemCount,
    subtotal,
    originalTotal,
    discountTotal,
    courierPartner,
    courierFee,
    physicalSubtotal,
    appliedCoupon,
    activeStep,
    billingAddress,
    shippingAddress,
    sameAsBilling,
    paymentMethod,
    activeOrder,
    delegatedPhysicalOrder,
    ecommerceCustomer: checkoutState.ecommerceCustomer || { id: null, status: null },
    isDelegating,
    delegationError,
    isProcessing,
    error,
    user,
    updateBilling,
    updateShipping,
    toggleSameAsBilling,
    changeCourierPartner,
    changeStep,
    changePaymentMethod,
    delegateOrder,
    initiateOrder,
    initiateUnifiedOrder,
    validateAndApplyCoupon: (code) => validateAndApply(code, subtotal),
    removeCoupon: detachCoupon,
    reset: () => dispatch(resetCheckout()),
  };
}
