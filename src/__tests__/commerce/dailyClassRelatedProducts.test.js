import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  computeRelatedProducts,
  isRelatedProductInCart,
  relatedProductCartIdentity,
  relatedProductImageUrl,
  relatedProductKey,
  relatedProductPricing,
  relatedProductAvailability,
} from "@/features/commerce/utils/relatedProducts";
import { CommerceAdapter } from "@/features/commerce/adapters/CommerceAdapter";
import { PRODUCT_TYPES } from "@/features/commerce/constants";
import cartReducer, { addToCart as cartAddToCart } from "@/features/commerce/slices/cartSlice";
import {
  selectCartItems,
  selectClassifiedCartItems,
} from "@/features/commerce/selectors/commerceSelectors";
import { PRODUCT_API_BASE_URL, PRODUCT_MEDIA_BASE_URL } from "@/utils/constants";
import productApiClient from "@/services/productApi";
import products from "@/libs/products";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIVE_DETAILS_PATH = path.resolve(
  __dirname,
  "../../app/daily-class/[id]/[slug]/LiveDetails.jsx"
);
const RELATED_PRODUCTS_COMPONENT_PATH = path.resolve(
  __dirname,
  "../../features/commerce/components/RelatedProducts.jsx"
);
const liveDetailsSource = fs.readFileSync(LIVE_DETAILS_PATH, "utf8");
const relatedProductsComponentSource = fs.readFileSync(
  RELATED_PRODUCTS_COMPONENT_PATH,
  "utf8"
);

/**
 * Sprint 16 — Daily Class related products, customer-facing.
 *
 * The detail API already returns live, batched, E-commerce-hydrated `products[]`.
 * These tests cover the derivation that sits between that response and the
 * existing product card + unified cart: display values, identity, ordering,
 * availability, malformed input, and cart integration.
 */

/** Shape exactly as returned by EcommerceClient::hydrateProducts(). */
const normalProduct = (overrides = {}) => ({
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
  ...overrides,
});

const comboProduct = (overrides = {}) => ({
  id: 14,
  value: 14,
  name: "Starter Kit Combo",
  label: "Starter Kit Combo",
  title: "Starter Kit Combo",
  code: "COMBO-14",
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
  ...overrides,
});

