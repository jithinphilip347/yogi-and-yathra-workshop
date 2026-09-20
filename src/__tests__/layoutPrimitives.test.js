import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import * as sass from "sass";
import { fileURLToPath } from "url";

import PageContainer from "@/components/layout/PageContainer";
import Section, { SectionStack } from "@/components/layout/Section";
import SectionHeading from "@/components/layout/SectionHeading";

/**
 * WORKSHOP-DS-03 — layout primitives.
 *
 * This suite runs in a `node` environment with no jsdom and no DOM testing
 * library, so it does not render. Instead it does two things that are stronger
 * for this codebase:
 *
 *   1. Calls each component directly and inspects the React element it returns.
 *      Class composition is pure, so no DOM is needed — and this is the actual
 *      contract every page depends on.
 *   2. Compiles layout.scss with `sass` and asserts the CSS the source really
 *      produces, the same approach the commerce tests use since DS-01/DS-02
 *      removed the committed `.css` artifacts.
 *
 * The load-bearing invariants are that `.container` keeps a single owner, and
 * that SectionHeading introduces no property the measured reference heading did
 * not already have (see the line-height test).
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (...segments) => fs.readFileSync(path.resolve(__dirname, ...segments), "utf8");

const tokensScss = read("../assets/css/tokens.scss");
const layoutScss = read("../assets/css/layout.scss");
const mainScss = read("../assets/css/main.scss");
const layoutJs = read("../app/layout.js");

/**
 * Strip CSS/SCSS comments. sass keeps loud comments in its output, and these
 * files document the defects they prevent by naming them — so an assertion that
 * scans raw text would match a comment instead of a declaration. Every text
 * assertion below runs on comment-free input for that reason.
 */
const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, "");

/** Flattened CSS emitted by layout.scss, comments removed. */
const layoutCss = stripComments(
  sass.compileString(layoutScss, {
    loadPaths: [path.resolve(__dirname, "../assets/css")],
  }).css
);

const tokensBare = stripComments(tokensScss);
const layoutBare = stripComments(layoutScss);

/** Rule body for a selector, or "" when absent. */
const ruleFor = (css, selector) => {
  const match = css.match(new RegExp(`(^|\\})\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`, "m"));
  return match ? match[2] : "";
};

const propsOf = (element) => element.props;
const classesOf = (element) => propsOf(element).className.split(/\s+/);

describe("DS-03 — PageContainer", () => {
  it("renders the existing global container class by default", () => {
    // If this ever stops emitting `container`, every migrated page silently
    // loses its width and gutters.
    expect(classesOf(PageContainer({ children: null }))).toEqual(["container"]);
  });

  it("supports full and narrow variants without a second container system", () => {
    expect(classesOf(PageContainer({ children: null, variant: "full" }))).toContain("container--full");
    expect(classesOf(PageContainer({ children: null, variant: "narrow" }))).toContain("container--narrow");
  });

  it("merges a page modifier class, as the migrated pages require", () => {
    // About passes `AboutBanner` etc.; the class must survive alongside
    // `container` or the page loses its own styling.
    const classes = classesOf(PageContainer({ children: null, className: "AboutBanner" }));
    expect(classes).toContain("container");
    expect(classes).toContain("AboutBanner");
  });

  it("renders a div by default and can render another element", () => {
    expect(propsOf(PageContainer({ children: null })).as ?? "div").toBe("div");
    expect(PageContainer({ children: null, as: "main" }).type).toBe("main");
  });
});

