/**
 * Customer-facing Related Products derivation.
 *
 * Turns the server-hydrated `products[]` contract (Workshop DailyClass detail →
 * ContentProductHydrator → EcommerceClient batch hydration) into the display view
 * model the product card renders, plus the cart identity used to add/remove it.
 *
 * Only E-commerce-provided values are used. Nothing here fetches, caches or
 * persists product data, and nothing here talks to the E-commerce API — the
 * browser only ever calls the Workshop API.
 *
 * @see ContentProductHydrator / EcommerceClient::hydrateProducts() on the backend
 */

import { CommerceAdapter } from "../adapters/CommerceAdapter";
import { PRODUCT_TYPES } from "../constants";
import { resolveProductMediaUrl } from "@/utils/mediaUrl";

export const RELATED_PRODUCT_TYPE_NORMAL = "normal";
export const RELATED_PRODUCT_TYPE_COMBO = "combo";

/**
 * Normalize an association's product type. `is_combo` is honoured because the
 * hydrated payload exposes both, and combos must never be collapsed into normal
 * products (nor may the two be merged by sharing a numeric id).
 *
 * @returns {"normal"|"combo"}
 */
export function normalizeRelatedProductType(product) {
  if (!product || typeof product !== "object") return RELATED_PRODUCT_TYPE_NORMAL;

  const flag = product.is_combo;
  const flagged =
    flag === true || flag === 1 || flag === "1" || String(flag).toLowerCase() === "true";

  const rawType = String(product.type ?? "").toLowerCase();

  return flagged || rawType === RELATED_PRODUCT_TYPE_COMBO
    ? RELATED_PRODUCT_TYPE_COMBO
    : RELATED_PRODUCT_TYPE_NORMAL;
}

export function isComboProduct(product) {
  return normalizeRelatedProductType(product) === RELATED_PRODUCT_TYPE_COMBO;
}

/** Numeric external product id, or 0 when the entry has no usable id. */
export function relatedProductId(product) {
  if (!product || typeof product !== "object") return 0;

  const raw = product.external_product_id ?? product.value ?? product.id;
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 0;
}

/** Canonical identity — `normal:10` and `combo:10` are different products. */
export function relatedProductKey(product) {
  const id = relatedProductId(product);
  if (!id) return "";

  return `${normalizeRelatedProductType(product)}:${id}`;
}

/**
 * Display title, or "" when the payload carries no usable name.
 *
 * Deliberately does NOT fall back to an identity-only placeholder: a customer
 * must never be shown `Product #10`. (Identity placeholders exist for the admin
 * editor, where the point is to prove what will be kept.) The hydrated public
 * contract always supplies a name, so a titleless entry is malformed input and
 * the caller drops it rather than rendering a misleading card.
 */
export function relatedProductTitle(product) {
  if (!product || typeof product !== "object") return "";

  const title = product.label || product.name || product.title;

  return title ? String(title).trim() : "";
}

/** Raw stored image path/object as delivered by the API. */
export function relatedProductMediaPath(product) {
  if (!product || typeof product !== "object") return null;

  return product.image || product.image_path || null;
}

/**
 * Resolve a displayable image URL through the single shared media resolver.
 *
 * @returns {string|null} null when there is nothing to resolve, so the caller can
 *   fall back to a local placeholder instead of emitting a broken URL.
 */
export function relatedProductImageUrl(product) {
  const path = relatedProductMediaPath(product);
  if (!path) return null;

  return resolveProductMediaUrl(path) || null;
}

/**
 * Live pricing as supplied by E-commerce.
 *
 * The hydrated contract already resolves the sale price into `price` and the
 * regular price into `oldPrice`; this helper only decides whether the strikethrough
 * should be shown. It never derives a discount of its own.
 */
export function relatedProductPricing(product) {
  const source = product && typeof product === "object" ? product : {};

  const price = Number(source.price ?? source.sale_price ?? 0);
  const originalPrice = Number(source.oldPrice ?? source.original_price ?? price);

  const safePrice = Number.isFinite(price) ? price : 0;
  const safeOriginal = Number.isFinite(originalPrice) ? originalPrice : safePrice;

  return {
    price: safePrice,
    oldPrice: safeOriginal,
    hasDiscount: safeOriginal > safePrice,
  };
}

