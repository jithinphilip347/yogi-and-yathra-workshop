"use client";

import React, { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { FaDownload, FaSpinner, FaEye } from 'react-icons/fa';
import useReceiptDocument, { prefetchReceiptDocument } from '@/features/commerce/hooks/useReceiptDocument';
import {
  INVOICE_STATE,
  RECEIPT_ACTION,
} from '@/features/commerce/utils/invoiceAvailability';
import '@/assets/css/receipt.scss';

/**
 * PDF.js is deliberately loaded only when a customer actually opens a receipt:
 * `ssr: false` keeps the viewer (and its worker) out of the server render and out
 * of the initial bundle for every other page.
 */
const PdfViewerModal = dynamic(
  () => import('@/features/commerce/components/PdfViewerModal'),
  { ssr: false }
);

/**
 * Receipt actions (WORKSHOP-DS-07E / DS-07F).
 *
 * The single customer-facing receipt presentation, used by Billing & Order
 * History, Order Detail and Checkout Success, so there is exactly one rule for
 * when a customer may open or save their receipt.
 *
 * It renders from a *receipt state* — never from the existence of an order. A
 * caller that cannot prove a document exists has nothing to pass, and the
 * component then shows the state's note instead of a button that would 404.
 *
 *   View Receipt      → in-app PDF.js viewer (never a new tab)
 *   Download Receipt  → the same PDF, saved
 *
 * @param {object} props
 * @param {object} props.receipt   state from `invoiceStateForOrder` / `receiptStateFromInvoices`
 * @param {string} [props.label]   what the receipt belongs to, for the aria-label
 * @param {'row'|'stack'} [props.layout] `row` for table cells, `stack` for pages
 * @param {string} [props.className]
 */
export default function ReceiptActions({ receipt, label = null, layout = 'stack', className = '' }) {
  const { act, busy, busyAction, error, viewer, closeViewer, downloadViewer } = useReceiptDocument();

  /**
   * Start generating the PDF and downloading the viewer while the pointer is
   * still on the button. A hover that never becomes a click costs one small
   * request; a click that follows opens from memory instead of waiting for the
   * server to render the document.
   */
  const warm = useCallback(() => {
    if (receipt?.invoice) prefetchReceiptDocument(receipt.invoice);
  }, [receipt]);

  if (!receipt) return null;

  const available = receipt.state === INVOICE_STATE.AVAILABLE && receipt.canView;
  const suffix = label ? ` for ${label}` : '';
  const viewing = busy && busyAction === RECEIPT_ACTION.VIEW;
  const saving = busy && busyAction === RECEIPT_ACTION.DOWNLOAD;

  return (
    <div className={`ReceiptActions is-${layout} ${className}`.trim()}>
      {available ? (
        <>
          <div className="ReceiptActionsButtons">
            <button
              type="button"
              className="ReceiptBtn is-primary"
              onClick={() => act(RECEIPT_ACTION.VIEW, receipt.invoice)}
              onMouseEnter={warm}
              onFocus={warm}
              disabled={busy}
              aria-label={`View receipt PDF${suffix}`}
            >
              {viewing ? (
                <FaSpinner className="ReceiptSpin" aria-hidden="true" />
              ) : (
                <FaEye aria-hidden="true" />
              )}
              {viewing ? 'Opening…' : receipt.actionLabel || 'View Receipt'}
            </button>

            <button
              type="button"
              className="ReceiptBtn is-secondary"
              onClick={() => act(RECEIPT_ACTION.DOWNLOAD, receipt.invoice)}
              disabled={busy}
              aria-label={`Save receipt PDF${suffix}`}
            >
              {saving ? (
                <FaSpinner className="ReceiptSpin" aria-hidden="true" />
              ) : (
                <FaDownload aria-hidden="true" />
              )}
              {saving ? 'Saving…' : receipt.downloadLabel || 'Download'}
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
        <p className="ReceiptError" role="alert">
          {error}
        </p>
      )}

      {viewer && (
        <PdfViewerModal
          // Keyed by document: opening a second receipt mounts a fresh viewer
          // rather than reusing the previous one's page and zoom.
          key={viewer.url}
          open
          fileUrl={viewer.url}
          filename={viewer.filename}
          title={receipt.receiptNumber ? `Receipt ${receipt.receiptNumber}` : 'Receipt'}
          onClose={closeViewer}
          onDownload={downloadViewer}
          downloadBusy={saving}
        />
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
