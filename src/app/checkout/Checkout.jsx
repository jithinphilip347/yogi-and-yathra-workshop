"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { FaCalendar, FaClock } from 'react-icons/fa';
import ThumbNail from '@/assets/images/live1.webp'; 
import '../../assets/css/checkout.css'; 

const INITIAL_CART_ITEMS = [
  {
    id: 1,
    title: "Advanced Meditation",
    category: "POWER YOGA",
    instructor: "Achu Sivadasan",
    dateRange: "14 Jan - 24 Jan",
    time: "07:00 PM",
    currentPrice: 998,
    originalPrice: 3998,
    image: ThumbNail
  },
  {
    id: 2,
    title: "Morning Vinyasa Flow",
    category: "VINYASA",
    instructor: "Achu Sivadasan",
    dateRange: "01 Feb - 28 Feb",
    time: "06:30 AM",
    currentPrice: 1299,
    originalPrice: 4500,
    image: ThumbNail
  },
  {
    id: 3,
    title: "Mindfulness Retreat",
    category: "MEDITATION",
    instructor: "Achu Sivadasan",
    dateRange: "01 Dec - 10 Dec",
    time: "08:00 PM",
    currentPrice: 899,
    originalPrice: 2999,
    image: ThumbNail
  }
];

const Checkout = () => {
  const [cartItems, setCartItems] = useState(INITIAL_CART_ITEMS);

  const handleRemove = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.currentPrice, 0);
  const originalTotal = cartItems.reduce((sum, item) => sum + item.originalPrice, 0);
  const discount = originalTotal - subtotal;
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  return (
    <div id='Checkout'>
      <div className="CheckoutContainer">
        
        {/* Left Column - Course Details */}
        <div className="CheckoutLeft">
          <section className="CheckoutSection CourseReviewSection">
            <h2 className="SectionTitle">Order Details ({cartItems.length} items)</h2>
            
            <div className="CourseList">
              {cartItems.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6a6f73', background: '#f7f9fa', borderRadius: '8px', border: '1px solid #d1d7dc' }}>
                  Your cart is empty.
                </div>
              ) : (
                cartItems.map((course) => (
                  <div className="CourseReviewCard" key={course.id}>
                    <div className="CourseThumb">
                      <Image src={course.image} alt={course.title} width={160} height={100} className="Img" />
                    </div>
                    <div className="CourseInfo">
                      <span className="Category">{course.category}</span>
                      <h3>{course.title}</h3>
                      <p className="Instructor">Instructor: <span>{course.instructor}</span></p>
                      <div className="Meta">
                        <div className="MetaItem">
                          <FaCalendar className="Icon" />
                          <span>{course.dateRange}</span>
                        </div>
                        <div className="MetaItem">
                          <FaClock className="Icon" />
                          <span>{course.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="CoursePrice">
                      <span className="CurrentPrice">₹{course.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="OriginalPrice">₹{course.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <button className="RemoveBtn" onClick={() => handleRemove(course.id)}>Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column - Summary */}
        <div className="CheckoutRight">
          <div className="SummaryCard">
            <h2 className="SummaryTitle">Order summary</h2>
            
            <div className="SummaryRow">
              <span>Original Price:</span>
              <span>₹{originalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="SummaryRow">
              <span>Discounts:</span>
              <span>-₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <hr className="Divider" />

            <div className="SummaryRow">
              <span><strong>Subtotal:</strong></span>
              <span><strong>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
            </div>
            <div className="SummaryRow">
              <span>GST (18%):</span>
              <span>+₹{gst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <hr className="Divider" />

            <div className="SummaryRow TotalRow">
              <span>Total:</span>
              <span>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            
            <button className="ProceedBtn">
              Proceed to Payment
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
export default Checkout;