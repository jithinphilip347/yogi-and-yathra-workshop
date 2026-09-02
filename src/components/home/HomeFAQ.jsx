"use client";
import React, { useState } from "react";
import "@/assets/css/HomeFAQ.css";
import FAQImage from "../../assets/images/courseImg-7.webp";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { faqApi } from "@/services/faqApi";

// High-quality fallback FAQs in case the API has no featured FAQs or is unreachable
export const FALLBACK_FAQS = [
  {
    id: "fallback-1",
    question: "How do I join the daily live yoga sessions?",
    answer: "Once you purchase a membership, you will receive a daily link via email and on your dashboard. Simply click the link 5 minutes before the session starts to join our live interactive classes."
  },
  {
    id: "fallback-2",
    question: "Do I need any prior experience to join?",
    answer: "Not at all! We offer classes for all levels, from complete beginners to advanced practitioners. Our instructors provide modifications for various poses to ensure everyone can practice safely."
  },
  {
    id: "fallback-3",
    question: "What happens if I miss a live session?",
    answer: "Don't worry! All our daily live sessions are recorded and uploaded to your dashboard. You can access the recordings anytime and catch up on your practice at your convenience."
  },
  {
    id: "fallback-4",
    question: "How does the course purchasing work?",
    answer: "You can purchase individual specialized yoga courses or subscribe to a monthly/yearly membership for unlimited access to all live sessions. Secure payment options are available directly through our platform."
  }
];

const formatAnswer = (answer) => {
  if (!answer) return "";
  const trimmed = String(answer).trim();
  if (!/^<[a-z][\s\S]*>/i.test(trimmed)) {
    return `<p>${trimmed}</p>`;
  }
  return trimmed;
};

const HomeFAQ = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Fetch only featured FAQs with TanStack Query caching
  const { data: featuredFaqs } = useQuery({
    queryKey: ["faqs", "featured"],
    queryFn: async () => {
      const res = await faqApi.getFeaturedFaqs();
      const list = res.data?.data || res.data;
      return Array.isArray(list) ? list : [];
    },
    staleTime: 1000 * 60 * 10, // Cache remains fresh for 10 minutes
    gcTime: 1000 * 60 * 30,    // Keep unused cache data for 30 minutes
    retry: 1,
  });

  // Use real featured FAQs if available; otherwise use fallback
  const faqs = (featuredFaqs && featuredFaqs.length > 0) ? featuredFaqs : FALLBACK_FAQS;

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div id="HomeFAQ">
      <div className="container">
        <div className="HomeFAQMain">
          <div className="FAQHead">
            <div className="HeadLeft">
              <span className="badge">FAQ</span>
              <h2>
                Find Answers to Your <span>Frequently Asked Questions</span>
              </h2>
            </div>
          </div>

          <div className="FAQBody">
            <div className="FAQBodyLeft">
              <div className="imageWrapper">
                <Image src={FAQImage} alt="FAQ Illustration" />
              </div>
            </div>

            <div className="FAQBodyRight">
              <div className="RightHead">
                <span className="badge">Yoga Classes & Courses</span>
                <h3>Got Questions About Our Yoga Programs?</h3>
                <p>
                  Here are some common questions from our community regarding daily live sessions, course purchases, and class schedules.
                </p>
              </div>

              <div className="FAQAccordion">
                {faqs.map((item, index) => (
                  <div
                    className={`FAQItem ${activeIndex === index ? "active" : ""}`}
                    key={item.id || item.slug || index}
                  >
                    <div className="FAQQuestion" onClick={() => toggleFAQ(index)}>
                      <h4>{item.question}</h4>
                      <span className="icon">
                        {activeIndex === index ? (
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        ) : (
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        )}
                      </span>
                    </div>
                    <div className="FAQAnswer">
                      <div
                        className="AnswerContent"
                        dangerouslySetInnerHTML={{ __html: formatAnswer(item.answer) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeFAQ;