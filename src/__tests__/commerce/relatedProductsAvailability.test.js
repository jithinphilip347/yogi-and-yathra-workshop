import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  computeRelatedProducts,
  relatedProductCartAction,
  isRelatedProductInCart,
} from "@/features/commerce/utils/relatedProducts";
import { CommerceAdapter } from "@/features/commerce/adapters/CommerceAdapter";
import { PRODUCT_TYPES } from "@/features/commerce/constants";
import cartReducer, {
  addToCart as cartAddToCart,
} from "@/features/commerce/slices/cartSlice";
import { selectCartItems } from "@/features/commerce/selectors/commerceSelectors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (...segments) =>
  fs.readFileSync(path.resolve(__dirname, ...segments), "utf8");

const relatedProductsComponentSource = read(
  "../../features/commerce/components/RelatedProducts.jsx"
);
const productDetailPopupSource = read("../../components/popup/ProductDetailPopup.jsx");
const courseDetailsSource = read("../../app/course/[slug]/[id]/CourseDetails.jsx");
const dailyClassSource = read("../../app/daily-class/[id]/[slug]/LiveDetails.jsx");
const liveSectionSource = read("../../app/live-section/[id]/[slug]/LiveYogaDetails.jsx");

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const relatedProductsCode = stripComments(relatedProductsComponentSource);
const popupCode = stripComments(productDetailPopupSource);

/**
 * Sprint 20 — related-product cart availability.
 *
 * Out of stock used to leave an enabled Add to Cart button: the customer could
 * add an unbuyable product and only discover it when the cart's server-side
 * validation refused to let them check out. The shared component now blocks that
 * single action — while never blocking removal of an item already in the cart —
 * and the server stays the final authority.
 */

