"use client";
import React, { useState } from 'react';
import { FaRegHeart, FaLeaf, FaRegMoon, FaPlus, FaMinus } from 'react-icons/fa';
import '../../assets/css/about.css';


const About = () => {
  const [activeFaq, setActiveFaq] = useState(0);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "Do I need prior experience to join live classes?",
      answer: "Not at all! We offer classes for all levels, from complete beginners to advanced practitioners. Our instructors will guide you with variations suitable for your level."
    },
    {
      question: "What do I need for a daily yoga class?",
      answer: "All you need is a comfortable yoga mat, breathable clothing, and a water bottle. We provide all other necessary props like blocks and straps at our studio."
    },
    {
      question: "How do I access the live online sessions?",
      answer: "Once you register for a live class, you will receive a secure Zoom link via email 30 minutes before the session starts. Simply click the link to join."
    }
  ];

  return (
    <div id='About'>
      
      {/* Banner Section */}
      <div className="AboutBanner container">
          <div className="BannerContent">
              <span className="Subtitle">Welcome to Yogi Yathra</span>
              <h1>Discover the art of <br/> mindful living</h1>
              <p>A sanctuary for your body, mind, and soul.</p>
          </div>
          <div className="BannerImage">
              <img src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=2000&auto=format&fit=crop" alt="Yoga Retreat Banner" />
          </div>
      </div>

      {/* Our Story Section */}
      <div className="OurStorySection container">
          <div className="StoryImageWrapper">
              <div className="StoryImageInner">
                  <img src="https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=1000&auto=format&fit=crop" alt="Yoga Training" />
              </div>
              <div className="FloatingBox">
                  <h3>15+</h3>
                  <p>Years of <br/> Experience</p>
              </div>
          </div>
          <div className="StoryText">
              <span className="SubHeading">Our Story</span>
              <h2>We believe yoga is <br/> for everybody.</h2>
              <p>Yoga is a profound journey of the self, through the self, to the self. Founded on the timeless principles of balance, harmony, and connection, our studio is much more than just a place to practice yoga&mdash;it&apos;s a thriving community.</p>
              <p>Whether you are stepping onto the mat for the very first time or you are an experienced practitioner looking to deepen your practice, our expert instructors guide you through every pose with mindful attention and personal care. We ensure a safe, enriching, and deeply personal practice that nurtures both your physical strength and mental clarity.</p>
          </div>
      </div>

      {/* Why Choose Us / Values */}
      <div className="PremiumValuesWrapper">
        <div className="container PremiumValues">
            <div className="ValuesHeaderCentered">
                <span className="SubHeading">Our Core Values</span>
                <h2>The principles that <br/> guide our practice</h2>
            </div>
            <div className="ValuesGridPremium">
                <div className="PremiumValueCard">
                    <div className="IconWrap"><FaRegHeart /></div>
                    <h4>Inclusive & Empowering</h4>
                    <p>We celebrate diversity and actively cultivate an environment where everyone feels seen, supported, and confident in their own skin.</p>
                </div>
                <div className="PremiumValueCard">
                    <div className="IconWrap"><FaLeaf /></div>
                    <h4>Holistic Wellness</h4>
                    <p>Our focus extends beyond physical postures to include breathwork, meditation, and sustainable, long-term health benefits.</p>
                </div>
                <div className="PremiumValueCard">
                    <div className="IconWrap"><FaRegMoon /></div>
                    <h4>Continuous Growth</h4>
                    <p>We are deeply committed to continuously learning, growing, and refining our teachings to serve our community better every single day.</p>
                </div>
            </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="FaqSection container">
          <div className="FaqImageWrapper">
              <img src="https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?q=80&w=1000&auto=format&fit=crop" alt="Yoga Class FAQ" />
          </div>
          <div className="FaqContent">
              <span className="SubHeading">Any Questions?</span>
              <h2>Frequently asked <br/> questions</h2>
              
              <div className="FaqList">
                  {faqs.map((faq, index) => (
                      <div className={`FaqItem ${activeFaq === index ? 'active' : ''}`} key={index}>
                          <div className="FaqQuestion" onClick={() => toggleFaq(index)}>
                              <h4>{faq.question}</h4>
                              <div className="FaqIcon">
                                  {activeFaq === index ? <FaMinus /> : <FaPlus />}
                              </div>
                          </div>
                          <div className="FaqAnswer">
                              <div className="AnswerInner">
                                  <p>{faq.answer}</p>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

    </div>
  )
}

export default About;