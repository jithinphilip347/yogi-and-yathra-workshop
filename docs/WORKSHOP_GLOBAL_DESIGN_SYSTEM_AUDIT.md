# Workshop Global Design System Audit

> **AUDIT ONLY.** No source file was modified: no CSS, no SCSS, no Tailwind config, no
> tokens, no components, no pages, no routes, no API. The frontend working tree is clean.
> The only artifact is this document.

## 1. Executive Summary

The Workshop frontend has a **real, coherent brand** and **no design system**.

The brand is genuine and must be preserved: brown `#874429`, hover `#6d331e`, secondary
yellow `#f2b907`, text `#333`, a pale blue-grey sticky header `#f2f6fc`, a solid brown
footer, a 4px brown accent bar used as a section-heading motif, pill badges, and warm
cream tints on the cart summary. Those are deliberate decisions, and they are applied
consistently enough to read as one product.

What is missing is the layer that makes those decisions _reusable_. **Five CSS custom
properties exist in the entire application**, and none of them describes a surface, border,
radius, spacing step, shadow, type size, or status colour. Those are written as literals at
~1,229 radius sites and thousands of other declarations, so the brand's _intent_ and the
code's _accidents_ are now indistinguishable by reading.

The measured cost:

| Dimension            | Reality                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| Radius values        | **17** (2,3,4,5,6,8,10,12,14,15,16,18,20,24,25,30,50px) + `50%`                                        |
| Neutral border greys | **~10**, all doing one job (`#e2e8f0` ×40, `#eee` ×23, `#ddd` ×14, `#cbd5e1` ×11, …)                   |
| Spellings of white   | **4** (`#fff` ×101, `#ffffff` ×32, `background-color: #ffffff` ×18, `background-color: #fff` ×7)       |
| Muted-surface greys  | **7–8** (`#f1f5f9` ×30, `#f8fafc` ×29, `#fafafa` ×9, `#f9fafb` ×8, `#f2f6fc` ×7, `#f8f9fa`, `#f8f8f8`) |
| Border widths        | **5** as a system: 1px, 1.5px, 2px, 3px, 4px                                                           |
| Font sizes           | **22**, incl. `13.5px` ×23 and `12.5px` ×11                                                            |
| Box shadows          | **16+** distinct, 10 used once, against 15 explicit `box-shadow: none`                                 |
| Badge radii          | **6**                                                                                                  |
| Button radii         | **4** (incl. two _within one page_)                                                                    |

**Structural causes, both verified:**

1. **A 11,231-line `style.scss` holds 54% of all CSS** while sibling per-page stylesheets
   (`about.scss`, `blog.scss`, `checkout.scss`, `contact.scss`, `live-yoga-details.scss`,
   `daily-live-details.scss`, `main.scss`, …) also exist. Page styling lives in two places
   at once with no stated ownership.
2. **15 compiled `.css` files are committed beside their 18 `.scss` sources**, and consumers
   import a **mix**: `app/layout.js` loads `main.css` + `style.css` + `notification.css`,
   while pages load `checkout.css`, `blog.css`, `about.css` **and** `live-stream.scss`,
   `learning-player.scss`, `unifiedCart.scss`. Editing a source does not reliably change
   what a page loads. (Not hypothetical — the immediately preceding sprint had to
   hand-mirror one edit into both `style.css` and `style.scss`.)

**The audit's central recommendation is therefore not uniformity.** The application already
has a coherent implicit hierarchy — controls `6px` < cards `8px` < panels `12px` <
pills/circles `50px`/`50%` — and the incoherence comes from ~13 values _outside_ it. §36
ratifies a 7-step scale built from the 7 values already carrying the load. **Nothing in
this audit requires changing the brand.**

**Two findings are defects, not tidiness** (§34, §47), and should ship first and separately:

- **`rgba(var(--primaryColor), …)` ×4 is invalid CSS.** `--primaryColor` is a hex value, so
  four shadows silently do not render (`style.scss:9358, 9382, 9851, 10177`). The correct
  custom property `--primaryColorRgb: 135, 68, 41` exists and is used correctly 8×.
- **`--primaryColor` has four different fallbacks** — `#874429` ×92 (correct), `#ff725e` ×37
  (**coral**), `#d97706` ×16 (**amber**), `#0f172a` ×2 (**near-black**). Three surfaces
  would paint the wrong brand colour if the variable ever failed to resolve.

**The brief's two specific observations, resolved:**

- The **"4px"** is **not** a radius and **not** a control border. It is
  `border-left: 4px solid var(--primaryColor)` — a section-heading accent bar, in 5 verified
  locations (§8).
- The **"15px" checkout radius** is essentially correct: it is **`16px`**, with one `14px`
  element (§29). Checkout is confirmed as the most divergent page in the Workshop.
- The **cart's brown border is not a cart problem.** Brown is used as a border in **13
  stylesheets** across the Workshop (§9). The cart is one of many; the recommendation is to
  name it, not remove it.

## 2. Audit Scope

**Audited:** `Yogify-workshop/frontend` — the Workshop customer-facing website, in full.

**Explicitly excluded** (not inspected, not compared, not referenced in any recommendation
or roadmap):

- the Yogayatra / Yogify E-commerce storefront
- the E-commerce backend
- the E-commerce admin/dashboard
- the Workshop admin panel
- the Workshop backend
- any other application or repository

**Method.** Values extracted from source by frequency (`grep -o | sort | uniq -c`), then
attributed to pages via the verified import map. Selector-level extractions were
hand-checked before being reported; **two candidate findings were disproved by that check
and are excluded rather than published**: a `.card { border-radius: 2px }` reading in
`live-yoga-details.scss` is actually a nested 40×3px decorative heading bar, and a
`.ReviewCard` 12px-vs-8px conflict was not reproducible at top level.

**Honest limitation.** Every measurement is at **stylesheet and selector level from source**.
No page was rendered — no dev server survives across commands in this environment, so no
computed styles and no visual regression tooling were available. Findings about _which
stylesheet a page loads and which values it declares_ are verified. Findings that require
computed styles, cross-stylesheet paint order, or per-breakpoint rendering are marked
**(requires render)**. This matters most in §46 and §49.1.

## 3. Workshop Route Inventory

33 routes under `src/app` (from `page.js`/`page.jsx`):

| Group          | Routes                                                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Home           | `/`                                                                                                                                             |
| Content        | `/about`, `/blog`, `/blog/[slug]`, `/contact`                                                                                                   |
| Course         | `/course`, `/course/[slug]/[id]`, `/course/[slug]/learn/[lessonId]`                                                                             |
| Daily Class    | `/daily-class/[id]/[slug]`, `/daily-class/[id]/[slug]/player`                                                                                   |
| Live           | `/live-class`, `/live-section/[id]/[slug]`, `/live-stream`, `/live-stream/[id]/[slug]`                                                          |
| Commerce       | `/cart`, `/checkout`, `/checkout/success`, `/checkout/failure`, `/pricing`, `/wishlist`                                                         |
| Account / auth | `/auth/login`, `/auth/signup`, `/auth/otp`, `/auth/forgetpassword`, `/auth/changepassword`, `/auth/profile`, `/auth/callback`, `/notifications` |
| Directory      | `/teacher-list`, `/teacher-list/[slug]`, `/teacher-list/teacher-details`                                                                        |
| Certificates   | `/certificates/verify`, `/certificates/verify/[code]`                                                                                           |

**Not present:** there is no `/orders`, no `/order/[id]`, no `/search`, and **no
`error.js` / `not-found.js` / `loading.js` boundary anywhere in the tree**. The audit brief
lists Orders, Order Details, Search and error pages as candidates — they do not exist, so
they are absent from every matrix below rather than reported as empty. There is one route-level
loading file (`/daily-class/[id]/[slug]/loading.jsx`).

## 4. Shared Component Inventory

`src/components/` has 13 groupings (92 files); `src/features/` has three (auth, commerce,
wishlist).

| Grouping              |  Files | Owned stylesheet                                          | Shared?          |
| --------------------- | -----: | --------------------------------------------------------- | ---------------- |
| `player/`             |     30 | `learning-player.scss` (2,034) + `live-stream.scss` (660) | no — player-only |
| `profile/`            |     15 | — (styled by `style.scss`)                                | no               |
| `home/`               |     12 | `HomeFAQ.scss` (FAQ only)                                 | partial          |
| `coursebox/`          |      5 | **`CourseCard.scss` (443)**                               | **yes**          |
| `teachersBox/`        |      5 | **`TeacherBox.scss` (110)**                               | **yes**          |
| `breadcrumbs/`        |      4 | **`Breadcrumbs.scss` (68)**                               | **yes**          |
| `nav/`                |      4 | — (styled by `style.scss` `#Nav`)                         | no               |
| `popup/`              |      3 | — (styled by `main.scss`)                                 | no               |
| `certificate/`        |      3 | — (`style.scss`)                                          | no               |
| `notifications/`      |      2 | partial (`notification.scss`)                             | partial          |
| `footer/`             |      1 | — (`style.scss`)                                          | no               |
| `filter/`, `reviews/` | 1 each | — (`style.scss`)                                          | no               |

**Verification results:**

| Question             | Finding                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Styling method       | Plain SCSS, descendant selectors. **No CSS modules, no CSS-in-JS, no utility classes**                                   |
| Tailwind / Bootstrap | **Neither exists.** `sass: ^1.101.0` is the only styling dependency                                                      |
| Design tokens        | 5 CSS variables (§5)                                                                                                     |
| Hardcoded values     | pervasive — the rest of this audit                                                                                       |
| Duplicated styling   | yes — see §33E                                                                                                           |
| Componentised states | **partial:** `CourseCardSkeleton.jsx`, `TeacherBoxSkeleton.jsx`, `.shimmer` exist; most loading/empty states don't (§22) |

**Finding.** Only three components own their styles. **There is no shared `Card`, `Button`,
`Input`, `Badge`, `Section`, `Container` or `Modal` component** — those concepts exist only
as repeated selectors inside global files. Of every card in the product, exactly one
(`CourseCard`) is a genuine component with a stylesheet.

## 5. Existing Design System

The complete token layer:

```css
--primaryColor: #874429; /* brand brown */
--primaryColorRgb: 135, 68, 41; /* exists so rgba() can work */
--primaryHoverColor: #6d331e;
--secondaryColor: #f2b907; /* brand yellow */
--textColor: #333;
```

**There is no token for any of:** surface, muted surface, elevated surface, input surface,
page background, border colour, border width, radius, spacing, shadow, type scale, font
weight, focus ring, overlay/scrim, success, warning, error, or the header/footer surfaces.

Where a literal is needed, it is written at the use site. `app/layout.js` imports
`main.css`, `style.css`, `notification.css`; component and page files import additional
stylesheets directly (§2 finding 2).

**Token hazard (§34).** `--primaryColor` is consumed with a fallback in some places and
without in others, and the fallbacks **contradict the real value**:

| Fallback  | Uses | Renders as         | Where                                |
| --------- | ---: | ------------------ | ------------------------------------ |
| `#874429` |   92 | brand brown ✓      | correct usages                       |
| `#ff725e` |   37 | **coral/red** ✗    | `notification.scss` (+ others)       |
| `#d97706` |   16 | **amber/orange** ✗ | `contact.scss`                       |
| `#0f172a` |    2 | **near-black** ✗   | `style.scss`, `learning-player.scss` |

## 6. Color Audit

Colour is written as literals with no semantic naming, so one _role_ is filled by many
_values_. Measured.

**Brand (present and coherent — preserve)**

```
var(--primaryColor)     #874429    ×70 as background, ×13 as border, plus text/tint use
var(--primaryHoverColor) #6d331e   hover states
var(--secondaryColor)    #f2b907   brand yellow
#f2f6fc                  header surface (sticky nav)
var(--primaryColor)      footer surface (solid brown)
```

**Surfaces — the white problem**

| Declaration                 |                  Count |
| --------------------------- | ---------------------: |
| `background: #fff`          |                    101 |
| `background: #ffffff`       |                     32 |
| `background-color: #ffffff` |                     18 |
| `background-color: #fff`    |                      7 |
| **total**                   | **158 for one colour** |

**Muted surfaces — 7–8 competing greys**

| Value     | Count | Role                              |
| --------- | ----: | --------------------------------- |
| `#f1f5f9` |    30 | muted surface                     |
| `#f8fafc` |    29 | muted surface                     |
| `#fafafa` |     9 | muted surface (DailyClass detail) |
| `#f9fafb` |     8 | muted surface (inputs/cart)       |
| `#f2f6fc` |     7 | **header** + muted (blue-tinted)  |
| `#f8f9fa` |     2 | LiveSession detail                |
| `#f8f8f8` |     1 | Home FAQ                          |

**Warm brand tints — 4 literals for one idea**

```
#fffcfb (notifications)  #fffafa (cart summary)  #fffdf5 (cart)  #fffaf0 (cart gradient)
```

**Status colours** (used constantly, never tokenised). The error family alone spans
`#fee2e2`, `#fef2f2`, `#fecaca`, `#dc2626` with no rule for which is surface, border or text.
Warning: `#fef3c7`, `#fffbeb`, `#b45309`. Success: `#ecfdf5`, `#2f855a`/`#2e7d32`,
`#a7f3d0`. Live/danger accents: `#10b981`, `#ef4444`.

**Overlay scrims — 3 different opacities** (see §21).

## 7. Border Radius Audit

**1,229 radius declarations, 17 distinct values** (excluding `50%`, used 69× for avatars,
dots, icon buttons and rings, and excluding logical corner variants such as `8px 8px 0 0`).

| Radius         |  Count | Pages / components                                  | Semantic role found                          |
| -------------- | -----: | --------------------------------------------------- | -------------------------------------------- |
| `8px`          |     80 | global, both detail pages, notifications, main      | **cards — the modal card radius**            |
| `50%`          |     69 | every file                                          | circles                                      |
| `6px`          |     66 | global, `learning-player` (×31), detail pages, cart | inputs, small buttons, sub-cards             |
| `12px`         |     60 | global, checkout, notifications, cart               | panels, modals, larger cards                 |
| `10px`         |     37 | global, **checkout inputs** (×6), main              | inputs/panels                                |
| `4px`          |     27 | blog, contact, cart (`QtyBadge`), global            | small buttons (`.SubmitBtn`, `.LoadMoreBtn`) |
| `20px`         |     22 | global, cart commerce shell (×1)                    | pills/outer shell                            |
| `16px`         |     22 | **checkout sections ×4**, about ×4, blog ×1         | large containers                             |
| `50px`         |     17 | detail-page badges, HomeFAQ                         | pills                                        |
| `24px`         |      8 | **product popup**, about `.PremiumValueCard` ×3     | largest surfaces in the app                  |
| `15px`         |      7 | scattered                                           | **none**                                     |
| `5px`          |      5 | header search field                                 | arbitrary                                    |
| `3px`, `2px`   | 5 each | cart progress bars, live-stream                     | micro/decorative                             |
| `30px`, `25px` | 5 each | scattered                                           | **none**                                     |
| `14px`         |      3 | **checkout ×1**                                     | **none**                                     |
| `18px`         |      2 | product popup image slider                          | **none**                                     |
| `0`            |      2 | mobile popup, intentional squares                   | intentional                                  |

