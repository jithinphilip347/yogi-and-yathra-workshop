"use client";
import React, { useState } from "react";
import {
  FiClock,
  FiCalendar,
  FiStar,
  FiSend,
  FiCheckCircle,
  FiExternalLink,
  FiUsers,
} from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import Image from "next/image";
import Link from "next/link";
import Inst1 from "../../../assets/images/instructor-1.jpg";
import ThumbNail from "../../../assets/images/live1.jpg";
import Yoga1 from "../../../assets/images/yoga-1.jpg";
import Yoga2 from "../../../assets/images/yoga-2.jpg";
import Yoga3 from "../../../assets/images/yoga-3.jpg";
import ProductDetailPopup from '@/components/popup/ProductDetailPopup'; // Path based on your folder


const Page = () => {
  const [message, setMessage] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  const toggleCartItem = (id) => {
    setCartItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };
  
  const chatMessages = [
    {
      id: 1,
      user: "Salina G.",
      text: "I have doubt at no. 4?",
      time: "09:25 AM",
      type: "other",
    },
    {
      id: 2,
      user: "Khairul",
      text: "I have doubt at no. 4?",
      time: "09:25 AM",
      type: "other",
    },
    {
      id: 3,
      user: "You",
      text: "How to solve no. 5?",
      time: "09:25 AM",
      type: "me",
    },
    {
      id: 4,
      user: "Jhon Abraham",
      text: "I have doubt at no. 4?",
      time: "09:25 AM",
      type: "other",
    },
  ];

    const products = [
      { id: 'prod1', title: 'Professional Yoga Mat', description: 'High-quality non-slip yoga mat.', price: 899, image: ThumbNail },
      { id: 'prod2', title: 'Foam Yoga Blocks', description: 'Supports better alignment and balance.', price: 450, image: ThumbNail }
    ];
  const classDays = ["Mon", "Tue", "Wed", "Fri"];

  return (
    <div id="DailyLiveClassDetails">
      <div className="container">
        <div className="LiveClassDetailsMain">
          <div className="DetailsLeft">
            <div className="ThumbnailWrapper">
              <Image
                src={ThumbNail}
                alt="Class Thumbnail"
                layout="fill"
                objectFit="cover"
              />
            </div>

            <div className="ClassHeader">
              <h1>Morning Yoga & Meditation for Mindfulness</h1>

              <div className="ScheduleGrid">
                <div className="ScheduleItem">
                  <FiCalendar />
                  <div className="TextWrap">
                    <small>Duration</small>
                    <span>24 Jan 2026 - 24 May 2026</span>
                  </div>
                </div>
                <div className="ScheduleItem">
                  <FiClock />
                  <div className="TextWrap">
                    <small>Class Time</small>
                    <span>06:30 AM - 08:00 AM</span>
                  </div>
                </div>
              </div>

              <div className="ActionFlex">
                <div className="DayGroup">
                  <label>Class Days:</label>
                  <div className="DayList">
                    {classDays.map((day) => (
                      <span key={day} className="DayBox">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
                <Link href="/plans" className="EnrollBtn">
                  Enroll Now <FiExternalLink />
                </Link>
              </div>
            </div>

            <div className="InstructorSection">
              <div className="AuthCard">
                <div className="AuthLeft">
                  <Image src={Inst1} alt="Author" className="AuthImg" />
                </div>
                <div className="AuthRight">
                  <h4>Dr. Angela Yu</h4>
                  <div className="AuthMeta">
                    <span className="Rating">
                      <AiFillStar /> 4.8 Rating
                    </span>
                    <span className="Students">
                      <FiUsers /> 2,345 Students
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="DescriptionBox">
              <h3>About this Daily Live Class</h3>
              <p>
                Experience a transformative journey with our Morning Yoga and
                Meditation session. This daily live class is designed to help
                you build physical strength, flexibility, and mental clarity. We
                focus on Hatha Yoga principles combined with deep breathing
                techniques (Pranayama) to start your day with positive energy.
              </p>
            </div>

           
            {/* <div className="RequirementsSection">
              <h3>Requirements & Recommended Gear</h3>
              <ul className="ReqList">
                <li>
                  <div className="ReqPoint">
                    <FiCheckCircle />{" "}
                    <span>A quiet and comfortable space for practice.</span>
                  </div>
                </li>
                <li>
                  <div className="ReqPoint">
                    <FiCheckCircle />{" "}
                    <span>Comfortable, stretchable clothing.</span>
                  </div>
                </li>
                <li>
                  <div className="ReqPoint">
                    <FiCheckCircle />{" "}
                    <span>Basic understanding of breathing patterns.</span>
                  </div>
                </li>
              </ul>
              <div className="ProductArea">
                <div className="ProductGrid">
                  <div className="ProductCard">
                     <div className="ProductImgDetatils">
                    <div className="ProdImg">
                      <Image
                        src={Yoga1}
                        alt="Yoga Mat"
                        width={80}
                        height={80}
                      />
                    </div>
                    <div className="ProdDetails">
                      <h4>Premium Eco-Friendly Yoga Mat</h4>
                      <p>
                        Non-slip, extra thick padding for joint support during
                        asanas.
                      </p>
                        <div className="PriceBox">
                        <h3>₹499</h3>
                      </div>
                    </div>
                    </div>
                    <div className="AddtoCart">
                    <button className="ProdCartBtn">Add to Cart</button>
                    </div>
                  </div>

                  <div className="ProductCard">
                    <div className="ProductImgDetatils">
                    <div className="ProdImg">
                      <Image
                        src={Yoga2}
                        alt="Yoga Block"
                        width={80}
                        height={80}
                      />
                    </div>
                    <div className="ProdDetails">
                      <h4>High-Density Yoga Blocks</h4>
                      <p>
                        Provides stability and balance needed for deep
                        stretches.
                      </p>
                      <div className="PriceBox">
                        <h3>₹499</h3>
                      </div>
                    </div>
                    </div>
                       <div className="AddtoCart">
                    <button className="ProdCartBtn">Add to Cart</button>
                    </div>
                  </div>

                  <div className="ProductCard">
                    <div className="ProductImgDetatils">
                    <div className="ProdImg">
                      <Image
                        src={Yoga3}
                        alt="Yoga Strap"
                        width={80}
                        height={80}
                      />
                    </div>
                    <div className="ProdDetails">
                      <h4>Adjustable Yoga Cotton Strap</h4>
                      <p>
                        Improve flexibility and maintain proper alignment
                        safely.
                      </p>
                        <div className="PriceBox">
                        <h3>₹499</h3>
                      </div>
                    </div>
                    </div>

                    <div className="AddtoCart">
                    <button className="ProdCartBtn">Add to Cart</button>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
            
                 {/* REQUIREMENTS & PRODUCTS BOX */}
                <div className='HighlightBox RequirementsSection'>
                  <h3>Course Requirements & Gear</h3>
                  <p className='BoxSub'>To get the best results from this course, we recommend the following gear:</p>
                  <ul className='ReqList'>
                    <li><FiCheckCircle /> Basic understanding of the subject matter.</li>
                    <li><FiCheckCircle /> High-speed internet connection for live sessions.</li>
                  </ul>
    
                <div className='ProductList'>
                    {products.map(prod => (
                      <div className='ProductItem' key={prod.id}>
                        <div className='ProdLeft'>
                          <Image src={prod.image} alt="Product" width={60} height={60} />
                          <div className='ProdInfo'>
                            <h4>{prod.title}</h4>
                            <div className='PriceRow'>
                              <span className='Curr'>₹{prod.price}</span> <del>₹1,499</del>
                            </div>
                          </div>
                        </div>
                        <div className='ActionArea'>
                          <button className='ViewDetailsBtn' onClick={() => setSelectedProduct(prod)}>View Details</button>
                          <button 
                            className={`AddToCartBtn ${cartItems.includes(prod.id) ? 'added' : ''}`}
                            onClick={() => toggleCartItem(prod.id)}
                          >
                            {cartItems.includes(prod.id) ? 'Remove from Cart' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            
            <div className="ReviewSection">
              <h3>Write a Review</h3>
              <div className="ReviewForm">
                <div className="StarInput">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FiStar key={s} />
                  ))}
                  <span>Rate this session</span>
                </div>
                <textarea placeholder="Share your experience..."></textarea>
                <button className="SubmitBtn">Submit Review</button>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION - CHAT BOX */}
          <aside className="ChatSidebar">
            <div className="ChatHeader">
              <h3>Live Chat</h3>
            </div>

            <div className="ChatBody">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`ChatItem ${msg.type}`}>
                  <div className="UserImg">
                    <Image src={Inst1} alt="user" width={35} height={35} />
                  </div>
                  <div className="MsgContent">
                    <div className="UserMeta">
                      <h5>{msg.user}</h5>
                    </div>
                    <div className="MsgBubble">
                      <p>{msg.text}</p>
                    </div>
                    <span className="Time">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="ChatFooter">
              <input
                type="text"
                placeholder="Write a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button className="SendBtn">
                <FiSend />
              </button>
            </div>
          </aside>
        </div>
      </div>
           {selectedProduct && (
              <ProductDetailPopup 
                product={selectedProduct} 
                onClose={() => setSelectedProduct(null)} 
                onToggleCart={toggleCartItem}
                isAdded={cartItems.includes(selectedProduct.id)}
              />
            )}
    </div>
  );
};

export default Page;
