"use client";

import { useCallback, useState } from 'react';
import {
  billingApi,
  openInvoiceDocument,
  saveInvoiceDocument,
} from '@/features/commerce/services/billingApi';
import { RECEIPT_ACTION } from '@/features/commerce/utils/invoiceAvailability';

/**
 * Fetch and present a receipt document (WORKSHOP-DS-07E).
 *
 * One implementation, shared by every surface that offers receipt actions, so
 * Billing & Order History, Order Detail and Checkout Success cannot drift into
 * three subtly different download paths.
 *
 * The document comes from the single verified Workshop route
 * (`billing/invoices/{invoice}/download`, rendered as an HTML receipt and served
 * `Content-Disposition: inline`) fetched through `apiClient`. A new tab cannot
 * carry an `Authorization` header, which is precisely why the previous
 * `window.open` implementation 401'd for every signed-in customer.
 *
 * @returns {{
 *   act: (action: string, invoice: object) => Promise<void>,
 *   busy: string|null, busyAction: string|null, error: string|null,
 *   clearError: () => void,
 * }}
 */
export default function useReceiptDocument() {
  const [busyId, setBusyId] = useState(null);
  const [busyAction, setBusyAction] = useState(null);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const act = useCallback(async (action, invoice) => {
    const invoiceId = typeof invoice === 'object' ? invoice?.id : invoice;

    // Refuse to build a request without a real invoice reference. This is the
    // guard that makes a static/derived URL impossible to reach by accident.
    if (!invoiceId) {
      setError('This receipt is not available.');
      return;
    }

    setError(null);
    setBusyId(invoiceId);
    setBusyAction(action);

    try {
      const { blob, filename } = await billingApi.downloadInvoiceDocument(invoice);

      if (action === RECEIPT_ACTION.DOWNLOAD) {
        saveInvoiceDocument(blob, filename);
      } else {
        openInvoiceDocument(blob, filename);
      }
    } catch (err) {
      setError(err?.message || 'Could not open the receipt. Please try again.');
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }, []);

  return { act, busy: busyId, busyAction, error, clearError };
}