**The same semantic component across pages — verified:**

| Component | Course           | DailyClass                | LiveSession        | Cart        | Checkout   | Product popup |
| --------- | ---------------- | ------------------------- | ------------------ | ----------- | ---------- | ------------- |
| Card      | `CourseCard` own | `8px`                     | `8px`              | `12px`      | `16px`     | `24px`        |
| Button    | own              | **`8px` + `6px`**         | **`8px` + `6px`**  | `6px`       | own        | —             |
| Input     | own              | `8px`                     | `8px`              | `6px`       | **`10px`** | —             |
| Badge     | own              | `50px`/`8px`/`20px`/`4px` | `50px`/`8px`/`4px` | `4px`/`6px` | —          | —             |

**Assessment.** The observation "same component, different radius" is **confirmed and is
systemic**, not local. Note that `15px`, `14px`, `18px`, `25px`, `5px`, `30px` map to **no
semantic role at all** — they are pure accumulation and are the cheapest thing in the entire
audit to remove.

**But the spread is not the whole story: a coherent hierarchy already exists** (controls 6px
→ cards 8px → panels 12px → pills/circles 50px/50%). §36 ratifies it rather than replacing it.

## 8. Border Width Audit

| Width   | Where                                                                  | Verdict                                 |
| ------- | ---------------------------------------------------------------------- | --------------------------------------- |
| `1px`   | dominant — essentially every card, input and divider                   | **canonical default**                   |
| `1.5px` | **`checkout.scss` ×4 only**                                            | inconsistent — the clearest single tell |
| `2px`   | checkout selected rows (×2), inputs, some emphasis                     | keep as `strong`                        |
| `3px`   | `live-yoga-details.scss` ×1, `border-left: 3px var(--primaryColor)` ×3 | fold to 2px                             |
| `4px`   | **accent bars only**                                                   | see below                               |

**Resolving the brief's `4px` question.** It is **not** a radius and **not** a card/control
border. It is a brown accent bar used as a section-heading marker. Verified locations:

```
about.scss:146               border-bottom: 4px solid var(--primaryColor)
main.scss:452                h4 { border-left: 4px solid var(--primaryColor); padding-left: 12px }
style.scss:5087              border-left: 4px solid var(--primaryColor)
style.scss:9487              border-left: 4px solid var(--primaryColor)
learning-player.scss:1579    border-left: 4px solid var(--primaryColor, #874429)
live-stream.scss:547,554     border-left: 4px solid #10b981 / #ef4444   (live / danger)
```

So `4px` is an established **brand motif** — 5 brown instances plus status-coloured variants
in the live stream. Recommendation: promote it to an explicit `accent-bar` token (§37), do
not remove it.

## 9. Border Color Audit

**~10 greys compete for one role** — the single largest source of visual drift.

| Colour    |                 Count | Where                                                                |
| --------- | --------------------: | -------------------------------------------------------------------- |
| `#e2e8f0` | 40 + 6 bottom + 5 top | `style.scss` ×27, `notification.scss`, `checkout.scss`, `main.scss`  |
| `#eee`    |        23 + 11 bottom | **both detail pages** (`#eee` ×12 live, ×8 daily), main, style, cart |
| `#ddd`    |                    14 | `style.scss`                                                         |
| `#cbd5e1` |                    11 | `learning-player` ×7, blog, contact                                  |
| `#d1d7dc` |          6 + 4 bottom | `learning-player`                                                    |
| `#e0e0e0` |                     5 | Home FAQ, style                                                      |
| `#f1f5f9` |         5 + 10 bottom | style, main, notification (dividers)                                 |
| `#edf2f7` |                     3 | `style.scss` (cart sub-card)                                         |
| `#e5e7eb` |                     3 | style, cart qty                                                      |
| `#e8edf3` |                     4 | **product card**                                                     |
| `#eaeaea` |             7 + 3 top | live-stream, style                                                   |
| `#f0e6e0` |                 **4** | **checkout only — brown-tinted**                                     |

**Accent (brown) as a border — 13 stylesheets, not just the cart:**

```
style.scss ×38    learning-player ×6   live-yoga-details ×5   daily-live-details ×5
checkout ×5       about ×4             contact ×3              notification ×2
main.scss ×2      live-stream ×1       blog ×1                 HomeFAQ ×1
```

**The brief's cart observation, resolved.** The cart is **not** the outlier. Brown borders
are already a Workshop-wide pattern applied inconsistently. Two consequences:

1. **Do not remove brown from the cart.**
2. **Do not confine it to the cart either.** Name it `border-accent` and define its uses
   (selected/active state, accent panels, focus) so it applies consistently in all 13 places.

**Checkout is the real outlier:** `#f0e6e0` — a _brown-tinted_ neutral used nowhere else —
sits on the same page as plain `#e2e8f0`. Two different "neutral" borders with different
hues in one card system.

## 10. Background / Surface Audit

| Semantic role             | Values actually used                                                        | Verdict                                         |
| ------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------- |
| Page background           | `#fff`, `#f8fafc`, `#fafafa`                                                | inconsistent                                    |
| Card / primary surface    | `#fff`/`#ffffff` (4 spellings)                                              | inconsistent (spelling)                         |
| Muted surface             | `#f1f5f9`, `#f8fafc`, `#fafafa`, `#f9fafb`, `#f2f6fc`, `#f8f9fa`, `#f8f8f8` | **7 values, one role**                          |
| Card secondary/inner      | `#f8fafc`, `#f8f9fa`, `#fafafa`                                             | inconsistent                                    |
| Input                     | `#fff`, `#f9fafb` (disabled), `#f1f5f9`                                     | inconsistent                                    |
| Accent surface            | `var(--primaryColor)` ×70                                                   | consistent ✓                                    |
| Accent-subtle (warm tint) | `#fffcfb`, `#fffafa`, `#fffdf5`, `#fffaf0`                                  | intentional, un-named                           |
| Modal surface             | `#fff`                                                                      | consistent ✓                                    |
| Header surface            | `#f2f6fc` (sticky, `#Nav`)                                                  | intentional, shares a value with muted surfaces |
| Footer surface            | `var(--primaryColor)`                                                       | intentional ✓                                   |
| Overlay/scrim             | `rgba(0,0,0,0.85)`, `0.7`, `0.486`, `0.048`                                 | inconsistent                                    |

**Comparisons the brief asked for, verified:**

| Equivalent section         | Background                                  | Verdict                                  |
| -------------------------- | ------------------------------------------- | ---------------------------------------- |
| Course detail section      | `#fff`                                      | —                                        |
| DailyClass detail section  | `#fff` + `#fafafa`                          | **inconsistent** (extra grey)            |
| LiveSession detail section | `#fff`/`#ffffff` + `#f8f9fa`                | **inconsistent** (spelling + extra grey) |
| Cart section               | `#fff` + `#fffafa`/`#fffdf5` + brown border | **intentional warmth, un-named**         |
| Checkout section           | `#ffffff` + `#f0e6e0` border                | **inconsistent** (unique border hue)     |

**Note on the header:** `#f2f6fc` is used for both the sticky header _and_ as a generic muted
surface. That dual use means the header's colour cannot be changed without silently altering
unrelated surfaces — a concrete example of what a shared literal costs.

## 11. Typography Audit

**22 distinct font sizes**, measured:

```
14px ×190   15px ×151   13px ×131   16px ×122   12px ×100   18px ×87
20px ×72    24px ×40    28px ×31    11px ×31    22px ×27    13.5px ×23
10px ×23    32px ×15    26px ×15    17px ×12    12.5px ×11
48px ×6     40px ×6     42px ×5     38px ×5     36px ×5
```

Problems, by severity:

1. **Fractional sizes exist:** `13.5px` ×23 (concentrated in `learning-player.scss`) and
   `12.5px` ×11. Nothing in a type system should be half a pixel off scale.
2. **Five sizes inside a 3px band:** 11 / 12 / 12.5 / 13 / 13.5px — all of which read as
   "small secondary text".
3. **Two body sizes are effectively tied:** 14px ×190 vs 15px ×151, and `style.scss` alone
   splits **95 / 95**. The choice between them is therefore random per rule, not semantic.
4. **Headings are not a scale:** 18/20/22/24/26/28/32/36/38/40/42/48px, with 36, 38, 40 and
   42px each used 5–6 times — four near-identical display sizes.

**Per-semantic-level consistency:**

| Level           | Consistent? | Evidence                        |
| --------------- | ----------- | ------------------------------- |
| H1 / page title | no          | 32/36/40/42/48px across pages   |
| Section heading | partial     | 24/26/28px                      |
| Card heading    | no          | 16/18/20/22px                   |
| Body            | **no**      | 14px vs 15px tie                |
| Muted text      | no          | 12/13/13.5/14px                 |
| Label           | no          | 11/12/12.5px                    |
| Button          | no          | per-page classes with own sizes |
| Price           | no          | 18/20/22/24px                   |
| Caption / micro | no          | 10/11/12/12.5px                 |

`learning-player.scss` is a separate dialect (13.5/14/13/12px dominant) — the player was
typeset independently of the site.

Font **family** is declared outside the audited stylesheets' size declarations and
**(requires render)** to confirm; it was not asserted here.

## 12. Spacing Audit

**Padding frequency:**

```
20px ×45   15px ×22   12px ×20   24px ×12   30px ×11   14px ×10
10px ×10   16px ×9    8px ×8     6px ×11 (component padding)
```

**Section rhythm:**

```
padding: 100px 0   ×14      60px 0px ×10      40px 0px ×12      30px 0px ×12
```

**Findings.**

1. There is a rough 4px rhythm mid-range (8/12/16/20/24) that **breaks at both ends**:
   `14px` and `15px` (×32 combined) are off-scale, plus `13px` ×5.
2. **Four unrelated section rhythms** (`100px`, `60px`, `40px`, `30px`) with no rule
   distinguishing them.
3. `40px 0px` / `30px 0px` / `60px 0px` write zero as `0px`, indicating hand-authoring rather
   than a scale.
4. `20px` is the modal card padding (×45) — a real anchor value to build on.

## 13. Shadow Audit

**16+ distinct box-shadows, 10 used exactly once.**

| Shadow                                                             |  Count | Role                                                |
| ------------------------------------------------------------------ | -----: | --------------------------------------------------- |
| `none`                                                             | **15** | explicit suppression — fighting an inherited shadow |
| `0px 3px 15px rgba(0,0,0,0.15)`                                    |      6 | card hover                                          |
| `0 4px 15px rgba(0,0,0,0.04)`                                      |      3 | very subtle lift                                    |
| `0 4px 12px rgba(0,0,0,0.1)`                                       |      3 | button/panel/image-nav                              |
| `0 20px 50px rgba(0,0,0,0.06)`                                     |      3 | large modal                                         |
| `0 10px 25px rgba(0,0,0,0.05)`                                     |      3 | modal                                               |
| `0 25px 50px -12px rgba(0,0,0,0.5)`                                |      1 | product popup (much stronger than any other)        |
| `0 4px 10px rgba(0,0,0,0.2)`                                       |      1 | video popup close button                            |
| `0 4px 6px`, `0 4px 20px`, `0 2px 6px`, `0 1px 2px`, `0 10px 30px` | 2 each | no scale                                            |

**The 15 `box-shadow: none` declarations are the diagnostic:** components _suppress_ a
shadow rather than choosing a level, so elevation depends on selector specificity rather
than design intent.

**Defect.** Four shadows are written `rgba(var(--primaryColor), 0.3|0.4)` —
`style.scss:9358, 9382, 9851, 10177`. `--primaryColor` is `#874429`, so this resolves to
`rgba(#874429, 0.3)`, which is **invalid**: the declarations are dropped and **no shadow
renders**. The correct form `rgba(var(--primaryColorRgb), …)` exists and is used 8 times.

## 14. Card System Audit

| Card type                      | Background       | Border | Width       | Border colour       | Radius                                           | Shadow       | Padding |
| ------------------------------ | ---------------- | ------ | ----------- | ------------------- | ------------------------------------------------ | ------------ | ------- |
| Course card                    | `#fff`           | yes    | 1px         | own scale           | own                                              | own          | own     |
| DailyClass card                | `#fff`           | yes    | 1px         | `#eee` (×8)         | `8px` (+ `12px` for `EnrollmentCard`/`PlanCard`) | —            | —       |
| LiveSession card               | `#fff`           | yes    | 1px         | `#eee` (×12)        | `8px` (+ `12px` `ReviewCard`)                    | —            | —       |
| Product / related-product card | `#fff`           | yes    | 1px         | `#e8edf3`           | `12px`                                           | subtle/hover | —       |
| Cart item                      | `#fff`           | yes    | 1px         | `#eee`              | `12px`                                           | hover        | —       |
| Cart summary card              | `#fff`           | yes    | 1px         | `#e2e8f0`           | `12px`                                           | —            | —       |
| Cart sub-card                  | `#fff`           | yes    | 1px         | `#edf2f7`           | `12px`                                           | —            | —       |
| Checkout section               | `#ffffff`        | yes    | **1.5px**   | **`#f0e6e0`**       | **`16px`**                                       | —            | —       |
| Checkout inner card            | —                | yes    | 1.5px / 2px | `#e2e8f0`           | `12px`                                           | —            | —       |
| Order summary                  | `#fff`/`#fffafa` | yes    | 1px         | —                   | `12px`/`20px` shell                              | —            | —       |
| Profile card                   | `#fff`           | yes    | 1px         | `#e2e8f0`           | `8px`                                            | —            | —       |
| Content/info card              | `#fff`           | yes    | 1px         | `#eee`/`#e2e8f0`    | `8px`                                            | —            | —       |
| Modal card (video)             | `#fff`           | no     | —           | —                   | `20px`                                           | very strong  | —       |
| Modal card (product)           | `#fff`           | no     | —           | —                   | `24px`                                           | very strong  | —       |
| Modal card (mobile)            | `#fff`           | —      | —           | —                   | **`0` `!important`**                             | —            | —       |
| About feature card             | `#fff`           | yes    | 1px         | `rgba(0,0,0,0.03)`  | `24px`                                           | —            | —       |
| Player card                    | `#ffffff`        | yes    | 1px         | `#cbd5e1`/`#d1d7dc` | `6px`                                            | `none`       | —       |

**Four independent levels of inconsistency:**

1. **Radius:** `6px` → `8px` → `12px` → `16px` → `20px` → `24px` → `0` for "a card".
2. **Border colour:** three greys inside the _cart alone_ (`#eee`, `#e2e8f0`, `#edf2f7`); two
   hues inside _checkout alone_ (`#f0e6e0` + `#e2e8f0`).
3. **Border width:** `1px` almost everywhere, `1.5px` in checkout, `2px` on checkout rows.
4. **Shadow:** some cards lift on hover, some are flat, some suppress explicitly.

## 15. Section Container Audit