const cartReducerWithItems = (items = []) => ({
  items,
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
 * Mirrors the component's Add to Cart path exactly: the shared adapter normalizes
 * the hydrated product, then the existing unified cart reducer stores it.
 */
const addRelatedToCart = (state, viewModel) => {
  const normalized = CommerceAdapter.normalize(viewModel.raw, PRODUCT_TYPES.PRODUCT);
  return { normalized, next: cartReducer(state, cartAddToCart(normalized)) };
};

describe("Sprint 16 — Daily Class Related Products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering inputs derived from the detail response", () => {
    it("produces one card per hydrated product", () => {
      const products = computeRelatedProducts([normalProduct(), comboProduct()]);

      expect(products).toHaveLength(2);
      expect(products.map((p) => p.title)).toEqual([
        "Organic Cotton Yoga Mat",
        "Starter Kit Combo",
      ]);
    });

    it("handles a class with no associated products without breaking", () => {
      expect(computeRelatedProducts([])).toEqual([]);
      expect(computeRelatedProducts(undefined)).toEqual([]);
      expect(computeRelatedProducts(null)).toEqual([]);
      expect(computeRelatedProducts("not-an-array")).toEqual([]);
    });

    it("resolves display titles from label, name or title", () => {
      expect(computeRelatedProducts([normalProduct({ label: "A", name: "B", title: "C" })])[0].title).toBe("A");
      expect(computeRelatedProducts([normalProduct({ label: null, name: "B", title: "C" })])[0].title).toBe("B");
      expect(computeRelatedProducts([normalProduct({ label: null, name: null, title: "C" })])[0].title).toBe("C");
    });

    it("uses server-provided price without recomputing a discount", () => {
      const [card] = computeRelatedProducts([normalProduct({ price: 1499, sale_price: 1499, oldPrice: 1999 })]);

      expect(card.price).toBe(1499);
      expect(card.oldPrice).toBe(1999);
      expect(card.hasDiscount).toBe(true);
    });

    it("shows no strike-through price when there is no discount", () => {
      const [card] = computeRelatedProducts([normalProduct({ price: 1200, oldPrice: 1200 })]);

      expect(card.hasDiscount).toBe(false);
    });

    it("resolves product media through the shared commerce media base", () => {
      const [card] = computeRelatedProducts([normalProduct()]);

      expect(card.imageUrl).toBe(`${PRODUCT_MEDIA_BASE_URL}/products/mat-10.webp`);
      expect(card.imageUrl).toBe(relatedProductImageUrl(normalProduct()));
    });

    it("falls back to null image (caller uses a local placeholder) rather than a broken URL", () => {
      const [card] = computeRelatedProducts([normalProduct({ image: null, image_path: null })]);

      expect(card.imageUrl).toBeNull();
    });
  });

  describe("Product type identity", () => {
    it("renders normal products", () => {
      const [card] = computeRelatedProducts([normalProduct()]);

      expect(card.type).toBe("normal");
      expect(card.isCombo).toBe(false);
      expect(card.key).toBe("normal:10");
    });

    it("renders combo products", () => {
      const [card] = computeRelatedProducts([comboProduct()]);

      expect(card.type).toBe("combo");
      expect(card.isCombo).toBe(true);
      expect(card.key).toBe("combo:14");
    });

    it("keeps normal:10 and combo:10 as two distinct products", () => {
      const cards = computeRelatedProducts([
        normalProduct({ id: 10, value: 10, label: "Product Ten" }),
        comboProduct({ id: 10, value: 10, label: "Combo Ten" }),
      ]);

      expect(cards).toHaveLength(2);
      expect(cards.map((c) => c.key)).toEqual(["normal:10", "combo:10"]);
      expect(cards.map((c) => c.title)).toEqual(["Product Ten", "Combo Ten"]);
    });

    it("treats is_combo as authoritative when type is absent", () => {
      expect(relatedProductKey({ value: 10, is_combo: true })).toBe("combo:10");
      expect(relatedProductKey({ value: 10 })).toBe("normal:10");
    });
  });

  describe("Ordering", () => {
    it("preserves the server-provided order", () => {
      const cards = computeRelatedProducts([
        normalProduct({ id: 30, value: 30, sort_order: 0 }),
        normalProduct({ id: 12, value: 12, sort_order: 1 }),
        normalProduct({ id: 25, value: 25, sort_order: 2 }),
      ]);

      expect(cards.map((c) => c.id)).toEqual([30, 12, 25]);
    });

    it("preserves relative order when an entry in the middle is unusable", () => {
      const cards = computeRelatedProducts([
        normalProduct({ id: 30, value: 30 }),
        { id: null, value: null, label: "Broken" },
        normalProduct({ id: 25, value: 25 }),
      ]);

      expect(cards.map((c) => c.id)).toEqual([30, 25]);
    });
  });

  describe("Availability", () => {
    it("keeps an out-of-stock product visible and in the list", () => {
      const cards = computeRelatedProducts([normalProduct({ stock: 0, in_stock: false })]);

      expect(cards).toHaveLength(1);
      expect(cards[0].inStock).toBe(false);
      expect(cards[0].stock).toBe(0);
    });

    it("treats missing availability metadata as available", () => {
      expect(relatedProductAvailability({ value: 1 }).inStock).toBe(true);
      expect(relatedProductAvailability({ value: 1, stock: 0, in_stock: false }).inStock).toBe(false);
      expect(relatedProductAvailability({ value: 1, stock: 0 }).inStock).toBe(false);
    });
  });

  describe("Malformed payloads", () => {
    it("drops unusable entries instead of rendering misleading cards", () => {
      const cards = computeRelatedProducts([
        null,
        undefined,
        "product-10",
        42,
        {},
        { value: 0 },
        { value: -5 },
        { value: "abc" },
        { id: 10 }, // no title to display
        normalProduct({ id: 11, value: 11 }),
      ]);

      expect(cards.map((c) => c.id)).toEqual([11]);
    });

    it("deduplicates repeated identity while keeping the first occurrence", () => {
      const cards = computeRelatedProducts([
        normalProduct({ id: 10, value: 10, label: "First" }),
        normalProduct({ id: 10, value: 10, label: "Second" }),
      ]);

      expect(cards).toHaveLength(1);
      expect(cards[0].title).toBe("First");
    });

    it("never throws for unexpected shapes", () => {
      expect(() => computeRelatedProducts([NaN, [], () => {}, Symbol("x")])).not.toThrow();
      expect(relatedProductPricing(null)).toEqual({ price: 0, oldPrice: 0, hasDiscount: false });
    });
  });

  describe("Cart integration (existing unified cart)", () => {
    it("adds a normal product through the existing product adapter", () => {
      const [card] = computeRelatedProducts([normalProduct()]);

      expect(card.cartKey).toBe("product:10");
      expect(card.productableType).toBe(PRODUCT_TYPES.PRODUCT);
      expect(card.productableId).toBe(10);

      const { normalized, next } = addRelatedToCart(cartReducerWithItems(), card);
      const items = selectCartItems({ cart: next });

      expect(normalized.domain).toBe("ecommerce");
      expect(items).toHaveLength(1);
      expect(items[0].cart_key).toBe("product:10");
      expect(items[0].productable_type).toBe(PRODUCT_TYPES.PRODUCT);
      expect(items[0].price).toBe(999);
      expect(items[0].quantity).toBe(1);
      expect(items[0].title).toBe("Organic Cotton Yoga Mat");
    });

    it("adds a combo through the existing combo adapter", () => {
      const [card] = computeRelatedProducts([comboProduct()]);

      expect(card.cartKey).toBe("combo:14");
      expect(card.productableType).toBe(PRODUCT_TYPES.COMBO);

      const { normalized, next } = addRelatedToCart(cartReducerWithItems(), card);
      const items = selectCartItems({ cart: next });

      expect(normalized.domain).toBe("ecommerce");
      expect(items[0].cart_key).toBe("combo:14");
      expect(items[0].productable_type).toBe(PRODUCT_TYPES.COMBO);
      expect(items[0].meta.is_combo).toBe(true);
    });

    it("does not create a DailyClass-specific cart path", () => {
      const cards = computeRelatedProducts([normalProduct(), comboProduct()]);
      let state = cartReducerWithItems();

      cards.forEach((card) => {
        state = addRelatedToCart(state, card).next;
      });

      const items = selectCartItems({ cart: state });

      expect(items).toHaveLength(2);
      items.forEach((item) => {
        expect(item.cart_key.startsWith("daily_class")).toBe(false);
        // Related products are physical commerce, never learning entitlements.
        expect(selectClassifiedCartItems({ cart: state }).hasPhysicalItems).toBe(true);
        expect(item.meta?.source_daily_class_id).toBeUndefined();
      });
    });

    it("produces the same cart item whether discovered from Course or Daily Class", () => {
      const fromDailyClass = computeRelatedProducts([normalProduct()])[0];
      const fromCourse = { id: 10, value: 10, label: "Organic Cotton Yoga Mat", price: 999, image: "products/mat-10.webp" };

      expect(relatedProductCartIdentity(fromCourse).cartKey).toBe(fromDailyClass.cartKey);

      let state = cartReducerWithItems();
      state = addRelatedToCart(state, fromDailyClass).next;
      state = { ...state, items: [...state.items] };
      state = addRelatedToCart(state, { raw: fromCourse, ...relatedProductCartIdentity(fromCourse) }).next;

      const items = selectCartItems({ cart: state });

      expect(items).toHaveLength(1);
      expect(items[0].cart_key).toBe("product:10");
      expect(items[0].quantity).toBe(2);
    });

    it("keeps the same numeric id of another type as a separate cart line", () => {
      const cards = computeRelatedProducts([
        normalProduct({ id: 10, value: 10 }),
        comboProduct({ id: 10, value: 10 }),
      ]);

      let state = cartReducerWithItems();
      cards.forEach((card) => {
        state = addRelatedToCart(state, card).next;
      });

      const items = selectCartItems({ cart: state });

      expect(items.map((i) => i.cart_key)).toEqual(["product:10", "combo:10"]);
    });

    it("reports added state by exact type:id, never by numeric id alone", () => {
      const normal = computeRelatedProducts([normalProduct()])[0];
      const combo = computeRelatedProducts([comboProduct()])[0];

      const state = addRelatedToCart(cartReducerWithItems(), normal).next;
      const items = selectCartItems({ cart: state });

      expect(isRelatedProductInCart(items, normal)).toBe(true);
      expect(isRelatedProductInCart(items, combo)).toBe(false);
      expect(isRelatedProductInCart([], normal)).toBe(false);
      expect(isRelatedProductInCart(items, null)).toBe(false);
    });
  });

  describe("E-commerce boundary", () => {
    it("fetches product detail through the Workshop proxy, never the E-commerce API", () => {
      expect(PRODUCT_API_BASE_URL).toContain("/api/v1/ecommerce/");
      expect(productApiClient.defaults.baseURL).toBe(PRODUCT_API_BASE_URL);
      expect(productApiClient.defaults.headers["X-Internal-Service-Key"]).toBeUndefined();
    });

    it("Daily Class page and shared section contain no direct E-commerce or internal API call", () => {
      [liveDetailsSource, relatedProductsComponentSource].forEach((source) => {
        expect(source).not.toMatch(/yogiandyathra/i);
        expect(source).not.toMatch(/internal\/v1/i);
        expect(source).not.toMatch(/X-Internal-Service-Key/i);
        expect(source).not.toMatch(/fetch\(/);
      });
    });

    it("does not fetch products separately from the Daily Class detail response", () => {
      expect(liveDetailsSource).toMatch(/computeRelatedProducts\(dailyClass\?\.products\)/);
      expect(liveDetailsSource).not.toMatch(/useQuery|useEffect\(\s*\(\s*\)\s*=>\s*\{\s*[^}]*products/i);
    });

    it("delegates presentation to the shared section, which owns the shared popup", () => {
      expect(liveDetailsSource).toMatch(/<RelatedProducts/);
      expect(liveDetailsSource).not.toMatch(/DailyClassProductDetailPopup|RelatedProductPopup/);
      expect(relatedProductsComponentSource).toMatch(/ProductDetailPopup/);
      expect(relatedProductsComponentSource).not.toMatch(
        /DailyClassProductDetailPopup|LiveSectionProductDetailPopup/
      );
    });

    it("popup detail fetch is proxied through Workshop for both products and combos", async () => {
      const getSpy = vi
        .spyOn(productApiClient, "get")
        .mockResolvedValue({ data: { product: { id: 10, name: "Mat" } } });

      await products.getById(10);
      expect(getSpy).toHaveBeenCalledWith("products/10");

      await products.getCombo(14);
      expect(getSpy).toHaveBeenCalledWith("combo-products/14");

      // Relative paths only — the base URL is the Workshop proxy, so the browser
      // never reaches the E-commerce backend directly.
      getSpy.mock.calls.forEach(([url]) => {
        expect(String(url)).not.toMatch(/^https?:\/\//);
        expect(String(url)).not.toMatch(/internal\/v1/);
        expect(String(url)).not.toMatch(/yogiandyathra/i);
      });

      getSpy.mockRestore();
    });
  });
});
