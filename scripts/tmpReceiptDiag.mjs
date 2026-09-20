/** TEMPORARY dev diagnostic — deleted after use. */
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9377;
const BASE = 'http://localhost:3001';
const TOKEN = process.env.TOKEN;
const USER = { id: 43, email: 'achusivadasan416@gmail.com', name: 'Achu' };

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

const profileDir = mkdtempSync(join(tmpdir(), 'diag-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profileDir}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  'about:blank',
], { stdio: 'ignore' });

const exceptions = [];
const logErrors = [];
const cdpreq = new Map();

const report = {};
try {
  let version;
  for (let i = 0; i < 40; i++) {
    try { version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); break; }
    catch { await sleep(250); }
  }
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const cdp = new CDP(new WebSocket(target.webSocketDebuggerUrl));
  await new Promise((r, j) => { cdp.ws.addEventListener('open', r); cdp.ws.addEventListener('error', j); });

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  await cdp.send('Network.enable');

  const net = [];
  const t0 = Date.now();
  cdp.events.set('Network.requestWillBeSent', [(p) => {
    if (!/download\?disposition|pdf\.worker|react-pdf|pdfjs/i.test(p.request.url)) return;
    net.push({ phase: 'start', t: Date.now() - t0, url: p.request.url.replace(BASE, ''), type: p.type });
  }]);
  cdp.events.set('Network.loadingFinished', [(p) => {
    const r = cdpreq.get(p.requestId);
    if (!r) return;
    net.push({ phase: 'done', t: Date.now() - t0, url: r, encoded: p.encodedDataLength });
  }]);
  cdp.events.set('Network.responseReceived', [(p) => {
    if (!/download\?disposition|pdf\.worker|react-pdf|pdfjs/i.test(p.response.url)) return;
    cdpreq.set(p.requestId, p.response.url.replace(BASE, ''));
  }]);

  cdp.events.set('Runtime.exceptionThrown', [(p) => {
    exceptions.push({
      text: p.exceptionDetails?.text,
      desc: p.exceptionDetails?.exception?.description?.slice(0, 400),
      url: p.exceptionDetails?.url,
      line: p.exceptionDetails?.lineNumber,
    });
  }]);
  cdp.events.set('Log.entryAdded', [(p) => {
    if (p.entry.level === 'error' && !/:8080/.test(p.entry.text)) logErrors.push(p.entry.text.slice(0, 200));
  }]);

  const evaluate = async (expression) => {
    const res = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.text + ' :: ' + expression);
    return res.result.value;
  };
  const goto = async (path, settle = 2500) => {
    await cdp.send('Page.navigate', { url: BASE + path });
    await sleep(settle);
  };

  await goto('/', 1500);
  await evaluate(`
    localStorage.setItem('persist:root', ${JSON.stringify(JSON.stringify({
      auth: JSON.stringify({ user: USER, isAuthenticated: true, token: TOKEN }),
      _persist: JSON.stringify({ version: -1, rehydrated: true }),
    }))});
    true;
  `);

  await goto('/auth/profile?tab=billing', 4000);

  // The Workshop API is single-threaded `php artisan serve`; wait for the rows.
  for (let i = 0; i < 40; i++) {
    report.buttons = await evaluate(`[...document.querySelectorAll('button')].filter(b => /View Receipt/i.test(b.textContent)).length`);
    if (report.buttons > 0) break;
    await sleep(700);
  }

  // Instrument the page so the gap between the click and the actual request is
  // measurable rather than guessed at from CDP round trips.
  await evaluate(`(() => {
    window.__marks = [];
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (...args) {
      if (/invoices\\/\\d+\\/download/.test(this.__url || '')) window.__marks.push(['xhr-send', performance.now()]);
      return origSend.apply(this, args);
    };
    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this.__url = url;
      return origOpen.call(this, method, url, ...rest);
    };
    document.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b && /View Receipt/i.test(b.textContent)) window.__marks.push(['click', performance.now()]);
    }, true);
    return true;
  })()`);

  if (process.env.PREFETCH === '1') {
    await evaluate(`(() => {
      const b = [...document.querySelectorAll('button')].find(b => /View Receipt/i.test(b.textContent));
      const r = b.getBoundingClientRect();
      for (const type of ['mouseover', 'mouseenter', 'mousemove']) {
        b.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window, clientX: r.x + 5, clientY: r.y + 5 }));
      }
      window.__marks.push(['hover', performance.now()]);
      return true;
    })()`);
    await sleep(Number(process.env.HOVER_MS || 1500));
  }

  const buttonTexts = () => evaluate(`[...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => t && !/^(Home|Courses|Cart|Wishlist|Notifications|All Courses|About|Blog|Contact)$/.test(t)).slice(0, 20)`);
  report.textsBeforeClick = await buttonTexts();

  const clickAt = Date.now();
  report.clicked = await evaluate(`(() => {
    const b = [...document.querySelectorAll('button')].find(b => /View Receipt/i.test(b.textContent));
    if (!b) return false;
    b.click();
    return true;
  })()`);
  report.textsAfterClick = await buttonTexts();

  const frames = [];
  const POLL = Number(process.env.POLL_MS || 800);
  for (let i = 0; i < 60; i++) {
    await sleep(POLL);
    const state = await evaluate(`(() => {
      const c = document.querySelector('.PdfViewerBody .react-pdf__Page canvas');
      let ink = null;
      if (c && c.width) {
        try {
          const ctx = c.getContext('2d', { willReadFrequently: true });
          const d = ctx.getImageData(0, 0, c.width, Math.min(c.height, 300)).data;
          let n = 0; for (let k = 0; k < d.length; k += 4) if (d[k] < 245 || d[k+1] < 245 || d[k+2] < 245) n++;
          ink = n;
        } catch (e) { ink = 'err'; }
      }
      return {
        crash: document.body.innerText.includes('Application error'),
        viewer: !!document.querySelector('.PdfViewerDialog'),
        errorState: !!document.querySelector('.PdfViewerState.is-error'),
        stateText: document.querySelector('.PdfViewerBody')?.innerText.slice(0, 80) ?? null,
        canvas: c ? c.width + 'x' + c.height : null,
        ink,
      };
    })()`);
    frames.push({ t: Date.now() - clickAt, ...state });
    if (state.crash || (state.ink && state.ink !== 'err' && state.ink > 500)) break;
  }

  report.frames = frames;
  report.exceptions = exceptions;
  report.logErrors = logErrors.slice(0, 12);
  report.net = net;
  report.marks = await evaluate('window.__marks').catch(() => null);
  console.log(JSON.stringify(report, null, 2));
} finally {
  chrome.kill('SIGKILL');
}
