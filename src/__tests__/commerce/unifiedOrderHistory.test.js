import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import apiClient from '@/services/apiClient';
import orderApi from '@/libs/orderApi';
import {
  ORDER_TYPE,
  ECOMMERCE_STATE,
  orderTypeLabel,
  isPhysicalOrder,
  isLearningOrder,
  paymentStatusMeta,
  synchronizationMeta,
  fulfillmentMeta,
  buildOrderTimeline,
  normalizeOrder,
  normalizeOrderList,
  normalizeStudentSummary,
  formatAmount,
  accessLabel,
} from '@/features/commerce/utils/unifiedOrder';

vi.mock('@/services/apiClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

/** A correlated mixed purchase as the Workshop aggregator returns it. */
const mixedOrder = (overrides = {}) => ({
  reference: 'ORD-2026-00042',
  order_id: 42,
  type: 'mixed',
  status: 'completed',
  status_label: 'Completed',
  payment_status: 'paid',
  total: 1398,
  paid_amount: 1398,
  balance_due: 0,
  currency: 'INR',
  created_at: '2026-09-10T10:00:00+00:00',
  checkout_session_id: 'cs_mixed_42',
  synchronization: { status: 'synchronized', source: 'live', recorded_at: null },
  learning: {
    product_type: 'course',
    product_id: 7,
    title: 'Mindful Meditation',
    slug: 'mindful-meditation',
    access: { state: 'active', label: 'Active', expires_at: null, progress: { percentage: 40 } },
  },
  ecommerce: {
    order_id: 9001,
    status: 'shipped',
    payment_status: 'paid',
    total: 499,
    items_count: 1,
    items: [{ product_id: 77, product_type: 'normal', quantity: 2, price: 249.5 }],
    shipping_address: { address: '1 Test Street', city: 'Kochi', state: 'Kerala', pincode: '682001', country: 'India' },
    fulfillment: {
      stage: 'shipped',
      label: 'Shipped',
      is_shipped: true,
      is_delivered: false,
      carrier: 'dtdc',
      tracking_id: 'AWB-9001',
      tracking_url: 'https://www.dtdc.com/track-your-shipment/?awb=AWB-9001',
      delivered_at: null,
    },
  },
  ecommerce_state: 'available',
  ...overrides,
});

describe('Sprint 9 — Unified order history (frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('orderApi — browser only ever talks to the Workshop backend', () => {
    it('requests the unified history from the Workshop API with pagination', async () => {
      apiClient.get.mockResolvedValue({ data: { success: true, data: { orders: [], pagination: {} } } });

      await orderApi.list({ page: 2, perPage: 10 });

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      const url = apiClient.get.mock.calls[0][0];
      expect(url).toContain('orders?page=2');
      expect(url).toContain('per_page=10');
      // Never an absolute E-commerce URL and never a user id.
      expect(url).not.toMatch(/^https?:/);
      expect(url).not.toContain('user_id');
      expect(url).not.toContain('/internal/');
    });

    it('encodes the order reference in the detail request', async () => {
      apiClient.get.mockResolvedValue({ data: { success: true, data: {} } });

      await orderApi.detail('ORD-2026-00042');

      expect(apiClient.get.mock.calls[0][0]).toBe('orders/ORD-2026-00042');
    });

    it('reads the dashboard summary from the Workshop dashboard namespace', async () => {
      apiClient.get.mockResolvedValue({ data: { success: true, data: {} } });

      await orderApi.summary();

      expect(apiClient.get.mock.calls[0][0]).toBe('dashboard/student-summary');
    });

    it('never asks for physical data directly from the store', async () => {
      apiClient.get.mockResolvedValue({ data: { success: true, data: {} } });

      await orderApi.list();
      await orderApi.summary();

      for (const [url] of apiClient.get.mock.calls) {
        expect(url).not.toContain('api.yogiandyathra.com');
        expect(url).not.toContain('tracking');
        expect(url).not.toContain('ecommerce/');
      }
    });
  });

  describe('order typing', () => {
    it('labels each domain and never infers from item names', () => {
      expect(orderTypeLabel(ORDER_TYPE.LEARNING)).toBe('Learning');
      expect(orderTypeLabel(ORDER_TYPE.PHYSICAL)).toBe('Physical');
      expect(orderTypeLabel(ORDER_TYPE.MIXED)).toBe('Mixed');
      expect(orderTypeLabel(undefined)).toBe('Order');
    });

    it('classifies physical and learning presence', () => {
      const learning = mixedOrder({ type: 'learning', ecommerce: null });
      const physical = mixedOrder({ type: 'physical', learning: null });

      expect(isPhysicalOrder(learning)).toBe(false);
      expect(isLearningOrder(learning)).toBe(true);
      expect(isPhysicalOrder(physical)).toBe(true);
      expect(isLearningOrder(physical)).toBe(false);
      expect(isPhysicalOrder(mixedOrder())).toBe(true);
      expect(isLearningOrder(mixedOrder())).toBe(true);
    });
  });

  describe('payment status presentation', () => {
    it('maps normalized payment states to labels', () => {
      expect(paymentStatusMeta('paid')).toEqual({ label: 'Paid', tone: 'success' });
      expect(paymentStatusMeta('partially_paid').tone).toBe('warning');
      expect(paymentStatusMeta('refunded').tone).toBe('info');
      expect(paymentStatusMeta('cancelled').tone).toBe('muted');
      expect(paymentStatusMeta('something_else').tone).toBe('muted');
    });

    it('normalizes a partial payment without claiming it is paid', () => {
      const view = normalizeOrder(mixedOrder({ payment_status: 'partially_paid', paid_amount: 100, balance_due: 1298 }));

      expect(view.payment.label).toBe('Partially paid');
      expect(view.payment.tone).toBe('warning');
      expect(view.balanceDue).toBe(1298);
    });
  });

  describe('cross-domain synchronization — partial states are never upgraded', () => {
    it('exposes a partially synchronized purchase as incomplete', () => {
      const view = normalizeOrder(
        mixedOrder({ synchronization: { status: 'partially_synchronized', source: 'recorded', recorded_at: null } })
      );

      expect(view.synchronization.label).toBe('Sync incomplete');
      expect(view.synchronization.tone).toBe('warning');
      expect(view.synchronization.status).not.toBe('synchronized');
    });

    it('does not show a synchronization badge for a learning-only order', () => {
      expect(synchronizationMeta(mixedOrder({ synchronization: { status: 'not_applicable' } }))).toBeNull();
    });
  });

  describe('physical tracking is only ever what the store reported', () => {
    it('surfaces the authoritative carrier, tracking number and link', () => {
      const fulfillment = fulfillmentMeta(mixedOrder());

      expect(fulfillment.available).toBe(true);
      expect(fulfillment.stage).toBe('shipped');
      expect(fulfillment.carrier).toBe('dtdc');
      expect(fulfillment.trackingId).toBe('AWB-9001');
      expect(fulfillment.trackingUrl).toContain('AWB-9001');
    });

    it('never fabricates a tracking link when the store supplied none', () => {
      const order = mixedOrder({
        ecommerce: {
          ...mixedOrder().ecommerce,
          fulfillment: {
            stage: 'pending',
            label: 'Awaiting confirmation',
            is_shipped: false,
            is_delivered: false,
            carrier: null,
            tracking_id: null,
            tracking_url: null,
            delivered_at: null,
          },
        },
      });

      const fulfillment = fulfillmentMeta(order);

      expect(fulfillment.trackingId).toBeNull();
      expect(fulfillment.trackingUrl).toBeNull();
      expect(fulfillment.isShipped).toBe(false);
    });

    it('reports unavailability instead of inventing a shipment state', () => {
      const order = mixedOrder({ ecommerce: null, ecommerce_state: ECOMMERCE_STATE.TEMPORARILY_UNAVAILABLE });
      const fulfillment = fulfillmentMeta(order);

      expect(fulfillment.available).toBe(false);
      expect(fulfillment.label).toBe('Details temporarily unavailable');
      expect(fulfillment.trackingUrl).toBeNull();
      // No timeline without authoritative state.
      expect(buildOrderTimeline(order)).toEqual([]);
    });

    it('returns no fulfillment view model for a learning-only order', () => {
      expect(fulfillmentMeta(mixedOrder({ type: 'learning', ecommerce: null }))).toBeNull();
      expect(buildOrderTimeline(mixedOrder({ type: 'learning', ecommerce: null }))).toEqual([]);
    });
  });

  describe('order timeline — only established stages', () => {
    it('marks shipping and delivery complete only when the store said so', () => {
      const timeline = buildOrderTimeline(mixedOrder());
      const byKey = Object.fromEntries(timeline.map((step) => [step.key, step]));

      expect(byKey.placed.done).toBe(true);
      expect(byKey.payment_confirmed.done).toBe(true);
      expect(byKey.processing.done).toBe(true);
      expect(byKey.shipped.done).toBe(true);
      expect(byKey.delivered.done).toBe(false);
    });

    it('does not advance the timeline for a pending physical order', () => {
      const order = mixedOrder({
        ecommerce: {
          ...mixedOrder().ecommerce,
          payment_status: 'pending',
          fulfillment: {
            stage: 'pending',
            label: 'Awaiting confirmation',
            is_shipped: false,
            is_delivered: false,
            carrier: null,
            tracking_id: null,
            tracking_url: null,
            delivered_at: null,
          },
        },
      });

      const byKey = Object.fromEntries(buildOrderTimeline(order).map((step) => [step.key, step]));

      expect(byKey.paid).toBeUndefined();
      expect(byKey.payment_confirmed.done).toBe(false);
      expect(byKey.processing.done).toBe(false);
      expect(byKey.shipped.done).toBe(false);
      expect(byKey.delivered.done).toBe(false);
    });

    it('replaces the progression with a cancellation step', () => {
      const order = mixedOrder({
        ecommerce: {
          ...mixedOrder().ecommerce,
          fulfillment: {
            stage: 'cancelled',
            label: 'Cancelled',
            is_shipped: false,
            is_delivered: false,
            carrier: null,
            tracking_id: null,
            tracking_url: null,
            delivered_at: null,
          },
        },
      });

      const timeline = buildOrderTimeline(order);

      expect(timeline.map((step) => step.key)).toEqual(['placed', 'cancelled']);
      expect(timeline.find((step) => step.key === 'shipped')).toBeUndefined();
    });

    it('shows a delivered order as delivered with its timestamp', () => {
      const order = mixedOrder({
        ecommerce: {
          ...mixedOrder().ecommerce,
          fulfillment: {
            stage: 'delivered',
            label: 'Delivered',
            is_shipped: true,
            is_delivered: true,
            carrier: 'ecart',
            tracking_id: 'AWB-D',
            tracking_url: 'https://x/AWB-D',
            delivered_at: '2026-09-12T09:00:00+00:00',
          },
        },
      });

      const byKey = Object.fromEntries(buildOrderTimeline(order).map((step) => [step.key, step]));

      expect(byKey.delivered.done).toBe(true);
      expect(byKey.delivered.at).toBe('2026-09-12T09:00:00+00:00');
    });
  });

  describe('list normalization and degraded state', () => {
    it('normalizes a paginated response', () => {
      const result = normalizeOrderList({
        success: true,
        data: {
          orders: [mixedOrder()],
          pagination: { current_page: 1, last_page: 3, per_page: 10, total: 21 },
          ecommerce_sync: { status: 'available' },
        },
      });

      expect(result.orders).toHaveLength(1);
      expect(result.pagination).toEqual({ currentPage: 1, lastPage: 3, perPage: 10, total: 21 });
      expect(result.degraded).toBe(false);
      expect(result.degradedMessage).toBeNull();
    });

    it('flags a temporary store outage without discarding learning orders', () => {
      const result = normalizeOrderList({
        success: true,
        data: {
          orders: [
            mixedOrder({ type: 'learning', ecommerce: null, ecommerce_state: 'not_applicable' }),
            mixedOrder({ reference: 'ORD-2', ecommerce: null, ecommerce_state: 'temporarily_unavailable' }),
          ],
          pagination: { current_page: 1, last_page: 1, per_page: 10, total: 2 },
          ecommerce_sync: { status: 'temporarily_unavailable', message: 'Physical order details are temporarily unavailable.' },
        },
      });

      // Both rows survive: the learning purchase is fully usable.
      expect(result.orders).toHaveLength(2);
      expect(result.degraded).toBe(true);
      expect(result.degradedMessage).toContain('temporarily unavailable');
      expect(result.orders[0].type).toBe('learning');
      expect(result.orders[1].fulfillment.available).toBe(false);
    });

    it('handles an empty history', () => {
      const result = normalizeOrderList({ data: { orders: [], pagination: { current_page: 1, last_page: 1, total: 0 } } });

      expect(result.orders).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.degraded).toBe(false);
    });

    it('tolerates a malformed payload without throwing', () => {
      expect(normalizeOrderList(null).orders).toEqual([]);
      expect(normalizeOrderList({ data: {} }).orders).toEqual([]);
      expect(normalizeOrder(null)).toBeNull();
    });
  });

  describe('dashboard summary', () => {
    it('normalizes learning and physical counters', () => {
      const summary = normalizeStudentSummary({
        data: {
          learning: { active_enrollments: 3, completed_enrollments: 1 },
          physical: { total_orders: 4, in_transit: 1, delivered: 2, pending_payment: 1 },
          recent_orders: [mixedOrder()],
          ecommerce_sync: { status: 'available' },
        },
      });

      expect(summary.learning.activeEnrollments).toBe(3);
      expect(summary.learning.completedEnrollments).toBe(1);
      expect(summary.physical.inTransit).toBe(1);
      expect(summary.physical.delivered).toBe(2);
      expect(summary.recentOrders).toHaveLength(1);
      expect(summary.degraded).toBe(false);
    });

    it('marks a degraded summary without dropping learning data', () => {
      const summary = normalizeStudentSummary({
        data: {
          learning: { active_enrollments: 2, completed_enrollments: 0 },
          physical: { total_orders: 1, in_transit: 0, delivered: 0, pending_payment: 1 },
          recent_orders: [],
          ecommerce_sync: { status: 'temporarily_unavailable' },
        },
      });

      expect(summary.degraded).toBe(true);
      expect(summary.learning.activeEnrollments).toBe(2);
    });

    it('defaults missing counters to zero rather than undefined', () => {
      const summary = normalizeStudentSummary({});

      expect(summary.learning.activeEnrollments).toBe(0);
      expect(summary.physical.inTransit).toBe(0);
      expect(summary.recentOrders).toEqual([]);
    });
  });

  describe('presentation helpers', () => {
    it('formats amounts in the order currency', () => {
      expect(formatAmount(1398, 'INR')).toContain('1,398');
      expect(formatAmount(null)).toContain('0');
    });

    it('describes learning access state from the enrollment lifecycle', () => {
      expect(accessLabel(normalizeOrder(mixedOrder()))).toBe('Access active');
      expect(accessLabel(normalizeOrder(mixedOrder({ learning: { access: { state: 'expired' } } })))).toBe('Access expired');
      expect(accessLabel(normalizeOrder(mixedOrder({ learning: null })))).toBeNull();
    });
  });

  describe('security — no internal credential or store endpoint reaches the browser', () => {
    it('never references an internal service key or store secret in the order UI', () => {
      const files = [
        'src/libs/orderApi.js',
        'src/features/commerce/utils/unifiedOrder.js',
        'src/components/profile/MyOrders.jsx',
        'src/components/profile/OrderDetail.jsx',
        'src/components/profile/RecentOrders.jsx',
      ];

      const forbidden = [
        'X-Internal-Service-Key',
        'RAZORPAY_KEY_SECRET',
        'RAZORPAY_WEBHOOK_SECRET',
        'api.yogiandyathra.com',
        'internal/v1',
        'gateway_signature',
      ];

      for (const file of files) {
        const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

        for (const token of forbidden) {
          expect(source, `${file} must not reference ${token}`).not.toContain(token);
        }
      }
    });

    it('never persists order or shipping data to browser storage', () => {
      const files = [
        'src/libs/orderApi.js',
        'src/components/profile/MyOrders.jsx',
        'src/components/profile/OrderDetail.jsx',
        'src/components/profile/RecentOrders.jsx',
      ];

      for (const file of files) {
        const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

        expect(source).not.toContain('localStorage');
        expect(source).not.toContain('sessionStorage');
      }
    });

    it('does not expose the signature-bearing fields of a payment record', () => {
      const view = normalizeOrder(mixedOrder({ payments: [{ gateway_signature: 'leak' }] }));

      expect(JSON.stringify(view)).not.toContain('gateway_signature');
    });
  });
});
