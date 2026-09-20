/**
 * Dev tool — WORKSHOP-DS-07A checkout capture harness.
 *
 * Renders /cart and /checkout in headless Chrome with a seeded cart, records what
 * the browser actually computed for every surface under review, and writes real
 * PNG screenshots. Unlike the DS-01/DS-03 harness this sprint requires pixels,
 * because the whole question is whether Checkout *looks* like the rest of the
 * Workshop — which computed CSS alone cannot answer.
 *
 * Zero dependencies: Node 22's global WebSocket drives the DevTools Protocol.
 *
 * Usage:
 *   node scripts/dsCheckoutCapture.mjs --out docs/screenshots/ds07a --json /tmp/before.json
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = Number(process.env.CDP_PORT || 9336);
const BASE = process.env.BASE_URL || "http://localhost:3001";

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const OUT = argOf("--out", "docs/screenshots/ds07a");
const JSON_OUT = argOf("--json", join(OUT, "measure.json"));
// 1024 is the narrowest width that still renders the HORIZONTAL stepper (the
// compact one takes over at <=768), so it is required to review both.
const SHOT_WIDTHS = [1440, 1024, 768, 390, 320];
// 800/900 are in the list because the two-column checkout is tightest just above
// the single-column breakpoint, which is where a form grid silently cramps.
const MEASURE_WIDTHS = [1440, 1024, 900, 800, 768, 640, 430, 390, 360, 320];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── Seed data ─────────────────────────────────────────────────────────────── */

const learningItem = {
  id: "item_course_12",
  cart_key: "course:12",
  type: "course",
  productable_type: "Course",
  productable_id: 12,
  title: "Surya Namaskaram Foundation Course",
  subtitle: "8 Weeks • Live Practice Sessions",
  image: null,
  price: 1999,
  original_price: 2499,
  quantity: 1,
  domain: "workshop",
  meta: {},
};

const physicalItem = {
  id: "item_product_10",
  cart_key: "product:10",
  type: "normal",
  productable_type: "Product",
  productable_id: 10,
  title: "Organic Cotton Yoga Mat",
  subtitle: "",
  image: null,
  price: 999,
  original_price: 1200,
  quantity: 1,
  domain: "ecommerce",
  meta: {},
};

const address = {
  name: "Asha Menon",
  email: "asha@example.com",
  phone: "9876543210",
  address: "12 Temple Road, Fort",
  city: "Kochi",
  state: "Kerala",
  zip: "682001",
  country: "India",
};

const checkoutBase = {
  sessionId: "cs_capture_1",
  items: [learningItem, physicalItem],
  billingAddress: address,
  shippingAddress: address,
  sameAsBilling: true,
  courierPartner: "standard",
  paymentMethod: "razorpay",
  delegatedPhysicalOrder: null,
  ecommerceCustomer: { id: null, email: "", name: "", status: null },
  isDelegating: false,
  delegationError: null,
  isProcessing: false,
  error: null,
};

const stepOrder = {
  order_number: "WS-2026-0042",
  order: { amount: 2998 },
};

const cartState = {
  items: [learningItem, physicalItem],
  isDrawerOpen: false,
  appliedCoupon: null,
  isProcessing: false,
  error: null,
  validation: {
    isValidating: false,
    lastValidated: null,
    checkoutSessionId: null,
    hasErrors: false,
    hasChanges: false,
    summary: null,
  },
};

/** Persisted redux-persist payload: each slice is itself a JSON string. */
const persisted = (checkout, payment = { status: 'idle', activeTransactionId: null }) =>
  JSON.stringify({
    cart: JSON.stringify(cartState),
    checkout: JSON.stringify(checkout),
    payment: JSON.stringify(payment),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  });

/* Unified-order payloads, shaped exactly like
   `CheckoutController::createUnifiedOrder` returns them, so the success page is
   measured against real data rather than a convenient invention:

     order.subtotal      = $learningPayable   (already NET of both discounts)
     order.discount      = $discount_amount
     order.coupon_discount
     order.amount        = $totalPayable

   2499 list - 500 catalogue = 1999 learning + 999 physical = 2998 total. */
