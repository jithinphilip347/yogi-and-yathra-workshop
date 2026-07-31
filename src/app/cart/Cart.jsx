"use client";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import { FaStar, FaBookOpen, FaClock } from "react-icons/fa";
import { useCart } from "@/features/commerce/hooks/useCommerceHooks";
import CourseImg1 from "../../assets/images/courseImg-1.webp";

const Cart = () => {
  const {
    items,
    itemCount,
    subtotal,
    originalTotal,
    discountTotal,
    removeItem,
  } = useCart();

  return (
    <div id="Cart">
      <div className="container">
        <div className="CartHeader">
          <h1 className="CartTitle">Your Learning Basket</h1>
          <p className="CourseCount">
            {itemCount} {itemCount === 1 ? "Item" : "Items"} in Cart
          </p>
        </div>

        {items.length === 0 ? (
          <div className="EmptyCart">
            <h2>Your Cart is Empty</h2>
            <p>
              Looks like you haven&apos;t added any courses yet.
              Start learning something new today!
            </p>
            <Link href="/" passHref>
              <button className="browseBtn">
                Browse Courses
              </button>
            </Link>
          </div>
        ) : (
          <div className="CartMain">
            <div className="CartLeft">
              {items.map((item) => (
                <div className="CartItem" key={item.id}>
                  <div className="courseImgBox">
                    <Image
                      src={item.image || CourseImg1}
                      alt={item.title}
                      width={120}
                      height={80}
                      style={{ objectFit: 'cover' }}
                    />
                  </div>

                  <div className="CourseDetailsBox">
                    <h2 className="CourseTitle">{item.title}</h2>
                    <p className="CourseDesc">{item.subtitle || item.productable_type}</p>

                    <div className="LessonsHoursBox">
                      {item.meta?.lessons_count > 0 && (
                        <div className="Lessons">
                          <FaBookOpen />
                          <p>{item.meta.lessons_count} Lessons</p>
                        </div>
                      )}
                      {item.meta?.duration > 0 && (
                        <div className="Hours">
                          <FaClock />
                          <p>{item.meta.duration} Hours</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="CoursePriceBox">
                    <button
                      className="removeBtn"
                      onClick={() => removeItem(item.productable_type, item.productable_id)}
                    >
                      Remove
                    </button>

                    <div className="price">
                      <h3>₹{(item.price * item.quantity).toLocaleString()}</h3>
                      {item.original_price > item.price && (
                        <span className="oldPrice">₹{(item.original_price * item.quantity).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="CartRight">
              <div className="CartSummary">
                <h3>Order Summary</h3>

                <div className="PriceBox">
                  <div className="PriceRow">
                    <p>Original Price</p>
                    <span>₹{originalTotal.toLocaleString()}</span>
                  </div>

                  {discountTotal > 0 && (
                    <div className="PriceRow">
                      <p>Discount</p>
                      <span>- ₹{discountTotal.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="Divider"></div>

                  <div className="TotalPrice">
                    <p>Total</p>
                    <h2>₹{subtotal.toLocaleString()}</h2>
                  </div>
                </div>

                <Link href="/checkout" style={{ textDecoration: 'none' }}>
                  <button className="checkoutBtn">
                    Proceed to Checkout
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;