/**
 * Shared Reusable Commerce Custom Hooks
 */

import { useDispatch, useSelector } from 'react-redux';
import { CommerceAdapter } from '../adapters/CommerceAdapter';
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCartDrawer,
  setAppliedCoupon,
  removeCoupon,
  setValidationStart,
  setValidationSuccess,
  setValidationFailure,
  clearValidationState,
  sanitizePersistedCart,
} from '../slices/cartSlice';
import {
  selectCartItems,
  selectCartItemCount,
  selectCartSubtotal,
  selectCartOriginalTotal,
  selectCartDiscounts,
  selectIsCartDrawerOpen,
  selectAppliedCoupon,
  selectClassifiedCartItems,
  selectWorkshopCartItems,
  selectEcommerceCartItems,
  selectIsMixedCart,
  selectCartLearningSubtotal,
  selectCartPhysicalSubtotal,
  selectCartValidation,
  selectHasCartBlockingErrors,
} from '../selectors/commerceSelectors';
import { createCheckout } from '../slices/checkoutSlice';
import { resetPaymentState } from '../slices/paymentSlice';
import { commerceApi } from '../services/commerceApi';
import { buildCartTarget, getCartKey, normalizeItemType } from '../utils/cartClassification';

export function useCart() {
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const itemCount = useSelector(selectCartItemCount);
  const subtotal = useSelector(selectCartSubtotal);
  const originalTotal = useSelector(selectCartOriginalTotal);
  const discountTotal = useSelector(selectCartDiscounts);
  const isDrawerOpen = useSelector(selectIsCartDrawerOpen);
  const appliedCoupon = useSelector(selectAppliedCoupon);

  const classifiedItems = useSelector(selectClassifiedCartItems);
  const workshopItems = useSelector(selectWorkshopCartItems);
  const ecommerceItems = useSelector(selectEcommerceCartItems);
  const isMixedCart = useSelector(selectIsMixedCart);
  const learningSubtotal = useSelector(selectCartLearningSubtotal);
  const physicalSubtotal = useSelector(selectCartPhysicalSubtotal);
  const validation = useSelector(selectCartValidation);
  const hasBlockingErrors = useSelector(selectHasCartBlockingErrors);

  const addItem = (rawEntity, type) => {
    const normalizedProduct = CommerceAdapter.normalize(rawEntity, type);
    if (normalizedProduct && normalizedProduct.productable_id) {
      dispatch(addToCart(normalizedProduct));
    }
  };

  /**
   * Begin a checkout session.
   *
   * The payment status is a transient flag that store.js persists along with the
   * rest of the root state, so a previous attempt's `completed` (or a crashed
   * attempt's `initiating`) otherwise rehydrates straight into a brand-new
   * checkout and leaves the Pay button disabled before the customer has done
   * anything. Every new session therefore starts from a clean payment state.
   */
  const startCheckoutSession = (payload) => {
    dispatch(resetPaymentState());
    dispatch(createCheckout(payload));
  };

  /**
   * Run live server-side validation against authoritative Workshop and E-commerce domains.
   */
  const validateCartLive = async () => {
    if (!items || items.length === 0) {
      return { success: true, valid: false, items: [] };
    }
    dispatch(setValidationStart());
    try {
      const response = await commerceApi.validateCart(items);
      if (response && response.success) {
        dispatch(setValidationSuccess(response));
        return { success: true, valid: response.valid, data: response };
      } else {
        const errorMsg = response?.message || 'Cart validation failed';
        dispatch(setValidationFailure(errorMsg));
        return { success: false, valid: false, message: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Cart validation failed';
      dispatch(setValidationFailure(errorMsg));
      return { success: false, valid: false, message: errorMsg };
    }
  };

  /**
   * Buy Now Flow:
   * Normalize -> Add to Cart -> Validate with Server -> Snapshot into Checkout Session with UUID -> Navigate to Checkout
   */
  const buyNow = async (rawEntity, type, router) => {
    if (!rawEntity) return;
    const normalizedProduct = CommerceAdapter.normalize(rawEntity, type);
    if (normalizedProduct && normalizedProduct.productable_id) {
      dispatch(addToCart(normalizedProduct));

      try {
        const validationRes = await commerceApi.validateCart([normalizedProduct]);
        if (validationRes && validationRes.valid) {
          const validatedItem = validationRes.items?.[0]
            ? { ...normalizedProduct, ...validationRes.items[0] }
            : normalizedProduct;
          startCheckoutSession({
            items: [validatedItem],
            sessionId: validationRes.checkout_session_id,
          });
          if (router && typeof router.push === 'function') {
            router.push('/checkout');
          }
          return;
        } else if (validationRes) {
          dispatch(setValidationSuccess(validationRes));
          if (router && typeof router.push === 'function') {
            router.push('/cart');
          }
          return;
        }
      } catch (e) {
        // Fallback to client snapshot checkout if offline
        startCheckoutSession([normalizedProduct]);
        if (router && typeof router.push === 'function') {
          router.push('/checkout');
        }
      }
    }
  };

  /**
   * Snapshot current cart items into a checkout session and navigate to checkout
   * ONLY after authoritative backend validation succeeds.
   */
  const proceedToCheckout = async (router) => {
    if (!items || items.length === 0) return;

    const res = await validateCartLive();
    if (!res.success || !res.valid) {
      // Cart has blocking errors (e.g. out of stock or unavailable item)
      // Stay on /cart and display validation errors for recovery
      return res;
    }

    const sessionId = res.data?.checkout_session_id;
    startCheckoutSession({ items, sessionId });
    if (router && typeof router.push === 'function') {
      router.push('/checkout');
    }
    return res;
  };

  /**
   * Remove a cart line.
   *
   * Accepts either an item type + id (product cards) or a complete cart key (the
   * cart page holds `item.cart_key`), because a cart key forwarded through the
   * (type, id) shape would become `${cart_key}:${id}` and match nothing.
   */
  const removeItem = (productable_type_or_key, productable_id) => {
    dispatch(removeFromCart(buildCartTarget(productable_type_or_key, productable_id)));
  };

  const setItemQuantity = (productable_type_or_key, productable_id, quantity) => {
    dispatch(
      updateQuantity({
        ...buildCartTarget(productable_type_or_key, productable_id),
        quantity,
      })
    );
  };

  const emptyCart = () => dispatch(clearCart());
  const toggleDrawer = (isOpen) => dispatch(toggleCartDrawer(isOpen));

  /**
   * Whether a cart line exists for a `type:id` identity.
   *
   * Identity is always `type:id` (Sprint 18). The type is normalized through
   * `normalizeItemType` so that `DailyClass` / `LiveSection` / `ComboProduct` match
   * the canonical keys the reducer stores (`daily_class:10`, `live_section:10`,
   * `combo:10`) instead of silently missing them. The previous numeric-id fallback
   * is deliberately gone: a bare id is not an identity — `Course 10` is not
   * `product:10`, and a combo shares the id namespace with normal products.
   */
  const isInCart = (productable_id, productable_type = 'Course') => {
    const targetKey = `${normalizeItemType(productable_type)}:${productable_id}`;
    return items.some((item) => getCartKey(item) === targetKey);
  };

  const sanitizeCart = () => dispatch(sanitizePersistedCart());

  return {
    items,
    itemCount,
    subtotal,
    originalTotal,
    discountTotal,
    isDrawerOpen,
    appliedCoupon,
    classifiedItems,
    workshopItems,
    ecommerceItems,
    isMixedCart,
    learningSubtotal,
    physicalSubtotal,
    validation,
    hasBlockingErrors,
    addItem,
    buyNow,
    proceedToCheckout,
    validateCartLive,
    removeItem,
    setItemQuantity,
    emptyCart,
    toggleDrawer,
    isInCart,
    sanitizeCart,
  };
}

export function useCoupon() {
  const dispatch = useDispatch();
  const appliedCoupon = useSelector(selectAppliedCoupon);
  const subtotal = useSelector(selectCartSubtotal);

  const validateAndApply = async (code, amount = subtotal) => {
    try {
      const response = await commerceApi.validateCoupon(code, amount);
      if (response.success && response.data) {
        dispatch(setAppliedCoupon(response.data));
        return { success: true, coupon: response.data };
      }
      return { success: false, message: response.message || 'Invalid coupon code' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Coupon validation failed',
      };
    }
  };

  const detachCoupon = () => dispatch(removeCoupon());

  return {
    appliedCoupon,
    validateAndApply,
    detachCoupon,
  };
}
