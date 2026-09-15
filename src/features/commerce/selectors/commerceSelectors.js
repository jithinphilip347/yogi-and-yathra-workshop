/**
 * Memoized Redux Selectors for Commerce & Cart State
 */

import { createSelector } from '@reduxjs/toolkit';
import {
  classifyCartItems,
  getCartKey,
  isLearningItem,
  isPhysicalItem,
} from '../utils/cartClassification';

const selectCartState = (state) => state.cart || { items: [], appliedCoupon: null, isDrawerOpen: false, validation: {} };

const selectCheckoutState = (state) => state.checkout || { items: [], activeStep: 1, billingAddress: {} };

export const selectCartItems = createSelector(
  [selectCartState],
  (cart) => cart.items || []
);

export const selectCartItemCount = createSelector(
  [selectCartItems],
  (items) => items.reduce((total, item) => total + (item.quantity || 1), 0)
);

export const selectCartSubtotal = createSelector(
  [selectCartItems],
  (items) => items.reduce((total, item) => total + (Number(item.price) || 0) * (item.quantity || 1), 0)
);

export const selectCartOriginalTotal = createSelector(
  [selectCartItems],
  (items) => items.reduce((total, item) => total + (Number(item.original_price || item.price) || 0) * (item.quantity || 1), 0)
);

export const selectCartDiscounts = createSelector(
  [selectCartOriginalTotal, selectCartSubtotal],
  (original, subtotal) => Math.max(0, original - subtotal)
);

export const selectIsCartDrawerOpen = createSelector(
  [selectCartState],
  (cart) => Boolean(cart.isDrawerOpen)
);

export const selectAppliedCoupon = createSelector(
  [selectCartState],
  (cart) => cart.appliedCoupon
);

// ─── Classification & Domain Selectors ───────────────────────────────────────

export const selectClassifiedCartItems = createSelector(
  [selectCartItems],
  (items) => classifyCartItems(items)
);

export const selectWorkshopCartItems = createSelector(
  [selectClassifiedCartItems],
  (classified) => classified.workshopItems
);

export const selectEcommerceCartItems = createSelector(
  [selectClassifiedCartItems],
  (classified) => classified.ecommerceItems
);

export const selectIsMixedCart = createSelector(
  [selectClassifiedCartItems],
  (classified) => classified.isMixedCart
);

export const selectCartLearningSubtotal = createSelector(
  [selectWorkshopCartItems],
  (items) => items.reduce((total, item) => total + (Number(item.price) || 0) * (item.quantity || 1), 0)
);

export const selectCartPhysicalSubtotal = createSelector(
  [selectEcommerceCartItems],
  (items) => items.reduce((total, item) => total + (Number(item.price) || 0) * (item.quantity || 1), 0)
);

// ─── Validation Selectors ───────────────────────────────────────────────────

export const selectCartValidation = createSelector(
  [selectCartState],
  (cart) => cart.validation || {}
);

export const selectHasCartBlockingErrors = createSelector(
  [selectCartItems, selectCartValidation],
  (items, validation) => {
    if (validation.hasErrors) return true;
    return items.some((item) => {
      const status = item.validationStatus;
      return status === 'out_of_stock' ||
             status === 'insufficient_stock' ||
             status === 'unavailable' ||
             status === 'not_found' ||
             status === 'invalid_item';
    });
  }
);

export const selectIsInCart = createSelector(
  [selectCartItems, (_, productable_id, productable_type) => ({ productable_id, productable_type })],
  (items, { productable_id, productable_type }) => {
    const targetKey = productable_type
      ? `${String(productable_type).toLowerCase()}:${productable_id}`
      : String(productable_id);

    return items.some((item) => {
      const itemKey = getCartKey(item);
      if (itemKey === targetKey) return true;
      return (
        String(item.productable_id) === String(productable_id) &&
        (!productable_type || String(item.productable_type).toLowerCase() === String(productable_type).toLowerCase())
      );
    });
  }
);

// ─── Checkout Session Selectors ──────────────────────────────────────────────

export const selectCheckoutItems = createSelector(
  [selectCheckoutState],
  (checkout) => checkout.items || []
);

export const selectCheckoutItemCount = createSelector(
  [selectCheckoutItems],
  (items) => items.reduce((total, item) => total + (item.quantity || 1), 0)
);

export const selectCheckoutSubtotal = createSelector(
  [selectCheckoutItems],
  (items) => items.reduce((total, item) => total + (Number(item.price) || 0) * (item.quantity || 1), 0)
);

export const selectCheckoutOriginalTotal = createSelector(
  [selectCheckoutItems],
  (items) => items.reduce((total, item) => total + (Number(item.original_price || item.price) || 0) * (item.quantity || 1), 0)
);

export const selectCheckoutDiscounts = createSelector(
  [selectCheckoutOriginalTotal, selectCheckoutSubtotal],
  (original, subtotal) => Math.max(0, original - subtotal)
);