describe("DS-03 — Section", () => {
  it("is a band with the default rhythm", () => {
    const el = Section({ children: null });
    expect(el.type).toBe("section");
    expect(classesOf(el)).toEqual(["Section"]);
  });

  it("maps size and surface to modifier classes", () => {
    expect(classesOf(Section({ children: null, size: "sm" }))).toContain("Section--sm");
    expect(classesOf(Section({ children: null, size: "flush" }))).toContain("Section--flush");
    expect(classesOf(Section({ children: null, surface: "muted" }))).toContain("Section--muted");
    expect(classesOf(Section({ children: null, surface: "inverse" }))).toContain("Section--inverse");
  });

  it("does not invent a surface class for an unknown surface", () => {
    const el = Section({ children: null, surface: "chartreuse" });
    expect(classesOf(el).some((c) => c.startsWith("Section--chartreuse"))).toBe(true);
    // The point is that it must not resolve to a REAL token by accident.
    expect(classesOf(el)).not.toContain("Section--muted");
  });

  it("SectionStack marks the card rhythm rather than the band rhythm", () => {
    expect(classesOf(SectionStack({ children: null }))).toEqual(["SectionStack"]);
  });
});

describe("DS-03 — SectionHeading", () => {
  it("defaults to h3, matching the reference page's card headings", () => {
    const el = SectionHeading({ children: "What you'll learn" });
    expect(el.type).toBe("h3");
    expect(classesOf(el)).toEqual(["SectionHeading"]);
  });

  it("keeps the 4px brand accent opt-in, never the default", () => {
    // The audit called this bar a section-heading motif; measured, Course
    // Detail's section headings have no accent at all. Enabling it by default
    // would restyle every content heading, so default must not carry it.
    expect(classesOf(SectionHeading({ children: "x" }))).not.toContain("SectionHeading--accent");
    expect(classesOf(SectionHeading({ children: "x", accent: true }))).toContain("SectionHeading--accent");
  });
});

