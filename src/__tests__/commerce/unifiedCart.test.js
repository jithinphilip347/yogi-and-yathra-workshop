import { describe, it, expect, beforeEach } from 'vitest';
import cartReducer, {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setValidationSuccess,
  setValidationStart,
  sanitizePersistedCart,
  ensureCartShape,
} from '@/features/commerce/slices/cartSlice';
import {
  selectCartItems,
  selectCartItemCount,
  selectCartSubtotal,
  selectClassifiedCartItems,
  selectIsMixedCart,
  selectCartLearningSubtotal,
  selectCartPhysicalSubtotal,
  selectHasCartBlockingErrors,
} from '@/features/commerce/selectors/commerceSelectors';
import { CommerceAdapter } from '@/features/commerce/adapters/CommerceAdapter';
import { PRODUCT_TYPES } from '@/features/commerce/constants';

describe('Sprint 4 — Unified Multi-Item Cart', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      items: [],
      isDrawerOpen: false,
      appliedCoupon: null,
      isProcessing: false,
      error: null,
      validation: {
        isValidating: false,
        lastValidated: null,
        checkoutSessionId: null,
        hasErrors: false,
        hasChanges: false,
        summary: null,
      },
    };
  });

  describe('CommerceAdapter Normalization & Identity', () => {
    it('normalizes a course with deterministic cart_key and workshop domain', () => {
      const course = {
        id: 10,
        title: 'Ashtanga Vinyasa',
        price: 2000,
        discount_price: 1500,
        slug: 'ashtanga-vinyasa',
      };
      const normalized = CommerceAdapter.fromCourse(course);

      expect(normalized.cart_key).toBe('course:10');
      expect(normalized.domain).toBe('workshop');
      expect(normalized.price).toBe(1500);
      expect(normalized.productable_type).toBe(PRODUCT_TYPES.COURSE);
      expect(normalized.productable_id).toBe(10);
    });

    it('normalizes a physical product with deterministic cart_key and ecommerce domain', () => {
      const product = {
        id: 45,
        name: 'Organic Cotton Yoga Mat',
        price: 1200,
        sale_price: 999,
        stock: 15,
      };
      const normalized = CommerceAdapter.fromProduct(product);

      expect(normalized.cart_key).toBe('product:45');
      expect(normalized.domain).toBe('ecommerce');
      expect(normalized.price).toBe(999);
      expect(normalized.productable_type).toBe(PRODUCT_TYPES.PRODUCT);
      expect(normalized.productable_id).toBe(45);
    });

    it('normalizes a combo bundle with deterministic cart_key and combo productable_type', () => {
      const combo = {
        id: 8,
        title: 'Meditation Cushion & Bell Bundle',
        price: 2500,
        combo_price: 1999,
      };
      const normalized = CommerceAdapter.fromCombo(combo);

      expect(normalized.cart_key).toBe('combo:8');
      expect(normalized.domain).toBe('ecommerce');
      expect(normalized.price).toBe(1999);
      expect(normalized.productable_type).toBe(PRODUCT_TYPES.COMBO);
      expect(normalized.productable_id).toBe(8);
    });
  });

  describe('Cart Reducer — Multi-Item & Quantity Rules', () => {
    it('adds course and enforces quantity = 1 even on duplicate add', () => {
      const courseItem = CommerceAdapter.fromCourse({
        id: 1,
        title: 'Hatha Flow',
        price: 1000,
      });

      // Add course first time
      let state = cartReducer(initialState, addToCart(courseItem));
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(1);

      // Attempt to add same course again -> must NOT increment, stays 1
      state = cartReducer(state, addToCart(courseItem));
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(1);
    });

    it('adds physical product and increments quantity on duplicate add', () => {
      const productItem = CommerceAdapter.fromProduct({
        id: 20,
        name: 'Cork Block',
        price: 400,
      });

      // Add product first time -> quantity = 1
      let state = cartReducer(initialState, addToCart(productItem));
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(1);

      // Add same product again -> quantity increments to 2
      state = cartReducer(state, addToCart(productItem));
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(2);
    });

    it('supports a genuine mixed cart (Course + Product + Combo)', () => {
      const course = CommerceAdapter.fromCourse({ id: 5, title: 'Pranayama', price: 800 });
      const product = CommerceAdapter.fromProduct({ id: 12, name: 'Yoga Strap', price: 250 });
      const combo = CommerceAdapter.fromCombo({ id: 3, title: 'Yoga Starter Kit', combo_price: 1500 });

      let state = cartReducer(initialState, addToCart(course));
      state = cartReducer(state, addToCart(product));
      state = cartReducer(state, addToCart(combo));

      expect(state.items).toHaveLength(3);
      expect(state.items.map((i) => i.cart_key)).toEqual(['course:5', 'product:12', 'combo:3']);
    });

    it('prevents increasing quantity of learning items via updateQuantity', () => {
      const course = CommerceAdapter.fromCourse({ id: 5, title: 'Pranayama', price: 800 });
      let state = cartReducer(initialState, addToCart(course));

      // Attempt to set course quantity to 5
      state = cartReducer(state, updateQuantity({ cart_key: 'course:5', quantity: 5 }));
      expect(state.items[0].quantity).toBe(1); // Clamped to 1
    });

    it('allows updating quantity of physical products via updateQuantity', () => {
      const product = CommerceAdapter.fromProduct({ id: 12, name: 'Yoga Strap', price: 250 });
      let state = cartReducer(initialState, addToCart(product));

      state = cartReducer(state, updateQuantity({ cart_key: 'product:12', quantity: 4 }));
      expect(state.items[0].quantity).toBe(4);
    });

    it('removes item cleanly by cart_key or legacy composite key', () => {
      const course = CommerceAdapter.fromCourse({ id: 1, title: 'Course 1', price: 500 });
      const product = CommerceAdapter.fromProduct({ id: 2, name: 'Product 2', price: 300 });

      let state = cartReducer(initialState, addToCart(course));
      state = cartReducer(state, addToCart(product));
      expect(state.items).toHaveLength(2);

      // Remove course by cart_key
      state = cartReducer(state, removeFromCart('course:1'));
      expect(state.items).toHaveLength(1);
      expect(state.items[0].cart_key).toBe('product:2');

      // Remove product by object
      state = cartReducer(state, removeFromCart({ productable_type: 'Product', productable_id: 2 }));
      expect(state.items).toHaveLength(0);
    });

    it('clears cart and resets validation state', () => {
      const course = CommerceAdapter.fromCourse({ id: 1, title: 'Course 1', price: 500 });
      let state = cartReducer(initialState, addToCart(course));
      state = cartReducer(state, clearCart());

      expect(state.items).toEqual([]);
      expect(state.validation.hasErrors).toBe(false);
    });
  });

  describe('Selectors — Classification & Mixed Cart', () => {
    it('correctly classifies items into workshop and ecommerce sets', () => {
      const rootState = {
        cart: {
          items: [
            { cart_key: 'course:1', productable_type: 'Course', productable_id: 1, price: 1000, quantity: 1, domain: 'workshop' },
            { cart_key: 'product:2', productable_type: 'Product', productable_id: 2, price: 500, quantity: 2, domain: 'ecommerce' },
            { cart_key: 'combo:3', productable_type: 'Combo', productable_id: 3, price: 1200, quantity: 1, domain: 'ecommerce' },
          ],
        },
      };

      const classified = selectClassifiedCartItems(rootState);
      expect(classified.workshopItems).toHaveLength(1);
      expect(classified.ecommerceItems).toHaveLength(2);
      expect(selectIsMixedCart(rootState)).toBe(true);

      expect(selectCartItemCount(rootState)).toBe(4); // 1 + 2 + 1
      expect(selectCartLearningSubtotal(rootState)).toBe(1000);
      expect(selectCartPhysicalSubtotal(rootState)).toBe(2200); // 500*2 + 1200*1
      expect(selectCartSubtotal(rootState)).toBe(3200);
    });

    it('detects un-mixed carts (learning only or physical only)', () => {
      const learningOnlyState = {
        cart: {
          items: [
            { cart_key: 'course:1', productable_type: 'Course', productable_id: 1, price: 1000, quantity: 1, domain: 'workshop' },
            { cart_key: 'course:2', productable_type: 'Course', productable_id: 2, price: 800, quantity: 1, domain: 'workshop' },
          ],
        },
      };

      expect(selectIsMixedCart(learningOnlyState)).toBe(false);
    });

    it('detects blocking errors when item has out_of_stock or unavailable status', () => {
      const stateWithErrors = {
        cart: {
          items: [
            { cart_key: 'course:1', price: 1000, validationStatus: 'valid' },
            { cart_key: 'product:2', price: 500, validationStatus: 'out_of_stock' },
          ],
          validation: { hasErrors: true },
        },
      };

      expect(selectHasCartBlockingErrors(stateWithErrors)).toBe(true);
    });
  });

  describe('Server Validation Synchronization', () => {
    it('syncs updated prices and statuses without wiping local cart items', () => {
      const course = CommerceAdapter.fromCourse({ id: 1, title: 'Course 1', price: 1000 });
      const product = CommerceAdapter.fromProduct({ id: 2, name: 'Yoga Mat', price: 500 });

      let state = cartReducer(initialState, addToCart(course));
      state = cartReducer(state, addToCart(product));

      const validationPayload = {
        valid: true,
        checkout_session_id: 'sess-uuid-1234',
        summary: {
          total_items: 2,
          subtotal: 1700,
          has_errors: false,
          has_changes: true,
          is_mixed: true,
        },
        items: [
          {
            cart_key: 'course:1',
            type: 'course',
            id: 1,
            unit_price: 1100, // Price increased from 1000 to 1100
            original_price: 1500,
            status: 'price_changed',
            price_changed: true,
            old_price: 1000,
            new_price: 1100,
          },
          {
            cart_key: 'product:2',
            type: 'product',
            id: 2,
            unit_price: 600, // Price increased from 500 to 600
            original_price: 700,
            status: 'price_changed',
            price_changed: true,
            old_price: 500,
            new_price: 600,
          },
        ],
      };

      state = cartReducer(state, setValidationSuccess(validationPayload));

      expect(state.validation.checkoutSessionId).toBe('sess-uuid-1234');
      expect(state.validation.hasChanges).toBe(true);
      expect(state.items[0].price).toBe(1100);
      expect(state.items[0].price_changed).toBe(true);
      expect(state.items[1].price).toBe(600);
      expect(state.items[1].price_changed).toBe(true);
    });
  });

  describe('Legacy Cart Migration & Sanitization', () => {
    it('safely parses and migrates legacy cart items with missing cart_keys', () => {
      const corruptedPersistedState = {
        items: [
          null, // Corrupted item
          { id: 'random_id', productable_type: 'Course', productable_id: 99, price: 900 },
          { productable_type: 'Product', productable_id: 40, price: 300, quantity: 3 },
          { invalid: true }, // Missing ID and type
        ],
      };

      const state = cartReducer(corruptedPersistedState, sanitizePersistedCart());

      // Null and invalid items are discarded safely
      expect(state.items).toHaveLength(2);
      expect(state.items[0].cart_key).toBe('course:99');
      expect(state.items[0].domain).toBe('workshop');
      expect(state.items[0].quantity).toBe(1); // Enforced to 1

      expect(state.items[1].cart_key).toBe('product:40');
      expect(state.items[1].domain).toBe('ecommerce');
      expect(state.items[1].quantity).toBe(3);
    });
  });

  /**
   * A cart persisted by an older build reaches the store WITHOUT fields added
   * later: redux-persist merges a persisted slice over the slice's initial state,
   * and a key that was never written stays missing in JSON. Every reducer that
   * writes `state.validation.*` then threw
   * "Cannot set properties of undefined (setting 'hasErrors')" and the item was
   * silently never added — the first Add to Cart click on a stale cart looked dead.
   */
  describe('Legacy / rehydrated cart shape', () => {
    const physical = () => ({
      productable_type: PRODUCT_TYPES.PRODUCT,
      productable_id: 10,
      title: 'Organic Cotton Yoga Mat',
      price: 999,
      quantity: 1,
    });

    /** Exactly what an older build left in storage: no `validation` key at all. */
    const legacyCart = () => ({
      items: [],
      isDrawerOpen: false,
      appliedCoupon: null,
      isProcessing: false,
      error: null,
    });

    it('adds to a cart persisted before `validation` existed', () => {
      const state = cartReducer(legacyCart(), addToCart(physical()));

      expect(state.items.map((i) => i.cart_key)).toEqual(['product:10']);
      expect(state.validation).toBeTruthy();
      expect(state.validation.hasErrors).toBe(false);
      expect(state.isDrawerOpen).toBe(true);
    });

    it('keeps merging re-adds from a legacy cart', () => {
      let state = cartReducer(legacyCart(), addToCart(physical()));
      state = cartReducer(state, addToCart(physical()));

      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(2);
    });

    it('does not throw when other cart actions run on a legacy cart', () => {
      const legacy = legacyCart();

      expect(() => cartReducer(legacy, setValidationStart())).not.toThrow();
      expect(cartReducer(legacy, setValidationStart()).validation.isValidating).toBe(true);
      expect(() =>
        cartReducer(legacy, setValidationSuccess({ valid: true, items: [] }))
      ).not.toThrow();
      expect(() =>
        cartReducer(legacy, removeFromCart({ productable_type: 'product', productable_id: 10 }))
      ).not.toThrow();
      expect(() =>
        cartReducer(legacy, updateQuantity({ productable_type: 'product', productable_id: 10, quantity: 3 }))
      ).not.toThrow();
      expect(() => cartReducer(legacy, sanitizePersistedCart())).not.toThrow();
      expect(() => cartReducer(legacy, clearCart())).not.toThrow();
    });

    it('repairs a truncated `items` instead of trusting it', () => {
      const corrupted = { ...legacyCart(), items: 'nonsense', validation: null };
      const state = cartReducer(corrupted, addToCart(physical()));

      expect(Array.isArray(state.items)).toBe(true);
      expect(state.items.map((i) => i.cart_key)).toEqual(['product:10']);
      expect(state.validation.hasErrors).toBe(false);
    });

    it('leaves a well-formed cart object untouched', () => {
      const sound = initialState;

      // Same reference: the healthy path must not clone on every action.
      expect(ensureCartShape(sound)).toBe(sound);
      expect(cartReducer(sound, addToCart(physical())).items).toHaveLength(1);
    });

    it('still initialises normally when there is no persisted state', () => {
      const state = cartReducer(undefined, { type: '@@INIT' });

      expect(state.items).toEqual([]);
      expect(state.validation.hasErrors).toBe(false);
    });
  });
});
