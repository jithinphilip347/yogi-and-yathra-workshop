/**
 * Unified Cart Item Classification & Domain Utilities
 *
 * Enforces architectural boundaries between Workshop-owned learning items
 * and E-commerce-owned physical commerce products.
 */

export const LEARNING_TYPES = [
  'course',
  'coursedetails',
  'dailyclass',
  'daily_class',
  'livesection',
  'live_section',
  'workshop',
  'membership',
  'feecollection',
  'fee_collection',
];

export const PHYSICAL_TYPES = [
  'product',
  'combo',
  'comboproduct',
  'combo_product',
];

/**
 * Standardize entity type string to canonical lower-snake identifier.
 */
export function normalizeItemType(type) {
  if (!type || typeof type !== 'string') return 'course';
  const clean = type.trim().toLowerCase().replace(/[\s-]/g, '_');
  if (clean === 'coursedetails') return 'course';
  if (clean === 'dailyclass') return 'daily_class';
  if (clean === 'livesection') return 'live_section';
  // Both recorded spellings of a combo fold to the canonical `combo`, matching
  // PHYSICAL_TYPES — otherwise a legacy item would keep a non-canonical key and
  // the backend cart validator (which accepts only `product` / `combo`) would
  // reject a perfectly valid combo line.
  if (clean === 'comboproduct' || clean === 'combo_product') return 'combo';
  return clean;
}

/**
 * Whether a value is a complete cart identity (e.g. `product:10`) rather than a
 * bare item type (e.g. `Product`).
 */
export function isCartKey(value) {
  return typeof value === 'string' && value.includes(':');
}

/**
 * Build the addressing payload the cart reducers expect.
 *
 * Consumers address cart lines two different ways — the cart page holds each
 * item's full `cart_key`, while product cards on content pages pass the item type
 * plus id. Forwarding a cart key through the (type, id) shape would build the key
 * `${cart_key}:${id}` (e.g. `product:10:10`), which matches nothing, so a complete
 * key is forwarded as a key instead.
 *
 * @returns {{cart_key: string}|{productable_type: *, productable_id: *}}
 */
export function buildCartTarget(typeOrKey, productableId) {
  if (isCartKey(typeOrKey)) {
    return { cart_key: typeOrKey };
  }

  return { productable_type: typeOrKey, productable_id: productableId };
}

/**
 * Generate a deterministic cart key: `${type}:${id}`
 */
export function getCartKey(item) {
  if (!item) return '';
  if (item.cart_key && typeof item.cart_key === 'string' && item.cart_key.includes(':')) {
    return item.cart_key;
  }
  const type = normalizeItemType(item.productable_type || item.type);
  const id = item.productable_id ?? item.id ?? item.value;
  return `${type}:${id}`;
}

/**
 * Determine commercial domain: 'workshop' | 'ecommerce'
 */
export function getItemDomain(item) {
  if (!item) return 'workshop';
  if (item.domain === 'workshop' || item.domain === 'ecommerce') {
    return item.domain;
  }
  const type = normalizeItemType(item.productable_type || item.type);
  return PHYSICAL_TYPES.includes(type) ? 'ecommerce' : 'workshop';
}

/**
 * Check if item is a learning entitlement (quantity strictly = 1).
 */
export function isLearningItem(item) {
  return getItemDomain(item) === 'workshop';
}

/**
 * Check if item is a physical commerce good (quantity >= 1).
 */
export function isPhysicalItem(item) {
  return getItemDomain(item) === 'ecommerce';
}

/**
 * Classify a collection of cart items into distinct domain sets.
 */
export function classifyCartItems(items = []) {
  const safeItems = Array.isArray(items) ? items : [];
  const workshopItems = [];
  const ecommerceItems = [];

  for (const item of safeItems) {
    if (!item) continue;
    if (getItemDomain(item) === 'ecommerce') {
      ecommerceItems.push(item);
    } else {
      workshopItems.push(item);
    }
  }

  const hasWorkshop = workshopItems.length > 0;
  const hasEcommerce = ecommerceItems.length > 0;

  return {
    workshopItems,
    ecommerceItems,
    hasWorkshopItems: hasWorkshop,
    hasEcommerceItems: hasEcommerce,
    hasLearningItems: hasWorkshop,
    hasPhysicalItems: hasEcommerce,
    isMixedCart: hasWorkshop && hasEcommerce,
    totalItems: safeItems.length,
  };
}

/**
 * Sanitize and migrate legacy or modern cart items safely.
 * Prevents corrupted localStorage data from crashing the frontend.
 */
export function sanitizeCartItem(rawItem) {
  if (!rawItem || typeof rawItem !== 'object') return null;

  const rawType = rawItem.productable_type || rawItem.type || 'Course';
  const normType = normalizeItemType(rawType);
  const id = rawItem.productable_id ?? rawItem.id ?? rawItem.value;

  if (id === null || id === undefined || id === '') {
    return null; // Malformed item without ID is safely discarded
  }

  const domain = PHYSICAL_TYPES.includes(normType) ? 'ecommerce' : 'workshop';

  // Keep a stored key only while its prefix is already canonical; a legacy prefix
  // (e.g. `comboproduct:14`) is re-derived so identity stays `product:{id}` /
  // `combo:{id}` and can never drift away from what the backend validates.
  const storedKey = typeof rawItem.cart_key === 'string' ? rawItem.cart_key : '';
  const storedPrefix = storedKey.split(':')[0];
  const cartKey =
    storedKey && normalizeItemType(storedPrefix) === storedPrefix
      ? storedKey
      : `${normType}:${id}`;
  const price = Number(rawItem.price || 0);
  const originalPrice = Number(rawItem.original_price || price);

  // Enforce quantity invariant: learning items strictly quantity 1; physical items >= 1
  let quantity = Number(rawItem.quantity || 1);
  if (domain === 'workshop') {
    quantity = 1;
  } else {
    quantity = Math.max(1, Math.floor(quantity));
  }

  return {
    ...rawItem,
    cart_key: cartKey,
    id: rawItem.id || `item_${cartKey.replace(':', '_')}`,
    // Physical types are canonicalised (`Combo` / `Product`) so every downstream
    // consumer — validation payloads, delegated orders, classification — agrees on
    // one spelling. Learning types keep whatever they were stored with.
    productable_type:
      domain === 'ecommerce'
        ? (normType === 'combo' ? 'Combo' : 'Product')
        : (rawItem.productable_type || 'Course'),
    productable_id: id,
    title: rawItem.title || rawItem.name || rawItem.label || 'Item',
    subtitle: rawItem.subtitle || '',
    image: rawItem.image || null,
    price,
    original_price: originalPrice,
    quantity,
    domain,
    meta: rawItem.meta || {},
  };
}
