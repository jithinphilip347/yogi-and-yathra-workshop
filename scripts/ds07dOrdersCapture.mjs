/**
 * Dev tool — WORKSHOP-DS-07D orders UI capture harness.
 *
 * Renders the temporary /ds07d-orders-review harness (which mounts the REAL
 * MyOrders + OrderDetail through the REAL orderApi) at every width the sprint
 * names, records what the browser computed, captures PNGs, and reports the
 * rendered structure (card borders, badge tones, timeline states).
 *
 * The harness page must exist for the non-`profile-orders` cases; recreate it
 * from the report's appendix to reproduce them.
 *
 * Zero dependencies: Node 22's global WebSocket drives the DevTools Protocol.
 *
 * Usage:
 *   node scripts/ds07dOrdersCapture.mjs --out docs/screenshots/ds07d
 */
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = Number(process.env.CDP_PORT || 9340);
const BASE = process.env.BASE_URL || "http://localhost:3001";

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const OUT = argOf("--out", "docs/screenshots/ds07d");
const ONLY = argOf("--only", null);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CASES = [
  { name: "list", url: "/ds07d-orders-review", full: true },
  { name: "list-degraded", url: "/ds07d-orders-review?degraded=1", widths: [390], shots: [390] },
  { name: "list-empty", url: "/ds07d-orders-review?empty=1", widths: [390], shots: [390] },
  { name: "list-error", url: "/ds07d-orders-review?fail=1", widths: [390], shots: [390] },
  { name: "detail-mixed", url: "/ds07d-orders-review?autoOpen=ORD-2026-00042", full: true, settle: 3000 },
  { name: "detail-delivered", url: "/ds07d-orders-review?autoOpen=ORD-2026-00045", widths: [1440, 390], shots: [1440, 390], settle: 3000 },
  { name: "detail-cancelled", url: "/ds07d-orders-review?autoOpen=ORD-2026-00044", widths: [1440], shots: [1440], settle: 3000 },
];

const MEASURE_WIDTHS = [1440, 1024, 900, 800, 768, 640, 430, 390, 360, 320];
const SHOT_WIDTHS = [1440, 1024, 768, 390, 320];

/* ── In-page probe ─────────────────────────────────────────────────────────── */

