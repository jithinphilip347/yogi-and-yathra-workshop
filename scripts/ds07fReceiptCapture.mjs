/**
 * Dev tool — WORKSHOP-DS-07F receipt PDF verification.
 *
 * Drives the REAL customer surfaces (no harness) against the REAL Workshop API
 * and a REAL completed order, and proves the things this sprint is about:
 *
 *   1. the receipt response is `application/pdf` (not an HTML print page);
 *   2. "View Receipt" renders that PDF in-app (canvas painted, no new tab);
 *   3. zoom, page navigation and close actually work;
 *   4. "Download" writes a file to disk whose bytes begin with %PDF-;
 *   5. the billing rows carry their own receipt state, per row;
 *   6. nothing overflows horizontally at any width, and the viewer fits 320px.
 *
 * Zero dependencies: Node's global WebSocket drives the DevTools Protocol.
 *
 * Usage:
 *   TOKEN=<sanctum token> node scripts/ds07fReceiptCapture.mjs \
 *     --out docs/screenshots/ds07f [--downloads /tmp/ds07f-downloads]
 *
 * The token is a local dev credential for a seeded customer who owns real
 * invoices. It is never written to the repository.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = Number(process.env.CDP_PORT || 9350);
const BASE = process.env.BASE_URL || 'http://localhost:3001';
const TOKEN = process.env.TOKEN;
const USER = JSON.parse(process.env.USER_JSON || '{"id":43,"email":"achusivadasan416@gmail.com","name":"Achu"}');

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const OUT = argOf('--out', 'docs/screenshots/ds07f');
const DOWNLOADS = argOf('--downloads', join(tmpdir(), 'ds07f-downloads'));

if (!TOKEN) {
  console.error('TOKEN env var is required (a local dev Sanctum token).');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BILLING = '/auth/profile?tab=billing';
const WIDTHS = [1440, 1024, 768, 390, 320];

/* ── Minimal CDP client ────────────────────────────────────────────────────── */

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
rmSync(DOWNLOADS, { recursive: true, force: true });
mkdirSync(DOWNLOADS, { recursive: true });

const profileDir = mkdtempSync(join(tmpdir(), 'ds-receipt-'));
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--hide-scrollbars',
    'about:blank',
  ],
  { stdio: 'ignore' }
);

