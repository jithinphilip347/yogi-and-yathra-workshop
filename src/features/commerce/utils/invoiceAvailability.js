/**
 * Invoice availability model.
 *
 * The single source of truth for the question "may the customer be offered a
 * download action for this order?" — so no component decides it by checking
 * whether an order merely exists.
 *
 * ── THE VERIFIED BACKEND CONTRACT ────────────────────────────────────────────
 *
 * Workshop backend (`routes/v1.php`, inside the `auth:sanctum` group):
 *
 *   GET /api/v1/billing/invoices                 → paginated {success, data[], meta}
 *   GET /api/v1/billing/invoices/{invoice}       → {success, data}
 *   GET /api/v1/billing/invoices/{invoice}/download
 *
 * `BillingController::invoicesDownload` builds a real PDF (`ReceiptDocumentService`
 * → dompdf → `invoices.receipt`) and streams it as `application/pdf`; the only
 * gate is `authorizeInvoiceAccess()` (owner, or admin). `disposition=inline`
 * streams it for the in-app viewer and `disposition=attachment` saves it — one
 * document, two presentations, never two URLs.
 *
 * ── WHY `draft` IS STILL DOWNLOADABLE ────────────────────────────────────────
 *
 * `HandleInvoiceGeneration` creates the invoice and immediately marks it paid, so
 * the happy path ends at `paid`. But the scheduled backstop
 * (`BillingAutomationEngine::generatePendingInvoices`) creates invoices from
 * completed payments and leaves them in `draft` — a real, reachable state for a
 * customer who has genuinely paid. Treating `draft` as "not ready" would deny
 * those customers the only receipt surface in the product, so `draft` is
 * downloadable and labelled honestly with its status.
 *
 * `cancelled` is the one status that must suppress the action: the document has
 * been voided, so offering it would present a withdrawn invoice as payable proof
 * of purchase.
 *
 * ── "NOT GENERATED" IS AN ABSENT ROW, NOT A STATUS ───────────────────────────
 *
 * This enum has no pending/processing/generating value. The genuine "no invoice
 * yet" case is *no invoice record for the order* — which yields `not_issued` and
 * a non-actionable note rather than a button that would 404.
 */

/** Lifecycle values from `App\Domains\Billing\Enums\InvoiceStatus`. */
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

/** Voided documents — the only statuses that suppress the download action. */
export const VOID_INVOICE_STATUSES = [INVOICE_STATUS.CANCELLED];

/** Customer-facing row states. */
export const INVOICE_STATE = {
  AVAILABLE: 'available',
  VOID: 'void',
  NOT_ISSUED: 'not_issued',
};

/**
 * The two things a customer may do with an available receipt.
 *
 * Both are the SAME verified document route (`billing/invoices/{invoice}/
 * download`) returning the same PDF bytes: "View" streams it into the in-app
 * PDF.js viewer, "Download" saves it. This is a single endpoint, not two, and
 * the label is "View Receipt" because viewing is what the customer does with it.
 */
export const RECEIPT_ACTION = {
  VIEW: 'view',
  DOWNLOAD: 'download',
};

/**
 * The receipt's issue date.
 *
 * `billing_invoices` records `sent_at`, `paid_at` and `created_at`; backstop
 * invoices (created from a completed payment by the automation engine) have the
 * first two null, so `created_at` is the honest answer rather than a blank.
 */
export const invoiceIssuedAt = (invoice) =>
  invoice?.sent_at || invoice?.paid_at || invoice?.issued_at || invoice?.created_at || null;

/** The receipt document's human number, or null when the API omitted it. */
export const invoiceReceiptNumber = (invoice) => invoice?.invoice_number ?? null;

/**
 * Whether an order has been paid, from the fields the orders API actually
 * returns. Used only to choose the wording of a non-actionable note — never to
 * decide whether a document exists.
 */
export function isOrderPaid(order) {
  if (!order) return false;
  const status = String(order.status ?? '').trim().toLowerCase();
  if (['completed', 'paid', 'processing'].includes(status)) return true;
  const total = Number(order.total_amount ?? 0);
  const paid = Number(order.paid_amount ?? 0);
  return total > 0 && paid >= total;
}

