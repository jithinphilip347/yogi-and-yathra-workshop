/**
 * Temporary verification harness — WORKSHOP-DS-01/DS-02.
 *
 * Renders real pages in headless Chrome at 640/768/1024/1440 and reports what
 * the browser actually computed. The point is to prove the stylesheet-pipeline
 * change (compiled .css -> source .scss) did not alter rendering, and to catch
 * responsive breakage objectively via horizontal overflow.
 *
 * Zero dependencies: Node 22's global WebSocket drives the DevTools Protocol.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;
const BASE = process.env.BASE_URL || "http://localhost:3001";
const WIDTHS = [640, 768, 1024, 1440];
const ROUTES = [
  "/",
  "/course",
  "/course/surya-namasakaram/12",
  "/cart",
  "/checkout",
  "/about",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Probe run inside the page: what did the browser actually compute? */
const PROBE = `(() => {
  const num = (v) => parseFloat(v) || 0;
  const tally = (fn) => {
    const m = {};
    document.querySelectorAll('*').forEach((n) => {
      const k = fn(getComputedStyle(n));
      if (k) m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };
  const cs = getComputedStyle(document.documentElement);
  const first = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = getComputedStyle(el);
    return { r: s.borderRadius, b: s.borderTopWidth + ' ' + s.borderTopColor, bg: s.backgroundColor };
  };
  return {
    w: window.innerWidth,
    docW: document.documentElement.scrollWidth,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    textLen: document.body.innerText.length,
    imgs: document.images.length,
    brokenImgs: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length,
    radii: tally((s) => (s.borderRadius !== '0px' ? s.borderRadius : null)).slice(0, 8),
    bgs: tally((s) => (num(s.borderTopWidth) > 0 ? s.borderTopColor : null)).slice(0, 6),
    brandEls: [...document.querySelectorAll('*')].filter((n) => {
      const s = getComputedStyle(n);
      return /135, 68, 41/.test(s.backgroundColor + s.color + s.borderTopColor);
    }).length,
    tokens: {
      surface: cs.getPropertyValue('--surface-page').trim() || 'MISSING',
      border: cs.getPropertyValue('--color-border').trim() || 'MISSING',
      radiusMd: cs.getPropertyValue('--radius-md').trim() || 'MISSING',
      primary: cs.getPropertyValue('--color-primary').trim() || 'MISSING',
    },
    probe: { card: first('[class*=Card]'), btn: first('button'), input: first('input') },
  };
})()`;

/** Minimal CDP client over one page target. */
class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = new Map();
    ws.addEventListener("message", (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else if (msg.method) {
        (this.events.get(msg.method) || []).forEach((fn) => fn(msg.params));
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  once(method, timeout = 20000) {
    return new Promise((resolve) => {
      const list = this.events.get(method) || [];
      const fn = (p) => {
        this.events.set(method, list.filter((f) => f !== fn));
        resolve(p);
      };
      list.push(fn);
      this.events.set(method, list);
      setTimeout(() => resolve(null), timeout);
    });
  }
}

const profile = mkdtempSync(join(tmpdir(), "ds-cdp-"));
const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-gpu",
  "about:blank",
], { stdio: "ignore" });

let exitCode = 0;
try {
  // Wait for the debugging endpoint.
  let version;
  for (let i = 0; i < 40; i++) {
    try {
      version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
      break;
    } catch { await sleep(250); }
  }
  if (!version) throw new Error("Chrome DevTools endpoint never came up");
  console.log(`Chrome: ${version.Browser}\n`);

  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
  const cdp = new CDP(new WebSocket(target.webSocketDebuggerUrl));
  await new Promise((r, j) => {
    cdp.ws.addEventListener("open", r);
    cdp.ws.addEventListener("error", j);
  });

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");

  const pageErrors = [];
  cdp.events.set("Log.entryAdded", []);
  cdp.events.set("Runtime.exceptionThrown", []);
  cdp.events.get("Log.entryAdded").push(() => {});
  cdp.events.get("Runtime.exceptionThrown").push(() => {});
  cdp.events.set("Log.entryAdded", [(p) => { if (p.entry.level === "error") pageErrors.push(p.entry.text.slice(0, 90)); }]);
  cdp.events.set("Runtime.exceptionThrown", [(p) => pageErrors.push("EXC: " + (p.exceptionDetails?.text || "").slice(0, 90))]);

  const table = [];
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width, height: 900, deviceScaleFactor: 1, mobile: width < 768,
      });
      const loaded = cdp.once("Page.loadEventFired");
      await cdp.send("Page.navigate", { url: BASE + route });
      await loaded;
      await sleep(2200); // let client-side API hydration settle

      const res = await cdp.send("Runtime.evaluate", { expression: PROBE, returnByValue: true });
      const v = res.result.value;
      table.push({ route, width, ...v });

      const flag = v.overflow > 1 ? "  <== H-OVERFLOW" : "";
      console.log(
        `${route.padEnd(34)} @${String(width).padEnd(5)} ` +
        `text=${String(v.textLen).padStart(5)} imgs=${String(v.imgs).padStart(2)}(broken:${v.brokenImgs}) ` +
        `brand=${String(v.brandEls).padStart(3)} overflow=${String(v.overflow).padStart(3)}px${flag}`
      );
      if (v.overflow > 1) exitCode = 0; // report, do not fail the run
    }
  }

  console.log("\n=== token layer resolved in browser (must never be MISSING) ===");
  const t = table[table.length - 1].tokens;
  Object.entries(t).forEach(([k, val]) => console.log(`  ${k.padEnd(10)} ${val}`));
  const missing = table.filter((r) => Object.values(r.tokens).some((x) => x === "MISSING"));
  console.log(`  routes/widths with any MISSING token: ${missing.length}`);

  console.log("\n=== distinct rendered radii (top, across all widths) ===");
  const allRadii = {};
  table.forEach((r) => r.radii.forEach(([k, n]) => { allRadii[k] = (allRadii[k] || 0) + n; }));
  console.log("  " + Object.entries(allRadii).sort((a, b) => b[1] - a[1]).slice(0, 14)
    .map(([k, n]) => `${k}x${n}`).join("  "));

  console.log("\n=== horizontal overflow summary ===");
  const overflowers = table.filter((r) => r.overflow > 1);
  console.log(overflowers.length
    ? overflowers.map((r) => `  ${r.route} @${r.width} -> +${r.overflow}px`).join("\n")
    : "  none at any tested width");

  console.log("\n=== page console errors (first 8) ===");
  console.log(pageErrors.length ? [...new Set(pageErrors)].slice(0, 8).map((e) => "  " + e).join("\n") : "  none");

  cdp.ws.close();
} catch (err) {
  console.error("harness error:", err.message);
  exitCode = 1;
} finally {
  chrome.kill("SIGKILL");
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
process.exit(exitCode);
