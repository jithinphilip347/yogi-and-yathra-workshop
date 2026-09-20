/**
 * Design foundation guards — WORKSHOP-DS-01 / DS-02.
 *
 * These are structural invariants, not style opinions. Two of them exist because
 * the failure they prevent has already happened in this repository:
 *
 *  - compiled `.css` files were committed beside their `.scss` sources, consumed
 *    from BOTH, and drifted apart in both directions (some edits reached only the
 *    `.css`, others only the `.scss`). Nobody could tell which file shipped.
 *  - `--primaryColor` was consumed with four different fallback values, three of
 *    which render the wrong brand colour.
 *
 * A stylesheet-lint rule cannot catch either one, so they are pinned here.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(__dirname, "..");
const cssDir = path.resolve(__dirname, "../assets/css");

const read = (p) => fs.readFileSync(p, "utf8");

/** Every file under a directory, filtered by extension. */
const walk = (dir, ext) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, ext));
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
};

const scssFiles = walk(cssDir, ".scss");
// Every JS/JSX file in the app — pages, components, features and tests, so a
// stylesheet import anywhere in the tree is covered.
const appFiles = [...walk(srcRoot, ".jsx"), ...walk(srcRoot, ".js")];

describe("DS-02 — one stylesheet source of truth", () => {
  it("does not commit compiled .css twins beside the .scss sources", () => {
    const staleTwins = fs
      .readdirSync(cssDir)
      .filter((name) => name.endsWith(".css") || name.endsWith(".css.map"));

    // A `.css` twin is the exact hazard this sprint removed: it can be imported,
    // edited, and drift from its source without anyone noticing.
    expect(staleTwins).toEqual([]);
  });

  it("imports .scss, never .css, from every page and component", () => {
    const cssImports = [];
    for (const file of appFiles) {
      const source = read(file);
      for (const [, specifier] of source.matchAll(/["']([^"']*assets\/css\/[^"']+\.css)["']/g)) {
        cssImports.push(`${path.relative(srcRoot, file)} -> ${specifier}`);
      }
    }
    expect(cssImports).toEqual([]);
  });

  it("loads the token layer first in the global entry", () => {
    const layout = read(path.join(srcRoot, "app/layout.js"));
    const order = [...layout.matchAll(/assets\/css\/([A-Za-z-]+)\.scss/g)].map((m) => m[1]);

    // Tokens must cascade before the sheets that will consume them.
    expect(order[0]).toBe("tokens");
    expect(order).toContain("main");
    expect(order).toContain("style");
  });

  it("leaves no dead 'copy' duplicates behind", () => {
    const copies = walk(srcRoot, ".jsx")
      .concat(walk(srcRoot, ".js"), scssFiles)
      .map((f) => path.relative(srcRoot, f))
      .filter((rel) => /copy/i.test(rel));
    expect(copies).toEqual([]);
  });
});

describe("DS-01 — the two defects cannot come back", () => {
  it("never calls rgba() with a hex custom property", () => {
    // `--primaryColor` holds `#874429`, so `rgba(var(--primaryColor), .3)` is
    // invalid CSS: the declaration is dropped silently and the shadow never
    // renders. Only `--primaryColorRgb` (a bare triplet) is valid inside rgba().
    const offenders = [];
    for (const file of scssFiles) {
      // Skip tokens.scss, which documents the defect in a comment.
      if (path.basename(file) === "tokens.scss") continue;
      read(file)
        .split("\n")
        .forEach((line, i) => {
          if (/rgba\(\s*var\(--primaryColor\)/.test(line)) {
            offenders.push(`${path.relative(cssDir, file)}:${i + 1}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });

  it("uses the exact case of the --primaryColorRgb custom property", () => {
    // CSS custom property names are case-SENSITIVE. Only `--primaryColorRgb` is
    // defined, so `rgba(var(--primaryColorRGB), .3)` resolves to nothing and the
    // declaration is dropped — the same silent failure as the hex-in-rgba() bug
    // above, from a one-character difference nobody would spot in review.
    const offenders = [];
    for (const file of scssFiles) {
      if (path.basename(file) === "tokens.scss") continue;
      read(file)
        .split("\n")
        .forEach((line, i) => {
          if (/var\(--primaryColorRGB\)/.test(line)) {
            offenders.push(`${path.relative(cssDir, file)}:${i + 1}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });

  it("defines the rgb triplet under exactly one casing", () => {
    const casings = new Set();
    for (const file of scssFiles) {
      // Case-insensitive on purpose: the point is to catch *any* casing.
      for (const [, name] of read(file).matchAll(/(--primaryColorRgb)\s*:/gi)) {
        casings.add(name);
      }
    }

    // A second casing would re-introduce the defect above for every consumer
    // that happens to use it, and only the browser would notice.
    expect([...casings]).toEqual(["--primaryColorRgb"]);
  });

  it("declares one fallback for --primaryColor, and it is the brand colour", () => {
    const fallbacks = new Map();
    for (const file of scssFiles) {
      for (const [, hex] of read(file).matchAll(/var\(--primaryColor,\s*(#[0-9a-fA-F]{3,8})\)/g)) {
        fallbacks.set(hex.toLowerCase(), (fallbacks.get(hex.toLowerCase()) || 0) + 1);
      }
    }

    // The brand is #874429. A second value here does not fail loudly — it paints
    // a different colour on whichever surface happens to reference it.
    expect([...fallbacks.keys()]).toEqual(["#874429"]);
  });
});

describe("DS-01 — inline JS/JSX fallbacks agree with the brand", () => {
  // Gathering evidence from `.scss` alone missed three of these defects: the same
  // divergent-fallback problem also lives in inline `style={{ … }}` objects,
  // where no stylesheet tooling can see it.
  const jsFiles = appFiles.filter((f) => !f.includes("__tests__"));

  it("never falls back to a non-brand colour for --primaryColor", () => {
    const offenders = [];
    for (const file of jsFiles) {
      read(file)
        .split("\n")
        .forEach((line, i) => {
          for (const [, hex] of line.matchAll(/var\(--primaryColor,\s*(#[0-9a-fA-F]{3,8})\)/g)) {
            if (hex.toLowerCase() !== "#874429") {
              offenders.push(`${path.relative(srcRoot, file)}:${i + 1} -> ${hex}`);
            }
          }
        });
    }
    expect(offenders).toEqual([]);
  });

  it("never references a misspelled --primary-color property", () => {
    // `--primary-color` is defined nowhere, so these declarations resolve to the
    // fallback permanently — the element paints a colour the author never chose,
    // while looking correct in source. Found live on the profile Dashboard.
    const offenders = [];
    for (const file of jsFiles) {
      read(file)
        .split("\n")
        .forEach((line, i) => {
          if (/--primary-color(?![A-Za-z])/.test(line)) {
            offenders.push(`${path.relative(srcRoot, file)}:${i + 1}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });
});

describe("DS-02 — the token layer", () => {
  const tokens = read(path.join(cssDir, "tokens.scss"));

  it("defines every semantic role the audit called for", () => {
    const required = [
      // surfaces
      "--surface-page", "--surface", "--surface-muted", "--surface-subtle",
      "--surface-raised", "--surface-input", "--surface-disabled", "--surface-nav",
      "--surface-accent-subtle", "--surface-inverse",
      // borders
      "--color-border", "--color-border-muted", "--color-border-strong",
      "--color-border-accent", "--color-border-focus",
      // text
      "--color-text", "--color-text-muted", "--color-text-subtle", "--text-inverse",
      // status
      "--color-error", "--color-warning", "--color-success", "--color-live",
      // radius
      "--radius-none", "--radius-xs", "--radius-sm", "--radius-md",
      "--radius-lg", "--radius-xl", "--radius-pill", "--radius-circle",
      // border widths
      "--border-width", "--border-width-strong", "--border-accent-width",
      // spacing
      "--space-1", "--space-6", "--space-11", "--section-y",
      // typography
      "--text-display", "--text-h1", "--text-body", "--text-body-sm",
      "--text-caption", "--text-micro", "--weight-bold",
      // shadow
      "--shadow-sm", "--shadow-md", "--shadow-lg", "--shadow-xl", "--shadow-accent",
      // focus / accessibility
      "--focus-ring-color", "--focus-ring-width", "--disabled-surface", "--disabled-text",
      // overlays
      "--overlay-modal", "--overlay-drawer",
    ];

    const missing = required.filter((token) => !tokens.includes(`${token}:`));
    expect(missing).toEqual([]);
  });

  it("aliases the brand instead of restating it", () => {
    // Re-declaring the brand here would create a second place for it to change,
    // which is the same class of bug as the divergent fallbacks.
    expect(tokens).not.toMatch(/^\s*--primaryColor:\s*#/m);
    expect(tokens).toMatch(/--color-primary:\s*var\(--primaryColor\)/);
    expect(tokens).toMatch(/--color-primary-rgb:\s*var\(--primaryColorRgb\)/);

    // The brand literals must still live in exactly one place, main.scss.
    const main = read(path.join(cssDir, "main.scss"));
    expect(main).toMatch(/--primaryColor:\s*#874429/);
  });

  it("keeps the brand glow valid by using the rgb triplet", () => {
    expect(tokens).toMatch(/--shadow-accent:[^;]*rgba\(var\(--color-primary-rgb\)/);
  });
});
