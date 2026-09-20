import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * WORKSHOP-DS-04 — card / border / radius normalisation guards.
 *
 * These pin the *mechanical* invariants of the normalisation, not aesthetic
 * judgements. They exist because DS-04 changed 153 declarations across three
 * stylesheets, and the failure mode is silent: a later edit reintroduces the
 * literal `10px` and nothing notices until a page looks subtly wrong.
 *
 * The scope matters. DS-04 normalised the sprint's PRIMARY scope only — the
 * three content-detail roots (`#CourseDetails`, `#DailyLiveClassDetails`,
 * `#LiveYogaDetails`). Checkout, the players, About/Contact/Blog, notifications
 * and the home rails are deferred, so these guards deliberately do NOT assert
 * anything app-wide; asserting globally would fail on the deferred files and
 * punish correct work.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (...segments) => fs.readFileSync(path.resolve(__dirname, ...segments), "utf8");

const cssDir = path.resolve(__dirname, "../assets/css");
const readCss = (f) => read("../assets/css", f);

const ROOTS = {
  "style.scss": "#CourseDetails",
  "daily-live-details.scss": "#DailyLiveClassDetails",
  "live-yoga-details.scss": "#LiveYogaDetails",
};

/** Line ranges of every occurrence of a root block. */
const blockRanges = (source, root) => {
  const lines = source.split("\n");
  const re = new RegExp(`^\\s*${root}\\s*[,{]`);
  const ranges = [];
  lines.forEach((line, start) => {
    if (!re.test(line)) return;
    let depth = 0;
    let started = false;
    for (let i = start; i < lines.length; i++) {
      for (const ch of lines[i]) {
        if (ch === "{") { depth += 1; started = true; }
        else if (ch === "}") depth -= 1;
      }
      if (started && depth <= 0) {
        ranges.push([start, i]);
        return;
      }
    }
  });
  return ranges;
};

/** Declarations of a property inside a root block, as raw value strings. */
const valuesInRoot = (file, root, prop) => {
  const lines = readCss(file).split("\n");
  const out = [];
  for (const [from, to] of blockRanges(lines.join("\n"), root)) {
    for (let i = from; i <= to; i++) {
      const m = lines[i].match(new RegExp(`^\\s*${prop}:\\s*([^;]+?)\\s*;`));
      if (m) out.push(m[1].trim());
    }
  }
  return out;
};

/** Values DS-02 retired as having no semantic role. */
const RETIRED_RADII = ["14px", "15px", "18px", "25px", "5px", "30px", "10px"];

/**
 * The documented exception set — colours deliberately NOT mapped to a token.
 * A white or dark edge on a dark/light surface is a real, different role from a
 * neutral divider, and `#ffe1e1` is an error tint that is not
 * --color-error-border. Documented rather than normalised.
 */
const EXCEPTION_BORDERS = ["#fff", "#1a1a1a", "#ffe1e1"];
const isException = (decl) =>
  EXCEPTION_BORDERS.some((c) => decl.includes(c)) || /rgba\(255/.test(decl);

describe("DS-04 — detail roots use the radius scale", () => {
  for (const [file, root] of Object.entries(ROOTS)) {
    it(`${file} (${root}): every radius is a token and no retired value remains`, () => {
      const radii = valuesInRoot(file, root, "border-radius");
      expect(radii.length).toBeGreaterThan(0);

      const hardcoded = radii.filter((v) => !v.startsWith("var(--radius-"));
      expect(hardcoded).toEqual([]);

      const retired = radii.filter((v) => RETIRED_RADII.some((r) => v === r || v.split(/\s+/).includes(r)));
      expect(retired).toEqual([]);
    });
  }

  it("keeps the reference card shell at its measured values", () => {
    // Tokenising must not change what the reference page actually looks like.
    const tokens = readCss("tokens.scss");
    expect(tokens).toMatch(/--radius-md:\s*8px/);
    expect(tokens).toMatch(/--radius-lg:\s*12px/);
    expect(tokens).toMatch(/--radius-xl:\s*16px/);
    expect(tokens).toMatch(/--color-border:\s*#e2e8f0/);
  });
});

describe("DS-04 — border colours in the detail roots", () => {
  it("uses tokens for every neutral and brand border", () => {
    for (const [file, root] of Object.entries(ROOTS)) {
      const decls = [
        ...valuesInRoot(file, root, "border"),
        ...valuesInRoot(file, root, "border-top"),
        ...valuesInRoot(file, root, "border-bottom"),
        ...valuesInRoot(file, root, "border-color"),
      ];
      // Any neutral/brand hex left behind is a miss. The documented inverse
      // exceptions are excluded here and constrained by the next test.
      const suspicious = decls.filter((d) => /#[0-9a-fA-F]{3,8}/.test(d) && !isException(d));
      expect(suspicious, `${file} ${root}`).toEqual([]);
    }
  });

  it("keeps the exception set small and named", () => {
    const all = Object.entries(ROOTS).flatMap(([file, root]) => [
      ...valuesInRoot(file, root, "border"),
      ...valuesInRoot(file, root, "border-top"),
      ...valuesInRoot(file, root, "border-bottom"),
      ...valuesInRoot(file, root, "border-color"),
    ]);
    const hexed = all.filter((d) => /#[0-9a-fA-F]{3,8}/.test(d));
    const unexpected = hexed.filter((d) => !isException(d));
    expect(unexpected).toEqual([]);
    // If this grows, a new colour was introduced without a decision.
    expect(hexed.length).toBeLessThanOrEqual(6);
  });
});

describe("DS-04 — the coral brand leftover", () => {
  it("leaves no #ff725e or its rgb triplet in style.scss", () => {
    // `#ff725e` / rgb(255,114,94) is the colour DS-01/02 proved was a WRONG
    // brand fallback, not a brand colour. Four tints survived into DS-04; the
    // two in style.scss were paired with brand-brown text, which is what proved
    // they were leftover rather than an intentional accent. They now use the
    // brand triplet.
    const style = readCss("style.scss");
    expect(style).not.toMatch(/#ff725e/i);
    expect(style).not.toMatch(/rgba\(\s*255\s*,\s*114\s*,\s*94/);
  });

  it("tints from the brand triple rather than a literal", () => {
    // The unread-count pill: coral background + brand-brown text was the
    // contradiction. Both now derive from the brand.
    expect(readCss("style.scss")).toMatch(/rgba\(var\(--color-primary-rgb\), 0\.12\)/);
  });

  it("keeps the notification module's warm unread accent, documented", () => {
    // notification.scss tints its unread state with the same coral AND a
    // matching #fed7aa border — internally consistent, and a different semantic
    // role (alert/unread) from a brand surface. Deliberately left alone.
    const notification = readCss("notification.scss");
    expect(notification).toMatch(/rgba\(255, 114, 94/);
  });
});

describe("DS-04 — normalisation tools stay honest", () => {
  it("normalises every occurrence of a root, not just the first", () => {
    // style.scss declares #CourseDetails twice. Handling only the first
    // occurrence silently skipped the RelatedProducts / product-card block,
    // which is the sprint's named product-card target.
    const ranges = blockRanges(readCss("style.scss"), "#CourseDetails");
    expect(ranges.length).toBe(2);
  });
});
