"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { billingApi, saveInvoiceDocument } from '@/features/commerce/services/billingApi';
import { RECEIPT_ACTION } from '@/features/commerce/utils/invoiceAvailability';

/**
 * Short-lived document cache, keyed by invoice + disposition.
 *
 * A receipt PDF is generated on the server per request (dompdf), and the browser
 * pays for it every time. `prefetchReceiptDocument()` — wired to hovering or
 * focusing "View Receipt" — starts that generation while the customer is still
 * moving the pointer, so the click usually finds the bytes already local.
 *
 * Deliberately small and short-lived: a receipt is a historical document, so a
 * minute of reuse cannot mislead anyone, while an unbounded cache could. Failures
 * are evicted immediately so a blip is never cached as a result.
 */
const DOCUMENT_TTL_MS = 90000;
const DOCUMENT_CACHE_LIMIT = 6;
const documentCache = new Map();

const isFresh = (entry) => entry && Date.now() - entry.at <= DOCUMENT_TTL_MS;

function pruneDocumentCache() {
  for (const [key, entry] of documentCache) {
    if (!isFresh(entry)) documentCache.delete(key);
  }
  // Map preserves insertion order, so the oldest key is simply the first.
  while (documentCache.size > DOCUMENT_CACHE_LIMIT) {
    documentCache.delete(documentCache.keys().next().value);
  }
}

function loadReceiptDocument(invoice, disposition) {
  const invoiceId = typeof invoice === 'object' ? invoice?.id : invoice;

  // Refuse to build a request without a real invoice reference: this is the
  // guard that makes a derived/static URL impossible to reach by accident.
  if (!invoiceId) return Promise.reject(new Error('Missing invoice reference.'));

  const key = `${invoiceId}:${disposition}`;
  const cached = documentCache.get(key);
  if (isFresh(cached)) return cached.promise;

  pruneDocumentCache();

  const promise = billingApi.downloadInvoiceDocument(invoice, { disposition });
  documentCache.set(key, { promise, at: Date.now() });
  promise.catch(() => documentCache.delete(key));

  return promise;
}

/**
 * Warm both halves of "View Receipt" before the click lands.
 *
 * The bytes and the PDF.js viewer are otherwise strictly serialized: the viewer
 * chunk is only imported once the fetch resolves, so the customer waits for the
 * render and then for the download. Starting both on hover costs nothing when
 * they never click and removes most of the wait when they do.
 *
 * Both halves fail silently by design: this is an optimisation, and the click
 * path reports any real error to the customer.
 */
export function prefetchReceiptDocument(invoice) {
  if (typeof window === 'undefined' || !invoice) return;

  import('@/features/commerce/components/PdfViewerModal').catch(() => {});
  loadReceiptDocument(invoice, 'inline').catch(() => {});
}

/**
 * Fetch and present the receipt PDF (WORKSHOP-DS-07F).
 *
 * One implementation, shared by every surface that offers receipt actions, so
 * Billing & Order History, Order Detail and Checkout Success cannot drift into
 * three subtly different document paths.
 *
 *   VIEW      fetch the PDF, then hand a same-origin blob URL to the in-app
 *             PDF.js viewer. It never opens a new tab: a new tab cannot carry an
 *             `Authorization` header, which is exactly why the original
 *             `window.open(receiptUrl)` 401'd for every signed-in customer.
 *   DOWNLOAD  fetch the SAME PDF from the SAME route and save it.
 *
 * Both actions hit one verified endpoint (`billing/invoices/{id}/download`); the
 * `disposition` query parameter selects inline vs attachment on the server. No
 * URL is ever assembled from an order id, and no token appears in a URL.
 *
 * @returns {{
 *   act: (action: string, invoice: object) => Promise<void>,
 *   busy: boolean, busyAction: string|null, error: string|null,
 *   viewer: {url: string, filename: string}|null,
 *   closeViewer: () => void, downloadViewer: () => Promise<void>,
 * }}
 */
export default function useReceiptDocument() {
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const [error, setError] = useState(null);
  const [viewer, setViewer] = useState(null);

  // Object URLs must be revoked or every receipt view leaks the whole PDF.
  const viewerUrlRef = useRef(null);

  const releaseViewerUrl = useCallback(() => {
    if (viewerUrlRef.current && typeof URL !== 'undefined') {
      URL.revokeObjectURL(viewerUrlRef.current);
    }
    viewerUrlRef.current = null;
  }, []);

  const closeViewer = useCallback(() => {
    releaseViewerUrl();
    setViewer(null);
  }, [releaseViewerUrl]);

  useEffect(() => () => releaseViewerUrl(), [releaseViewerUrl]);

  const fetchDocument = useCallback(async (invoice, disposition = 'inline') => {
    // This is where the prefetched bytes are picked up, so a hovered "View
    // Receipt" opens from memory. Called without a prefetch it simply fetches.
    return loadReceiptDocument(invoice, disposition);
  }, []);

  const act = useCallback(
    async (action, invoice) => {
      setError(null);
      setBusy(true);
      setBusyAction(action);

      try {
        // The prefetch already proved the reference is usable; a defensive check
        // keeps a caller from rendering a spinner over nothing.
        if (!(typeof invoice === 'object' ? invoice?.id : invoice)) {
          setError('This receipt is not available.');
          return;
        }

        // The viewer streams the bytes; `attachment` keeps the server from
        // forcing a save dialog for the same document.
        const disposition = action === RECEIPT_ACTION.DOWNLOAD ? 'attachment' : 'inline';
        const document = await fetchDocument(invoice, disposition);
        if (!document) return;

        if (action === RECEIPT_ACTION.DOWNLOAD) {
          // Same bytes, saved instead of displayed.
          saveInvoiceDocument(document.blob, document.filename);
          return;
        }

        releaseViewerUrl();
        const url = URL.createObjectURL(document.blob);
        viewerUrlRef.current = url;
        setViewer({ url, filename: document.filename, invoice });
      } catch (err) {
        setError(err?.message || 'Could not open the receipt. Please try again.');
      } finally {
        setBusy(false);
        setBusyAction(null);
      }
    },
    [fetchDocument, releaseViewerUrl]
  );

  /**
   * Download from inside the viewer.
   *
   * Fetched as `attachment` rather than reusing the viewer's `inline` bytes, so
   * the disposition the customer sees saved is the one the server chose — the
   * document is identical either way.
   */
  const downloadViewer = useCallback(async () => {
    if (!viewer?.invoice) return;

    setError(null);
    setBusy(true);
    setBusyAction(RECEIPT_ACTION.DOWNLOAD);

    try {
      const document = await loadReceiptDocument(viewer.invoice, 'attachment');
      saveInvoiceDocument(document.blob, document.filename);
    } catch (err) {
      setError(err?.message || 'Could not save the receipt. Please try again.');
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }, [viewer]);

  return { act, busy, busyAction, error, viewer, closeViewer, downloadViewer };
}
