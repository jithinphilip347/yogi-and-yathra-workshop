# Workshop DS-03 Implementation Report

**PageContainer + Section System**

Sprint: **WORKSHOP-DS-03**
Repository: `Yogify-workshop/frontend` (branch `main`)
Base commit: `5da895b` — *refactor: migrate styles to design system tokens and remove compiled CSS files* (DS-01/DS-02, committed by the repo owner at 12:30 while this sprint was in progress)
Scope: Workshop customer-facing frontend only. No backend, admin panel, E-commerce frontend or E-commerce backend touched.

Status: **PASS**, with one item deliberately not adopted (see §14) and one environment defect found and fixed (§2.4).

---

## 1. Architecture Audit

Performed before any file was written, and it changed the design in four ways.

**Stack, confirmed rather than assumed.** No Tailwind, no Bootstrap, no CSS Modules, no styled-components. The styling idiom is plain global SCSS plus `className` strings, so the correct shape for these primitives is *SCSS classes consumed by thin JSX components* — not CSS-in-JS and not a component-local stylesheet.

**The container question had a different answer than expected.** Searching for container patterns returned `max-width` values of 480/768/1024px hundreds of times — but those are **media-query breakpoints, not content widths**. The real container is defined once, in `main.scss:61`, and it has **no max-width at all**:

```scss
.container {
    width: calc(100% - 200px);
    margin: 0 auto;
    @media (max-width: 1800px) { width: calc(100% - 100px); }
    @media (max-width: 1024px) { width: calc(100% - 60px); }
    @media (max-width: 480px)  { width: calc(100% - 32px); }
}
```

It is defined by **gutters**. `.container` is used **52 times** in JSX, making it the de-facto page container. Verified live at 1440px: it computes to **1340px**, identically on Course Detail, About and Contact.

**Two vertical rhythms exist, not one.** Band sections use `padding: 100px 0` (14 uses) and `60px 0` (18 uses). Content pages use a completely different rhythm: Course Detail stacks `.HighlightBox` cards with `margin-bottom: 30px` and has no band padding at all. `30px` appears **95 times** as a margin/padding/gap — and had **no token** in the DS-02 scale.

**The `.css` twins came back, from a tool.** During this sprint the 14 compiled `.css` files deleted in DS-01/02 reappeared on disk with an mtime of 12:34 — untracked, so not restored by git. The producer is local editor tooling: the **Antigravity IDE's Sass extension** recompiles every `.scss` to a sibling `.css` on save (no sass watch process is running, and `package.json` has no such script). This is documented in §2.4 and fixed durably.

---

## 2. Existing Layout Patterns Found

### 2.1 Containers

| Pattern | Where | Measured value |
|---|---|---|
| Global `.container` | `main.scss:61` | `calc(100% - gutter)`, `margin: 0 auto`, **no max-width** |
| Gutters | same | **100px / 50px / 30px / 16px** at ≥1800 / ≤1800 / ≤1024 / ≤480 |
| Rendered width @1440 | Course Detail, About, Contact | **1340px**, `padding: 0px` |
| Page-scoped overrides | `about.scss:7`, `checkout.scss:49,131` | `max-width: 1280px` / `1100px` |
| `.container` uses in JSX | app-wide | **52** |

Note: the `about.scss` scoped override (`max-width: 1280px; padding: 0 24px`) does **not** win at any tested width — About renders the global 1340px. The page-scoped rules are effectively dead, which is exactly the duplication DS-03 removes.

### 2.2 Sections, spacing and bands

| Pattern | Frequency in source |
|---|---:|
| `padding: 100px 0` | 14 |
| `padding: 60px 0` | 18 |
| `padding: 40px 0` / `30px 0` | 12 / 12 |
| `margin/padding/gap: 30px` | **95** |
| `margin-bottom: 25px` (heading gap) | reference heading |

Home's `#HomeBanner` measured at 1440px: full-bleed `<section>` (1440px wide), `padding: 60px 0 0`, with `.container` nested inside for content width. **That is the band pattern the primitive encodes.**