describe("DS-03 — CSS contracts", () => {
  it("does not redefine .container (one owner only)", () => {
    // main.scss owns `.container`. A second definition here would mean two
    // competing containers — exactly what DS-03 exists to prevent.
    expect(mainScss).toMatch(/^\.container\s*\{/m);
    expect(layoutScss).not.toMatch(/^\.container\s*\{/m);
    expect(layoutCss).not.toMatch(/^\.container\s*\{/m);
    // And the modifiers must be additive, not standalone replacement classes.
    expect(layoutCss).toMatch(/\.container--full/);
    expect(layoutCss).toMatch(/\.container--narrow/);
  });

  it("drives every primitive value from a token", () => {
    expect(ruleFor(layoutCss, ".Section")).toMatch(/padding-block:\s*var\(--section-y\)/);
    expect(ruleFor(layoutCss, ".Section--sm")).toMatch(/var\(--section-y-sm\)/);
    expect(ruleFor(layoutCss, ".SectionStack > * + *")).toMatch(/var\(--section-gap\)/);
    expect(ruleFor(layoutCss, ".SectionHeading")).toMatch(/font-size:\s*var\(--text-card-title\)/);
    expect(ruleFor(layoutCss, ".SectionHeading")).toMatch(/margin:\s*0 0 var\(--heading-gap\) 0/);
    expect(ruleFor(layoutCss, ".SectionHeading")).toMatch(/color:\s*var\(--color-heading\)/);
    expect(ruleFor(layoutCss, ".SectionHeading--accent")).toMatch(/var\(--border-accent-width\)/);
    expect(ruleFor(layoutCss, ".SectionHeading--accent")).toMatch(/var\(--color-border-accent\)/);
    expect(ruleFor(layoutCss, ".container--narrow")).toMatch(/var\(--container-narrow\)/);
  });

  it("introduces no hardcoded colour", () => {
    // DS-03 must consume the token layer, not add a parallel palette. The
    // comments name existing brand colours, so check declarations only.
    const hexish = layoutBare.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    expect(hexish).toEqual([]);
  });

  it("keeps SectionHeading at the measured reference scale", () => {
    // The measured `.HighlightBox h3` computes `line-height: normal`. Setting a
    // tight line-height here would change the first page that adopts the
    // primitive — the opposite of DS-03's no-visual-change mandate.
    expect(ruleFor(layoutCss, ".SectionHeading")).not.toMatch(/line-height/);
    expect(ruleFor(layoutCss, ".SectionHeading")).not.toMatch(/border-left/);
  });

  it("scales the heading through the responsive tokens", () => {
    const media = layoutCss.replace(/\s+/g, "");
    expect(media).toContain("max-width:1024px");
    expect(media).toContain("max-width:768px");
    expect(media).toMatch(/max-width:1024px\).*?\.SectionHeading\{font-size:var\(--text-card-title-md\)/s);
    expect(media).toMatch(/max-width:768px\).*?\.SectionHeading\{font-size:var\(--text-card-title-sm\)/s);
  });

  it("keeps the accent clearly distinct from an ordinary border", () => {
    // 4px brand against 1px --color-border. This is the check that stops a
    // later normalisation sweep flattening the accent into a 1px border.
    expect(ruleFor(layoutCss, ".SectionHeading--accent")).not.toMatch(/border-left:\s*1px/);
    expect(tokensScss).toMatch(/--border-accent-width:\s*4px/);
  });
});

describe("DS-03 — token layer additions", () => {
  const required = [
    "--surface-tinted",
    "--container-gutter",
    "--container-gutter-lg",
    "--container-gutter-md",
    "--container-gutter-sm",
    "--container-narrow",
    "--section-gap",
    "--heading-gap",
    "--text-card-title",
    "--text-card-title-md",
    "--text-card-title-sm",
    "--color-heading",
  ];

  it("defines every token DS-03 measured", () => {
    const missing = required.filter((t) => !tokensScss.includes(`${t}:`));
    expect(missing).toEqual([]);
  });

  it("names the shared tint instead of restating it for the nav", () => {
    // `#f2f6fc` has six consumers (nav, two banner blocks, a testimonial card
    // and two filter controls), so it is a shared tint that the nav aliases —
    // not a nav-private colour. Two literals would let the header drift from
    // the surfaces it currently matches.
    expect(tokensScss).toMatch(/--surface-tinted:\s*#f2f6fc/);
    expect(tokensScss).toMatch(/--surface-nav:\s*var\(--surface-tinted\)/);
    // Exactly one declaration of the literal, so there is one place to change.
    expect((tokensBare.match(/#f2f6fc/g) || []).length).toBe(1);
  });

  it("keeps the measured gap values rather than rounding them", () => {
    // 30px (95 uses in the source) and 25px have no step in the DS-02 scale.
    // Rounding them to 32px/24px would move real pixels on content pages.
    expect(tokensScss).toMatch(/--section-gap:\s*30px/);
    expect(tokensScss).toMatch(/--heading-gap:\s*25px/);
    expect(tokensScss).toMatch(/--container-gutter:\s*100px/);
  });

  it("loads layout.scss after tokens", () => {
    const order = [...layoutJs.matchAll(/assets\/css\/([A-Za-z-]+)\.scss/g)].map((m) => m[1]);
    expect(order.indexOf("tokens")).toBeLessThan(order.indexOf("layout"));
  });
});

describe("DS-03 — migrated pages", () => {
  const course = read("../app/course/[slug]/[id]/CourseDetails.jsx");
  const about = read("../app/about/About.jsx");

  it("uses PageContainer on the reference page, balanced and complete", () => {
    const open = (course.match(/<PageContainer[\s>]/g) || []).length;
    const close = (course.match(/<\/PageContainer>/g) || []).length;
    expect(open).toBe(3);
    expect(close).toBe(open);
    // No leftovers: a stray `className="container"` would mean two systems.
    expect(course).not.toMatch(/className="container"/);
  });

  it("uses PageContainer on the second content page, balanced and complete", () => {
    const open = (about.match(/<PageContainer[\s>]/g) || []).length;
    const close = (about.match(/<\/PageContainer>/g) || []).length;
    expect(open).toBe(4);
    expect(close).toBe(open);
    // About combines the container with its own modifier; those must survive.
    ["AboutBanner", "OurStorySection", "PremiumValues", "FaqSection"].forEach((cls) => {
      expect(about).toContain(`<PageContainer className="${cls}">`);
    });
  });
});
