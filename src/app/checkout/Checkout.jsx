"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaCheckCircle, FaTag, FaCreditCard, FaLock, FaArrowLeft, FaArrowRight, FaShieldAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useCheckout } from '@/features/commerce/hooks/useCheckout';
import { usePayment } from '@/features/commerce/hooks/usePayment';
import '@/assets/css/checkout.scss';

export default function Checkout() {
  const {
    items,
    itemCount,
    subtotal,
    originalTotal,
    discountTotal,
    appliedCoupon,
    activeStep,
    billingAddress,
    paymentMethod,
    activeOrder,
    isProcessing,
    error,
    user,
    updateBilling,
    changeStep,
    changePaymentMethod,
    initiateOrder,
    validateAndApplyCoupon,
    removeCoupon,
  } = useCheckout();

  const { executeRazorpay, status: paymentStatus } = usePayment();

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
  });

  const router = useRouter();

  useEffect(() => {
    if (items.length === 0) {
      router.replace('/cart');
    }
  }, [items, router]);

  const [prevUser, setPrevUser] = useState(user);
  if (prevUser !== user) {
    setPrevUser(user);
    setForm((prev) => ({
      ...prev,
      name: prev.name || user?.name || '',
      email: prev.email || user?.email || '',
    }));
  }

  if (items.length === 0) {
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

  const handleFormChange = (field, val) => {
    const updated = { ...form, [field]: val };
    setForm(updated);
    updateBilling(updated);
  };

  const handleProceedToPayment = async () => {
    try {
      await initiateOrder();
    } catch (err) {
      console.error(err);
    }
  };

  const orderNum = activeOrder?.order_number || activeOrder?.id || activeOrder?.order?.order_number || activeOrder?.order?.id;
  const finalPayable = Math.max(0, subtotal - (Number(appliedCoupon?.discount) || 0));

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
          <span className="StepTitle">Student Details & Billing</span>
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
          {error && (
            <div className="CheckoutErrorMessage">
              {error}
            </div>
          )}

          {/* STEP 1: ORDER REVIEW */}
          {activeStep === 1 && (
            <section className="CheckoutSection CourseReviewSection">
              <h2 className="SectionTitle">Order Items ({itemCount})</h2>
              <div className="CourseList">
                {items.map((item) => (
                  <div className="CourseReviewCard" key={item.id}>
                    <div className="CourseThumb">
                      {item.image && <Image src={item.image} alt={item.title} width={140} height={90} className="Img" />}
                    </div>
                    <div className="CourseInfo">
                      <span className="Category">{item.productable_type || 'Course'}</span>
                      <h3>{item.title}</h3>
                      <p className="Instructor">{item.subtitle}</p>
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
                ))}
              </div>
              <button onClick={() => changeStep(2)} className="ProceedBtn StepBtn">
                Next: Student Details <FaArrowRight />
              </button>
            </section>
          )}

          {/* STEP 2: STUDENT DETAILS & BILLING */}
          {activeStep === 2 && (
            <section className="CheckoutSection">
              <h2 className="SectionTitle">Student & Billing Details</h2>
              <div className="FormGrid">
                <div className="FormGroup">
                  <label className="FormLabel">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
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
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    className="FormInput"
                    placeholder="Enter your email address"
                  />
                </div>
                <div className="FormGroup">
                  <label className="FormLabel">Phone Number</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    className="FormInput"
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="FormGroup">
                  <label className="FormLabel">State / Province</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => handleFormChange('state', e.target.value)}
                    className="FormInput"
                    placeholder="Enter state or province"
                  />
                </div>
              </div>

              <div className="FormActions">
                <button onClick={() => changeStep(1)} className="BackBtn">
                  <FaArrowLeft /> Back to Review
                </button>
                <button onClick={handleProceedToPayment} disabled={isProcessing} className="ProceedBtn StepBtn">
                  {isProcessing ? 'Initiating Order...' : 'Proceed to Payment →'}
                </button>
              </div>
            </section>
          )}

          {/* STEP 3: PAYMENT SELECTION */}
          {activeStep === 3 && (
            <section className="CheckoutSection PaymentSection">
              <h2 className="SectionTitle">Payment Execution</h2>
              
              <div className="OrderAlertBox">
                <div className="OrderAlertHeader">
                  <FaCheckCircle className="AlertIcon" />
                  <span>Order Created {orderNum ? `#${orderNum}` : ''}</span>
                </div>
                <p className="OrderAlertText">Your billing order has been successfully initiated in the Payment Domain.</p>
              </div>

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

              <button
                onClick={() => executeRazorpay(activeOrder, user)}
                disabled={!activeOrder || paymentStatus === 'initiating' || paymentStatus === 'verifying'}
                className="ProceedBtn PayButton"
              >
                <FaLock /> {paymentStatus === 'verifying' ? 'Verifying Payment Signature...' : `Pay ₹${(Number(activeOrder?.order?.amount) || finalPayable).toLocaleString()} via Razorpay`}
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