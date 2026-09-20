# WORKSHOP-DS-07A — Checkout Visual Redesign + Multi-Step Navigation

Repository: `Yogify-workshop/frontend` · Branch `main` · base commit `6afb2cc`
Nothing in this sprint was committed.

---

## 1. Executive Summary

Checkout has been normalised onto the Workshop design tokens and now reads as the
next page of the same product as Course Detail and the Cart. The step indicator is
no longer decorative: completed and reachable steps are real buttons, and step 3
cannot be entered until the Razorpay order that `handleProceedToPayment` creates
actually exists — so the stepper can never offer a route the flow itself would
refuse. At ≤768px the horizontal `1 —— 2 —— 3` row is replaced by a purpose-built
compact control.

Three defects were found and fixed beyond the brief:

1. **`.CheckoutEmptyState` was completely unstyled** — its only rules are nested
   under `#Checkout`, but the component returned it as the *root* element, so
   background, border, radius and padding never applied.
2. **The 769–1024px band was broken.** Measured at 800px, a two-column form gave
   each input **145px** — narrower than the 254px it gets at 320px — and three
   elements overflowed their own boxes (`input.FormInput` by 27px,
   `.CourierOptionLabel` by 5px, `.FormActions` by 16px). Pre-existing; the wider
   content track made it slightly worse, and it is now fixed at the documented
   1024 breakpoint.
3. **The coupon form overflowed at 320px** by 3px, because `<input>` carries an
   intrinsic minimum width that stops it shrinking inside a flex row.

Verification: **588/588 tests**, **production build exit 0** (33 routes, dynamic
content routes intact), **ESLint unchanged at 39 problems**, **40 browser renders
with zero horizontal overflow and zero console errors**, and **36 screenshots
captured and reviewed**.

---

## 2. Existing Checkout Audit

```
Checkout.jsx (642 lines)
├── Stepper        three inert <div className="StepItem"> — no handler at all
├── Step 1         Order Review            → changeStep(2)
├── Step 2         Student Details / Shipping & Billing → handleProceedToPayment
├── Step 3         Payment Gateway          → executeRazorpay(activeOrder, user)
├── Order Summary  .SummaryCard, sticky column
│   ├── Coupon     validateAndApplyCoupon / removeCoupon
│   ├── Courier    COURIER_PARTNERS.map + computeCourierFee(physicalSubtotal, …)
│   └── Totals     finalPayable = subtotal − coupon + courierFee
└── Empty state    .CheckoutEmptyState (rendered OUTSIDE #Checkout)
```

* **Step state** lives in `checkoutSlice` (`activeStep`, persisted via
  redux-persist key `root`). `createOrderSuccess` sets `activeStep = 3`, which is
  the real gate on step 3.
* **Step 2 entry** is `onClick={() => changeStep(2)}` — no validation.
* **Step 3 entry** is only via `handleProceedToPayment`, which validates the
  delivery details, delegates the physical order, then creates the order. It is
  the flow's own prerequisite check.
* **Stylesheet ownership** was already unambiguous after DS-01/02 (source `.scss`
  only). `checkout.scss` is imported by `Checkout.jsx`, `success/page.js` and
  `failure/page.js`.

---

## 3. Course Detail Comparison

Measured at 1440px, the reference page DS-03 designated as the canonical content
surface:

| Surface | Course Detail `.HighlightBox` (measured) |
|---|---|
| background | `#ffffff` |
| border-radius | **12px** |
| border | **1px `#e2e8f0`** |
| box-shadow | **none** (the rule is commented out in `style.scss`) |
| padding | 35px |
| margin-bottom | 30px |

Its primary CTAs are flat too: `.viewBtn` and `.PrimaryBtn` both compute
`box-shadow: none`; `.viewBtn` radius 5px, `.PrimaryBtn` pill.

**Consequence adopted:** content cards are 12px with a 1px neutral border, and the
primary CTA is flat.

---

## 4. Cart Comparison

Measured at 1440px:

| Surface | Cart (measured) |
|---|---|
| page background | **`#f8fafc`** |
| `.CartSummary` | bg `#fff`, radius **12px**, 1px border, `--shadow-sm` (`0 1px 2px rgba(16,24,40,.04)`), padding 22px |
| `.CartItem` | bg warm cream, radius 12px, 1px border, `--shadow-sm` |
| `.CartSummary .checkoutBtn` | bg `#874429`, radius 10px, **`box-shadow: none`** |
| `.CartSectionHeader` | 2px `#f1f3f5` bottom border |

