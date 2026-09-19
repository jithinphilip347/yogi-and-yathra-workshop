/**
 * Centralized Unified Cart Redux Slice
 *
 * Supports multi-item mixed carts containing Workshop learning items and E-commerce physical items.
 * Enforces strict quantity rules (Learning: 1, Physical: >= 1) and server-side validation synchronization.
 */

import { createSlice } from '@reduxjs/toolkit';
import {
  getCartKey,
  getItemDomain,
  isLearningItem,
  isPhysicalItem,
  sanitizeCartItem,
} from '../utils/cartClassification';

/** Live server-validation state (checkout session, per-item status, summary). */
const createValidationState = () => ({
  isValidating: false,
  lastValidated: null,
  checkoutSessionId: null,
  hasErrors: false,
  hasChanges: false,
  summary: null,
});

const initialState = {
  items: [],
  isDrawerOpen: false,
  appliedCoupon: null,
  isProcessing: false,
  error: null,
  validation: createValidationState(),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const sanitized = sanitizeCartItem(action.payload);
      if (!sanitized) return;

      const targetKey = getCartKey(sanitized);
      const existingIndex = state.items.findIndex(
        (item) => getCartKey(item) === targetKey
      );

      if (existingIndex >= 0) {
        const existing = state.items[existingIndex];
        if (isLearningItem(existing)) {
          // Invariant: Learning items are strictly quantity 1; duplicate add is idempotent
          existing.quantity = 1;
        } else {
          // Physical items increment quantity
          existing.quantity = (existing.quantity || 1) + (sanitized.quantity || 1);
        }
        // Clear any previous out_of_stock / validation flag on re-add
        delete existing.validationStatus;
        delete existing.validationMessage;
      } else {
        state.items.push(sanitized);
      }

      state.isDrawerOpen = true;
      state.validation.hasErrors = false;
    },

    removeFromCart: (state, action) => {
      const payload = action.payload;
      const targetKey = typeof payload === 'string'
        ? payload
        : (payload?.cart_key || getCartKey(payload));

      state.items = state.items.filter((item) => getCartKey(item) !== targetKey);
    },

    updateQuantity: (state, action) => {
      const { quantity } = action.payload;
      const targetKey = action.payload.cart_key || getCartKey(action.payload);

      const item = state.items.find((i) => getCartKey(i) === targetKey);
      if (!item) return;

      if (isLearningItem(item)) {
        // Enforce invariant: Learning items can NEVER have quantity > 1
        item.quantity = 1;
      } else {
        item.quantity = Math.max(1, Math.floor(Number(quantity) || 1));
      }

      // Reset stale stock warning on user quantity update
      if (item.validationStatus === 'insufficient_stock' && item.quantity <= (item.available_quantity || 1)) {
        delete item.validationStatus;
        delete item.validationMessage;
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.appliedCoupon = null;
      state.error = null;
      state.validation = createValidationState();
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

    // ─── Live Server Validation Synchronization ──────────────────────────────

    setValidationStart: (state) => {
      state.validation.isValidating = true;
      state.error = null;
    },

    setValidationSuccess: (state, action) => {
      const { valid, checkout_session_id, summary, items: serverItems } = action.payload;

      state.validation.isValidating = false;
      state.validation.lastValidated = Date.now();
      state.validation.checkoutSessionId = checkout_session_id || null;
      state.validation.hasErrors = Boolean(summary?.has_errors);
      state.validation.hasChanges = Boolean(summary?.has_changes);
      state.validation.summary = summary || null;

      if (Array.isArray(serverItems)) {
        // Map server results to local items by cart_key
        const serverItemMap = new Map();
        for (const sItem of serverItems) {
          const key = sItem.cart_key || `${sItem.type}:${sItem.id}`;
          serverItemMap.set(key, sItem);
        }

        for (const localItem of state.items) {
          const key = getCartKey(localItem);
          const serverInfo = serverItemMap.get(key);

          if (serverInfo) {
            // Update authoritative pricing and validation flags
            localItem.unit_price = serverInfo.unit_price;
            localItem.price = serverInfo.unit_price;
            localItem.original_price = serverInfo.original_price;
            localItem.validationStatus = serverInfo.status; // 'valid' | 'price_changed' | 'out_of_stock' | etc.
            localItem.validationMessage = serverInfo.message;
            localItem.available_quantity = serverInfo.available_quantity;
            localItem.price_changed = serverInfo.price_changed;
            localItem.old_price = serverInfo.old_price;
            localItem.new_price = serverInfo.new_price;
          }
        }
      }
    },

    setValidationFailure: (state, action) => {
      state.validation.isValidating = false;
      state.error = action.payload || 'Failed to validate cart';
    },

    clearValidationState: (state) => {
      state.validation = createValidationState();
      for (const item of state.items) {
        delete item.validationStatus;
        delete item.validationMessage;
        delete item.price_changed;
      }
    },

    /**
     * Clean and migrate items persisted in localStorage
     */
    sanitizePersistedCart: (state) => {
      const validItems = [];
      const seenKeys = new Set();

      for (const raw of state.items) {
        const clean = sanitizeCartItem(raw);
        if (!clean) continue;

        const key = getCartKey(clean);
        if (seenKeys.has(key)) {
          const existing = validItems.find((i) => getCartKey(i) === key);
          if (existing && isPhysicalItem(existing)) {
            existing.quantity += clean.quantity;
          }
        } else {
          seenKeys.add(key);
          validItems.push(clean);
        }
      }

      state.items = validItems;
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
  setValidationStart,
  setValidationSuccess,
  setValidationFailure,
  clearValidationState,
  sanitizePersistedCart,
} = cartSlice.actions;

const cartReducer = cartSlice.reducer;

/**
 * Repair a cart state that is missing fields this slice writes to.
 *
 * redux-persist rehydrates a persisted slice OVER the slice's initial state, so a
 * cart stored by an older build — from before `validation` existed — comes back with
 * the key simply absent (a key that was never written stays missing in JSON). Every
 * reducer that touches `state.validation.*` then throws
 * "Cannot set properties of undefined (setting 'hasErrors')" and the item is never
 * added. `items` has the same failure mode if storage was truncated or hand-edited.
 *
 * Returns the SAME object when the shape is already sound, so the normal path costs
 * nothing, and never mutates its input (rehydrated state is frozen in development).
 *
 * @param {object|undefined} state
 * @returns {object} a state object safe for the reducers
 */
export function ensureCartShape(state) {
  if (!state || typeof state !== 'object') return initialState;

  const itemsMissing = !Array.isArray(state.items);
  const validationMissing =
    !state.validation || typeof state.validation !== 'object';

  if (!itemsMissing && !validationMissing) return state;

  return {
    ...initialState,
    ...state,
    items: itemsMissing ? initialState.items : state.items,
    validation: validationMissing
      ? createValidationState()
      : { ...createValidationState(), ...state.validation },
  };
}

/**
 * Public cart reducer: repair the shape before Immer and the reducers see it, so a
 * cart persisted before a field existed can never break the very next action.
 */
export default function reducer(state, action) {
  return cartReducer(ensureCartShape(state), action);
}
