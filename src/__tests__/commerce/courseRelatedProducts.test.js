import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import * as sass from "sass";
import { fileURLToPath } from "url";

import {
  computeRelatedProducts,
  relatedProductCartIdentity,
  isRelatedProductInCart,
} from "@/features/commerce/utils/relatedProducts";
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
import { PRODUCT_API_BASE_URL } from "@/utils/constants";
import productApiClient from "@/services/productApi";
import { resolveProductMediaUrl } from "@/utils/mediaUrl";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (...segments) =>
  fs.readFileSync(path.resolve(__dirname, ...segments), "utf8");

const courseDetailsSource = read("../../app/course/[slug]/[id]/CourseDetails.jsx");
const coursePageSource = read("../../app/course/[slug]/[id]/page.js");
const courseLibSource = read("../../libs/course.js");
const dailyClassSource = read("../../app/daily-class/[id]/[slug]/LiveDetails.jsx");
const liveSectionSource = read("../../app/live-section/[id]/[slug]/LiveYogaDetails.jsx");
const relatedProductsComponentSource = read(
  "../../features/commerce/components/RelatedProducts.jsx"
);

/** Strip comments so source assertions read code, not documentation. */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const courseDetailsCode = stripComments(courseDetailsSource);
const relatedProductsComponentCode = stripComments(relatedProductsComponentSource);

/**
 * Sprint 19 — Course related products, customer facing.
 *
 * Course moved off the Course-only `course_products` association onto the shared
 * `content_products` table, and its product UI onto the shared RelatedProducts
 * component. These tests cover that consolidation: the shared component is really
 * used (and the duplicated Course markup/popup really gone), server order and
 * normal/combo identity are preserved, and the existing unified cart still treats
 * a Course-discovered product exactly like one discovered anywhere else.
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

/** The real Course/Daily Class/Live Section Add to Cart path. */
const addFromContent = (state, rawProduct) =>
  cartReducer(state, cartAddToCart(CommerceAdapter.normalize(rawProduct, PRODUCT_TYPES.PRODUCT)));

/** The shared component's removal path. */
const removeFromCard = (state, viewModel) =>
  cartReducer(
    state,
    removeFromCart({
      productable_type: viewModel.productableType,
      productable_id: viewModel.productableId,
    })
  );

const cartKeys = (state) => selectCartItems({ cart: state }).map((i) => i.cart_key);

