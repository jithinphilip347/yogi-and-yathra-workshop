# Workshop Receipt — Real PDF + In-App Viewer

**Sprint:** Real PDF receipt/invoice + PDF viewer fix
**Scope:** `Yogify-workshop` only (backend + customer-facing frontend)
**Date:** 20 September 2026
**Status:** PASS WITH FINDINGS

---

## 1. Scope and repository verification

Only the Yogify Workshop repositories were modified. Git metadata exists for the
sub-repositories (the shared root is not a repository), so the boundary is
verified with `git status`, not by inference.

| Repository | Branch | HEAD | Working tree | Touched by this sprint |
|---|---|---|---|---|
| `Yogify-workshop/backend` | main | `2dee13a` | 5 modified, 4 new | **Yes** |
| `Yogify-workshop/frontend` | main | `4c507b2` | see §9 | **Yes** |
| `Yogify-workshop/admin-panel` | main | `67a8832` | clean | No |
| `yogiandyathra/yogify-backendnew` (E-commerce) | main | `15e791d` | clean | **No** |
| `yogiandyathra/yogify-dashboard` (E-commerce dashboard) | main | `34a9abb9` | pre-existing changes | **No** |

`yogiandyathra/yogify-dashboard` carries uncommitted changes (its own order-print
design work: `src/utils/orderPrint.js`, `src/pages/order/OrderList.jsx`,
`src/components/YogifySelect.jsx`, a `dist/` rebuild). They are **not** part of
this sprint and no command in this session addressed that directory; they are
reported here so the boundary is explicit rather than assumed.

The E-commerce **backend** is clean, which matters: the receipt needed no
external-contract change (requirement 3 of the brief — reuse, do not reinvent).

---

## 2. Audit: what existed before

**The document was never a PDF.** `BillingController::invoicesDownload` rendered
`invoices.receipt` to **HTML** and served it with `Content-Disposition: inline`.
It was a print-styled web page presented as an invoice. The model docblock said
so outright ("PDF generation is not yet implemented"), which is why the frontend
had honestly been relabelled to "View Receipt" in an earlier sprint.

**The template contained invented business data.** The pre-existing Blade
template hardcoded:

- `27AAAAA0000A1Z5` — a placeholder tax number
- `billing@yogify.com` — an invented support address
- `Yogify Wellness Platform` — an invented issuer
- `Invoice & Receipt` — a generic title
- `Valued Student` — a fallback customer name

**The line items were wrong.** The template read the unit price from
`$invoice->subtotal`, a column the unified checkout **never populates**. Measured:
a paid ₹1,050 order printed its line item as **₹0.00** while the total printed
₹1,050 — a self-contradicting document, and the exact defect reported.

**The transfer mechanism was broken.** The single "download" path built
`${API_BASE_URL}/billing/invoices/{id}/download` and handed it to `window.open`.
A new tab cannot carry an `Authorization` header, so the only receipt surface in
the product 401'd for every signed-in customer. (Fixed in a prior sprint; this
sprint replaced the remaining `window.open` *viewing* path with an in-app viewer.)

**Audit of duplicate implementations:** `resources/views/invoices/` contains
exactly one template. `Pdf::loadView` appears in one place for receipts and in
`Domains/Report/EnrollmentExportService` for admin exports — i.e. **dompdf was
already the established PDF mechanism** in this backend, so the receipt reuses it
rather than introducing a second generator.

---

## 3. Architecture after the change

```
Workshop frontend                                   Workshop backend
─────────────────                                   ────────────────
ReceiptActions.jsx                                  GET /api/v1/billing/invoices/{invoice}/download
  ├─ receipt state (invoiceAvailability.js)            │  auth:sanctum → authorizeInvoiceAccess()
  │    one decision per order                          │  (owner or admin — unchanged gate)
  ├─ useReceiptDocument()                              ▼
  │    ↓ apiClient.get(INVOICE_DOWNLOAD_PATH(id),   BillingController::invoicesDownload
  │        responseType: 'blob', disposition)          │
  │    ├─ VIEW  → blob: URL → PdfViewerModal           ▼
  │    │            (PDF.js, ssr:false, no new tab)  ReceiptDocumentService::buildFor($invoice)
  │    └─ DOWN  → saveInvoiceDocument(blob, name)      ├─ customer      order/billing address, then invoice, then user
  └─ same component on Billing, Order Detail,          ├─ physical items E-commerce delegated order (EcommerceClient)
       Checkout Success                                ├─ item names     EcommerceClient::getProductsByIds() (batched, existing)
                                                       ├─ learning item  Workshop orderable
                                                       ├─ totals        invoice row (billing domain owns them)
                                                       └─ status label  settlement-derived (see §7)
                                                             │
                                                             ▼
                                                       Pdf::loadView('invoices.receipt') → dompdf
                                                             │  A4, DejaVu Sans, remote assets off
                                                             ▼
                                                       application/pdf
                                                         disposition=inline      → stream()  (viewer)
                                                         disposition=attachment  → download() (download)
```

