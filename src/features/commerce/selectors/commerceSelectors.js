/**
 * Memoized Redux Selectors for Commerce & Cart State
 */

import { createSelector } from '@reduxjs/toolkit';

const selectCartState = (state) => state.cart || { items: [], appliedCoupon: null, isDrawerOpen: false };

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
