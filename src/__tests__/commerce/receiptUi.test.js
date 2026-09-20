import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  INVOICE_STATE,
  INVOICE_STATUS,
  RECEIPT_ACTION,
  INVOICE_DOWNLOAD_PATH,
  describeInvoice,
  invoiceIssuedAt,
  invoiceStateForOrder,
  isOrderPaid,
  receiptStateForOrder,
  receiptStateFromInvoices,
} from '@/features/commerce/utils/invoiceAvailability';

/**
 * WORKSHOP-DS-07E / DS-07F — the customer receipt.
 *
 * Three properties are pinned here, because each was a real defect or a real
 * requirement:
 *
 *  1. One receipt rule, evaluated per order. The reported bug was that every row
 *     read "Receipt not issued yet"; the fix must never reintroduce a single
 *     shared flag that decides for the whole list.
 *
 *  2. The two actions exist exactly when a verified document does — and never
 *     otherwise.
 *
 *  3. "View Receipt" renders the PDF in-app. The previous implementation handed a
 *     URL to `window.open`, and a new tab cannot carry an `Authorization` header,
 *     so it 401'd for every signed-in customer.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '../../');
const read = (...segments) => fs.readFileSync(path.resolve(__dirname, ...segments), 'utf8');

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const receiptActions = stripComments(read('../../components/commerce/ReceiptActions.jsx'));
const receiptHook = stripComments(read('../../features/commerce/hooks/useReceiptDocument.js'));
const viewer = stripComments(read('../../features/commerce/components/PdfViewerModal.jsx'));
// Assert on the stylesheets' actual declarations, @media rules included.
const viewerScss = stripComments(read('../../assets/css/pdf-viewer.scss'));
const receiptScss = stripComments(read('../../assets/css/receipt.scss'));

const invoice = (overrides = {}) => ({
  id: 5,
  invoice_number: 'INV-2026-00005',
  order_id: 6,
  status: INVOICE_STATUS.DRAFT,
  total_amount: 1050,
  created_at: '2026-09-20T11:23:13.000000Z',
  ...overrides,
});

describe('one receipt rule per order', () => {
  it('offers both actions when a real document exists', () => {
    const state = receiptStateFromInvoices([invoice()]);

    expect(state.state).toBe(INVOICE_STATE.AVAILABLE);
    expect(state.canView).toBe(true);
    expect(state.canDownload).toBe(true);
    expect(state.actionLabel).toBe('View Receipt');
    expect(state.downloadLabel).toBe('Download');
    expect(state.receiptNumber).toBe('INV-2026-00005');
  });

  it('offers no action at all when no document exists', () => {
    const state = receiptStateFromInvoices([]);

    expect(state.state).toBe(INVOICE_STATE.NOT_ISSUED);
    expect(state.canView).toBe(false);
    expect(state.canDownload).toBe(false);
    expect(state.actionLabel).toBeNull();
    expect(state.invoice).toBeNull();
  });

  it('offers no action for a cancelled document', () => {
    const state = receiptStateFromInvoices([invoice({ status: INVOICE_STATUS.CANCELLED })]);

    expect(state.state).toBe(INVOICE_STATE.VOID);
    expect(state.canView).toBe(false);
    expect(state.canDownload).toBe(false);
  });

  it('words an unpaid order differently from a paid one awaiting its document', () => {
    // Both are non-actionable, but they are not the same situation and saying so
    // costs nothing.
    expect(receiptStateFromInvoices([], { paid: false }).note).toBe('Not available yet');
    expect(receiptStateFromInvoices([], { paid: true }).note).toBe('Receipt not issued yet');
    expect(receiptStateFromInvoices([]).note).toBe('Receipt not issued yet');
  });

  it('never lets one order inherit another order receipt', () => {
    const invoices = [invoice({ id: 5, order_id: 6, invoice_number: 'INV-00005' })];

    const mine = invoiceStateForOrder(invoices, 6);
    const theirs = invoiceStateForOrder(invoices, 7);

    expect(mine.state).toBe(INVOICE_STATE.AVAILABLE);
    expect(theirs.state).toBe(INVOICE_STATE.NOT_ISSUED);
    expect(theirs.invoice).toBeNull();
  });

  it('derives the state from whichever source the surface actually has', () => {
    // Order Detail carries the order's own invoices.
    const detail = receiptStateForOrder({ order: { id: 6, invoices: [invoice()] } });
    expect(detail.state).toBe(INVOICE_STATE.AVAILABLE);

    // Billing carries the whole set and matches by order id.
    const list = receiptStateForOrder({ order: { id: 6 }, invoices: [invoice()] });
    expect(list.state).toBe(INVOICE_STATE.AVAILABLE);
  });

  it('reads a draft receipt as available', () => {
    // The invoice-generation backstop leaves receipts in `draft` for orders that
    // were genuinely paid; hiding them would deny those customers their receipt.
    expect(receiptStateFromInvoices([invoice({ status: INVOICE_STATUS.DRAFT })]).canView).toBe(true);
  });

  it('reports the issue date from the timestamps the table records', () => {
    expect(invoiceIssuedAt({ created_at: '2026-09-20T11:23:13.000000Z' })).toBe(
      '2026-09-20T11:23:13.000000Z'
    );
    expect(invoiceIssuedAt({ sent_at: '2026-09-21T00:00:00Z', created_at: 'x' })).toBe(
      '2026-09-21T00:00:00Z'
    );
    expect(invoiceIssuedAt(null)).toBeNull();
  });

  it('treats a settled order as paid from any of the authoritative signals', () => {
    expect(isOrderPaid({ status: 'completed' })).toBe(true);
    expect(isOrderPaid({ status: 'pending', paid_amount: 1050, total_amount: 1050 })).toBe(true);
    expect(isOrderPaid({ status: 'pending', paid_amount: 0, total_amount: 1050 })).toBe(false);
    expect(isOrderPaid(null)).toBe(false);
  });

  it('describes an unknown-status document without inventing a verdict', () => {
    const state = describeInvoice(invoice({ status: 'generating' }));
    expect(state.canView).toBe(true);
    expect(state.statusLabel).toBe('Issued');
  });
});

describe('the document route', () => {
  it('is one relative, encoded path — never an absolute or derived URL', () => {
    expect(INVOICE_DOWNLOAD_PATH(5)).toBe('billing/invoices/5/download');
    expect(INVOICE_DOWNLOAD_PATH(5).startsWith('/')).toBe(false);
    expect(INVOICE_DOWNLOAD_PATH(5)).not.toMatch(/^https?:/);
    expect(INVOICE_DOWNLOAD_PATH('1/../2')).toBe('billing/invoices/1%2F..%2F2/download');
  });

  it('is never assembled anywhere else', () => {
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

    const building = walk(SRC).filter((file) =>
      /billing\/invoices\//.test(stripComments(fs.readFileSync(file, 'utf8')))
    );

    expect(building.map((f) => f.slice(SRC.length + 1))).toEqual([
      'features/commerce/utils/invoiceAvailability.js',
    ]);
  });
});

describe('the in-app viewer', () => {
  it('never opens a tab or navigates away for a receipt', () => {
    for (const [name, source] of [
      ['ReceiptActions', receiptActions],
      ['useReceiptDocument', receiptHook],
      ['PdfViewerModal', viewer],
    ]) {
      expect(source, `${name} must not call window.open`).not.toMatch(/window\.open\(/);
      expect(source, `${name} must not assign location.href`).not.toMatch(/location\.href\s*=/);
      expect(source, `${name} must not use an anchor to the document route`).not.toMatch(
        /<a[^>]+href=[^>]*download/i
      );
    }
  });

  it('renders with PDF.js and loads the worker from the served asset', () => {
    expect(viewer).toMatch(/from 'react-pdf'/);
    expect(viewer).toMatch(/GlobalWorkerOptions\.workerSrc\s*=\s*'\/pdf\.worker\.min\.mjs'/);
    expect(receiptActions).toMatch(/PdfViewerModal/);
  });

  it('ships the worker it points at', () => {
    const worker = path.resolve(SRC, '../public/pdf.worker.min.mjs');
    expect(fs.existsSync(worker)).toBe(true);
    expect(fs.statSync(worker).size).toBeGreaterThan(100000);
  });

  it('supports page navigation, zoom, download and close', () => {
    // Page navigation
    expect(viewer).toMatch(/Previous page/);
    expect(viewer).toMatch(/Next page/);
    expect(viewer).toMatch(/goTo\(page [+-] 1\)/);
    // Zoom
    expect(viewer).toMatch(/Zoom in/);
    expect(viewer).toMatch(/Zoom out/);
    // Download, wired to the same document
    expect(viewer).toMatch(/onDownload/);
    expect(receiptHook).toMatch(/downloadViewer/);
    // Close / back
    expect(viewer).toMatch(/Close receipt viewer/);
    expect(viewer).toMatch(/Escape/);
    expect(viewer).toMatch(/onClose/);
  });

  it('fits the page to a measured width so 320px stays legible', () => {
    expect(viewer).toMatch(/ResizeObserver/);
    expect(viewer).toMatch(/Math\.round\(fitWidth \* zoom\)/);
    // Below 640px the dialog is full-bleed: a receipt squeezed into a 320px card
    // would be unreadable, so the page is fit to the width instead.
    expect(viewerScss).toMatch(/@media \(max-width: 640px\)/);
    expect(viewerScss).toMatch(/width: min\(1000px, 100%\)/);
  });

  it('clamps zoom and bounds the page index', () => {
    expect(viewer).toMatch(/MIN_ZOOM/);
    expect(viewer).toMatch(/MAX_ZOOM/);
    expect(viewer).toMatch(/Math\.min\(Math\.max\(1, next\), Math\.max\(1, numPages\)\)/);
  });

  it('releases the blob URL so a viewed receipt cannot leak', () => {
    expect(receiptHook).toMatch(/revokeObjectURL/);
    expect(receiptHook).toMatch(/releaseViewerUrl/);
  });

  it('fetches the document only for a real invoice reference', () => {
    expect(receiptHook).toMatch(/if \(!invoiceId\)/);
    // The hook's whole public surface: one entry point for both actions, plus the
    // viewer session the modal is driven from.
    const hookExports = /return \{\s*act,\s*busy,\s*busyAction,\s*error,\s*viewer,\s*closeViewer,\s*downloadViewer,?\s*\}/;
    expect(receiptHook).toMatch(hookExports);
    expect(receiptActions).toMatch(/RECEIPT_ACTION\.VIEW/);
    expect(receiptActions).toMatch(/RECEIPT_ACTION\.DOWNLOAD/);
    expect(RECEIPT_ACTION.VIEW).toBe('view');
    expect(RECEIPT_ACTION.DOWNLOAD).toBe('download');
  });
});

describe('receipt presentation stays on the design system', () => {
  it('resolves every colour through a token in both stylesheets', () => {
    for (const [name, scss] of [['receipt.scss', receiptScss], ['pdf-viewer.scss', viewerScss]]) {
      expect(scss, `${name} must not hardcode a hex`).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(scss, `${name} must not hardcode rgb/rgba`).not.toMatch(/rgba?\(\s*\d/);
    }
  });

  it('reuses the shared radius, border and surface tokens', () => {
    for (const scss of [receiptScss, viewerScss]) {
      expect(scss).toMatch(/var\(--radius-(sm|md|lg)\)/);
      expect(scss).toMatch(/var\(--color-border/);
      expect(scss).toMatch(/var\(--surface/);
    }
  });

  it('introduces no receipt- or viewer-specific radius or shadow', () => {
    for (const scss of [receiptScss, viewerScss]) {
      expect(scss).not.toMatch(/--receipt-|--viewer-(radius|shadow)|receipt-card-radius/);
    }
  });
});

/**
 * Opening a receipt must not make the customer wait on a cold server render.
 *
 * The PDF is generated per request, and the viewer chunk is only imported once
 * the bytes arrive — so the two waits used to add up. Prefetching on hover is
 * what removes that, and the properties below are what keep it honest: it must
 * reuse bytes rather than re-request them, never cache a failure, and never grow
 * without bound.
 */
