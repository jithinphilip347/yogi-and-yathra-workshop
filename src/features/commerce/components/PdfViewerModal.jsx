"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FaChevronLeft, FaChevronRight, FaDownload, FaSearchMinus, FaSearchPlus, FaTimes } from 'react-icons/fa';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import '@/assets/css/pdf-viewer.scss';

/**
 * In-app PDF viewer (WORKSHOP-DS-07F).
 *
 * "View Receipt" must NOT open a new browser tab. A new tab also cannot carry an
 * `Authorization` header, which is why the original `window.open(receiptUrl)`
 * implementation 401'd for every signed-in customer — so the receipt bytes are
 * fetched through the authenticated client and rendered here with PDF.js.
 *
 * The worker is served from `public/pdf.worker.min.mjs`, copied from the
 * installed `pdfjs-dist`, so the bundler never has to resolve a worker URL at
 * runtime.
 */

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/** A4 width in PDF points — the basis for "fit to width". */
const A4_WIDTH_PT = 595.28;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export default function PdfViewerModal({
  open = false,
  fileUrl = null,
  filename = 'Receipt.pdf',
  title = 'Receipt',
  onClose,
  onDownload,
  downloadBusy = false,
}) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(A4_WIDTH_PT);
  const [failed, setFailed] = useState(false);

  const bodyRef = useRef(null);
  const dialogRef = useRef(null);

  /* ── Fit to width: measured, not assumed, so 320px is as usable as 1440px ── */
  useEffect(() => {
    if (!open) return undefined;

    const measure = () => {
      const el = bodyRef.current;
      if (!el) return;
      const available = el.clientWidth - 24; // breathing room inside the padded body
      if (available > 80) setFitWidth(available);
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(measure);
    if (bodyRef.current) observer.observe(bodyRef.current);

    return () => observer.disconnect();
  }, [open]);

  /* Per-document state needs no reset effect: the parent mounts this modal only
     while a receipt is open (`{viewer && <PdfViewerModal … />}`) and keys it by
     the document URL, so every receipt starts on page 1 at 100%. */

  /* ── Escape to close, and don't let the page behind scroll ─────────────── */
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog so Escape and tabbing behave.
    window.setTimeout(() => dialogRef.current?.focus(), 0);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const onDocumentLoad = useCallback(({ numPages: count }) => {
    setNumPages(count || 0);
    setFailed(false);
  }, []);

  if (!open || !fileUrl) return null;

  const goTo = (next) => setPage((current) => Math.min(Math.max(1, next), Math.max(1, numPages)));
  const zoomBy = (delta) =>
    setZoom((current) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((current + delta).toFixed(2)))));

  return (
    <div className="PdfViewerOverlay" role="presentation" onMouseDown={() => onClose?.()}>
      <div
        className="PdfViewerDialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={dialogRef}
        /* The dialog itself must not close when the user drags to select text. */
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="PdfViewerBar">
          <div className="PdfViewerTitle">
            <span className="PdfViewerTitleText">{title}</span>
            <span className="PdfViewerFilename">{filename}</span>
          </div>

          <div className="PdfViewerTools">
            <div className="PdfViewerGroup" role="group" aria-label="Page navigation">
              <button
                type="button"
                className="PdfViewerIconBtn"
                onClick={() => goTo(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <FaChevronLeft aria-hidden="true" />
              </button>
              <span className="PdfViewerPage" aria-live="polite">
                {numPages ? `${page} / ${numPages}` : '—'}
              </span>
              <button
                type="button"
                className="PdfViewerIconBtn"
                onClick={() => goTo(page + 1)}
                disabled={!numPages || page >= numPages}
                aria-label="Next page"
              >
                <FaChevronRight aria-hidden="true" />
              </button>
            </div>

            <div className="PdfViewerGroup" role="group" aria-label="Zoom">
              <button
                type="button"
                className="PdfViewerIconBtn"
                onClick={() => zoomBy(-ZOOM_STEP)}
                disabled={zoom <= MIN_ZOOM}
                aria-label="Zoom out"
              >
                <FaSearchMinus aria-hidden="true" />
              </button>
              <span className="PdfViewerZoom" aria-live="polite">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                className="PdfViewerIconBtn"
                onClick={() => zoomBy(ZOOM_STEP)}
                disabled={zoom >= MAX_ZOOM}
                aria-label="Zoom in"
              >
                <FaSearchPlus aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              className="PdfViewerBtn is-primary"
              onClick={onDownload}
              disabled={downloadBusy}
            >
              <FaDownload aria-hidden="true" />
              {downloadBusy ? 'Saving…' : 'Download'}
            </button>

            <button
              type="button"
              className="PdfViewerIconBtn is-close"
              onClick={onClose}
              aria-label="Close receipt viewer"
            >
              <FaTimes aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="PdfViewerBody" ref={bodyRef}>
          {failed ? (
            <div className="PdfViewerState is-error" role="alert">
              <p>This receipt could not be displayed.</p>
              <button type="button" className="PdfViewerBtn is-primary" onClick={onDownload}>
                <FaDownload aria-hidden="true" /> Download instead
              </button>
            </div>
          ) : (
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoad}
              onLoadError={() => setFailed(true)}
              loading={
                <div className="PdfViewerState" aria-busy="true">
                  <span className="PdfViewerSpinner" aria-hidden="true" />
                  <p>Loading receipt…</p>
                </div>
              }
              error={
                <div className="PdfViewerState is-error" role="alert">
                  <p>This receipt could not be displayed.</p>
                </div>
              }
            >
              <Page
                pageNumber={page}
                width={Math.round(fitWidth * zoom)}
                renderAnnotationLayer={false}
                loading={<div className="PdfViewerState" aria-busy="true"><span className="PdfViewerSpinner" aria-hidden="true" /></div>}
              />
            </Document>
          )}
        </div>
      </div>
    </div>
  );
}