const unifiedOrder = (overrides = {}) => ({
  checkout_session_id: 'cs_capture_1',
  domain: 'mixed',
  order: {
    id: 7,
    order_number: 'WS-2026-0042',
    amount: 2998,
    subtotal: 1999,
    discount: 500,
    coupon_discount: 0,
    currency: 'INR',
    status: 'pending',
  },
  payment: { id: 11, amount: 2998, status: 'captured', gateway: 'razorpay' },
  ecommerce_order: { id: 2449, status: 'pending_fulfillment', total: 999 },
  amounts: { learning: 1999, physical: 999, total: 2998 },
  ...overrides,
});

const physicalOnlyOrder = unifiedOrder({
  domain: 'physical',
  order: { ...unifiedOrder().order, amount: 999, subtotal: 0, discount: 0 },
  amounts: { learning: 0, physical: 999, total: 999 },
});

const captured = { status: 'completed', activeTransactionId: 'pay_QRS1234567890' };

const ONLY = argOf("--only", ""); // comma-separated case names, for fast focused runs

const CASES = [
  { name: "cart", route: "/cart", seed: persisted({ ...checkoutBase, activeStep: 1, activeOrder: null }) },
  {
    name: "checkout-step1",
    route: "/checkout",
    seed: persisted({ ...checkoutBase, activeStep: 1, activeOrder: null }),
  },
  {
    name: "checkout-step2",
    route: "/checkout",
    seed: persisted({ ...checkoutBase, activeStep: 2, activeOrder: null }),
  },
  {
    name: "checkout-step3",
    route: "/checkout",
    seed: persisted({ ...checkoutBase, activeStep: 3, activeOrder: stepOrder }),
  },
  {
    name: "success-mixed",
    route: "/checkout/success",
    seed: persisted({ ...checkoutBase, activeStep: 3, activeOrder: unifiedOrder() }, captured),
  },
  {
    name: "success-learning",
    route: "/checkout/success",
    seed: persisted(
      {
        ...checkoutBase,
        activeStep: 3,
        activeOrder: unifiedOrder({
          domain: 'learning',
          ecommerce_order: null,
          order: { ...unifiedOrder().order, amount: 1999 },
          amounts: { learning: 1999, physical: 0, total: 1999 },
        }),
      },
      captured
    ),
  },
  {
    name: "success-physical",
    route: "/checkout/success",
    seed: persisted(
      { ...checkoutBase, activeStep: 3, activeOrder: physicalOnlyOrder },
      captured
    ),
  },
  {
    // Active order, but verification has not landed: must NOT claim success.
    name: "success-pending",
    route: "/checkout/success",
    seed: persisted({ ...checkoutBase, activeStep: 3, activeOrder: unifiedOrder() }, {
      status: 'verifying',
      activeTransactionId: null,
    }),
  },
  {
    // Nothing to confirm — opened directly, or after the store was cleared.
    name: "success-none",
    route: "/checkout/success",
    seed: persisted({ ...checkoutBase, activeStep: 3, activeOrder: null }),
  },
];

/** Selectors measured on every case that matches. */
const SELECTORS = {
  "/cart": [
    "#Cart",
    "#Cart .CartSummary",
    "#Cart .CartSummary .PriceBox",
    "#Cart .CartSummary .TotalPrice",
    "#Cart .CartSummary .checkoutBtn",
    "#Cart .CartSummary .CheckoutBlockNotice",
    "#Cart .CartItem",
    "#Cart .CartSectionHeader",
  ],
  "/checkout": [
    "#Checkout",
    ".CheckoutStepper",
    ".StepperMobile",
    ".StepperMobile .StepperMobileCount",
    ".StepperMobile .StepperMobileTitle",
    ".StepperMobileBar",
    ".StepperMobileBar .StepSeg",
    ".CheckoutStepper .StepItem",
    ".CheckoutStepper .StepItem .StepNum",
    ".CheckoutStepper .StepItem .StepTitle",
    ".CheckoutStepper .StepLine",
    ".CheckoutContainer",
    ".CheckoutSection",
    ".CheckoutSection .SectionTitle",
    ".CheckoutSection .FormGroup .FormLabel",
    ".CheckoutSection .FormGroup .FormInput",
    ".CourseReviewCard",
    ".ProceedBtn",
    ".BackBtn",
    ".ProceedBtn.PayButton",
    ".CourierSelector",
    ".CourierOption",
    ".PaymentOptionCard",
    ".SummaryCard",
    ".SummaryCard .SummaryTitle",
    ".SummaryCard .Divider",
    ".SummaryCard .SummaryRow.TotalRow",
    ".SummaryCard .CouponForm input",
    ".SummaryCard .GuaranteeBlock",
    ".CheckoutRight",
  ],
  "/checkout/success": [
    "#Checkout",
    ".SuccessHero",
    ".SuccessHero .SuccessHeroIcon",
    ".SuccessHero .SuccessHeroTitle",
    ".SuccessHero .SuccessHeroRef",
    ".SuccessStateCard",
    ".SuccessOrderCard",
    ".SuccessOrderCard .SuccessOrderIcon",
    ".SuccessOrderCard .SuccessBadge",
    ".SuccessSection .SuccessSectionTitle",
    ".SuccessStep",
    ".SuccessActions",
    ".SuccessActions .ProceedBtn.SuccessPrimary",
    ".SuccessActions .SuccessGhost",
    ".SuccessActions .SuccessLink",
    ".SuccessAside",
    ".SuccessSummaryCard",
    ".SuccessSummaryRow",
    ".SuccessSummaryRow.total",
    ".SuccessSummaryRow.discount",
    ".SuccessDetailRow",
  ],
};