describe('opening a receipt does not wait on a cold render', () => {
  it('warms the document and the viewer before the click, not after', () => {
    expect(receiptActions).toMatch(/onMouseEnter=\{warm\}/);
    expect(receiptActions).toMatch(/onFocus=\{warm\}/);
    expect(receiptActions).toMatch(/prefetchReceiptDocument\(receipt\.invoice\)/);
  });

  it('starts the viewer chunk in parallel with the bytes', () => {
    // Otherwise the chunk is only requested after the fetch resolves.
    expect(receiptHook).toMatch(/import\('@\/features\/commerce\/components\/PdfViewerModal'\)/);
  });

  it('reuses a freshly fetched document instead of requesting it twice', () => {
    expect(receiptHook).toMatch(/if \(isFresh\(cached\)\) return cached\.promise;/);
  });

  it('never caches a failure as though it were a document', () => {
    expect(receiptHook).toMatch(/promise\.catch\(\(\) => documentCache\.delete\(key\)\)/);
  });

  it('bounds the cache and expires it, so PDFs cannot accumulate', () => {
    expect(receiptHook).toMatch(/DOCUMENT_CACHE_LIMIT/);
    expect(receiptHook).toMatch(/DOCUMENT_TTL_MS/);
    expect(receiptHook).toMatch(/pruneDocumentCache\(\)/);
  });

  it('keys by disposition, so a save never reuses a view and vice versa', () => {
    expect(receiptHook).toMatch(/const key = `\$\{invoiceId\}:\$\{disposition\}`;/);
  });

  it('still routes both actions through the one verified document route', () => {
    expect(receiptHook).toMatch(/billingApi\.downloadInvoiceDocument\(invoice, \{ disposition \}\)/);
  });
});