**Consequence adopted:** the Order Summary is the Cart summary's surface — 12px,
1px `--color-border`, `--shadow-sm` — and the checkout CTA is flat like the button
that leads into the page.

Other page backgrounds, for completeness: Home `#fff`, Course listing `#fff`,
Course Detail `#fcfcfc`, Cart `#f8fafc`, Checkout `#fff` (**was the only
`#fff`-walled page in the commerce flow, which is what made its warm brown borders
do all the separating work**).

---

## 5. Design Decisions

1. **Page surface → `--surface-muted` (`#f8fafc`), the Cart's own value.** Not a
   new background: it is an existing token and the exact colour of the page the
   customer arrives from. Home and Course listing staying `#fff` is out of scope.
2. **Content track → the shared container.** The bespoke 1100px grid is gone. The
   page's horizontal padding is the container's own gutter tokens, so
   `calc(100% − 2·gutter)` is arithmetically the `.container` rule. Verified: the
   stepper and grid measure **1340px at 1440px**, and the form column **920px —
   the exact width of the Course Detail `.HighlightBox`**. No second container
   system was created.
3. **One narrow mode at 1024px**, applied to the field grid, the courier grid, the
   action row and the order-review card together. Chosen from the measurement in
   §1, not from a guess.
4. **Flat primary CTA.** Every measured primary CTA in the Workshop is flat; the
   brand glow was the heaviest single shadow on the page.
5. **`--radius-sm` for controls, `--radius-lg` for surfaces, `--radius-md` for
   CTAs** — the roles the token layer already documents.

---

## 6. Container Changes

* **Removed** `max-width: 1100px` from both `.CheckoutStepper` and
  `.CheckoutContainer`.
* **Replaced** `#Checkout { padding: 50px 20px 60px }` with the container gutter
  scale: `--container-gutter` (100px) → `--container-gutter-lg` (50px) at ≤1800 →
  `--container-gutter-md` (30px) at ≤1024 → `--container-gutter-sm` (16px) at ≤480.
* Measured: stepper `1100px → 1340px`, section column `680px → 920px`,
  container `1100px → 1340px` at 1440px.

## 7. Card Changes

| Property | Before | After |
|---|---|---|
| `.CheckoutSection` radius | 16px | **12px** (`--radius-lg`) |
| `.CheckoutSection` border | 1px `#f0e6e0` | **1px `--color-border`** `#e2e8f0` |
| `.CheckoutSection` shadow | `0 4px 20px rgba(0,0,0,.03)` | **`--shadow-sm`** |
| `.SummaryCard` radius / border / shadow / padding | 16px / `#f0e6e0` / same / 28px | **12px / `--color-border` / `--shadow-sm` / 24px** |
| `.CheckoutStepper` radius / border / shadow / padding | 16px / `#f0e6e0` / `0 4px 15px rgba(135,68,41,.04)` / 20px 32px | **12px / `--color-border` / `--shadow-sm` / 16px 32px** |
| `.CourseReviewCard` radius | 12px | 8px (`--radius-md`) |
| `.CourierOption`, `.PaymentOptionCard` radius | 12px, **14px** | **8px** (`--radius-md`) |
| `.CheckoutEmptyState` | unstyled (see §1) | 12px, 1px border, `--shadow-sm`, `--space-11 --space-6` |

## 8. Border Changes

* `1.5px` control borders **retired** — it existed only in checkout, as
  `tokens.scss` already records. All → `--border-width` (1px).
* `#f0e6e0` (the warm brown card border) → `--color-border`. This was the single
  biggest cause of the "separate design system" impression: it was the only warm
  border on any commerce surface.
* `.Divider` `#f0e6e0` → `--color-border-muted`; `.FormActions` border-top → `--color-border-muted`.
* Border *colours* now used in the file: `--color-border`, `--color-border-muted`,
  `--color-border-strong`, `--color-border-accent`, `--color-success-border`,
  `--color-error-border`. No literal border colour remains.

## 9. Shadow Changes

* Four one-off shadows → **`--shadow-sm`** (cards), **`--shadow-none`** (CTA),
  **`--shadow-accent`** retained only on the 32px current-step circle.
