/**
 * Unified Commerce Platform Custom Hook
 *
 * Combines useCart, useCheckout, usePayment, and useCoupon into a single,
 * centralized interface for all purchasable products.
 */

import { useCart, useCoupon } from './useCommerceHooks';
import { useCheckout } from './useCheckout';
import { usePayment } from './usePayment';

export function useCommerce() {
  const cart = useCart();
  const checkout = useCheckout();
  const payment = usePayment();
  const coupon = useCoupon();

  return {
    // Cart domain
    cartItems: cart.items,
    cartItemCount: cart.itemCount,
    cartSubtotal: cart.subtotal,
    cartOriginalTotal: cart.originalTotal,
    cartDiscountTotal: cart.discountTotal,
    isCartDrawerOpen: cart.isDrawerOpen,
    addToCart: cart.addItem,
    removeFromCart: cart.removeItem,
    clearCart: cart.emptyCart,
    toggleCartDrawer: cart.toggleDrawer,
    isInCart: cart.isInCart,
    buyNow: cart.buyNow,
    proceedToCheckout: cart.proceedToCheckout,

    // Checkout domain
    checkoutItems: checkout.items,
    checkoutStep: checkout.activeStep,
    billingAddress: checkout.billingAddress,
    paymentMethod: checkout.paymentMethod,
    activeOrder: checkout.activeOrder,
    isProcessingOrder: checkout.isProcessing,
    checkoutError: checkout.error,
    updateBillingAddress: checkout.updateBilling,
    changeCheckoutStep: checkout.changeStep,
    changePaymentMethod: checkout.changePaymentMethod,
    initiateOrder: checkout.initiateOrder,
    resetCheckout: checkout.reset,

    // Payment domain
    paymentStatus: payment.status,
    paymentError: payment.paymentError,
    executeRazorpay: payment.executeRazorpay,
    resetPayment: payment.reset,

    // Coupon domain
    appliedCoupon: coupon.appliedCoupon,
    applyCoupon: coupon.validateAndApply,
    removeCoupon: coupon.detachCoupon,
  };
}

export { useCart, useCheckout, usePayment, useCoupon };