| Section                             | Container                         | Horizontal padding | Vertical padding | Background                 | Radius        | Border                     | Heading spacing |
| ----------------------------------- | --------------------------------- | ------------------ | ---------------- | -------------------------- | ------------- | -------------------------- | --------------- |
| Home sections                       | `style.scss` container            | own                | `100px 0`        | `#fff`/`#f8f8f8`           | `8px`         | `#eaeaea`/`#e0e0e0`        | own             |
| Course sections                     | `style.scss`                      | own                | mixed            | `#fff`                     | `8px`         | `#e2e8f0`                  | own             |
| DailyClass sections                 | `daily-live-details.scss`         | own                | own              | `#fff`/`#fafafa`           | `8px`/`12px`  | `#eee`/`#e2e8f0`/accent    | own             |
| LiveSession sections                | `live-yoga-details.scss`          | own                | own              | `#fff`/`#ffffff`/`#f8f9fa` | `8px`         | `#eee`                     | own             |
| Course Content                      | `style.scss`                      | own                | own              | `#fff`                     | `8px`/`12px`  | accent                     | own             |
| Recommended Gear / Related Products | `style.scss` + `unifiedCart.scss` | own                | own              | `#fff`                     | `12px`        | `#e8edf3`                  | own             |
| Cart                                | `#Cart` + `unifiedCart.scss`      | own                | own              | `#fff` + warm tints        | `12px`/`20px` | `#eee`/`#e2e8f0`/`#edf2f7` | own             |
| Checkout                            | `checkout.scss`                   | own                | own              | `#ffffff`                  | `16px`/`12px` | `#f0e6e0`/`#e2e8f0`        | own             |
| Order Summary                       | `style.scss` + `unifiedCart.scss` | own                | own              | `#fff`/`#fffafa`           | `12px`        | `#e2e8f0`                  | own             |

**Finding.** There is **no `PageContainer` and no `Section` abstraction**. Every page
re-derives container width, padding, background and rhythm. The two content-detail pages come
closest to agreeing with each other; `checkout` and `learning-player` are separate dialects;
`about`/`contact`/`blog` are a third.

## 16. Form Control Audit

| Control                      | Height | Border width | Border colour      | Radius        | Background                | Focus                                        | Verdict                                        |
| ---------------------------- | ------ | ------------ | ------------------ | ------------- | ------------------------- | -------------------------------------------- | ---------------------------------------------- |
| Checkout inputs              | —      | **1.5px**    | `#e2e8f0`          | **`10px`**    | `#fff`/`#ffffff`          | `border-color: var(--primaryColor, #874429)` | **outlier**                                    |
| Checkout selected row        | —      | `2px`        | `#e2e8f0`          | `14px`        | —                         | `#cbd5e1`                                    | outlier                                        |
| Cart quantity control        | —      | 1px          | `#d1d5db`          | `6px`         | `#ffffff`                 | —                                            | third grey                                     |
| Cart coupon/other            | —      | 1px          | `#d1d5db`          | `6px`         | `#f9fafb`                 | —                                            | third grey                                     |
| Global inputs (`style.scss`) | —      | 1px          | `#e2e8f0` / `#ddd` | `8px` / `6px` | `#fff`                    | accent                                       | two radii                                      |
| Header search                | —      | —            | —                  | `5px`         | `rgb(117,117,117)` (dark) | —                                            | unique                                         |
| Player inputs                | —      | 1px          | `#cbd5e1`          | `6px`         | `#ffffff`                 | —                                            | fourth grey                                    |
| Textarea / select            | —      | 1px          | inherits global    | `8px`         | `#fff`                    | —                                            | —                                              |
| Checkbox / radio             | —      | —            | —                  | `50%`/native  | —                         | —                                            | not independently styled **(requires render)** |

**Findings.**

1. **Checkout inputs are `10px` and use `1.5px` borders** — no other page does either.
2. **Four greys for "input border":** `#e2e8f0`, `#d1d5db`, `#cbd5e1`, `#ddd`.
3. Focus colour is `var(--primaryColor, …)` but **the fallback varies by file** (§5), so focus
   styling is only _accidentally_ consistent.
4. Error/disabled states are not consistently defined — error surfaces exist
   (`#fef2f2`/`#fecaca`) but which controls use them is per-page **(requires render)**.

## 17. Button System Audit

Verified button radii:

| Button                                        | File                      | Radius    |
| --------------------------------------------- | ------------------------- | --------- |
| `.EnrollSidebarBtn`                           | `daily-live-details.scss` | `8px`     |
| `.ViewPlansBtn`, `.SelectPlanBtn`             | `daily-live-details.scss` | `8px`     |
| **`.ViewDetailsBtn`**                         | `daily-live-details.scss` | **`6px`** |
| **`.AddToCartBtn`**                           | `daily-live-details.scss` | **`6px`** |
| `.ViewDetailsBtn`, `.AddToCartBtn`            | `live-yoga-details.scss`  | `6px`     |
| `.BookBtnSidebar`, `.CalendarBtn`             | `live-yoga-details.scss`  | `8px`     |
| `.FitScreenBtn`                               | `live-stream.scss`        | `8px`     |
| `.MarkAllBtn`, `.NotificationItem__actionBtn` | `notification.scss`       | `8px`     |
| `.removeBtn` (cart)                           | `style.scss`              | `6px`     |
| `.PopupCartBtn`                               | `main.scss`               | own       |
| `.SubmitBtn`                                  | `contact.scss`            | **`4px`** |
| `.LoadMoreBtn`                                | `blog.scss`               | **`4px`** |
| Icon buttons (nav, slider, close)             | various                   | `50%`     |

**Findings.**

1. **Two button radii inside one page** (`daily-live-details.scss`): `8px` for
   enrolment/plan actions, `6px` for View Details / Add to Cart. Those four buttons sit in the
   same sidebar region and are visibly inconsistent **today**.
2. **Four radii across the Workshop:** 4px, 6px, 8px, plus `50%` icon buttons.
3. **No button hierarchy exists.** There is no primary/secondary/outline/text/destructive
   concept — each page names its own class (`.SubmitBtn`, `.LoadMoreBtn`, `.BookBtnSidebar`,
   `.SelectPlanBtn`, `.PopupCartBtn`, …) and independently decides height, padding, weight and
   radius. Hover/active/disabled/loading states are therefore also per-page
   **(requires render for contrast checks)**.

## 18. Badge / Status Audit

| Badge                                | File                      | Radius                |
| ------------------------------------ | ------------------------- | --------------------- |
| `.CategoryBadge`, `.LiveBadge`       | `live-yoga-details.scss`  | `50px`                |
| `.DiscountBadge`, `.CardHeaderBadge` | `live-yoga-details.scss`  | `8px` / `8px 8px 0 0` |
| `.TypeBadge`                         | both detail files         | `4px`                 |
| `.CategoryBadge`                     | `daily-live-details.scss` | `50px`                |
| `.DayBadge`                          | `daily-live-details.scss` | `8px`                 |
| `.PopularBadge`                      | `daily-live-details.scss` | `20px`                |
| `.QtyBadge`                          | `unifiedCart.scss`        | `4px`                 |
| `.ValidationBadge`                   | `unifiedCart.scss`        | `6px`                 |
| `.Pill`                              | `live-stream.scss`        | `8px`                 |
| `.UnreadPill`                        | `notification.scss`       | `12px`                |

**Finding.** The badge family spans **six radii** (`4px`, `6px`, `8px`, `12px`, `20px`,
`50px`) plus a corner variant. A badge is the archetypal pill. Today "Live", "Category",
"Popular", "Type", "Discount", "Day" and "Unread" are five different shapes for one concept.

The registration status badges ("Registration Open"/"Registration Closed") added by the
previous sprint sit in this same inconsistent family — they were given `8px` while the
`.CategoryBadge` beside them is `50px`.

**Recommended semantic system:** `pill` (`50px`) for all status/label badges — including
Registration Open/Closed — and `radius-xs` (`2px`/`4px`) only for the compact numeric
`.QtyBadge`, where pill geometry wastes space.

## 19. Header Audit

`#Nav` — **`style.scss:5`** (not `main.scss`):

```
height: 80px        background: #f2f6fc        position: sticky
z-index: 999        (nav search overlay: style.scss:3460, search field radius: 5px)
```

| Property    | Finding                                                                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Height      | `80px` — consistent, and referenced as a layout offset by other stylesheets                                                                                      |
| Background  | `#f2f6fc` — **shared with generic muted surfaces** (§10), so it cannot be changed independently                                                                  |
| Border      | not tokenised; `main.scss` carries `#eee` and `#e2e8f0` in this area                                                                                             |
| Radius      | `5px` search field (unique), `50%` icon circles                                                                                                                  |
| Responsive  | nav+footer region has only **5 `@media`** in `main.scss`; `#Nav` itself sits in `style.scss` (456 `@media`), so header responsiveness is spread across two files |
| Mobile menu | `.SideNavOverlay` (`style.scss:919`)                                                                                                                             |

**Finding.** The header establishes a visual language (brand accent, 80px rhythm, pale
surface) that the rest of the app only partly follows. Its stylesheet ownership is split
between `style.scss` (`#Nav`) and `main.scss` (popups/adjacent chrome).

## 20. Footer Audit

Styled in **`style.scss` (~line 3273)**, not `main.scss`:

| Property           | Value                                                     |
| ------------------ | --------------------------------------------------------- |
| Background         | **`var(--primaryColor)`** — solid brown                   |
| Padding            | `80px 0 40px` (inner `padding-bottom: 50px`)              |
| Divider            | `border-bottom: 1px solid rgba(255, 255, 255, 0.15)`      |
| Input (newsletter) | `background: #fff; padding: 10px 20px`                    |
| Radius             | not tokenised                                             |
| Responsive         | shares the low `@media` coverage of the nav/footer region |

**Finding.** The footer is the strongest brand surface in the product — a full brown field
with translucent white dividers. It is **intentional and should be preserved** (§33A). What
it lacks is a token for "inverse surface" so that other dark surfaces can match it.

## 21. Modal / Popup Audit

All popups are styled in **`main.scss`** (lines ~155–570). Workshop has three popups:
`ProductDetailPopup.jsx`, `ReviewPopup.jsx`, `VideoPreviewPopup.jsx`, plus
`CertificateViewerModal.jsx`.

| Property             | Video popup                                | Product popup                                      | Review popup | Side nav            |
| -------------------- | ------------------------------------------ | -------------------------------------------------- | ------------ | ------------------- |
| Overlay              | `rgba(0,0,0,0.85)`                         | `rgba(0,0,0,0.7)`                                  | own          | `rgba(0,0,0,0.486)` |
| Content background   | `#fff`                                     | `#fff`                                             | `#fff`       | —                   |
| Content radius       | **`20px`**                                 | **`24px`**                                         | own          | —                   |
| Inner element radius | `12px` (`.CourseBriefInfo`)                | `18px` (image slider)                              | —            | —                   |
| Shadow               | `0 25px 50px -12px rgba(0,0,0,0.5)`        | own                                                | own          | —                   |
| Close button         | `50%`, shadow `0 4px 10px rgba(0,0,0,0.2)` | `40px`, `1px solid #eee`, radius **commented out** | —            | —                   |
| Mobile               | —                                          | `border-radius: 0 !important`                      | —            | —                   |

**Findings.**

1. **Four radii for "a modal"** — `20px`, `24px`, `18px`, and `0 !important` on mobile.
2. **Three different scrim opacities** (`0.85`, `0.7`, `0.486`) plus `0.048` elsewhere.
3. **The two modals shadow differently by an order of magnitude** (`0.5` alpha vs the app's
   usual `0.03`–`0.15`).
4. **`// border-radius: 50%;` is commented out** in `.ClosePopup` — dead code that explains
   why the two close buttons differ.
5. **A hard `!important` override** (`border-radius: 0 !important`) at mobile — the only way
   the author could defeat the stronger `24px`; exactly the kind of specificity conflict a
   token layer removes.
6. Modal content is `#fff` in all cases — the one thing that _is_ consistent.

## 22. Loading / Empty / Error State Audit

**What exists:**

| State                    | Implementation                           | Styling                             |
| ------------------------ | ---------------------------------------- | ----------------------------------- |
| Skeleton (course)        | `CourseCardSkeleton.jsx`                 | component + `style.scss`            |
| Skeleton (teacher)       | `TeacherBoxSkeleton.jsx`                 | component + `TeacherBox.scss`       |
| Shimmer                  | `.shimmer` (`main.scss:140`)             | `height: 100vh`, own background     |
| Cart empty               | `#Cart` empty state                      | dashed card (`style.scss`)          |
| Loading copy             | inline `"Loading live sessions..."` etc. | inline styles in JSX                |
| Skeleton (notifications) | `.NotificationLoadingList .SkeletonCard` | `12px` radius (`notification.scss`) |
| Popup loading            | inline                                   | —                                   |

**Findings.**

1. **Only two components own a skeleton.** Everywhere else loading is an inline
   `isLoading ? <p>Loading…</p> : …` or an ad-hoc div, styled with **inline JS styles** —
   e.g. `HomeLiveCourse.jsx` renders a skeleton card via a `style={{…}}` object
   (`minHeight`, `background: rgba(255,255,255,0.8)`, `borderRadius: 20px`). That `20px`
   matches no card radius in the app (§14).
2. **Skeleton radii disagree:** `12px` (notifications) vs `20px` (home, inline) vs the card
   they imitate (`8px`/`12px`).
3. **Empty states are not a system.** The cart's empty state is a dashed card (added in a
   recent sprint); "no products" simply hides the section; "no courses" has no defined
   treatment. There is no `EmptyState` component.
4. **Error states are essentially absent.** No `error.js` / `not-found.js` boundary exists in
   the route tree, and no `ErrorState` component exists. Failures render as inline text or
   nothing. Inline error _text_ colours (`#ef4444`, `#dc2626`, `#b91c1c`) vary.
5. `height: 100vh` on `.shimmer` is a layout hazard independent of the design system.

## 23. Home Page Audit

**Loads:** `main.css` + `style.css` + `notification.css` (global) + `HomeFAQ.scss`.

| Property                 | Measured                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Background               | `#fff`, `#f8f8f8`                                                                                                              |
| Section radius / padding | `8px` / `100px 0`                                                                                                              |
| Card radius              | `8px`, `6px`                                                                                                                   |
| Border                   | `1px solid #eaeaea`, `1px solid #e0e0e0`                                                                                       |
| Type                     | `14px` ×4, `13px` ×4, `12px` ×3                                                                                                |
| Components               | 12 (`HomeCourse`, `HomeTopRated`, `HomeTrending`, `HomeNew`, `HomePopular`, `HomeTestimonial`, `HomeLiveCourse`, `HomeFAQ`, …) |

**Inconsistencies.**

- `#eaeaea` and `#e0e0e0` are two extra neutral borders unique to this surface.
- `#f8f8f8` is an eighth muted grey.
- The live-session rail's loading skeleton uses an inline `borderRadius: 20px` that matches no
  card in the app.
- **A dead duplicate exists: `components/home/HomeLiveCourse copy.jsx`** (§33F).

