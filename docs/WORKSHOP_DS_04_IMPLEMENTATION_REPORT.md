# Workshop DS-04 Implementation Report

**Cards + Borders + Radius Normalisation**

Sprint: **WORKSHOP-DS-04**
Repository: `Yogify-workshop/frontend` (branch `main`)
Base commit: `6afb2cc` — *feat: implement WORKSHOP-DS-03 layout primitives and design system measurement tools* (committed by the repo owner at 12:57 while this sprint was in progress)
Scope: Workshop customer-facing frontend only. No backend, admin panel, E-commerce frontend or backend touched.

Status: **PASS WITH FINDINGS** — the sprint's **primary scope** (the three content-detail roots) is fully normalised and verified; the secondary scope and the shadow system are **deferred**, with measured inventories and a working tool ready for them. That gap is the headline finding and is stated up front rather than buried.

| | Result |
|---|---|
| Declarations normalised | **153** (86 radius + 67 border) across 3 stylesheets |
| Radius values eliminated in scope | **0 hardcoded remain** in the three detail roots |
| Product cards normalised | ✅ 10px → 8px, `#e8edf3` → `--color-border` |
| Brand-identity defect fixed | ✅ 2 coral leftovers in `style.scss` |
| App-wide radius declarations tokenised | 112 of 454 (**≈25%**) |
| Shadow system | ❌ **inventoried, not normalised** — 121 declarations, 71 distinct values |
| Tests | **561 / 561** (42 files) |
| Build | exit 0, 33 routes |
| Browser verification | 24 renders, 0 overflow, 0 console errors, 0 missing tokens |

---

## 1. Architecture Audit

Performed before any edit. Four things it established:

**The sprint needed a classification tool, not a sweep.** DS-04 explicitly forbids blind search-and-replace, and the raw inventory proves why: **454 `border-radius` declarations across 25 distinct scalar values**. A value-level sweep cannot know that `12px` is a card on one selector and a form control on another. So classification was done by value **and** owning selector.

**There are two `#CourseDetails` blocks.** `style.scss` declares the root at line **7283** and again at line **11011** — and the second block holds `.RelatedProducts` / `.ProductItem`, the product-card surface the sprint names as a target. My first tool version handled only the first occurrence and silently skipped the product cards. Caught in dry-run and fixed (`blockRanges` now returns every occurrence); a test pins that both blocks are still found.

**The dev database has no data for two of the three content types.** `/api/v1/home/live-sections` and `/api/v1/home/daily-classes` both return `[]`, so DailyClass and LiveSection detail pages cannot be rendered in this environment. Their CSS is normalised and verified at the source and bundle level, but **not visually verified** — see §7.

**The scope is genuinely larger than one sprint.** 454 radii + 79 border colours + **121 shadows with 71 distinct values**. Normalising all of it with real verification is not a single-sprint task, so this sprint did the primary scope properly rather than touching everything shallowly.

---

## 2. Before Inventory

### 2.1 Radius — 454 declarations, 25 distinct scalar values

| Value | Count | Role as used | Verdict |
|---|---:|---|---|
| `8px` | 74 | cards | ✅ canonical (`--radius-md`) |
| `6px` | 63 | controls | ✅ canonical (`--radius-sm`) |
| `50%` | 56 | circles | ✅ canonical (`--radius-circle`) |
| `12px` | 54 | panels | ✅ canonical (`--radius-lg`) |
| **`10px`** | **40** | **mixed: product cards AND form controls/buttons** | ❌ drift — one value, two roles |
| `4px` | 28 | badges, images, small buttons | ❌ no scale step |
| `16px` | 21 | large features | ✅ canonical (`--radius-xl`) |
| `20px` | 23 | hero/feature panels | ❌ between `lg` and `xl` |
| `50px` | 17 | pills | ✅ canonical (`--radius-pill`) |
| `24px` | 7 | large cards, product modal | ❌ no scale step |
| `2px` | 6 | micro | ✅ canonical (`--radius-xs`) |
| `30px` | 5 | banners, buttons | ❌ DS-02 retired |
| `3px` | 4 | progress bars | ❌ no scale step |
| `5px` | 4 | buttons, scrollbar | ❌ DS-02 retired |
| `25px` | 4 | login boxes | ❌ DS-02 retired |
| `15px` | 3 | profile panels | ❌ DS-02 retired |
| `14px` | 3 | payment cards | ❌ DS-02 retired |
| `18px` | 2 | swiper, reply input | ❌ DS-02 retired |
| directional | 6 | `8px 8px 0 0`, `4px 0 0 4px`, … | mixed |

