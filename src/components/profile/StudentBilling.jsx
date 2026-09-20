"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { FaReceipt, FaLock } from "react-icons/fa";
import ReceiptActions from "@/components/commerce/ReceiptActions";
import { billingApi } from "@/features/commerce/services/billingApi";
import {
  formatInvoiceAmount,
  invoiceStateForOrder,
  isOrderPaid,
  orderItemLabel,
  orderReference,
  orderStatusMeta,
} from "@/features/commerce/utils/invoiceAvailability";
import "@/assets/css/student-billing.scss";

/**
 * Billing & Order History.
 *
 * The receipt column is driven entirely by `invoiceStateForOrder` — one decision
 * per order, from the customer's own invoice rows. An order on its own is never
 * sufficient grounds to show a receipt action, and no receipt state is shared
 * between rows.
 *
 * WORKSHOP-DS-07E: the cell now renders the shared `ReceiptActions` component
 * (View + Download) instead of a single button, so Billing, Order Detail and
 * Checkout Success offer the same two actions through the same code. The
 * document fetch moved into that component, which means this page no longer owns
 * a second implementation of it.
 *
 * The previous implementation hardcoded a dark palette onto the profile's light
 * content card (`color: #fff` for the heading, `#ddd` for the body) and used
 * Tailwind utility classes that this project does not ship — so the tab rendered
 * as near-invisible text. Styling comes from `student-billing.scss` and the
 * DS-02 tokens.
 */
export default function StudentBilling() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const signedIn = Boolean(user?.id || isAuthenticated);

  const loadBillingHistory = useCallback(async () => {
    if (!signedIn) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Both are authenticated workshop endpoints; neither is public.
      const [orderList, invoiceList] = await Promise.all([
        billingApi.fetchOrders(),
        billingApi.fetchInvoices(),
      ]);

      setOrders(orderList);
      setInvoices(invoiceList);
    } catch (err) {
      // billingApi already normalised this into customer-facing copy (see
      // `describeRequestError`); the raw error is never rendered.
      setError(err?.message || 'Could not retrieve billing and order history. Please try again.');
      if (process.env.NODE_ENV !== 'production') {
        // Log the useful fields, not the whole AxiosError — the full object dumps
        // request config (including the bearer token) into the console.
        const cause = err?.cause || err;
        console.error(
          '[StudentBilling] billing history failed:',
          cause?.message,
          '| status:',
          cause?.response?.status ?? 'none',
          '| code:',
          cause?.code ?? 'none',
          '| url:',
          cause?.config?.url ?? 'unknown'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [signedIn]);

  useEffect(() => {
    loadBillingHistory();
  }, [loadBillingHistory]);

  /**
   * One availability decision per order, recomputed only when data changes.
   * `paid` only picks the wording of a non-actionable note.
   */
  const rows = useMemo(
    () =>
      (orders || []).map((order) => ({
        order,
        receipt: invoiceStateForOrder(invoices, order.id, { paid: isOrderPaid(order) }),
      })),
    [orders, invoices]
  );

  if (loading) {
    return (
      <section className="StudentBilling" aria-busy="true">
        <header className="StudentBillingHead">
          <h2 className="StudentBillingTitle">Billing &amp; Order History</h2>
          <p className="StudentBillingSub">Loading your purchases and receipts…</p>
        </header>
        <div className="StudentBillingSkeleton" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span className="SkeletonRow" key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (!signedIn) {
    return (
      <section className="StudentBilling">
        <header className="StudentBillingHead">
          <h2 className="StudentBillingTitle">Billing &amp; Order History</h2>
        </header>
        <div className="StudentBillingEmpty">
          <FaLock aria-hidden="true" />
          <p>Please sign in to view your billing history and receipts.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="StudentBilling">
      <header className="StudentBillingHead">
        <h2 className="StudentBillingTitle">Billing &amp; Order History</h2>
        <p className="StudentBillingSub">
          Your Workshop purchases and the receipts issued against them.
        </p>
      </header>

      {error && (
        <div className="StudentBillingAlert" role="alert">
          <span>{error}</span>
          <button type="button" className="StudentBillingRetry" onClick={loadBillingHistory}>
            Try again
          </button>
        </div>
      )}

      {/* A failed load must not also claim there is nothing to show: we do not
          know that. The alert above is the whole message until a load succeeds. */}
      {error ? null : rows.length === 0 ? (
        <div className="StudentBillingEmpty">
          <FaReceipt aria-hidden="true" />
          <p>No past purchases or orders found.</p>
        </div>
      ) : (
        <div className="StudentBillingTableWrap">
          <table className="StudentBillingTable">
            <caption className="VisuallyHidden">Billing and order history</caption>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Item</th>
                <th scope="col">Amount</th>
                <th scope="col">Status</th>
                <th scope="col" className="CellInvoice">
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ order, receipt }) => {
                const status = orderStatusMeta(order.status);

                return (
                  <tr key={order.id}>
                    <td data-label="Order" className="CellOrder">
                      {orderReference(order)}
                    </td>
                    <td data-label="Item" className="CellItem">
                      {orderItemLabel(order)}
                    </td>
                    <td data-label="Amount" className="CellAmount">
                      {formatInvoiceAmount(order.total_amount, order.currency)}
                    </td>
                    <td data-label="Status" className="CellStatus">
                      <span className={`StatusChip is-${status.tone}`}>{status.label}</span>
                    </td>
                    <td data-label="Receipt" className="CellInvoice">
                      <ReceiptActions
                        receipt={receipt}
                        layout="row"
                        label={orderReference(order)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
