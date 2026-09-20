import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  CHECKOUT_STEP_COUNT,
  buildCheckoutSteps,
  checkoutStepTitle,
  isCheckoutStepReachable,
} from "@/features/commerce/utils/checkoutSteps";

/**
 * WORKSHOP-DS-07A — checkout step navigation.
 *
 * The stepper was three inert `div`s: the only way forward was the Next button
 * and the only way back was Back. It is now navigable, so these tests pin the
 * rule that decides which steps may be entered.
 *
 * The first group exercises the step model directly, because it is a pure
 * function. The remaining groups are source assertions — this suite runs in the
 * repo's node environment without jsdom, which is the same reason
 * `checkoutCourier.test.js` asserts against source.
 *
 * NOTE ON ONE DELIBERATE DEVIATION: the brief's generic table says a future step
 * with missing prerequisites is locked. Step 2 is an exception, and it is the
 * existing flow that makes it one — `onClick={() => changeStep(2)}` on the Next
 * button has always reached step 2 with no validation at all. Locking step 2
 * here would have *removed* behaviour rather than added a guard. Step 3 is the
 * step with a real prerequisite.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (...segments) =>
  fs.readFileSync(path.resolve(__dirname, ...segments), "utf8");

const checkoutJsx = read("../../app/checkout/Checkout.jsx");
const checkoutScss = read("../../assets/css/checkout.scss");

const between = (source, startMarker, endMarker) => {
  const start = source.indexOf(startMarker);
  expect(start).toBeGreaterThan(-1);
  const end = source.indexOf(endMarker, start);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
};

const step = (steps, n) => steps.find((s) => s.step === n);

describe("Checkout step model", () => {
  it("always models exactly the three steps the flow has", () => {
    expect(CHECKOUT_STEP_COUNT).toBe(3);
    expect(buildCheckoutSteps({}).map((s) => s.step)).toEqual([1, 2, 3]);
  });

  it("names step 2 for the cart: shipping when there is something to ship", () => {
    expect(checkoutStepTitle(1, true)).toBe("Order Review");
    expect(checkoutStepTitle(2, true)).toBe("Shipping & Details");
    expect(checkoutStepTitle(3, true)).toBe("Payment Gateway");
    expect(checkoutStepTitle(2, false)).toBe("Student Details & Billing");
  });

  it("reports the step the customer is on as current", () => {
    const steps = buildCheckoutSteps({ activeStep: 2 });

    expect(step(steps, 2).state).toBe("current");
    expect(step(steps, 1).state).toBe("completed");
    expect(step(steps, 3).state).toBe("locked");
  });

  it("starts on step 1 with step 1 current", () => {
    const steps = buildCheckoutSteps({ activeStep: 1 });

    expect(step(steps, 1).state).toBe("current");
    expect(step(steps, 1).clickable).toBe(false);
  });

  it("locks step 3 while its prerequisite — the created order — is missing", () => {
    const steps = buildCheckoutSteps({ activeStep: 1, activeOrder: null });

    expect(step(steps, 3).state).toBe("locked");
    expect(step(steps, 3).reachable).toBe(false);
    expect(step(steps, 3).clickable).toBe(false);
    expect(isCheckoutStepReachable(3, { activeOrder: null })).toBe(false);
  });

  it("unlocks step 3 only once the order exists", () => {
    const order = { order_number: "WS-1", order: { amount: 2998 } };
    const steps = buildCheckoutSteps({ activeStep: 1, activeOrder: order });

    expect(step(steps, 3).state).toBe("reachable");
    expect(step(steps, 3).clickable).toBe(true);
    expect(isCheckoutStepReachable(3, { activeOrder: order })).toBe(true);
  });

  it("allows step 2 from step 1, because the existing Next button already does", () => {
    const steps = buildCheckoutSteps({ activeStep: 1, activeOrder: null });

    expect(step(steps, 2).state).toBe("reachable");
    expect(step(steps, 2).clickable).toBe(true);
  });

  it("marks every step behind the customer as completed and clickable", () => {
    const steps = buildCheckoutSteps({ activeStep: 3, activeOrder: { id: 1 } });

    expect(step(steps, 1).state).toBe("completed");
    expect(step(steps, 2).state).toBe("completed");
    expect(step(steps, 1).clickable).toBe(true);
    expect(step(steps, 2).clickable).toBe(true);
  });

  it("never makes the current step clickable, so it cannot reset checkout state", () => {
    for (const activeStep of [1, 2, 3]) {
      const steps = buildCheckoutSteps({ activeStep, activeOrder: { id: 1 } });
      const current = steps.filter((s) => s.state === "current");

      expect(current).toHaveLength(1);
      expect(current[0].clickable).toBe(false);
    }
  });

  it("never lets a locked step be clickable", () => {
    const steps = buildCheckoutSteps({ activeStep: 1, activeOrder: null });

    steps
      .filter((s) => s.state === "locked")
      .forEach((s) => expect(s.clickable).toBe(false));
  });

  it("gives every step exactly one state", () => {
    const states = new Set(["current", "completed", "reachable", "locked"]);
    const steps = buildCheckoutSteps({ activeStep: 2, activeOrder: null });

    steps.forEach((s) => expect(states.has(s.state)).toBe(true));
  });
});

describe("The stepper can only offer routes the flow allows", () => {
  it("renders the step model rather than re-deriving state from activeStep", () => {
    expect(checkoutJsx).toContain("buildCheckoutSteps({ activeStep, activeOrder, hasPhysicalItems })");
    // The old markup hand-built the classes with arithmetic comparisons.
    expect(checkoutJsx).not.toMatch(/activeStep >= 1 \? 'active'/);
    expect(checkoutJsx).not.toMatch(/activeStep > 2 \? 'completed'/);
  });

  it("wires clickable steps to changeStep and disables the rest", () => {
    expect(checkoutJsx).toContain("onClick={s.clickable ? () => changeStep(s.step) : undefined}");
    expect(checkoutJsx).toContain("disabled={!s.clickable}");
  });

  it("marks the current step for assistive technology", () => {
    expect(checkoutJsx).toContain("aria-current={s.state === 'current' ? 'step' : undefined}");
  });

  it("says which steps are locked, and names every step", () => {
    expect(checkoutJsx).toContain("(locked)");
    expect(checkoutJsx).toContain("Step ${s.step} of ${CHECKOUT_STEP_COUNT}: ${s.title}");
  });

  it("does not remove the Next/Back controls the navigation complements", () => {
    expect(checkoutJsx).toContain("changeStep(2)");
    expect(checkoutJsx).toContain("changeStep(1)");
  });
});

describe("Compact mobile stepper", () => {
  const stepperRow = between(checkoutScss, ".CheckoutStepper {", ".StepperMobile {");
  const compact = between(checkoutScss, ".StepperMobile {", ".CheckoutContainer {");

  it("replaces the horizontal row below the single-column breakpoint", () => {
    expect(stepperRow).toMatch(/@media \(max-width: 768px\)\s*\{\s*display: none/);
    expect(compact).toMatch(/@media \(max-width: 768px\)\s*\{\s*display: block/);
  });

  it("spells out the current step instead of shrinking three labels into 320px", () => {
    expect(checkoutJsx).toContain("StepperMobileCount");
    expect(checkoutJsx).toMatch(/Step \{activeStep\} of \{CHECKOUT_STEP_COUNT\}/);
    expect(checkoutJsx).toContain("checkoutStepTitle(activeStep, hasPhysicalItems)");
  });

  it("keeps completed segments tappable so back-stepping is not Back-button-only", () => {
    expect(compact).toMatch(/\.StepSeg \{/);
    expect(checkoutJsx).toContain('className={`StepSeg ${s.state}`}');
    expect(checkoutJsx).toContain("onClick={s.clickable ? () => changeStep(s.step) : undefined}");
  });

  it("gives every segment a touch-sized target", () => {
    const target = Number(compact.match(/min-height:\s*(\d+)px/)?.[1]);
    expect(target).toBeGreaterThanOrEqual(36);
  });

  it("cannot overflow: segments share the row and may shrink", () => {
    expect(compact).toMatch(/flex:\s*1 1 0/);
    expect(compact).toMatch(/min-width:\s*0/);
  });

  it("distinguishes current, completed and locked segments", () => {
    for (const state of ["current", "completed", "reachable"]) {
      expect(compact).toMatch(new RegExp(`&?\\.${state} \\{`));
    }
    expect(compact).toMatch(/&:disabled\s*\{\s*cursor: default/);
  });
});

describe("Business logic is untouched", () => {
  it("keeps courier selection exactly where it was", () => {
    expect(checkoutJsx).toContain('className="CourierSelector"');
    expect(checkoutJsx).toContain("COURIER_PARTNERS.map");
    expect(checkoutJsx).toContain("changeCourierPartner(partner.value)");
  });

  it("keeps the coupon, totals and courier fee derivations intact", () => {
    expect(checkoutJsx).toContain("validateAndApplyCoupon");
    expect(checkoutJsx).toContain("courierPartnerLabel(courierPartner)");
    expect(checkoutJsx).toMatch(/subtotal - \(Number\(appliedCoupon\?\.discount\) \|\| 0\) \+ courierFee/);
  });

  it("keeps the payment initiation call unchanged", () => {
    expect(checkoutJsx).toContain("executeRazorpay(activeOrder, user)");
    expect(checkoutJsx).toContain("await initiateUnifiedOrder(delegated?.order || null)");
    expect(checkoutJsx).toContain("await delegateOrder(activeShipping)");
  });

  it("still holds step state in the checkout slice, not in the view", () => {
    const slice = read("../../features/commerce/slices/checkoutSlice.js");

    expect(slice).toContain("activeStep: 1");
    expect(slice).toContain("state.activeStep = 3");
  });

  it("never reaches E-commerce directly from the stepper", () => {
    expect(checkoutJsx).not.toMatch(/X-Internal-Service-Key/);
    expect(checkoutJsx).not.toMatch(/\/internal\/v1/);
    expect(checkoutJsx).not.toMatch(/yogiandyathra/);
  });
});