const probe = () => `(() => {
  const out = {};
  const vw = document.documentElement.clientWidth;
  const scrollW = document.documentElement.scrollWidth;
  out.__viewport = { vw, scrollW, overflow: Math.max(0, scrollW - vw), scrollH: document.body.scrollHeight };

  const clipped = [...document.querySelectorAll(".OrderHistory *, .OrderDetail *")]
    .filter((n) => n.scrollWidth - n.clientWidth > 2 && getComputedStyle(n).overflowX !== "auto")
    .map((n) => {
      const cls = (n.className || "").toString().split(" ").filter(Boolean).slice(0, 2).join(".");
      return n.tagName.toLowerCase() + (cls ? "." + cls : "") + "+" + (n.scrollWidth - n.clientWidth);
    });
  out.__textOverflow = clipped.length;
  out.__clippedNodes = clipped.slice(0, 8);

  const title = document.querySelector(".OrderHistoryTitle, .OrderDetailTitle");
  out.title = title ? title.textContent : null;
  out.titleColor = title ? getComputedStyle(title).color : null;

  out.cardCount = document.querySelectorAll(".OrderCard").length;
  const card = document.querySelector(".OrderCard");
  if (card) {
    const cs = getComputedStyle(card);
    out.cardBg = cs.backgroundColor;
    out.cardBorderColor = cs.borderTopColor;
    out.cardBorderWidth = cs.borderTopWidth;
    out.cardRadius = cs.borderTopLeftRadius;
  }
  out.refColor = (() => { const e = document.querySelector(".OrderCardRef"); return e ? getComputedStyle(e).color : null; })();
  out.metaColor = (() => { const e = document.querySelector(".OrderCardMeta"); return e ? getComputedStyle(e).color : null; })();
  out.amountColor = (() => { const e = document.querySelector(".OrderCardAmount"); return e ? getComputedStyle(e).color : null; })();
  out.badges = [...document.querySelectorAll(".OrderCardSide .OrderBadge")].map((b) => b.textContent + "|" + b.className.replace("OrderBadge ", ""));
  out.typeBadges = [...document.querySelectorAll(".OrderCardTitleRow .OrderBadge")].map((b) => b.textContent);
  out.iconBg = (() => { const e = document.querySelector(".OrderCardIcon"); return e ? getComputedStyle(e).backgroundColor : null; })();
  out.iconColor = (() => { const e = document.querySelector(".OrderCardIcon"); return e ? getComputedStyle(e).color : null; })();
  out.amounts = [...document.querySelectorAll(".OrderCardAmount")].map((e) => e.textContent);
  out.emptyText = document.querySelector(".OrderEmpty p")?.textContent ?? null;
  out.alertText = document.querySelector(".OrderAlert")?.textContent ?? null;
  out.alertTone = (() => { const e = document.querySelector(".OrderAlert"); return e ? e.className : null; })();
  out.skeletonRows = document.querySelectorAll(".OrderSkeletonRow").length;

  out.sections = [...document.querySelectorAll(".OrderSectionTitle")].map((e) => e.textContent.trim());
  out.timeline = [...document.querySelectorAll(".OrderTimelineStep")].map((li) => {
    const marker = li.querySelector(".OrderTimelineMarker");
    return {
      label: li.querySelector(".OrderTimelineLabel")?.textContent,
      state: (li.className.match(/is-(done|current|upcoming)/) || [])[1] || null,
      // A done-but-negative terminal step keeps its done state and switches
      // tone; the resolved marker colour is the only honest proof of which one
      // actually rendered.
      tone: li.classList.contains("is-error") ? "error" : null,
      markerColor: marker ? getComputedStyle(marker).backgroundColor : null,
      date: li.querySelector(".OrderTimelineDate")?.textContent ?? null,
    };
  });
  out.itemRows = [...document.querySelectorAll(".OrderItem")].map((li) => ({
    name: li.querySelector(".OrderItemName")?.textContent,
    meta: li.querySelector(".OrderItemMeta")?.textContent,
    total: li.querySelector(".OrderItemTotal")?.textContent,
  }));
  out.addressLines = [...document.querySelectorAll(".OrderAddress div")].map((d) => d.textContent);
  out.trackLink = document.querySelector(".OrderTrackLink")?.textContent ?? null;
  out.detailBadges = [...document.querySelectorAll(".OrderDetailBadges .OrderBadge")].map((b) => b.textContent + "|" + b.className.replace("OrderBadge ", ""));
  out.detailMeta = document.querySelector(".OrderDetailMeta")?.textContent ?? null;
  out.rowValueColor = (() => { const e = document.querySelector(".OrderRowValue"); return e ? getComputedStyle(e).color : null; })();
  out.rowLabelColor = (() => { const e = document.querySelector(".OrderRowLabel"); return e ? getComputedStyle(e).color : null; })();
  out.sectionBg = (() => { const e = document.querySelector(".OrderSection"); return e ? getComputedStyle(e).backgroundColor : null; })();
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
const profileDir = mkdtempSync(join(tmpdir(), "ds-orders-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profileDir}`,
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
    cdp.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });

  const cases = ONLY ? CASES.filter((c) => ONLY.split(",").includes(c.name)) : CASES;

  for (const c of cases) {
    const widths = c.widths || (c.full ? MEASURE_WIDTHS : [390]);
    const shots = c.shots || (c.full ? SHOT_WIDTHS : [390]);

    for (const width of widths) {
      pageErrors.length = 0;
      await setViewport(width);
      const loaded = cdp.once("Page.loadEventFired");
      await cdp.send("Page.navigate", { url: BASE + c.url });
      await loaded;
      await sleep(c.settle || 1700);

      const res = await cdp.send("Runtime.evaluate", { expression: probe(), returnByValue: true });
      const v = res.result.value;
      v.__consoleErrors = [...new Set(pageErrors)].slice(0, 6);
      results.push({ case: c.name, width, ...v });

      const flag = v.__viewport.overflow > 1 ? "  <== H-OVERFLOW" : "";
      console.log(
        `${c.name.padEnd(17)} @${String(width).padEnd(5)} ` +
          `overflow=${String(v.__viewport.overflow).padStart(3)}px ` +
          `clipped=${String(v.__textOverflow).padStart(2)} ` +
          `cards=${String(v.cardCount).padStart(2)} ` +
          `sections=${String(v.sections?.length ?? 0)} ` +
          `timeline=${String(v.timeline?.length ?? 0)} ` +
          `err=${pageErrors.length}${flag}`
      );

      if (shots.includes(width)) {
        const metrics = await cdp.send("Page.getLayoutMetrics");
        const cs = metrics.cssContentSize || metrics.contentSize;
        const shot = await cdp.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, width: cs.width, height: Math.min(cs.height, 2600), scale: 1 },
        });
        writeFileSync(join(OUT, `${c.name}-${width}.png`), Buffer.from(shot.data, "base64"));
      }
    }
  }

  writeFileSync(join(OUT, "measure.json"), JSON.stringify({ results }, null, 2));
  console.log(`\nWrote ${results.length} measurements to ${OUT}`);
} catch (err) {
  console.error("Capture failed:", err.message);
  exitCode = 1;
} finally {
  chrome.kill();
  process.exit(exitCode);
}
