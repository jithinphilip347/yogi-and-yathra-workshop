import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  INVOICE_STATE,
  INVOICE_STATUS,
  INVOICE_DOWNLOAD_PATH,
  VOID_INVOICE_STATUSES,
  formatInvoiceAmount,
  invoiceStateForOrder,
  invoiceStatusLabel,
  isInvoiceDownloadable,
  orderItemLabel,
  orderReference,
  orderStatusMeta,
  selectInvoiceForOrder,
} from '@/features/commerce/utils/invoiceAvailability';
import { unwrapList, describeRequestError } from '@/features/commerce/services/billingApi';

/**
 * Dynamic invoice availability (WORKSHOP-DS-07C).
 *
 * The rule under test is the sprint's single non-negotiable one:
 *
 *   an order existing is NOT grounds to show a download action.
 *
 * The first two groups pin the pure decision model. The last group is a source
 * audit, because this suite runs without jsdom and the defect being fixed was
 * structural — a raw, unauthenticated URL handed to `window.open` — not a runtime
 * value that a unit test could observe after the fact.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (...segments) => fs.readFileSync(path.resolve(__dirname, ...segments), 'utf8');

/**
 * Strip comments before asserting on source.
 *
 * The files under audit deliberately document the defect they fix — e.g.
 * billingApi.js quotes the old `${API_BASE_URL}/billing/invoices/{id}/download`
 * string to explain why it is gone. Those references must not count as live code.
 * The `(?<!:)`-style guard on the line-comment rule protects `https://`.
 */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const billingComponent = stripComments(read('../../components/profile/StudentBilling.jsx'));
const billingService = stripComments(read('../../features/commerce/services/billingApi.js'));
const availabilityModule = read('../../features/commerce/utils/invoiceAvailability.js');

const invoice = (overrides = {}) => ({
  id: 1,
  invoice_number: 'INV-2026-00001',
  order_id: 77,
  status: INVOICE_STATUS.PAID,
  total_amount: 2499,
  ...overrides,
});

describe('invoice availability model', () => {
  it('offers the receipt for every issued, non-void status', () => {
    const issued = [
      INVOICE_STATUS.DRAFT,
      INVOICE_STATUS.SENT,
      INVOICE_STATUS.PAID,
      INVOICE_STATUS.OVERDUE,
      INVOICE_STATUS.REFUNDED,
    ];

    issued.forEach((status) => {
      expect(isInvoiceDownloadable(invoice({ status }))).toBe(true);
    });
  });

  it('keeps a draft invoice downloadable', () => {
    // The scheduled backstop (BillingAutomationEngine::generatePendingInvoices)
    // creates invoices from completed payments and leaves them in `draft`. Hiding
    // the action there would deny a paying customer the only receipt in the app.
    expect(isInvoiceDownloadable(invoice({ status: INVOICE_STATUS.DRAFT }))).toBe(true);
  });

  it('suppresses the action for a cancelled invoice', () => {
    expect(VOID_INVOICE_STATUSES).toEqual([INVOICE_STATUS.CANCELLED]);
    expect(isInvoiceDownloadable(invoice({ status: INVOICE_STATUS.CANCELLED }))).toBe(false);
  });

  it('never offers a download without an invoice id', () => {
    expect(isInvoiceDownloadable({ status: INVOICE_STATUS.PAID })).toBe(false);
    expect(isInvoiceDownloadable(null)).toBe(false);
  });

  it('treats an absent invoice as not-issued rather than downloadable', () => {
    const state = invoiceStateForOrder([], 77);

    expect(state.state).toBe(INVOICE_STATE.NOT_ISSUED);
    expect(state.downloadable).toBe(false);
    expect(state.actionLabel).toBeNull();
    expect(state.note).toBe('Receipt not issued yet');
  });

  it('reports a cancelled invoice as void with no action', () => {
    const state = invoiceStateForOrder([invoice({ status: INVOICE_STATUS.CANCELLED })], 77);

    expect(state.state).toBe(INVOICE_STATE.VOID);
    expect(state.downloadable).toBe(false);
    expect(state.actionLabel).toBeNull();
    expect(state.note).toBe('This invoice was cancelled');
  });

  it('exposes an action label only for an available invoice', () => {
    const state = invoiceStateForOrder([invoice()], 77);

    expect(state.state).toBe(INVOICE_STATE.AVAILABLE);
    expect(state.downloadable).toBe(true);
    expect(state.actionLabel).toBe('View Receipt');
  });

  it('still offers an existing invoice whose status is unrecognised', () => {
    // The record exists and the verified route only checks ownership, so refusing
    // to serve it would be a regression for a cosmetic reason.
    const state = invoiceStateForOrder([invoice({ status: 'generating' })], 77);

    expect(state.downloadable).toBe(true);
    expect(state.statusLabel).toBe('Issued');
  });

  it('matches order ids regardless of string/number typing', () => {
    expect(selectInvoiceForOrder([invoice({ order_id: '77' })], 77)?.id).toBe(1);
    expect(selectInvoiceForOrder([invoice({ order_id: 77 })], '77')?.id).toBe(1);
  });

  it('does not match an order id that is absent or null', () => {
    expect(selectInvoiceForOrder([invoice()], null)).toBeNull();
    expect(selectInvoiceForOrder([invoice()], undefined)).toBeNull();
    expect(selectInvoiceForOrder([invoice({ order_id: null })], 77)).toBeNull();
  });
});

