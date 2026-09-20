# Yogify Workshop — Dynamic Invoice Availability & Download Audit
## WORKSHOP-DS-07C — Implementation Report

---

## 1. Scope

```
Yogify Workshop frontend only.
Yogan Yatra / E-commerce excluded.
```

Every change in this sprint is confined to `Yogify-workshop/frontend`. Section 11 records the
boundary evidence.

**Pre-read status.** `docs/WORKSHOP_DS_07A_CHECKOUT_REDESIGN_REPORT.md` exists and was read.
`WORKSHOP_DS_05_IMPLEMENTATION_REPORT.md` and `WORKSHOP_DS_06_IMPLEMENTATION_REPORT.md` do **not**
exist in `docs/` — only 01/02, 03, 04 and 07A. That gap is pre-existing and unchanged by this task.
DS-07B's `page.js` / `checkout-success.scss` work was present on disk and was **not** redone; the
invoice UI was layered on top of it.

---

## 2. Existing Invoice Implementations

Complete inventory from a repository-wide search of the Workshop frontend.

| File | Route / surface | UI | Data source | Dynamic? | Action |
|---|---|---|---|---|---|
| `components/profile/StudentBilling.jsx:44` | `/auth/profile?tab=billing` | `Receipt PDF` button in the Receipt column | `window.open(\`${API_BASE_URL}/billing/invoices/${id}/download\`)` | **No** | Rebuilt |
| `components/profile/LiveYoga.jsx:235` | profile → Live Sessions → row menu | `<button>Download Invoice</button>` | none — no `onClick` | **No (dead)** | Removed |
| `components/profile/LiveClasses.jsx:122` | profile → Live Classes → row menu | `<button>Download Invoice</button>` | none — no `onClick` | **No (dead)** | Removed |
| `app/checkout/success/page.js:227` | `/checkout/success` | `Billing & Invoices` link | `CONFIRMATION_ROUTES.billing` = `/auth/profile?tab=billing` | n/a (navigation) | Kept |
| `components/profile/Profile.jsx:187,241` | `/auth/profile` | `billing` / `invoices` → `Billing & Invoices` tab | URL param | n/a (routing) | Kept |
| `features/commerce/slices/paymentSlice.js:12,30,42` | Razorpay flow | `receipt` | Razorpay response field | n/a — **not an invoice** | Untouched |
| `features/commerce/adapters/CommerceAdapter.js:97,105` | fee-demand cart item | `Academic Fee Demand #{invoice_number}` | backend fee demand | n/a — label only | Untouched |
| `components/profile/MyOrders.jsx` | profile → My Orders | none | — | — | No invoice UI |
| `app/notifications/Notification.jsx` | `/notifications` | none | — | — | No invoice UI |

No invoice action existed on `/cart`, `/checkout/failure`, or `/pricing`.

**Two surfaces were missed on the first pass and only caught by the post-implementation source
audit (§24).** The opening search piped through `head -60` and truncated before
`LiveClasses.jsx` / `LiveYoga.jsx`; the structural test written for this sprint then caught them.
They are the most literal instance of the prohibited pattern in the codebase, so the truncation is
recorded here rather than quietly corrected.

---

## 3. Backend Contract

**Invoice backend capability: `PARTIAL`** — metadata and an authenticated receipt download exist;
**there is no PDF generator.**

Verified from `routes/v1.php`, `BillingController`, `Invoice`, `InvoiceService`,
`HandleInvoiceGeneration` and `BillingAutomationEngine`.

### Routes (all inside the `auth:sanctum` group opened at `routes/v1.php:136`)

| Method | Path | Handler | Authorisation |
|---|---|---|---|
| GET | `/api/v1/billing/invoices` | `invoicesIndex` | non-admin forced to own `user_id` |
| GET | `/api/v1/billing/invoices/{invoice}` | `invoicesShow` | `authorizeInvoiceAccess` |
| GET | `/api/v1/billing/invoices/{invoice}/download` | `invoicesDownload` | `authorizeInvoiceAccess` |

`invoicesIndex` returns the standard envelope: `{success, message, data: [...], meta}` — `data` is a
flat array, not a nested paginator.

