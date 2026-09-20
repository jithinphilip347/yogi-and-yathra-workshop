/**
 * Dev tool — WORKSHOP-DS-07C invoice UI capture harness.
 *
 * Renders the billing tab at every width the sprint names, records what the
 * browser actually computed, captures PNGs, and reports the per-row invoice
 * action matrix from the rendered DOM.
 *
 * The `profile-billing` case targets the real route and runs as-is. The other
 * cases drive /ds07c-billing-review, a TEMPORARY page that mounted the real
 * StudentBilling with a stubbed axios adapter so every invoice state (available /
 * cancelled / not-issued / re-issued) was reachable without a signed-in user or a
 * running Workshop backend. That page was deleted with the sprint's harness —
 * recreate it from the report's Appendix A to reproduce the row-level cases.
 *
 * Zero dependencies: Node 22's global WebSocket drives the DevTools Protocol.
 *
 * Usage:
 *   node scripts/ds07cInvoiceCapture.mjs --out docs/screenshots/ds07c
 */
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = Number(process.env.CDP_PORT || 9338);
const BASE = process.env.BASE_URL || "http://localhost:3001";

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const OUT = argOf("--out", "docs/screenshots/ds07c");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CASES = [
  { name: "billing", url: "/ds07c-billing-review", states: true },
  { name: "loading", url: "/ds07c-billing-review?mode=loading", states: false },
  { name: "error", url: "/ds07c-billing-review?mode=error", states: false },
  { name: "signed-out", url: "/ds07c-billing-review?signedOut=1", states: false },
  // The authoritative context: the component inside the real profile shell.
  // The Workshop backend is offline during review, so this renders the error
  // state — the point here is shell geometry and overflow, not invoice rows.
  { name: "profile-billing", url: "/auth/profile?tab=billing", states: false, widths: [1440, 768, 390, 320] },
];
const SHOT_WIDTHS = [1440, 1024, 768, 390, 320];
const MEASURE_WIDTHS = [1440, 1024, 900, 800, 768, 640, 430, 390, 360, 320];

/* ── In-page probe ─────────────────────────────────────────────────────────── */

const probe = () => `(() => {
  const out = {};
  const vw = document.documentElement.clientWidth;
  const scrollW = document.documentElement.scrollWidth;
  out.__viewport = { vw, scrollW, overflow: Math.max(0, scrollW - vw), scrollH: document.body.scrollHeight };

  // The VisuallyHidden caption is the screen-reader-only table caption: 1px wide
  // with the standard clip-rect recipe, so its scrollWidth always exceeds its
  // clientWidth. That is the pattern working, not text being cut off.
  const clipped = [...document.querySelectorAll(".StudentBilling *")]
    .filter((n) => !n.closest(".VisuallyHidden"))
    .filter((n) => n.scrollWidth - n.clientWidth > 2 && getComputedStyle(n).overflowX !== "auto")
    .map((n) => {
      const cls = (n.className || "").toString().split(" ").filter(Boolean).slice(0, 2).join(".");
      return n.tagName.toLowerCase() + (cls ? "." + cls : "") + "+" + (n.scrollWidth - n.clientWidth);
    });
  out.__textOverflow = clipped.length;
  out.__clippedNodes = clipped.slice(0, 8);

  const title = document.querySelector(".StudentBillingTitle");
  out.title = title ? title.textContent : null;
  out.titleColor = title ? getComputedStyle(title).color : null;
  out.titleBg = title ? getComputedStyle(title.closest(".StudentBilling")).backgroundColor : null;

  out.rows = [...document.querySelectorAll(".StudentBillingTable tbody tr")].map((tr) => ({
    order: tr.querySelector(".CellOrder")?.textContent ?? null,
    status: tr.querySelector(".StatusChip")?.textContent ?? null,
    action: tr.querySelector(".InvoiceBtn")?.textContent?.trim() ?? null,
    meta: tr.querySelector(".InvoiceMeta")?.textContent ?? null,
    note: tr.querySelector(".InvoiceUnavailable")?.textContent ?? null,
  }));

  const btn = document.querySelector(".InvoiceBtn");
  out.btnPadding = btn ? getComputedStyle(btn).padding : null;
  out.btnRadius = btn ? getComputedStyle(btn).borderRadius : null;
  out.btnColor = btn ? getComputedStyle(btn).color : null;
  out.btnShadow = btn ? getComputedStyle(btn).boxShadow : null;
  out.btnHeight = btn ? Math.round(btn.getBoundingClientRect().height) : null;

  const chip = document.querySelector(".StatusChip");
  out.chipRadius = chip ? getComputedStyle(chip).borderRadius : null;
  out.chipBg = chip ? getComputedStyle(chip).backgroundColor : null;

  const card = document.querySelector(".StudentBillingTableWrap");
  out.wrapRadius = card ? getComputedStyle(card).borderRadius : null;
  out.wrapBorderColor = card ? getComputedStyle(card).borderTopColor : null;
  out.wrapBorderWidth = card ? getComputedStyle(card).borderTopWidth : null;

  out.heading = document.querySelector(".StudentBillingTable thead th");
  out.tableHeadBg = out.heading ? getComputedStyle(out.heading).backgroundColor : null;
  delete out.heading;

  out.skeletonRows = document.querySelectorAll(".SkeletonRow").length;
  out.alertText = document.querySelector(".StudentBillingAlert")?.textContent ?? null;
  out.emptyText = document.querySelector(".StudentBillingEmpty p")?.textContent ?? null;
  out.subText = document.querySelector(".StudentBillingSub")?.textContent ?? null;
  out.downloadRequests = (window.__ds07c?.requests || []).filter((r) => r.url.includes("/download")).length;
  return out;
})()`;

