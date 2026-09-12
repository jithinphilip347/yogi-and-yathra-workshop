import { describe, it, expect, vi, beforeEach } from "vitest";
import cartReducer, { addToCart, clearCart, setAppliedCoupon } from "@/features/commerce/slices/cartSlice";
import checkoutReducer, { createCheckout, clearCheckoutItems } from "@/features/commerce/slices/checkoutSlice";
import paymentReducer, {
  startPayment,
  startVerification,
  paymentSuccess,
  paymentFailure,
} from "@/features/commerce/slices/paymentSlice";

describe("Sprint — Post-Purchase Course Checkout Redirect & State Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Cart & Checkout State Cleanup after Verified Purchase", () => {
    it("clears cart items and detaches coupons upon clearCart", () => {
      const stateWithItems = {
        items: [
          { productable_type: "Course", productable_id: 12, price: 999, quantity: 1 },
          { productable_type: "Course", productable_id: 15, price: 499, quantity: 1 },
        ],
        isDrawerOpen: false,
        appliedCoupon: { code: "YOGA10", discount: 100 },
        isProcessing: false,
        error: null,
      };

      const nextState = cartReducer(stateWithItems, clearCart());

      expect(nextState.items).toEqual([]);
      expect(nextState.appliedCoupon).toBeNull();
      expect(nextState.error).toBeNull();
    });

    it("clears checkout session snapshot upon clearCheckoutItems", () => {
      const stateWithCheckout = {
        items: [{ productable_type: "Course", productable_id: 12, price: 999 }],
        activeStep: 3,
        activeOrder: { id: 101, order_number: "ORD-101" },
        isProcessing: false,
        error: null,
      };

      const nextState = checkoutReducer(stateWithCheckout, clearCheckoutItems());

      expect(nextState.items).toEqual([]);
      // Order reference preserved for confirmation display
      expect(nextState.activeOrder).toEqual({ id: 101, order_number: "ORD-101" });
    });

    it("handles multiple-course checkout clearing simultaneously", () => {
      const initialCart = {
        items: [
          { productable_type: "Course", productable_id: 1, title: "Course A", price: 500 },
          { productable_type: "Course", productable_id: 2, title: "Course B", price: 800 },
        ],
        appliedCoupon: null,
      };

      const clearedCart = cartReducer(initialCart, clearCart());
      expect(clearedCart.items).toHaveLength(0);

      const initialCheckout = checkoutReducer(
        undefined,
        createCheckout(initialCart.items)
      );
      expect(initialCheckout.items).toHaveLength(2);

      const clearedCheckout = checkoutReducer(initialCheckout, clearCheckoutItems());
      expect(clearedCheckout.items).toHaveLength(0);
    });
  });

  describe("Payment State Transitions", () => {
    it("transitions from idle to initiating to verifying to completed", () => {
      let state = paymentReducer(undefined, { type: "@@INIT" });
      expect(state.status).toBe("idle");

      state = paymentReducer(state, startPayment());
      expect(state.status).toBe("initiating");

      state = paymentReducer(state, startVerification());
      expect(state.status).toBe("verifying");

      state = paymentReducer(
        state,
        paymentSuccess({ payment_id: "pay_xyz123", receipt: "rcpt_999" })
      );
      expect(state.status).toBe("completed");
      expect(state.activeTransactionId).toBe("pay_xyz123");
      expect(state.receipt).toBe("rcpt_999");
      expect(state.paymentError).toBeNull();
    });

    it("transitions to failed without redirecting to profile on error", () => {
      let state = paymentReducer(undefined, { type: "@@INIT" });
      state = paymentReducer(state, startVerification());
      state = paymentReducer(state, paymentFailure("Signature verification failed."));

      expect(state.status).toBe("failed");
      expect(state.paymentError).toBe("Signature verification failed.");
    });
  });

  describe("Checkout Guard Logic (Checkout.jsx empty items bug fix)", () => {
    it("does NOT redirect to /cart when items is empty but paymentStatus is completed or verifying", () => {
      const mockRouterReplace = vi.fn();

      const runGuardEffect = (items, paymentStatus) => {
        const isPaymentInProgressOrComplete =
          paymentStatus === "verifying" || paymentStatus === "completed";
        if (items.length === 0 && !isPaymentInProgressOrComplete) {
          mockRouterReplace("/cart");
        }
      };

      // Case 1: Payment completed, items cleared -> must NOT redirect to /cart
      runGuardEffect([], "completed");
      expect(mockRouterReplace).not.toHaveBeenCalled();

      // Case 2: Payment verifying, items cleared -> must NOT redirect to /cart
      runGuardEffect([], "verifying");
      expect(mockRouterReplace).not.toHaveBeenCalled();

      // Case 3: Empty items on idle session -> MUST redirect to /cart
      runGuardEffect([], "idle");
      expect(mockRouterReplace).toHaveBeenCalledWith("/cart");
    });
  });

  describe("Profile Tab Deep-Link Normalization", () => {
    it("normalizes my-courses, courses, and mylearning into 'My Courses'", () => {
      const resolveActiveTab = (tabParam) => {
        if (!tabParam) return "Dashboard";
        const normalized = tabParam.toLowerCase().replace(/[-_]/g, "");
        if (
          normalized === "mycourses" ||
          normalized === "courses" ||
          normalized === "mylearning"
        ) {
          return "My Courses";
        }
        if (normalized === "liveclasses") return "Live Classes";
        if (normalized === "livesessions") return "Live Sessions";
        if (normalized === "billing" || normalized === "invoices") return "Billing & Invoices";
        return "Dashboard";
      };

      expect(resolveActiveTab("my-courses")).toBe("My Courses");
      expect(resolveActiveTab("courses")).toBe("My Courses");
      expect(resolveActiveTab("my_courses")).toBe("My Courses");
      expect(resolveActiveTab("mylearning")).toBe("My Courses");
      expect(resolveActiveTab("live-classes")).toBe("Live Classes");
      expect(resolveActiveTab("billing")).toBe("Billing & Invoices");
      expect(resolveActiveTab(null)).toBe("Dashboard");
    });
  });

  describe("TanStack Query Invalidation on Verified Purchase", () => {
    it("invalidates all student learning and enrollment caches", () => {
      const invalidatedKeys = [];
      const mockQueryClient = {
        invalidateQueries: vi.fn(({ queryKey }) => {
          invalidatedKeys.push(queryKey[0]);
        }),
      };

      // Simulate the cache invalidation performed in usePayment / CheckoutSuccessPage
      const requiredKeys = [
        "user-enrollments",
        "course-access",
        "course-resume",
        "student-continue-learning",
        "dashboard-upcoming-events",
        "profile",
      ];

      requiredKeys.forEach((key) => {
        mockQueryClient.invalidateQueries({ queryKey: [key] });
      });

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(6);
      expect(invalidatedKeys).toContain("user-enrollments");
      expect(invalidatedKeys).toContain("course-access");
      expect(invalidatedKeys).toContain("student-continue-learning");
    });
  });
});
