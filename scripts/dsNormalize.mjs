/**
 * Dev tool — normalise visual-surface declarations to design tokens, audibly.
 *
 * Usage:
 *   node scripts/dsNormalize.mjs                 # dry run, prints every change
 *   node scripts/dsNormalize.mjs --write         # apply
 *   node scripts/dsNormalize.mjs --roots '#CourseDetails'
 *
 * WHY THIS EXISTS RATHER THAN sed
 * DS-04 forbids a blind search-and-replace: every occurrence has to be
 * classified before it changes. A bare `border-radius: 12px -> var(--radius-lg)`
 * sweep over 454 declarations would silently miss that `12px` is a card on one
 * selector and a form control on another.
 *
 * So this tool is scoped twice over:
 *   1. by ROOT SELECTOR — only declarations inside the named page roots are
 *      touched (the sprint's primary scope is the three content-detail pages);
 *   2. by EXPLICIT VALUE MAP — every mapping is a decision recorded in RULES
 *      below, with the semantic role it was chosen for.
 *
 * Block ranges are found with a brace counter over the SCSS. That is reliable
 * for locating a root block's line range; it is not used to reconstruct selector
 * paths (a hand-rolled nesting tracker gets those wrong), so no classification
 * depends on it.
 *
 * It prints file:line, the old declaration, the new one, and the selector-ish
 * context, so the change list can be reviewed before --write and quoted in the
 * report afterwards.
 */
import fs from "node:fs";
import path from "node:path";

const CSS_DIR = path.resolve(process.cwd(), "src/assets/css");
const WRITE = process.argv.includes("--write");
const rootsIdx = process.argv.indexOf("--roots");
const ROOTS = rootsIdx >= 0
  ? process.argv[rootsIdx + 1].split(",")
  : ["#CourseDetails", "#DailyLiveClassDetails", "#LiveYogaDetails"];

/** Which files to consider, and the roots they own. */
const FILES = {
  "style.scss": ["#CourseDetails"],
  "daily-live-details.scss": ["#DailyLiveClassDetails"],
  "live-yoga-details.scss": ["#LiveYogaDetails"],
};

/* ── RADIUS: measured value -> canonical token, with the role it plays ───────
   The scale (DS-02): none 0 | xs 2 | sm 6 (controls) | md 8 (cards) |
   lg 12 (panels) | xl 16 (large features) | pill 50 | circle 50%
   Values on the right are the DS-04 classification of every measured left value. */
const RADIUS = {
  "0": "--radius-none",
  "2px": "--radius-xs",       // progress bars, micro decoration
  "3px": "--radius-xs",       // progress fills — decorative, not a control edge
  "4px": "--radius-sm",       // badges, chips, small images
  "5px": "--radius-sm",       // buttons — DS-02 retired 5px
  "6px": "--radius-sm",       // controls (canonical)
  "8px": "--radius-md",       // cards (canonical)
  "10px": "--radius-md",      // card drift: cards, not controls -> 8px
  "12px": "--radius-lg",      // panels (canonical)
  "14px": "--radius-lg",
  "15px": "--radius-lg",
  "16px": "--radius-xl",      // large features (canonical)
  "18px": "--radius-xl",
  "20px": "--radius-xl",      // hero / feature panels
  "24px": "--radius-xl",      // large feature cards, product modal
  "25px": "--radius-xl",
  "30px": "--radius-xl",
  "50px": "--radius-pill",    // pills (canonical)
  "50%": "--radius-circle",   // circles (canonical)
};

/* ── BORDER COLOUR: only where the semantic role is unambiguous ─────────────
   Anything not listed is left alone and reported as a remaining exception. */
const BORDER_COLOR = {
  // The neutral family. The audit found ~10 greys doing one job; these are the
  // ones the three detail pages actually use. `#eee` is the largest single
  // group (27 declarations) and is the same "card/divider edge" role as
  // `#e2e8f0`, so both resolve to --color-border.
  "#e2e8f0": "var(--color-border)",
  "#eee": "var(--color-border)",
  "#edf2f7": "var(--color-border)",
  "#ddd": "var(--color-border)",
  "#f1f5f9": "var(--color-border-muted)",
  "#cbd5e1": "var(--color-border-strong)",
  // The "commerce" grey the audit catalogued on product cards (`.ProductItem`,
  // the RelatedProducts rail). Measured rgb(232,237,243) against the generic
  // neutral's rgb(226,232,240) — near-identical greys doing one job, so per
  // DS-04 §5 this maps rather than being kept as a second neutral.
  "#e8edf3": "var(--color-border)",
  // Status borders.
  "#fecaca": "var(--color-error-border)",
  "#fde68a": "var(--color-warning-border)",
  "#a7f3d0": "var(--color-success-border)",
  // The brand accent, in both spellings the source uses.
  "var(--primaryColor)": "var(--color-border-accent)",
  "var(--primaryColor, #874429)": "var(--color-border-accent)",
  // Deliberately NOT mapped, and left as exceptions:
  //   #fff / rgba(255,255,255,*): inverse surfaces — a white edge on a dark
  //     background is a real, different role, not a neutral divider.
  //   #1a1a1a: a dark chip edge.
  //   #ffe1e1: an error tint that is not --color-error-border.
  //   transparent: no border by design.
};

/**
 * Find [startLine, endLine] (1-indexed, inclusive) of EVERY root block.
 *
 * Returning all occurrences matters: `style.scss` declares `#CourseDetails`
 * TWICE (line 7283 and line 11011), and the second block holds the
 * RelatedProducts / product-card surface — the sprint's explicit product-card
 * target. Handling only the first occurrence silently skipped it, which is
 * exactly the kind of blind spot a normalisation sweep must not have.
 */
