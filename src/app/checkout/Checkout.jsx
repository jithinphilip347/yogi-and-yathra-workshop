"use client";
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FaCheckCircle, FaTag, FaCreditCard, FaLock, FaArrowLeft, FaArrowRight, FaShieldAlt, FaBoxOpen, FaTruck } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useCheckout } from '@/features/commerce/hooks/useCheckout';
import { usePayment } from '@/features/commerce/hooks/usePayment';
import {
  COURIER_PARTNERS,
  computeCourierFee,
  courierPartnerLabel,
} from '@/features/commerce/utils/courierPartners';
import '@/assets/css/checkout.scss';

export default function Checkout() {
  const {
    items,
    itemCount,
    subtotal,
    originalTotal,
    discountTotal,
    courierPartner,
    courierFee,
    physicalSubtotal,
    appliedCoupon,
    activeStep,
    billingAddress,
    shippingAddress,
    sameAsBilling,
    hasPhysicalItems,
    hasLearningItems,
    isMixed,
    paymentMethod,
    activeOrder,
    delegatedPhysicalOrder,
    ecommerceCustomer,
    isDelegating,
    delegationError,
    isProcessing,
    error,
    user,
    updateBilling,
    updateShipping,
    toggleSameAsBilling,
    changeCourierPartner,
    changeStep,
    changePaymentMethod,
    delegateOrder,
    initiateUnifiedOrder,
    validateAndApplyCoupon,
    removeCoupon,
  } = useCheckout();

  const { executeRazorpay, status: paymentStatus, paymentError, resetPayment } = usePayment();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || billingAddress.name || '',
    email: user?.email || billingAddress.email || '',
    phone: user?.phone || billingAddress.phone || '',
    address: billingAddress.address || '',
    city: billingAddress.city || '',
    state: billingAddress.state || '',
    zip: billingAddress.zip || '',
    country: billingAddress.country || 'India',
  });

  const [shippingForm, setShippingForm] = useState({
    name: user?.name || shippingAddress.name || '',
    email: user?.email || shippingAddress.email || '',
    phone: user?.phone || shippingAddress.phone || '',
    address: shippingAddress.address || '',
    city: shippingAddress.city || '',
    state: shippingAddress.state || '',
    zip: shippingAddress.zip || '',
    country: shippingAddress.country || 'India',
  });

  const [useSeparateBilling, setUseSeparateBilling] = useState(!sameAsBilling);
  const [localError, setLocalError] = useState('');

  const router = useRouter();

  const isPaymentInProgressOrComplete = paymentStatus === 'verifying' || paymentStatus === 'completed';

  useEffect(() => {
    if (items.length === 0 && !isPaymentInProgressOrComplete) {
      router.replace('/cart');
    }
  }, [items, router, isPaymentInProgressOrComplete]);

  // A payment attempt cannot survive a page load: `initiating` is set by the click
  // and `verifying` by the Razorpay SDK callback, and both live in that page's JS.
  // So arriving at a fresh mount in either state means the attempt is gone and the
  // value is a persisted leftover — and leaving it would disable the Pay button
  // with no explanation on screen. `completed` is deliberately left alone: it is
  // what shows the post-payment confirmation before the redirect.
  const clearedStaleAttempt = useRef(false);
  useEffect(() => {
    if (clearedStaleAttempt.current) return;
    clearedStaleAttempt.current = true;

    if (paymentStatus === 'initiating' || paymentStatus === 'verifying') {
      resetPayment();
    }
  }, [paymentStatus, resetPayment]);

  const [prevUser, setPrevUser] = useState(user);
  if (prevUser !== user) {
    setPrevUser(user);
    setForm((prev) => ({
      ...prev,
      name: prev.name || user?.name || '',
      email: prev.email || user?.email || '',
    }));
    setShippingForm((prev) => ({
      ...prev,
      name: prev.name || user?.name || '',
      email: prev.email || user?.email || '',
    }));
  }

  if (items.length === 0) {
    if (isPaymentInProgressOrComplete) {
      return (
        <div className="CheckoutEmptyState">
          <h2>Payment Verified!</h2>
          <p>Redirecting to your order confirmation…</p>
        </div>
      );
    }
    return (
      <div className="CheckoutEmptyState">
        <h2>Redirecting to your cart…</h2>
        <p>No checkout session found. Please review your items and try again.</p>
      </div>
    );
  }

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError('');
    setCouponLoading(true);

    const res = await validateAndApplyCoupon(couponCode);
    setCouponLoading(false);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponCode('');
    }
  };

  const handleBillingChange = (field, val) => {
    const updated = { ...form, [field]: val };
    setForm(updated);
    updateBilling(updated);
  };

  const handleShippingChange = (field, val) => {
    const updated = { ...shippingForm, [field]: val };
    setShippingForm(updated);
    updateShipping(updated);
  };

  const handleProceedToPayment = async () => {
    setLocalError('');

    // 1. Validation check
    const activeShipping = useSeparateBilling ? shippingForm : form;
    if (hasPhysicalItems) {
      if (!activeShipping.address || !activeShipping.city || !activeShipping.state || !activeShipping.zip || !activeShipping.phone) {
        setLocalError('Please fill in all required shipping address fields (address, city, state, PIN code, and phone).');
        return;
      }
    }

    if (!form.name || !form.email) {
      setLocalError('Please enter your full name and email address.');
      return;
    }

    try {
      // 2. Delegate physical order to the E-commerce store if physical items exist
      let delegated = null;
      if (hasPhysicalItems) {
        delegated = await delegateOrder(activeShipping);
      }

      // 3. Create the unified Workshop billing + Razorpay order covering the
      //    learning and/or delegated physical portions. Learning-only,
      //    physical-only and mixed carts all flow through one orchestration
      //    endpoint, so the Razorpay order always exists before step 3.
      await initiateUnifiedOrder(delegated?.order || null);
    } catch (err) {
      console.error('Checkout error:', err);
      setLocalError(err.message || 'Unable to proceed with checkout.');
    }
  };

  const orderNum = activeOrder?.order_number || activeOrder?.id || activeOrder?.order?.order_number || activeOrder?.order?.id;
  const delegatedId = delegatedPhysicalOrder?.id;
  // The shipping fee is part of what the customer pays, so it is part of the
  // payable total. E-commerce derives the same amount from the same partner when
  // the delegated order is created.
  const finalPayable = Math.max(0, subtotal - (Number(appliedCoupon?.discount) || 0) + courierFee);

  return (
    <div id="Checkout">
      {/* Stepper Navigation */}
      <div className="CheckoutStepper">
        <div className={`StepItem ${activeStep >= 1 ? 'active' : ''} ${activeStep > 1 ? 'completed' : ''}`}>
          <span className="StepNum">1</span>
          <span className="StepTitle">Order Review</span>
        </div>
        <div className={`StepLine ${activeStep > 1 ? 'active' : ''}`} />
        <div className={`StepItem ${activeStep >= 2 ? 'active' : ''} ${activeStep > 2 ? 'completed' : ''}`}>
          <span className="StepNum">2</span>
          <span className="StepTitle">{hasPhysicalItems ? 'Shipping & Details' : 'Student Details & Billing'}</span>
        </div>
        <div className={`StepLine ${activeStep > 2 ? 'active' : ''}`} />
        <div className={`StepItem ${activeStep >= 3 ? 'active' : ''}`}>
          <span className="StepNum">3</span>
          <span className="StepTitle">Payment Gateway</span>
        </div>
      </div>

      <div className="CheckoutContainer">
        {/* Left Column: Form & Options */}
        <div className="CheckoutLeft">
          {(error || delegationError || localError) && (
            <div className="CheckoutErrorMessage">
              {localError || delegationError || error}
            </div>
          )}

          {/* STEP 1: ORDER REVIEW */}
          {activeStep === 1 && (
            <section className="CheckoutSection CourseReviewSection">
              <h2 className="SectionTitle">Order Items ({itemCount})</h2>
              <div className="CourseList">
                {items.map((item) => {
                  const isPhysical = item.type === 'product' || item.type === 'combo' || item.domain === 'ecommerce';
                  return (
                    <div className="CourseReviewCard" key={item.id || item.cart_key}>
                      <div className="CourseThumb">
                        {item.image && <Image src={item.image} alt={item.title} width={140} height={90} className="Img" />}
                      </div>
                      <div className="CourseInfo">
                        <span className={`Category ${isPhysical ? 'PhysicalBadge' : 'LearningBadge'}`}>
                          {isPhysical ? (item.type === 'combo' ? 'Bundle / Combo' : 'Physical Product') : (item.productable_type || 'Course')}
                        </span>
                        <h3>{item.title}</h3>
                        <p className="Instructor">{item.subtitle || (isPhysical ? `Qty: ${item.quantity || 1}` : '')}</p>
                      </div>
                      <div className="CoursePrice">
                        <span className="CurrentPrice">
                          ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}
                        </span>
                        {Number(item.original_price || 0) > Number(item.price || 0) && (
                          <span className="OriginalPrice">
                            ₹{(Number(item.original_price || 0) * Number(item.quantity || 1)).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => changeStep(2)} className="ProceedBtn StepBtn">
                Next: {hasPhysicalItems ? 'Shipping & Details' : 'Student Details'} <FaArrowRight />
              </button>
            </section>
          )}

          {/* STEP 2: STUDENT DETAILS & SHIPPING/BILLING */}
          {activeStep === 2 && (
            <section className="CheckoutSection">
              <h2 className="SectionTitle">Customer Information</h2>
              <div className="FormGrid">
                <div className="FormGroup">
                  <label className="FormLabel">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleBillingChange('name', e.target.value)}
                    className="FormInput"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="FormGroup">
                  <label className="FormLabel">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => handleBillingChange('email', e.target.value)}
                    className="FormInput"
                    placeholder="Enter your email address"
                  />
                </div>
                <div className="FormGroup">
                  <label className="FormLabel">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => handleBillingChange('phone', e.target.value)}
                    className="FormInput"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              {/* Physical Product Shipping Address */}
              {hasPhysicalItems && (
                <div style={{ marginTop: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <FaTruck style={{ color: 'var(--primaryColor)' }} />
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600 }}>Shipping Address (for Physical Delivery)</h3>
                  </div>

                  <div className="FormGrid">
                    <div className="FormGroup" style={{ gridColumn: '1 / -1' }}>
                      <label className="FormLabel">Street Address / House No. *</label>
                      <input
                        type="text"
                        required
                        value={useSeparateBilling ? shippingForm.address : form.address}
                        onChange={(e) => {
                          if (useSeparateBilling) {
                            handleShippingChange('address', e.target.value);
                          } else {
                            handleBillingChange('address', e.target.value);
                          }
                        }}
                        className="FormInput"
                        placeholder="House no., Building name, Street area"
                      />
                    </div>
                    <div className="FormGroup">
                      <label className="FormLabel">City *</label>
                      <input
                        type="text"
                        required
                        value={useSeparateBilling ? shippingForm.city : form.city}
                        onChange={(e) => {
                          if (useSeparateBilling) {
                            handleShippingChange('city', e.target.value);
                          } else {
                            handleBillingChange('city', e.target.value);
                          }
                        }}
                        className="FormInput"
                        placeholder="City"
                      />
                    </div>
                    <div className="FormGroup">
                      <label className="FormLabel">State *</label>
                      <input
                        type="text"
                        required
                        value={useSeparateBilling ? shippingForm.state : form.state}
                        onChange={(e) => {
                          if (useSeparateBilling) {
                            handleShippingChange('state', e.target.value);
                          } else {
                            handleBillingChange('state', e.target.value);
                          }
                        }}
                        className="FormInput"
                        placeholder="State / Province"
                      />
                    </div>
                    <div className="FormGroup">
                      <label className="FormLabel">PIN Code / ZIP *</label>
                      <input
                        type="text"
                        required
                        value={useSeparateBilling ? shippingForm.zip : form.zip}
                        onChange={(e) => {
                          if (useSeparateBilling) {
                            handleShippingChange('zip', e.target.value);
                          } else {
                            handleBillingChange('zip', e.target.value);
                          }
                        }}
                        className="FormInput"
                        placeholder="6-digit PIN code"
                      />
                    </div>
                    <div className="FormGroup">
                      <label className="FormLabel">Country</label>
                      <input
                        type="text"
                        value={useSeparateBilling ? (shippingForm.country || 'India') : (form.country || 'India')}
                        onChange={(e) => {
                          if (useSeparateBilling) {
                            handleShippingChange('country', e.target.value);
                          } else {
                            handleBillingChange('country', e.target.value);
                          }
                        }}
                        className="FormInput"
                        placeholder="Country"
                      />
                    </div>
                  </div>

                  {/* Courier partner. A delivery choice, so it sits in the delivery
                      section — the same place the E-commerce checkout puts it —
                      rather than in the order summary. Physical carts only. */}
                  <div className="CourierSelector">
                    <div className="CourierHeading">
                      <FaTruck style={{ color: 'var(--primaryColor)' }} />
                      <h3>Delivery Partner</h3>
                    </div>

                    <div className="CourierOptions">
                      {COURIER_PARTNERS.map((partner) => {
                        const fee = computeCourierFee(physicalSubtotal, partner.value);
                        const isSelected = courierPartner === partner.value;

                        return (
                          <label
                            key={partner.value}
                            className={`CourierOption ${isSelected ? 'selected' : ''}`}
                          >
                            <input
                              type="radio"
                              name="courier-partner"
                              value={partner.value}
                              checked={isSelected}
                              onChange={() => changeCourierPartner(partner.value)}
                              className="CourierRadio"
                            />
                            <span className="CourierOptionLabel">{partner.label}</span>
                            <span className={`CourierOptionFee ${fee === 0 ? 'free' : ''}`}>
                              {fee === 0 ? 'Free shipping' : `+₹${fee}`}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    <p className="CourierNote">
                      Free shipping on orders of ₹2,050 or more.
                    </p>
                  </div>
                </div>
              )}

              <div className="FormActions">
                <button onClick={() => changeStep(1)} className="BackBtn">
                  <FaArrowLeft /> Back to Review
                </button>
                <button
                  onClick={handleProceedToPayment}
                  disabled={isProcessing || isDelegating}
                  className="ProceedBtn StepBtn"
                >
                  {isProcessing || isDelegating ? 'Preparing Order...' : 'Proceed to Payment →'}
                </button>
              </div>
            </section>
          )}

          {/* STEP 3: PAYMENT SELECTION & ORDER CONFIRMATION */}
          {activeStep === 3 && (
            <section className="CheckoutSection PaymentSection">
              <h2 className="SectionTitle">Payment & Confirmation</h2>
              
              {/* Workshop Order Card if created */}
              {orderNum && (
                <div className="OrderAlertBox">
                  <div className="OrderAlertHeader">
                    <FaCheckCircle className="AlertIcon" />
                    <span>Workshop Order #{orderNum}</span>
                  </div>
                  <p className="OrderAlertText">Learning order successfully initiated.</p>
                </div>
              )}

              {/* Delegated E-commerce Physical Order Card */}
              {delegatedId && (
                <div className="OrderAlertBox" style={{ borderColor: '#3b82f6', background: '#eff6ff' }}>
                  <div className="OrderAlertHeader" style={{ color: '#1d4ed8' }}>
                    <FaBoxOpen className="AlertIcon" style={{ color: '#2563eb' }} />
                    <span>E-commerce Physical Order #{delegatedId}</span>
                  </div>
                  <p className="OrderAlertText" style={{ color: '#1e40af' }}>
                    Physical products delegated to store (Status: Pending Fulfillment).
                  </p>
                </div>
              )}

              {/* Account Provisioning Notice for New E-commerce Customers */}
              {ecommerceCustomer?.status === 'created' && (
                <div className="OrderAlertBox" style={{ borderColor: '#10b981', background: '#ecfdf5' }}>
                  <div className="OrderAlertHeader" style={{ color: '#047857' }}>
                    <FaCheckCircle className="AlertIcon" style={{ color: '#10b981' }} />
                    <span>E-commerce Account Provisioned</span>
                  </div>
                  <p className="OrderAlertText" style={{ color: '#065f46' }}>
                    An account has been created for your physical delivery. An email has been sent to set your password for shipment tracking.
                  </p>
                </div>
              )}

              <div className="PaymentOptionsList">
                <label className={`PaymentOptionCard ${paymentMethod === 'razorpay' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="gateway"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => changePaymentMethod('razorpay')}
                    className="PaymentRadio"
                  />
                  <div className="PaymentOptionContent">
                    <div className="PaymentTitle">
                      <FaCreditCard className="PaymentIcon" /> Razorpay Secure Gateway (Cards, UPI, Netbanking)
                    </div>
                    <p className="PaymentSubtext">256-Bit SSL Encrypted Online Payment</p>
                  </div>
                </label>
              </div>

              {/* Verification / failure status — prevents blind double submission */}
              {paymentStatus === 'verifying' && (
                <p style={{ marginTop: '14px', color: '#1d4ed8', fontWeight: 500 }}>
                  Verifying your payment with the gateway. Please do not close or refresh this window…
                </p>
              )}
              {paymentStatus === 'failed' && (
                <p style={{ marginTop: '14px', color: '#b91c1c', fontWeight: 500 }}>
                  {paymentError || 'Payment failed. Please try again.'}
                </p>
              )}

              <button
                onClick={() => executeRazorpay(activeOrder, user)}
                disabled={
                  isProcessing ||
                  paymentStatus === 'initiating' ||
                  paymentStatus === 'verifying' ||
                  paymentStatus === 'completed'
                }
                className="ProceedBtn PayButton"
              >
                <FaLock /> {paymentStatus === 'verifying'
                  ? 'Verifying Payment Signature...'
                  : `Pay ₹${(Number(activeOrder?.order?.amount) || finalPayable).toLocaleString()} via Razorpay`}
              </button>
            </section>
          )}
        </div>

        {/* Right Column: Order Summary & Coupon Panel */}
        <div className="CheckoutRight">
          <div className="SummaryCard">
            <h2 className="SummaryTitle">Order Summary</h2>

            {/* Coupon Application Box */}
            <div className="CouponBox">
              {appliedCoupon ? (
                <div className="AppliedCouponBadge">
                  <div>
                    <p className="CouponCodeText">
                      <FaTag /> {appliedCoupon.code}
                    </p>
                    <p className="DiscountValueText">
                      {appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}% OFF` : `₹${appliedCoupon.discount_value} OFF`}
                    </p>
                  </div>
                  <button onClick={removeCoupon} className="RemoveCouponBtn">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCouponSubmit} className="CouponForm">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                  <button type="submit" disabled={couponLoading}>
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </form>
              )}
              {couponError && <p className="CouponErrorText">{couponError}</p>}
            </div>

            <hr className="Divider" />

            <div className="SummaryRow">
              <span>Original Price:</span>
              <span>₹{originalTotal.toLocaleString()}</span>
            </div>
            {discountTotal > 0 && (
              <div className="SummaryRow DiscountRow">
                <span>Catalogue Discount:</span>
                <span>-₹{discountTotal.toLocaleString()}</span>
              </div>
            )}
            {appliedCoupon && (
              <div className="SummaryRow DiscountRow">
                <span>Coupon ({appliedCoupon.code}):</span>
                <span>Applied</span>
              </div>
            )}
            {hasPhysicalItems && (
              <div className="SummaryRow">
                <span>Courier Fee ({courierPartnerLabel(courierPartner)}):</span>
                <span>{courierFee === 0 ? 'Free' : `₹${courierFee.toLocaleString()}`}</span>
              </div>
            )}

            <hr className="Divider" />

            <div className="SummaryRow TotalRow">
              <span>Total Payable:</span>
              <span>₹{finalPayable.toLocaleString()}</span>
            </div>

            <div className="GuaranteeBlock">
              <p><FaShieldAlt style={{ display: 'inline', marginRight: 4, color: 'var(--primaryColor)' }} /> 100% Secure Checkout</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}