One route, one document, two presentations. There is no second URL for download,
and no URL is ever assembled from an order id.

---

## 4. Data sources — every printed value is authoritative

| Printed value | Source | Invented? |
|---|---|---|
| Brand, legal name, support email/phone, address | `config/receipt.php`, values taken from the Workshop footer (the only governed source) | No |
| Logo | `public/images/yogan-yatra-logo.png`, copied from `frontend/src/assets/images/logo.png` (the production lockup used by Nav/Footer/auth) | No |
| Invoice number, issue date | `billing_invoices.invoice_number`, `sent_at ?? paid_at ?? created_at` | No |
| Order number | `billing_orders.order_number` | No |
| Customer name/email/phone/address | order `metadata.billing_address` → invoice billing fields → user record | No |
| Item name, code, type | `EcommerceClient::getProductsByIds()` (existing batched internal API) | No |
| Item quantity, unit price, line total | the **delegated E-commerce order** — what was actually charged | No |
| Learning item | the Workshop `orderable` on the order | No |
| Subtotal, discount, coupon, tax, total, paid | invoice row (billing domain) | No |
| Payment status, method, date, transaction ref | the order's latest `BillingPayment` | No |
| Tax identity (GSTIN) | **not configured anywhere → omitted** | N/A |

The template renders provider details from config with `env()` overrides, so
operations can change the issuer without a deploy.

---

## 5. The ₹0.00 bug — root cause and fix

**Symptom.** A paid ₹1,050 order printed one line item at ₹0.00, above a total of
₹1,050.

**Root cause.** The template sourced the line price from `$invoice->subtotal`.
The unified checkout never writes `billing_invoices.subtotal`; it stays `0.00`
(asserted directly in the test fixture). Every other figure on the page came from
real sources, so the document contradicted itself. The number was not merely
missing — it was an authoritative-looking zero.

**Fix.** `ReceiptDocumentService` resolves line items from the sources that
actually hold them and never reads the empty column. Because the learning line's
share of a mixed order is not stored anywhere, it is derived as the residual that
makes the document add up, and the result is then **verified**: if the printed
figures do not sum to the authoritative total, an explicit adjustment line is
emitted and the mismatch is logged. The document can therefore be wrong-but-honest,
never quietly contradictory.

**Verified on the live document** (invoice 6, order `ORD-2026-00008`, extracted
from the real PDF bytes):

```
Devadaru Mala - 6 mm   Code: YG-6DDM-1   Product   Qty 1   ₹1,000.00   ₹1,000.00
Items subtotal  ₹1,000.00
Shipping / courier  ₹50.00
Total  ₹1,050.00
Paid   ₹1,050.00
```

---

## 6. The viewer

"View Receipt" no longer opens a tab. It fetches the PDF through the
authenticated client and renders it in-app with PDF.js.

- `useReceiptDocument()` — one implementation for view *and* download, shared by
  every surface. Both hit the same route; `disposition` selects inline vs
  attachment, so the bytes cannot diverge.
- `PdfViewerModal` — `pdfjs-dist` worker served from `public/pdf.worker.min.mjs`
  (copied from the installed `react-pdf@11` / `pdfjs-dist@6.3.289` pair, so the
  bundler never resolves a worker URL at runtime). Loaded via `dynamic(..., {
  ssr: false })`, keyed by document URL, so it stays out of the initial bundle for
  every page that never opens a receipt, and a second receipt always opens at
  page 1 / 100%.
- Controls: previous/next page, zoom in/out (clamped 0.5–3), download, close;
  Escape closes; focus moves into the dialog; background scroll is locked; the
  page is fit to a **measured** width (`ResizeObserver`) rather than an assumed one:
  canvas 974×1377 at 1440px, 296×418 at 320px.
- Object URLs are revoked on close and on unmount — a viewed receipt cannot leak.

Responsive behaviour below 640px is full-bleed rather than a squeezed card: at
320px and 390px the dialog is exactly the viewport width with **zero** horizontal
overflow.

---

## 7. Defect found and fixed during verification

**Symptom.** A fully paid customer's receipt was stamped **`DRAFT`**, directly
above a payment block reading "Payment status: Completed".

**Root cause.** The template printed the raw `billing_invoices.status` enum.
`BillingAutomationEngine::generatePendingInvoices` creates invoices from completed
payments and deliberately leaves them in `draft` pending review, so that enum is
`draft` for real, paid receipts.

