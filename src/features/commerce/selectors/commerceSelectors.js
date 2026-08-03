/**
 * Memoized Redux Selectors for Commerce & Cart State
 */

import { createSelector } from '@reduxjs/toolkit';

const selectCartState = (state) => state.cart || { items: [], appliedCoupon: null, isDrawerOpen: false };

const selectCheckoutState = (state) => state.checkout || { items: [], activeStep: 1, billingAddress: {} };

export const selectCartItems = createSelector(
  [selectCartState],
  (cart) => cart.items
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
  (cart) => cart.isDrawerOpen
);

export const selectAppliedCoupon = createSelector(
  [selectCartState],
  (cart) => cart.appliedCoupon
);

export const selectIsInCart = createSelector(
  [selectCartItems, (_, productable_id, productable_type) => ({ productable_id, productable_type })],
  (items, { productable_id, productable_type }) =>
    items.some(
      (item) =>
        String(item.productable_id) === String(productable_id) &&
        (!productable_type || item.productable_type === productable_type)
    )
);

// ─── Checkout Session Selectors ────────────────────────────────────────

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