const STATUS_LABELS = {
  [INVOICE_STATUS.DRAFT]: 'Draft',
  [INVOICE_STATUS.SENT]: 'Sent',
  [INVOICE_STATUS.PAID]: 'Paid',
  [INVOICE_STATUS.OVERDUE]: 'Overdue',
  [INVOICE_STATUS.CANCELLED]: 'Cancelled',
  [INVOICE_STATUS.REFUNDED]: 'Refunded',
};

/** Statuses mapped to the workshop status token they should paint with. */
const STATUS_TONES = {
  [INVOICE_STATUS.DRAFT]: 'neutral',
  [INVOICE_STATUS.SENT]: 'info',
  [INVOICE_STATUS.PAID]: 'success',
  [INVOICE_STATUS.OVERDUE]: 'warning',
  [INVOICE_STATUS.CANCELLED]: 'error',
  [INVOICE_STATUS.REFUNDED]: 'neutral',
};

/** The verified download route. Never assembled anywhere but here. */
export const INVOICE_DOWNLOAD_PATH = (invoiceId) =>
  `billing/invoices/${encodeURIComponent(String(invoiceId))}/download`;

export const normalizeInvoiceStatus = (status) =>
  String(status ?? '').trim().toLowerCase();

export const invoiceStatusLabel = (status) =>
  STATUS_LABELS[normalizeInvoiceStatus(status)] ?? 'Issued';

export const invoiceStatusTone = (status) =>
  STATUS_TONES[normalizeInvoiceStatus(status)] ?? 'neutral';

/** Whether an existing invoice record may be offered for download. */
export const isInvoiceDownloadable = (invoice) => {
  if (!invoice?.id) return false;
  return !VOID_INVOICE_STATUSES.includes(normalizeInvoiceStatus(invoice.status));
};

/** The invoice's owner order id, coerced for the `==`-free comparisons below. */
const invoiceOrderId = (invoice) => {
  const raw = invoice?.order_id ?? invoice?.orderId;
  return raw === null || raw === undefined || raw === '' ? null : String(raw);
};

/**
 * Choose the invoice that represents an order.
 *
 * Orders can accumulate more than one invoice (a re-issue after a cancellation,
 * or the backstop racing the event listener), so "first one found" can surface a
 * voided document while a valid re-issue sits right beside it. Prefer the newest
 * downloadable invoice; fall back to the newest overall only so the row can say
 * "Cancelled" instead of offering a download.
 */
export function selectInvoiceForOrder(invoices = [], orderId) {
  if (orderId === null || orderId === undefined) return null;
  const target = String(orderId);

  const matching = (invoices || []).filter(
    (invoice) => invoiceOrderId(invoice) === target
  );
  if (matching.length === 0) return null;

  const byNewest = (a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0);
  const downloadable = matching.filter(isInvoiceDownloadable).sort(byNewest);

  return downloadable[0] ?? matching.sort(byNewest)[0];
}

/** The non-actionable receipt state of an order that has no document. */
function notIssuedState(paid) {
  return {
    state: INVOICE_STATE.NOT_ISSUED,
    downloadable: false,
    canView: false,
    canDownload: false,
    invoice: null,
    status: '',
    statusLabel: 'Not issued',
    tone: 'neutral',
    receiptNumber: null,
    issuedAt: null,
    actionLabel: null,
    downloadLabel: null,
    // An unpaid order is a different situation from a paid one the backstop has
    // not processed yet, and saying so costs nothing.
    note: paid === false ? 'Not available yet' : 'Receipt not issued yet',
  };
}

/**
 * Describe a single invoice record for presentation.
 *
 * @returns {{ state, downloadable, canView, canDownload, invoice, status,
 *   statusLabel, tone, receiptNumber, issuedAt, actionLabel, downloadLabel, note }}
 */
export function describeInvoice(invoice) {
  const status = normalizeInvoiceStatus(invoice?.status);
  const statusLabel = invoiceStatusLabel(status);

  if (!isInvoiceDownloadable(invoice)) {
    return {
      state: INVOICE_STATE.VOID,
      downloadable: false,
      canView: false,
      canDownload: false,
      invoice,
      status,
      statusLabel,
      tone: invoiceStatusTone(status),
      receiptNumber: invoiceReceiptNumber(invoice),
      issuedAt: invoiceIssuedAt(invoice),
      actionLabel: null,
      downloadLabel: null,
      note: 'This receipt was cancelled',
    };
  }

  return {
    state: INVOICE_STATE.AVAILABLE,
    downloadable: true,
    canView: true,
    canDownload: true,
    invoice,
    status,
    statusLabel,
    tone: invoiceStatusTone(status),
    receiptNumber: invoiceReceiptNumber(invoice),
    issuedAt: invoiceIssuedAt(invoice),
    // The backend serves the receipt as a PDF; the action opens it in-app.
    actionLabel: 'View Receipt',
    downloadLabel: 'Download',
    note: invoiceReceiptNumber(invoice) || 'Receipt available',
  };
}

