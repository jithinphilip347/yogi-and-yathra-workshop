/**
 * Centralized Cart Redux Slice
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  isDrawerOpen: false,
  appliedCoupon: null,
  isProcessing: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const newItem = action.payload;
      const existingIndex = state.items.findIndex(
        (i) => i.productable_type === newItem.productable_type && i.productable_id === newItem.productable_id
      );

      if (existingIndex >= 0) {
        state.items[existingIndex].quantity = (state.items[existingIndex].quantity || 1) + 1;
      } else {
        state.items.push({ ...newItem, quantity: 1 });
      }
      state.isDrawerOpen = true;
    },

    removeFromCart: (state, action) => {
      const { productable_type, productable_id } = action.payload;
      state.items = state.items.filter(
        (i) => !(i.productable_type === productable_type && i.productable_id === productable_id)
      );
    },

    updateQuantity: (state, action) => {
      const { productable_type, productable_id, quantity } = action.payload;
      const item = state.items.find(
        (i) => i.productable_type === productable_type && i.productable_id === productable_id
      );
      if (item) {
        item.quantity = Math.max(1, quantity);
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.appliedCoupon = null;
      state.error = null;
    },

    toggleCartDrawer: (state, action) => {
      state.isDrawerOpen = action.payload !== undefined ? action.payload : !state.isDrawerOpen;
    },

    setAppliedCoupon: (state, action) => {
      state.appliedCoupon = action.payload;
    },

    removeCoupon: (state) => {
      state.appliedCoupon = null;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCartDrawer,
  setAppliedCoupon,
  removeCoupon,
} = cartSlice.actions;

export default cartSlice.reducer;