describe('invoice selection when an order has more than one invoice', () => {
  it('prefers the newest downloadable invoice over an older one', () => {
    const selected = selectInvoiceForOrder(
      [invoice({ id: 1, invoice_number: 'INV-1' }), invoice({ id: 9, invoice_number: 'INV-9' })],
      77
    );

    expect(selected.id).toBe(9);
  });

  it('prefers the valid re-issue over a newer cancelled invoice', () => {
    // Regression: the original code took the first `order_id` match, so a voided
    // document could be offered while a valid re-issue sat beside it.
    const selected = selectInvoiceForOrder(
      [
        invoice({ id: 3, invoice_number: 'INV-3', status: INVOICE_STATUS.PAID }),
        invoice({ id: 8, invoice_number: 'INV-8', status: INVOICE_STATUS.CANCELLED }),
      ],
      77
    );

    expect(selected.id).toBe(3);
    expect(isInvoiceDownloadable(selected)).toBe(true);
  });

  it('falls back to the newest invoice only to report the cancellation', () => {
    const state = invoiceStateForOrder(
      [invoice({ id: 3, status: INVOICE_STATUS.CANCELLED }), invoice({ id: 8, status: INVOICE_STATUS.CANCELLED })],
      77
    );

    expect(state.state).toBe(INVOICE_STATE.VOID);
    expect(state.invoice.id).toBe(8);
  });

  it('ignores invoices belonging to another order', () => {
    expect(selectInvoiceForOrder([invoice({ order_id: 5 })], 77)).toBeNull();
  });

  it('ignores subscription invoices, which carry no order id', () => {
    expect(selectInvoiceForOrder([invoice({ order_id: null, subscription_id: 4 })], 77)).toBeNull();
  });
});