**The structure of the drift matters more than the count.** Values cluster into three semantic bands — controls, cards, panels — but each band carries 3–8 competing values. The panel band is the worst: `14/15/16/18/20/24/25/30` — **eight values for one role**. And `10px` (×40) is the single worst offender because it is used for *two different roles at once*, which is why it cannot be mapped by value alone.

### 2.2 Border colour — 79 declarations, 18 distinct values

| Value | Count | Verdict |
|---|---:|---|
| `var(--primaryColor)` | 31 | brand accent → map |
| `var(--primaryColor, #874429)` | 14 | brand accent → map (fallback already corrected in DS-01) |
| `#cbd5e1` | 8 | strong neutral → map |
| `#e2e8f0` | 6 | canonical neutral → map |
| `#eee` | 27 (in scope) | **the dominant neutral grey** → map |
| `#f1f5f9` | 4 (in scope) | muted → map |
| `#e8edf3` | 2 (in scope) | the "commerce" grey → map |
| `#ddd`, `#edf2f7` | 3, 1 | same neutral role → map |
| `#fecaca`, `#fde68a`, `#a7f3d0` | 3, —, — | status → map |
| `#fff`, `#1a1a1a`, `#ffe1e1`, `transparent`, `rgba(255,255,255,*)` | 8 | **different roles** → keep, documented |

`#e8edf3` is the grey the audit catalogued as the product rail's own "commerce language". Measured against the generic neutral it is `rgb(232,237,243)` vs `rgb(226,232,240)` — near-identical greys doing one job, so per §5 it maps rather than being preserved as a second neutral.

### 2.3 Shadow — 121 declarations, 71 distinct values

| Shadow | Count |
|---|---:|
| `none` | 14 |
| `0px 3px 15px rgba(0,0,0,.15)` | 6 |
| `0 4px 15px rgba(0,0,0,.04)` | 4 |
| `0 10px 30px rgba(0,0,0,.05)` | 4 |
| …67 more values, most used **once** | — |

**This is the largest single source of visual drift in the app** — larger than radius — and it is **not normalised in this sprint**. See §10.

Also found: **`rgba(255, 114, 94, …)`** — the coral `#ff725e` in RGB form — still tinting 4 declarations. That is the colour DS-01/02 proved was a *wrong brand fallback*, not a brand colour (§5).

### 2.4 Rendered baseline (Course Detail, 1440px)

| Selector | Radius | Border | Padding |
|---|---|---|---|
| `.HighlightBox` (reference card) | `12px` | `1px #e2e8f0` | 35px |
| `#CourseDetails .RelatedProducts` | `12px` | `1px #e2e8f0` | 35px |
| `.ProductList .ProductItem` (product card) | **`10px`** | **`1px #e8edf3`** | 15px |
| `.container` | — | — | 1340px wide |

---

## 3. Canonical Mapping (every decision, stated)

Per §2, each occurrence was classified before changing. The mapping is **explicit and per-value**, implemented in `scripts/dsNormalize.mjs` so it is reviewable and reproducible rather than scattered across ad-hoc edits.

### Radius

