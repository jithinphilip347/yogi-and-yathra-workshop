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
import Inst1 from "@/assets/images/instructor-1.jpg";
import ThumbNail from "@/assets/images/live1.jpg";
import ProductDetailPopup from '@/components/popup/ProductDetailPopup'; 
import { MEDIA_BASE_URL, PRODUCT_MEDIA_BASE_URL } from '@/utils/constants';

const LiveDetails = ({ id, classDetails }) => {
  const liveClass = classDetails || {};
  
  const [message, setMessage] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  const toggleCartItem = (id) => {
    setCartItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };
  
  // Static chat messages as placeholder
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

  const products = liveClass?.products || [];
  const instructor = liveClass?.instructor;
  const days = liveClass?.schedule || [];

  return (
    <div id="DailyLiveClassDetails">
      <div className="container">
        <div className="LiveClassDetailsMain">
          <div className="DetailsLeft">
            <div className="ThumbnailWrapper">
              <Image
                src={liveClass?.thumbnail ? `${MEDIA_BASE_URL}${liveClass.thumbnail}` : ThumbNail}
                alt="Class Thumbnail"
                layout="fill"
                objectFit="cover"
              />
            </div>

            <div className="ClassHeader">
              {liveClass?.category?.name && <span className='Badge' style={{marginBottom: '10px', display: 'inline-block'}}>{liveClass.category.name}</span>}
              <h1>{liveClass?.title || "Live Class Title"}</h1>

              <div className="ScheduleGrid">
                <div className="ScheduleItem">
                  <FiCalendar />
                  <div className="TextWrap">
                    <small>Duration</small>
                    <span>{liveClass?.human_start_date} - {liveClass?.human_end_date}</span>
                  </div>
                </div>
                <div className="ScheduleItem">
                  <FiClock />
                  <div className="TextWrap">
                    <small>Class Time</small>
                    <span>{liveClass?.human_class_time} ({liveClass?.duration || 60} mins)</span>
                  </div>
                </div>
              </div>

              <div className="ActionFlex">
                <div className="DayGroup">
                  <label>Class Days:</label>
                  <div className="DayList">
                    {days.length > 0 ? days.map((day, i) => (
                      <span key={i} className="DayBox">
                        {day}
                      </span>
                    )) : (
                      <span className="DayBox">No days scheduled</span>
                    )}
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
                   {instructor?.avatar ? (
                    <Image src={`${MEDIA_BASE_URL}${instructor.avatar}`} alt="Author" width={60} height={60} className="AuthImg" style={{borderRadius: '50%'}} />
                  ) : (
                    <Image src={Inst1} alt="Author" className="AuthImg" />
                  )}
                </div>
                <div className="AuthRight">
                  <h4>{instructor?.name || "Instructor Name"}</h4>
                   <p>{instructor?.role || "Instructor"}</p>
                  <div className="AuthMeta">
                    <span className="Rating">
                      <AiFillStar /> 4.8 Rating
                    </span>
                    <span className="Students">
                      <FiUsers /> 1,234 Students
                    </span>
                  </div>
                </div>
              </div>
               {/* <div className='Bio ContentText' dangerouslySetInnerHTML={{ __html: instructor?.bio_graphy || "Instructor biography not available." }}></div> */}
            </div>

            <div className="DescriptionBox">
              <h3>About this Daily Live Class</h3>
              <div className='ContentText' dangerouslySetInnerHTML={{ __html: liveClass?.description || "<p>No description available.</p>" }}>
              </div>
            </div>

                 {/* REQUIREMENTS & PRODUCTS BOX */}
                <div className='HighlightBox RequirementsSection'>
                  <h3>Course Requirements & Gear</h3>
                  <p className='BoxSub'>To get the best results from this course, we recommend the following gear:</p>
                  <ul className='ReqList'>
                     {liveClass?.requirements && Array.isArray(liveClass.requirements) && liveClass.requirements.length > 0 ? (
                        liveClass.requirements.map((req, idx) => (
                          <li key={idx}><FiCheckCircle /> {req}</li>
                        ))
                    ) : (
                        <li><FiCheckCircle /> Basic understanding of yoga.</li>
                    )}
                  </ul>
    
                <div className='ProductList'>
                    {products.map((prod, index) => (
                      <div className='ProductItem' key={index}>
                        <div className='ProdLeft'>
                          <Image src={prod.image ? `${PRODUCT_MEDIA_BASE_URL}${prod.image}` : ThumbNail} alt="Product" width={60} height={60} />
                          <div className='ProdInfo'>
                            <h4>{prod.label}</h4>
                            <div className='PriceRow'>
                              <span className='Curr'>₹{prod.price}</span>
                            </div>
                          </div>
                        </div>
                        <div className='ActionArea'>
                          <button className='ViewDetailsBtn' onClick={() => setSelectedProduct(prod)}>View Details</button>
                          <button 
                            className={`AddToCartBtn ${cartItems.includes(prod.value) ? 'added' : ''}`}
                            onClick={() => toggleCartItem(prod.value)}
                          >
                            {cartItems.includes(prod.value) ? 'Remove from Cart' : 'Add to Cart'}
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
        isAdded={cartItems.includes(selectedProduct.value)}
        />
    )}
    </div>
  );
};

export default LiveDetails;