**Fix.** `ReceiptDocumentService::documentStatusLabel()` names the document for
what it proves instead of for the row's workflow state:

- settled documents (`paid >= total`, `total > 0`) → **Paid**
- unsettled → their own honest status (`Sent`, `Overdue`, …)
- `cancelled` → **Cancelled**, never relabelled Paid, because a withdrawn receipt
  must not read as proof of purchase

**Verified live:** the same invoice now extracts as `Yogan Yatra / RECEIPT /
INV-2026-00006 / Issued 20 Sep 2026 / PAID`, and `DRAFT` is absent.

Three tests pin the rule (settled-draft, unsettled, cancelled).

---

## 8. Files changed

### Backend

| File | Change |
|---|---|
| `app/Domains/Billing/Services/ReceiptDocumentService.php` | **new** — authoritative receipt dataset: resolution, reconciliation, status label |
| `config/receipt.php` | **new** — real issuer identity from the footer; no invented GSTIN |
| `resources/views/invoices/receipt.blade.php` | rewritten — real data only, A4, branded **Yogan Yatra**, config-driven footer |
| `app/Http/Controllers/BillingController.php` | returns a real PDF; `disposition` selects inline/attachment; same authorization gate |
| `public/images/yogan-yatra-logo.png` | **new** — the production lockup, copied for dompdf embedding |
| `tests/Feature/ReceiptDocumentTest.php` | **new** — 16 tests, 73 assertions |
| `app/Domains/Billing/Listeners/HandleInvoiceGeneration.php` | registered on the paid path so a paid order actually gets a receipt |
| `app/Providers/EventServiceProvider.php` | wiring for the above (moved from `PaymentVerified`-only) |
| `app/Services/Commerce/UnifiedOrderAggregator.php` | reads the real issue timestamp column (the previous one did not exist, so `issued_at` was always null) |

### Frontend

| File | Change |
|---|---|
| `src/features/commerce/components/PdfViewerModal.jsx` | **new** — in-app PDF.js viewer |
| `src/assets/css/pdf-viewer.scss` | **new** — DS-02 tokens only (`--overlay-modal` for the scrim, not a new `rgba`) |
| `src/__tests__/commerce/receiptUi.test.js` | **new** — 23 tests |
| `src/features/commerce/hooks/useReceiptDocument.js` | view + download through one authenticated fetch |
| `src/components/commerce/ReceiptActions.jsx` | renders the viewer; keyed by document; no new tab |
| `src/features/commerce/services/billingApi.js` | fetches real PDF bytes; filename mirrors the server's `Receipt-{number}.pdf`; contract docs corrected |
| `src/features/commerce/utils/invoiceAvailability.js` | contract docs corrected from "HTML, no PDF generator" to the real PDF route |
| `src/features/commerce/hooks/useOrderReceipt.js` | keyed by order reference so one order's receipt cannot render for another; removes a synchronous set-state-in-effect |
| `src/__tests__/commerce/{invoiceAvailability,ordersUi}.test.js` | realigned with the PDF/viewer reality |
| `package.json` / `package-lock.json` | `react-pdf@^11` |
| `public/pdf.worker.min.mjs` | **new** — the worker the viewer points at |
| `scripts/ds07fReceiptCapture.mjs` | **new** — the zero-dependency verification harness used below |
| `src/app/ds07d-orders-review/page.js` + `public/ds07d*` | **deleted** — dev harness and 26 screenshot artifacts that would otherwise ship |

The deleted `public/ds07d*` files were committed in an earlier sprint and are
duplicated byte-for-byte in `docs/screenshots/ds07d/`; removing them keeps a
development harness and screenshots of customer orders out of the built app.
Restore with `git checkout -- public/ds07d public/ds07d-review.html public/ds07d-gallery.html`
if that judgement is not wanted.

---

## 9. Tests

| Suite | Result |
|---|---|
| Backend — full (`php artisan test`) | **1524 passed / 0 failed** (5763 assertions) |
| Backend — `ReceiptDocumentTest` | **16 passed / 0 failed** (73 assertions) |
| Frontend — full (`vitest run`) | **676 passed / 0 failed** (46 files) |
| Frontend — receipt (PDF + viewer + model) | **23 passed / 0 failed** (new) |
| Frontend — lint | 39 problems (11 errors, 28 warnings) — **exactly the pre-existing baseline** |
| Production build | `next build` → **Compiled successfully**, 32 routes |