* `.ProceedBtn` / `.PayButton`: `0 4px 14px rgba(135,68,41,.25)` → **`none`**.
* `.PaymentOptionCard.selected`: a 12px blur drop shadow → a **2px accent ring**
  (`0 0 0 var(--focus-ring-width) rgba(var(--color-primary-rgb), .08)`), so
  selection reads as a state rather than elevation.
* `.CartItem`-style `--shadow-sm` on cards is deliberate: it is the Cart's own card
  value, so the Order Summary continues that surface.

## 10. Radius Changes

| Before | After | Role |
|---|---|---|
| 16px | `--radius-lg` 12px | section, summary, stepper cards |
| 14px | `--radius-md` 8px | payment option card |
| 12px | `--radius-md` 8px | courier option, review card, CTA, error box |
| 10px | `--radius-sm` 6px | inputs, back button, coupon field |
| 12px (ProceedBtn) | `--radius-md` 8px | primary CTA |
| 5px / 20px / 50px | *untouched* | not in this file |

Remaining radius literals: `--radius-circle` (50%) for the step circle and
`50%`-free otherwise. No non-token radius is written in the file.

## 11. Typography Changes

| Element | Before | After |
|---|---|---|
| `.SectionTitle` | 22px/700 `#1c1d1f` | **24px/700 `--color-heading`**, responsive 20px @1024, 18px @768 — the reference page's measured card-heading scale |
| `.SummaryTitle` | 20px `#1c1d1f` | `--text-h3` / `--color-heading` |
| `.FormInput` | 14px | `--text-body` 15px |
| `.FormLabel` | 12px `#374151` | `--text-micro` / `--color-text-muted` |
| `.CurrentPrice` | 18px | `--text-card-title-sm` (same value, now tokenised) |
| `.SummaryRow` | 14px | `--text-body-sm` |
| `.TotalRow` value | 22px/800 | `--text-h3` 20px / `--weight-bold` (800 is not on the scale) |
| `.CourierNote` | 12.5px | `--text-caption` (12.5px is retired by the type scale) |
| `.Category` | 11px | `--text-micro` 12px |
| `.DiscountValueText` | `font-family: monospace` | `inherit` (a monospace figure was the only one in the file) |

## 12. Order Summary Changes

Same surface as the Cart summary (12px / 1px `--color-border` / `--shadow-sm`),
padding 28px → `--space-7` 24px, title at `--text-h3`, rows at `--text-body-sm`,
dividers at `--color-border-muted`. **The coupon field gained `min-width: 0`**,
which is what stopped the 3px overflow at 320px — an `<input>` has an intrinsic
minimum width from its `size` attribute and will not shrink in a flex row without
it. All calculations, the coupon call and the courier-fee line are byte-identical.

## 13. Courier Selector Changes

Presentation only. Radius 12px → 8px, border 1.5px → 1px `--color-border`, padding
`14px 16px` → `--space-4 --space-5`, gap 10px → `--space-3`, selected state →
accent border + `--surface-accent-subtle` + the native radio. The 2-column grid now
collapses at 1024 rather than 640, because at 800px the pair had only 150px in
total and the label clipped by 5px. `COURIER_PARTNERS`, `computeCourierFee`,
`changeCourierPartner` and the free-shipping threshold are untouched.

## 14. Payment Gateway Changes

* Base state: 2px `#e2e8f0` border → **1px `--color-border`**; radius 14px → 8px.
* Selected: accent border + `--surface-accent-subtle` + accent ring + the native
  radio — **three signals, so selection never depends on colour alone**.
* Hover: `#fafafa` fill dropped, `--color-border-strong` border instead.
* The Pay CTA stays the shared `.ProceedBtn` — flat brand brown, `--radius-md`,
  label still derived from `activeOrder.order.amount` with `finalPayable` as the
  fallback. No checkout-specific button class was introduced.

## 15. Stepper UX Changes

* Steps are `<button>`s driven by the step model; state classes are `current`,
  `completed`, `reachable`, `locked`.
* Completed steps show a **check icon** instead of a number; the current step keeps
  the brand-filled circle; locked steps are muted and `disabled`.
* `aria-current="step"` on the current step, and every step carries an
  `aria-label` that names it and says whether it is reachable or locked.
* Connector lines are 1px (`--border-width`) `--color-border`, accent when passed —
  down from 2px, so they no longer dominate.
* Stepper padding 20px 32px → 16px 32px and margin-bottom 36px → 24px.