/* ── Minimal CDP client ────────────────────────────────────────────────────── */

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
  once(method, timeout = 25000) {
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

mkdirSync(OUT, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), "ds-invoice-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--hide-scrollbars",
    "about:blank",
  ],
  { stdio: "ignore" }
);

const results = [];
let exitCode = 0;

try {
  let version;
  for (let i = 0; i < 40; i++) {
    try {
      version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
      break;
    } catch {
      await sleep(250);
    }
  }
  if (!version) throw new Error("Chrome DevTools endpoint never came up");
  console.log(`Chrome: ${version.Browser}`);

  const target = await (
    await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })
  ).json();
  const cdp = new CDP(new WebSocket(target.webSocketDebuggerUrl));
  await new Promise((r, j) => {
    cdp.ws.addEventListener("open", r);
    cdp.ws.addEventListener("error", j);
  });

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");

  const pageErrors = [];
  cdp.events.set("Log.entryAdded", [
    (p) => {
      if (p.entry.level === "error") pageErrors.push(p.entry.text.slice(0, 120));
    },
  ]);
  cdp.events.set("Runtime.exceptionThrown", [
    (p) => pageErrors.push("EXC: " + (p.exceptionDetails?.text || "").slice(0, 120)),
  ]);

  const setViewport = (width) =>
    cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });

  for (const c of CASES) {
    const widths = c.widths || (c.states ? MEASURE_WIDTHS : [390]);

    for (const width of widths) {
      pageErrors.length = 0;
      await setViewport(width);
      const loaded = cdp.once("Page.loadEventFired");
      await cdp.send("Page.navigate", { url: BASE + c.url });
      await loaded;
      await sleep(1600);

      const res = await cdp.send("Runtime.evaluate", { expression: probe(), returnByValue: true });
      const v = res.result.value;
      // Record WHICH errors fired, so "7 errors" can be attributed rather than asserted away.
      v.__consoleErrors = [...new Set(pageErrors)].slice(0, 10);
      results.push({ case: c.name, width, ...v });

      const flag = v.__viewport.overflow > 1 ? "  <== H-OVERFLOW" : "";
      console.log(
        `${c.name.padEnd(11)} @${String(width).padEnd(5)} ` +
          `overflow=${String(v.__viewport.overflow).padStart(3)}px ` +
          `clipped=${String(v.__textOverflow).padStart(2)} ` +
          `rows=${String(v.rows?.length ?? 0)} ` +
          `actions=${(v.rows || []).filter((r) => r.action).length} ` +
          `err=${pageErrors.length}${flag}`
      );

      if (SHOT_WIDTHS.includes(width)) {
        const metrics = await cdp.send("Page.getLayoutMetrics");
        const cs = metrics.cssContentSize || metrics.contentSize;
        const shot = await cdp.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, width: cs.width, height: Math.min(cs.height, 2000), scale: 1 },
        });
        writeFileSync(join(OUT, `${c.name}-${width}.png`), Buffer.from(shot.data, "base64"));
      }
    }
  }

  writeFileSync(join(OUT, "measure.json"), JSON.stringify({ results }, null, 2));
  console.log(`\nWrote ${results.length} measurements + screenshots to ${OUT}`);
} catch (err) {
  console.error("Capture failed:", err.message);
  exitCode = 1;
} finally {
  chrome.kill();
  process.exit(exitCode);
}