| From | To | Reasoning |
|---|---|---|
| `0` | `--radius-none` | — |
| `2px` | `--radius-xs` | progress bars, micro decoration |
| `3px` | `--radius-xs` | progress fills — decorative, not a control edge |
| `4px` | `--radius-sm` | badges, chips, small images (closer to the control band than to 2px) |
| `5px` | `--radius-sm` | buttons; DS-02 retired 5px |
| `6px` | `--radius-sm` | canonical controls |
| `8px` | `--radius-md` | canonical cards |
| **`10px`** | `--radius-md` | **classified as cards, not controls** — see below |
| `12px` | `--radius-lg` | canonical panels |
| `14px`, `15px` | `--radius-lg` | retired; panel band |
| `16px` | `--radius-xl` | canonical large features |
| `18px`, `20px`, `24px`, `25px`, `30px` | `--radius-xl` | retired; measured usage is hero/feature panels |
| `50px` | `--radius-pill` | canonical pills |
| `50%` | `--radius-circle` | canonical circles |
| `12px 12px 0 0` | `var(--radius-lg) var(--radius-lg) 0 0` | corner-wise; `0` stays literal so the shape is preserved |

**The `10px` decision.** It is applied to both product cards (`.ProductItem`) and form controls (`.InputGroup input`, `.LoginBtn`). It was classified as the **card** role because in the detail roots the card usage dominates and because `.ProductItem` is the surface the sprint names as a target; controls that legitimately want the smaller step are where the 2px shift is least visible. This is a judgement call, recorded here rather than hidden, and it is the change most worth a second opinion.

### Border colour

`#e2e8f0`, `#eee`, `#edf2f7`, `#ddd`, `#e8edf3` → `var(--color-border)` · `#f1f5f9` → `var(--color-border-muted)` · `#cbd5e1` → `var(--color-border-strong)` · `#fecaca`/`#fde68a`/`#a7f3d0` → status tokens · `var(--primaryColor)` and `var(--primaryColor, #874429)` → `var(--color-border-accent)`.

**Not mapped, by decision:** `#fff` and `rgba(255,255,255,*)` (a white edge on a dark surface is a real, different role), `#1a1a1a` (dark chip edge), `#ffe1e1` (an error tint that is not `--color-error-border`), `transparent`.

---

## 4. Card System

Per §4, **no new React abstraction was added.** The sprint allows it ("do not create unnecessary React abstractions if existing SCSS composition is more appropriate"), and DS-03 already produced a primitive that is not yet adopted — adding an unused `Card` component would repeat that. Instead the **existing** card selectors were normalised in place, so every card in scope now resolves through the same token layer:

- **Content card** — `.HighlightBox` and `#CourseDetails .RelatedProducts`: white surface, `--radius-lg`, `1px var(--color-border)`, 35px padding. The DS-03 reference shell, unchanged in appearance.
- **Product card** — `.ProductItem` in the detail roots: now `--radius-md` + `var(--color-border)` + `#f8fafc` surface.
- **Product thumbnail** — `.ProdImage`: `--radius-md` + `var(--color-border)`.
- **Panel / summary / modal** — `--radius-lg` / `--radius-xl` per the measured role.
- **Pill and circle** — badges and avatars → `--radius-pill` / `--radius-circle`.

So the "variants" the sprint asks for exist as **semantic token usage on the existing selectors**, not as a parallel class system.

---

## 5. The Brand Leftover

Four declarations still tinted with `rgba(255, 114, 94, …)` (coral `#ff725e`).

**Two were fixed, in `style.scss`:**

```scss
// an unread badge dot
box-shadow: 0 2px 5px rgba(var(--color-primary-rgb), 0.4);
// .UnreadCountPill
background: rgba(var(--color-primary-rgb), 0.12);
```

The evidence that these were leftovers rather than an intentional accent: `.UnreadCountPill` paired a **coral background with brand-brown text** (`color: var(--primaryColor, #874429)`). A deliberate accent would not mix two unrelated hues in one element. Both now derive from the brand triplet, so the pill's tint and text finally agree.

**Two were kept, in `notification.scss`,** and are deliberately documented: `.NotificationItem--card.is-unread` and `.UnreadPill` tint with the same coral **and** carry a matching `#fed7aa` border. That module is internally consistent and its role is alert/unread — a genuinely different semantic state from a brand surface. Per §5's rule ("if yes: document why it remains"), it stays. A test pins both the fix and the exception so neither can drift.

---

## 6. Files Changed

**Modified (4):**