/**
 * The complete receipt state of an order: the selected invoice (if any) plus the
 * presentation facts the UI needs. Nothing here reaches the network.
 *
 * @param {Array} invoices   the customer's invoice rows (from /billing/invoices)
 * @param {number|string} orderId  the order the row belongs to
 * @param {{ paid?: boolean|null }} [options]  `paid` only chooses the wording of
 *   a non-actionable note. It can never conjure a document, and `null` (unknown)
 *   keeps the original "not issued yet" copy.
 *
 * Every field is per-order: this is called once per row, so one order's receipt
 * can never leak into another's.
 */
export function invoiceStateForOrder(invoices = [], orderId, options = {}) {
  const invoice = selectInvoiceForOrder(invoices, orderId);
  const paid = options.paid === undefined ? null : options.paid;

  return invoice ? describeInvoice(invoice) : notIssuedState(paid);
}

/**
 * Receipt state from an already order-scoped invoice list.
 *
 * The unified order-detail payload carries `invoices[]` for one order, so no
 * order matching is needed (or possible). Same selector preference as the list
 * path so a voided invoice can never mask a valid re-issue.
 */
export function receiptStateFromInvoices(invoices = [], { paid = null } = {}) {
  const list = Array.isArray(invoices) ? invoices : [];
  if (list.length === 0) return notIssuedState(paid);

  const byNewest = (a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0);
  const downloadable = list.filter(isInvoiceDownloadable).sort(byNewest);
  const chosen = downloadable[0] ?? [...list].sort(byNewest)[0];

  return describeInvoice(chosen);
}

/**
 * One receipt state for an order, from whichever source the surface has.
 *
 * Keeps the three customer surfaces on a single rule: an order detail payload
 * carries its own invoices, the billing list carries the whole invoice set.
 */
export function receiptStateForOrder({ order, invoices, orderInvoices, paid } = {}) {
  const resolvedPaid = paid === undefined ? isOrderPaid(order) : paid;
  const scoped = orderInvoices ?? order?.invoices;

  if (Array.isArray(scoped)) {
    return receiptStateFromInvoices(scoped, { paid: resolvedPaid });
  }

  return invoiceStateForOrder(invoices, order?.id, { paid: resolvedPaid });
}

/** Order status → chip presentation. Keeps raw enum values out of the DOM. */
const ORDER_STATUS_META = {
  completed: { label: 'Completed', tone: 'success' },
  paid: { label: 'Paid', tone: 'success' },
  active: { label: 'Active', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  processing: { label: 'Processing', tone: 'info' },
  draft: { label: 'Draft', tone: 'neutral' },
  failed: { label: 'Failed', tone: 'error' },
  cancelled: { label: 'Cancelled', tone: 'error' },
  refunded: { label: 'Refunded', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'warning' },
};

export function orderStatusMeta(status) {
  const key = String(status ?? '').trim().toLowerCase();
  return ORDER_STATUS_META[key] ?? { label: key ? key.replace(/_/g, ' ') : 'Unknown', tone: 'neutral' };
}

/** `₹2,499` — never a raw float. */
export function formatInvoiceAmount(amount, currency = 'INR') {
  const value = Number(amount ?? 0);
  const symbol = String(currency).toUpperCase() === 'INR' ? '₹' : '';
  return `${symbol}${value.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/** The order's human reference, without inventing one when the API omits it. */
export const orderReference = (order) =>
  order?.order_number ? `#${order.order_number}` : order?.id ? `#${order.id}` : '—';

/** Line label for an order row: the purchased item, else the domain, else a dash. */
export function orderItemLabel(order) {
  return (
    order?.orderable?.title ||
    order?.orderable?.name ||
    order?.metadata?.product_type ||
    order?.metadata?.product_name ||
    '—'
  );
}
