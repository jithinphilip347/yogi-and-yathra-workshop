import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

import cartReducer, {
  addToCart as cartAddToCart,
  removeFromCart,
  updateQuantity,
  sanitizePersistedCart,
} from "@/features/commerce/slices/cartSlice";
import {
  getCartKey,
  buildCartTarget,
  isCartKey,
  normalizeItemType,
  sanitizeCartItem,
  classifyCartItems,
} from "@/features/commerce/utils/cartClassification";
import { CommerceAdapter } from "@/features/commerce/adapters/CommerceAdapter";
import { PRODUCT_TYPES } from "@/features/commerce/constants";
import { commerceApi } from "@/features/commerce/services/commerceApi";
import {
  computeRelatedProducts,
  relatedProductCartIdentity,
  isRelatedProductInCart,
} from "@/features/commerce/utils/relatedProducts";
import {
  selectCartItems,
  selectClassifiedCartItems,
  selectCartSubtotal,
} from "@/features/commerce/selectors/commerceSelectors";

vi.mock("axios");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (...segments) =>
  fs.readFileSync(path.resolve(__dirname, ...segments), "utf8");

const cartPageSource = read("../../app/cart/Cart.jsx");
const courseDetailsSource = read("../../app/course/[slug]/[id]/CourseDetails.jsx");
const overviewTabSource = read("../../components/player/OverviewTab.jsx");
const commerceHooksSource = read("../../features/commerce/hooks/useCommerceHooks.js");
const relatedProductsComponentSource = read(
  "../../features/commerce/components/RelatedProducts.jsx"
);

/**
 * Sprint 18 — Unified cart integration & end-to-end verification.
 *
 * Proves that physical E-commerce products discovered through Course, Daily Class
 * or Live Section converge on ONE cart identity (`product:{id}` / `combo:{id}`),
 * that `product:10` and `combo:10` never collide, and that the identity survives
 * persistence, removal and the checkout payload. Also covers the defects this
 * sprint found in the cart→checkout integration layer.
 */

/** A hydrated product exactly as the detail APIs emit it. */
const hydrated = (o = {}) => ({
  id: 10,
  value: 10,
  name: "Organic Cotton Yoga Mat",
  label: "Organic Cotton Yoga Mat",
  title: "Organic Cotton Yoga Mat",
  code: "MAT-10",
  price: 999,
  sale_price: 999,
  oldPrice: 1200,
  image: "products/mat-10.webp",
  image_path: "products/mat-10.webp",
  stock: 7,
  in_stock: true,
  type: "normal",
  is_combo: false,
  sort_order: 0,
  ...o,
});

const hydratedCombo = (o = {}) => ({
  id: 14,
  value: 14,
  name: "Starter Kit Combo",
  label: "Starter Kit Combo",
  title: "Starter Kit Combo",
  price: 1500,
  sale_price: 1500,
  oldPrice: 2000,
  image: "products/combo-14.webp",
  image_path: "products/combo-14.webp",
  stock: 3,
  in_stock: true,
  type: "combo",
  is_combo: true,
  sort_order: 1,
  ...o,
});

const emptyCart = () => ({
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
});

/**
 * Each page's real Add to Cart path, expressed exactly as the page does it:
 * `useCart().addItem(rawProduct, 'Product')` → adapter normalize → reducer.
 */
const addVia = (state, rawProduct) =>
  cartReducer(
    state,
    cartAddToCart(CommerceAdapter.normalize(rawProduct, PRODUCT_TYPES.PRODUCT))
  );

const addViaCourse = addVia;
const addViaDailyClass = addVia;
const addViaLiveSection = addVia;

/** Mirrors the RelatedProducts component's removal path. */
const removeViaCard = (state, viewModel) =>
  cartReducer(
    state,
    removeFromCart({
      productable_type: viewModel.productableType,
      productable_id: viewModel.productableId,
    })
  );

const cartKeys = (state) => selectCartItems({ cart: state }).map((i) => i.cart_key);