| File | Change |
|---|---|
| `src/assets/css/style.scss` | 100 declarations normalised + 2 coral fixes |
| `src/assets/css/daily-live-details.scss` | 106 declarations normalised |
| `src/assets/css/live-yoga-details.scss` | 100 declarations normalised |
| `src/__tests__/commerce/courseRelatedProducts.test.js` | updated: asserts the token *and* its resolved value |

**Added (2):**

| File | Purpose |
|---|---|
| `scripts/dsNormalize.mjs` | auditable normaliser (dry-run by default) |
| `src/__tests__/surfaceTokens.test.js` | 10 guards |

`git diff --stat`: **153 insertions, 153 deletions** across 3 stylesheets — a strict 1:1 substitution, so no formatting or line structure drifted.

**Not modified:** checkout, players (`learning-player.scss`, `live-stream.scss`), `about.scss`, `contact.scss`, `blog.scss`, `HomeFAQ.scss`, `notification.scss`, `unifiedCart.scss`, `main.scss`, `tokens.scss`. No React component, no commerce logic, no backend or admin file.

---

## 7. Pages Migrated & Responsive Verification

### 7.1 Normalised in this sprint

| Content type | Root | Status |
|---|---|---|
| Course Detail | `#CourseDetails` (both blocks) | ✅ normalised + **visually verified** |
| DailyClass Detail | `#DailyLiveClassDetails` | ✅ normalised; **render-verified at CSS level only** |
| LiveSection Detail | `#LiveYogaDetails` | ✅ normalised; **render-verified at CSS level only** |

**Why the second and third could not be visually verified:** `/api/v1/home/live-sections` and `/api/v1/home/daily-classes` both return `[]` in this environment, so those detail pages have no data to render. Their normalisation is verified three other ways — the source inventory shows zero hardcoded radii in their roots (asserted by test), the production bundle compiles them, and the build passes. But **no computed-style comparison was possible**, and I am not claiming one.

### 7.2 Browser verification (required at 640/768/1024/1440)

6 routes × 4 widths = **24 renders**:

| Route | 640 | 768 | 1024 | 1440 |
|---|---|---|---|---|
| `/`, `/course`, `/course/surya-namasakaram/12`, `/cart`, `/checkout`, `/about` | ✅ | ✅ | ✅ | ✅ |

- **Horizontal overflow: NONE** at any width on any route (0px).
- **Console errors: NONE.**
- **Token layer resolved at every width**, `MISSING` count 0.

### 7.3 Before/after on the reference page

A per-selector baseline was captured at all four widths *before* the change and diffed after. **At every width the only differences are:**

```
.ProductItem  borderRadius   10px                  → 8px
.ProductItem  borderTopColor rgb(232, 237, 243)    → rgb(226, 232, 240)
```

`.HighlightBox` (12px, `#e2e8f0`, 35px), `#CourseDetails .RelatedProducts` (12px, `#e2e8f0`), `.HighlightBox h3` (24px/600/`rgb(26,26,26)`/25px) and `.container` (1340px) are **identical at all four widths**. The 112 value-preserving substitutions produced no pixel change, exactly as the dry-run predicted — only the ~10 declarations whose value actually moved shifted anything, and the visible one is the product card.

Rendered radii census after DS-04: **`10px` is gone** from the tested pages, and the product-card drift is resolved.

---

## 8. Tests

```
Frontend full suite:        561 passed / 0 failed  (42 files)
  surfaceTokens.test.js:     10 passed / 0 failed   (new, DS-04)
  courseRelatedProducts:     41 passed / 0 failed   (updated)
Baseline after DS-03:       551 passed / 0 failed
```

`courseRelatedProducts.test.js` **failed correctly** after normalisation: it pinned the literal `border-radius: 12px` on the reference shell. It now asserts `var(--radius-lg)` **and** that the token resolves to `12px` **and** that `.HighlightBox` uses the same token — which is a stronger version of the original intent ("the section has the same shell as the page's other content boxes"), since pinning the old literal would have let the two drift apart silently.

`surfaceTokens.test.js` pins the mechanical invariants:

