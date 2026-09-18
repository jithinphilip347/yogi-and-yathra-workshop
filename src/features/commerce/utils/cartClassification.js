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
  if (clean === 'comboproduct') return 'combo';
  return clean;
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
  const cartKey = rawItem.cart_key || `${normType}:${id}`;
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
    productable_type: rawItem.productable_type || (domain === 'ecommerce' ? (normType === 'combo' ? 'Combo' : 'Product') : 'Course'),
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
