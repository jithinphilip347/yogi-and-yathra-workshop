"use client";

import { useEffect, useState } from 'react';
import orderApi from '@/libs/orderApi';
import { normalizeOrder } from '@/features/commerce/utils/unifiedOrder';
import { receiptStateFromInvoices } from '@/features/commerce/utils/invoiceAvailability';

/**
 * Resolve one order's receipt state (WORKSHOP-DS-07E).
 *
 * Used where a page holds only an order reference and not the invoices — the
 * Checkout Success page. It reads the SAME unified order-detail endpoint the
 * Orders tab already uses, which returns this order's invoices and is scoped to
 * the signed-in customer server-side, so no new endpoint or contract is needed.
 *
 * Deliberately quiet: it returns `null` while loading and on any failure, and
 * never throws. A receipt lookup must not be able to break a page that has
 * already taken the customer's money — a surface with no receipt state simply
 * renders no receipt actions.
 *
 * @param {string|number|null} reference  Workshop order number, or null
 * @returns {object|null} a receipt state, or null when unknown
 */
export default function useOrderReceipt(reference) {
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    const ref = reference === null || reference === undefined ? '' : String(reference).trim();

    if (!ref) {
      setReceipt(null);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await orderApi.detail(ref);
        const view = normalizeOrder(response?.data ?? response);

        if (cancelled || !view) return;

        setReceipt(receiptStateFromInvoices(view.invoices, { paid: view.isPaid }));
      } catch {
        // Not an error the customer needs: the page's own CTAs still work and
        // the billing history shows the same information a moment later.
        if (!cancelled) setReceipt(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reference]);

  return receipt;
}
