"use client";
import React, { useState } from "react";
import {
  FiClock,
  FiCalendar,
  FiExternalLink,
  FiUsers,
  FiCheckCircle,
  FiCheck,
} from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import Image from "next/image";
import Link from "next/link";
import Inst1 from "@/assets/images/instructor-1.webp";
import ThumbNail from "@/assets/images/live1.webp";
import { MEDIA_BASE_URL } from "@/utils/constants";
import Yoga1 from '@/assets/images/yoga-1.jpg'
import Yoga2 from '@/assets/images/yoga-2.jpg'
import Yoga3 from '@/assets/images/yoga-3.jpg'

const LiveDetails = ({ id, classDetails }) => {
  const liveClass = classDetails || {};
  const instructor = liveClass?.instructor;
  const days = liveClass?.schedule || [];

  const products =
    liveClass?.products?.length > 0
      ? liveClass.products
      : [
          {
            value: "prod_1",
            label: "Premium Yoga Mat",
            price: "1,299",
            image: Yoga1,
          },
          {
            value: "prod_2",
            label: "Meditation Cushion",
            price: "899",
            image: Yoga2,
          },
          {
            value: "prod_3",
            label: "Yoga Blocks (Set of 2)",
            price: "499",
            image: Yoga3,
          },
        ];

  const [showPricing, setShowPricing] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const toggleCartItem = (val) => {
    setCartItems((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val],
    );
  };

  return (
    <div id="DailyLiveClassDetails">
      <div className="container">
        <div className="LiveTopSection">
          <div className="LiveImage">
            <Image
              src={
                liveClass?.thumbnail
                  ? `${MEDIA_BASE_URL}${liveClass.thumbnail}`
                  : ThumbNail
              }
              alt="Live Class"
              fill
              style={{ objectFit: "cover" }}
            />
          </div>

          <div className="LiveInfo">
            <span className="Category">
              {liveClass?.category?.name || "Yoga"}
            </span>

            <h1>{liveClass?.title || "Daily Yoga Class"}</h1>

            <div className="MetaRow">
              <div className="MetaItem">
                <FiCalendar />

                <div>
                  <small>Duration</small>

                  <p>
                    {liveClass?.human_start_date} - {liveClass?.human_end_date}
                  </p>
                </div>
              </div>

              <div className="MetaItem">
                <FiClock />

                <div>
                  <small>Class Time</small>

                  <p>
                    {liveClass?.human_class_time} ({liveClass?.duration || 60}{" "}
                    mins)
                  </p>
                </div>
              </div>
            </div>

            <div className="ClassDays">
              <span>Class Days:</span>

              <div className="DayList">
                {days.length > 0 ? (
                  days.map((day, i) => (
                    <div key={i} className="DayBox">
                      {day}
                    </div>
                  ))
                ) : (
                  <div className="DayBox">No days</div>
                )}
              </div>
            </div>

            <div className="InstructorEnrollBox">
              <div className="InstructorCard">
                <Image
                  src={
                    instructor?.avatar
                      ? `${MEDIA_BASE_URL}${instructor.avatar}`
                      : Inst1
                  }
                  alt="Instructor"
                  width={60}
                  height={60}
                />

                <div>
                  <h4>{instructor?.name || "Instructor Name"}</h4>
                  <p>{instructor?.role || "Instructor"}</p>
                  <div className="InstructorMeta">
                    <span>
                      <AiFillStar /> 4.8 Rating
                    </span>
                    <span>
                      <FiUsers /> 1,234 Students
                    </span>
                  </div>
                </div>
              </div>

              <button
                className="EnrollBtn"
                onClick={() => {
                  setShowPricing(true);
                  setTimeout(() => {
                    document
                      .getElementById("pricing-section")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
              >
                Enroll Now <FiExternalLink />
              </button>
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}

        <div className="DescriptionSection">
          <h3>About this Daily Live Class</h3>

          <div
            dangerouslySetInnerHTML={{
              __html:
                liveClass?.description || "<p>No description available</p>",
            }}
          />
        </div>

        <div className="RequirementsSection">
          <h3>Course Requirements & Gear</h3>

          <ul>
            {liveClass?.requirements?.length > 0 ? (
              liveClass.requirements.map((req, i) => (
                <li key={i}>
                  <FiCheckCircle /> {req}
                </li>
              ))
            ) : (
              <li>
                <FiCheckCircle /> Basic knowledge of yoga
              </li>
            )}
          </ul>
          <div className="ProductList">
            {products.map((prod, index) => (
              <div className="ProductItem" key={index}>
                <div className="ProdLeft">
                  <Image
                    src={
                      prod.image
                    }
                    alt="Product"
                    width={60}
                    height={60}
                  />
                  <div className="ProdInfo">
                    <h4>{prod.label}</h4>
                    <div className="PriceRow">
                      <span className="Curr">₹{prod.price}</span>
                    </div>
                  </div>
                </div>
                <div className="ActionArea">
                  <button
                    className="ViewDetailsBtn"
                    onClick={() => setSelectedProduct(prod)}
                  >
                    View Details
                  </button>
                  <button
                    className={`AddToCartBtn ${cartItems.includes(prod.value) ? "added" : ""}`}
                    onClick={() => toggleCartItem(prod.value)}
                  >
                    {cartItems.includes(prod.value)
                      ? "Remove from Cart"
                      : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showPricing && (
          <div className="PricingSection" id="pricing-section">
            <div className="PricingContainer">
              <div className="PricingTable">
                <table>
                  <thead>
                    <tr>
                      <th>What&apos;s included</th>
                      <th>Annual</th>
                      <th>Monthly</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Curated programs</td>
                      <td>
                        <FiCheck className="tick" />
                      </td>
                      <td>
                        <span className="dash">—</span>
                      </td>
                    </tr>
                    <tr>
                      <td>Live workshops</td>
                      <td>
                        <FiCheck className="tick" />
                      </td>
                      <td>
                        <span className="dash">—</span>
                      </td>
                    </tr>
                    <tr>
                      <td>10,000+ on-demand classes</td>
                      <td>
                        <FiCheck className="tick" />
                      </td>
                      <td>
                        <FiCheck className="tick" />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        20+ modalities (yoga, meditation, Pilates, and more)
                      </td>
                      <td>
                        <FiCheck className="tick" />
                      </td>
                      <td>
                        <FiCheck className="tick" />
                      </td>
                    </tr>
                    <tr>
                      <td>Expert teachers</td>
                      <td>
                        <FiCheck className="tick" />
                      </td>
                      <td>
                        <FiCheck className="tick" />
                      </td>
                    </tr>
                    <tr>
                      <td>Basic programs</td>
                      <td>
                        <FiCheck className="tick" />
                      </td>
                      <td>
                        <FiCheck className="tick" />
                      </td>
                    </tr>
                    <tr>
                      <td>7-day free trial</td>
                      <td>
                        <FiCheck className="tick" />
                      </td>
                      <td>
                        <FiCheck className="tick" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="PricingCards">
                <div className="PlanCard AnnualCard">
                  <div className="Badge">Best value - Save ₹9000 per year</div>
                  <h3>Annual plan</h3>
                  <div className="PriceBox">
                    <span className="Price">₹1,699</span>
                    <span className="Period">/mo</span>
                  </div>
                  <p className="SubText">₹20,388 per year, billed annually</p>
                  <button className="ChooseBtn DarkBtn">Choose plan</button>
                </div>

                <div className="PlanCard MonthlyCard">
                  <h3>Monthly plan</h3>
                  <div className="PriceBox">
                    <span className="Price">₹2,499</span>
                    <span className="Period">/mo</span>
                  </div>
                  <p className="SubText">₹29,988 per year, billed monthly</p>
                  <button className="ChooseBtn LightBtn">Choose plan</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveDetails;