Markup convention is mixed: Home uses `<section id="...">` (ID selectors), Course Detail uses `<section className="...">`. There is no existing class-based band convention, which is why `Section` is new rather than a rename.

### 2.3 Course Detail — the reference page, measured at 1440px

| Element | Measured |
|---|---|
| `.container` | 1340 × 69, no padding |
| `.HighlightBox` | `#fff`, `12px` radius, **`padding: 35px`**, `1px solid #e2e8f0`, `margin-bottom: 30px` |
| `.HighlightBox h3` | **24px**, weight 600, `rgb(26,26,26)`, `margin-bottom: 25px`, `line-height: normal`, **`border-left: 0px`** |

`.HighlightBox` is defined **twice** in `style.scss` — block A (`35px` padding, `24px` heading) and block B (`30px` padding, `22px` heading). **Measurement settled it**: block A wins on Course Detail. Source order alone could not answer this, which is why the browser was used.

### 2.4 The compiled-`.css` producer (environment defect)

DS-01/02 deleted 15 compiled `.css` twins (30 files) and repointed every consumer to `.scss`. During DS-03, **14 `.css` + 14 `.css.map` files reappeared**, untracked, all stamped 12:34 — immediately after I had been saving `.scss` files.

- Not git: they were newly created, not restored from the index (`??` status).
- Not the build: `next build` writes to `.next/`, never into `src/`.
- Not an npm script: `package.json` has no compile/watch script; `sass` is only a devDependency.
- **Cause**: the running **Antigravity IDE** has a Sass compile-on-save extension that writes each `.scss`'s output beside it.

DS-02's structural guard caught this within one test run, which is the guard working as intended. The durable fix is in §8: the twins are now **git-ignored**, so local regeneration can never be committed. The guard was also rewritten to assert the *ignore rule* rather than filesystem absence — a filesystem assertion would fail on any developer's machine the moment they saved a stylesheet, while telling us nothing about what is committable.

---

## 3. PageContainer Design

`src/components/layout/PageContainer.jsx` — emits `className="container"`, so migrating a page is a **zero-pixel change**.

```jsx
<PageContainer>                        // className="container"
<PageContainer className="AboutBanner"> // className="container AboutBanner"
<PageContainer variant="full">         // + container--full
<PageContainer variant="narrow">       // + container--narrow (860px cap)
```

Design decisions:

- **The gutter scale is not redefined.** `.container` keeps exactly one owner (`main.scss`), and `layout.scss` adds **only modifiers**. A test asserts `layout.scss` contains no bare `.container {` rule — this is the guard against the "two competing container systems" the sprint forbids.
- **No max-width is introduced for the default variant**, because the existing container has none. Adding one would have changed every page's width at large viewports.
- `full` and `narrow` are additive modifiers for cases the app does not have today, so nothing can regress.
- `as` lets a page render `main`/`section` without a wrapper div.

---

## 4. Section Design

`src/components/layout/Section.jsx`, plus `SectionStack` from the same module.

```jsx
<Section surface="muted" size="sm">   // band: padding-block + background
  <PageContainer>…</PageContainer>
</Section>

<SectionStack>                        // content rhythm: gap between children
```

`Section` encodes the **band** rhythm (full-bleed, `padding-block`, optional surface, container nested inside). `SectionStack` encodes the **card** rhythm that content pages actually use (`> * + *` gap), so the parent owns vertical spacing and no child needs a margin of its own.