**Compared with:** detail pages use `#eee`; checkout uses `#f0e6e0`. Home belongs to neither.
**Canonical:** `radius-md` cards, `--color-border`, `surface`/`surface-muted`, type scale.
**Priority:** P0 for tokens, P1 for page normalisation (highest traffic).

## 24. Course Listing Audit

**Loads:** `style.scss` (listing) + `CourseCard.scss` (443 lines).

| Property   | Measured                                              |
| ---------- | ----------------------------------------------------- |
| Card       | `bg: #fff`, own border/radius/shadow scale            |
| Grid gap   | own                                                   |
| Pagination | `style.scss` (no shared `Pagination` component)       |
| Filters    | `components/filter/` (1 file), styled by `style.scss` |

**Finding.** Course is the **only** listing with a real card component, which makes it the
best reference implementation — but also means it is on its own scale, so its cards do not
match the product cards in the rails on the same site.
**Canonical:** keep `CourseCard` as the reference; re-base its values onto tokens.
**Priority:** P1 (it becomes the model for the other listings).

## 25. Course Detail Audit

**Loads:** `style.scss`; related products render through the shared commerce
`RelatedProducts` component (styled via `style.scss` + `unifiedCart.scss`).

| Property                            | Measured                                       |
| ----------------------------------- | ---------------------------------------------- |
| Page background                     | `#fff`                                         |
| Body sections                       | `8px` radius, `#e2e8f0`/accent borders         |
| Recommended Gear / Related Products | `12px` radius, `#e8edf3` border, `6px` buttons |
| CTA buttons                         | own classes                                    |
| Typography                          | `14px`/`15px`                                  |

**Inconsistency (intra-page).** Course detail is the page where **two conventions meet**: the
Course body follows the detail-page language (`8px`, `#e2e8f0`) while its product rail follows
the commerce language (`12px`, `#e8edf3`, `6px` buttons). That is why the product rail reads
as "borrowed" relative to the page around it. This is **not** a cosmetic difference — it is
two card systems on one screen.

**Priority:** P1. **Dependency:** `Card` + `ProductCard` tokens (§42).

## 26. DailyClass Audit

**Loads:** `daily-live-details.scss` (878 lines, 17 `@media`).

| Property         | Measured                                                                        |
| ---------------- | ------------------------------------------------------------------------------- |
| Background       | `var(--primaryColor)` ×8, `#fff` ×7, `#fafafa` ×5                               |
| Radius           | `8px` ×12, `6px` ×4, `50px` ×3, `12px` ×3                                       |
| Border           | `1px solid #eee` ×8, `1px solid #e2e8f0` ×4, `1px solid var(--primaryColor)` ×2 |
| Type             | `14px` ×9, `15px` ×8, `16px` ×7, `12px` ×7                                      |
| Buttons          | `8px` and `6px`                                                                 |
| Registration UI  | status badges at `8px` (vs `50px` category badges)                              |
| Related Products | commerce card language                                                          |

**Inconsistencies.** Three border colours in one file; two button radii in one sidebar;
`#fafafa` as a fifth muted grey; cards at both `8px` and `12px`; registration badges that
don't match sibling badges (§18).

**Compared with:** LiveSession detail — near-identical structure, but `#fafafa` vs `#f8f9fa`
and 17 vs 15 `@media`. Two pages building the same layout twice.

**Priority:** P1.

## 27. LiveSession Audit

**Loads:** `live-yoga-details.scss` (946 lines, 15 `@media`).

| Property           | Measured                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Background         | `#fff` ×6, `var(--primaryColor)` ×4, `#ffffff` ×2, `#f8f9fa` ×2                             |
| Radius             | `8px` ×13, `50px` ×4, `6px` ×3                                                              |
| Border             | `1px solid #eee` ×12, **`3px solid #eee` ×1**, `1px solid var(--primaryColor)` ×1           |
| Type               | `15px` ×9, `13px` ×8, `20px` ×7, `14px` ×7                                                  |
| Registration state | driven by enrollment (`userEnrollments(..., 'live_section')`), not by `registration_status` |
| Related Products   | commerce card language                                                                      |

**Findings.** This is **the most internally consistent page stylesheet in the Workshop**, and
it is the right candidate for the canonical content-detail model. Remaining issues: `#fff`
and `#ffffff` in the same file; `#f8f9fa` is yet another muted grey; a lone `3px solid #eee`
border; `13px` body text where the app mostly uses 14–15px.

**Priority:** P1 — migrate it _last_ among the three detail pages, so it can be the reference.

## 28. Cart Audit

**Loads:** `#Cart` in `style.scss` (from ~line 5080) **plus** `unifiedCart.scss` (228 lines).

**`#Cart` (style.scss):**

| Element          | Background                        | Border              | Radius |
| ---------------- | --------------------------------- | ------------------- | ------ |
| Cart item        | `#fff`                            | `1px solid #eee`    | `12px` |
| Summary card     | `#fff`                            | `1px solid #e2e8f0` | `12px` |
| Sub-card         | —                                 | `1px solid #edf2f7` | `12px` |
| Product image    | `#fff`                            | —                   | `8px`  |
| Progress bar     | `#e2e8f0` / `var(--primaryColor)` | —                   | `3px`  |
| Quantity control | —                                 | —                   | `6px`  |
| Accent button    | `var(--primaryColor, #874429)`    | `none`              | `6px`  |

**`unifiedCart.scss` (commerce layer):**

| Element                 | Radius | Surface              |
| ----------------------- | ------ | -------------------- |
| Domain/validation shell | `20px` | `#f1f5f9`            |
| Order summary warm tint | —      | `#fffafa`, `#fffdf5` |
| Quantity control        | `6px`  | `#ffffff`            |
| Validation badge        | `6px`  | `#fffbeb`, `#fef2f2` |
| Qty badge               | `4px`  | `#f3f4f6`            |

**Why the border is brown — answered.** The cart's accent border is **not** a cart-specific
decision. Brown is used as a border in 13 Workshop stylesheets (§9); the cart is applying the
same site-wide accent motif. It signals emphasis on the commerce surfaces (CTA, active row,
summary). **It should become a canonical token (`border-accent`) and be applied
consistently — not removed.**

**Inconsistencies.**

1. **Three neutral greys inside one page** (`#eee`, `#e2e8f0`, `#edf2f7`) plus `#e8edf3`
   nearby — the clearest symptom of the missing card token.
2. **Two card radius levels that disagree:** the cart's own cards are `12px`; the commerce
   shell is `20px`.
3. **`unifiedCart.scss` has 0 `@media` queries** — the coupon field, validation badges, domain
   rows and quantity controls it owns have **no responsive rules of its own** (§46).
4. Warm tints (`#fffafa`, `#fffdf5`, `#fffaf0`) are the brand speaking — **preserve**, but
   name them (§38).

**Priority:** P0/P1 — this is the surface the brief originated from.

## 29. Checkout Audit

**Loads:** `checkout.scss` (779 lines, 17 `@media`). **The most divergent page in the
Workshop.**

| Property            | Checkout                                                                              | Everywhere else              |
| ------------------- | ------------------------------------------------------------------------------------- | ---------------------------- |
| Section card radius | **`16px`** ×4                                                                         | `8px`–`12px`                 |
| Inner card radius   | `12px` ×5                                                                             | `8px`–`12px`                 |
| Input radius        | **`10px`** ×6                                                                         | `6px`–`8px`                  |
| Outlier radius      | **`14px`** ×1                                                                         | —                            |
| Border colour       | **`#f0e6e0` (brown-tinted)** ×4 **+** `#e2e8f0` ×6                                    | `#e2e8f0` / `#eee`           |
| Border width        | **`1.5px` ×4**, `2px` ×2                                                              | `1px`                        |
| Surfaces            | `#ffffff` ×7, `var(--primaryColor)` ×4, `#fff` ×2, `#ecfdf5` ×2                       | `#fff`, `#f1f5f9`, `#f8fafc` |
| Type                | `13px` ×8, `12px` ×6, `14px` ×5, `15px` ×4                                            | `14px`/`15px` dominant       |
| Status borders      | `#fecaca` ×3, `#fde68a` ×3, `#a7f3d0`, `#2e7d32`                                      | same intent, other values    |
| Progress indicator  | circles `50%`, `2px solid #e2e8f0`                                                    | —                            |
| Courier selector    | added by the previous sprint; uses `10px`/accent focus, matching checkout's own scale | not aligned to a site token  |

**Verified:** the brief's "approximately 15px" is essentially right — the measured value is
**`16px`**, with one `14px` element. The brief's `4px` is **not** in checkout; it is the
site-wide accent bar (§8).

**Assessment (§28 classification).**

_Defensible page-specific:_ checkout is a transactional flow; denser type (`12px`/`13px`) is
appropriate, and its step/progress and status affordances legitimately differ.

_Accidental and should be normalised:_

1. `1.5px` borders exist **nowhere else** in the Workshop.
2. `#f0e6e0` — a brown-tinted neutral — sits alongside plain `#e2e8f0` **on the same page**.
3. `16px` section radius while every other Workshop card is `8px`–`12px`.
4. `10px` inputs while cart inputs are `6px`.
5. A single `14px` outlier.

**Priority:** P0/P1. **Dependency:** `Input`, `Button`, `Card`, `OrderSummary` tokens.

## 30. Other Workshop Pages Audit

| Page                       | Stylesheet                                                               | Radius                         | Type                            | Notable                                                                                   |
| -------------------------- | ------------------------------------------------------------------------ | ------------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------- |
| Blog `/blog`               | `blog.scss` (632, 72 `@media`)                                           | **`4px` ×3**, `8px`, `16px`    | `14px` ×9, `16px` ×8, `18px` ×7 | `1px dashed #cbd5e1` (unique border style); `#f8fafc`                                     |
| About `/about`             | `about.scss` (411, 27 `@media`)                                          | `16px` ×4, **`24px` ×3**       | `48px`/`40px`/`36px` display    | `.PremiumValueCard` `24px` — joint-largest radius in the app; `border-bottom: 4px` accent |
| Contact `/contact`         | `contact.scss` (255, 36 `@media`)                                        | `4px` ×2                       | `32px` display                  | **`var(--primaryColor, #d97706)`** → amber fallback                                       |
| Teacher list               | `TeacherBox.scss` (110)                                                  | own                            | own                             | one of only 3 componentised styles                                                        |
| Notifications              | `notification.scss` (582, **3 `@media`**)                                | `8px` ×4, `12px` ×3, `10px` ×3 | `12px` ×4, `13.5px` ×3          | `#ffffff` ×8; **`var(--primaryColor, #ff725e)` → coral**                                  |
| Profile / auth (10 routes) | `style.scss` + 15 components                                             | varies                         | varies                          | **highest concentration of un-owned styling**                                             |
| Player (3 routes)          | `learning-player.scss` (2,034, **2 `@media`**) + `live-stream.scss` (25) | `6px` ×31, `50%` ×8            | **`13.5px` ×19**                | separate typing dialect; dark media surfaces                                              |
| Certificates               | `style.scss`                                                             | varies                         | varies                          | —                                                                                         |
| Wishlist / pricing         | `style.scss`                                                             | varies                         | varies                          | —                                                                                         |
| Cart/checkout result pages | `checkout.scss`                                                          | `16px` family                  | —                               | inherits checkout's scale                                                                 |

**Findings.** Two of these pages carry a **wrong brand fallback** (contact: amber;
notifications: coral) — a defect, not a preference. `notification.scss` has the second-lowest
responsive coverage in the app for its size. The player is a separate design dialect.

## 31. Page-by-Page Consistency Matrix