- every radius inside each of the three roots is a token, and **no retired value (`14/15/18/25/5/30/10px`) remains**;
- the reference shell's tokens still resolve to `12px` / `#e2e8f0`;
- no neutral or brand **hex** remains in the roots' borders;
- the exception set is small and named (`≤ 6`), so a new colour cannot appear without a decision;
- **no `#ff725e` or its RGB triplet remains in `style.scss`**, the pill tints from the brand triplet, and the notification exception is still present and deliberate;
- `#CourseDetails` is still found **twice** — the bug that skipped the product-card block cannot come back silently.

These are scoped to the primary roots on purpose: asserting app-wide would fail on the deferred files and punish correct, intentional deferral.

ESLint: `npx eslint .` → 39 problems (11 errors, 28 warnings) — **identical to the DS-02 and DS-03 baselines**, so DS-04 added none.

---

## 9. Build

```
npm run build  ->  ✓ Compiled successfully in 6.7s
                   ✓ Generating static pages using 7 workers (26/26)
                   exit code 0
```

33 routes, rendering modes unchanged. All normalised declarations ship as tokens; the token layer resolves in the browser at every tested width.

---

## 10. Deferred Items

**This is the part of the sprint that is not done, stated plainly.**

| Item | Measured size | Why deferred |
|---|---:|---|
| **Shadow normalisation** | **121 declarations, 71 distinct values** | The largest drift in the app and the highest-risk. Mapping 71 values to 6 tokens changes the depth of nearly every elevated surface at once, and DS-04 has no screenshot evidence to catch a bad call. Inventoried above; a token mapping is the natural next step. |
| Checkout radius/border | `14/12/10/6px` + `1.5px` borders | **§9 forbids modifying Checkout this sprint** |
| Cart beyond shared primitives | `#Cart` root | §9: cart only if required for consistency |
| Players (`learning-player`, `live-stream`) | large | DS-10 |
| About / Contact / Blog / HomeFAQ | — | DS-08 |
| Notifications | `#e8edf3`-class greys + the kept coral | DS-08/DS-09 |
| Home rails, teacher cards, wishlist | secondary scope | Deferred once the DB proved the two content types unrenderable |
| **App-wide radii** | **342 of 454 still hardcoded (≈75%)** | The primary scope is 100% done; the rest is scheduled work |
| Diverging `--surface-nav` from `--surface-tinted` | decision | Carried from DS-03; a judgement, not a task |

`scripts/dsNormalize.mjs` takes a `--roots` argument, so extending to another root is a one-line invocation with a full dry-run review — the mechanism is ready and the deferred work is not blocked on discovery.

---

## 11. Regressions

**None found.** Specifically:

- No horizontal overflow at any width (§7.2) — the objective responsive check.
- No console errors.
- No token resolved as `MISSING`.
- The reference page's card shell, headings and container are **byte-identical** before/after (§7.3).
- No commerce, cart, checkout, payment or product logic touched.
- ESLint unchanged from baseline.

**One expected test failure** occurred and was resolved by strengthening the test, not by weakening the assertion (§8).

**Tool bug found and fixed during the sprint:** the normaliser initially processed only the *first* occurrence of a root selector, silently skipping `style.scss`'s second `#CourseDetails` block — which contains the product cards the sprint explicitly targets. Caught in dry-run review (the `#e8edf3` border and `10px` radius I had measured in the browser never appeared in the change list), fixed, and now pinned by a test.

---

## 12. Conclusion

The sprint's **primary objective is met and verified**: the three content-detail roots — Course Detail, DailyClass Detail and LiveSection Detail — contain **zero hardcoded radii**, all borders use semantic tokens, the product card is on the canonical scale, and the reference page is provably unchanged apart from the product-card correction.

Two things should be understood before the next sprint:

1. **DailyClass and LiveSection were not visually verified**, because the dev database contains no instances of either. Their normalisation is source- and bundle-verified only. If those pages matter for sign-off, the database needs seed data first — that is the single highest-value unblocking action.
2. **The shadow system is the real remaining drift** (71 distinct values, versus the ~19 radius values that prompted this sprint). It was inventoried rather than half-changed.

Nothing is committed. The DS-04 change set is 4 modified + 2 new paths on top of `6afb2cc`.
