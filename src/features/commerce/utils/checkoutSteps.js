/**
 * Checkout step model — WORKSHOP-DS-07A.
 *
 * The stepper used to be three inert `div`s, so the only way forward was the
 * Next button and the only way back was Back. Making it navigable raises one
 * question the markup cannot answer on its own: which steps may be entered?
 *
 * The answer is derived from the flow that already exists, not from new rules:
 *
 *   step 1  the origin of the flow — always reachable
 *   step 2  entered from step 1 by the Next button, which validates nothing
 *           (`onClick={() => changeStep(2)}`), so it is reachable from step 1
 *   step 3  only ever reached through `handleProceedToPayment`, which validates
 *           the delivery details, delegates the physical order and creates the
 *           Razorpay order — `createOrderSuccess` then sets `activeStep = 3`.
 *           So the created order IS step 3's prerequisite, and gating on
 *           `activeOrder` reproduces the existing gate exactly rather than
 *           inventing a new one. It is what stops a customer jumping from
 *           Order Review straight to Payment and skipping address validation.
 *
 * Pure functions on purpose: this is the logic the navigation tests exercise,
 * and it runs in the suite's node environment with no DOM.
 */

export const CHECKOUT_STEP_COUNT = 3;

/**
 * The label for a step. Step 2 is named by the cart: a cart with nothing to
 * ship collects student details and billing instead of a shipping address.
 */
export function checkoutStepTitle(step, hasPhysicalItems = false) {
  switch (step) {
    case 1:
      return 'Order Review';
    case 2:
      return hasPhysicalItems ? 'Shipping & Details' : 'Student Details & Billing';
    case 3:
      return 'Payment Gateway';
    default:
      return '';
  }
}

/** Whether the flow permits entering `step` at all, given the current state. */
export function isCheckoutStepReachable(step, { activeOrder = null } = {}) {
  if (step <= 2) return true;
  return Boolean(activeOrder);
}

/**
 * The three steps with everything the UI needs: title, visual state and whether
 * the current customer may click it.
 *
 *   current    where they are now — never clickable, clicking it would be a no-op
 *   completed  behind them — clickable
 *   reachable  ahead of them with prerequisites already satisfied — clickable
 *   locked     ahead of them without prerequisites — NOT clickable
 */
export function buildCheckoutSteps({
  activeStep = 1,
  activeOrder = null,
  hasPhysicalItems = false,
} = {}) {
  return Array.from({ length: CHECKOUT_STEP_COUNT }, (_, i) => {
    const step = i + 1;
    const reachable = isCheckoutStepReachable(step, { activeOrder });
    const state =
      step === activeStep
        ? 'current'
        : step < activeStep
          ? 'completed'
          : reachable
            ? 'reachable'
            : 'locked';

    return {
      step,
      title: checkoutStepTitle(step, hasPhysicalItems),
      state,
      reachable,
      clickable: step !== activeStep && reachable,
    };
  });
}