Sizes map to existing tokens: `default` → `--section-y` (100px, the major band), `sm` → `--section-y-sm` (60px, Home's measured band), `flush` → 0 for a surface-only band.

**`Section` is deliberately not applied to any existing page.** Applying band padding to a page that already has its own rhythm *adds* spacing — Course Detail would gain 100px bands it never had. DS-03 creates the primitive; adoption belongs with the page migrations (§14).

---

## 5. Token Usage

DS-03 added **12 tokens**, taking the layer from 92 to **104**, and `layout.scss` introduces **zero literal values** (a test asserts its comment-stripped source contains no hex colour at all).

| Token | Value | Provenance |
|---|---|---|
| `--surface-tinted` | `#f2f6fc` | the measured shared tint (§6) |
| `--container-gutter` | `100px` | `main.scss` gutter scale |
| `--container-gutter-lg` | `50px` | " |
| `--container-gutter-md` | `30px` | " |
| `--container-gutter-sm` | `16px` | " |
| `--container-narrow` | `860px` | single-column reading width |
| `--section-gap` | `30px` | **measured**, 95 uses, no DS-02 step |
| `--heading-gap` | `25px` | **measured** from `.HighlightBox h3` |
| `--text-card-title` | `24px` | **measured** reference card heading |
| `--text-card-title-md` | `20px` | measured @1024 |
| `--text-card-title-sm` | `18px` | measured @768 |
| `--color-heading` | `#1a1a1a` | measured heading colour (`rgb(26,26,26)`) |

Two of these exist because the DS-02 scale had **no step for a real measured value**: `30px` (95 uses) and `25px`. Rounding them to 32px and 24px would have moved actual pixels on content pages, so they are recorded as their own measured tokens rather than approximated. Same for `24px`, which sits between `--text-h3` (20px) and `--text-h2` (26px) despite 39 declarations in the source.

No existing token was renamed, removed, or given a new value. `--primaryColor` and its four siblings remain declared once, in `main.scss`.

---

## 6. Header Surface Decision

**Decision: keep the header visually identical, and correct the model of what that colour is.**

DS-02 recorded `--surface-nav: #f2f6fc` with a note that the header "shares this exact literal with generic muted surfaces." DS-03 measured every consumer of the literal, and the real list is different and more specific — **six surfaces, not "generic muted"**:

| Consumer | Line |
|---|---|
| `#Nav` — the sticky header | `style.scss:8` |
| `.HomeBannerBottomLeft` | `style.scss:1195` |
| `.HomeBannerBottomRight` | `style.scss:1219` |
| `.TestimonialCard` | `style.scss:3102` |
| `.MobileFilterBtn` | `style.scss:7018` |
| `.CourseFilter` | `style.scss:7046` |

So `#f2f6fc` is a **shared cool tint** — a hero callout, a card, and two filter controls use it too. It is *not* the header's private colour, and `--surface-muted` (`#f8fafc`, 32 uses) is a genuinely different value.

**Answer to the sprint's question** — should generic muted sections remain identical to the navigation surface, or be separated? They are **already separate values**; what was wrong was the naming. `#f2f6fc` is now declared once as `--surface-tinted`, and `--surface-nav: var(--surface-tinted)` **aliases** it.

Why this is strictly better than leaving it as it was:

- The rendered value is unchanged — both resolve to `#f2f6fc` (verified in the browser, §12).
- There is now exactly **one** declaration of the literal (a test asserts the count is 1), so the six consumers cannot drift apart.
- Diverging the header from the other five — if that is ever wanted — is now a **one-line repoint of the alias** instead of an edit to six selectors in a 11,231-line file.

That last point is the whole reason to do it now: DS-03 is the sprint that touches containers and backgrounds, so it is the last cheap moment to name this correctly.

---

## 7. Section-Heading Implementation

`src/components/layout/SectionHeading.jsx` → `.SectionHeading` in `layout.scss`.

Every value is the **measured** reference scale from Course Detail (§2.3), not an invention: `24px` / weight 600 / `var(--color-heading)` / `margin-bottom: 25px`, responsively `20px` @1024 and `18px` @768 via `--text-card-title-md`/`-sm`.

**`line-height` is deliberately absent.** The measured reference heading computes `line-height: normal`; imposing `--leading-tight` (1.25) would have changed the look of the first page to adopt the primitive — the opposite of this sprint's mandate. A test asserts the rule contains no `line-height` declaration, with the reason recorded in the file. Tightening heading line-height is a typography decision for DS-04/DS-05.

### The 4px accent — a correction to the audit

The audit called the 4px brown bar a "section-heading motif, verified in 5 locations." Measured, that claim is **too broad in a way that matters**:

- It is a **panel/callout left-accent**, not a section-heading default. It appears at **6** sites.
- It is a **heading** accent at exactly **one**: `main.scss:452`, an `h4` sub-heading inside the product popup.
- **Course Detail's section headings have no accent at all** — `.HighlightBox h3` measures `border-left-width: 0px`.
- It carries **three colours**: brand `#874429` (×4), plus `#10b981` green and `#ef4444` red as semantic status accents (`live-stream.scss` `.PerfectFor`/`.NotFor`).

Therefore the accent is an **opt-in variant** (`accent` prop), never the default. Making it the default would have restyled every content heading and taken Course Detail away from its own reference look.

The accent is preserved exactly as the sprint requires, and stays distinct from an ordinary border **by construction**: 4px (`--border-accent-width`) brand (`--color-border-accent`) against 1px `--color-border`. Where it is a heading accent, `padding-left: var(--space-4)` reproduces the measured `padding-left: 12px` from `main.scss:452`. A test asserts the accent rule can never become a 1px border. The green/red status variants are deliberately **not** folded into the brand accent.

---

## 8. Files Changed

**Added (4 paths):**

| File | Purpose |
|---|---|
| `src/assets/css/layout.scss` | 174 lines — the primitives' classes |
| `src/components/layout/PageContainer.jsx` | canonical page shell |
| `src/components/layout/Section.jsx` | `Section` + `SectionStack` |
| `src/components/layout/SectionHeading.jsx` | canonical heading + opt-in accent |
| `src/__tests__/layoutPrimitives.test.js` | 22 tests |
| `scripts/dsMeasure.mjs` | dev tool: measure computed styles at a given width (see note below) |

**Modified (6):**

| File | Change |
|---|---|
| `src/assets/css/tokens.scss` | +12 measured tokens; `--surface-tinted` + `--surface-nav` alias |
| `src/app/layout.js` | imports `layout.scss` after `tokens.scss` |
| `src/app/course/[slug]/[id]/CourseDetails.jsx` | 3 × `div.container` → `PageContainer` |
| `src/app/about/About.jsx` | 4 × combined class → `PageContainer className=…` |
| `src/__tests__/designFoundation.test.js` | twins guard rewritten to the committable invariant |
| `.gitignore` | ignores `src/assets/css/*.css` and `*.css.map` (§2.4) |

**Not changed:** no cart, checkout, payment, product-association, backend, admin-panel or E-commerce file. No existing `.scss` rule was altered — `main.scss`, `style.scss` and the page stylesheets are untouched.

**Note on the two `scripts/` tools.** `dsVisualCheck.mjs` (from DS-01/02) and `dsMeasure.mjs` (new) are dependency-free dev utilities that drive headless Chrome over the DevTools Protocol. `dsMeasure.mjs` is what resolved the duplicate-`.HighlightBox` question and what produced the before/after equivalence proof in §13. Neither is referenced by the build, the tests, or lint. **If the repo should not carry them, delete them** — nothing depends on them.

---

## 9. Pages Migrated

Per §9 of the brief (Course Detail + one simple content page), and no more:

| Page | Sites | Change | Risk |
|---|---:|---|---|
| **Course Detail** (`/course/[slug]/[id]`) | 3 | `<div className="container">` → `<PageContainer>` | none — same class emitted |
| **About** (`/about`) | 4 | `<div className="AboutBanner container">` → `<PageContainer className="AboutBanner">` | none — same classes emitted |

Balanced and complete: Course Detail 3 open / 3 close, About 4 open / 4 close, and **zero** remaining `className="container"` in either file (asserted by tests, so a partial migration cannot be left behind).

`Section`, `SectionStack` and `SectionHeading` are **created and tested but not adopted** — see §14 for why, and what adoption requires.

---

## 10. Tests

```
Frontend full suite:              551 passed / 0 failed  (41 files)
  layoutPrimitives.test.js:        22 passed / 0 failed   (new)
Baseline after DS-02:             528 passed / 0 failed
```

Run with `npx vitest run`. The +23 is the 22 new primitive tests plus one net-new guard in `designFoundation.test.js`.

`layoutPrimitives.test.js` does not render — this repo runs vitest in a **`node`** environment with no jsdom and no DOM testing library, so it uses the two approaches that work here and are stronger for this codebase:

1. **Component contract tests.** Each component is called directly and the returned React element inspected — class composition is pure, so no DOM is needed, and `className` is exactly what every page depends on. Covered: default `container` emission, `full`/`narrow` variants, page-modifier merging (the behaviour About depends on), element overrides, `Section` size/surface mapping, unknown surfaces not resolving to a real token by accident, and `SectionHeading` accent being opt-in.
2. **Compiled-CSS assertions.** `layout.scss` is compiled with `sass` and the emitted CSS checked — the same approach the commerce tests adopted in DS-01/02 after the committed `.css` artifacts were removed. A `stripComments` helper is applied first, and that is not incidental: `sass` keeps loud comments in its output, and these files document the defects they prevent *by naming them*, so a raw-text assertion matches a comment instead of a declaration. That bug was hit twice while writing this suite.

Load-bearing guards:

- `.container` has **one owner** — `main.scss` defines it, `layout.scss` must not, and the modifiers must be additive.
- `SectionHeading` contains **no `line-height` and no `border-left`** — the no-visual-change guarantee.
- The accent can never become a 1px border.
- Responsive heading steps come from `--text-card-title-md`/`-sm` at 1024/768.
- `layout.scss` introduces **no hardcoded colour**.
- The token layer defines all 12 additions; `#f2f6fc` is declared exactly **once**; measured gaps are not rounded; `layout.scss` loads after `tokens.scss`.
- Compiled `.css` twins are **ignored by git**, and no tracked twin exists.
- Both migrated pages are balanced with no leftover `className="container"`.

ESLint: `npx eslint .` → 39 problems (11 errors, 28 warnings) — **byte-identical to the DS-02 baseline**, so DS-03 introduced none. All 11 errors live in files this sprint did not touch. The migrated files report 0 errors (4 pre-existing `<img>` warnings).

---

## 11. Build

```
npm run build  ->  ✓ Compiled successfully in 6.3s
                   ✓ Generating static pages using 7 workers (26/26) in 671.9ms
                   exit code 0
```

33 routes, rendering modes unchanged (`/course/[slug]/[id]`, `/daily-class/[id]/[slug]`, `/live-section/[id]/[slug]` and the rest still dynamic/static exactly as before).

Every new class ships exactly once (fixed-string check against the production bundle):

| Class | In shipped CSS |
|---|---:|
| `.Section{` | 1 |
| `.Section--sm{` | 1 |
| `.SectionStack` | 2 |
| `.SectionHeading{` | 4 (base + 2 breakpoints + inverse override) |
| `.SectionHeading--accent{` | 1 |
| `.container--narrow{` / `.container--full{` | 1 / 1 |

All 12 new tokens are present in the shipped CSS. `.HighlightBox h3` is still emitted, confirming no existing rule was displaced.

---

## 12. Browser Verification

Chrome 153 via the CDP harnesses, dev server on `:3001`. **6 routes × 4 widths = 24 renders** at 640 / 768 / 1024 / 1440.

| Route | 640 | 768 | 1024 | 1440 |
|---|---|---|---|---|
| `/` | ✅ | ✅ | ✅ | ✅ |
| `/course` | ✅ | ✅ | ✅ | ✅ |
| `/course/surya-namasakaram/12` | ✅ | ✅ | ✅ | ✅ |
| `/cart` | ✅ | ✅ | ✅ | ✅ |
| `/checkout` | ✅ | ✅ | ✅ | ✅ |
| `/about` | ✅ | ✅ | ✅ | ✅ |

- **Horizontal overflow: NONE** at any width on any route (0px everywhere) — the objective mobile-padding and breakpoint check.
- **Console errors: NONE** (no exceptions, no failed CSS requests).
- **Token layer resolved at every width, `MISSING` count = 0** — including `--surface-tinted`, `--color-heading` and the new layout tokens.
- Rendered text length on Course Detail (2488/2528) and About (2461/2501) is **unchanged** from the pre-migration baseline, per width.

Sprint-§11 items verified specifically: no horizontal overflow ✅, no console errors ✅, content width correct (`.container` = 1340px @1440 on both migrated pages) ✅, mobile horizontal padding works (`calc(100% - 32px)` at 640px, 0 overflow) ✅, section background tokens resolve ✅.

---

## 13. Visual Regression Findings

**Expected: layout remains visually equivalent. Achieved, and proven by measurement rather than asserted.**

A before/after baseline was captured at all four widths *before* the migration and diffed against the same measurement *after*:

| Page | 640 | 768 | 1024 | 1440 |
|---|---|---|---|---|
| Course Detail | ✅ IDENTICAL | ✅ IDENTICAL | ✅ IDENTICAL | ✅ IDENTICAL |
| About | class-attribute order only | same | same | same |

- **Course Detail: every measured computed value is byte-identical at all four widths** — container width/padding, `.HighlightBox` background, radius, padding, border, margin, and the `h3` font size, weight, colour and margin.
- **About: the only difference across all four widths is the order of names inside the `class` attribute** (`AboutBanner container` → `container AboutBanner`). Not a single computed property differs. Class-attribute order does not affect the cascade: both selectors have equal specificity and set different properties. This is the one and only "difference" DS-03 produces.

The 4px accent is preserved and still distinct (4px brand vs 1px neutral), and Course Detail's section headings still measure `border-left: 0px` — the accent was not imposed on them.

The rendered-radii census in the browser confirms the primitives changed nothing at rest: 13 distinct radii still render (4px, 50%, 8px, 12px, 6px, 15px, 50px, 16px, 20px, 24px, 14px, 10px, 5px) — the same set DS-02 measured, which is DS-04's work list.

### Honest limitations

- **No screenshots.** Both harnesses read computed styles; they do not composite images. A layout defect that a human eye would catch but computed styles would not — misalignment, overlap, a collapsed flex row — is **not** covered by this evidence.
- The 24 renders cover **6 of 33 routes**. The rest were verified by clean build and (in DS-01/02) HTTP 200, not by measurement.
- The About diff was read as "class order only" by inspection of two diff hunks per width. That judgement is reported as made, not hidden.

---

## 14. Remaining Migration Work

**The most important item: `Section`, `SectionStack` and `SectionHeading` are not yet adopted by any page.**

They are complete, token-backed, shipped in the bundle and covered by tests — but no page uses them yet, so they are **unexercised in production**. This is a deliberate scope decision, not an oversight, on two grounds:

1. Adopting `Section` on a page that already has its own rhythm **adds band padding**. Applying it to Course Detail would insert 100px bands the page never had — a real visual change, and precisely what §7 and §11 forbid this sprint.
2. `SectionHeading` cannot take effect on Course Detail anyway while `.HighlightBox h3` exists: that selector is `(0,1,1)` against `.SectionHeading`'s `(0,1,0)`, so the existing rule wins. The primitive becomes effective only when DS-04/DS-06 remove the page-scoped duplicates — which is exactly the right sequencing, not a problem to route around.

So the honest statement is: **the abstraction is built and proven, and its adoption is the next sprints' work.**

Carried forward from DS-02 as well:

| Item | Owner |
|---|---|
| 13 distinct radii still render; migrate to the 7-token scale | DS-04 |
| `.HighlightBox` defined twice (35px/24px vs 30px/22px) | DS-04 |
| `about.scss` / `checkout.scss` page-scoped `.container` overrides (dead at tested widths) | DS-04 |
| Three neutral greys on Course Detail (`#eee`, `#e2e8f0`, `#edf2f7`) | DS-04 |
| `1.5px` border (checkout-only) | DS-05 |
| Modal: four radii, three scrim opacities, `!important` on mobile | DS-09 |
| **No `error.js` / `not-found.js` boundary on any of the 33 routes** | DS-09 |
| `unifiedCart.scss` has 0 media queries; the 2,034-line player has 2 | DS-11 |
| `--surface-nav` may now be diverged from `--surface-tinted` — a decision, not a task | DS-04+ |

---

## 15. Recommended Next Sprint

**Proceed to DS-04 — Cards + Borders + Radius.**

Three reasons this is now the right next step:

1. **It has the most visible payoff.** 13 distinct radii render today across every surface in the product. DS-03 changed nothing on screen by design, so the visual work has not started yet.
2. **Its blocking dependency is now resolved.** DS-04 needs the 7-radius token scale (DS-02 ✅), the container/section primitives (DS-03 ✅), and a measured reference card shell (`.HighlightBox`: white, 12px, 1px `#e2e8f0`, 35px padding — measured in §2.3 ✅).
3. **It is the prerequisite for the primitives to matter.** `SectionHeading` is inert until the page-scoped heading rules are removed, and that removal *is* DS-04.

This is the same order deviation DS-02's report recommended, and DS-03 strengthens the case rather than changing it.

**Recommended DS-04 scope, in priority order:**

1. **Collapse the duplicate `.HighlightBox`** (35px/24px vs 30px/22px) — resolve by measurement (block A wins on Course Detail) and confirm which pages block B actually serves before touching it.
2. **Adopt `SectionHeading`** on Course Detail's card headings, removing the competing `.HighlightBox h3` font rules so the token scale takes over. Re-measure before/after — the values should match to the pixel.
3. **Migrate the 13 rendered radii** to `--radius-xs/sm/md/lg/xl/pill/circle`, starting with the six values that map to no semantic role (`15px`, `14px`, `18px`, `25px`, `5px`, `30px`).
4. **Remove the dead page-scoped `.container` overrides** in `about.scss` and `checkout.scss`.
5. **Leave Cart and Checkout alone** — they are DS-07, and per the audit they must not share a change window with the content-page work.

Two preconditions worth settling first: **decide whether to keep `scripts/dsMeasure.mjs` and `scripts/dsVisualCheck.mjs`** (nothing depends on them), and note that **`--surface-nav` can now be diverged from the shared tint** — if the header is meant to differ from the banner/testimonial/filter surfaces, DS-04 is the natural place to decide it.

---

## Definition of Done

| Item | Status |
|---|---|
| Existing DS-01/DS-02 foundation reused | ✅ tokens, source-of-truth pipeline, single brand declaration |
| One canonical PageContainer exists | ✅ `PageContainer.jsx` + `.container` single owner (asserted) |
| One canonical Section exists | ✅ `Section` + `SectionStack` (not yet adopted — §14) |
| Existing tokens are used | ✅ zero literals in `layout.scss` (asserted) |
| Course Detail remains visually stable | ✅ **byte-identical at 640/768/1024/1440** |
| 4px brown accent preserved | ✅ as an opt-in variant; never became 1px (asserted) |
| Header surface behavior documented | ✅ §6 — six consumers measured, aliased, value unchanged |
| No duplicated container system introduced | ✅ modifiers only; `.container` redefinition forbidden by test |
| Tests pass | ✅ 551/551 (41 files) |
| Build passes | ✅ exit 0, 33 routes |
| Browser verification passes | ✅ 24 renders, 0 overflow, 0 console errors |
| No commerce/backend/admin changes | ✅ 0 such files touched |
| Implementation report created | ✅ this document |

### Defects found

1. **The compiled `.css` twins were being regenerated by the IDE's Sass extension** after DS-01/02 deleted them (§2.4). Fixed durably by git-ignoring them, and the structural guard was rewritten to assert the committable invariant rather than filesystem absence — the earlier version would have failed on any developer's machine while proving nothing.
2. **DS-02's note about the header surface named the wrong coupling.** `#f2f6fc` has six specific consumers including a card and two filter controls, not "generic muted surfaces" (§6). Corrected, with the value unchanged.
3. **The audit's "4px accent = section-heading motif in 5 locations" was too broad.** It is a panel/callout accent used at 6 sites and a heading accent at exactly one; the reference page's section headings have none (§7).
4. **`.HighlightBox` is defined twice with different padding and heading sizes** (§2.3) — pre-existing, deferred to DS-04, now precisely measured.

Nothing is committed. The change set is 6 modified + 5 untracked paths in `Yogify-workshop/frontend`, sitting on top of the committed DS-01/02 base `5da895b`.
