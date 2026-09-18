/**
 * Sprint 9 — Unified order history presentation helpers.
 *
 * Pure, framework-free logic for rendering the cross-domain order read model
 * returned by `GET /api/v1/orders`.
 *
 * Architectural rules enforced here:
 * - Workshop owns learning data; E-commerce owns physical orders, fulfillment
 *   and tracking. These helpers only *present* what the backend reported — they
 *   never derive a shipment stage, tracking number or payment state on their own.
 * - A temporary E-commerce outage degrades ONLY the physical section, and the
 *   degradation is surfaced explicitly instead of being papered over.
 * - A `partially_synchronized` purchase is never presented as fully synchronized.
 * - No shipment progression is fabricated: a timeline step is only marked
 *   complete when the authoritative backend said it happened.
 */

export const ORDER_TYPE = {
  LEARNING: 'learning',
  PHYSICAL: 'physical',
  MIXED: 'mixed',
};

export const ECOMMERCE_STATE = {
  AVAILABLE: 'available',
  TEMPORARILY_UNAVAILABLE: 'temporarily_unavailable',
  NOT_APPLICABLE: 'not_applicable',
  UNRESOLVED: 'unresolved',
};

const TYPE_LABELS = {
  [ORDER_TYPE.LEARNING]: 'Learning',
  [ORDER_TYPE.PHYSICAL]: 'Physical',
  [ORDER_TYPE.MIXED]: 'Mixed',
};