const PROPS = [
  "fontSize", "fontWeight", "fontFamily", "lineHeight", "color", "textAlign",
  "backgroundColor", "backgroundImage", "borderRadius", "borderTopWidth",
  "borderTopColor", "borderTopStyle", "borderLeftWidth", "borderLeftColor",
  "borderBottomWidth", "borderBottomColor", "borderBottomStyle",
  "padding", "marginBottom", "marginTop", "width", "maxWidth", "minWidth",
  "display", "flexDirection", "gap", "boxShadow", "position", "top",
  "justifyContent", "alignItems", "gridTemplateColumns", "opacity", "cursor",
];

const probe = (selectors) => `(() => {
  const props = ${JSON.stringify(PROPS)};
  const out = {};
  for (const sel of ${JSON.stringify(selectors)}) {
    const el = document.querySelector(sel);
    if (!el) { out[sel] = { found: false }; continue; }
    const cs = getComputedStyle(el);
    const o = { found: true, count: document.querySelectorAll(sel).length, tag: el.tagName };
    props.forEach((p) => { o[p] = cs[p]; });
    const r = el.getBoundingClientRect();
    o.box = Math.round(r.width) + "x" + Math.round(r.height);
    out[sel] = o;
  }
  const root = getComputedStyle(document.documentElement);
  out.__viewport = {
    w: window.innerWidth,
    h: window.innerHeight,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    scrollH: document.documentElement.scrollHeight,
  };
  out.__tokens = {
    primary: root.getPropertyValue("--color-primary").trim() || "MISSING",
    border: root.getPropertyValue("--color-border").trim() || "MISSING",
    radiusMd: root.getPropertyValue("--radius-md").trim() || "MISSING",
    radiusLg: root.getPropertyValue("--radius-lg").trim() || "MISSING",
    shadowMd: root.getPropertyValue("--shadow-md").trim() || "MISSING",
    surfacePage: root.getPropertyValue("--surface-page").trim() || "MISSING",
  };
  // Text that visually overflows its own box, a defect screenshots reveal slowly.
  // Reported with identity, because "6 clipped" is not actionable on its own.
  const clipped = [...document.querySelectorAll("*")]
    .filter((n) => n.scrollWidth - n.clientWidth > 2 && getComputedStyle(n).overflowX !== "auto")
    .map((n) => {
      const cls = (n.className || "").toString().split(" ").filter(Boolean).slice(0, 2).join(".");
      return n.tagName.toLowerCase() + (cls ? "." + cls : "") + "+" + (n.scrollWidth - n.clientWidth);
    });
  out.__textOverflow = clipped.length;
  out.__clippedNodes = clipped.slice(0, 10);
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
const profile = mkdtempSync(join(tmpdir(), "ds-checkout-"));
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
    } catch { await sleep(250); }
  }
  if (!version) throw new Error("Chrome DevTools endpoint never came up");
  console.log(`Chrome: ${version.Browser}\n`);

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
    (p) => { if (p.entry.level === "error") pageErrors.push(p.entry.text.slice(0, 110)); },
  ]);
  cdp.events.set("Runtime.exceptionThrown", [
    (p) => pageErrors.push("EXC: " + (p.exceptionDetails?.text || "").slice(0, 110)),
  ]);

  const setViewport = (width) =>
    cdp.send("Emulation.setDeviceMetricsOverride", {
      width, height: 900, deviceScaleFactor: 1, mobile: width < 768,
    });

  // Land on the origin once so localStorage is writable for it.
  await setViewport(1440);
  let loaded = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: BASE + "/" });
  await loaded;

  const cases = ONLY
    ? CASES.filter((c) => ONLY.split(",").map((s) => s.trim()).includes(c.name))
    : CASES;

  for (const c of cases) {
    // Seed, then navigate: PersistGate rehydrates from what we just wrote.
    await cdp.send("Runtime.evaluate", {
      expression: `localStorage.setItem('persist:root', ${JSON.stringify(c.seed)}); 'ok'`,
      returnByValue: true,
    });

    for (const width of MEASURE_WIDTHS) {
      await setViewport(width);

      // Land on the route first, *then* seed, *then* reload. Seeding before the
      // app has booted is not enough: the running app dispatches and redux-persist
      // rewrites `persist:root` from its own (empty) state, discarding the seed.
      loaded = cdp.once("Page.loadEventFired");
      await cdp.send("Page.navigate", { url: BASE + c.route });
      await loaded;
      await sleep(600);
      await cdp.send("Runtime.evaluate", {
        expression: `localStorage.setItem('persist:root', ${JSON.stringify(c.seed)}); 'ok'`,
        returnByValue: true,
      });
      loaded = cdp.once("Page.loadEventFired");
      await cdp.send("Page.reload", { ignoreCache: false });
      await loaded;
      await sleep(2400); // let client hydration + API calls settle

      const selectors = SELECTORS[c.route] || [];
      const res = await cdp.send("Runtime.evaluate", {
        expression: probe(selectors),
        returnByValue: true,
      });
      const v = res.result.value;
      const row = { case: c.name, route: c.route, width, ...v };
      results.push(row);

      const missing = selectors.filter((s) => v[s] && v[s].found === false);
      const flag = v.__viewport.overflow > 1 ? "  <== H-OVERFLOW" : "";
      console.log(
        `${c.name.padEnd(16)} @${String(width).padEnd(5)} ` +
          `scrollH=${String(v.__viewport.scrollH).padStart(5)} ` +
          `overflow=${String(v.__viewport.overflow).padStart(3)}px ` +
          `clipped=${String(v.__textOverflow).padStart(3)} ` +
          `missingSel=${missing.length}${flag}`
      );

      if (SHOT_WIDTHS.includes(width)) {
        const metrics = await cdp.send("Page.getLayoutMetrics");
        const cs = metrics.cssContentSize || metrics.contentSize;
        const shot = await cdp.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, width: cs.width, height: Math.min(cs.height, 12000), scale: 1 },
        });
        const file = join(OUT, `${c.name}-${width}.png`);
        writeFileSync(file, Buffer.from(shot.data, "base64"));
        console.log(`                 screenshot -> ${file}`);
      }
    }
  }

  const tokens = results[results.length - 1].__tokens;
  console.log("\n=== tokens resolved in browser (never MISSING) ===");
  Object.entries(tokens).forEach(([k, v]) => console.log(`  ${k.padEnd(12)} ${v}`));

  const missingTokens = results.filter((r) =>
    Object.values(r.__tokens).some((x) => x === "MISSING")
  ).length;
  const overflow = results.filter((r) => r.__viewport.overflow > 1);
  const clipped = results.filter((r) => r.__textOverflow > 0);

  console.log(`\nrenders: ${results.length}`);
  console.log(`token-missing renders: ${missingTokens}`);
  console.log(`horizontal-overflow renders: ${overflow.length}`);
  console.log(`text-overflow renders: ${clipped.length}`);
  console.log(`console errors: ${pageErrors.length}`);
  [...new Set(pageErrors)].slice(0, 12).forEach((e) => console.log(`  ! ${e}`));

  writeFileSync(
    JSON_OUT,
    JSON.stringify({ capturedAt: new Date().toISOString(), tokens, pageErrors: [...new Set(pageErrors)], results }, null, 2)
  );
  console.log(`\nmeasurement JSON -> ${JSON_OUT}`);
} catch (err) {
  console.error("capture failed:", err.message);
  exitCode = 1;
} finally {
  chrome.kill();
  await sleep(400); // let Chrome release its profile handles before cleanup
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    // A leftover temp profile is harmless; merging it into the exit code is not.
  }
}

process.exit(exitCode);
