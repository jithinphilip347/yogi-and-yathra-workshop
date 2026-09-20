/**
 * Billing API client — invoices for the Workshop customer.
 *
 * Every call goes through `apiClient`, which attaches the Sanctum bearer token
 * and handles expired-session redirects. That is the whole point of this module:
 * the previous implementation built a raw `${API_BASE_URL}/billing/invoices/{id}/
 * download` string and handed it to `window.open`, and a new tab cannot carry an
 * `Authorization` header — so the only invoice download in the product 401'd for
 * every signed-in customer. The verified route is real; the transfer mechanism
 * was not.
 *
 * The route now returns a genuine `application/pdf` document (dompdf renders
 * `invoices.receipt`, `BillingController::invoicesDownload`), and the bytes are
 * fetched here rather than navigated to. One route, one document: the
 * `disposition` parameter only chooses inline streaming (the in-app viewer)
 * versus an attachment (the save), so View and Download can never disagree.
 *
 * Scope note: these are WORKSHOP endpoints (`/api/v1/billing/*`). No Yogan Yatra /
 * E-commerce endpoint is contacted here, and no internal service key is involved.
 */

import apiClient from '@/services/apiClient';
import { INVOICE_DOWNLOAD_PATH } from '../utils/invoiceAvailability';

/**
 * Accept the documented `{success, data}` envelope, a bare array, or a
 * double-wrapped body, without ever returning `undefined` to a `.map()`.
 */
export function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

/**
 * Axios reports a failed *blob* request as a Blob, so `error.message` is useless
 * ("Request failed with status code 403" at best). Read the body back so a JSON
 * error message reaches the caller instead of a swallowed blob.
 */
async function describeBlobError(error) {
  const data = error?.response?.data;
  const fallback = 'Could not open the receipt. Please try again.';

  if (data && typeof data.text === 'function') {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (parsed?.message) return String(parsed.message);
      if (parsed?.error) return String(parsed.error);
    } catch {
      /* not JSON — fall through to the status-based message */
    }
  }

  const status = error?.response?.status;
  if (status === 401 || status === 403) {
    return 'You are not authorised to open this receipt.';
  }
  if (status === 404) {
    return 'This receipt is no longer available.';
  }
  return fallback;
}

/**
 * Turn a transport failure into something a customer can act on.
 *
 * "Could not retrieve billing history" is unhelpful when the real cause is that
 * the Workshop API is simply not reachable (`ERR_NETWORK` — no `response` at
 * all), which is a very different problem from a rejected request.
 */
export function describeRequestError(error) {
  const status = error?.response?.status;

  if (status === 401 || status === 403) return 'Your session has expired. Please sign in again.';
  if (status === 404) return 'Billing history is not available for your account.';
  if (status >= 500) return 'The server could not load your billing history. Please try again.';
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  // No `response` means the request never completed: server down, DNS, offline.
  if (error && !error.response) return 'Could not reach the server. Check your connection and try again.';
  return 'Could not retrieve billing and order history. Please try again.';
}

/** Re-throw with a customer-facing message while keeping the cause for debugging. */
const withFriendlyMessage = (error) => {
  const message = describeRequestError(error);
  if (error?.message === message) return error;
  const wrapped = new Error(message);
  wrapped.cause = error;
  return wrapped;
};

export const billingApi = {
  /** Authenticated order history for the signed-in customer. */
  async fetchOrders() {
    try {
      const res = await apiClient.get('billing/orders', { params: { per_page: 50 } });
      return unwrapList(res.data);
    } catch (error) {
      throw withFriendlyMessage(error);
    }
  },

  /** Authenticated invoice history for the signed-in customer. */
  async fetchInvoices() {
    try {
      const res = await apiClient.get('billing/invoices', { params: { per_page: 50 } });
      return unwrapList(res.data);
    } catch (error) {
      throw withFriendlyMessage(error);
    }
  },

  /**
   * Fetch the receipt document through the authenticated client.
   *
   * `responseType: 'blob'` plus the bearer token is the only mechanism the
   * verified backend contract supports — the response is real PDF bytes, not a
   * public or signed URL, and the receipt is never fetched without auth.
   *
   * @returns {Promise<{blob: Blob, filename: string}>}
   */
  async downloadInvoiceDocument(invoice, { filename, disposition = 'inline' } = {}) {
    const invoiceId = typeof invoice === 'object' ? invoice?.id : invoice;
    if (!invoiceId) throw new Error('Missing invoice reference.');

    try {
      const res = await apiClient.get(INVOICE_DOWNLOAD_PATH(invoiceId), {
        responseType: 'blob',
        timeout: 30000,
        // One route, two dispositions: `inline` streams the PDF into the in-app
        // viewer, `attachment` saves it. The document is identical either way.
        params: { disposition },
      });

      const number = typeof invoice === 'object' ? invoice?.invoice_number : null;
      return {
        blob: res.data,
        // The backend names the file `Receipt-{invoice_number}.pdf`; mirror it so
        // a saved receipt matches the one the viewer is showing.
        filename: filename || (number ? `Receipt-${number}.pdf` : 'Receipt.pdf'),
      };
    } catch (error) {
      const message = await describeBlobError(error);
      const wrapped = new Error(message);
      wrapped.cause = error;
      throw wrapped;
    }
  },
};

/**
 * NOTE: `openInvoiceDocument()` was removed.
 *
 * It existed to hand a blob URL to `window.open(...)`. "View Receipt" now
 * renders in-app with PDF.js (`features/commerce/components/PdfViewerModal`),
 * so nothing in the product opens a receipt in a new tab any more. Keeping the
 * helper around would leave the easy path to the accepted-but-wrong behaviour
 * one import away.
 */

/**
 * Save the already-fetched receipt bytes to disk.
 *
 * This is the "Download" half of the receipt actions and it deliberately reuses
 * the bytes that `downloadInvoiceDocument` fetched through `apiClient` — it is
 * NOT a second endpoint. It cannot be a plain `href` because the route requires
 * the bearer token, which a navigation cannot carry; that is the original defect
 * this module exists to fix.
 *
 * @returns {boolean} whether a save was initiated
 */
export function saveInvoiceDocument(blob, filename = 'Receipt.pdf') {
  if (typeof window === 'undefined' || typeof URL?.createObjectURL !== 'function') {
    return false;
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  return true;
}