### Download response

```php
return response($html, 200, [
    'Content-Type'        => 'text/html',
    'Content-Disposition' => 'inline; filename="Invoice-' . $invoice->invoice_number . '.html"',
]);
```

An **HTML** receipt rendered from `invoices.receipt`, served **inline**, behind the bearer token.
The `Invoice` and `InvoiceService` docblocks both state "PDF generation is not yet implemented —
this is the domain foundation." The frontend therefore labels the action **"View Receipt"**; the old
`Receipt PDF` label was untrue, and no PDF endpoint was invented to make it true.

### Invoice fields available

`invoice_number`, `order_id`, `subscription_id`, `user_id`, `status`, `currency`, `subtotal`,
`discount_amount`, `tax_amount`, `tax_rate`, `total_amount`, `paid_amount`, `billing_address`,
`billing_email`, `billing_phone`, `notes`, `due_date`, `paid_at`, `sent_at`, `cancelled_at`.

### When an invoice exists

- `HandleInvoiceGeneration` listens for `PaymentVerified`, creates the invoice and immediately
  `markAsPaid()` → the happy path ends at `paid`.
- The scheduled backstop `billing:generate-invoices` →
  `BillingAutomationEngine::generatePendingInvoices` creates invoices from **completed** payments and
  **leaves them in `draft`**. A paying customer can therefore legitimately hold a `draft` invoice.
- `InvoiceStatus`: `draft`, `sent`, `paid`, `overdue`, `cancelled`, `refunded`.

That third point is why `draft` is **downloadable**. Treating it as "not ready" would deny those
customers the only receipt surface in the product. Only `cancelled` suppresses the action, because a
voided document must not be presented as proof of purchase.

### Pre-existing hardening observation (not modified)

`authorizeInvoiceAccess()` only aborts when `$authUser` is **non-null** and not the owner:

```php
if ($authUser && (int) $invoice->user_id !== (int) $authUser->id && !$authUser->isAdmin()) {
    abort(403, 'Unauthorized access to invoice.');
}
```

With no authenticated user the check is skipped entirely. Today the `auth:sanctum` route middleware
is the real gate, so this is defence-in-depth rather than a live hole. Backend changes are out of
scope for this sprint; it is recorded for a future backend pass.

---

## 4. Static Invoice Issues Found

| # | Defect | Severity | Status |
|---|---|---|---|
| **D1** | `window.open` handed a raw `${API_BASE_URL}/billing/invoices/{id}/download` URL. A new tab cannot carry an `Authorization` header, and the route is behind `auth:sanctum`, so **the only invoice download in the product 401'd for every signed-in customer.** | Critical | Fixed |
| **D2** | No status gating: the button was shown for any invoice matching `invoice.order_id === order.id`, including `cancelled` ones, and `Array.find` could surface a voided document while a valid re-issue sat beside it. | High | Fixed |
| **D3** | The component had **no stylesheet at all**. It carried a dark palette in inline styles (`color: #fff` heading, `#ddd` body, white-on-white `rgba(255,255,255,0.03)` empty state) onto the profile's **light** `#f8fafc` card, so the heading rendered invisible. Its loading state used Tailwind utilities (`p-6 text-center text-gray-400`); this project ships no Tailwind, so that was inert too. | High | Fixed |
| **D4** | Two always-visible `<button>Download Invoice</button>` elements with **no handler and no data behind them** (LiveYoga, LiveClasses). | High | Removed |
| **D5** | A failed load rendered the error alert **and** "No past purchases or orders found" — asserting there is nothing to show when in fact the data is unknown. | Medium | Fixed |

Nothing was invented: no endpoint, no PDF, no invoice number, no fake filename. `api/…` invoice
paths were searched for and none existed in the frontend before or after.

---

## 5. Dynamic Invoice Architecture