/** Exactly the shape EcommerceClient::hydrateProducts() emits. */
const hydrated = (o = {}) => ({
  id: 10,
  value: 10,
  name: "Organic Cotton Yoga Mat",
  label: "Organic Cotton Yoga Mat",
  title: "Organic Cotton Yoga Mat",
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

const addViaContent = (state, raw) =>
  cartReducer(state, cartAddToCart(CommerceAdapter.normalize(raw, PRODUCT_TYPES.PRODUCT)));

describe("Sprint 20 — related product cart availability", () => {
  describe("availability derivation", () => {
    it("treats an explicitly out-of-stock product as unavailable", () => {
      const [product] = computeRelatedProducts([hydrated({ stock: 0, in_stock: false })]);

      expect(product.inStock).toBe(false);
      expect(relatedProductCartAction(product, false)).toBe("unavailable");
    });

    it("treats an in-stock product as addable", () => {
      const [product] = computeRelatedProducts([hydrated({ stock: 3, in_stock: true })]);

      expect(relatedProductCartAction(product, false)).toBe("add");
    });

    it("never blocks a product whose availability is unknown", () => {
      // An older payload without stock metadata must not make everything look
      // sold out.
      const [product] = computeRelatedProducts([
        hydrated({ stock: undefined, in_stock: undefined }),
      ]);

      expect(product.inStock).toBe(true);
      expect(relatedProductCartAction(product, false)).toBe("add");
    });

    it("descends a stock count of zero to unavailable even without in_stock", () => {
      const [product] = computeRelatedProducts([
        hydrated({ stock: 0, in_stock: undefined }),
      ]);

      expect(relatedProductCartAction(product, false)).toBe("unavailable");
    });
  });

  describe("removal always wins over availability", () => {
    it("keeps an out-of-stock product removable once it is in the cart", () => {
      const [product] = computeRelatedProducts([hydrated({ stock: 0, in_stock: false })]);

      // This is the important precedence: a customer who added the item while it
      // was in stock must still be able to take it out after it sells out.
      expect(relatedProductCartAction(product, true)).toBe("remove");
    });

    it("reports removal for an in-stock product already in the cart", () => {
      const [product] = computeRelatedProducts([hydrated()]);

      expect(relatedProductCartAction(product, true)).toBe("remove");
    });

    it("resolves the real cart state for an out-of-stock product", () => {
      const [product] = computeRelatedProducts([hydrated({ stock: 0, in_stock: false })]);

      const empty = selectCartItems({ cart: emptyCart() });
      expect(relatedProductCartAction(product, isRelatedProductInCart(empty, product))).toBe(
        "unavailable"
      );

      const filled = selectCartItems({ cart: addViaContent(emptyCart(), product.raw) });
      expect(isRelatedProductInCart(filled, product)).toBe(true);
      expect(
        relatedProductCartAction(product, isRelatedProductInCart(filled, product))
      ).toBe("remove");
    });

    it("keeps an out-of-stock combo removable by its own identity", () => {
      const [combo] = computeRelatedProducts([
        hydrated({ id: 14, value: 14, type: "combo", is_combo: true, stock: 0, in_stock: false }),
      ]);

      const cart = addViaContent(emptyCart(), combo.raw);
      const items = selectCartItems({ cart });
      expect(items[0].cart_key).toBe("combo:14");
      expect(relatedProductCartAction(combo, isRelatedProductInCart(items, combo))).toBe("remove");
    });
  });

  describe("shared component enforces it once", () => {
    it("derives the action from the shared helper rather than inline flags", () => {
      expect(relatedProductsCode).toMatch(/relatedProductCartAction/);
      expect(relatedProductsCode).toMatch(/const actionFor = \(product\)/);
    });

    it("disables the Add to Cart button when the product is unavailable", () => {
      expect(relatedProductsCode).toMatch(/disabled=\{action === "unavailable"\}/);
      expect(relatedProductsCode).toMatch(/aria-disabled=\{action === "unavailable"\}/);
    });

    it("labels the blocked action and keeps the out-of-stock note in sync", () => {
      expect(relatedProductsCode).toMatch(/"Out of Stock"/);
      expect(relatedProductsCode).toMatch(/action === "unavailable" && \(\s*<span className="StockNote">/);
    });

    it("makes the unavailable action a deliberate no-op", () => {
      expect(relatedProductsCode).toMatch(/if \(action === "remove"\)/);
      expect(relatedProductsCode).toMatch(/else if \(action === "add"\)/);

      // Only the two real actions call back out to the cart — there is no
      // `else` branch that could add an unavailable product.
      expect(relatedProductsCode).toMatch(/onRemoveFromCart\?\.\(product\)/);
      expect(relatedProductsCode).toMatch(/onAddToCart\?\.\(product\)/);
      expect(relatedProductsCode).not.toMatch(/else \{\s*onAddToCart/);
    });

    it("routes the detail popup through the same guarded decision", () => {
      expect(relatedProductsCode).toMatch(/onToggleCart=\{\(\) => toggleCart\(selected\)\}/);
      expect(relatedProductsCode).toMatch(/isAvailable=\{actionFor\(selected\) !== "unavailable"\}/);
    });

    it("blocks the popup action too, without breaking removal", () => {
      expect(popupCode).toMatch(/isAvailable = true/);
      expect(popupCode).toMatch(/disabled=\{!isAdded && !isAvailable\}/);
      expect(popupCode).toMatch(/Out of Stock/);
    });

    it("is applied consistently for all three content types", () => {
      // Every content type renders the same component, so none of them owns an
      // availability rule of its own.
      for (const source of [courseDetailsSource, dailyClassSource, liveSectionSource]) {
        expect(source).toMatch(/RelatedProducts/);
        expect(source).not.toMatch(/inStock\s*===\s*false/);
        expect(source).not.toMatch(/out of stock/i);
      }
    });
  });

  describe("server remains the authority", () => {
    it("never hard-removes an out-of-stock association from the payload", () => {
      // The product still renders; only its cart action is blocked.
      const viewModels = computeRelatedProducts([
        hydrated({ id: 10, value: 10, stock: 0, in_stock: false }),
        hydrated({ id: 20, value: 20, stock: 5, in_stock: true }),
      ]);

      expect(viewModels).toHaveLength(2);
      expect(viewModels.map((p) => p.inStock)).toEqual([false, true]);
    });

    it("documents that checkout validation is the final gate", () => {
      expect(relatedProductsComponentSource).toMatch(/server/i);
      expect(relatedProductsComponentSource).toMatch(/validation/i);
    });
  });
});
