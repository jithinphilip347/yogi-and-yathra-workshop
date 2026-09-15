"use client";

import Image from "next/image";
import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaBookOpen, FaClock, FaExclamationTriangle, FaCheckCircle, FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import { useCart } from "@/features/commerce/hooks/useCommerceHooks";
import CourseImg1 from "../../assets/images/courseImg-1.webp";
import "@/assets/css/unifiedCart.scss";

const Cart = () => {
  const router = useRouter();
  const {
    items,
    itemCount,
    subtotal,
    originalTotal,
    discountTotal,
    workshopItems,
    ecommerceItems,
    isMixedCart,
    learningSubtotal,
    physicalSubtotal,
    validation,
    hasBlockingErrors,
    removeItem,
    setItemQuantity,
    proceedToCheckout,
    validateCartLive,
    sanitizeCart,
  } = useCart();

  // Run initial sanity check and live validation on page load
  useEffect(() => {
    sanitizeCart();
    if (items.length > 0) {
      validateCartLive();
    }
  }, []);

  const handleQuantityDecrease = (item) => {
    const currentQty = item.quantity || 1;
    if (currentQty > 1) {
      setItemQuantity(item.cart_key || item.productable_type, item.productable_id, currentQty - 1);
    } else {
      removeItem(item.cart_key || item.productable_type, item.productable_id);
    }
  };

  const handleQuantityIncrease = (item) => {
    const currentQty = item.quantity || 1;
    const maxQty = item.available_quantity || 99;
    if (currentQty < maxQty) {
      setItemQuantity(item.cart_key || item.productable_type, item.productable_id, currentQty + 1);
    }
  };

  const renderValidationBadge = (item) => {
    const status = item.validationStatus;
    if (!status || status === 'valid') return null;

    if (status === 'price_changed') {
      return (
        <div className="ValidationBadge priceChanged">
          <FaExclamationTriangle />
          <span>Price updated to ₹{Number(item.price).toLocaleString()}</span>
        </div>
      );
    }
    if (status === 'out_of_stock') {
      return (
        <div className="ValidationBadge outOfStock">
          <FaExclamationTriangle />
          <span>Out of Stock — Please remove to continue</span>
        </div>
      );
    }
    if (status === 'insufficient_stock') {
      return (
        <div className="ValidationBadge insufficientStock">
          <FaExclamationTriangle />
          <span>Only {item.available_quantity} available in stock</span>
        </div>
      );
    }
    if (status === 'unavailable' || status === 'not_found') {
      return (
        <div className="ValidationBadge unavailable">
          <FaExclamationTriangle />
          <span>Product no longer available — Please remove</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="Cart">
      <div className="container">
        <div className="CartHeader">
          <h1 className="CartTitle">Your Cart</h1>
          <p className="CourseCount">
            {itemCount} {itemCount === 1 ? "Item" : "Items"} in Cart
          </p>
        </div>

        {/* Global Cart Validation Banners */}
        {validation?.hasChanges && (
          <div className="CartAlertBanner warning">
            <FaExclamationTriangle />
            <span>Some items in your cart have updated prices. Review the new prices below before proceeding.</span>
          </div>
        )}
        {hasBlockingErrors && (
          <div className="CartAlertBanner error">
            <FaExclamationTriangle />
            <span>One or more items in your cart are currently out of stock or unavailable. Please adjust your cart to proceed.</span>
          </div>
        )}

        {items.length === 0 ? (
          <div className="EmptyCart">
            <h2>Your Cart is Empty</h2>
            <p>
              Looks like you haven&apos;t added any items yet.
              Explore our workshops, classes, and yoga gear today!
            </p>
            <Link href="/" passHref>
              <button className="browseBtn">
                Browse Catalog
              </button>
            </Link>
          </div>
        ) : (
          <div className="CartMain">
            <div className="CartLeft">
              {/* SECTION 1: LEARNING ITEMS */}
              {workshopItems.length > 0 && (
                <div className="CartDomainSection">
                  <div className="CartSectionHeader">
                    <h2>
                      Learning Programs ({workshopItems.length})
                    </h2>
                    <span className="DomainTag learning">Workshop Learning</span>
                  </div>

                  {workshopItems.map((item) => {
                    const itemKey = item.cart_key || `${item.productable_type}:${item.productable_id}`;
                    const hasIssue = item.validationStatus && item.validationStatus !== 'valid' && item.validationStatus !== 'price_changed';
                    const hasPriceChange = item.validationStatus === 'price_changed';

                    return (
                      <div className={`CartItem ${hasIssue ? 'hasIssue' : ''} ${hasPriceChange ? 'hasPriceChange' : ''}`} key={itemKey}>
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

                          <div className="ItemActionRow">
                            <span className="QtyBadge">Qty: 1</span>
                            <button
                              className="removeBtn"
                              onClick={() => removeItem(item.cart_key || item.productable_type, item.productable_id)}
                            >
                              Remove
                            </button>
                          </div>

                          {renderValidationBadge(item)}
                        </div>

                        <div className="CoursePriceBox">
                          <div className="price">
                            <h3>₹{Number(item.price || 0).toLocaleString()}</h3>
                            {Number(item.original_price || 0) > Number(item.price || 0) && (
                              <span className="oldPrice">₹{Number(item.original_price).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SECTION 2: PHYSICAL PRODUCTS & GEAR */}
              {ecommerceItems.length > 0 && (
                <div className="CartDomainSection">
                  <div className="CartSectionHeader">
                    <h2>
                      Physical Products & Gear ({ecommerceItems.length})
                    </h2>
                    <span className="DomainTag physical">E-Commerce Goods</span>
                  </div>

                  {ecommerceItems.map((item) => {
                    const itemKey = item.cart_key || `${item.productable_type}:${item.productable_id}`;
                    const hasIssue = item.validationStatus && item.validationStatus !== 'valid' && item.validationStatus !== 'price_changed';
                    const hasPriceChange = item.validationStatus === 'price_changed';
                    const itemTotal = Number(item.price || 0) * (item.quantity || 1);
                    const origTotal = Number(item.original_price || item.price || 0) * (item.quantity || 1);

                    return (
                      <div className={`CartItem ${hasIssue ? 'hasIssue' : ''} ${hasPriceChange ? 'hasPriceChange' : ''}`} key={itemKey}>
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
                          <p className="CourseDesc">{item.subtitle || (item.productable_type === 'Combo' ? 'Bundle Offer' : 'Yoga Gear')}</p>

                          <div className="ItemActionRow">
                            <div className="QuantityControl">
                              <button
                                className="qtyBtn minus"
                                onClick={() => handleQuantityDecrease(item)}
                                aria-label="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="qtyValue">{item.quantity || 1}</span>
                              <button
                                className="qtyBtn plus"
                                onClick={() => handleQuantityIncrease(item)}
                                disabled={item.available_quantity && item.quantity >= item.available_quantity}
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>

                            <button
                              className="removeBtn"
                              onClick={() => removeItem(item.cart_key || item.productable_type, item.productable_id)}
                            >
                              Remove
                            </button>
                          </div>

                          {renderValidationBadge(item)}
                        </div>

                        <div className="CoursePriceBox">
                          <div className="price">
                            <h3>₹{itemTotal.toLocaleString()}</h3>
                            {origTotal > itemTotal && (
                              <span className="oldPrice">₹{origTotal.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ORDER SUMMARY */}
            <div className="CartRight">
              <div className="CartSummary">
                <h3>Order Summary</h3>

                <div className="PriceBox">
                  {isMixedCart && (
                    <>
                      <div className="SummaryDomainRow">
                        <p>Learning Programs</p>
                        <span>₹{learningSubtotal.toLocaleString()}</span>
                      </div>
                      <div className="SummaryDomainRow">
                        <p>Physical Gear</p>
                        <span>₹{physicalSubtotal.toLocaleString()}</span>
                      </div>
                      <div className="Divider"></div>
                    </>
                  )}

                  <div className="PriceRow">
                    <p>Original Total</p>
                    <span>₹{originalTotal.toLocaleString()}</span>
                  </div>

                  {discountTotal > 0 && (
                    <div className="PriceRow">
                      <p>Discount Savings</p>
                      <span style={{ color: '#16a34a' }}>- ₹{discountTotal.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="Divider"></div>

                  <div className="TotalPrice">
                    <p>Subtotal</p>
                    <h2>₹{subtotal.toLocaleString()}</h2>
                  </div>
                </div>

                <button
                  className="checkoutBtn"
                  disabled={hasBlockingErrors || validation?.isValidating}
                  onClick={() => proceedToCheckout(router)}
                >
                  {validation?.isValidating ? "Validating Cart..." : "Proceed to Checkout"}
                </button>

                {hasBlockingErrors && (
                  <p className="CheckoutBlockNotice">
                    Please resolve unavailable or out-of-stock items to proceed.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;