describe("Sprint 19 — Course related products", () => {
  describe("Shared component adoption", () => {
    it("renders the shared RelatedProducts component", () => {
      expect(courseDetailsCode).toMatch(
        /import RelatedProducts from "@\/features\/commerce\/components\/RelatedProducts"/
      );
      expect(courseDetailsCode).toMatch(/<RelatedProducts/);
    });

    it("derives view models through the shared computeRelatedProducts helper", () => {
      expect(courseDetailsCode).toMatch(/computeRelatedProducts\(course\?\.products\)/);
    });

    it("keeps no duplicated Course-only product markup", () => {
      // The inline card list the component now owns must be gone.
      expect(courseDetailsCode).not.toMatch(/className="ProductList"/);
      expect(courseDetailsCode).not.toMatch(/className="ProductItem"/);
      expect(courseDetailsCode).not.toMatch(/ViewDetailsBtn/);
      expect(courseDetailsCode).not.toMatch(/AddToCartBtn/);
    });

    it("keeps no second product detail popup", () => {
      expect(courseDetailsCode).not.toMatch(/ProductDetailPopup/);
    });

    it("keeps no numeric-id-only cart lookups for products", () => {
      // `isInCart` may still be used for the Course entitlement itself (a learning
      // item keyed `course:{id}`); it must never be used for a physical product,
      // whose identity is `type:id`.
      expect(courseDetailsCode).not.toMatch(/isInCart\(prod/);
      expect(courseDetailsCode).not.toMatch(/isInCart\(product/);
      expect(courseDetailsCode).not.toMatch(/relatedProductCartIdentity/);
    });

    it("uses Course-specific wording rather than another content type's copy", () => {
      expect(courseDetailsCode).toMatch(/title="Recommended Gear for this Course"/);
      expect(courseDetailsCode).not.toMatch(/Recommended for this Class/);
      expect(courseDetailsCode).not.toMatch(/Recommended for this Section/);
    });

    it("passes the shared component only presentation inputs and cart callbacks", () => {
      const usage = courseDetailsCode.slice(
        courseDetailsCode.indexOf("<RelatedProducts"),
        courseDetailsCode.indexOf("/>", courseDetailsCode.indexOf("<RelatedProducts"))
      );

      expect(usage).toMatch(/products=\{relatedProducts\}/);
      expect(usage).toMatch(/cartItems=\{cartItems\}/);
      expect(usage).toMatch(/onAddToCart=/);
      expect(usage).toMatch(/onRemoveFromCart=/);
      expect(usage).not.toMatch(/fetch|axios|api/i);
    });
  });

  describe("RelatedProducts stays content-agnostic", () => {
    it("does not know about Course, Daily Class or Live Section", () => {
      expect(relatedProductsComponentCode).not.toMatch(/course/i);
      expect(relatedProductsComponentCode).not.toMatch(/daily/i);
      expect(relatedProductsComponentCode).not.toMatch(/live_?section/i);
    });

    it("does not fetch, use a query client or touch Redux", () => {
      expect(relatedProductsComponentCode).not.toMatch(/fetch\(/);
      expect(relatedProductsComponentCode).not.toMatch(/axios/);
      expect(relatedProductsComponentCode).not.toMatch(/useSelector|useDispatch|useQuery/);
    });

    it("is reused by all three content types", () => {
      for (const source of [courseDetailsCode, dailyClassSource, liveSectionSource]) {
        expect(source).toMatch(/RelatedProducts/);
      }
    });
  });

  describe("Rendering derivation", () => {
    it("derives a view model for a hydrated Course product", () => {
      const [product] = computeRelatedProducts([normal()]);

      expect(product.title).toBe("Organic Cotton Yoga Mat");
      expect(product.price).toBe(999);
      expect(product.oldPrice).toBe(1200);
      expect(product.hasDiscount).toBe(true);
      expect(product.isCombo).toBe(false);
      expect(product.key).toBe("normal:10");
    });

    it("derives a combo view model", () => {
      const [product] = computeRelatedProducts([combo()]);

      expect(product.title).toBe("Starter Kit Combo");
      expect(product.isCombo).toBe(true);
      expect(product.key).toBe("combo:14");
    });

    it("renders nothing for an empty Course product list", () => {
      expect(computeRelatedProducts([])).toEqual([]);
      expect(computeRelatedProducts(undefined)).toEqual([]);
      expect(computeRelatedProducts(null)).toEqual([]);
      // The shared component hides the section when there is nothing to show.
      expect(relatedProductsComponentCode).toMatch(/if \(list\.length === 0\) return null;/);
    });

    it("does not crash on malformed Course product entries", () => {
      const viewModels = computeRelatedProducts([
        null,
        undefined,
        "nonsense",
        7,
        {},
        { id: 0, name: "Zero" },
        normal({ id: 55, value: 55, title: "", label: "", name: "" }), // no usable title
        normal({ id: 60, value: 60 }),
      ]);

      expect(viewModels).toHaveLength(1);
      expect(viewModels[0].id).toBe(60);
    });

    it("preserves server order and never sorts client-side", () => {
      const viewModels = computeRelatedProducts([
        normal({ id: 30, value: 30, title: "First" }),
        normal({ id: 12, value: 12, title: "Second" }),
        combo({ id: 5, value: 5, title: "Third" }),
      ]);

      expect(viewModels.map((p) => p.id)).toEqual([30, 12, 5]);
      expect(relatedProductsComponentCode).not.toMatch(/\.sort\(/);
    });

    it("keeps normal:10 and combo:10 as two distinct products", () => {
      // `value` is the canonical id in the hydrated payload; override both so the
      // fixture really is "normal 10 + combo 10".
      const viewModels = computeRelatedProducts([
        normal({ id: 10, value: 10 }),
        combo({ id: 10, value: 10 }),
      ]);

      expect(viewModels).toHaveLength(2);
      expect(viewModels.map((p) => p.key)).toEqual(["normal:10", "combo:10"]);
      expect(viewModels.map((p) => p.cartKey)).toEqual(["product:10", "combo:10"]);
      expect(viewModels.map((p) => p.title)).toEqual([
        "Organic Cotton Yoga Mat",
        "Starter Kit Combo",
      ]);
    });

    it("uses the shared product media resolver", () => {
      const [product] = computeRelatedProducts([normal({ image: "products/mat-10.webp" })]);

      expect(product.imageUrl).toBe(resolveProductMediaUrl("products/mat-10.webp"));
    });
  });

  describe("Cart integration", () => {
    it("adds a Course normal product as product:{id}", () => {
      const [product] = computeRelatedProducts([normal()]);
      const state = addFromContent(emptyCart(), product.raw);

      expect(cartKeys(state)).toEqual(["product:10"]);
      expect(selectCartItems({ cart: state })[0].productable_type).toBe(PRODUCT_TYPES.PRODUCT);
    });

    it("adds a Course combo as combo:{id} through the combo adapter", () => {
      const [product] = computeRelatedProducts([combo()]);
      const state = addFromContent(emptyCart(), product.raw);

      expect(cartKeys(state)).toEqual(["combo:14"]);
      expect(selectCartItems({ cart: state })[0].productable_type).toBe(PRODUCT_TYPES.COMBO);
    });

    it("merges a Course product with the same product discovered on Daily Class and Live Section", () => {
      // Course, Daily Class and Live Section all normalize through the same
      // CommerceAdapter, so the three additions are the same cart line.
      let state = emptyCart();
      state = addFromContent(state, normal());
      state = addFromContent(state, normal());
      state = addFromContent(state, normal());

      expect(cartKeys(state)).toEqual(["product:10"]);
      expect(selectCartItems({ cart: state })[0].quantity).toBe(3);
    });

    it("merges a Course combo with the same combo discovered elsewhere", () => {
      let state = emptyCart();
      state = addFromContent(state, combo());
      state = addFromContent(state, combo());
      state = addFromContent(state, combo());

      expect(cartKeys(state)).toEqual(["combo:14"]);
      expect(selectCartItems({ cart: state })[0].quantity).toBe(3);
    });

    it("never creates a Course-specific cart identity", () => {
      const state = addFromContent(emptyCart(), normal());

      expect(cartKeys(state).some((k) => /course/i.test(k))).toBe(false);
    });

    it("removes only the addressed Course line", () => {
      let state = emptyCart();
      state = addFromContent(state, normal({ id: 10, value: 10 }));
      state = addFromContent(state, combo({ id: 10, value: 10 }));

      const viewModels = computeRelatedProducts([
        normal({ id: 10, value: 10 }),
        combo({ id: 10, value: 10 }),
      ]);
      const comboViewModel = viewModels.find((p) => p.isCombo);
      const productViewModel = viewModels.find((p) => !p.isCombo);

      state = removeFromCard(state, productViewModel);

      expect(cartKeys(state)).toEqual(["combo:10"]);
      expect(isRelatedProductInCart(selectCartItems({ cart: state }), comboViewModel)).toBe(true);
      expect(isRelatedProductInCart(selectCartItems({ cart: state }), productViewModel)).toBe(false);
    });

    it("classifies a Course-discovered product as a physical e-commerce item", () => {
      const state = addFromContent(emptyCart(), normal());
      const classified = selectClassifiedCartItems({ cart: state });

      expect(classified.ecommerceItems).toHaveLength(1);
      expect(classified.workshopItems).toHaveLength(0);
    });
  });

  describe("Popup consistency", () => {
    it("resolves the same identity from the card and from the popup", () => {
      const raw = combo({ id: 10, value: 10 });
      const [viewModel] = computeRelatedProducts([raw]);

      const fromCard = relatedProductCartIdentity(viewModel);
      const fromPopup = relatedProductCartIdentity(raw);

      expect(fromCard.cartKey).toBe("combo:10");
      expect(fromPopup.cartKey).toBe("combo:10");
      expect(fromCard).toEqual(fromPopup);
    });

    it("keeps a combo a combo through the popup path", () => {
      const [viewModel] = computeRelatedProducts([combo({ id: 10, value: 10 })]);
      const state = addFromContent(emptyCart(), viewModel.raw);

      expect(cartKeys(state)).toEqual(["combo:10"]);
    });

    it("keeps normal:10 and combo:10 from colliding in added-state lookups", () => {
      const state = addFromContent(emptyCart(), normal({ id: 10, value: 10 }));
      const items = selectCartItems({ cart: state });

      const [normalViewModel, comboViewModel] = computeRelatedProducts([
        normal({ id: 10, value: 10 }),
        combo({ id: 10, value: 10 }),
      ]);

      expect(isRelatedProductInCart(items, normalViewModel)).toBe(true);
      expect(isRelatedProductInCart(items, comboViewModel)).toBe(false);
    });
  });

  describe("API boundary", () => {
    it("never sends the internal E-commerce service key from the browser", () => {
      expect(productApiClient.defaults.headers["X-Internal-Service-Key"]).toBeUndefined();
      expect(courseDetailsCode).not.toMatch(/X-Internal-Service-Key/i);
      expect(relatedProductsComponentCode).not.toMatch(/X-Internal-Service-Key/i);
    });

    it("reaches E-commerce only through the Workshop proxy", () => {
      expect(PRODUCT_API_BASE_URL).not.toMatch(/yogiandyathra/);
      expect(PRODUCT_API_BASE_URL).not.toMatch(/\/internal\//);
      expect(courseDetailsCode).not.toMatch(/yogiandyathra/);
      expect(courseDetailsCode).not.toMatch(/\/internal\/v1/);
    });

    it("does not fetch products after the Course detail response arrives", () => {
      expect(courseDetailsCode).not.toMatch(/useEffect\([\s\S]{0,120}(fetchProducts|productApi|axios)/);
      expect(courseDetailsCode).not.toMatch(/products\?ids=/);
    });

    it("takes products from the Course detail payload only", () => {
      expect(coursePageSource).toMatch(/fetchCourseDetails/);
      expect(courseLibSource).toMatch(/home\/courses\//);
      expect(courseDetailsCode).toMatch(/course\?\.products/);
      expect(courseDetailsCode).not.toMatch(/localStorage/);
    });
  });

  /**
   * Presentation regression (Course UI fix).
   *
   * The shared component renders `<section className="card RelatedProducts">`,
   * but on the Course page `.card` is only defined per page — `#DailyLiveClassDetails
   * .card` exists, `#CourseDetails .card` never did. So the section had no shell at
   * all and read as an unstyled block wedged between two real cards. These tests
   * pin the shell, its responsive rhythm and the image-path fix that made product
   * photos resolve at all.
   */
  describe("Course product section presentation", () => {
    // DS-02: `styleCss` is the source compiled on demand — the committed
    // `style.css` artifact was removed because it had drifted from this source.
    const styleScss = read("../../assets/css/style.scss");
    const styleCss = sass.compileString(styleScss, {
      loadPaths: [path.resolve(__dirname, "../../assets/css")],
    }).css;
    const constantsSource = read("../../utils/constants.js");
    const envExample = read("../../../.env.example");
    const popupSource = read("../../components/popup/ProductDetailPopup.jsx");

    /**
     * Extract `selector { … }` by brace matching, so an assertion can never be
     * satisfied by an unrelated rule that happens to share a value elsewhere in
     * the stylesheet.
     */
    const blockAt = (source, selector) => {
      const start = source.indexOf(selector);
      if (start === -1) return "";
      const open = source.indexOf("{", start);
      let depth = 0;
      for (let i = open; i < source.length; i += 1) {
        if (source[i] === "{") depth += 1;
        else if (source[i] === "}") {
          depth -= 1;
          if (depth === 0) return source.slice(start, i + 1);
        }
      }
      return "";
    };

    it("gives the section the same card shell as the page's other content boxes", () => {
      const shell = blockAt(styleCss, "#CourseDetails .RelatedProducts {");

      expect(shell).not.toBe("");
      expect(shell).toMatch(/background: #fff;/);
      expect(shell).toMatch(/border-radius: 12px;/);
      expect(shell).toMatch(/padding: 35px;/);
      expect(shell).toMatch(/border: 1px solid #e2e8f0;/);
      expect(shell).toMatch(/margin-bottom: 30px;/);
    });

    it("mirrors the HighlightBox rhythm at every breakpoint", () => {
      expect(styleCss).toMatch(
        /@media \(max-width: 1024px\) \{\s*#CourseDetails \.RelatedProducts \{\s*padding: 20px;/
      );
      expect(styleCss).toMatch(
        /@media \(max-width: 768px\) \{\s*#CourseDetails \.RelatedProducts \{\s*padding: 16px;/
      );
      expect(styleCss).toMatch(
        /@media \(max-width: 480px\) \{\s*#CourseDetails \.RelatedProducts \{\s*padding: 12px;\s*margin-bottom: 16px;/
      );
    });

    it("styles the component heading as a card title, not a page heading", () => {
      const heading = blockAt(styleCss, "#CourseDetails .RelatedProducts h2 {");

      expect(heading).not.toBe("");
      expect(heading).toMatch(/font-size: 24px;/);
      expect(heading).toMatch(/margin-bottom: 25px;/);
      expect(heading).toMatch(/font-weight: 600;/);
    });

    it("makes the info column consume the row instead of leaving dead space", () => {
      const info = blockAt(
        styleCss,
        "#CourseDetails .RelatedProducts .ProductList .ProductItem .ProdLeft .ProdInfo {"
      );

      expect(info).toMatch(/flex: 1 1 auto;/);
      expect(info).toMatch(/min-width: 0;/);
      // The half-width column forced the title/price text into ~150px of the row.
      expect(info).not.toMatch(/width: 50%/);
    });

    it("collapses the product grid and lets the action buttons wrap", () => {
      expect(styleCss).toMatch(
        /@media \(max-width: 768px\) \{\s*#CourseDetails \.RelatedProducts \.ProductList \{\s*grid-template-columns: 1fr;/
      );
      expect(
        blockAt(
          styleCss,
          "#CourseDetails .RelatedProducts .ProductList .ProductItem .ActionArea {"
        )
      ).toMatch(/flex-wrap: wrap;/);
    });

    it("drops the dead RequirementsSection product rules but leaves other pages alone", () => {
      // Sprint 19 moved the product list out of .RequirementsSection, so those
      // ~130 lines could never match again — and carried conflicting values.
      expect(styleCss).not.toMatch(/#CourseDetails \.RequirementsSection \.ProductList/);
      expect(blockAt(styleScss, ".RequirementsSection {")).not.toMatch(/\.ProductList/);
      // The Daily Class / Live Section page rules are untouched.
      expect(styleCss).toMatch(/#DailyLiveClassDetails \.RequirementsSection \.ProductList/);
    });

    it("keeps the SCSS source and the built CSS in sync", () => {
      expect(blockAt(styleScss, ".RelatedProducts {")).toMatch(/padding: 35px;/);
      expect(blockAt(styleCss, "#CourseDetails .RelatedProducts {")).toMatch(/padding: 35px;/);
      expect(styleScss).not.toMatch(/#CourseDetails \{[\s\S]{0,80}#course-recommended-gear/);
    });

    it("serves product media from the shop's storage segment", () => {
      // The shared resolver strips a leading `storage/` from API paths, so the
      // configured base must INCLUDE it. Without `/storage` every product image
      // resolved to <host>/products/... and 404'd (the broken-image cards).
      const resolved = resolveProductMediaUrl("/storage/products/mat-10.webp");

      expect(resolved).toMatch(/\/storage\/products\/mat-10\.webp$/);
      expect(resolved).not.toMatch(/\/storage\/storage\//);

      expect(constantsSource).toMatch(
        /DEFAULT_PRODUCT_MEDIA_BASE_URL =\s*"https:\/\/api\.yogiandyathra\.com\/public\/storage"/
      );
      expect(envExample).toMatch(
        /NEXT_PUBLIC_PRODUCT_MEDIA_BASE_URL=https:\/\/api\.yogiandyathra\.com\/public\/storage/
      );
    });

    it("leaves absolute media URLs untouched", () => {
      expect(resolveProductMediaUrl("https://cdn.example.com/products/mat-10.webp")).toBe(
        "https://cdn.example.com/products/mat-10.webp"
      );
    });

    it("uses the current next/image API in the shared product popup", () => {
      // The legacy `layout`/`objectFit` props warn on every render of the popup.
      expect(popupSource).not.toMatch(/layout="/);
      expect(popupSource).not.toMatch(/objectFit=/);
      expect(popupSource).toMatch(/style=\{\{ objectFit: "contain" \}\}/);
    });
  });
});
