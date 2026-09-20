/**
 * Dev tool — measure computed styles on a real page at a given viewport width.
 *
 * Usage:
 *   node scripts/dsMeasure.mjs <url-path> <width> <selector> [selector...]
 *
 * Example:
 *   node scripts/dsMeasure.mjs /course/surya-namasakaram/12 1440 ".HighlightBox" ".HighlightBox h3"
 *
 * Zero dependencies: Node 22's global WebSocket drives the Chrome DevTools
 * Protocol. Used to decide questions that source order alone cannot answer
 * (duplicate selectors, cascade winners, nested scopes).
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9334;
const BASE = process.env.BASE_URL || "http://localhost:3001";

const [route = "/", widthArg = "1440", ...selectors] = process.argv.slice(2);
const width = Number(widthArg);
if (!selectors.length) {
  console.error("usage: node scripts/dsMeasure.mjs <url-path> <width> <selector> [selector...]");
  process.exit(2);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROPS = [
  "fontSize", "fontWeight", "fontFamily", "lineHeight", "color",
  "backgroundColor", "borderRadius", "borderTopWidth", "borderTopColor", "borderLeftWidth",
  "borderLeftColor", "padding", "marginBottom", "width", "maxWidth", "display", "gap",
];

const probe = (sels) => `(() => {
  const props = ${JSON.stringify(PROPS)};
  const out = {};
  for (const sel of ${JSON.stringify(sels)}) {
    const el = document.querySelector(sel);
    if (!el) { out[sel] = { found: false }; continue; }
    const cs = getComputedStyle(el);
    const o = { found: true, matched: document.querySelectorAll(sel).length, tag: el.tagName,
                cls: (el.className || '').toString().slice(0, 70) };
    props.forEach((p) => { o[p] = cs[p]; });
    const r = el.getBoundingClientRect();
    o.box = Math.round(r.width) + 'x' + Math.round(r.height);
    out[sel] = o;
  }
  out.__viewport = { w: window.innerWidth, overflow: document.documentElement.scrollWidth - window.innerWidth };
  return out;
})()`;

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.events = new Map();
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? reject(new Error(m.error.message)) : resolve(m.result);
      } else if (m.method) (this.events.get(m.method) || []).forEach((fn) => fn(m.params));
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => { this.pending.set(id, { resolve: res, reject: rej }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  once(method, timeout = 20000) {
    return new Promise((resolve) => {
      const list = this.events.get(method) || [];
      const fn = (p) => { this.events.set(method, list.filter((f) => f !== fn)); resolve(p); };
      list.push(fn); this.events.set(method, list);
      setTimeout(() => resolve(null), timeout);
    });
  }
}

const profile = mkdtempSync(join(tmpdir(), "ds-measure-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--disable-gpu", "about:blank"], { stdio: "ignore" });

try {
  let version;
  for (let i = 0; i < 40; i++) {
    try { version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); break; } catch { await sleep(250); }
  }
  if (!version) throw new Error("Chrome DevTools endpoint never came up");

  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
  const cdp = new CDP(new WebSocket(target.webSocketDebuggerUrl));
  await new Promise((r, j) => { cdp.ws.addEventListener("open", r); cdp.ws.addEventListener("error", j); });
  await cdp.send("Page.enable"); await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });

  const loaded = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: BASE + route });
  await loaded;
  await sleep(2500);

  const res = await cdp.send("Runtime.evaluate", { expression: probe(selectors), returnByValue: true });
  const data = res.result.value;
  console.log(`\n${BASE}${route}   @${width}px   (viewport ${data.__viewport.w}, overflow ${data.__viewport.overflow}px)\n`);
  for (const sel of selectors) {
    const v = data[sel];
    if (!v.found) { console.log(`${sel}\n   NOT FOUND\n`); continue; }
    console.log(`${sel}   [${v.matched} match, <${v.tag.toLowerCase()}> ${v.box}]`);
    console.log(`${"   cls".padEnd(20)} ${v.cls}`);
    PROPS.forEach((p) => {
      const val = v[p];
      if (val === "" || val === "auto" || val === "normal" || val === "rgba(0, 0, 0, 0)") return;
      console.log(`   ${p.padEnd(17)} ${val}`);
    });
    console.log();
  }
  cdp.ws.close();
} catch (e) {
  console.error("measure error:", e.message);
  process.exitCode = 1;
} finally {
  chrome.kill("SIGKILL");
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