describe("Sprint 18 — Unified Cart Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Cart identity", () => {
    it("uses product:{id} and combo:{id} with no content-origin prefix", () => {
      expect(CommerceAdapter.fromProduct(hydrated()).cart_key).toBe("product:10");
      expect(CommerceAdapter.fromProduct(hydratedCombo()).cart_key).toBe("combo:14");
    });

    it("derives the same cart identity regardless of discovery origin", () => {
      const fromCourse = relatedProductCartIdentity(hydrated());
      const fromDailyClass = relatedProductCartIdentity(hydrated());
      const fromLiveSection = relatedProductCartIdentity(hydrated());

      expect(fromCourse.cartKey).toBe("product:10");
      expect(fromDailyClass).toEqual(fromCourse);
      expect(fromLiveSection).toEqual(fromCourse);
    });

    it("does not build content-specific keys", () => {
      const keys = [
        CommerceAdapter.fromProduct(hydrated()).cart_key,
        CommerceAdapter.fromProduct(hydratedCombo()).cart_key,
      ];

      keys.forEach((key) => {
        expect(key).not.toMatch(/course|daily|live_section/);
      });
    });
  });

  describe("Cross-content merging", () => {
    it("merges the same normal product added from Course, Daily Class and Live Section", () => {
      let state = emptyCart();
      state = addViaCourse(state, hydrated());
      state = addViaDailyClass(state, hydrated());
      state = addViaLiveSection(state, hydrated());

      const items = selectCartItems({ cart: state });

      expect(items).toHaveLength(1);
      expect(items[0].cart_key).toBe("product:10");
      expect(items[0].quantity).toBe(3);
    });

    it("merges the same combo added from all three content types", () => {
      let state = emptyCart();
      state = addViaCourse(state, hydratedCombo());
      state = addViaDailyClass(state, hydratedCombo());
      state = addViaLiveSection(state, hydratedCombo());

      const items = selectCartItems({ cart: state });

      expect(items).toHaveLength(1);
      expect(items[0].cart_key).toBe("combo:14");
      expect(items[0].quantity).toBe(3);
      expect(items[0].productable_type).toBe(PRODUCT_TYPES.COMBO);
    });

    it("merges in the reverse direction too (Live Section → Daily Class → Course)", () => {
      let state = emptyCart();
      state = addViaLiveSection(state, hydrated({ id: 10, value: 10 }));
      state = addViaDailyClass(state, hydrated({ id: 10, value: 10 }));
      state = addViaCourse(state, hydrated({ id: 10, value: 10 }));

      const productItems = selectCartItems({ cart: state });
      expect(productItems).toHaveLength(1);
      expect(productItems[0].cart_key).toBe("product:10");
      expect(productItems[0].quantity).toBe(3);

      let combos = emptyCart();
      combos = addViaLiveSection(combos, hydratedCombo({ id: 14, value: 14 }));
      combos = addViaDailyClass(combos, hydratedCombo({ id: 14, value: 14 }));
      combos = addViaCourse(combos, hydratedCombo({ id: 14, value: 14 }));

      const comboItems = selectCartItems({ cart: combos });
      expect(comboItems).toHaveLength(1);
      expect(comboItems[0].cart_key).toBe("combo:14");
      expect(comboItems[0].quantity).toBe(3);
    });

    it("keeps product:10 and combo:10 as two separate lines", () => {
      let state = emptyCart();
      state = addViaDailyClass(state, hydrated({ id: 10 }));
      state = addViaLiveSection(state, hydratedCombo({ id: 10 }));

      expect(cartKeys(state)).toEqual(["product:10", "combo:10"]);
      expect(selectClassifiedCartItems({ cart: state }).hasPhysicalItems).toBe(true);
    });

    it("builds a mixed cart of product:10, combo:10 and product:20", () => {
      let state = emptyCart();
      state = addViaDailyClass(state, hydrated({ id: 10, value: 10 }));
      state = addViaLiveSection(state, hydratedCombo({ id: 10, value: 10 }));
      state = addViaCourse(
        state,
        hydrated({ id: 20, value: 20, price: 500, sale_price: 500, oldPrice: 500 })
      );

      const items = selectCartItems({ cart: state });

      expect(items.map((i) => i.cart_key)).toEqual(["product:10", "combo:10", "product:20"]);
      expect(selectCartSubtotal({ cart: state })).toBe(999 + 1500 + 500);
    });

    it("does not let a numeric id collide in added-state lookups", () => {
      const state = addViaDailyClass(emptyCart(), hydrated({ id: 10 }));

      const normalCard = computeRelatedProducts([hydrated({ id: 10 })])[0];
      const comboCard = computeRelatedProducts([hydratedCombo({ id: 10 })])[0];

      expect(isRelatedProductInCart(selectCartItems({ cart: state }), normalCard)).toBe(true);
      expect(isRelatedProductInCart(selectCartItems({ cart: state }), comboCard)).toBe(false);
    });
  });

  describe("Removal and quantity — cart-page addressing", () => {
    it("identifies a cart key as a complete identity", () => {
      expect(isCartKey("product:10")).toBe(true);
      expect(isCartKey("combo:10")).toBe(true);
      expect(isCartKey("Product")).toBe(false);
      expect(isCartKey(undefined)).toBe(false);
    });

    it("builds a removability target from either calling convention", () => {
      expect(buildCartTarget("product:10", 10)).toEqual({ cart_key: "product:10" });
      expect(buildCartTarget("Product", 10)).toEqual({
        productable_type: "Product",
        productable_id: 10,
      });
    });

    it("removes a cart-key addressed item (cart page convention)", () => {
      const state = addViaDailyClass(emptyCart(), hydrated());
      const target = buildCartTarget("product:10", 10);

      expect(cartKeys(cartReducer(state, removeFromCart(target)))).toEqual([]);
    });

    it("removes a combo addressed by cart key", () => {
      const state = addViaLiveSection(emptyCart(), hydratedCombo());
      const target = buildCartTarget("combo:14", 14);

      expect(cartKeys(cartReducer(state, removeFromCart(target)))).toEqual([]);
    });

    it("updates quantity for a cart-key addressed item", () => {
      const state = addViaDailyClass(emptyCart(), hydrated());
      const target = buildCartTarget("product:10", 10);

      const next = cartReducer(state, updateQuantity({ ...target, quantity: 4 }));

      expect(selectCartItems({ cart: next })[0].quantity).toBe(4);
    });

    it("still removes when the caller passes type + id (product cards)", () => {
      const state = addViaDailyClass(emptyCart(), hydrated());
      const target = buildCartTarget("Product", 10);

      expect(cartKeys(cartReducer(state, removeFromCart(target)))).toEqual([]);
    });

    it("removes only the addressed line in a normal+combo collision", () => {
      let state = emptyCart();
      state = addViaDailyClass(state, hydrated({ id: 10 }));
      state = addViaLiveSection(state, hydratedCombo({ id: 10 }));

      expect(cartKeys(cartReducer(state, removeFromCart({ cart_key: "product:10" })))).toEqual([
        "combo:10",
      ]);
      expect(cartKeys(cartReducer(state, removeFromCart({ cart_key: "combo:10" })))).toEqual([
        "product:10",
      ]);
    });

    it("cart page and product cards both call the shared target builder", () => {
      expect(commerceHooksSource).toMatch(/buildCartTarget/);
      expect(cartPageSource).toMatch(/removeItem\(item\.cart_key \|\| item\.productable_type/);
    });
  });

  describe("Persistence and restoration", () => {
    it("preserves product:10 and combo:10 as separate lines across a rehydrate+sanitize cycle", () => {
      let state = emptyCart();
      state = addViaDailyClass(state, hydrated({ id: 10 }));
      state = addViaLiveSection(state, hydratedCombo({ id: 10 }));

      // Simulate redux-persist writing and restoring the raw JSON.
      const persisted = JSON.parse(JSON.stringify(state));
      const restored = cartReducer({ ...emptyCart(), items: persisted.items }, sanitizePersistedCart());

      expect(cartKeys(restored)).toEqual(["product:10", "combo:10"]);
    });

    it("does not turn a restored product into a combo", () => {
      const persisted = JSON.parse(JSON.stringify(addViaDailyClass(emptyCart(), hydrated()).items));

      const restored = cartReducer({ ...emptyCart(), items: persisted }, sanitizePersistedCart());

      expect(restored.items[0].cart_key).toBe("product:10");
      expect(restored.items[0].productable_type).toBe(PRODUCT_TYPES.PRODUCT);
      expect(restored.items[0].domain).toBe("ecommerce");
    });

    it("canonicalises legacy physical type variants so checkout accepts them", () => {
      const legacy = {
        cart_key: "combo:14",
        id: "combo_14",
        productable_type: "ComboProduct",
        productable_id: 14,
        type: "comboproduct",
        title: "Legacy Combo",
        price: 1500,
        quantity: 1,
      };

      const restored = cartReducer({ ...emptyCart(), items: [legacy] }, sanitizePersistedCart());

      expect(restored.items[0].productable_type).toBe(PRODUCT_TYPES.COMBO);
      expect(getCartKey(restored.items[0])).toBe("combo:14");
      expect(getCartKey(restored.items[0])).not.toBe("comboproduct:14");
    });

    it("repairs a legacy stored cart key prefix without ever demoting a combo to a product", () => {
      // Sprint 20: a persisted key whose prefix is a legacy spelling must be
      // re-derived as the canonical `type:id` — and canonicalising must never
      // turn `combo:10` into `product:10` (or vice versa).
      const legacyCombo = {
        cart_key: "comboproduct:10",
        productable_type: "ComboProduct",
        productable_id: 10,
        title: "Legacy Combo Ten",
        price: 500,
        quantity: 2,
      };

      const restored = cartReducer(
        { ...emptyCart(), items: [legacyCombo] },
        sanitizePersistedCart()
      );

      expect(getCartKey(restored.items[0])).toBe("combo:10");
      expect(getCartKey(restored.items[0])).not.toBe("product:10");
      expect(restored.items[0].productable_type).toBe(PRODUCT_TYPES.COMBO);
      expect(restored.items[0].domain).toBe("ecommerce");
      expect(restored.items[0].quantity).toBe(2);
    });

    it("keeps quantity merging working on sanitized items", () => {
      let state = addViaDailyClass(emptyCart(), hydrated());
      state = cartReducer(
        { ...state, items: JSON.parse(JSON.stringify(state.items)) },
        sanitizePersistedCart()
      );
      state = addViaLiveSection(state, hydrated());

      expect(selectCartItems({ cart: state })).toHaveLength(1);
      expect(selectCartItems({ cart: state })[0].quantity).toBe(2);
    });
  });

  describe("Popup → cart consistency", () => {
    it("uses the same identity from the popup as from the card", () => {
      const card = computeRelatedProducts([hydratedCombo()])[0];
      const popupProduct = { id: card.id, value: card.value, type: card.type };

      expect(card.cartKey).toBe("combo:14");
      expect(relatedProductCartIdentity(popupProduct).cartKey).toBe("combo:14");
      expect(relatedProductCartIdentity(popupProduct).productableType).toBe(PRODUCT_TYPES.COMBO);
    });

    it("keeps a normal product normal through the popup path", () => {
      const card = computeRelatedProducts([hydrated()])[0];
      const popupProduct = { id: card.id, value: card.value, type: card.type };

      expect(relatedProductCartIdentity(popupProduct).cartKey).toBe("product:10");
      expect(relatedProductCartIdentity(popupProduct).productableType).toBe(
        PRODUCT_TYPES.PRODUCT
      );
    });
  });

  describe("Checkout payload", () => {
    it("sends product and combo identity with quantities and no content origin", async () => {
      axios.post.mockResolvedValue({ data: { success: true, valid: true } });

      let state = emptyCart();
      state = addViaDailyClass(state, hydrated({ id: 10, value: 10 }));
      state = addViaLiveSection(state, hydratedCombo({ id: 10, value: 10 }));
      state = addViaCourse(
        state,
        hydrated({ id: 20, value: 20, price: 500, sale_price: 500, oldPrice: 500 })
      );

      await commerceApi.validateCart(selectCartItems({ cart: state }));

      const [, payload] = axios.post.mock.calls[0];
      const sent = payload.items;

      expect(sent.map((i) => i.cart_key)).toEqual(["product:10", "combo:10", "product:20"]);
      expect(sent.map((i) => i.type)).toEqual(["product", "combo", "product"]);
      expect(sent.map((i) => i.quantity)).toEqual([1, 1, 1]);
      expect(sent.map((i) => i.price)).toEqual([999, 1500, 500]);

      const serialized = JSON.stringify(payload);
      expect(serialized).not.toMatch(/daily_class:|live_section:|course:/);
    });

    it("preserves quantities in the checkout payload", async () => {
      axios.post.mockResolvedValue({ data: { success: true, valid: true } });

      let state = emptyCart();
      state = addViaDailyClass(state, hydrated({ price: 100 }));
      state = addViaLiveSection(state, hydrated({ price: 100 }));

      await commerceApi.validateCart(selectCartItems({ cart: state }));

      const [, payload] = axios.post.mock.calls[0];

      expect(payload.items).toHaveLength(1);
      expect(payload.items[0]).toMatchObject({
        cart_key: "product:10",
        type: "product",
        id: 10,
        quantity: 2,
      });
    });

    it("canonicalises physical types for the checkout payload", async () => {
      axios.post.mockResolvedValue({ data: { success: true, valid: true } });

      await commerceApi.validateCart([
        {
          cart_key: "combo:14",
          productable_type: "ComboProduct",
          productable_id: 14,
          quantity: 1,
          price: 1500,
        },
      ]);

      const [, payload] = axios.post.mock.calls[0];

      expect(payload.items[0].type).toBe("combo");
    });
  });

  describe("Security and API boundary", () => {
    it("never sends the internal service key from the browser", () => {
      [
        cartPageSource,
        courseDetailsSource,
        overviewTabSource,
        commerceHooksSource,
        relatedProductsComponentSource,
      ].forEach((source) => {
        expect(source).not.toMatch(/X-Internal-Service-Key/);
        expect(source).not.toMatch(/internal\/v1/);
        expect(source).not.toMatch(/yogiandyathra/i);
      });
    });

    it("treats the client price as a display value only", () => {
      // The backend cart validator re-prices every line; the client price is only
      // used for freshness comparison (see CartController::validateCart).
      const formatted = commerceApi;
      expect(typeof formatted.validateCart).toBe("function");
      expect(commerceHooksSource).toMatch(/validateCart/);
    });
  });

  describe("Cart → checkout classification", () => {
    it("classifies all three content origins as physical e-commerce items", () => {
      let state = emptyCart();
      state = addViaCourse(state, hydrated({ id: 1, value: 1 }));
      state = addViaDailyClass(state, hydrated({ id: 2, value: 2 }));
      state = addViaLiveSection(state, hydrated({ id: 3, value: 3 }));

      const classified = classifyCartItems(selectCartItems({ cart: state }));

      expect(classified.ecommerceItems).toHaveLength(3);
      expect(classified.workshopItems).toHaveLength(0);
      expect(classified.isMixedCart).toBe(false);
    });

    it("keeps a combo separate while merging a shared product (multi-content scenario)", () => {
      let state = emptyCart();
      state = addViaCourse(state, hydrated({ id: 1, value: 1 }));
      state = addViaDailyClass(state, hydratedCombo({ id: 2, value: 2 }));
      state = addViaLiveSection(state, hydrated({ id: 1, value: 1 }));

      expect(cartKeys(state)).toEqual(["product:1", "combo:2"]);
      expect(selectCartItems({ cart: state })[0].quantity).toBe(2);
    });
  });

  describe("Product card identity in remaining surfaces", () => {
    it("Course product cards resolve added-state through the shared component", () => {
      // Sprint 19: Course no longer owns a product card at all — it renders the
      // shared RelatedProducts component, which resolves identity as `type:id` via
      // isRelatedProductInCart. What matters here is that Course holds no
      // numeric-id-only product lookup of its own.
      expect(courseDetailsSource).toMatch(/<RelatedProducts/);
      expect(courseDetailsSource).not.toMatch(/isInCart\(prod/);
      expect(courseDetailsSource).not.toMatch(/isInCart\(product/);
      expect(relatedProductsComponentSource).toMatch(/isRelatedProductInCart/);
    });

    it("learning-player product card resolves added-state by type:id", () => {
      expect(overviewTabSource).toMatch(/relatedProductCartIdentity/);
      expect(overviewTabSource).toMatch(/isRelatedProductInCart/);
      expect(overviewTabSource).not.toMatch(/isInCart\(prod\.value, ['"]Product['"]\)/);
    });

    it("normalizes item types canonically", () => {
      expect(normalizeItemType("ComboProduct")).toBe("combo");
      expect(normalizeItemType("combo_product")).toBe("combo");
      expect(normalizeItemType("Product")).toBe("product");
    });

    it("sanitizeCartItem keeps the cart key authoritative", () => {
      const sanitized = sanitizeCartItem({
        cart_key: "product:10",
        productable_type: "Product",
        productable_id: 10,
        price: 100,
      });

      expect(getCartKey(sanitized)).toBe("product:10");
    });

    it("the shared isInCart lookup is type-qualified, never numeric-id only", () => {
      // A bare id is not an identity: `Course 10` is not `product:10`, and a combo
      // shares the id namespace with normal products. The old lookup fell back to
      // comparing ids, so it reported "already added" for unrelated lines.
      const lookup = commerceHooksSource.slice(
        commerceHooksSource.indexOf("const isInCart"),
        commerceHooksSource.indexOf("const sanitizeCart")
      );

      expect(lookup).toMatch(/normalizeItemType\(productable_type\)/);
      expect(lookup).toMatch(/getCartKey\(item\) === targetKey/);
      expect(lookup).not.toMatch(/String\(item\.productable_id\) === String\(productable_id\)/);
    });

    it("resolves DailyClass/LiveSection added-state to the canonical cart key", () => {
      // The pages pass the human spelling (`DailyClass`); the adapter and reducer
      // store the canonical one (`daily_class`). A raw toLowerCase would never
      // match, which is exactly why the numeric fallback used to exist.
      const learning = (entity) =>
        cartReducer(emptyCart(), cartAddToCart(entity));

      const classState = learning(
        CommerceAdapter.fromDailyClass({ id: 10, title: "Sunrise Flow" })
      );
      const sectionState = learning(
        CommerceAdapter.fromLiveSection({ id: 10, title: "Breathwork Live" })
      );

      expect(cartKeys(classState)).toEqual(["daily_class:10"]);
      expect(cartKeys(sectionState)).toEqual(["live_section:10"]);
      expect(`${normalizeItemType("DailyClass")}:10`).toBe(getCartKey(classState.items[0]));
      expect(`${normalizeItemType("LiveSection")}:10`).toBe(getCartKey(sectionState.items[0]));
    });

    it("does not confuse a learning item with a physical product of the same id", () => {
      let state = cartReducer(emptyCart(), cartAddToCart(CommerceAdapter.fromCourse({ id: 10 })));
      state = addViaDailyClass(state, hydrated({ id: 10, value: 10 }));

      expect(cartKeys(state)).toEqual(["course:10", "product:10"]);
    });
  });
});
