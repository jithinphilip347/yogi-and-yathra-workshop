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
} from '../slices/cartSlice';
import {
  selectCartItems,
  selectCartItemCount,
  selectCartSubtotal,
  selectCartOriginalTotal,
  selectCartDiscounts,
  selectIsCartDrawerOpen,
  selectAppliedCoupon,
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

  const addItem = (rawEntity, type) => {
    const normalizedProduct = CommerceAdapter.normalize(rawEntity, type);
    if (normalizedProduct) {
      dispatch(addToCart(normalizedProduct));
    }
  };

  const buyNow = (rawEntity, type, router) => {
    const normalizedProduct = CommerceAdapter.normalize(rawEntity, type);
    if (normalizedProduct) {
      dispatch(addToCart(normalizedProduct));
      // Create a checkout session so /checkout always has Order Review data
      dispatch(createCheckout([normalizedProduct]));
      if (router && typeof router.push === 'function') {
        router.push('/checkout');
      }
    }
  };

  /**
   * Snapshot the current cart into a checkout session and navigate.
   */
  const proceedToCheckout = (router) => {
    if (items.length === 0) return;
    dispatch(createCheckout(items));
    if (router && typeof router.push === 'function') {
      router.push('/checkout');
    }
  };

  const removeItem = (productable_type, productable_id) => {
    dispatch(removeFromCart({ productable_type, productable_id }));
  };

  const setItemQuantity = (productable_type, productable_id, quantity) => {
    dispatch(updateQuantity({ productable_type, productable_id, quantity }));
  };

  const emptyCart = () => dispatch(clearCart());
  const toggleDrawer = (isOpen) => dispatch(toggleCartDrawer(isOpen));

  const isInCart = (productable_id, productable_type = 'Course') => {
    return items.some(
      (item) =>
        String(item.productable_id) === String(productable_id) &&
        (!productable_type || item.productable_type === productable_type)
    );
  };

  return {
    items,
    itemCount,
    subtotal,
    originalTotal,
    discountTotal,
    isDrawerOpen,
    appliedCoupon,
    addItem,
    buyNow,
    proceedToCheckout,
    removeItem,
    setItemQuantity,
    emptyCart,
    toggleDrawer,
    isInCart,
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
