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
import { commerceApi } from '../services/commerceApi';

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
          dispatch(createCheckout({
            items: [validatedItem],
            sessionId: validationRes.checkout_session_id,
          }));
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
        dispatch(createCheckout([normalizedProduct]));
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
    dispatch(createCheckout({ items, sessionId }));
    if (router && typeof router.push === 'function') {
      router.push('/checkout');
    }
    return res;
  };

  const removeItem = (productable_type_or_key, productable_id) => {
    dispatch(removeFromCart({ productable_type: productable_type_or_key, productable_id }));
  };

  const setItemQuantity = (productable_type_or_key, productable_id, quantity) => {
    dispatch(updateQuantity({ productable_type: productable_type_or_key, productable_id, quantity }));
  };

  const emptyCart = () => dispatch(clearCart());
  const toggleDrawer = (isOpen) => dispatch(toggleCartDrawer(isOpen));

  const isInCart = (productable_id, productable_type = 'Course') => {
    const targetKey = productable_type
      ? `${String(productable_type).toLowerCase()}:${productable_id}`
      : String(productable_id);

    return items.some((item) => {
      const itemKey = item.cart_key || `${String(item.productable_type || '').toLowerCase()}:${item.productable_id}`;
      return itemKey === targetKey || String(item.productable_id) === String(productable_id);
    });
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
