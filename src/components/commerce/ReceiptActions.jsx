"use client";

import React from 'react';
import { FaDownload, FaSpinner, FaEye } from 'react-icons/fa';
import useReceiptDocument from '@/features/commerce/hooks/useReceiptDocument';
import {
  INVOICE_STATE,
  RECEIPT_ACTION,
} from '@/features/commerce/utils/invoiceAvailability';
import '@/assets/css/receipt.scss';

/**
 * Receipt actions (WORKSHOP-DS-07E).
 *
 * The single customer-facing receipt presentation, used by Billing & Order
 * History, Order Detail and Checkout Success, so there is exactly one rule for
 * when a customer may open or save their receipt.
 *
 * It renders from a *receipt state* — never from the existence of an order. A
 * caller that cannot prove a document exists has nothing to pass, and the
 * component then shows the state's note instead of a button that would 404.
 *
 * The document is fetched here (via `useReceiptDocument`) rather than by each
 * page, so the transport cannot drift between surfaces. Only a verified route is
 * ever contacted.
 *
 * @param {object} props
 * @param {object} props.receipt   state from `invoiceStateForOrder` / `receiptStateFromInvoices`
 * @param {string} [props.label]   what the receipt belongs to, for the aria-label
 * @param {'row'|'stack'} [props.layout] `row` for table cells, `stack` for pages
 * @param {string} [props.className]
 */
export default function ReceiptActions({ receipt, label = null, layout = 'stack', className = '' }) {
  const { act, busy, busyAction, error, clearError } = useReceiptDocument();

  if (!receipt) return null;

  const available = receipt.state === INVOICE_STATE.AVAILABLE && receipt.canView;
  const suffix = label ? ` for ${label}` : '';

  return (
    <div className={`ReceiptActions is-${layout} ${className}`.trim()}>
      {available ? (
        <>
          <div className="ReceiptActionsButtons">
            <button
              type="button"
              className="ReceiptBtn is-primary"
              onClick={() => act(RECEIPT_ACTION.VIEW, receipt.invoice)}
              disabled={busy === receipt.invoice?.id}
              aria-label={`View receipt${suffix}`}
            >
              {busy === receipt.invoice?.id && busyAction === RECEIPT_ACTION.VIEW ? (
                <FaSpinner className="ReceiptSpin" aria-hidden="true" />
              ) : (
                <FaEye aria-hidden="true" />
              )}
              {busy === receipt.invoice?.id && busyAction === RECEIPT_ACTION.VIEW
                ? 'Opening…'
                : receipt.actionLabel || 'View Receipt'}
            </button>

            <button
              type="button"
              className="ReceiptBtn is-secondary"
              onClick={() => act(RECEIPT_ACTION.DOWNLOAD, receipt.invoice)}
              disabled={busy === receipt.invoice?.id}
              aria-label={`Download receipt${suffix}`}
            >
              {busy === receipt.invoice?.id && busyAction === RECEIPT_ACTION.DOWNLOAD ? (
                <FaSpinner className="ReceiptSpin" aria-hidden="true" />
              ) : (
                <FaDownload aria-hidden="true" />
              )}
              {busy === receipt.invoice?.id && busyAction === RECEIPT_ACTION.DOWNLOAD
                ? 'Saving…'
                : receipt.downloadLabel || 'Download'}
            </button>
          </div>

          <p className="ReceiptMeta">
            {receipt.receiptNumber && <span className="ReceiptNumber">{receipt.receiptNumber}</span>}
            {receipt.issuedAt && (
              <span className="ReceiptDate">{formatReceiptDate(receipt.issuedAt)}</span>
            )}
          </p>
        </>
      ) : (
        <p className={`ReceiptNone${receipt.state === INVOICE_STATE.VOID ? ' is-error' : ''}`}>
          {receipt.note}
          {receipt.receiptNumber && receipt.state === INVOICE_STATE.VOID && (
            <span className="ReceiptNumber">{receipt.receiptNumber}</span>
          )}
        </p>
      )}

      {error && (
        <p className="ReceiptError" role="alert" onClick={clearError}>
          {error}
        </p>
      )}
    </div>
  );
}

/** `2026-09-20T11:23:13Z` -> `20 Sept 2026`. Null stays null. */
function formatReceiptDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export { formatReceiptDate };