```
Order
   ↓
selectInvoiceForOrder(invoices, orderId)      ← prefers the newest DOWNLOADABLE invoice
   ↓
invoiceStateForOrder(...)                     → AVAILABLE | VOID | NOT_ISSUED
   ↓
INVOICE_DOWNLOAD_PATH(id)                     ← the ONE place a path is built
   ↓
apiClient.get(..., { responseType: 'blob' })  ← bearer token attached by the interceptor
   ↓
openInvoiceDocument(blob, filename)           ← same-origin blob: URL, no token in a query string
```

The rule is enforced in one pure module, `features/commerce/utils/invoiceAvailability.js`:

- **AVAILABLE** — a record exists and its status is not voided → `View Receipt` renders.
- **VOID** — `cancelled` → no action, "This invoice was cancelled".
- **NOT_ISSUED** — no record for the order → no action, "Receipt not issued yet".

An order existing is never sufficient on its own. An unrecognised status still offers the document
(the record exists and the verified route only checks ownership) but is labelled `Issued`, so no raw
enum reaches the customer.

---

## 6. Checkout Success Integration

`/checkout/success` does **not** contain a download button and never did — it links to the profile's
`Billing & Invoices` tab via `CONFIRMATION_ROUTES.billing`, whose comment already records that no
`/invoices` route exists in this app. That is navigation to a real surface, not a fake invoice
action, so it was left exactly as DS-07B wrote it. No invoice logic was added to the success page.

---

## 7. Multiple Order Handling

The Workshop checkout can produce a learning order, a delegated physical order, or both. This sprint
does **not** attempt per-domain invoices:

- The billing tab lists every invoice the customer owns and links each to its own order id.
- A subscription invoice (`order_id = null`) is deliberately **not** attachable to any order row —
  asserted by test.
- When one order holds several invoices, the newest **downloadable** one wins. This is a regression
  fix, not a nicety: the previous `find`-by-order-id could offer a cancelled invoice.

---

## 8. Loading / Error States

| State | Rendering |
|---|---|
| Loading | Three skeleton rows + "Loading your purchases and receipts…" (`aria-busy`) — no fake active button |
| Load failure | Error alert with a **Try again** button. The empty state is suppressed, because a failed load cannot claim there are no orders |
| Receipt failure | Separate alert; `401/403 → "You are not authorised…"`, `404 → "This invoice is no longer available."`, otherwise a generic message. Blob error bodies are read back so a JSON `message` is not swallowed |
| Server unreachable | `describeRequestError` names the cause: a request that never completed (`ERR_NETWORK`, no `response`) reads "Could not reach the server. Check your connection and try again.", which is a different problem from a rejected request and would otherwise send the customer hunting for an account fault |
| No orders | Empty state with a receipt icon |
| Signed out | "Please sign in to view your billing history and receipts." — no request is made |
| No invoice for an order | Non-actionable "Receipt not issued yet" |

No raw API error, stack trace, internal URL or token reaches the DOM.

---

## 9. Tests

New file: `src/__tests__/commerce/invoiceAvailability.test.js` — **38 tests**.

| Group | Tests | Covers |
|---|---|---|
| Availability model | 10 | every status; `cancelled` suppressed; missing id; string/number ids; draft downloadable |
| Multi-invoice selection | 5 | newest downloadable wins; valid re-issue beats newer cancelled; other-order and subscription invoices ignored |
| Presentation helpers | 7 | `₹` formatting; chip tones; no raw enum leak; envelope unwrapping |
| Load-failure copy | 4 | unreachable server named as a connection problem; 401/403 → re-sign-in; 5xx/404/timeout distinct; no raw transport message |
| Download route | 3 | single definition; id encoded (`1/../2` → `1%2F..%2F2`); never absolute |
| Component source audit | 6 | no `window.open` URL; no `API_BASE_URL`; blob via `apiClient`; no token in URL; gated on the model; no Tailwind/inline dark palette |
| Repo-wide structural audit | 3 | **no** absolute invoice path or static invoice label anywhere in `src/`; exactly one file builds the route; the learning surfaces contain no invoice reference |

```
Course migration tests:      n/a (not this sprint)
Course backend tests:        n/a (not this sprint)
Frontend Course tests:       n/a (not this sprint)
Unified cart tests:          n/a (not this sprint)
Invoice tests:               38 passed / 0 failed
Full frontend:               626 passed / 0 failed  (44 files)
  — baseline before this work: 588 passed / 43 files
Full backend:                not run (no backend change in this sprint)
```