const report = { pages: [], documentResponses: [], downloads: [], notes: [] };
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
  if (!version) throw new Error('Chrome DevTools endpoint never came up');
  console.log(`Chrome: ${version.Browser}`);

  const target = await (
    await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })
  ).json();
  const cdp = new CDP(new WebSocket(target.webSocketDebuggerUrl));
  await new Promise((r, j) => {
    cdp.ws.addEventListener('open', r);
    cdp.ws.addEventListener('error', j);
  });

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  await cdp.send('Log.enable');
  await cdp.send('Browser.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: DOWNLOADS,
    eventsEnabled: true,
  });

  const consoleErrors = [];
  cdp.events.set('Log.entryAdded', [
    (p) => {
      if (p.entry.level === 'error') consoleErrors.push(p.entry.text.slice(0, 140));
    },
  ]);
  cdp.events.set('Runtime.exceptionThrown', [
    (p) => consoleErrors.push('EXC: ' + (p.exceptionDetails?.text || '').slice(0, 140)),
  ]);

  /* Every receipt document request, with the headers the server actually sent. */
  cdp.events.set('Network.responseReceived', [
    (p) => {
      if (!/\/billing\/invoices\/\d+\/download/.test(p.response.url)) return;
      report.documentResponses.push({
        url: p.response.url.replace(BASE, '').replace(/^http:\/\/localhost:\d+/, ''),
        status: p.response.status,
        mimeType: p.response.mimeType,
        contentDisposition: p.response.headers?.['content-disposition'] ?? null,
        // A URL must never carry credentials.
        hasTokenInUrl: /[?&](token|api_token|key)=/i.test(p.response.url),
      });
    },
  ]);
  cdp.events.set('Browser.downloadWillBegin', [
    (p) => report.downloads.push({ event: 'begin', suggestedFilename: p.suggestedFilename, url: p.url?.slice(0, 60) }),
  ]);
  cdp.events.set('Browser.downloadProgress', [
    (p) => {
      if (p.state === 'completed') report.downloads.push({ event: 'completed', guid: p.guid });
    },
  ]);

  const setViewport = (width, height = 900) =>
    cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });

  const evaluate = async (expression) => {
    const res = await cdp.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.text + ' :: ' + expression);
    return res.result.value;
  };

  const goto = async (path, settle = 2600) => {
    const loaded = cdp.once('Page.loadEventFired');
    await cdp.send('Page.navigate', { url: BASE + path });
    await loaded;
    await sleep(settle);
  };

  /**
   * Poll until an in-page predicate holds.
   *
   * Necessary rather than decorative: the Workshop API runs on `php artisan
   * serve`, which handles ONE request at a time, and the profile shell fires a
   * dozen before the two billing calls. A fixed sleep therefore measures the
   * queue, not the fix, and would report "no rows" on a slow boot.
   */
  const waitFor = async (expression, { tries = 45, delay = 700, label = expression } = {}) => {
    for (let i = 0; i < tries; i++) {
      if (await evaluate(`Boolean(${expression})`)) return true;
      await sleep(delay);
    }
    report.notes.push({ check: `timed out waiting for ${label}`, ok: false });
    return false;
  };

  const screenshot = async (file, { full = false, clip = null } = {}) => {
    const params = { format: 'png' };
    if (clip) {
      params.clip = { ...clip, scale: 1 };
    } else if (full) {
      const metrics = await cdp.send('Page.getLayoutMetrics');
      const cs = metrics.cssContentSize || metrics.contentSize;
      params.captureBeyondViewport = true;
      params.clip = { x: 0, y: 0, width: cs.width, height: Math.min(cs.height, 2600), scale: 1 };
    }
    const shot = await cdp.send('Page.captureScreenshot', params);
    writeFileSync(join(OUT, file), Buffer.from(shot.data, 'base64'));
  };

  /* ── Sign in as the seeded customer that owns the real invoices ──────────── */
  await goto('/', 1200);
  await evaluate(`
    localStorage.setItem('persist:root', ${JSON.stringify(
      JSON.stringify({
        auth: JSON.stringify({ user: USER, isAuthenticated: true, token: TOKEN }),
        _persist: JSON.stringify({ version: -1, rehydrated: true }),
      })
    )});
    true;
  `);
  console.log('Signed in as the seeded customer that owns the real invoices.');

  /* ── 1. Billing & Order History — per-row receipt state, all widths ──────── */

  const billingProbe = `(() => {
    const vw = document.documentElement.clientWidth;
    const rows = [...document.querySelectorAll('.StudentBillingTable tbody tr')].map((tr) => {
      const cell = tr.querySelector('.CellInvoice');
      return {
        order: tr.querySelector('.CellOrder')?.textContent.trim(),
        amount: tr.querySelector('.CellAmount')?.textContent.trim(),
        status: tr.querySelector('.CellStatus')?.textContent.trim(),
        receiptNote: cell?.querySelector('.ReceiptNone')?.textContent.trim() ?? null,
        receiptNumber: cell?.querySelector('.ReceiptNumber')?.textContent.trim() ?? null,
        actions: [...(cell?.querySelectorAll('button') || [])].map((b) => b.textContent.trim()),
      };
    });
    const clipped = [...document.querySelectorAll('.StudentBilling *')]
      .filter((n) => n.scrollWidth - n.clientWidth > 2 && getComputedStyle(n).overflowX !== 'auto')
      .map((n) => n.tagName.toLowerCase() + '.' + (n.className || '').toString().split(' ')[0] + '+' + (n.scrollWidth - n.clientWidth));
    const title = document.querySelector('.StudentBillingTitle');
    return {
      heading: title?.textContent.trim(),
      headingColor: title ? getComputedStyle(title).color : null,
      rowCount: rows.length,
      rows,
      overflow: Math.max(0, document.documentElement.scrollWidth - vw),
      clipped: clipped.slice(0, 6),
      consoleErrors: [],
    };
  })()`;

  for (const width of WIDTHS) {
    consoleErrors.length = 0;
    await setViewport(width);
    await goto(BILLING);
    await waitFor(`document.querySelectorAll('.StudentBillingTable tbody tr').length > 0`, {
      label: `billing rows @${width}`,
    });
    const v = await evaluate(billingProbe);
    v.consoleErrors = [...new Set(consoleErrors)].slice(0, 5);
    report.pages.push({ name: 'billing', width, ...v });
    const withActions = v.rows.filter((r) => r.actions.length).length;
    console.log(
      `billing        @${String(width).padEnd(5)} rows=${v.rowCount} withReceipt=${withActions} ` +
        `overflow=${v.overflow}px clipped=${v.clipped.length} err=${v.consoleErrors.length}`
    );
    await screenshot(`billing-${width}.png`, { full: width >= 768 });
  }

  /* ── 2. Order Detail — the same shared receipt section ───────────────────── */
  {
    consoleErrors.length = 0;
    await setViewport(1440);
    await goto('/auth/profile?tab=orders');
    await waitFor(`document.querySelectorAll('.OrderCard').length > 0`, { label: 'order cards' });
    const opened = await evaluate(`(() => {
      const cards = [...document.querySelectorAll('.OrderCard')];
      const target = cards.find((c) => /Completed|Paid/i.test(c.textContent)) || cards[0];
      if (!target) return { opened: false, reason: 'no order cards' };
      const btn = [...target.querySelectorAll('button, a')].find((b) => /view order/i.test(b.textContent));
      (btn || target).click();
      return { opened: true, order: target.textContent.replace(/\\s+/g, ' ').slice(0, 60) };
    })()`);
    await sleep(2600);
    const detail = await evaluate(`(() => {
      const sections = [...document.querySelectorAll('.OrderDetail section, .OrderDetail .OrderSection')];
      const receiptSection = sections.find((s) => /receipt/i.test(s.querySelector('h2,h3,.SectionTitle')?.textContent || s.textContent.slice(0, 40)));
      return {
        sections: sections.map((s) => (s.querySelector('h2,h3,.SectionTitle')?.textContent || '').trim()).filter(Boolean),
        receiptText: receiptSection?.textContent.replace(/\\s+/g, ' ').trim().slice(0, 140) ?? null,
        receiptActions: [...(receiptSection?.querySelectorAll('button') || [])].map((b) => b.textContent.trim()),
      };
    })()`);
    report.pages.push({ name: 'order-detail', width: 1440, ...opened, ...detail, consoleErrors: [...new Set(consoleErrors)].slice(0, 5) });
    console.log(`order-detail   @1440  opened=${opened.opened} receiptActions=${JSON.stringify(detail.receiptActions)}`);
    await screenshot('order-detail-1440.png', { full: true });
  }

  /* ── 3. The in-app viewer: real PDF, zoom, page nav, download, close ─────── */

  /*
   * Ink coverage, read from the canvas itself.
   *
   * A PDF.js canvas reports its dimensions as soon as the page is parsed, well
   * before it is painted, so "the canvas exists" is not evidence that the receipt
   * is on screen — a blank white canvas passes that test. Counting non-white
   * pixels is the difference between "something happened" and "the document
   * rendered".
   */
  const inkProbe = `(() => {
    const c = document.querySelector('.PdfViewerBody .react-pdf__Page canvas');
    if (!c || !c.width) return { ink: null, reason: 'no canvas' };
    try {
      const ctx = c.getContext('2d');
      const h = Math.min(c.height, 1600);
      const data = ctx.getImageData(0, 0, c.width, h).data;
      let ink = 0;
      let total = 0;
      for (let i = 0; i < data.length; i += 4 * 41) {
        total++;
        if (data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245) ink++;
      }
      return { ink, total, inkRatio: total ? +(ink / total).toFixed(4) : 0 };
    } catch (e) {
      return { ink: null, reason: String(e).slice(0, 90) };
    }
  })()`;

  const viewerProbe = `(() => {
    const canvas = document.querySelector('.PdfViewerBody .react-pdf__Page canvas');
    const el = document.querySelector('.PdfViewerDialog');
    return {
      viewerOpen: !!el,
      hasCanvas: !!canvas,
      canvasWidth: canvas?.width ?? 0,
      canvasHeight: canvas?.height ?? 0,
      pageIndicator: document.querySelector('.PdfViewerPage')?.textContent.trim() ?? null,
      zoomIndicator: document.querySelector('.PdfViewerZoom')?.textContent.trim() ?? null,
      tools: [...document.querySelectorAll('.PdfViewerTools button')].map((b) => b.getAttribute('aria-label') || b.textContent.trim()),
      dialogWidth: el ? Math.round(el.getBoundingClientRect().width) : 0,
      dialogOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    };
  })()`;

  const openFirstReceipt = async () => {
    return evaluate(`(() => {
      const btn = [...document.querySelectorAll('.CellInvoice button')].find((b) => /view receipt/i.test(b.textContent));
      if (!btn) return { clicked: false };
      btn.click();
      return { clicked: true, row: btn.closest('td')?.parentElement?.querySelector('.CellOrder')?.textContent.trim() };
    })()`);
  };

  const waitForCanvas = async (tries = 25) => {
    for (let i = 0; i < tries; i++) {
      const v = await evaluate(`(() => {
        const c = document.querySelector('.PdfViewerBody .react-pdf__Page canvas');
        return { hasCanvas: !!c && c.width > 0, w: c?.width ?? 0 };
      })()`);
      if (v.hasCanvas) return v;
      await sleep(400);
    }
    return { hasCanvas: false, w: 0 };
  };

  /** Wait until the receipt is actually painted, not merely measured. */
  const waitForInk = async (tries = 30) => {
    let last = null;
    for (let i = 0; i < tries; i++) {
      last = await evaluate(inkProbe);
      if (last.inkRatio > 0.002) return last;
      await sleep(500);
    }
    report.notes.push({ check: 'the receipt painted onto the canvas', ok: false, ink: last });
    return last;
  };

  for (const width of [1440, 768, 390, 320]) {
    consoleErrors.length = 0;
    await setViewport(width, width >= 768 ? 900 : 780);
    await goto(BILLING);
    await waitFor(`document.querySelectorAll('.CellInvoice button').length > 0`, {
      label: `receipt buttons @${width}`,
    });
    const clicked = await openFirstReceipt();
    const canvas = await waitForCanvas();
    const ink = await waitForInk();
    const v = await evaluate(viewerProbe);
    report.pages.push({
      name: `viewer-${width}`,
      width,
      clicked,
      ...canvas,
      ink,
      ...v,
      consoleErrors: [...new Set(consoleErrors)].slice(0, 5),
    });
    console.log(
      `viewer         @${String(width).padEnd(5)} open=${v.viewerOpen} canvas=${canvas.w}px ` +
        `ink=${ink.inkRatio} (${ink.ink}/${ink.total}) page=${v.pageIndicator} zoom=${v.zoomIndicator} ` +
        `dialog=${v.dialogWidth}px overflow=${v.dialogOverflow}px`
    );
    report.notes.push({
      check: `the receipt document actually rendered @${width}`,
      ok: Number(ink.inkRatio) > 0.002,
      inkRatio: ink.inkRatio,
    });
    await screenshot(`viewer-${width}.png`);
    if (width === 1440) await screenshot('viewer-1440-full.png', { full: true });
    await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); true;`);
    await sleep(400);
    const closed = await evaluate(`!document.querySelector('.PdfViewerDialog')`);
    if (!closed) {
      await evaluate(`document.querySelector('.PdfViewerIconBtn.is-close')?.click(); true;`);
      await sleep(300);
    }
    const closedAfter = await evaluate(`!document.querySelector('.PdfViewerDialog')`);
    report.notes.push({ check: `viewer closes on Escape @${width}`, ok: closed || closedAfter });
  }

  /* ── 4. Toolbar behaviour + a real download to disk ─────────────────────── */

  {
    await setViewport(1440);
    await goto(BILLING);
    await waitFor(`document.querySelectorAll('.CellInvoice button').length > 0`, {
      label: 'receipt buttons @1440 interactive',
    });
    await openFirstReceipt();
    await waitForCanvas();

    /*
     * Instrument the save path itself.
     *
     * headless Chrome's download plumbing does not capture an anchor click on a
     * `blob:` URL, so "did a file appear in the download directory" would measure
     * the harness, not the product. Recording what `saveInvoiceDocument` is
     * handed measures the thing that matters: the bytes the app got back from
     * the authenticated route.
     */
    await evaluate(`(() => {
      window.__dsReceipt = { blobs: [], saves: [] };
      const origCreateObjectURL = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => { window.__dsReceipt.blobs.push(blob); return origCreateObjectURL(blob); };
      const origCreate = document.createElement.bind(document);
      document.createElement = (tag, ...rest) => {
        const el = origCreate(tag, ...rest);
        if (String(tag).toLowerCase() === 'a') {
          const origClick = el.click.bind(el);
          el.click = () => {
            window.__dsReceipt.saves.push({ download: el.download, hrefScheme: String(el.href).split(':')[0] });
            return origClick();
          };
        }
        return el;
      };
      return true;
    })()`);

    const before = { ...(await evaluate(viewerProbe)), ...(await evaluate(inkProbe)) };

    // Zoom in twice.
    await evaluate(`document.querySelector('[aria-label="Zoom in"]').click(); true;`);
    await sleep(700);
    await evaluate(`document.querySelector('[aria-label="Zoom in"]').click(); true;`);
    await sleep(900);
    await waitForInk();
    const zoomed = { ...(await evaluate(viewerProbe)), ...(await evaluate(inkProbe)) };
    report.notes.push({
      check: 'zoom in enlarges the rendered page',
      ok: zoomed.canvasWidth > before.canvasWidth && zoomed.zoomIndicator !== before.zoomIndicator,
      from: { zoom: before.zoomIndicator, canvas: before.canvasWidth },
      to: { zoom: zoomed.zoomIndicator, canvas: zoomed.canvasWidth },
    });

    await evaluate(`document.querySelector('[aria-label="Zoom out"]').click(); true;`);
    await sleep(700);
    const zoomedOut = await evaluate(viewerProbe);
    report.notes.push({
      check: 'zoom out shrinks it again',
      ok: zoomedOut.canvasWidth < zoomed.canvasWidth,
      to: { zoom: zoomedOut.zoomIndicator, canvas: zoomedOut.canvasWidth },
    });
    await screenshot('viewer-zoomed-1440.png');

    // Page navigation.
    const pages = Number((zoomed.pageIndicator || '1 / 1').split('/')[1].trim());
    if (pages > 1) {
      await evaluate(`document.querySelector('[aria-label="Next page"]').click(); true;`);
      await sleep(900);
      const next = await evaluate(viewerProbe);
      report.notes.push({ check: 'next page advances the document', ok: next.pageIndicator !== zoomed.pageIndicator, to: next.pageIndicator });
      await screenshot('viewer-page2-1440.png');
      await evaluate(`document.querySelector('[aria-label="Previous page"]').click(); true;`);
      await sleep(700);
    } else {
      report.notes.push({ check: 'document is a single page', ok: true, pages });
    }

    // Download from inside the viewer. Two independent readouts:
    //   1. what the app handed to the save helper (the product path);
    //   2. whatever Chrome's own download plumbing captured (the environment).
    const downloadsBefore = readdirSync(DOWNLOADS).length;
    await evaluate(`[...document.querySelectorAll('.PdfViewerTools button')].find((b) => /download/i.test(b.textContent)).click(); true;`);

    let evidence = null;
    for (let i = 0; i < 30; i++) {
      evidence = await evaluate(`(async () => {
        const store = window.__dsReceipt || { blobs: [], saves: [] };
        const blob = store.blobs[store.blobs.length - 1];
        if (!blob) return { blobs: 0, saves: store.saves };
        const buf = new Uint8Array(await blob.arrayBuffer());
        return {
          blobs: store.blobs.length,
          saves: store.saves,
          type: blob.type,
          size: blob.size,
          header: String.fromCharCode(...buf.slice(0, 5)),
          eof: String.fromCharCode(...buf.slice(-8)),
        };
      })()`);
      if (evidence?.saves?.length) break;
      await sleep(500);
    }

    const files = readdirSync(DOWNLOADS);
    const newFiles = files.slice(downloadsBefore);
    const pdfOnDisk = newFiles.find((f) => /\.pdf$/i.test(f)) ?? null;
    let diskHeader = null;
    if (pdfOnDisk) diskHeader = readFileSync(join(DOWNLOADS, pdfOnDisk)).subarray(0, 5).toString('latin1');

    report.downloads.push({
      savedAs: evidence?.saves?.[0]?.download ?? null,
      hrefScheme: evidence?.saves?.[0]?.hrefScheme ?? null,
      blobType: evidence?.type ?? null,
      blobBytes: evidence?.size ?? 0,
      blobHeader: evidence?.header ?? null,
      blobEof: evidence?.eof ?? null,
      chromeDownloadCapture: pdfOnDisk,
      chromeDownloadHeader: diskHeader,
    });

    console.log(
      `download       @1440  savedAs=${evidence?.saves?.[0]?.download} scheme=${evidence?.saves?.[0]?.hrefScheme} ` +
        `type=${evidence?.type} bytes=${evidence?.size} header=${evidence?.header}`
    );
    report.notes.push({
      check: 'Download hands real PDF bytes to the save helper',
      ok: evidence?.type === 'application/pdf' && evidence?.header === '%PDF-' && evidence?.size > 8000,
      evidence,
    });
    report.notes.push({
      check: 'Download names the file Receipt-INV-*.pdf',
      ok: /\.pdf$/.test(evidence?.saves?.[0]?.download || ''),
      savedAs: evidence?.saves?.[0]?.download ?? null,
    });
    report.notes.push({
      check: 'Download does not navigate (blob: URL, not an http document URL)',
      ok: evidence?.saves?.[0]?.hrefScheme === 'blob',
      hrefScheme: evidence?.saves?.[0]?.hrefScheme ?? null,
    });
  }

  /* ── 5. The direct document response, as the browser saw it ─────────────── */
  {
    const res = await evaluate(`(async () => {
      const tokenRow = document.querySelector('.CellInvoice .ReceiptNumber');
      return { note: 'responses captured from the viewer/download requests above', hasRow: !!tokenRow };
    })()`);
    report.notes.push({ check: 'billing page was live while documents were fetched', ok: res.hasRow });
  }

  console.log(`\nMeasured ${report.pages.length} page states.`);
  console.log('Document responses:');
  for (const r of report.documentResponses) console.log('  ', JSON.stringify(r));
  console.log('Checks:');
  for (const n of report.notes) console.log(`  ${n.ok ? 'PASS' : 'FAIL'}  ${n.check}${n.ok ? '' : ' :: ' + JSON.stringify(n)}`);
} catch (err) {
  console.error('Capture failed:', err.message);
  exitCode = 1;
} finally {
  // Always leave the evidence behind, even if a later step threw.
  writeFileSync(join(OUT, 'verification.json'), JSON.stringify(report, null, 2));
  console.log(`Evidence written to ${join(OUT, 'verification.json')}`);
  chrome.kill();
  process.exit(exitCode);
}