## 16. Stepper Navigation Rules

Derived from the flow that already exists (see `checkoutSteps.js`):

| Step | State | Clickable | Rule |
|---|---|---|---|
| 1 — Order Review | current / completed | **yes** when completed | The origin; nothing to satisfy |
| 2 — Shipping & Details | reachable / completed | **yes** | Entered from step 1 by the Next button, which has never validated anything |
| 3 — Payment Gateway | locked → reachable | **only when `activeOrder` exists** | Reached only through `handleProceedToPayment` |
| current step | current | **no** (`disabled`) | Clicking it would be a no-op and could reset state |
| locked step | locked | **no** (`disabled`) | — |

**One deliberate deviation from the brief's generic table, and why.** The brief
says a future step with missing prerequisites is locked. Step 2 is exempt, because
the existing flow's own Next button (`onClick={() => changeStep(2)}`) has always
reached step 2 with no validation. Locking it would have *removed* working
behaviour rather than added a guard, and `isCheckoutStepReachable` says so
explicitly. Step 3 is the step with a real prerequisite, and it is the one that
closes the Order-Review → Payment bypass.

## 17. Mobile Stepper Design

Not a shrunk copy of the row above. At ≤768px `.CheckoutStepper` is
`display: none` and `.StepperMobile` takes over:

```
STEP 2 OF 3
Shipping & Details
[ ✓ ] [ 2 ] [ 🔒 ]
```

Measured: card 288×130 at 320px; **each segment 78×40 at 320px, 218×40 at 768px** —
comfortably above the 36px touch minimum. The current step is named in the header
because three labels cannot coexist at 320px; the numbers remain tappable and each
carries an `aria-label` naming its step, so stepping back never depends on the Back
button. Segments `flex: 1 1 0` with `min-width: 0`, so the row cannot overflow.

## 18. Responsive Layout

Two-column page above 768px; stacked below. The *form* is single-column at ≤1024px,
which is where the measurement said it had to be. Sweep at 10 widths (step 2):

| width | page overflow | section | input | courier | stepper row | stepper mobile | clipped |
|---|---|---|---|---|---|---|---|
| 1440 | 0px | 920 | 417 | 421 | flex | none | 1 (nav icon, pre-existing) |
| 1024 | 0px | 600 | 534 | 534 | flex | none | 0 |
| 900 | 0px | 476 | 410 | 410 | flex | none | 0 |
| 800 | 0px | 376 | **310** (was 145) | 310 | flex | none | **0** (was 3) |
| 768 | 0px | 708 | 642 | 642 | none | block | 0 |
| 640 | 0px | 580 | 514 | 514 | none | block | 0 |
| 430 | 0px | 398 | 364 | 364 | none | block | 0 |
| 390 | 0px | 358 | 324 | 324 | none | block | 0 |
| 360 | 0px | 328 | 294 | 294 | none | block | 0 |
| 320 | 0px | 288 | 254 | 254 | none | block | 0 |

Sticky summary: `position: sticky; top: 100px` on the column ≥769px, `static` +
`width: 100%` at ≤768px — unchanged, and still asserted by `checkoutCourier.test.js`.

## 19. Business Logic Preservation

**Not modified:** `checkoutSlice.js`, `useCheckout.js`, `usePayment.js`,
`courierPartners.js`, `CommerceAdapter`, any API/service, the Razorpay flow,
`initiateUnifiedOrder`, `delegateOrder`, coupon validation, totals, pricing,
inventory, auth. Only `Checkout.jsx`'s step rendering changed; every handler is
byte-identical, and tests assert `executeRazorpay(activeOrder, user)`,
`await delegateOrder(activeShipping)` and
`await initiateUnifiedOrder(delegated?.order || null)` are still present.

Two cosmetic JSX changes: the redundant inline colours on the "E-commerce Account
Provisioned" box were removed (they duplicated `.OrderAlertBox`'s own success
tokens), and both empty-state returns are now wrapped in `#Checkout` so their
stylesheet applies.

## 20. Tests

```
new checkout step suite:        27 passed / 0 failed
existing checkout suites:       44 passed / 0 failed
  (checkoutCourier 21, paymentStateLifecycle 8,
   checkoutPostPurchaseRedirect 8, dualPaymentOrchestration 7)
full frontend:                 588 passed / 0 failed   (43 files)
```