describe('presentation helpers', () => {
  it('formats amounts in rupees without a raw float', () => {
    expect(formatInvoiceAmount(2499)).toBe('₹2,499');
    expect(formatInvoiceAmount('1250.5')).toBe('₹1,250.5');
    expect(formatInvoiceAmount(null)).toBe('₹0');
  });

  it('maps known order statuses to a chip label and tone', () => {
    expect(orderStatusMeta('completed')).toEqual({ label: 'Completed', tone: 'success' });
    expect(orderStatusMeta('pending')).toEqual({ label: 'Pending', tone: 'warning' });
    expect(orderStatusMeta('failed')).toEqual({ label: 'Failed', tone: 'error' });
  });

  it('never leaks a raw enum for an unknown order status', () => {
    expect(orderStatusMeta('partially_refunded')).toEqual({
      label: 'partially refunded',
      tone: 'neutral',
    });
    expect(orderStatusMeta(undefined).label).toBe('Unknown');
  });

  it('labels invoice statuses with readable text', () => {
    expect(invoiceStatusLabel('paid')).toBe('Paid');
    expect(invoiceStatusLabel('CANCELLED')).toBe('Cancelled');
    expect(invoiceStatusLabel('')).toBe('Issued');
  });

  it('falls back through order item shapes without inventing a value', () => {
    expect(orderItemLabel({ orderable: { title: 'Hatha Yoga' } })).toBe('Hatha Yoga');
    expect(orderItemLabel({ metadata: { product_type: 'course' } })).toBe('course');
    expect(orderItemLabel({})).toBe('—');
  });

  it('renders an order reference from the number, then the id, else a dash', () => {
    expect(orderReference({ order_number: 'ORD-2026-00007' })).toBe('#ORD-2026-00007');
    expect(orderReference({ id: 2449 })).toBe('#2449');
    expect(orderReference({})).toBe('—');
  });

  it('unwraps the documented envelope, a bare array, or nothing', () => {
    expect(unwrapList({ data: [{ id: 1 }] })).toEqual([{ id: 1 }]);
    expect(unwrapList([{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(unwrapList({ data: { data: [{ id: 2 }] } })).toEqual([{ id: 2 }]);
    expect(unwrapList(null)).toEqual([]);
  });
});

describe('load failures map to actionable copy', () => {
  it('names an unreachable server as a connection problem', () => {
    // The real case: the Workshop API is down, so axios reports ERR_NETWORK and
    // there is no `response` at all. "Could not retrieve billing history" would
    // send the customer looking for an account problem that does not exist.
    const offline = { code: 'ERR_NETWORK', message: 'Network Error' };
    expect(describeRequestError(offline)).toMatch(/could not reach the server/i);
  });

  it('maps auth failures to a re-sign-in message', () => {
    expect(describeRequestError({ response: { status: 401 } })).toMatch(/sign in again/i);
    expect(describeRequestError({ response: { status: 403 } })).toMatch(/sign in again/i);
  });

  it('maps server and timeout failures distinctly', () => {
    expect(describeRequestError({ response: { status: 500 } })).toMatch(/server could not load/i);
    expect(describeRequestError({ response: { status: 404 } })).toMatch(/not available for your account/i);
    expect(describeRequestError({ code: 'ECONNABORTED' })).toMatch(/timed out/i);
  });

  it('never leaks a raw transport message', () => {
    const raw = describeRequestError({ response: { status: 418, data: {} } });
    expect(raw).not.toMatch(/AxiosError|Request failed with status code|stack/i);
  });
});

describe('download route is defined in exactly one place', () => {
  it('builds the verified relative path', () => {
    expect(INVOICE_DOWNLOAD_PATH(12)).toBe('billing/invoices/12/download');
  });

  it('encodes the id so it cannot break out of the path', () => {
    expect(INVOICE_DOWNLOAD_PATH('1/../2')).toBe('billing/invoices/1%2F..%2F2/download');
  });

  it('is a relative path, never an absolute origin', () => {
    expect(INVOICE_DOWNLOAD_PATH(1).startsWith('/')).toBe(false);
    expect(INVOICE_DOWNLOAD_PATH(1)).not.toMatch(/^https?:/);
  });
});

// ─── Source audit ────────────────────────────────────────────────────────────
//
// A runtime test cannot catch "someone hardcoded an invoice URL again", because
// the string is the defect. These assert on source text instead.

describe('invoice UI source audit', () => {
  it('never opens a URL string in a new tab for a receipt', () => {
    expect(billingComponent).not.toMatch(/window\.open\(\s*[`'"][^`'"]*invoice/i);
    expect(billingComponent).not.toMatch(/window\.open\(\s*`\$\{/);
    expect(billingComponent).not.toMatch(/location\.href\s*=\s*[`'"][^`'"]*invoice/i);
  });

  it('does not construct an invoice URL from the API base', () => {
    expect(billingComponent).not.toMatch(/API_BASE_URL/);
    expect(billingService).not.toMatch(/\$\{API_BASE_URL\}/);
  });

  it('sends the receipt request through the authenticated client as a blob', () => {
    expect(billingService).toMatch(/import apiClient from '@\/services\/apiClient'/);
    expect(billingService).not.toMatch(/from 'axios'/);
    expect(billingService).toMatch(/INVOICE_DOWNLOAD_PATH\(/);
    expect(billingService).toMatch(/responseType:\s*'blob'/);
  });

  it('places no token or credential in a URL', () => {
    expect(billingService).not.toMatch(/[?&]token=/);
    expect(billingComponent).not.toMatch(/[?&]token=/);
  });

  it('gates the receipt action on the availability model, not on the order', () => {
    expect(billingComponent).toMatch(/invoiceStateForOrder\(/);
    expect(billingComponent).toMatch(/INVOICE_STATE\.AVAILABLE/);
    expect(billingComponent).toMatch(/\.downloadable/);
    // The old "an order exists, so match any invoice by order_id" shortcut.
    expect(billingComponent).not.toMatch(/invoices\.find\(/);
  });

  it('carries no inline dark-theme palette or Tailwind utility classes', () => {
    expect(billingComponent).not.toMatch(/text-gray-\d/);
    expect(billingComponent).not.toMatch(/color:\s*['"]#fff/i);
    expect(billingComponent).not.toMatch(/rgba\(255,\s*255,\s*255/);
    expect(billingComponent).toMatch(/student-billing\.scss/);
  });
});

describe('no static or invented invoice URL anywhere in the app', () => {
  const walk = (dir, files = []) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        walk(full, files);
      } else if (/\.(js|jsx)$/.test(entry.name) && !/\.test\.js$/.test(entry.name)) {
        files.push(full);
      }
    }
    return files;
  };

  const SRC = path.resolve(__dirname, '../../');
  // Every absolute invoice path pattern the sprint prohibits, plus the static
  // call-to-action label. LiveYoga.jsx and LiveClasses.jsx each shipped an
  // always-visible `<button>Download Invoice</button>` with no onClick and no
  // data behind it; the label itself is the defect, so it is banned outright.
  const PROHIBITED = [
    /\/invoices?\//,
    /\/invoices?\b/,
    /invoice\.pdf/i,
    /download-invoice/i,
    /Download Invoice/i,
    /Download Receipt/i,
  ];
  // The only files allowed to name the invoice path, and only as the relative
  // verified route through the authenticated client.
  const ALLOWED = ['utils/invoiceAvailability.js', 'services/billingApi.js'];

  const offenders = () => {
    const hits = [];
    for (const file of walk(SRC)) {
      const rel = file.slice(SRC.length + 1).replace(/\\/g, '/');
      if (ALLOWED.some((allowed) => rel.endsWith(allowed))) continue;
      const code = stripComments(fs.readFileSync(file, 'utf8'));
      code.split('\n').forEach((line, i) => {
        if (PROHIBITED.some((re) => re.test(line))) {
          hits.push(`${rel}:${i + 1}: ${line.trim()}`);
        }
      });
    }
    return hits;
  };

  it('finds no hardcoded invoice path or static invoice button in the app', () => {
    expect(offenders()).toEqual([]);
  });

  it('renders no invoice action in the learning surfaces', () => {
    // These two dropdowns previously offered a receipt per session/class. Neither
    // payload carries an order or invoice reference, so no legitimate action can
    // exist there yet.
    for (const rel of ['components/profile/LiveYoga.jsx', 'components/profile/LiveClasses.jsx']) {
      const code = stripComments(fs.readFileSync(path.join(SRC, rel), 'utf8'));
      expect(code).not.toMatch(/invoice/i);
    }
  });

  it('only the verified module names the download route', () => {
    const sources = walk(SRC).map((f) => stripComments(fs.readFileSync(f, 'utf8')));

    const constructing = sources.filter((code) => /billing\/invoices\//.test(code));
    // Exactly one file builds the path: the availability module. billingApi uses
    // INVOICE_DOWNLOAD_PATH(), so it names no path literal of its own.
    expect(constructing).toHaveLength(1);
    expect(constructing[0]).toBe(stripComments(availabilityModule));
  });
});
