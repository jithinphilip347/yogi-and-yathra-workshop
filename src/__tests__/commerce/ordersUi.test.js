import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  annotateTimelineSteps,
  normalizeOrder,
  buildOrderTimeline,
} from '@/features/commerce/utils/unifiedOrder';

/**
 * WORKSHOP-DS-07D — Orders UI.
 *
 * Two things are worth pinning here.
 *
 * 1. The timeline's visual state (`done` / `current` / `upcoming`) is derived from
 *    the backend's own `done` flags and must never upgrade one — a step that has
 *    not happened cannot be presented as if it had.
 *
 * 2. The redesign existed to remove a hardcoded DARK palette that was rendering
 *    on the profile's WHITE card. That is a property of the source, not of any
 *    runtime value, so it is asserted against the source.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = (...segments) => path.resolve(__dirname, ...segments);
const read = (...segments) => fs.readFileSync(root(...segments), 'utf8');

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

/**
 * SCSS needs one extra pass. The `@rule` stripper is deliberately NOT part of
 * `stripComments`: in a JS module `@/assets/...` is an import path, and removing
 * `@`-prefixed text there would delete the very import this suite asserts on.
 */
const stripScss = (source) =>
  stripComments(source).replace(/(^|\s)@(media|keyframes|use|import|supports|include)[^\n]*/g, '$1');

const myOrders = read('../../components/profile/MyOrders.jsx');
const orderDetail = read('../../components/profile/OrderDetail.jsx');
const ordersScss = read('../../assets/css/order-history.scss');

// These files deliberately document the palette they replaced, so the audits run
// on code with the commentary removed — otherwise the explanation of the bug
// would itself look like the bug.
const myOrdersCode = stripComments(myOrders);
const orderDetailCode = stripComments(orderDetail);
const ordersScssCode = stripScss(ordersScss);