Comments are stripped before every source assertion, so the files may document the defect they fix
without defeating the guard. The structural test caught the temporary review harness and the two
dead buttons during development — evidence it is load-bearing rather than decorative.

---

## 10. Browser Verification

`scripts/ds07cInvoiceCapture.mjs` — headless Chrome over the DevTools Protocol.
**17 renders across 4 states and 10 widths.**

| Case | Widths | Overflow | Clipped | Rows | Invoice actions |
|---|---|---|---|---|---|
| billing (all states) | 1440, 1024, 900, 800, 768, 640, 430, 390, 360, 320 | **0px at every width** | **0** | 5 | **3** |
| loading | 390 | 0px | 0 | 0 | 0 (3 skeletons) |
| error | 390 | 0px | 0 | 0 | 0 (alert + retry) |
| signed-out | 390 | 0px | 0 | 0 | 0 (sign-in prompt) |
| profile-billing (real route) | 1440, 768, 390, 320 | **0px at every width** | 0 | — | — |

Per-row outcome read from the rendered DOM:

| Order | Status | Action | Note |
|---|---|---|---|
| `#ORD-2026-00007` | Completed | **View Receipt** | Invoice INV-2026-00101 |
| `#ORD-2026-00008` | Completed | **View Receipt** | Invoice INV-2026-00102 (`draft` — backstop case) |
| `#ORD-2026-00009` | Cancelled | — | "This invoice was cancelled" |
| `#ORD-2026-00010` | Pending | — | "Receipt not issued yet" |
| `#5005` | Completed | **View Receipt** | **INV-2026-00204** (the paid re-issue, not the newer cancelled INV-2026-00205) |

The action was then **clicked**, proving the fixed mechanism end-to-end:

```
downloadRequests: [{ url: "billing/invoices/101/download",
                     auth: "Bearer review-token",       ← the token the old window.open could not send
                     responseType: "blob" }]
opened:           ["blob:http://localhost:3001/2f60ceff-9610"]   ← same-origin blob, no public URL
```

Real profile page (`/auth/profile?tab=billing`): the `Billing & Invoices` tab activates, the component
mounts, the heading computes to `rgb(26, 26, 26)` (it was white-on-white), and the error alert renders
with a sanitised message and zero overflow.

**Console:** the only errors are `net::ERR_CONNECTION_REFUSED` (Workshop backend and E-commerce
offline during review) and one Pusher websocket refusal. None originate from this code.

**Computed styles confirm the token system, not a lookalike:** table radius `12px`
(`--radius-lg`), border `1px rgb(226,232,240)` (`--color-border`), header background
`rgb(241,245,249)` (`--surface-subtle`), chip radius `50px` (`--radius-pill`), action button
`6px` / `rgb(135,68,41)` / `box-shadow: none` (`--radius-sm` / `--color-primary`).

---

## 11. Repository Boundary Verification

```
Modified:  Yogify-workshop/frontend   (only)
Untouched: yogiandyathra/             (yogify-backendnew, front-end-next-js, yogify-dashboard)
```

Git metadata is unavailable for this checkout (`fatal: not a git repository`), so the boundary was
verified by modification time instead: `find yogiandyathra -newermt "2026-09-20 15:00"` returns
**nothing**, while this sprint's work began at ~16:00. No file under `yogiandyathra` was touched.

The frontend never contacts an E-commerce endpoint for invoices: every call is a relative
`billing/*` path on the Workshop `apiClient`, and no internal service key exists in the browser
bundle for this feature.

---

## 12. Remaining Backend Gaps

1. **No PDF.** The receipt is HTML served `Content-Disposition: inline`. Customer-facing copy says
   "View Receipt" so the label matches the artefact. A true PDF download needs
   `invoicesDownload` to change its content type — backend work, not disguised here as frontend work.
