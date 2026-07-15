"use client";
import Image from "next/image";
import React, { useState } from "react";
import CourseImg1 from "../../assets/images/courseImg-1.webp";
import CourseImg2 from "../../assets/images/courseImg-2.webp";
import CourseImg3 from "../../assets/images/courseImg-3.webp";
import CourseImg4 from "../../assets/images/courseImg-4.webp";

import { FaStar, FaBookOpen, FaClock } from "react-icons/fa";

const Cart = () => {

  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      title: "Soorya Namaskaram",
      desc: "Complete yoga course to improve flexibility, body strength and mental focus.",
      lessons: 3,
      hours: 10,
      price: 499,
      oldPrice: 1499,
      img: CourseImg1
    },
    {
      id: 2,
      title: "Advanced Yoga Flow",
      desc: "Master advanced yoga poses and breathing techniques.",
      lessons: 5,
      hours: 12,
      price: 699,
      oldPrice: 1799,
      img: CourseImg2
    },
    {
      id: 3,
      title: "Meditation Mastery",
      desc: "Learn mindfulness meditation techniques for a calm mind.",
      lessons: 4,
      hours: 8,
      price: 399,
      oldPrice: 1299,
      img: CourseImg3
    },
    {
      id: 4,
      title: "Yoga for Beginners",
      desc: "Start your yoga journey with easy beginner poses.",
      lessons: 3,
      hours: 6,
      price: 499,
      oldPrice: 1499,
      img: CourseImg4
    }
  ]);


  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };



  const totalPrice = cartItems.reduce((acc, item) => acc + item.price, 0);

  const originalPrice = cartItems.reduce((acc, item) => acc + item.oldPrice, 0);

  const discount = originalPrice - totalPrice;


  return (
    <div id="Cart">
      <div className="container">

        <div className="CartHeader">
          <h1 className="CartTitle">Your Learning Basket</h1>

          <p className="CourseCount">
            {cartItems.length} Courses in Cart
          </p>
        </div>



        {cartItems.length === 0 ? (

          <div className="EmptyCart">

            <h2>Your Cart is Empty</h2>

            <p>
              Looks like you haven`&apos;t added any courses yet.
              Start learning something new today!
            </p>

            <button className="browseBtn">
              Browse Courses
            </button>

          </div>

        ) : (

          <div className="CartMain">

            <div className="CartLeft">

              {cartItems.map((item) => (

                <div className="CartItem" key={item.id}>

                  <div className="courseImgBox">
                    <Image src={item.img} alt="course" />
                  </div>

                  <div className="CourseDetailsBox">

                    <h2 className="CourseTitle">
                      {item.title}
                    </h2>

                    <p className="CourseDesc">
                      {item.desc}
                    </p>

                    <div className="CourseRatingBox">

                      <div className="rating">

                        <span>4.6</span>

                        <div className="stars">
                          <FaStar />
                          <FaStar />
                          <FaStar />
                          <FaStar />
                          <FaStar />
                        </div>

                        <p>(2800 students)</p>

                      </div>

                    </div>

                    <div className="LessonsHoursBox">

                      <div className="Lessons">
                        <FaBookOpen />
                        <p>{item.lessons} Lessons</p>
                      </div>

                      <div className="Hours">
                        <FaClock />
                        <p>{item.hours} Hours</p>
                      </div>

                    </div>

                  </div>



                  <div className="CoursePriceBox">

                    <button
                      className="removeBtn"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>

                    <div className="price">

                      <h3>
                        ₹{item.price}
                      </h3>

                      <span className="oldPrice">
                        ₹{item.oldPrice}
                      </span>

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
                    <span>₹{originalPrice}</span>
                  </div>

                  <div className="PriceRow">
                    <p>Discount</p>
                    <span>- ₹{discount}</span>
                  </div>

                  <div className="Divider"></div>

                  <div className="TotalPrice">
                    <p>Total</p>
                    <h2>₹{totalPrice}</h2>
                  </div>

                  <div className="MobileTotalDetails">
                    <p className="MobTotalLabel">Total:</p>
                    <h2>₹{totalPrice}</h2>
                    <span className="MobOldPrice">₹{originalPrice}</span>
                    <span className="MobDiscount">-₹{discount}</span>
                  </div>

                </div>

                <button className="checkoutBtn">
                  Proceed to Checkout
                </button>

              </div>

            </div>

          </div>

        )}

      </div>
    </div>
  );
};

export default Cart;