/**
 * Dev tool — inventory visual-surface declarations with their selector.
 *
 * Usage:
 *   node scripts/dsInventory.mjs radius
 *   node scripts/dsInventory.mjs border-color
 *   node scripts/dsInventory.mjs border-width
 *   node scripts/dsInventory.mjs shadow
 *   node scripts/dsInventory.mjs radius --by-selector
 *   node scripts/dsInventory.mjs radius --tail 3     (selector depth shown)
 *
 * DS-04 must classify every occurrence before changing it — the sprint forbids a
 * blind search-and-replace, and a bare frequency count cannot answer "is 10px a
 * role or drift?". This resolves each declaration to the selector that owns it.
 *
 * It compiles each `.scss` with sass FIRST. That matters: sass flattens nesting
 * and resolves `&`, so the scanner never has to track a brace stack across
 * nested SCSS (a hand-rolled version of that gets the paths wrong). The flat CSS
 * is then trivial to walk.
 */
import fs from "node:fs";
import path from "node:path";
import * as sass from "sass";

const CSS_DIR = path.resolve(process.cwd(), "src/assets/css");
const PROP = process.argv[2] || "radius";
const BY_SELECTOR = process.argv.includes("--by-selector");
const tailIdx = process.argv.indexOf("--tail");
const TAIL = tailIdx >= 0 ? Number(process.argv[tailIdx + 1]) || 2 : 2;

/** Which declarations each inventory covers. */
const TARGETS = {
  radius: [/^border-radius$/],
  "border-color": [/^border(-(top|bottom|left|right))?-color$/],
  "border-width": [/^border(-(top|bottom|left|right))?-width$/],
  "border-shorthand": [/^border$/],
  shadow: [/^box-shadow$/],
};

const isTarget = (prop) => (TARGETS[PROP] || []).some((re) => re.test(prop));

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");

/** Scan flat CSS, returning declarations with their owning selector. */
const scan = (file, css) => {
  const out = [];
  let selector = "";
  let buffer = "";
  let inBlock = false;
  let line = 1;

  for (const ch of css) {
    if (ch === "\n") line++;
    if (ch === "{") {
      inBlock = true;
      buffer = "";
      continue;
    }
    if (ch === "}") {
      inBlock = false;
      selector = "";
      buffer = "";
      continue;
    }
    if (!inBlock) {
      selector += ch;
      continue;
    }
    if (ch === ";") {
      const decl = buffer.trim();
      buffer = "";
      const m = decl.match(/^([a-zA-Z-]+)\s*:\s*(.+)$/);
      if (m && isTarget(m[1])) {
        out.push({
          file: path.basename(file).replace(".scss", ""),
          line,
          selector: selector.trim().replace(/\s+/g, " "),
          prop: m[1],
          value: m[2].replace(/\s+/g, " ").trim(),
        });
      }
      continue;
    }
    buffer += ch;
  }
  return out;
};

/** Shorten a long selector to its last N compound segments. */
const shorten = (sel) => {
  const parts = sel.split(/\s+(?![^(]*\))/); // split on combinators outside ()
  return parts.slice(-TAIL).join(" ").slice(0, 120);
};

const files = fs.readdirSync(CSS_DIR).filter((f) => f.endsWith(".scss"));
const all = [];
for (const f of files) {
  const src = stripComments(fs.readFileSync(path.join(CSS_DIR, f), "utf8"));
  let css;
  try {
    css = sass.compileString(src, { loadPaths: [CSS_DIR] }).css;
  } catch (e) {
    console.error(`  ! ${f}: ${e.message.split("\n")[0]}`);
    continue;
  }
  all.push(...scan(f, css));
}

if (!all.length) {
  console.log(`no ${PROP} declarations found`);
  process.exit(0);
}

const groups = new Map();
for (const d of all) {
  if (!groups.has(d.value)) groups.set(d.value, []);
  groups.get(d.value).push(d);
}
const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

console.log(`\n=== ${PROP}: ${all.length} declarations, ${sorted.length} distinct values ===\n`);
for (const [value, items] of sorted) {
  console.log(`${String(items.length).padStart(4)}  ${value}`);
  if (BY_SELECTOR) {
    const bySel = new Map();
    for (const it of items) {
      const k = `${it.file}  ${shorten(it.selector)}`;
      bySel.set(k, (bySel.get(k) || 0) + 1);
    }
    [...bySel.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([s, n]) => console.log(`        ${String(n).padStart(2)}x  ${s}`));
  }
}
console.log();