Baseline before this sprint was 561; the delta is exactly the 27 new tests. The 27
cover the required matrix: current/completed/reachable/locked states, step 3 locked
without the order and reachable with it, step 2's documented exemption, no
clickable current step, no clickable locked step, `changeStep` wiring, aria-current
and locked labelling, the compact stepper's breakpoint, tappable segments, the
touch target, non-overflow, state styling, plus courier/coupon/total/payment
preservation and the no-direct-E-commerce boundary.

## 21. Browser Verification

Headless Chrome over CDP, real seeded cart (learning + physical item), 10 widths ×
4 cases = **40 renders**:

```
token-missing renders:          0
horizontal-overflow renders:    0
console errors:                 0
clipped-element renders:        4  (all a.CartIcon+8 — pre-existing global nav)
```

Tokens resolved in every render: `--color-primary #874429`, `--color-border
#e2e8f0`, `--radius-md 8px`, `--radius-lg 12px`, `--shadow-md`,
`--surface-page #fff`. The shipped bundle was also inspected directly: the emitted
CSS contains `.CheckoutStepper{border-radius:var(--radius-lg);border:var(--border-width)
solid var(--color-border);box-shadow:var(--shadow-sm)}` and
`.StepSeg{…min-width:0;min-height:40px;flex:1 1 0}` — the tokens ship, they are not
just in source.

## 22. Screenshot Review

**36 PNGs captured** to `docs/screenshots/ds07a/{before,after}/` (7.5 MB, 20 after / 16 before):
`cart`, `checkout-step1`, `checkout-step2`, `checkout-step3` at 1440 / 1024 / 768 /
390 / 320, at full page height.

Reviewed at full resolution by serving the captures through the dev server and
panning/zooming the live preview. What the pixels showed, which the computed values
could not:

* **Before:** a 1100px island of 16px-radius cards with warm brown outlines, a
  2px-line stepper with a brown-bordered box, 10px pill-ish inputs and a glowing
  CTA — visibly a different product from the Cart.
* **After:** grey page, white 12px cards with neutral 1px borders and barely-there
  shadows, tighter 6px inputs, flat CTA. It reads as the Cart's next page.
* **After (320px):** the compact stepper fits with room to spare; segments are
  distinct (green check / brown 2 / grey lock); nothing is clipped or shrunk.
* **After (step 3):** both connectors accent, both earlier steps check-marked,
  current step brand-filled; the payment card's selection is clear without being
  heavy.
* **After (1440 overview):** one layout observation below.

## 23. Before/After Findings

Representative at 1440px, step 2 (`null` = unchanged):

| Surface | Property | Before | After |
|---|---|---|---|
| `#Checkout` | backgroundColor | `#ffffff` | `#f8fafc` |
| `#Checkout` | padding | `50px 20px 60px` | `40px 50px 60px` |
| `.CheckoutStepper` | width / maxWidth | `1100px` / `1100px` | `1340px` / `none` |
| `.CheckoutStepper` | borderRadius | `16px` | `12px` |
| `.CheckoutStepper` | borderTopColor | `#f0e6e0` | `#e2e8f0` |
| `.CheckoutStepper` | boxShadow | `rgba(135,68,41,.04) 0 4px 15px` | `rgba(16,24,40,.04) 0 1px 2px` |
| `.CheckoutSection` | width | `680px` | `920px` |
| `.CheckoutSection` | borderRadius / border / shadow | `16px` / `#f0e6e0` / `0 4px 20px rgba(0,0,0,.03)` | `12px` / `#e2e8f0` / `--shadow-sm` |
| `.SectionTitle` | fontSize | `22px` | `24px` |
| `.FormInput` | borderRadius / fontSize | `10px` / `14px` | `6px` / `15px` |
| `.CourierOption` | borderRadius | `12px` | `8px` |
| `.PaymentOptionCard` | borderRadius / bg | `14px` / `#fdf6f0` | `8px` / `#fffcfb` |
| `.PaymentOptionCard.selected` | boxShadow | `0 4px 12px rgba(135,68,41,.08)` | `0 0 0 2px rgba(135,68,41,.08)` |
| `.ProceedBtn`, `.PayButton` | borderRadius / boxShadow | `12px` / `0 4px 14px rgba(135,68,41,.25)` | `8px` / `none` |
| `.BackBtn` | borderRadius | `10px` | `6px` |
| `.SummaryCard` | borderRadius / border / shadow / padding | `16px` / `#f0e6e0` / `0 4px 20px rgba(0,0,0,.03)` / `28px` | `12px` / `#e2e8f0` / `--shadow-sm` / `24px` |
| `.SummaryCard .Divider` | borderTopColor | `#f0e6e0` | `#f1f5f9` |
| **Cart, all widths** | **everything** | — | **unchanged** |