const blockRanges = (source, root) => {
  const lines = source.split("\n");
  const re = new RegExp(`^\\s*${root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[,{]`);
  const ranges = [];

  lines.forEach((line, start) => {
    if (!re.test(line)) return;
    let depth = 0;
    let started = false;
    for (let i = start; i < lines.length; i++) {
      for (const ch of lines[i]) {
        if (ch === "{") { depth++; started = true; }
        else if (ch === "}") depth--;
      }
      if (started && depth <= 0) {
        ranges.push([start + 1, i + 1]);
        return;
      }
    }
  });

  return ranges;
};

const changes = [];
const skipped = [];

for (const [file, fileRoots] of Object.entries(FILES)) {
  const full = path.join(CSS_DIR, file);
  if (!fs.existsSync(full)) continue;
  const lines = fs.readFileSync(full, "utf8").split("\n");

  for (const root of fileRoots) {
    if (!ROOTS.includes(root)) continue;
    const ranges = blockRanges(lines.join("\n"), root);
    if (!ranges.length) {
      console.error(`  ! ${file}: root ${root} not found`);
      continue;
    }

    for (const [from, to] of ranges) {
    for (let i = from - 1; i < to; i++) {
      const line = lines[i];

      const r = line.match(/^(\s*border-radius:\s*)([^;]+?)(\s*;.*)$/);
      if (r) {
        const value = r[2].trim();
        if (/var\(--radius-/.test(value)) continue; // already a token

        // Directional shorthand (e.g. `12px 12px 0 0`): map each corner and
        // leave `0` as a literal zero, so a top-rounded card stays top-rounded.
        const parts = value.split(/\s+/);
        if (parts.length > 1) {
          const mapped = parts.map((p) => {
            if (p === "0") return "0";
            const t = RADIUS[p];
            return t ? `var(${t})` : null;
          });
          if (mapped.every(Boolean)) {
            const out = mapped.join(" ");
            changes.push({ file, line: i + 1, kind: "radius", from: value, to: out });
            if (WRITE) lines[i] = `${r[1]}${out}${r[3]}`;
          } else {
            skipped.push({ file, line: i + 1, kind: "radius", value });
          }
          continue;
        }

        const token = RADIUS[value];
        if (token) {
          changes.push({ file, line: i + 1, kind: "radius", from: value, to: `var(${token})` });
          if (WRITE) lines[i] = `${r[1]}var(${token})${r[3]}`;
        } else {
          skipped.push({ file, line: i + 1, kind: "radius", value });
        }
        continue;
      }

      const b = line.match(/^(\s*border(?:-(?:top|bottom|left|right))?:\s*)([^;]+?)(\s*;.*)$/);
      if (b) {
        const decl = b[2].trim().replace(/!important$/, "").trim();
        // Shorthand: <width> <style> <colour>. Style may be solid/dashed/dotted.
        const sh = decl.match(/^(\d+(?:\.\d+)?px)\s+(solid|dashed|dotted)\s+(.+)$/);
        const color = sh ? sh[3].trim() : decl.trim();
        const token = BORDER_COLOR[color];
        if (token && sh) {
          changes.push({ file, line: i + 1, kind: "border", from: color, to: token });
          // Preserve the original width AND style — a 2px dashed border must not
          // become 1px solid just because its colour was normalised.
          if (WRITE) lines[i] = `${b[1]}${sh[1]} ${sh[2]} ${token}${b[3]}`;
        } else if (token) {
          changes.push({ file, line: i + 1, kind: "border", from: color, to: token });
          if (WRITE) lines[i] = `${b[1]}${token}${b[3]}`;
        } else {
          skipped.push({ file, line: i + 1, kind: "border", value: color });
        }
        continue;
      }

      // `border-color: <value>` on its own line.
      const bc = line.match(/^(\s*border-color:\s*)([^;]+?)(\s*;.*)$/);
      if (bc) {
        const value = bc[2].trim();
        const token = BORDER_COLOR[value];
        if (token) {
          changes.push({ file, line: i + 1, kind: "border", from: value, to: token });
          if (WRITE) lines[i] = `${bc[1]}${token}${bc[3]}`;
        } else {
          skipped.push({ file, line: i + 1, kind: "border-color", value });
        }
      }
    }
    }
  }

  if (WRITE) fs.writeFileSync(full, lines.join("\n"));
}

const byKind = (k) => changes.filter((c) => c.kind === k);
console.log(`\n${WRITE ? "APPLIED" : "DRY RUN — no files written"}`);
console.log(`roots: ${ROOTS.join(", ")}\n`);

for (const kind of ["radius", "border"]) {
  const list = byKind(kind);
  const grouped = new Map();
  for (const c of list) {
    const k = `${c.from}  ->  ${c.to}`;
    grouped.set(k, (grouped.get(k) || 0) + 1);
  }
  console.log(`=== ${kind}: ${list.length} changes, ${grouped.size} distinct mappings ===`);
  [...grouped.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ${String(n).padStart(3)}x  ${k}`));
  console.log();
}

console.log(`=== ${skipped.length} declarations left unchanged (not in the map) ===`);
const skippedGroups = new Map();
for (const s of skipped) {
  const k = `${s.kind} ${s.value}`;
  skippedGroups.set(k, (skippedGroups.get(k) || 0) + 1);
}
[...skippedGroups.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
  .forEach(([k, n]) => console.log(`  ${String(n).padStart(3)}x  ${k}`));
console.log();
