import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import paymentReducer, {
  startPayment,
  startVerification,
  paymentSuccess,
  paymentFailure,
  resetPaymentState,
} from "@/features/commerce/slices/paymentSlice";

/**
 * Payment status is a transient, page-local flag, but store.js persists the whole
 * root reducer with no whitelist — so the flag is written to localStorage and
 * rehydrated on every load. That made a finished (or abandoned) attempt leak into
 * the next checkout as a permanently disabled Pay button, because the button's
 * disabled condition is:
 *
 *   isProcessing || 'initiating' || 'verifying' || 'completed'
 *
 * These tests pin the two lifecycle guarantees that close that hole, plus the
 * disabled condition itself so a future edit cannot silently re-open it.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (...segments) =>
  fs.readFileSync(path.resolve(__dirname, ...segments), "utf8");

const checkoutJsx = read("../../app/checkout/Checkout.jsx");
const useCommerceHooksJs = read("../../features/commerce/hooks/useCommerceHooks.js");
const storeJs = read("../../../store.js");

describe("Payment state lifecycle", () => {
  it("clears a completed attempt when reset", () => {
    let state = paymentReducer(undefined, startPayment());
    expect(state.status).toBe("initiating");

    state = paymentReducer(state, paymentSuccess({ payment_id: "pay_1", receipt: "r1" }));
    expect(state.status).toBe("completed");
    expect(state.activeTransactionId).toBe("pay_1");

    state = paymentReducer(state, resetPaymentState());
    expect(state.status).toBe("idle");
    expect(state.activeTransactionId).toBeNull();
    expect(state.receipt).toBeNull();
  });

  it("clears an abandoned in-flight attempt when reset", () => {
    let state = paymentReducer(undefined, startPayment());
    state = paymentReducer(state, startVerification());
    expect(state.status).toBe("verifying");

    state = paymentReducer(state, resetPaymentState());
    expect(state.status).toBe("idle");
  });

  it("treats a failed attempt as retryable rather than blocking", () => {
    const state = paymentReducer(undefined, paymentFailure("declined"));
    expect(state.status).toBe("failed");    // `failed` is deliberately absent from the Pay button's disabled condition, so
    // the customer can retry after a decline without clearing storage.
    const payButton = checkoutJsx.slice(
      checkoutJsx.indexOf("executeRazorpay(activeOrder, user)")
    );
    expect(payButton).toMatch(/paymentStatus === 'initiating'/);
    expect(payButton).toMatch(/paymentStatus === 'verifying'/);
    expect(payButton).toMatch(/paymentStatus === 'completed'/);
    expect(payButton).not.toMatch(/paymentStatus === 'failed'/);
  });
});

describe("A new checkout session starts from a clean payment state", () => {
  it("resets payment before snapshotting the session", () => {
    expect(useCommerceHooksJs).toMatch(
      /startCheckoutSession = \(payload\) => \{\s*dispatch\(resetPaymentState\(\)\);\s*dispatch\(createCheckout\(payload\)\);/
    );
  });

  it("routes every session-creation site through the helper", () => {
    // One direct dispatch, inside the helper itself...
    expect(useCommerceHooksJs.match(/dispatch\(createCheckout\(/g) || []).toHaveLength(1);
    // ...and the helper called from all three entry points (cart checkout, Buy Now
    // and its offline fallback), so a fourth cannot be added without the reset.
    expect(useCommerceHooksJs.match(/\bstartCheckoutSession\(/g) || []).toHaveLength(3);
  });

  it("persists the whole root reducer, which is why a reset is required", () => {
    // Not a defect in itself — it is the reason the lifecycle above is needed.
    expect(storeJs).toMatch(/payment: paymentReducer/);
    expect(storeJs).not.toMatch(/whitelist|blacklist/);
  });
});

describe("A reload cannot leave the Pay button dead", () => {
  it("clears a stale in-flight status on mount", () => {
    expect(checkoutJsx).toMatch(
      /paymentStatus === 'initiating' \|\| paymentStatus === 'verifying'/
    );
    expect(checkoutJsx).toContain("resetPayment()");
    // Mount-only, via a ref guard: re-running would fight a live attempt.
    expect(checkoutJsx).toMatch(/clearedStaleAttempt = useRef\(false\)/);
  });

  it("leaves the post-payment confirmation intact", () => {
    // `completed` must survive a reload — it drives the "Payment Verified!" screen,
    // and the success page reads the persisted transaction id.
    const mountReset = checkoutJsx.slice(
      checkoutJsx.indexOf("clearedStaleAttempt = useRef"),
      checkoutJsx.indexOf("const orderNum")
    );
    expect(mountReset).not.toMatch(/paymentStatus === 'completed'/);

    const successPage = read("../../app/checkout/success/page.js");
    expect(successPage).toMatch(/paymentState\.activeTransactionId/);
  });
});