2. **No order ↔ learning-content linkage reaches the client.** `useProfileLearning.jsx` (534 lines)
   exposes no `order_id`, `invoice_id`, `payment` or `purchase` field on any course, class or session.
   This is why the per-session/per-class `Download Invoice` entries could not be made dynamic and were
   removed rather than faked. Restoring them requires the backend to expose an order/invoice
   reference on those payloads.
3. **`draft` invoices from the backstop path.** `generatePendingInvoices` leaves completed-payment
   invoices in `draft` and never marks them sent. Harmless for the customer now that `draft` stays
   downloadable, but the status is misleading in admin reporting.
4. **`refunded` invoices remain downloadable** — a deliberate decision: the invoice was genuinely
   issued, and a customer who was refunded may still need the record. Documented here because it is a
   judgement call, not a mechanical rule.
5. **`Route [login] not defined` → HTTP 500 for non-JSON requests.** A request to
   `/api/v1/billing/*` **without** `Accept: application/json` returns
   `{"message":"Route [login] not defined.","errors":{"exception":"…RouteNotFoundException…"}}` with
   status **500** instead of 401: `auth:sanctum` tries the browser `login` redirect for a non-JSON
   request, and this API has no such named route. The app is unaffected (axios always sends
   `Accept: application/json, text/plain, */*` and correctly receives
   `401 {"message":"Unauthenticated."}`), but any curl/health-check/integration client that omits the
   header sees a 500. Backend-side fix, out of scope here.

---

## 12a. Runtime Note — Backend Availability During Review

Mid-review the Workshop API went down and the browser surfaced a raw `AxiosError` for
`billing/orders` (`code: ERR_NETWORK`, `baseURL http://localhost:8000/api/v1/`). That was an
**environment** fault, not a sprint defect — and the dumped error was itself evidence the invoice path
was working: the request carried `Authorization: Bearer …` against the correct base URL. The backend
was restarted and the routes verified live:

```
billing/orders    HTTP 401  {"success":false,"message":"Unauthenticated."}
billing/invoices  HTTP 401  {"success":false,"message":"Unauthenticated."}
```

Two follow-ups came out of it, both shipped: the actionable copy in §8, and a concise dev-only log
line — the previous `console.error(err)` dumped the entire request config, including the bearer
token, into the browser console.

---

## 13. Final Status

**PASS WITH FINDINGS.**

The sprint's single non-negotiable rule — *never display an invoice download action because an order
exists* — now holds everywhere, and the only invoice action in the product is verified working
against the real backend contract with the bearer token attached.

Five defects were found and fixed, two of them customer-visible: a download that 401'd for every
signed-in user, and a heading rendered invisible by a dark palette on a light card. Two dead
`Download Invoice` buttons were removed, and a failed load no longer claims there are no orders.

| Gate | Result |
|---|---|
| Tests | 622 passed / 0 failed (44 files); 34 new |
| Lint | 39 problems — identical to the pre-existing baseline; 0 added |
| Build | exit 0, 33 routes |
| Browser | 17 renders, 0 horizontal overflow, 0 clipped text at 320–1440px |
| Screenshots | 12 captured and reviewed |
| Boundary | Workshop frontend only |

---

## Appendix A — Verification Harness (deleted after review)

The temporary page mounted the real `StudentBilling` through the real `billingApi`, stubbing only the
axios transport so every invoice state was reachable without a signed-in user or a running backend.
It was deleted with the sprint (`src/app/ds07c-billing-review/`); recreate it verbatim to reproduce
the row-level cases in `scripts/ds07cInvoiceCapture.mjs`.