/**
 * Live availability as supplied by E-commerce.
 *
 * Out of stock does NOT detach the product — the cart's server-side validation
 * remains authoritative for whether it can be purchased.
 */
export function relatedProductAvailability(product) {
  const source = product && typeof product === "object" ? product : {};
  const stock = Number(source.stock);
  const safeStock = Number.isFinite(stock) ? stock : null;

  // Absent metadata is treated as available so an older payload cannot make every
  // product look sold out.
  const inStock =
    source.in_stock === undefined || source.in_stock === null
      ? safeStock === null || safeStock > 0
      : Boolean(source.in_stock);

  return { inStock, stock: safeStock };
}

/**
 * Cart identity for a related product, derived through the shared CommerceAdapter
 * so a product discovered here produces exactly the same cart item — and the same
 * `cart_key` — as the same product discovered anywhere else.
 *
 * @returns {{cartKey: string, productableType: string, productableId: number}|null}
 */
export function relatedProductCartIdentity(product) {
  const normalized = CommerceAdapter.normalize(product, PRODUCT_TYPES.PRODUCT);
  if (!normalized || !normalized.productable_id) return null;

  return {
    cartKey: normalized.cart_key,
    productableType: normalized.productable_type,
    productableId: normalized.productable_id,
  };
}

/**
 * Build render-ready view models from the hydrated `products[]` response.
 *
 * - Server order is preserved verbatim (never sorted client-side).
 * - Malformed entries (no usable id, or nothing to display as a title) are dropped
 *   rather than rendered as misleading cards.
 * - Never throws: an empty/absent list yields `[]`, so the section simply hides.
 *
 * @param {Array|undefined|null} products hydrated products from the Detail API
 * @returns {Array<object>} view models
 */
export function computeRelatedProducts(products) {
  const list = Array.isArray(products) ? products : [];
  const seen = new Set();
  const viewModels = [];

  for (const product of list) {
    if (!product || typeof product !== "object") continue;

    const id = relatedProductId(product);
    if (!id) continue;

    const type = normalizeRelatedProductType(product);
    const key = `${type}:${id}`;
    if (seen.has(key)) continue;

    const title = relatedProductTitle(product);
    if (!title) continue;

    const cart = relatedProductCartIdentity(product);
    if (!cart) continue;

    const pricing = relatedProductPricing(product);
    const availability = relatedProductAvailability(product);

    seen.add(key);

    viewModels.push({
      // Identity — `type:id` is authoritative and never merged by numeric id.
      key,
      id,
      value: id,
      type,
      isCombo: type === RELATED_PRODUCT_TYPE_COMBO,
      // Display — live E-commerce data only.
      title,
      label: title,
      image: relatedProductMediaPath(product),
      imageUrl: relatedProductImageUrl(product),
      price: pricing.price,
      oldPrice: pricing.oldPrice,
      hasDiscount: pricing.hasDiscount,
      inStock: availability.inStock,
      stock: availability.stock,
      // Cart identity (see relatedProductCartIdentity).
      cartKey: cart.cartKey,
      productableType: cart.productableType,
      productableId: cart.productableId,
      // Original payload, for components that need the raw hydrated shape.
      raw: product,
    });
  }

  return viewModels;
}

/**
 * Whether a related product is already in the cart, matched on the exact cart key.
 *
 * Identity is `type:id`, so a combo never reports as "added" merely because a
 * normal product shares its numeric id (and vice versa).
 */
export function isRelatedProductInCart(cartItems, viewModel) {
  if (!viewModel || !viewModel.cartKey) return false;

  const items = Array.isArray(cartItems) ? cartItems : [];

  return items.some((item) => {
    if (!item) return false;
    const key = item.cart_key || `${item.productable_type}:${item.productable_id}`;
    return String(key).toLowerCase() === String(viewModel.cartKey).toLowerCase();
  });
}
