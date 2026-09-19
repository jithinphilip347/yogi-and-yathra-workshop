import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { computeRelatedProducts } from "@/features/commerce/utils/relatedProducts";
import { CommerceAdapter } from "@/features/commerce/adapters/CommerceAdapter";
import { PRODUCT_TYPES } from "@/features/commerce/constants";
import {
  selectCartItems,
  selectClassifiedCartItems,
} from "@/features/commerce/selectors/commerceSelectors";
import cartReducer, {
  addToCart as cartAddToCart,
  removeFromCart,
} from "@/features/commerce/slices/cartSlice";
import { PRODUCT_API_BASE_URL, PRODUCT_MEDIA_BASE_URL } from "@/utils/constants";
import productApiClient from "@/services/productApi";
import products from "@/libs/products";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (...segments) =>
  fs.readFileSync(path.resolve(__dirname, ...segments), "utf8");

const liveYogaDetailsSource = read(
  "../../app/live-section/[id]/[slug]/LiveYogaDetails.jsx"
);
const liveSectionPageSource = read("../../app/live-section/[id]/[slug]/page.js");
const dailyClassSource = read("../../app/daily-class/[id]/[slug]/LiveDetails.jsx");
const relatedProductsComponentSource = read(
  "../../features/commerce/components/RelatedProducts.jsx"
);

/** Strip comments so content-agnosticism is asserted on code, not documentation. */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const relatedProductsComponentCode = stripComments(relatedProductsComponentSource);

/**
 * Sprint 17 — Live Section related products, customer-facing.
 *
 * The Live Section public detail already returns live, batched, hydrated
 * `products[]` (Sprint 13 + 14). These tests cover the customer path from that
 * response through the shared derivation and the existing unified cart, plus the
 * boundaries that must never be crossed (no browser → E-commerce call, no second
 * product fetch, no content-specific cart identity).
 */

