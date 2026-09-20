/**
 * Dev tool — WORKSHOP-DS-07D focus shots.
 *
 * Full-page captures are assembled elsewhere (ds07dOrdersCapture.mjs), but they
 * are thousands of pixels tall and cannot be read in one view. This crops a
 * region around a named selector instead.
 *
 * It crops rather than scrolls on purpose: the app puts its content inside an
 * inner scroll container, so `window.scrollTo` is a no-op here and every
 * scrolled shot silently came back showing the top of the page.
 *
 * Usage:
 *   node scripts/ds07dFocus.mjs --out docs/screenshots/ds07d/focus
 */
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = Number(process.env.CDP_PORT || 9342);
const BASE = process.env.BASE_URL || "http://localhost:3001";

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const OUT = argOf("--out", "docs/screenshots/ds07d/focus");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LIST = "/ds07d-orders-review";
const DETAIL = "/ds07d-orders-review?autoOpen=ORD-2026-00042";

const SHOTS = [
  { name: "list-desktop", url: LIST, width: 1440, height: 900, selector: ".OrderCard" },
  { name: "list-cards", url: LIST, width: 1440, height: 900, selector: ".OrderCard" },
  { name: "detail-header", url: DETAIL, width: 1440, height: 760, selector: ".OrderDetailTitle" },
  { name: "detail-timeline", url: DETAIL, width: 1440, height: 900, selector: ".OrderTimeline" },
  { name: "detail-items-address", url: DETAIL, width: 1440, height: 900, selector: ".OrderItems" },
  { name: "detail-cancelled", url: "/ds07d-orders-review?autoOpen=ORD-2026-00044", width: 1440, height: 900, selector: ".OrderTimeline" },
  { name: "list-mobile-390", url: LIST, width: 390, height: 900, selector: ".OrderCard" },
  { name: "detail-mobile-390", url: DETAIL, width: 390, height: 900, selector: ".OrderTimeline" },
  { name: "detail-mobile-320", url: DETAIL, width: 320, height: 900, selector: ".OrderItems" },
];

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
const profileDir = mkdtempSync(join(tmpdir(), "ds-focus-"));
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

  for (const shot of SHOTS) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: shot.width,
      height: shot.height,
      deviceScaleFactor: 1,
      mobile: shot.width < 768,
    });

    const loaded = cdp.once("Page.loadEventFired");
    await cdp.send("Page.navigate", { url: BASE + shot.url });
    await loaded;
    await sleep(shot.url.includes("autoOpen") ? 3000 : 1700);

    // Measure the region in DOCUMENT coordinates, then crop it.
    const res = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const el = document.querySelector(${JSON.stringify(shot.selector)});
        if (!el) return { found: false };
        const r = el.getBoundingClientRect();
        const pad = ${shot.pad ?? 140};
        return {
          found: true,
          x: 0,
          y: Math.max(0, Math.round(r.top)),
          w: Math.round(document.documentElement.clientWidth),
          h: Math.round(r.height + pad * 2),
          elTop: Math.round(r.top),
          elH: Math.round(r.height),
        };
      })()`,
      returnByValue: true,
    });

    const v = res.result.value || {};
    if (!v.found) {
      console.log(`${shot.name.padEnd(22)} selector ${shot.selector} NOT FOUND`);
      continue;
    }
    await sleep(300);

    const png = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: {
        x: v.x,
        y: Math.max(0, v.elTop - (shot.pad ?? 140)),
        width: v.w,
        height: Math.min(v.h, 1600),
        scale: 1,
      },
    });
    writeFileSync(join(OUT, `${shot.name}.png`), Buffer.from(png.data, "base64"));
    console.log(
      `${shot.name.padEnd(22)} @${String(shot.width).padEnd(5)} ` +
        `${shot.selector.padEnd(18)} clipY=${Math.max(0, v.elTop - (shot.pad ?? 140))} h=${Math.min(v.h, 1600)}`
    );
  }
} catch (err) {
  console.error("Focus capture failed:", err.message);
  process.exitCode = 1;
} finally {
  chrome.kill();
  process.exit(process.exitCode || 0);
}