## 24. Remaining Issues

1. **`/checkout/success` and `/checkout/failure` render completely unstyled.** Every
   class on them is a Tailwind utility (`bg-red-50`, `rounded-lg`, `shadow-xl`,
   `text-3xl`, `bg-primary-700`, …) and **this project has no Tailwind** — verified:
   no dependency, no config, and none of those selectors appear in the emitted CSS.
   They import `checkout.scss` but reference none of its classes, so that import is
   dead. Pre-existing, untouched, and the highest-value next task. Out of scope here
   because those are different pages (a confirmation surface) needing their own
   design decisions, not a token substitution.
2. **`a.CartIcon` overflows its own link by 8px** in the global nav, at every
   desktop width, on the Cart as well — pre-existing and outside checkout.
3. **The stepper's connector lines lengthen with the wider track** (~370px each at
   1440px). They are 1px and muted now, so they are lighter than the 2px lines they
   replaced, but capping `.StepLine` is a one-line change if the stretched look is
   unwanted.
4. **The blue "E-commerce Physical Order" alert still uses inline hex**
   (`#3b82f6` / `#eff6ff` / `#1d4ed8` / `#1e40af`). There is no info/status token
   family; inventing one is a DS-02 token decision, not a checkout decision. The
   green box's inline styles were removed because they duplicated `.OrderAlertBox`.
5. **The Cart's `.checkoutBtn` is an un-tokenised 10px radius** while the checkout
   CTA is now `--radius-md` 8px. Both are flat and brand-brown; the 2px difference
   is a Cart leftover for DS-07B, not a reason to change Checkout.
6. **Step 3's gate is `activeOrder`, mirroring the existing flow exactly.** Once an
   order exists a customer can return to step 3 without re-running Proceed, so
   editing the address on step 2 and jumping forward would pay the existing order;
   pressing Proceed re-creates it. No new validation rule was invented to close
   this, per the brief.
7. **Visual verification ceiling: 1440px.** The container's 1800px breakpoint was
   exercised only through tokens, not rendered.

## 25. Final Status

**PASS WITH FINDINGS.**

All 36 Definition-of-Done items are met: tokens used throughout; no isolated visual
system; aligned with Course Detail and Cart; oversized borders, the 1.5px control
border and checkout-only radius/shadow drift gone; the Order Summary belongs to the
Cart family; payment selection, the CTA and the courier selector follow the shared
systems; previous steps clickable, future steps gated; the mobile stepper redesigned
and working at 320px; no horizontal overflow; no business-logic change; 588/588
tests; build exit 0; screenshots captured and reviewed; this report.

The findings are the four pre-existing defects in §1 (all fixed, all now covered by
tests or measurement) plus the deferred items in §24 — of which the unstyled
post-payment pages are the one a customer would actually notice.

---

## Files changed

| File | Change |
|---|---|
| `src/app/checkout/Checkout.jsx` | +105 lines: step model wiring, desktop + compact steppers, empty-state wrapper, redundant inline styles removed |
| `src/assets/css/checkout.scss` | 779 → 1014 lines (631 insertions / 337 deletions): full normalisation onto tokens |
| `src/features/commerce/utils/checkoutSteps.js` | **new** (84 lines): pure step model |
| `src/__tests__/commerce/checkoutStepper.test.js` | **new** (235 lines, 27 tests) |
| `scripts/dsCheckoutCapture.mjs` | **new** (450 lines, dev-only): seeded-cart render + screenshot harness |
| `docs/screenshots/ds07a/**` | **new**: 36 PNGs + 4 measurement JSONs |
| `docs/WORKSHOP_DS_07A_CHECKOUT_REDESIGN_REPORT.md` | **new**: this report |

Non-token literals remaining in `checkout.scss`: media-query breakpoints, the
600px empty-state measure, the 32px step circle, the 40px touch target, and
icon/control glyph sizes (16px). No colour, spacing, radius, border-width or
shadow literal remains.