| Workshop page                     | Background                 | Container | Section radius    | Card radius                  | Border         | Border colour              | Shadow | Spacing   | Buttons     | Inputs      | Main finding                                               |
| --------------------------------- | -------------------------- | --------- | ----------------- | ---------------------------- | -------------- | -------------------------- | ------ | --------- | ----------- | ----------- | ---------------------------------------------------------- |
| Home                              | `#fff`,`#f8f8f8`           | own       | `8px`             | `8px`/`6px`                  | 1px            | `#eaeaea`,`#e0e0e0`        | mixed  | `100px 0` | own         | `8px`/`5px` | two unique borders; 8th muted grey; inline-skeleton `20px` |
| Courses list                      | `#fff`                     | own       | `8px`             | own (`CourseCard`)           | 1px            | own                        | own    | own       | own         | own         | only real card component, on its own scale                 |
| Course detail                     | `#fff`                     | own       | `8px`/`12px`      | **`8px` body + `12px` rail** | 1px            | `#e2e8f0`/`#e8edf3`        | subtle | own       | own + `6px` | own         | **two card systems on one page**                           |
| DailyClass                        | `#fff`,`#fafafa`           | own       | `12px`            | `8px` + `12px`               | 1px            | `#eee`,`#e2e8f0`,accent    | —      | own       | `8px`+`6px` | `8px`       | 3 borders, 2 button radii, 5th muted grey                  |
| LiveSession                       | `#fff`,`#ffffff`,`#f8f9fa` | own       | `8px`             | `8px` (+`12px` review)       | 1px (+1×3px)   | `#eee` ×12                 | —      | own       | `8px`+`6px` | `8px`       | most consistent page; spelling + extra grey                |
| Product / rails                   | `#fff`                     | own       | `12px`            | `12px`                       | 1px            | `#e8edf3`,`#edf2f7`        | subtle | own       | `6px`       | —           | only place these greys appear                              |
| Cart                              | `#fff` + warm tints        | own       | `12px`/**`20px`** | `12px`                       | 1px            | `#eee`,`#e2e8f0`,`#edf2f7` | hover  | own       | `6px`       | `6px`       | 3 neutral greys; **0 `@media` in commerce layer**          |
| Checkout                          | `#ffffff`                  | own       | **`16px`**        | `12px` (`14px` outlier)      | **1.5px**,2px  | **`#f0e6e0`** + `#e2e8f0`  | —      | own       | own         | **`10px`**  | **most divergent page in Workshop**                        |
| Success / Failure                 | `#ffffff`                  | own       | `16px`            | `12px`                       | 1.5px          | `#f0e6e0`, `#a7f3d0`       | —      | own       | own         | —           | inherits checkout's scale                                  |
| Blog list / post                  | `#f8fafc`,`#fff`           | own       | `16px`            | `4px`–`16px`                 | 1px **dashed** | accent, `#cbd5e1`          | —      | own       | `4px`       | —           | `4px` cards vs app norm; unique dashed border              |
| About                             | `#fff`,`#f8fafc`,`#f1f5f9` | own       | `16px`            | **`24px`**                   | 1px            | `rgba(0,0,0,0.03)`         | —      | own       | own         | —           | largest card radius; 4 display sizes                       |
| Contact                           | `#fff`                     | own       | `4px`             | `4px`                        | 1px            | `#e2e8f0`,`#cbd5e1`        | —      | own       | `4px`       | —           | **amber brand fallback**                                   |
| Notifications                     | `#ffffff`,`#fffcfb`        | own       | `12px`            | `12px`                       | 1px            | `#e2e8f0`                  | —      | own       | `8px`       | —           | **coral fallback**; 3 `@media`                             |
| Profile / auth                    | `#fff`                     | own       | `8px`             | `8px`                        | 1px            | `#e2e8f0`                  | —      | own       | own         | `8px`       | 15 components, no owned stylesheet                         |
| Player                            | dark + `#ffffff`           | own       | `6px`             | `6px`                        | 1px            | `#cbd5e1`,`#d1d7dc`        | `none` | own       | `8px`       | `6px`       | own type dialect (`13.5px`); 2 `@media`                    |
| Teacher list                      | own                        | own       | own               | own                          | own            | own                        | own    | own       | own         | own         | one of 3 componentised styles                              |
| Certificates / pricing / wishlist | `#fff`                     | own       | `8px`/`12px`      | `8px`/`12px`                 | 1px            | `#e2e8f0`/`#eee`           | —      | own       | own         | `8px`       | inherit global scale                                       |

**Rendered appearance column is omitted deliberately** — no page was rendered (§2), so every
cell above is a declared-value measurement, not an observed one.

## 32. Component-to-Page Consistency Matrix

| Component         | Course             | DailyClass                | LiveSession                | Cart                       | Checkout            | Other                                                           | Consistent?                    | Recommendation                                        |
| ----------------- | ------------------ | ------------------------- | -------------------------- | -------------------------- | ------------------- | --------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------- |
| **Card**          | own (`CourseCard`) | `8px`+`12px`              | `8px`+`12px`               | `12px`+`20px`              | `16px`+`12px`       | `4px`(blog) … `24px`(about/modal)                               | **NO — 7 values**              | `radius-md` cards, `radius-lg` panels                 |
| **Button**        | own                | `8px`+`6px`               | `8px`+`6px`                | `6px` (+`50%`)             | own                 | `4px`(blog/contact), `8px`(nav/notif)                           | **NO — 4 values**              | `radius-sm`; build a hierarchy                        |
| **Input**         | own                | `8px`                     | `8px`                      | `6px`                      | `10px`              | `6px`(player), `5px`(nav)                                       | **NO — 5 values**              | `radius-sm`; one border colour                        |
| **Section**       | own                | own                       | own                        | own                        | own                 | `100px 0` (home)                                                | **NO**                         | `Section` + `PageContainer` + spacing scale           |
| **Badge**         | own                | `50px`,`8px`,`20px`,`4px` | `50px`,`8px`,`4px`         | `4px`,`6px`                | —                   | `12px`,`8px`                                                    | **NO — 6 values**              | `radius-pill` (status), `radius-xs` (numeric)         |
| **Border colour** | `#e2e8f0`          | `#eee`,`#e2e8f0`,accent   | `#eee`                     | `#eee`,`#e2e8f0`,`#edf2f7` | `#f0e6e0`,`#e2e8f0` | `#cbd5e1`,`#ddd`,`#eaeaea`,`#e0e0e0`                            | **NO — ~10 values**            | `--color-border` + `border-muted`/`-strong`/`-accent` |
| **Border width**  | 1px                | 1px                       | 1px (+3px)                 | 1px                        | **1.5px**, 2px      | 1px                                                             | **NO**                         | 1px default, 2px strong                               |
| **Surface**       | `#fff`             | `#fff`,`#fafafa`          | `#fff`,`#ffffff`,`#f8f9fa` | `#fff`+warm tints          | `#ffffff`,`#fff`    | `#f8fafc`,`#f1f5f9`,`#f8f8f8`                                   | **NO — 4 spellings + 7 greys** | surface scale (§38)                                   |
| **Shadow**        | own                | own                       | own                        | hover                      | —                   | 16 values, 10 once                                              | **NO**                         | `shadow-sm/md/lg/xl`                                  |
| **Modal/overlay** | —                  | —                         | —                          | —                          | —                   | `20px`,`24px`,`18px`,`0!important`; scrims `0.85`/`0.7`/`0.486` | **NO**                         | `radius-lg`, one scrim token                          |
| **Typography**    | `14/15px`          | `12/14/15/16px`           | `13/14/15/20px`            | `13/14px`                  | `12/13/14/15px`     | `13.5px`(player)                                                | **NO — 22 sizes**              | type scale (§39)                                      |

**This table is the audit's core evidence: no row is consistent.**

## 33. Intentional vs Inconsistent Differences

**A. Intentional — preserve (do not "fix")**

- The brown brand palette: `#874429`, hover `#6d331e`, yellow `#f2b907`.
- The **solid brown footer** — the strongest brand surface in the product.
- The **`#f2f6fc` pale header** (it is genuinely distinct from content surfaces).
- The **4px brown accent bar** used as a section-heading motif (§8).
- **Warm cream tints** on the cart summary/notifications (`#fffafa`, `#fffdf5`, `#fffcfb`,
  `#fffaf0`) — deliberate brand warmth.
- **Pill geometry** (`50px`) for category/live badges; **circle geometry** (`50%`) for avatars
  and icon buttons.
- **Checkout's denser typography** (`12px`/`13px`) and its step/progress affordances.
- **Status colours** being distinct from the brand palette.
- **Blog's dashed border** as a secondary/empty-state treatment (one legitimate use).

**B. Component-specific — keep but bound**

- Badges pill-shaped while cards are not.
- The player's darker media surfaces (`rgba(28,29,31,0.04)`, `rgba(255,255,255,0.08)`).

**C. Page-specific — keep, document, bound**

- Checkout's overall distinct treatment **minus** the four accidents in §29.
- About's promotional block (a `24px` capsule is reasonable for a marketing feature card —
  but it must be a _named_ level, not an unrepeatable value).
- Home hero/rails differing from content pages.

**D. Inconsistent — fix**

- 7 card radii, 4 button radii, 5 input radii, 6 badge radii (§32).
- ~10 neutral border greys for one role.
- 4 spellings of white; 7–8 muted-surface greys.
- 22 font sizes including `13.5px` and `12.5px`.
- 16 shadows (10 used once) against 15 `box-shadow: none`.
- `1.5px` borders.
- Two button radii within one page.
- Three modal radii plus `0 !important`, and three scrim opacities.
- Skeleton radii (`12px` vs `20px`) not matching the cards they imitate.

**E. Duplicated / technical — fix structurally**

- **15 compiled `.css` committed beside 18 `.scss`**, with consumers importing both (§2).
- The 11,231-line `style.scss` competing with per-page stylesheets for the same pages.
- **Four different `--primaryColor` fallbacks** — a duplicated _value_ with correctness
  consequences (§5).
- `unifiedCart.scss` re-styling controls that `#Cart` in `style.scss` also styles.
- Two detail pages independently implementing the same layout (`daily-live-details` vs
  `live-yoga-details`).
- Five stray **"copy" files**: `app/layout copy.js`, `components/home/HomeLiveCourse copy.jsx`,
  `assets/css/live-stream copy.scss`, `live-stream copy.css`, `live-stream copy.css.map`.

**F. Legacy — remove**

- The five "copy" files above.
- `daily-class-player.scss` (13 lines) — self-documented dead: _"This file previously contained
  mock meeting UI classes that are no longer used… safe to remove entirely when ready."_
- Radius values `15px`, `14px`, `18px`, `25px`, `5px`, `30px` where they map to no role.
- The commented-out `// border-radius: 50%;` in `.ClosePopup`.

## 34. Workshop Global Design-System Findings

**P0 — system-wide**

1. **No token layer.** 5 custom properties, none for surface/border/radius/spacing/shadow/
   type/status. Everything below is downstream of this.
2. **`--primaryColor` has four competing fallbacks** — `#874429` ×92, `#ff725e` ×37 (coral),
   `#d97706` ×16 (amber), `#0f172a` ×2 (near-black). **Three surfaces render the wrong brand
   colour on token failure.** (Defect.)
3. **`rgba(var(--primaryColor), …)` ×4 is invalid CSS** — those shadows render nothing.
   (Defect.)
4. **Compiled `.css` committed beside `.scss`, with mixed imports** — source edits are
   unreliable until resolved.
5. **No shared component layer** — no `Card`, `Button`, `Input`, `Badge`, `Section`,
   `Container`, `Modal`, `EmptyState`.

**P1 — repeated component inconsistency**

6. **~10 neutral border greys** for one role.
7. **17 radius values**, 6 of which map to no semantic role.
8. **4 spellings of white; 7–8 muted-surface greys; 4 warm tints** for one idea.
9. **22 font sizes** incl. `13.5px` ×23 and `12.5px` ×11.
10. **Cart / Checkout / Detail divergence** — the brief's central observation, confirmed and
    quantified (§45).
11. **Badge family spans 6 radii** — including the registration status badges added recently.
12. **Two button radii inside one page** (DailyClass and LiveSession detail sidebars).
13. **Four card radii across the three detail pages + rails.**

**P2 — page-level**

14. Checkout's `1.5px` borders, `#f0e6e0` border, `14px` outlier.
15. **`unifiedCart.scss`: 0 `@media`** — commerce controls have no responsive rules.
16. `main.scss`: 5 `@media` for nav-adjacent chrome; `#Nav` itself lives in `style.scss`.
17. `learning-player.scss`: 2 `@media` / 2,034 lines.
18. `notification.scss`: 3 `@media` / 582 lines + coral fallback.
19. `contact.scss`: amber fallback.
20. Course detail mixes two card systems on one page.
21. Modal system: 3 radii + `0 !important`, 3 scrim opacities, one order-of-magnitude shadow
    outlier, commented-out dead style.
22. Loading/empty/error states are ad-hoc, partly inline-styled, with mismatched skeleton radii;
    no `EmptyState`/`ErrorState`, no error boundary.
23. About `24px` card and blog `4px` cards — the extremes of the radius sprawl.
24. `#f8f9fa`, `#f8f8f8`, `#fafafa`, `#f2f6fc` — extra one-off muted greys.
25. Profile area: 15 components with no owned stylesheet.

**P3 — hygiene**

26. `0px` written where `0` would do.
27. Five stray "copy" files; dead `daily-class-player.scss`.
28. `height: 100vh` on `.shimmer`.

## 35. Recommended Color Tokens

Derived from actual Workshop usage. **Brand values unchanged.**

```css
:root {
  /* Brand — existing, preserved verbatim */
  --color-primary: #874429; /* == --primaryColor */
  --color-primary-hover: #6d331e; /* == --primaryHoverColor */
  --color-primary-rgb: 135, 68, 41;
  --color-secondary: #f2b907;

  /* Surfaces — ratified from §6/§10 frequencies */
  --color-page: #ffffff;
  --color-surface: #ffffff; /* 158 declarations → 1 */
  --color-surface-muted: #f8fafc; /* 7 greys → this */
  --color-surface-subtle: #f1f5f9;
  --color-surface-accent-subtle: #fffcfb; /* 4 warm tints → 1 */
  --color-surface-input: #ffffff;
  --color-surface-disabled: #f9fafb;
  --color-surface-inverse: #874429; /* footer — the existing brand brown field */
  --color-surface-nav: #f2f6fc; /* header — intentionally its own token */

  /* Borders — the single biggest win (§9) */
  --color-border: #e2e8f0; /* 10 greys → this */
  --color-border-muted: #f1f5f9; /* dividers */
  --color-border-strong: #cbd5e1; /* was #cbd5e1/#d1d7dc/#ddd */
  --color-border-accent: var(
    --color-primary
  ); /* the 13-stylesheet brown border */
  --color-border-focus: var(--color-primary);
  --color-border-inverse-muted: rgba(255, 255, 255, 0.15); /* footer divider */

  /* Text */
  --color-text: #333333; /* == --textColor */
  --color-text-muted: #64748b;
  --color-text-subtle: #94a3b8;
  --color-text-inverse: #ffffff;

  /* Status — currently 4 values per family (§6) */
  --color-error: #dc2626;
  --color-error-surface: #fef2f2;
  --color-error-border: #fecaca;
  --color-warning: #b45309;
  --color-warning-surface: #fffbeb;
  --color-warning-border: #fde68a;
  --color-success: #047857;
  --color-success-surface: #ecfdf5;
  --color-success-border: #a7f3d0;
  --color-live: #10b981;

  /* Overlay — 4 opacities → 2 */
  --overlay-modal: rgba(0, 0, 0, 0.72);
  --overlay-drawer: rgba(0, 0, 0, 0.5);
}
```

**Migration note.** `--color-primary` must **alias** the existing `--primaryColor` throughout
the transition so no surface changes colour mid-migration. **The four divergent fallbacks must
be deleted** — that is a correctness fix, not a style preference.

## 36. Recommended Radius Tokens

Ratified from §7 frequencies — **semantic levels, not one value:**

```css
--radius-xs: 2px; /* progress bars, micro/decorative, numeric badges */
--radius-sm: 6px; /* inputs, small buttons, compact cards  — 66 uses */
--radius-md: 8px; /* cards                                 — 80 uses (modal value) */
--radius-lg: 12px; /* panels, modals, order summary         — 60 uses */
--radius-xl: 16px; /* large containers (checkout sections, blog feature) */
--radius-pill: 50px; /* badges, pills                          — 17 uses */
--radius-circle: 50%; /* avatars, dots, icon buttons, rings     — 69 uses */
```

**Mapping the strays (§7):** `4px`, `5px` → `sm`; `10px`, `14px`, `18px` → `md`/`lg` by role;
`15px` → `lg`; `20px`, `25px`, `30px` → `xl`/`pill` by role; `24px` (product popup, About
feature card) → `xl` as a **named, sanctioned** level.

**Deliberately not "everything = 8px".** The Workshop already has a coherent implicit
hierarchy — controls `6px` < cards `8px` < panels `12px` < pills `50px` < circles `50%` — and
the incoherence comes from the ~13 values _outside_ it. This shrinks 17 values to the 7 that
already carry the load.

## 37. Recommended Border Tokens

```css
--border-width: 1px; /* the Workshop's universal border */
--border-width-strong: 2px; /* selected rows, focus emphasis */
--border-accent-width: 4px; /* the existing section-heading accent bar */
```

| Token            | Width           | Colour                   | Usage                                    |
| ---------------- | --------------- | ------------------------ | ---------------------------------------- |
| `border-default` | 1px             | `--color-border`         | every card, input, divider               |
| `border-muted`   | 1px             | `--color-border-muted`   | list separators, table rows              |
| `border-strong`  | 1px / 2px       | `--color-border-strong`  | selected/active rows                     |
| `border-accent`  | 1px / 2px / 4px | `--color-border-accent`  | **the brown border — now explicit**      |
| `border-focus`   | 2px             | `--color-border-focus`   | focus rings                              |
| `border-inverse` | 1px             | `rgba(255,255,255,0.15)` | footer/on-brand dividers                 |
| `border-none`    | —               | —                        | only where a shadow or surface separates |

**`1.5px` is retired** (§8) — it exists only in checkout. The lone `3px` folds to `2px`.
**`dashed` survives** as one explicit variant for blog's secondary state.

**On the brown border:** it becomes `border-accent` and is applied consistently across the 13
places that already use it — selected/active states, accent panels, the cart's emphasised
rows. It is **not** removed from the cart and **not** confined to it.

## 38. Recommended Surface Tokens

| Token                             | Value                     | Applied to                                                                            |
| --------------------------------- | ------------------------- | ------------------------------------------------------------------------------------- |
| `--surface-page`                  | `#ffffff`                 | page background                                                                       |
| `--surface`                       | `#ffffff`                 | **all cards, modals, popups, order summary**                                          |
| `--surface-muted`                 | `#f8fafc`                 | section backgrounds                                                                   |
| `--surface-subtle`                | `#f1f5f9`                 | inset/grouped areas, inactive tabs                                                    |
| `--surface-elevated`              | `#ffffff` + `--shadow-md` | popups, dropdowns, elevated cards                                                     |
| `--surface-accent-subtle`         | `#fffcfb`                 | cart summary, notifications, brand-warm panels                                        |
| `--surface-input`                 | `#ffffff`                 | **all** inputs (today varies `#fff`/`#f9fafb`)                                        |
| `--surface-disabled`              | `#f9fafb`                 | disabled controls                                                                     |
| `--surface-accent`                | `var(--color-primary)`    | brand buttons, footer                                                                 |
| `--surface-nav`                   | `#f2f6fc`                 | header only — **split from `--surface-muted` so the header can change independently** |
| `--surface-error/warning/success` | per §35                   | status panels                                                                         |

