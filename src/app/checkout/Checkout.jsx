"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaCalendar, FaClock, FaCheckCircle, FaTag, FaCreditCard, FaLock } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useCheckout } from '@/features/commerce/hooks/useCheckout';
import { usePayment } from '@/features/commerce/hooks/usePayment';
import '@/assets/css/checkout.css';

export default function Checkout() {
  const {
    items,
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
      const timer = setTimeout(() => {
        router.push('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [items, router]);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

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
      const order = await initiateOrder();
      alert(`Order #${order.order_number || order.id} created successfully! Proceeding to Payment PSP...`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="Checkout">
      {/* Stepper Navigation */}
      <div className="CheckoutStepper">
        <div className={`StepItem ${activeStep >= 1 ? 'active' : ''}`}>
          <span className="StepNum">1</span>
          <span className="StepTitle">Order Review</span>
        </div>
        <div className="StepLine" />
        <div className={`StepItem ${activeStep >= 2 ? 'active' : ''}`}>
          <span className="StepNum">2</span>
          <span className="StepTitle">Student Details & Billing</span>
        </div>
        <div className="StepLine" />
        <div className={`StepItem ${activeStep >= 3 ? 'active' : ''}`}>
          <span className="StepNum">3</span>
          <span className="StepTitle">Payment Gateway</span>
        </div>
      </div>

      <div className="CheckoutContainer">
        {/* Left Column: Details */}
        <div className="CheckoutLeft">
          {error && (
            <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* STEP 1: ORDER REVIEW */}
          {activeStep === 1 && (
            <section className="CheckoutSection CourseReviewSection">
              <h2 className="SectionTitle">Order Items ({items.length})</h2>
              <div className="CourseList">
                {items.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#6a6f73', background: '#f7f9fa', borderRadius: '8px' }}>
                    Your cart is empty. Please add courses or classes before checkout.
                  </div>
                ) : (
                  items.map((item) => (
                    <div className="CourseReviewCard" key={item.id}>
                      <div className="CourseThumb">
                        {item.image && <Image src={item.image} alt={item.title} width={140} height={90} className="Img" />}
                      </div>
                      <div className="CourseInfo">
                        <span className="Category">{item.productable_type}</span>
                        <h3>{item.title}</h3>
                        <p className="Instructor">{item.subtitle}</p>
                      </div>
                      <div className="CoursePrice">
                        <span className="CurrentPrice">₹{(item.price * item.quantity).toLocaleString()}</span>
                        {item.original_price > item.price && (
                          <span className="OriginalPrice">₹{(item.original_price * item.quantity).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {items.length > 0 && (
                <button onClick={() => changeStep(2)} className="ProceedBtn mt-4">
                  Next: Student Details →
                </button>
              )}
            </section>
          )}

          {/* STEP 2: STUDENT DETAILS & BILLING */}
          {activeStep === 2 && (
            <section className="CheckoutSection bg-white p-6 rounded-xl border border-gray-200 space-y-4">
              <h2 className="SectionTitle">Student & Billing Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">State / Province</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => handleFormChange('state', e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={() => changeStep(1)} className="px-4 py-2 border rounded-lg text-sm font-medium">
                  ← Back to Review
                </button>
                <button onClick={handleProceedToPayment} disabled={isProcessing} className="ProceedBtn">
                  {isProcessing ? 'Initiating Order...' : 'Proceed to Payment →'}
                </button>
              </div>
            </section>
          )}

          {/* STEP 3: PAYMENT SELECTION */}
          {activeStep === 3 && (
            <section className="CheckoutSection bg-white p-6 rounded-xl border border-gray-200 space-y-4">
              <h2 className="SectionTitle">Payment Execution</h2>
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <FaCheckCircle size={18} /> Order Created #{activeOrder?.order_number || activeOrder?.id}
                </div>
                <p className="text-xs">Your billing order has been initiated in the Payment Domain.</p>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer bg-gray-50">
                  <input
                    type="radio"
                    name="gateway"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => changePaymentMethod('razorpay')}
                  />
                  <div>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      <FaCreditCard /> Razorpay Secure Gateway (Cards, UPI, Netbanking)
                    </p>
                    <p className="text-xs text-gray-500">256-Bit SSL Encrypted Online Payment</p>
                  </div>
                </label>
              </div>

              <button
                onClick={() => executeRazorpay(activeOrder || { id: 'ORD-DEMO', total_amount: subtotal }, user)}
                disabled={paymentStatus === 'initiating' || paymentStatus === 'verifying'}
                className="ProceedBtn flex items-center justify-center gap-2"
              >
                <FaLock /> {paymentStatus === 'verifying' ? 'Verifying Payment Signature...' : `Pay ₹${subtotal.toLocaleString()} via Razorpay`}
              </button>
            </section>
          )}
        </div>

        {/* Right Column: Order Summary & Coupon Panel */}
        <div className="CheckoutRight">
          <div className="SummaryCard space-y-4">
            <h2 className="SummaryTitle">Order Summary</h2>

            {/* Coupon Application Box */}
            <div className="CouponBox">
              {appliedCoupon ? (
                <div className="flex justify-between items-center p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                  <div>
                    <p className="font-bold text-emerald-800 flex items-center gap-1">
                      <FaTag /> {appliedCoupon.code}
                    </p>
                    <p className="text-emerald-600 font-mono">
                      {appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}% OFF` : `₹${appliedCoupon.discount_value} OFF`}
                    </p>
                  </div>
                  <button onClick={removeCoupon} className="text-red-500 font-bold hover:underline">
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
              {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
            </div>

            <hr className="Divider" />

            <div className="SummaryRow">
              <span>Original Price:</span>
              <span>₹{originalTotal.toLocaleString()}</span>
            </div>
            {discountTotal > 0 && (
              <div className="SummaryRow text-emerald-600">
                <span>Catalogue Discount:</span>
                <span>-₹{discountTotal.toLocaleString()}</span>
              </div>
            )}
            {appliedCoupon && (
              <div className="SummaryRow text-emerald-600">
                <span>Coupon ({appliedCoupon.code}):</span>
                <span>Applied</span>
              </div>
            )}

            <hr className="Divider" />

            <div className="SummaryRow TotalRow">
              <span>Total Payable:</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}