/** Exactly the shape EcommerceClient::hydrateProducts() emits. */
const normal = (o = {}) => ({
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

const combo = (o = {}) => ({
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
  ...o,
});

const emptyCartState = () => ({
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

/** The component's Add to Cart path: shared adapter → existing cart reducer. */
const addToUnifiedCart = (state, viewModel) =>
  cartReducer(
    state,
    cartAddToCart(CommerceAdapter.normalize(viewModel.raw, PRODUCT_TYPES.PRODUCT))
  );

describe("Sprint 17 — Live Section Related Products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Live Section detail data → rendering inputs", () => {
    it("renders the related-products section when the detail returns products", () => {
      const cards = computeRelatedProducts([normal(), combo()]);

      expect(cards).toHaveLength(2);
      expect(cards.map((c) => c.title)).toEqual([
        "Organic Cotton Yoga Mat",
        "Starter Kit Combo",
      ]);
    });

    it("hides the section for a section with no products", () => {
      expect(computeRelatedProducts([])).toEqual([]);
      expect(computeRelatedProducts(undefined)).toEqual([]);
      // The component renders nothing for an empty list (verified at source level).
      expect(relatedProductsComponentSource).toMatch(/if \(list\.length === 0\) return null;/);
    });

    it("handles a detail response whose products were all omitted by hydration", () => {
      expect(computeRelatedProducts(null)).toEqual([]);
    });

    it("uses server price and old price as-is", () => {
      const [card] = computeRelatedProducts([normal({ price: 1499, oldPrice: 1999 })]);

      expect(card.price).toBe(1499);
      expect(card.oldPrice).toBe(1999);
      expect(card.hasDiscount).toBe(true);
    });

    it("does not show a strikethrough price when there is no discount", () => {
      const [card] = computeRelatedProducts([normal({ price: 1200, oldPrice: 1200 })]);

      expect(card.hasDiscount).toBe(false);
    });

    it("resolves media through the shared commerce media resolver", () => {
      const [card] = computeRelatedProducts([normal()]);

      expect(card.imageUrl).toBe(`${PRODUCT_MEDIA_BASE_URL}/products/mat-10.webp`);
    });

    it("keeps a malformed entry from crashing the section", () => {
      const cards = computeRelatedProducts([
        null,
        {},
        { value: 0 },
        { value: "abc" },
        normal({ id: 11, value: 11 }),
      ]);

      expect(cards.map((c) => c.id)).toEqual([11]);
    });
  });

  describe("Product types and ordering", () => {
    it("renders normal products and combos as distinct entries", () => {
      const cards = computeRelatedProducts([normal(), combo()]);

      expect(cards[0].type).toBe("normal");
      expect(cards[0].isCombo).toBe(false);
      expect(cards[1].type).toBe("combo");
      expect(cards[1].isCombo).toBe(true);
    });

    it("keeps normal:10 and combo:10 distinct", () => {
      const cards = computeRelatedProducts([
        normal({ id: 10, value: 10, label: "Product Ten" }),
        combo({ id: 10, value: 10, label: "Combo Ten" }),
      ]);

      expect(cards.map((c) => c.key)).toEqual(["normal:10", "combo:10"]);
      expect(cards.map((c) => c.title)).toEqual(["Product Ten", "Combo Ten"]);
    });

    it("preserves the server-provided order", () => {
      const cards = computeRelatedProducts([
        normal({ id: 30, value: 30 }),
        combo({ id: 12, value: 12 }),
        normal({ id: 25, value: 25 }),
      ]);

      expect(cards.map((c) => c.id)).toEqual([30, 12, 25]);
    });
  });

  describe("Live Section page wiring", () => {
    it("derives products from the Live Section detail payload", () => {
      expect(liveYogaDetailsSource).toMatch(/computeRelatedProducts\(data\.products\)/);
    });

    it("renders the shared section with Live-Section-appropriate copy", () => {
      expect(liveYogaDetailsSource).toMatch(/<RelatedProducts/);
      expect(liveYogaDetailsSource).toMatch(/title="Recommended for this Section"/);
      // The Daily Class wording is content-specific and must not be reused verbatim.
      expect(liveYogaDetailsSource).not.toMatch(/Recommended for this Class/);
      expect(dailyClassSource).toMatch(/title="Recommended for this Class"/);
    });

    it("receives products from the server component without a second fetch", () => {
      expect(liveSectionPageSource).toMatch(/fetchLiveSectionDetail\(id\)/);
      expect(liveSectionPageSource).toMatch(/<LiveYogaDetails liveSection=\{liveSection\}/);
      expect(liveSectionPageSource).not.toMatch(/products/);
      expect(liveYogaDetailsSource).not.toMatch(/useQuery|axios|fetch\(/);
    });

    it("wires cart add and remove through the existing shared cart", () => {
      expect(liveYogaDetailsSource).toMatch(/onAddToCart=\{\(product\) => addItem\(product\.raw, "Product"\)\}/);
      expect(liveYogaDetailsSource).toMatch(/onRemoveFromCart/);
      expect(liveYogaDetailsSource).toMatch(/removeItem\(product\.productableType, product\.productableId\)/);
    });
  });

  describe("Shared RelatedProducts component", () => {
    it("knows nothing about any specific content type", () => {
      expect(relatedProductsComponentCode).not.toMatch(/dailyClass|daily_class|DailyClass/i);
      expect(relatedProductsComponentCode).not.toMatch(/liveSection|live_section|LiveSection/i);
      expect(relatedProductsComponentCode).not.toMatch(/course/i);
    });

    it("fetches nothing and does not touch Redux directly", () => {
      expect(relatedProductsComponentSource).not.toMatch(/useQuery|axios|fetch\(/);
      expect(relatedProductsComponentSource).not.toMatch(/useDispatch|useSelector/);
      // Cart writes stay in the pages: it imports neither the cart slice nor the
      // cart hooks, and only invokes the callbacks it was handed.
      expect(relatedProductsComponentSource).not.toMatch(/slices\/cartSlice|useCommerceHooks|useCart/);
      expect(relatedProductsComponentSource).toMatch(/onAddToCart\?\.\(product\)/);
      expect(relatedProductsComponentSource).toMatch(/onRemoveFromCart\?\.\(product\)/);
    });

    it("resolves added state through the shared type:id helper", () => {
      expect(relatedProductsComponentSource).toMatch(/isRelatedProductInCart\(cartItems, product\)/);
    });
  });

  describe("Cart integration", () => {
    it("adds a normal product through the existing product adapter", () => {
      const [card] = computeRelatedProducts([normal()]);
      const items = selectCartItems({ cart: addToUnifiedCart(emptyCartState(), card) });

      expect(items).toHaveLength(1);
      expect(items[0].cart_key).toBe("product:10");
      expect(items[0].productable_type).toBe(PRODUCT_TYPES.PRODUCT);
      expect(items[0].price).toBe(999);
    });

    it("adds a combo through the existing combo adapter", () => {
      const [card] = computeRelatedProducts([combo()]);
      const items = selectCartItems({ cart: addToUnifiedCart(emptyCartState(), card) });

      expect(items[0].cart_key).toBe("combo:14");
      expect(items[0].productable_type).toBe(PRODUCT_TYPES.COMBO);
      expect(items[0].meta.is_combo).toBe(true);
    });

    it("does not introduce a LiveSection-specific cart identity", () => {
      const cards = computeRelatedProducts([normal(), combo()]);
      let state = emptyCartState();
      cards.forEach((card) => {
        state = addToUnifiedCart(state, card);
      });

      const items = selectCartItems({ cart: state });

      expect(items.map((i) => i.cart_key)).toEqual(["product:10", "combo:14"]);
      items.forEach((item) => expect(item.cart_key.startsWith("live_section")).toBe(false));
      expect(selectClassifiedCartItems({ cart: state }).hasPhysicalItems).toBe(true);
    });

    it("keeps the same numeric id of another type as a separate line", () => {
      const cards = computeRelatedProducts([
        normal({ id: 10, value: 10 }),
        combo({ id: 10, value: 10 }),
      ]);

      let state = emptyCartState();
      cards.forEach((card) => {
        state = addToUnifiedCart(state, card);
      });

      expect(selectCartItems({ cart: state }).map((i) => i.cart_key)).toEqual([
        "product:10",
        "combo:10",
      ]);
    });

    it("produces the same physical cart item from Daily Class and Live Section", () => {
      const fromLiveSection = computeRelatedProducts([normal()])[0];
      const fromDailyClass = computeRelatedProducts([normal()])[0];

      expect(fromLiveSection.cartKey).toBe(fromDailyClass.cartKey);

      let state = addToUnifiedCart(emptyCartState(), fromDailyClass);
      state = addToUnifiedCart(state, fromLiveSection);

      const items = selectCartItems({ cart: state });

      expect(items).toHaveLength(1);
      expect(items[0].cart_key).toBe("product:10");
      expect(items[0].quantity).toBe(2);
    });

    it("removes by the derived physical identity (normal and combo)", () => {
      const cards = computeRelatedProducts([normal(), combo()]);
      let state = emptyCartState();
      cards.forEach((card) => {
        state = addToUnifiedCart(state, card);
      });

      // Mirrors the component's onRemoveFromCart → removeItem(type, id).
      state = cartReducer(
        state,
        removeFromCart({
          productable_type: cards[0].productableType,
          productable_id: cards[0].productableId,
        })
      );

      expect(selectCartItems({ cart: state }).map((i) => i.cart_key)).toEqual(["combo:14"]);
    });
  });

  describe("E-commerce boundary", () => {
    it("proxies product detail through Workshop for normal products and combos", async () => {
      expect(PRODUCT_API_BASE_URL).toContain("/api/v1/ecommerce/");
      expect(productApiClient.defaults.baseURL).toBe(PRODUCT_API_BASE_URL);
      expect(productApiClient.defaults.headers["X-Internal-Service-Key"]).toBeUndefined();

      const getSpy = vi
        .spyOn(productApiClient, "get")
        .mockResolvedValue({ data: { product: { id: 10 } } });

      await products.getById(10);
      await products.getCombo(14);

      expect(getSpy).toHaveBeenCalledWith("products/10");
      expect(getSpy).toHaveBeenCalledWith("combo-products/14");

      getSpy.mock.calls.forEach(([url]) => {
        expect(String(url)).not.toMatch(/^https?:\/\//);
        expect(String(url)).not.toMatch(/internal\/v1/);
        expect(String(url)).not.toMatch(/yogiandyathra/i);
      });

      getSpy.mockRestore();
    });

    it("Live Section page contains no direct E-commerce or internal API call", () => {
      [liveYogaDetailsSource, liveSectionPageSource, relatedProductsComponentSource].forEach(
        (source) => {
          expect(source).not.toMatch(/yogiandyathra/i);
          expect(source).not.toMatch(/internal\/v1/i);
          expect(source).not.toMatch(/X-Internal-Service-Key/i);
        }
      );
    });
  });

  describe("Regression — unrelated pages", () => {
    it("Live Section page keeps using the existing page data flow", () => {
      expect(liveSectionPageSource).toMatch(/export const revalidate = 600;/);
      expect(liveSectionPageSource).toMatch(/fetchLiveSectionDetail/);
    });

    it("Daily Class still renders the shared section with its own heading", () => {
      expect(dailyClassSource).toMatch(/<RelatedProducts/);
      expect(dailyClassSource).toMatch(/computeRelatedProducts\(dailyClass\?\.products\)/);
    });
  });
});