## 39. Recommended Typography Tokens

Ratified from §11, eliminating fractional sizes:

```css
--text-display: 40px; /* was 36/38/40/42/48 → one, with 48px as a documented hero variant */
--text-h1: 32px;
--text-h2: 26px; /* was 24/26/28 */
--text-h3: 20px; /* was 18/20/22 */
--text-body-lg: 16px;
--text-body: 15px; /* the more common body size */
--text-body-sm: 14px; /* UI chrome: labels, metadata, table cells, chips */
--text-caption: 13px;
--text-micro: 12px; /* was 10/11/12/12.5 → 12px */
--text-label: 13px; /* uppercase + letter-spacing */

--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;

--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.6;
```

**The 14px-vs-15px tie requires an explicit decision, not a token.** Both are used ~150 times
and `style.scss` alone splits 95/95, so the current choice is arbitrary per rule. The
recommendation: **15px for body copy, 14px for UI chrome** — which is almost certainly the
original intent.

**`13.5px` (×23) and `12.5px` (×11) must be eliminated.** Half-pixel type has no place in a
scale, and it is the clearest single artifact of the player being typeset separately.

## 40. Recommended Spacing Tokens

A 4px-based scale covering most existing values:

```css
--space-1: 4px;
--space-2: 6px; /* retained: 11 compact-chip uses */
--space-3: 8px;
--space-4: 12px; /* 20 uses */
--space-5: 16px;
--space-6: 20px; /* 45 uses — the Workshop's most common padding */
--space-7: 24px;
--space-8: 32px;
--space-9: 40px;
--space-10: 60px; /* inner section rhythm */
--space-11: 100px; /* major section rhythm — 14 uses */

--section-y: var(--space-11); /* major page sections */
--section-y-sm: var(--space-10); /* inner sections */
```

`13px`, `14px`, `15px` padding fold to `space-4`/`space-5`. Section rhythm standardises on
`60px` (inner) and `100px` (major), retiring the undocumented `30px`/`40px` variants.

## 41. Recommended Shadow Tokens

16 ad-hoc shadows collapse to four plus one brand variant:

```css
--shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.04); /* rest: inputs, flat cards */
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08); /* cards, dropdowns */
--shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.1); /* popups, modals */
--shadow-xl: 0 20px 50px rgba(0, 0, 0, 0.12); /* full-screen overlays, product popup */
--shadow-accent: 0 5px 15px rgba(var(--color-primary-rgb), 0.3); /* brand glow — fixes the invalid-CSS defect */
```

**Rule: compose, don't suppress.** The 15 `box-shadow: none` declarations are replaced by
choosing the correct level. Elevation = `--surface-elevated` + one shadow level, never
specificity.

## 42. Recommended Shared Components

| Proposed                    | Why it should be shared                                            | Current duplicated implementations                                                                                                                                                | Migration scope             |
| --------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `PageContainer`             | every page re-derives width/padding                                | ~all pages                                                                                                                                                                        | high                        |
| `Section`                   | 4 unrelated section rhythms                                        | ~all pages                                                                                                                                                                        | high                        |
| `Card`                      | **7 radii, ~10 border greys, 4 surface spellings for one concept** | cart, checkout, detail ×2, product, profile, content, modal                                                                                                                       | **high — highest leverage** |
| `Surface`                   | muted/elevated/inset backgrounds                                   | everywhere                                                                                                                                                                        | medium                      |
| `Button`                    | 4 radii, no hierarchy, ~15 bespoke classes                         | `.SubmitBtn`, `.LoadMoreBtn`, `.BookBtnSidebar`, `.SelectPlanBtn`, `.EnrollSidebarBtn`, `.ViewDetailsBtn`, `.AddToCartBtn`, `.PopupCartBtn`, `.removeBtn`, …                      | high                        |
| `Input` / `FormField`       | input radius 5/6/8/10px, 4 border greys, inconsistent focus/error  | checkout, cart, player, nav, `style.scss`                                                                                                                                         | medium                      |
| `Badge`                     | 6 radii across 12 selectors                                        | `.CategoryBadge`, `.TypeBadge`, `.LiveBadge`, `.DiscountBadge`, `.DayBadge`, `.PopularBadge`, `.QtyBadge`, `.ValidationBadge`, `.Pill`, `.UnreadPill`, registration status badges | low — mechanical            |
| `Modal`                     | 3 radii + `0 !important`, 3 scrims                                 | `ProductDetailPopup`, `ReviewPopup`, `VideoPreviewPopup`, `CertificateViewerModal`                                                                                                | low                         |
| `ProductCard`               | used by 3 rails + cart                                             | exists partially inside commerce scope                                                                                                                                            | low                         |
| `OrderSummary`              | cart + checkout each have one                                      | 2                                                                                                                                                                                 | medium                      |
| `EmptyState` / `ErrorState` | currently ad-hoc or absent                                         | none                                                                                                                                                                              | medium — new                |
| `Skeleton`                  | 2 exist, others inline-styled                                      | `CourseCardSkeleton`, `TeacherBoxSkeleton`                                                                                                                                        | low                         |
| `Pagination`                | listing pages only                                                 | `style.scss`                                                                                                                                                                      | low                         |

**Promote rather than replace:** `CourseCard.scss` (the only real card component),
`Breadcrumbs.scss` (68 lines, self-contained), `TeacherBox.scss`. **`live-yoga-details.scss`
is the most internally consistent page stylesheet (§27) and is the best reference for the
canonical content-detail model.**

## 43. Existing → Canonical Token Mapping

| Existing                                                               | Where                             | Problem                         | Canonical                              |
| ---------------------------------------------------------------------- | --------------------------------- | ------------------------------- | -------------------------------------- |
| `#e2e8f0` ×40                                                          | cards, inputs, dividers           | competes with 9 other greys     | `--color-border`                       |
| `#eee` ×23                                                             | **both detail pages**, main, cart | ditto                           | `--color-border`                       |
| `#ddd`,`#e0e0e0`,`#eaeaea`,`#d1d7dc`,`#edf2f7`,`#e5e7eb`,`#e8edf3` ×46 | scattered                         | ditto                           | `--color-border` / `-muted`            |
| `#f0e6e0` ×4                                                           | **checkout only**                 | brown-tinted, no peer           | `--color-border` (or `-accent`)        |
| `#cbd5e1` ×11                                                          | player, blog, contact             | strong grey used as default     | `--color-border-strong`                |
| `#fff`/`#ffffff`/`background-color:` ×158                              | every surface                     | 4 spellings                     | `--surface`                            |
| `#f8fafc`,`#f1f5f9`,`#fafafa`,`#f9fafb`,`#f2f6fc`,`#f8f9fa`,`#f8f8f8`  | muted surfaces                    | 7 grey for one role             | `--surface-muted` / `--surface-subtle` |
| `#f2f6fc` (header)                                                     | `#Nav`                            | **shared with muted surfaces**  | `--surface-nav` (split)                |
| `#fffcfb`,`#fffafa`,`#fffdf5`,`#fffaf0`                                | cart, notifications               | 4 warm tints                    | `--surface-accent-subtle`              |
| `var(--primaryColor)` (footer)                                         | `style.scss` ~3273                | un-named inverse surface        | `--surface-inverse`                    |
| radius `15px`,`14px`,`18px`,`25px`,`5px`,`30px`                        | scattered                         | **no semantic role**            | nearest scale step (§36)               |
| radius `16px` ×22                                                      | checkout ×4, about ×4, blog       | vs `8px` Workshop cards         | `--radius-xl`                          |
| radius `10px` ×37                                                      | **checkout inputs** ×6            | between `sm` and `md`           | `--radius-sm`                          |
| radius `24px`                                                          | product popup, About card         | joint-largest, unrepeatable     | `--radius-xl` (named)                  |
| radius `20px`                                                          | cart commerce shell, video popup  | vs `12px` cards                 | `--radius-xl`                          |
| `1.5px` ×4                                                             | **checkout only**                 | unique to one page              | `1px`                                  |
| `3px solid #eee` ×1                                                    | live-yoga-details                 | one-off                         | `2px`                                  |
| `border-left: 4px solid var(--primaryColor)` ×5                        | about/main/style/player           | un-named motif                  | `--border-accent-width`                |
| `13.5px` ×23, `12.5px` ×11                                             | player, style                     | half-pixel, off-scale           | `--text-caption` / `--text-micro`      |
| `rgba(var(--primaryColor), .3\|.4)` ×4                                 | `style.scss`                      | **invalid — renders nothing**   | `rgba(var(--color-primary-rgb), …)`    |
| `var(--primaryColor, #ff725e)` ×37                                     | notifications etc.                | **wrong brand colour**          | remove fallback                        |
| `var(--primaryColor, #d97706)` ×16                                     | contact                           | **wrong brand colour**          | remove fallback                        |
| `var(--primaryColor, #0f172a)` ×2                                      | style, player                     | **wrong brand colour**          | remove fallback                        |
| `rgba(0,0,0,0.85\|0.7\|0.486)`                                         | popups/drawers                    | 4 scrim opacities               | `--overlay-modal` / `--overlay-drawer` |
| `.ClosePopup // border-radius: 50%`                                    | `main.scss`                       | commented-out dead style        | remove                                 |
| `.ProductPopupContent border-radius: 0 !important`                     | `main.scss` mobile                | specificity fight               | `--radius-lg` at mobile                |
| 15 × `box-shadow: none`                                                | various                           | suppressing instead of choosing | a `--shadow-*` level                   |
| 10 single-use shadows                                                  | various                           | no scale                        | `--shadow-sm/md/lg/xl`                 |
| inline skeleton `borderRadius: 20px`                                   | `HomeLiveCourse.jsx`              | JS style, matches no card       | `Skeleton` component                   |

## 44. Page-by-Page Unification Plan

Values are **measured from each page's stylesheet**; anything requiring computed styles is
marked **(requires render)**.

### Home (`/`)

- **Current:** bg `#fff`/`#f8f8f8`; sections `8px`, `100px 0`; cards `8px`/`6px`; borders `#eaeaea`, `#e0e0e0`; type `12–14px`; header `#f2f6fc` 80px; footer brown.
- **Inconsistencies:** two unique neutral borders; `#f8f8f8` as an 8th muted grey; live-rail skeleton uses inline `borderRadius: 20px`; a dead `HomeLiveCourse copy.jsx`.
- **Compared with:** detail pages use `#eee`; checkout uses `#f0e6e0`.
- **Canonical:** `--surface` cards, `--color-border`, `--surface-muted` sections, `radius-md`, type scale.
- **Required changes:** ① replace `#eaeaea`/`#e0e0e0` with `--color-border`; ② replace `#f8f8f8`; ③ replace the inline skeleton with `Skeleton`; ④ adopt `Section`/`PageContainer`; ⑤ delete the copy file.
- **Tokens/components:** surface, border, radius-md, spacing, `Card`, `Section`, `Skeleton`.
- **Priority:** P0 (tokens), P1 (page). **Dependencies:** §44 global token sprint.

### Courses listing (`/course`)

- **Current:** `CourseCard.scss` (443 lines) with its own border/radius/shadow scale; filters from `style.scss`; no shared `Pagination`.
- **Inconsistencies:** the only properly componentised card, but on its own scale.
- **Compared with:** product cards in the rails (`12px`, `#e8edf3`); blog cards (`4px`).
- **Canonical:** keep `CourseCard` as the reference; re-base onto tokens.
- **Required changes:** ① map its values to `radius-md`, `--color-border`, `--shadow-md`; ② extract `Pagination`; ③ align grid gap to the spacing scale.
- **Priority:** P1 (becomes the model for other listings). **Dependencies:** tokens.

### Course detail (`/course/[slug]/[id]`)

- **Current:** page `8px`/`#e2e8f0`; Recommended Gear rail `12px`/`#e8edf3`/`6px` buttons.
- **Inconsistencies:** **two card systems on one page** (§25).
- **Compared with:** DailyClass/LiveSession detail (`8px`, `#eee`).
- **Canonical:** one detail-card token; the product rail uses the same `Card` with a commerce variant.
- **Required changes:** ① align the rail card to the page card; ② unify border to `--color-border`; ③ unify rail button radius to `--radius-sm`; ④ adopt `Section`.
- **Priority:** P1. **Dependencies:** `Card`, `ProductCard`, `Button`.

### DailyClass listing + detail (`/daily-class/...`, `/player`)

- **Current:** `8px` ×12 / `6px` ×4 / `50px` ×3 / `12px` ×3; borders `#eee` ×8, `#e2e8f0` ×4, accent ×2; `#fafafa`; buttons `8px`+`6px`; 17 `@media`.
- **Inconsistencies:** three border colours; two button radii; `#fafafa`; cards at two radii; registration badges (`8px`) vs category badges (`50px`).
- **Compared with:** LiveSession detail — same structure, `#f8f9fa` instead of `#fafafa`, 15 vs 17 `@media`.
- **Canonical:** adopt the LiveSession model; tokens throughout.
- **Required changes:** ① one border token; ② one button radius; ③ drop `#fafafa`; ④ unify card radius; ⑤ registration badges → `--radius-pill`; ⑥ replace registration window logic only if visual.
- **Priority:** P1. **Dependencies:** `Card`, `Button`, `Badge`.

### LiveSession listing + detail (`/live-class`, `/live-section/[id]/[slug]`)

- **Current:** `8px` ×13 / `50px` ×4 / `6px` ×3; `#eee` ×12; `#fff`+`#ffffff`+`#f8f9fa`; 15 `@media`. **Most consistent page.**
- **Inconsistencies:** `#fff` vs `#ffffff` in one file; one `3px solid #eee`; `#f8f9fa`; `13px` body.
- **Canonical:** **the reference model.**
- **Required changes:** ① tokenise; ② fold `3px`→`2px`; ③ consolidate surfaces; ④ align body size.
- **Priority:** P1 — **migrate last among the three detail pages**. **Dependencies:** tokens.