```jsx
"use client";
// src/app/ds07c-billing-review/page.js  — TEMPORARY, not shipped
import React, { useEffect, useState } from "react";
import { store } from "../../../store";
import { setLogin } from "@/features/auth/authSlice";
import apiClient from "@/services/apiClient";
import StudentBilling from "@/components/profile/StudentBilling";

const ORDERS = [
  { id: 5001, order_number: "ORD-2026-00007", status: "completed", total_amount: 2499, currency: "INR", orderable: { title: "200-Hour Hatha Yoga Teacher Training" } },
  { id: 5002, order_number: "ORD-2026-00008", status: "completed", total_amount: 999,  currency: "INR", orderable: { title: "Cork Yoga Mat (6mm)" } },
  { id: 5003, order_number: "ORD-2026-00009", status: "cancelled", total_amount: 1499, currency: "INR", orderable: { title: "Pranayama Intensive" } },
  { id: 5004, order_number: "ORD-2026-00010", status: "pending",   total_amount: 799,  currency: "INR", metadata: { product_type: "course" } },
  { id: 5005, status: "completed", total_amount: 4999, currency: "INR", orderable: { title: "Combined bundle: 300-Hour Advanced Teacher Training plus a physical props kit with a long product name that must wrap cleanly" } },
];

const INVOICES = [
  { id: 101, invoice_number: "INV-2026-00101", order_id: 5001, status: "paid",      total_amount: 2499 },
  { id: 102, invoice_number: "INV-2026-00102", order_id: 5002, status: "draft",     total_amount: 999  },
  { id: 103, invoice_number: "INV-2026-00103", order_id: 5003, status: "cancelled", total_amount: 1499 },
  { id: 205, invoice_number: "INV-2026-00205", order_id: 5005, status: "cancelled", total_amount: 4999 },
  { id: 204, invoice_number: "INV-2026-00204", order_id: 5005, status: "paid",      total_amount: 4999 },
  { id: 300, invoice_number: "INV-2026-00300", order_id: null, subscription_id: 9, status: "paid" },
];

export default function Ds07cBillingReview() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode") || "ok";
    window.__ds07c = { requests: [], opened: [], mode };

    if (params.get("signedOut") === "1") {
      store.dispatch({ type: "auth/logout" });
      setReady(true);
      return;
    }

    store.dispatch({
      type: setLogin.type,
      payload: { user: { id: 42, name: "Review Student" }, token: "review-token" },
    });

    window.open = (url) => { window.__ds07c.opened.push(String(url).slice(0, 40)); return {}; };

    apiClient.defaults.adapter = async (config) => {
      const url = String(config.url || "");
      window.__ds07c.requests.push({
        url,
        auth: config.headers?.Authorization || null,
        responseType: config.responseType || null,
      });

      const reply = (data, status = 200) => ({
        data, status, statusText: status === 200 ? "OK" : "Error",
        headers: {}, config, request: {},
      });

      if (mode === "loading") return new Promise(() => {});
      // A custom adapter must reject on its own: axios's validateStatus lives in
      // `settle`, which only the built-in adapters call.
      if (mode === "error") {
        const error = new Error("Request failed with status code 500");
        error.response = reply({ message: "Internal server error" }, 500);
        error.isAxiosError = true;
        throw error;
      }

      if (url.includes("/download")) {
        return reply(new Blob(["<html><body>Receipt</body></html>"], { type: "text/html" }));
      }
      if (url.includes("billing/orders") || url.includes("billing/invoices")) {
        return reply({ success: true, data: url.includes("orders") ? ORDERS : INVOICES, meta: {} });
      }
      return reply({ success: true, data: [], meta: {} });
    };

    setReady(true);
  }, []);

  return (
    <div id="Profile" style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="ContentCard">{ready ? <StudentBilling /> : null}</div>
      </div>
    </div>
  );
}
```

### Files changed

**Added**

- `src/features/commerce/utils/invoiceAvailability.js` — availability model
- `src/features/commerce/services/billingApi.js` — authenticated invoice API + blob download
- `src/assets/css/student-billing.scss` — the tab's first stylesheet
- `src/__tests__/commerce/invoiceAvailability.test.js` — 34 tests
- `scripts/ds07cInvoiceCapture.mjs` — dev capture harness
- `docs/screenshots/ds07c/` — 12 PNGs + `measure.json`

**Modified**

- `src/components/profile/StudentBilling.jsx` — rebuilt
- `src/components/profile/LiveYoga.jsx` — dead invoice button removed
- `src/components/profile/LiveClasses.jsx` — dead invoice button removed

**Not modified:** Workshop backend, admin panel, E-commerce, checkout/payment/cart logic, CS-07B
success page.
