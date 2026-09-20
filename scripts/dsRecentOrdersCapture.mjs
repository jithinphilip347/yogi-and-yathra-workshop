/**
 * Dev tool — capture the redesigned Recent Orders section on the dashboard.
 *
 * Drives the REAL customer dashboard against the REAL Workshop API
 * at desktop (1440px) and mobile (390px) widths.
 *
 * Usage:
 *   TOKEN=<sanctum token> node scripts/dsRecentOrdersCapture.mjs [--out docs/screenshots/ds-recent-orders]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9360;
const BASE = process.env.BASE_URL || 'http://localhost:3001';
const TOKEN = process.env.TOKEN;
const USER = JSON.parse(process.env.USER_JSON || '{"id":43,"email":"achusivadasan416@gmail.com","name":"Achu"}');

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const OUT = argOf('--out', 'docs/screenshots/ds-recent-orders');

if (!TOKEN) {
  console.error('TOKEN env var is required.');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = new Map();
    ws.addEventListener('message', (e) => {
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
}

import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });

const profileDir = mkdtempSync(join(tmpdir(), 'ds-recent-orders-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profileDir}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  'about:blank',
], { stdio: 'ignore' });

let exitCode = 0;

try {
  let version;
  for (let i = 0; i < 40; i++) {
    try {
      version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
      break;
    } catch { await sleep(250); }
  }
  if (!version) throw new Error('Chrome DevTools endpoint never came up');
  console.log(`Chrome: ${version.Browser}`);

  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const cdp = new CDP(new WebSocket(target.webSocketDebuggerUrl));
  await new Promise((r, j) => { cdp.ws.addEventListener('open', r); cdp.ws.addEventListener('error', j); });

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  const evaluate = async (expression) => {
    const res = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.text + ' :: ' + expression);
    return res.result.value;
  };

  const goto = async (path, settle = 3000) => {
    const loaded = new Promise((resolve) => {
      const handler = (p) => { cdp.events.delete?.('Page.loadEventFired'); resolve(p); };
      cdp.ws.addEventListener('message', function h(e) {
        const msg = JSON.parse(e.data);
        if (msg.method === 'Page.loadEventFired') { cdp.ws.removeEventListener('message', h); resolve(); }
      });
    });
    await cdp.send('Page.navigate', { url: BASE + path });
    await loaded;
    await sleep(settle);
  };

  const setViewport = (width, height = 900) =>
    cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });

  const screenshot = async (file) => {
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(OUT, file), Buffer.from(shot.data, 'base64'));
  };

  // Sign in
  await goto('/', 1500);
  await evaluate(`
    localStorage.setItem('persist:root', ${JSON.stringify(JSON.stringify({
      auth: JSON.stringify({ user: USER, isAuthenticated: true, token: TOKEN }),
      _persist: JSON.stringify({ version: -1, rehydrated: true }),
    }))});
    true;
  `);

  // Desktop: dashboard
  await setViewport(1440, 900);
  await goto('/auth/profile', 5000);

  // Click Dashboard tab if visible
  await evaluate(`(() => {
    const items = document.querySelectorAll('.LeftsideNavItem div, .LeftsideNav li');
    for (const item of items) { if (item.textContent.includes('Dashboard')) { item.click(); break; } }
    return true;
  })()`);
  await sleep(2000);

  // Scroll to Recent Orders
  await evaluate(`(() => {
    const el = document.querySelector('.RecentOrders');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    return !!el;
  })()`);
  await sleep(1000);

  await screenshot('recent-orders-desktop.png');
  console.log('✓ Desktop screenshot saved');

  // Mobile: dashboard
  await setViewport(390, 844);
  await goto('/auth/profile', 4000);

  await evaluate(`(() => {
    const items = document.querySelectorAll('.LeftsideNavItem div, .LeftsideNav li');
    for (const item of items) { if (item.textContent.includes('Dashboard')) { item.click(); break; } }
    return true;
  })()`);
  await sleep(2000);

  await evaluate(`(() => {
    const el = document.querySelector('.RecentOrders');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    return !!el;
  })()`);
  await sleep(1000);

  await screenshot('recent-orders-mobile.png');
  console.log('✓ Mobile screenshot saved');

  // Verify the component rendered correctly
  const state = await evaluate(`(() => {
    const rows = document.querySelectorAll('.OrderRow');
    const badges = [...document.querySelectorAll('.SummaryBadge')].map(b => b.textContent.trim());
    const viewAll = document.querySelector('.ViewAllLink');
    const header = document.querySelector('.RecentOrdersHeader h2');
    return {
      rowCount: rows.length,
      badges,
      hasViewAll: !!viewAll,
      headerText: header?.textContent || 'none',
    };
  })()`);
  console.log('Component state:', JSON.stringify(state, null, 2));

} catch (err) {
  console.error('Error:', err.message);
  exitCode = 1;
} finally {
  chrome.kill('SIGKILL');
  process.exit(exitCode);
}