### Product / Related Products surfaces

- **Current:** `#fff`, `#e8edf3`/`#edf2f7` borders, `12px`, `6px` buttons; popup `24px` + `18px` inner.
- **Inconsistencies:** the only place `#e8edf3`/`#edf2f7` appear; button radius differs from page buttons; popup radius is the app maximum and unique.
- **Canonical:** `Card` + `--color-border` + `radius-md`; popup `--radius-xl` (named); buttons `--radius-sm`.
- **Required changes:** ① replace the two greys; ② align buttons; ③ name the popup radius; ④ unify popup scrim and close-button treatment.
- **Priority:** P1. **Dependencies:** `Card`, `ProductCard`, `Modal`, `Button`.

### Cart (`/cart`)

- **Current:** `12px` cards, borders `#eee`/`#e2e8f0`/`#edf2f7`, warm tints `#fffafa`/`#fffdf5`, `20px` commerce shell, `3px` bars, qty `6px`; **0 `@media` in `unifiedCart.scss`**.
- **Inconsistencies:** three neutral greys; `12px` vs `20px`; no responsive rules in the commerce layer.
- **Compared with:** checkout (`16px`, brown-tinted borders) and detail pages (`8px`, `#eee`).
- **Canonical:** `radius-lg` cards, `--color-border`, warm tints → `--surface-accent-subtle`, brown border → `--color-border-accent`, shell → `radius-xl`.
- **Required changes:** ① 3 borders → 1 token; ② shell `20px` → `radius-xl`; ③ tints → token; ④ accent border → token; ⑤ **add responsive rules**; ⑥ extract `OrderSummary`.
- **Priority:** P0/P1 (the brief's origin surface). **Dependencies:** `Card`, `OrderSummary`, button/input tokens.

### Checkout (`/checkout`, `/success`, `/failure`)

- **Current:** `16px` sections, `12px` cards, `10px` inputs, one `14px`; borders `#f0e6e0` + `#e2e8f0`; `1.5px`/`2px`; dense `12/13px` type; 17 `@media`.
- **Inconsistencies:** all four accidents in §29. **The most divergent page in the Workshop.**
- **Compared with:** every other surface (§45).
- **Canonical:** **keep** the density, step/progress affordances and status colours; normalise radius/border/inputs.
- **Required changes:** ① `16px` → `radius-xl` (an explicit, named decision if the larger radius is the checkout identity); ② `1.5px` → `1px`; ③ `#f0e6e0` → `--color-border`; ④ inputs → `--radius-sm`; ⑤ remove the `14px` outlier; ⑥ courier selector aligned to input tokens; ⑦ `OrderSummary` shared with the cart.
- **Priority:** P0/P1. **Dependencies:** `Input`, `Button`, `Card`, `OrderSummary`.

### Blog (`/blog`, `/blog/[slug]`)

- **Current:** `4px` ×3, `8px`, `16px`; accent border; unique `1px dashed #cbd5e1`; `#f8fafc`; type `14/16/18px`.
- **Inconsistencies:** `4px` (×9 spacing) cards vs the Workshop norm; dashed border unique to here.
- **Canonical:** cards → `radius-md`; keep dashed as an explicit secondary-state variant; align type.
- **Required changes:** ① radius → scale; ② dashed → named token; ③ type → scale; ④ adopt `Card`.
- **Priority:** P2.

### About (`/about`)

- **Current:** `16px` ×4, `24px` ×3; `#fff`/`#f8fafc`/`#f1f5f9`; display `36–48px`; `border-bottom: 4px` accent.
- **Inconsistencies:** `24px` feature card is the app maximum; four display sizes; un-named accent bar.
- **Canonical:** `24px` → `radius-xl` as a **named** level; one display size + one hero variant; accent bar → token.
- **Required changes:** ① name the radius; ② collapse display sizes; ③ tokenise the accent bar; ④ consolidate surfaces.
- **Priority:** P2.

### Contact (`/contact`)

- **Current:** `4px` ×2; `#fff`; `32px` display; **`var(--primaryColor, #d97706)`**.
- **Inconsistencies:** amber brand fallback (defect); `4px` cards/buttons.
- **Required changes:** ① **remove the fallback**; ② `4px` → `--radius-sm`; ③ tokenise.
- **Priority:** P0 (fallback), then P2.

### Notifications (`/notifications`)

- **Current:** `8px` ×4, `12px` ×3, `10px` ×3, `6px`; `#ffffff`, `#fffcfb`, `#f1f5f9`; `#e2e8f0`; 3 `@media`; **coral fallback ×3**.
- **Required changes:** ① **remove the fallback**; ② radius → `md`/`lg`; ③ add breakpoints; ④ unify card + skeleton radius.
- **Priority:** P0 (fallback), then P2.

### Profile / account & auth (10 routes)

- **Current:** `style.scss` + 15 profile components; no owned stylesheet.
- **Inconsistencies:** highest concentration of un-owned styling in the Workshop.
- **Required changes:** ① adopt `Card`/`Input`/`Button`; ② consider a `profile.scss` boundary.
- **Priority:** P2. **Dependencies:** `Card`, `Input`, `Button`.

### Player (3 routes)

- **Current:** `6px` ×31, `50%` ×8, `2px` ×3; `#cbd5e1`/`#d1d7dc`; `#ffffff` ×18; type `13.5px` dominant; **2 `@media` in 2,034 lines**.
- **Inconsistencies:** own type dialect; a fourth border grey pair; effectively non-responsive.
- **Canonical:** introduce a small `--player-*` surface group rather than forcing light-site
  tokens onto a media context; align type to the scale; add breakpoints.
- **Required changes:** ① type scale; ② border tokens; ③ responsive pass; ④ player surface group.
- **Priority:** P1 (responsive), P2 (visual).

### Certificates / pricing / wishlist / success / failure

- **Current:** inherit `style.scss` or `checkout.scss`.
- **Required changes:** tokens only; success/failure follow Checkout's normalisation.
- **Priority:** P2/P3.

## 45. Checkout vs Cart vs Detail Comparison

| Property                | Course detail            | DailyClass detail                  | LiveSession detail           | Cart                         | Checkout                      | Recommended Workshop standard                                             |
| ----------------------- | ------------------------ | ---------------------------------- | ---------------------------- | ---------------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| **Page background**     | `#fff`                   | `#fff` + `#fafafa`                 | `#fff`/`#ffffff` + `#f8f9fa` | `#fff` + warm tints          | `#ffffff` + `#fff`            | `--surface-page` (`#fff`)                                                 |
| **Card background**     | `#fff`                   | `#fff`                             | `#fff`/`#ffffff`             | `#fff`                       | `#ffffff`                     | `--surface` (`#fff`)                                                      |
| **Card radius**         | `8px` body / `12px` rail | `8px` + `12px`                     | `8px` (+`12px` review)       | `12px` (+`20px` shell)       | **`16px`** + `12px` (+`14px`) | `--radius-md` cards; `--radius-lg` panels                                 |
| **Border width**        | 1px                      | 1px                                | 1px (+1×`3px`)               | 1px                          | **1.5px** + 2px               | `1px` (`2px` for emphasis)                                                |
| **Border colour**       | `#e2e8f0` / `#e8edf3`    | `#eee` ×8, `#e2e8f0` ×4, accent ×2 | `#eee` ×12, accent ×1        | `#eee`, `#e2e8f0`, `#edf2f7` | **`#f0e6e0`** + `#e2e8f0`     | `--color-border`; `--color-border-accent` for emphasis                    |
| **Shadow**              | subtle + hover           | —                                  | —                            | hover                        | —                             | `--shadow-sm` rest, `--shadow-md` hover                                   |
| **Section padding**     | own                      | own                                | own                          | own                          | own                           | `--section-y` (`100px`) / `-sm` (`60px`)                                  |
| **Button radius**       | own                      | `8px` + **`6px`**                  | `8px` + **`6px`**            | `6px`                        | own                           | `--radius-sm` (6px), one hierarchy                                        |
| **Input radius**        | own                      | `8px`                              | `8px`                        | `6px`                        | **`10px`**                    | `--radius-sm` (6px)                                                       |
| **Input border**        | —                        | `#e2e8f0`                          | `#e2e8f0`                    | `#d1d5db`                    | `1.5px #e2e8f0`               | `1px --color-border`                                                      |
| **Badge radius**        | own                      | `50px`/`8px`/`20px`/`4px`          | `50px`/`8px`/`4px`           | `4px`/`6px`                  | status tints                  | `--radius-pill` (status); `--radius-xs` (numeric)                         |
| **Typographic density** | `14/15px`                | `12/14/15/16px`                    | `13/14/15/20px`              | `13/14px`                    | `12/13/14/15px`               | `--text-body` 15px, `--text-body-sm` 14px; checkout keeps its denser pair |

**What this exposes — the inconsistencies the implementation sprint must fix:**

1. **Five different card radii** for five architecturally equivalent surfaces (`8` → `12` → `16`).
2. **Cart and Checkout disagree with each other and with the detail pages** on card radius,
   border width _and_ border colour — three independent axes of divergence.
3. **Checkout is alone on `1.5px`, `#f0e6e0` and `10px` inputs.**
4. **Cart is alone in using three neutral greys on one page.**
5. **The two detail pages are nearly identical to each other** (both `8px` + `#eee` + two button
   radii) — so the fix is a shared token, not a per-page decision. Their only real differences
   are `#fafafa` vs `#f8f9fa`, 17 vs 15 `@media`, and one stray `3px` border.
6. **Checkout's density is the one intentional difference worth keeping** — but its radius,
   border and input scale are not part of that intent.

## 46. Responsive Consistency Audit

`@media` counts are exact; **behaviour is not verified** without a render.

| Stylesheet                |  Lines | `@media` | Assessment                                       |
| ------------------------- | -----: | -------: | ------------------------------------------------ |
| `style.scss`              | 11,231 |      456 | dense but sprawling; covers `#Nav`, footer, cart |
| `blog.scss`               |    632 |       72 | good                                             |
| `HomeFAQ.scss`            |    376 |       51 | good                                             |
| `contact.scss`            |    255 |       36 | good                                             |
| `about.scss`              |    411 |       27 | good                                             |
| `live-stream.scss`        |    660 |       25 | adequate                                         |
| `checkout.scss`           |    779 |       17 | adequate                                         |
| `daily-live-details.scss` |    878 |       17 | adequate                                         |
| `live-yoga-details.scss`  |    946 |       15 | adequate                                         |
| `main.scss`               |    659 |    **5** | **weak — nav-adjacent chrome + all popups**      |
| `notification.scss`       |    582 |    **3** | **weak**                                         |
| `learning-player.scss`    |  2,034 |    **2** | **effectively fixed-width**                      |
| `unifiedCart.scss`        |    228 |    **0** | **none — the commerce layer**                    |
| `daily-class-player.scss` |     13 |        0 | dead file                                        |

**Findings.**

1. **Responsiveness is a per-file accident, not a system property.**
2. **The two largest gaps are the commerce layer (`unifiedCart.scss`, 0) and the player
   (2,034 lines, 2 queries).** The commerce layer owns the coupon field, validation badges,
   domain rows and quantity controls — all control-adjacent UI.
3. **`main.scss` covers every popup (modal) with only 5 queries**, which is why the product
   popup resorts to `border-radius: 0 !important` on mobile (§21).
4. **Radius, border and padding are re-declared inside media queries** in several files —
   which is exactly where the inconsistencies multiply, because a value changed at desktop is
   not automatically changed at the breakpoint.

**Per-breakpoint checks required once a render is available** (none of these can be answered
from source): whether radius changes between breakpoints; whether borders disappear
inconsistently; whether section padding changes unpredictably; whether cards, buttons and
inputs change dimension without semantic reason; whether container widths differ; and whether
the cart/checkout columns reflow consistently. **Recommended breakpoint tokens:**
`--bp-sm: 640px`, `--bp-md: 768px`, `--bp-lg: 1024px`, applied per shared component rather than
per file.

## 47. Prioritized Findings

Priorities are **implementation order, not quality scores**.

| #   | Priority | Finding                                                                                                                          | Affected pages                                        | Affected components                                      | Current                       | Recommended                               | Complexity  |
| --- | -------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------- | ----------------------------- | ----------------------------------------- | ----------- |
| 1   | **P0**   | `rgba(var(--primaryColor), …)` ×4 is invalid CSS — those shadows **render nothing**                                              | cart, order summary, checkout-adjacent (`style.scss`) | accent cards/CTAs                                        | `rgba(#874429, 0.3)`          | `rgba(var(--color-primary-rgb), 0.3)`     | **trivial** |
| 2   | **P0**   | 4 competing `--primaryColor` fallbacks (`#ff725e` ×37, `#d97706` ×16, `#0f172a` ×2)                                              | notifications, contact, style, player                 | all brand accents                                        | wrong colours on failure      | remove fallbacks                          | **trivial** |
| 3   | **P0**   | No token layer (5 vars)                                                                                                          | all (33 routes)                                       | all                                                      | literals everywhere           | `_tokens.scss` (§35–§41)                  | medium      |
| 4   | **P0**   | 15 compiled `.css` committed beside 18 `.scss`; mixed imports                                                                    | all                                                   | all                                                      | ambiguous ownership           | one loading mechanism                     | medium      |
| 5   | **P0**   | No shared `Card`/`Button`/`Input`/`Badge`/`Section`                                                                              | all                                                   | all                                                      | repeated selectors in globals | shared primitives (§42)                   | high        |
| 6   | **P1**   | ~10 neutral border greys                                                                                                         | all                                                   | cards, inputs, dividers                                  | 10 values                     | `--color-border` (+muted/strong/accent)   | medium      |
| 7   | **P1**   | 17 radius values; 6 with no role                                                                                                 | all                                                   | cards, buttons, inputs, badges, modals                   | 17 values                     | 7-step scale (§36)                        | medium      |
| 8   | **P1**   | 4 spellings of white; 7–8 muted greys; 4 warm tints                                                                              | all                                                   | all surfaces                                             | 158 + 40 declarations         | surface tokens (§38)                      | medium      |
| 9   | **P1**   | 22 font sizes incl. `13.5px` ×23, `12.5px` ×11                                                                                   | all; worst in player                                  | all text                                                 | 22 values                     | type scale (§39)                          | medium-high |
| 10  | **P1**   | **Cart / Checkout / Detail divergence** (radius, border width, border colour)                                                    | cart, checkout, detail ×3                             | cards, inputs                                            | 3 visual languages            | one card/input standard (§45)             | medium      |
| 11  | **P1**   | Badge family spans 6 radii, incl. the new registration badges                                                                    | detail ×2, cart, notifications                        | badges                                                   | `4`–`50px`                    | `--radius-pill` / `--radius-xs`           | low         |
| 12  | **P1**   | Two button radii inside one page                                                                                                 | DailyClass, LiveSession detail                        | sidebar buttons                                          | `8px` + `6px`                 | `--radius-sm`                             | low         |
| 13  | **P1**   | Course detail mixes two card systems on one page                                                                                 | Course detail                                         | body cards vs product rail                               | `8px` + `12px` languages      | one detail-card token                     | medium      |
| 14  | **P1**   | `unifiedCart.scss`: 0 `@media`                                                                                                   | cart                                                  | coupon, badges, qty, domain rows                         | no responsive rules           | breakpoints per component                 | medium      |
| 15  | **P2**   | Checkout `1.5px` borders + `#f0e6e0` + `14px` outlier + `10px` inputs                                                            | checkout, success, failure                            | cards, inputs                                            | unique to one page            | `1px`, `--color-border`, `--radius-sm`    | low         |
| 16  | **P2**   | Modal system: `20px`/`24px`/`18px`/`0 !important`, 3 scrims, 1 divergent shadow, commented-out dead style                        | all popups                                            | `ProductDetailPopup`, `ReviewPopup`, `VideoPreviewPopup` | 3 radii + override            | `Modal` + `--radius-xl` + scrim tokens    | low         |
| 17  | **P2**   | Loading/empty/error states ad-hoc; inline JS styling; mismatched skeleton radii; no `EmptyState`/`ErrorState`; no error boundary | all                                                   | skeletons, empty cart, failures                          | inconsistent                  | `Skeleton`, `EmptyState`, `ErrorState`    | medium-high |
| 18  | **P2**   | 16 shadows (10 once) vs 15 `box-shadow: none`                                                                                    | all                                                   | cards, modals, buttons                                   | no scale                      | `--shadow-sm/md/lg/xl` (§41)              | low         |
| 19  | **P2**   | `main.scss`: 5 `@media` for popups + nav-adjacent chrome                                                                         | all                                                   | header chrome, modals                                    | weak                          | split ownership, add breakpoints          | medium      |
| 20  | **P2**   | `learning-player.scss`: 2 `@media` / 2,034 lines; own type dialect                                                               | player ×3                                             | player                                                   | fixed-width, `13.5px`         | responsive pass + type scale              | medium      |
| 21  | **P2**   | `notification.scss`: 3 `@media`, coral fallback                                                                                  | notifications                                         | cards, pill                                              | weak                          | breakpoints + fallback removal            | low         |
| 22  | **P2**   | About `24px` card; blog `4px` cards; blog's unique dashed border                                                                 | about, blog                                           | cards                                                    | extremes                      | fold to scale, name the variant           | low         |
| 23  | **P2**   | Profile area: 15 components, no owned stylesheet                                                                                 | profile, auth ×8                                      | all                                                      | un-owned styling              | adopt primitives; consider `profile.scss` | medium      |
| 24  | **P3**   | `0px` instead of `0`; `height: 100vh` on `.shimmer`                                                                              | various                                               | —                                                        | hygiene                       | —                                         | trivial     |
| 25  | **P3**   | Five stray "copy" files; dead `daily-class-player.scss`                                                                          | —                                                     | —                                                        | dead code                     | delete                                    | **trivial** |

## 48. Recommended Implementation Sprint Breakdown

| Sprint             | Scope                                                                                                                                                                                                                  | Pages affected                                                                    | Components affected                                     | Tokens affected                   | Risk                    | Tests                                                                            | Expected result                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------- | ----------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **WORKSHOP-DS-01** | **Correctness:** fix the 4 invalid `rgba()` shadows; delete the 3 wrong fallback values; delete the 5 "copy" files + dead `daily-class-player.scss`; remove the commented-out dead style                               | notifications, contact, cart, order summary (brand correctness); all (dead files) | accent cards/CTAs                                       | —                                 | **low**                 | grep assertions for the invalid pattern and for stray fallbacks; build must pass | brand colour correct on every surface; 4 shadows restored; dead files gone    |
| **WORKSHOP-DS-02** | **Global design tokens:** add `_tokens.scss` (§35–§41), alias `--primaryColor`, add shadow/radius/spacing/type/surface/border/overlay tokens, add breakpoint tokens. **Resolve the `.css`/`.scss` loading mechanism.** | none changed (values identical)                                                   | none                                                    | **all**                           | **medium-high**         | every route checked for **no visual change**; production build                   | one token layer; one unambiguous stylesheet mechanism                         |
| **WORKSHOP-DS-03** | **Container + section system:** `PageContainer`, `Section`, spacing scale, section rhythm                                                                                                                              | all                                                                               | layout shells                                           | spacing, surface                  | medium                  | visual diff per page at 3 widths                                                 | consistent section rhythm app-wide                                            |
| **WORKSHOP-DS-04** | **Cards + border + radius:** `Card`, `Surface`; collapse 10 greys → tokens; 17 radii → 7 steps                                                                                                                         | all                                                                               | every card type                                         | radius, border, surface, shadow   | medium                  | visual diff per page; card matrix re-checked                                     | one card standard                                                             |
| **WORKSHOP-DS-05** | **Buttons + form controls:** `Button` (full hierarchy), `Input`/`FormField`, focus/error/disabled states                                                                                                               | all form surfaces                                                                 | ~15 button classes, inputs                              | radius-sm, spacing, border, focus | medium                  | visual diff; state checks **(requires render)**                                  | one button hierarchy; one input style                                         |
| **WORKSHOP-DS-06** | **Course / DailyClass / LiveSession:** detail pages + listings, using `live-yoga-details.scss` as the model                                                                                                            | 6 routes                                                                          | detail cards, related-product rails, badges             | all                               | medium                  | visual diff per page                                                             | detail pages share one language                                               |
| **WORKSHOP-DS-07** | **Cart + Checkout:** normalise radius/border/inputs; extract shared `OrderSummary`; **add the missing responsive rules**                                                                                               | cart, checkout, success, failure                                                  | cart item, summary, checkout sections, courier selector | all                               | **high — revenue path** | functional + visual + responsive                                                 | the brief's central complaint resolved; server-authoritative totals untouched |
| **WORKSHOP-DS-08** | **Remaining pages:** home, blog, about, contact, notifications, profile/auth, certificates, pricing, wishlist                                                                                                          | ~20 routes                                                                        | listing cards, content cards                            | all                               | medium                  | visual diff per route                                                            | app-wide consistency                                                          |
| **WORKSHOP-DS-09** | **Modal + state system:** `Modal`, `Skeleton`, `EmptyState`, `ErrorState`; unify scrims and radii                                                                                                                      | all                                                                               | popups ×3, viewer, all loading/empty/error              | overlay, radius-xl                | medium                  | modal + state checks at 3 widths                                                 | consistent overlays and states                                                |
| **WORKSHOP-DS-10** | **Player:** responsive pass + type scale; introduce the player surface group                                                                                                                                           | player ×3                                                                         | player                                                  | type, border, player surfaces     | medium                  | visual diff at 3 widths                                                          | player responsive and on-scale                                                |
| **WORKSHOP-DS-11** | **Responsive + visual regression:** enforce breakpoint coverage per component; adopt visual regression tooling; retire the `.css` duplication if deferred                                                              | all                                                                               | all                                                     | breakpoints                       | medium                  | 640/768/1024 on every route                                                      | responsive consistency **proven**, not assumed                                |

**Sequencing rules.** DS-01 ships independently today. **DS-02 must precede everything else** —
it defines the tokens and removes the ambiguity about which stylesheet ships. DS-07 (revenue)
should not share a change window with DS-06. DS-11 depends on tooling that does not currently
exist.

## 49. Risks and Dependencies

1. **§2's verification limitation is the top risk.** Without a render, correctness of a
   _visual_ change cannot be asserted. Every sprint except DS-01 therefore depends on either
   a human review pass or new visual-regression tooling. **Recommendation: adopt tooling in
   DS-11, or earlier if one can be introduced without new infrastructure.**
2. **The mixed `.css`/`.scss` loading is the biggest execution risk.** Until resolved, an
   agent may edit a source that no page loads and report success. This has already happened
   once in this codebase (a previous change had to be mirrored into `style.css` and
   `style.scss` by hand). **It must be settled in DS-02.**
3. **Two global stylesheets plus per-page stylesheets mean computed value depends on load
   order.** Which rule wins today is **unverified**. Confirm before DS-04.
4. **`style.scss`'s 456 media queries** mean global radius/padding changes can cascade into
   breakpoint regressions across many pages at once.
5. **Brand drift risk.** `#ff725e` and `#d97706` are already in the codebase as fallbacks. A
   refactor that resolves tokens by string substitution could propagate them. **DS-01 first.**
6. **Specificity debt.** Much of the current inconsistency is resolved by specificity and load
   order rather than intent (e.g. `border-radius: 0 !important` on the mobile popup). Removing
   rules can surface long-dormant declarations.
7. **Scope discipline is a genuine risk in the other direction.** A uniform-looking sweep would
   flatten the intentional variation in §33A — the brown footer, the warm cart tints, the
   checkout's density, the player's dark surfaces, blog's dashed border.
8. **No `docs/` convention existed in this repo** before this audit; the report path
   (`frontend/docs/`) is new and may not match how other documentation is stored.
9. **No error boundaries and no `EmptyState`/`ErrorState`** exist, so DS-09 introduces new
   components rather than normalising existing ones — slightly higher risk of scope creep.
10. **Dependency:** the two P0 defects are independent of the token layer and should not wait
    for DS-02.

## 50. Final Audit Conclusion

**1. What is the current Workshop visual design language?**
A warm, brown-led brand: `#874429` with a deeper hover and a yellow secondary, a pale
blue-grey sticky 80px header, a solid brown footer, a 4px brown accent bar used as a
section-heading motif, pill badges, circular icon controls, and cream-tinted warm surfaces on
the cart and notifications. It is applied consistently enough to read as one product — the
brand is not in question.

**2. Does Workshop currently have a coherent design system?**
**No.** It has a coherent _brand_ and a _styling method_. Only five CSS custom properties
exist, and none of them describes a surface, border, radius, spacing step, shadow, type size
or status colour. Everything else is a literal at the use site: 17 radius values, ~10 neutral
border greys, 4 spellings of white, 7–8 muted-surface greys, 22 font sizes, 16 shadows.

**3. Where are the biggest inconsistencies?**
In order: (a) the missing token layer, which causes everything else; (b) ~10 neutral border
greys for one role; (c) 17 radius values, 6 with no semantic role; (d) the cart ↔ checkout ↔
detail divergence across three independent axes; (e) 22 font sizes with two fractional ones;
(f) the badge family's 6 radii; (g) 15 compiled `.css` files committed beside their sources
with mixed imports.

**4. Which radius values should become canonical?**
Seven semantic levels, ratified from usage: `2px` (xs), `6px` (sm — inputs/small buttons,
66 uses), `8px` (md — cards, **80 uses, the modal value**), `12px` (lg — panels/modals, 60
uses), `16px` (xl — large containers), `50px` (pill — badges), `50%` (circle).
`15px`, `14px`, `18px`, `25px`, `5px`, `30px` map to no role and should be folded away.

**5. Which border widths should become canonical?**
**`1px`**, universally. `2px` for emphasis/selection. **`4px` only for the existing accent bar.**
`1.5px` retires (it exists only in checkout); the lone `3px` folds to `2px`.

**6. Which border colors should become canonical?**
One neutral — **`#e2e8f0`** (already the most-used at ×40) — with `#f1f5f9` for dividers and
`#cbd5e1` for strong/selected. **And one accent: the brown border, promoted to
`border-accent`.** It is already used in 13 stylesheets, including the cart; it should be
named and applied consistently rather than removed or confined.

**7. Which background/surface colors should become canonical?**
`#ffffff` for page/surface (**collapsing 158 declarations across 4 spellings**), `#f8fafc`
for muted sections and `#f1f5f9` for subtle/inset (collapsing 7 greys), `#fffcfb` for the warm
brand tint (collapsing 4), the existing `#f2f6fc` for the header **as its own token** (it
currently doubles as a generic muted grey and so cannot be changed safely), and the existing
brand brown for the footer as an inverse surface.

**8. Which components need to become shared?**
In priority order: **`Card`** (the single highest-leverage change), **`Button`** (there are
~15 bespoke classes and no hierarchy at all), **`Input`/`FormField`**, **`Badge`** (mechanical),
**`Section`** and **`PageContainer`**, **`Modal`**, **`ProductCard`**, **`OrderSummary`**,
and the missing **`Skeleton`/`EmptyState`/`ErrorState`**. `CourseCard.scss`,
`Breadcrumbs.scss` and `TeacherBox.scss` should be promoted as references rather than replaced.

**9. Which pages need the most normalization?**
**Checkout** (most divergent: `16px`, `1.5px`, `#f0e6e0`, `10px` inputs, one `14px` outlier),
then **Cart** (three neutral greys, two card radii, zero responsive rules), then **Course
detail** (two card systems on one page), then **DailyClass detail** (three border colours, two
button radii), then **the player** (2 `@media` in 2,034 lines, own type dialect). LiveSession
detail is the **most consistent** page and should be migrated last, as the reference.

**10. How should Cart and Checkout be brought into the same design language as
Course/DailyClass/LiveSession?**
By treating them as _consumers of the same tokens_, not as exceptions: `radius-lg` cards,
`radius-sm` inputs and buttons, `1px --color-border`, `--color-border-accent` for the brown
emphasis, and `--surface-accent-subtle` for the warm tints. **Checkout's density (`12px`/`13px`),
its step/progress affordance and its status colours are intentional and must be kept** — they
are what make it a checkout. Its radius scale, border width and `#f0e6e0` hue are not part of
that intent and are the four things to normalise. The cart's brown border should be preserved
and tokenised, not removed.

**11. Which differences should intentionally remain?**
The brown brand palette; the solid brown footer; the `#f2f6fc` header; the 4px accent bar;
`50px` pill badges and `50%` circular controls; the warm cream tints on cart/notifications;
checkout's denser typography and its progress indicator; status colours distinct from the brand;
blog's dashed secondary-state border; and the player's darker media surfaces. **These are the
product's character, and a unification pass that removes them has failed.**

**12. What is the recommended implementation order?**
**Fix the two defects first, separately, today** — the four invalid `rgba()` shadows that
render nothing, and the three stylesheets carrying wrong brand-colour fallbacks. Then land the
token layer and **resolve the compiled-`.css` loading mechanism**, because nothing downstream
is trustworthy until it is known which stylesheet ships. Then shared primitives (Card, Button,
Input, Badge), then the content pages using LiveSession detail as the model, then Cart and
Checkout, then the remaining pages, then modals and states, then the player, then responsive
and visual-regression enforcement. Full sequencing, scope and risk per sprint: §48.

**One thing gates all of it:** `app/layout.js` loads compiled CSS while pages load a mix of
compiled and source SCSS, with 15 compiled files committed beside their 18 sources. Until that
is resolved, nobody can be certain which stylesheet a change actually reaches — and that
uncertainty, more than any single value in this report, is what has allowed the drift to
accumulate. **Fix that first, and the rest of this audit becomes mechanical.**