Backend tests cover: authoritative prices instead of the empty subtotal, every
line of a multi-item order, learning orders with discounts, the status label
rules, absence of placeholder business data, real configuration branding, logo
embedding from the production asset, an unreachable store reported rather than
papered over, the discrepancy adjustment, the no-delegated-id path, the response
being a real PDF, both dispositions being the same document, and cross-customer /
guest authorization.

Frontend tests cover the state model (per-order availability, never a shared
flag), the single-encoded-path rule, no `window.open`/`location.href`/anchor in
any receipt surface, worker presence, page nav + zoom + download + close, blob
revocation, bloat-free tokens, and the source audits that ban static receipt URLs.

---

## 10. Browser verification (real pages, real data, real payment)

Run: `TOKEN=<sanctum> node scripts/ds07fReceiptCapture.mjs` against the live
Workshop API with a real customer that owns six completed orders. Evidence in
`docs/screenshots/ds07f/` and `verification.json`. All ten checks **PASS**.

- **Billing & Order History, 320 / 390 / 768 / 1024 / 1440px:** 9 rows, **6 with
  both actions**, 3 unpaid rows reading "Not available yet". Per-row state, proven:
  the same page renders available and unavailable receipts side by side. Zero
  horizontal overflow at every width. The only "clipped" node is the
  `VisuallyHidden` table caption, which is clipped by design.
- **Order Detail:** the shared receipt section renders with `View Receipt` +
  `Download` and invoice `INV-2026-00006`.
- **The document response, as the browser saw it:** `200 application/pdf`, no
  token in the URL; `disposition=inline` and `disposition=attachment` are the same
  route. The 204 entries are CORS preflights.
- **The viewer renders the document:** canvas ink coverage measured from the
  canvas itself — 3.0% at 1440px, 5.5% at 320px — i.e. the receipt is painted, not
  a blank white canvas of the correct size.
- **Download:** the app handed the save path a `blob:` URL of type
  `application/pdf`, **1,268,937 bytes**, header `%PDF-`, trailer `%%EOF`, saved as
  `Receipt-INV-2026-00006.pdf` — with no navigation. The server's own response for
  the same invoice is **1,268,937 bytes** too, so view and download are provably
  the same document.
- **Zoom** in/out changes both the indicator and the rendered canvas width; page
  navigation is bounded; **Escape closes the viewer at all four widths**.
- Console errors are only the Pusher WebSocket (no Pusher server running locally).

**Independent content check.** The PDF's own text streams were decoded and
contain: `Yogan Yatra`, `RECEIPT`, `INV-2026-00006`, `Issued 20 Sep 2026`, `PAID`,
`BILLED TO` with the real customer name/email/phone/address, `ISSUED BY` with the
real provider details, `Order: ORD-2026-00008`, the real line item with its code
and ₹1,000.00, the subtotal/courier/total/paid figures, and the real payment
method, date and transaction reference. None of the prohibited placeholder values
appear.

Two limitations of the harness are stated rather than hidden: headless Chrome did
not capture the blob download into its own download directory (so the evidence is
the bytes handed to the save helper plus the server response, not a file in that
directory), and the Checkout Success page's receipt path was verified by source
and shared-hook identity rather than by driving the page, because its order comes
from the in-memory checkout session.

---

## 11. Remaining backend gaps

1. **Nothing marks the invoice settled after generation.** The event listener
   marks it paid on the verified-payment path, but the automation backstop leaves
   `draft` forever. The receipt now labels correctly, but admin reporting still
   sees genuine paid receipts as drafts. That is a billing-domain decision, not a
   receipt one.
2. **`billing_invoices.subtotal` is never populated** by the unified checkout.
   The receipt works around it by reconciling against the authoritative total; a
   real invoice line-item table is the durable fix.
3. **Mixed orders print one learning line**, derived as the residual. If a mixed
   order ever carries several learning items, the current order metadata cannot
   attribute amounts per item.
4. **No GSTIN/registration is configured**, so no tax identity is printed. This is
   deliberate (inventing one was the original defect), but a real invoice for a
   registered business may legally require it.
5. **`useProfileLearning.jsx` exposes no order or invoice reference**, so the
   per-session receipt actions removed in an earlier sprint cannot be restored
   without a backend change.

---

## 12. Final status

**PASS WITH FINDINGS.** The receipt is a real `application/pdf`, generated from
authoritative Workshop and delegated E-commerce data, branded **Yogan Yatra** with
the production logo, viewed in-app without a new tab, downloadable through the
authenticated route, and truthful about its own state. The ₹0.00 line-item bug is
fixed at the source, and the `DRAFT`-on-a-paid-receipt defect found during
verification is fixed and pinned by tests. All suites and the production build are
green, and no Yogan Yatra / E-commerce repository was modified.