const PAYMENT_META = {
  paid: { label: 'Paid', tone: 'success' },
  partially_paid: { label: 'Partially paid', tone: 'warning' },
  pending: { label: 'Payment pending', tone: 'warning' },
  failed: { label: 'Payment failed', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
  refunded: { label: 'Refunded', tone: 'info' },
};

const SYNC_META = {
  synchronized: { label: 'Synced', tone: 'success' },
  partially_synchronized: { label: 'Sync incomplete', tone: 'warning' },
  pending: { label: 'Sync pending', tone: 'muted' },
  unavailable: { label: 'Sync unknown', tone: 'muted' },
  not_applicable: null,
};

/** Human label for a unified order's domain. Falls back defensively. */
export function orderTypeLabel(type) {
  return TYPE_LABELS[type] || 'Order';
}

/** Does this order carry a physical (E-commerce) portion? */
export function isPhysicalOrder(order) {
  if (!order) return false;
  return order.type === ORDER_TYPE.PHYSICAL || order.type === ORDER_TYPE.MIXED;
}

/** Does this order carry a learning (Workshop) portion? */
export function isLearningOrder(order) {
  if (!order) return false;
  return order.type === ORDER_TYPE.LEARNING || order.type === ORDER_TYPE.MIXED;
}

/** Presentation metadata for a normalized payment state. */
export function paymentStatusMeta(status) {
  return PAYMENT_META[status] || { label: 'Unknown', tone: 'muted' };
}

/**
 * Cross-domain synchronization badge.
 * Returns null for learning-only orders (the concept does not apply).
 */
export function synchronizationMeta(order) {
  const status = order?.synchronization?.status;
  if (!status) return null;

  const meta = SYNC_META[status];
  if (!meta) return null;

  return {
    ...meta,
    status,
    source: order?.synchronization?.source ?? null,
    recordedAt: order?.synchronization?.recorded_at ?? null,
  };
}

/**
 * Fulfillment/tracking view model for a physical order.
 *
 * Returns `null` for learning-only orders. When the physical portion could not
 * be retrieved, the unavailability is stated explicitly — the UI must never
 * invent a shipment state.
 */
export function fulfillmentMeta(order) {
  if (!isPhysicalOrder(order)) return null;

  const state = order?.ecommerce_state;

  if (state === ECOMMERCE_STATE.TEMPORARILY_UNAVAILABLE) {
    return {
      available: false,
      stage: null,
      label: 'Details temporarily unavailable',
      isShipped: false,
      isDelivered: false,
      carrier: null,
      trackingId: null,
      trackingUrl: null,
      deliveredAt: null,
    };
  }

  if (state === ECOMMERCE_STATE.UNRESOLVED) {
    return {
      available: false,
      stage: null,
      label: 'Not found in store',
      isShipped: false,
      isDelivered: false,
      carrier: null,
      trackingId: null,
      trackingUrl: null,
      deliveredAt: null,
    };
  }

  const fulfillment = order?.ecommerce?.fulfillment;
  if (!fulfillment) {
    return {
      available: false,
      stage: null,
      label: 'Awaiting store confirmation',
      isShipped: false,
      isDelivered: false,
      carrier: null,
      trackingId: null,
      trackingUrl: null,
      deliveredAt: null,
    };
  }

  return {
    available: true,
    stage: fulfillment.stage ?? null,
    label: fulfillment.label ?? null,
    isShipped: Boolean(fulfillment.is_shipped),
    isDelivered: Boolean(fulfillment.is_delivered),
    carrier: fulfillment.carrier ?? null,
    trackingId: fulfillment.tracking_id ?? null,
    // A tracking link is only useful if the backend supplied a real one.
    trackingUrl: fulfillment.tracking_url || null,
    deliveredAt: fulfillment.delivered_at ?? null,
  };
}

/**
 * Physical order timeline.
 *
 * Only steps the authoritative backend can establish are listed, and a step is
 * marked `done` solely because that state actually happened. Nothing here
 * projects a future or assumed progression.
 *
 * Returns an empty array for learning-only orders.
 */
export function buildOrderTimeline(order) {
  if (!isPhysicalOrder(order)) return [];

  const fulfillment = fulfillmentMeta(order);

  if (!fulfillment || !fulfillment.available) {
    // Without authoritative physical state we deliberately show no timeline
    // rather than a fabricated one.
    return [];
  }

  const physicalPaid = order?.ecommerce?.payment_status === 'paid';
  const stage = fulfillment.stage;

  if (stage === 'cancelled') {
    return [
      { key: 'placed', label: 'Order placed', done: true, at: order?.created_at ?? null },
      { key: 'cancelled', label: 'Cancelled', done: true, at: null },
    ];
  }

  // The authoritative stage vocabulary used by the E-commerce backend.
  const STAGE_SEQUENCE = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const stageIndex = STAGE_SEQUENCE.indexOf(stage);
  const hasReached = (candidate) =>
    stageIndex >= STAGE_SEQUENCE.indexOf(candidate);

  return [
    { key: 'placed', label: 'Order placed', done: true, at: order?.created_at ?? null },
    { key: 'payment_confirmed', label: 'Payment confirmed', done: physicalPaid, at: null },
    {
      key: 'processing',
      label: 'Processing',
      done: hasReached('processing'),
      at: null,
    },
    {
      key: 'shipped',
      label: 'Shipped',
      done: fulfillment.isShipped,
      at: null,
    },
    {
      key: 'delivered',
      label: 'Delivered',
      done: fulfillment.isDelivered,
      at: fulfillment.deliveredAt,
    },
  ];
}

/**
 * Normalize one order from the unified history payload into a view model.
 */
export function normalizeOrder(order) {
  if (!order) return null;

  const fulfillment = fulfillmentMeta(order);
  const sync = synchronizationMeta(order);

  return {
    reference: order.reference,
    orderId: order.order_id,
    type: order.type,
    typeLabel: orderTypeLabel(order.type),
    status: order.status,
    statusLabel: order.status_label || order.status,
    paymentStatus: order.payment_status,
    payment: paymentStatusMeta(order.payment_status),
    total: Number(order.total || 0),
    paidAmount: Number(order.paid_amount || 0),
    balanceDue: Number(order.balance_due || 0),
    currency: order.currency || 'INR',
    createdAt: order.created_at || null,
    checkoutSessionId: order.checkout_session_id || null,
    synchronization: sync,
    learning: order.learning
      ? {
          title: order.learning.title,
          productType: order.learning.product_type,
          slug: order.learning.slug || null,
          thumbnail: order.learning.thumbnail || null,
          access: order.learning.access || null,
        }
      : null,
    ecommerce: order.ecommerce
      ? {
          orderId: order.ecommerce.order_id,
          status: order.ecommerce.status,
          paymentStatus: order.ecommerce.payment_status,
          total: Number(order.ecommerce.total || 0),
          itemsCount: Number(order.ecommerce.items_count || 0),
          fulfillment: order.ecommerce.fulfillment || null,
          items: order.ecommerce.items || [],
          shippingAddress: order.ecommerce.shipping_address || null,
        }
      : null,
    ecommerceState: order.ecommerce_state || null,
    fulfillment,
    timeline: buildOrderTimeline(order),
  };
}

/**
 * Normalize a full `GET /api/v1/orders` response.
 *
 * `degraded` tells the UI that physical detail is temporarily unavailable while
 * learning purchases remain fully usable — the dashboard must not be replaced by
 * an error page in that case.
 */
export function normalizeOrderList(response) {
  const payload = response?.data ?? response ?? {};
  const orders = Array.isArray(payload.orders) ? payload.orders.map(normalizeOrder) : [];
  const sync = payload.ecommerce_sync ?? null;

  return {
    orders,
    pagination: {
      currentPage: payload.pagination?.current_page ?? 1,
      lastPage: payload.pagination?.last_page ?? 1,
      perPage: payload.pagination?.per_page ?? orders.length,
      total: payload.pagination?.total ?? orders.length,
    },
    ecommerceSync: sync,
    degraded: sync?.status === ECOMMERCE_STATE.TEMPORARILY_UNAVAILABLE,
    degradedMessage: sync?.status === ECOMMERCE_STATE.TEMPORARILY_UNAVAILABLE
      ? sync.message || 'Physical order details are temporarily unavailable.'
      : null,
  };
}

/**
 * Normalize `GET /api/v1/dashboard/student-summary`.
 */
export function normalizeStudentSummary(response) {
  const payload = response?.data ?? response ?? {};

  return {
    learning: {
      activeEnrollments: payload.learning?.active_enrollments ?? 0,
      completedEnrollments: payload.learning?.completed_enrollments ?? 0,
    },
    physical: {
      totalOrders: payload.physical?.total_orders ?? 0,
      inTransit: payload.physical?.in_transit ?? 0,
      delivered: payload.physical?.delivered ?? 0,
      pendingPayment: payload.physical?.pending_payment ?? 0,
    },
    recentOrders: Array.isArray(payload.recent_orders)
      ? payload.recent_orders.map(normalizeOrder)
      : [],
    degraded: payload.ecommerce_sync?.status === ECOMMERCE_STATE.TEMPORARILY_UNAVAILABLE,
  };
}

/** Format an amount for display using the order's own currency. */
export function formatAmount(amount, currency = 'INR') {
  const value = Number(amount || 0);

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency || 'INR'} ${value.toFixed(2)}`;
  }
}

/** Access-state label for the learning portion. */
export function accessLabel(order) {
  const access = order?.learning?.access;
  if (!access) return null;

  if (access.state === 'active') return 'Access active';
  if (access.state === 'no_enrollment') return 'Not enrolled';
  if (access.state === 'completed') return 'Completed';
  if (access.state === 'expired') return 'Access expired';
  if (access.state === 'cancelled') return 'Enrollment cancelled';
  if (access.state === 'refunded') return 'Refunded';

  return access.label || null;
}