/** A physical order as the aggregator returns it, mid-fulfilment. */
const shippedOrder = (overrides = {}) => ({
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
  learning: {
    title: 'Mindful Meditation',
    access: { state: 'active', progress: { percentage: 40 } },
  },
  ecommerce: {
    order_id: 9001,
    payment_status: 'paid',
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

describe('timeline presentation states', () => {
  it('marks exactly one step current: the first the backend has not completed', () => {
    const annotated = annotateTimelineSteps(buildOrderTimeline(shippedOrder()));
    const byKey = Object.fromEntries(annotated.map((step) => [step.key, step]));

    expect(byKey.placed.state).toBe('done');
    expect(byKey.payment_confirmed.state).toBe('done');
    expect(byKey.processing.state).toBe('done');
    expect(byKey.shipped.state).toBe('done');
    // Nothing has shipped-and-arrived beyond this point, so delivery is where the
    // order sits — not a completed step.
    expect(byKey.delivered.state).toBe('current');
    expect(annotated.filter((step) => step.state === 'current')).toHaveLength(1);
  });

  it('marks later steps upcoming, before the first unfinished one', () => {
    const order = shippedOrder({
      ecommerce: {
        ...shippedOrder().ecommerce,
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

    const byKey = Object.fromEntries(
      annotateTimelineSteps(buildOrderTimeline(order)).map((step) => [step.key, step])
    );

    expect(byKey.placed.state).toBe('done');
    expect(byKey.payment_confirmed.state).toBe('current');
    expect(byKey.processing.state).toBe('upcoming');
    expect(byKey.shipped.state).toBe('upcoming');
    expect(byKey.delivered.state).toBe('upcoming');
  });

  it('has no current step once every step is done', () => {
    const order = shippedOrder({
      ecommerce: {
        ...shippedOrder().ecommerce,
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

    const annotated = annotateTimelineSteps(buildOrderTimeline(order));

    expect(annotated.every((step) => step.state === 'done')).toBe(true);
    expect(annotated.some((step) => step.state === 'current')).toBe(false);
  });

  it('never upgrades a step the backend did not confirm', () => {
    const annotated = annotateTimelineSteps(buildOrderTimeline(shippedOrder()));

    for (const step of annotated) {
      expect(step.state === 'done').toBe(Boolean(step.done));
    }
  });

  it('tolerates an empty or malformed timeline', () => {
    expect(annotateTimelineSteps([])).toEqual([]);
    expect(annotateTimelineSteps(null)).toEqual([]);
    expect(annotateTimelineSteps(undefined)).toEqual([]);
  });

  it('does not mutate the steps it is given', () => {
    const original = [{ key: 'placed', label: 'Order placed', done: true, at: null }];
    const snapshot = JSON.parse(JSON.stringify(original));

    annotateTimelineSteps(original);

    expect(original).toEqual(snapshot);
  });

  it('exposes the annotated timeline on the normalized order', () => {
    const view = normalizeOrder(shippedOrder());

    expect(view.timelineSteps).toHaveLength(view.timeline.length);
    expect(view.timelineSteps.map((step) => step.key)).toEqual(view.timeline.map((step) => step.key));
    expect(view.timelineSteps.every((step) => step.state)).toBe(true);
  });

  it('keeps a learning-only order timeline empty at both levels', () => {
    const view = normalizeOrder(shippedOrder({ type: 'learning', ecommerce: null, ecommerce_state: 'not_applicable' }));

    expect(view.timeline).toEqual([]);
    expect(view.timelineSteps).toEqual([]);
  });

  it('tones a done-but-cancelled terminal step as an error, not a success', () => {
    const order = shippedOrder({
      ecommerce: {
        ...shippedOrder().ecommerce,
        payment_status: 'paid',
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

    const annotated = annotateTimelineSteps(buildOrderTimeline(order));
    const byKey = Object.fromEntries(annotated.map((step) => [step.key, step]));

    // The cancellation really happened, so `done` stays — the backend said so.
    expect(byKey.cancelled.done).toBe(true);
    expect(byKey.cancelled.state).toBe('done');
    // …but it must never render as a completed journey.
    expect(byKey.cancelled.tone).toBe('error');
    expect(byKey.placed.tone).toBeNull();
  });

  it('leaves tone null on every ordinary step', () => {
    const annotated = annotateTimelineSteps(buildOrderTimeline(shippedOrder()));

    expect(annotated.every((step) => step.tone === null)).toBe(true);
  });

  it('does not tone a step that has not happened', () => {
    // A future "cancelled" step would be nonsense, but a malformed payload could
    // still carry one; only steps the backend confirmed can be toned.
    const annotated = annotateTimelineSteps([{ key: 'cancelled', label: 'Cancelled', done: false, at: null }]);

    expect(annotated[0].tone).toBeNull();
  });
});

describe('orders UI source guarantees', () => {
  it('carries no inline dark-theme palette', () => {
    for (const [name, source] of [['MyOrders', myOrdersCode], ['OrderDetail', orderDetailCode]]) {
      // The defect: white/near-white values on the profile's white card.
      expect(source, `${name} must not hardcode white text`).not.toMatch(/#fff\b|#ffffff/i);
      expect(source, `${name} must not use a white-alpha surface`).not.toMatch(/rgba\(255,\s*255,\s*255/);
      // The other half of the defect: presentational literals left in JSX.
      expect(source, `${name} must not set colours inline`).not.toMatch(/style=\{\{[^}]*(color|background|border)/s);
    }
  });

  it('sources its presentation from the shared token stylesheet', () => {
    expect(myOrdersCode).toMatch(/import ['"]@\/assets\/css\/order-history\.scss['"]/);
    expect(orderDetailCode).not.toMatch(/style=\{\{/);
  });

  it('resolves every colour in the stylesheet through a token', () => {
    // No literal hex anywhere in the rules — only var(--…) references.
    expect(ordersScssCode).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(ordersScssCode).not.toMatch(/rgba\(\s*\d/);
  });

  it('uses the shared radius, border and surface tokens rather than new ones', () => {
    expect(ordersScssCode).toMatch(/var\(--radius-lg\)/);
    expect(ordersScssCode).toMatch(/var\(--color-border\)/);
    expect(ordersScssCode).toMatch(/var\(--surface-muted\)/);
    expect(ordersScssCode).toMatch(/var\(--color-heading\)/);
    expect(ordersScssCode).toMatch(/var\(--color-text-muted\)/);
  });

  it('does not introduce an orders-specific container or card scale', () => {
    // The pages render inside the profile card, so they must not re-create the
    // global container or a parallel radius scale.
    expect(myOrdersCode).not.toMatch(/PageContainer/);
    expect(ordersScssCode).not.toMatch(/order-card-radius|order-shadow/);
  });

  it('renders the timeline with real state classes, not a flat list', () => {
    expect(orderDetailCode).toMatch(/OrderTimelineStep is-\$\{step\.state\}/);
    expect(orderDetailCode).toMatch(/annotateTimelineSteps/);
  });

  it('renders a negative terminal step with an error marker, not the success check', () => {
    expect(orderDetailCode).toMatch(/step\.tone === "error"/);
    expect(orderDetailCode).toMatch(/FiX/);
    expect(ordersScssCode).toMatch(/\.is-done\.is-error/);
    expect(ordersScssCode).toMatch(/var\(--color-error\)/);
  });

  it('visually distinguishes a combo item from a single product', () => {
    expect(orderDetailCode).toMatch(/is-combo/);
    expect(orderDetailCode).toMatch(/FiLayers/);
    expect(ordersScssCode).toMatch(/\.OrderItemThumb\.is-combo/);
  });

  it('does not leave a postal address italic', () => {
    // <address> is italic by user-agent default; the reset must survive.
    expect(ordersScssCode).toMatch(/\.OrderAddress[^}]*font-style:\s*normal/s);
  });

  it('never prints a raw E-commerce item type at the customer', () => {
    // `product_type` arrives as an E-commerce enum (`normal` / `combo`).
    expect(orderDetailCode).not.toMatch(/\{item\.product_type\}/);
    expect(orderDetailCode).toMatch(/ITEM_TYPE_LABELS/);
  });

  it('never builds a receipt URL of its own', () => {
    // WORKSHOP-DS-07C/07E govern receipt UI. Order Detail renders the shared
    // `ReceiptActions` component; it must never assemble a document path, and the
    // orders list must not offer a receipt at all (the list payload carries no
    // invoice, so it has nothing to gate on).
    for (const [name, source] of [['MyOrders', myOrdersCode], ['OrderDetail', orderDetailCode]]) {
      expect(source, `${name} must not build an invoice path`).not.toMatch(/\/invoices?\b/i);
      expect(source, `${name} must not link a download`).not.toMatch(/href=\{[^}]*receipt/i);
      expect(source, `${name} must not call the billing API`).not.toMatch(/billingApi/);
    }

    expect(myOrdersCode, 'the list must not offer a receipt action').not.toMatch(/ReceiptActions/);
  });

  it('shows the receipt through the one shared component', () => {
    expect(orderDetailCode).toMatch(/ReceiptActions/);
    expect(orderDetailCode).toMatch(/receiptStateFromInvoices\(/);
    // Never a per-order flag invented locally: the state comes from the model.
    expect(orderDetailCode).toMatch(/order\.invoices/);
  });

  it('never persists order data to browser storage', () => {
    for (const source of [myOrdersCode, orderDetailCode]) {
      expect(source).not.toContain('localStorage');
      expect(source).not.toContain('sessionStorage');
    }
  });
});
