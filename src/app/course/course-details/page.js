// "use client";
// import React, { useState } from 'react';
// import { FiPlayCircle, FiClock, FiGlobe, FiUsers, FiStar, FiChevronDown, FiCheckCircle } from 'react-icons/fi';
// import { AiFillStar } from 'react-icons/ai';
// import Image from 'next/image';
// import Inst1 from '../../../assets/images/instructor-1.jpg';
// import ReviewPopup from '@/components/popup/ReviewPopup';
// import VideoPreviewPopup from '@/components/popup/VideoPreviewPopup';

// const Page = () => {
//   const [activeAccordion, setActiveAccordion] = useState(0);
//   const [showReviewPopup, setShowReviewPopup] = useState(false);
//   const [showPreviewPopup, setShowPreviewPopup] = useState(false);

//   const modules = [
//     { title: "Introduction to the Course", duration: "1h 20m", lessons: 5 },
//     { title: "Foundation and Core Concepts", duration: "4h 45m", lessons: 12 },
//     { title: "Advanced Techniques & Practical Implementation", duration: "6h 10m", lessons: 15 },
//   ];

//   return (
//     <div id='CourseDetails'>
//       <section className='CourseBanner'>
//         <div className='container'>
//           <div className='HeroSection'>
//             <span className='Badge'>Bestseller</span>
//             <h1>The Complete Professional Mastery Bootcamp 2026</h1>
//             <p className='ShortDesc'>Master the art of professional development with hands-on projects, industry insights, and expert mentorship.</p>
//             <div className='MetaInfo'>
//               <div className='InstructorInfo'>
//                 <Image src={Inst1} alt="Instructor" />
//                 <span>Created by <strong>Dr. Angela Yu</strong></span>
//               </div>
//               <div className='Ratings'>
//                 <AiFillStar className='star' />
//                 <span>4.9 (12,450 Reviews)</span>
//                 <span className='Students'><FiUsers /> 1.5M Students</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       <div className='container'>
//         <div className='CourseDetailsMain'>
//           <div className='DetailsLeft'>
//             {/* WHAT YOU'LL LEARN */}
//             <div className='HighlightBox LearningBox'>
//               <h3>What you&apos;ll learn</h3>
//               <div className='GridItems'>
//                 {[1, 2, 3, 4].map(item => (
//                   <div key={item} className='LearnItem'>
//                     <FiCheckCircle /> <span>Build professional projects from scratch for your portfolio.</span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* DESCRIPTION SECTION (New) */}
//             <div className='HighlightBox DescriptionSection'>
//               <h3>Description</h3>
//               <div className='ContentText'>
//                 <p>Welcome to the most comprehensive professional mastery bootcamp available online. This course is designed to take you from a complete beginner to an advanced professional through practical, project-based learning.</p>
//                 <p>Throughout this journey, you will explore core concepts, industry best practices, and advanced implementation strategies. Whether you are looking to switch careers or level up your existing skills, this bootcamp provides everything you need.</p>
//                 <h4>Who this course is for:</h4>
//                 <ul>
//                   <li>Beginners who want to start a professional career.</li>
//                   <li>Experienced professionals looking to master new technologies.</li>
//                   <li>Self-taught developers needing a structured curriculum.</li>
//                 </ul>
//               </div>
//             </div>

//             {/* COURSE CONTENT */}
//             <div className='HighlightBox CourseContent'>
//               <h3>Course Content</h3>
//               <div className='AccordionList'>
//                 {modules.map((mod, index) => (
//                   <div key={index} className={`AccordionItem ${activeAccordion === index ? 'active' : ''}`}>
//                     <div className='AccordionHeader' onClick={() => setActiveAccordion(index)}>
//                       <span>{mod.title}</span>
//                       <div className='RightHeader'>
//                         <small>{mod.lessons} lessons • {mod.duration}</small>
//                         <FiChevronDown />
//                       </div>
//                     </div>
//                     {activeAccordion === index && (
//                       <div className='AccordionBody'>
//                         <div className='LessonItem'>
//                           <div className='LessonLeft'><FiPlayCircle /> <span>Introduction Video</span></div>
//                           <span className='PreviewLink' onClick={() => setShowPreviewPopup(true)}>Preview</span>
//                         </div>
//                         <div className='LessonItem'>
//                           <div className='LessonLeft'><FiPlayCircle /> <span>Core Fundamental Setup</span></div>
//                           <span className='Time'>10:25</span>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* INSTRUCTOR */}
//             <div className='HighlightBox InstructorDetails'>
//               <h3>Instructor</h3>
//               <div className='InstructorCard'>
//                 <Image src={Inst1} alt="Instructor" />
//                 <div className='InsMeta'>
//                   <h4>Dr. Angela Yu</h4>
//                   <p>Developer and Lead Instructor at App Brewery</p>
//                   <div className='Stats'>
//                     <span><FiStar /> 4.8 Instructor Rating</span>
//                     <span><FiUsers /> 2,345,123 Students</span>
//                   </div>
//                 </div>
//               </div>
//               <p className='Bio'>I&apos;m Angela, I&apos;m a developer with a passion for teaching...</p>
//               <a href="#" className='MoreLink'>More about instructor</a>
//             </div>

//             <div className='HighlightBox ReviewsSection'>
//             <h3>Student Feedback</h3>
//             <div className='ReviewList'>
//               {[1, 2].map(rev => (
//                 <div key={rev} className='SingleReview'>
//                   <div className='ReviewTop'>
//                     <div className='UserInfo'>
//                     <Image src={Inst1} alt="User" className='UserImg' />
//                       <div className='UserInfo'>
//                       <h5>Emma Crieght <span>4 months ago</span></h5>
//                     </div>
//                     </div>
//                        <div className='UserStars'>
//                         <AiFillStar /><AiFillStar /><AiFillStar /><AiFillStar /><AiFillStar /> 
//                         <span className='RatingNum'>5.0</span>
//                       </div>
//                   </div>
//                   <p className='Comment'>Effortless booking, unbeatable affordability! Small yet comfortable rooms in the heart of Sheffield&apos;s nightlife. Peaceful gem!</p>
//                 </div>
//               ))}
//             </div>
//             <button className='ReadAllBtn' onClick={() => setShowReviewPopup(true)}>Read all reviews</button>
//           </div>

//           <div className='HighlightBox SubmitReview'>
//             <h3>Write a Review</h3>
//             <div className='ReviewForm'>
//                   <div className='RateInput'> 
//                 <span>Rate this course</span>
//                 <div className='rateIconBox'>
//                   <FiStar />
//                 <FiStar />
//                 <FiStar />
//                 <FiStar />
//                 <FiStar />
//                 </div>
           
//                 </div>
//               <textarea placeholder="Share your experience with this course..."></textarea>
//               <div className='FormBottom'>
                  
//                 <button className='SubmitBtn'>Submit Review</button>
//               </div>
//             </div>
//           </div>

//           </div>

//           <aside className='DetailsRight'>
//             <div className='PreviewCard'>
//               <div className='VideoThumb' onClick={() => setShowPreviewPopup(true)}>
//                 <Image src={Inst1} alt="Preview" />
//                 <button className='PlayBtn'><FiPlayCircle /></button>
//                 <span>Preview this course</span>
//               </div>
//               <div className='Pricing'>
//                 <div className='PriceRow'>
//                   <h2>₹499</h2> <del>₹3,499</del> <span className='Off'>85% OFF</span>
//                 </div>
//                 <p className='TimeLeft'><b>2 days</b> left at this price!</p>
//               </div>
//               <div className='ActionBtns'>
//                 <button className='AddToCart'>Add to Cart</button>
//                 <button className='BuyNow'>Buy Now</button>
//               </div>
//               <div className='Includes'>
//                 <p>This course includes:</p>
//                 <ul>
//                   <li><FiClock /> 54 hours on-demand video</li>
//                   <li><FiGlobe /> English, Arabic [Auto]</li>
//                   <li><FiPlayCircle /> Full lifetime access</li>
//                 </ul>
//               </div>
//             </div>
//           </aside>
//         </div>
//       </div>

   

//       {showReviewPopup && <ReviewPopup onClose={() => setShowReviewPopup(false)} />}
//       {showPreviewPopup && <VideoPreviewPopup onClose={() => setShowPreviewPopup(false)} />}
//     </div>
//   );
// };

// export default Page;



"use client";
import React, { useState } from 'react';
import { 
  FiPlayCircle, FiClock, FiGlobe, FiUsers, FiStar, FiChevronDown, 
  FiCheckCircle, FiChevronUp, FiShoppingCart 
} from 'react-icons/fi';
import { AiFillStar } from 'react-icons/ai';
import Image from 'next/image';
import Inst1 from '../../../assets/images/instructor-1.jpg';
import ThumbNail from '../../../assets/images/live1.jpg';


import ReviewPopup from '@/components/popup/ReviewPopup';
import VideoPreviewPopup from '@/components/popup/VideoPreviewPopup';
import ProductDetailPopup from '@/components/popup/ProductDetailPopup'; // Path based on your folder

const Page = () => {
  const [activeAccordion, setActiveAccordion] = useState(0);
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  const toggleCartItem = (id) => {
    setCartItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const products = [
    { id: 'prod1', title: 'Professional Yoga Mat', description: 'High-quality non-slip yoga mat.', price: 899, image: ThumbNail },
    { id: 'prod2', title: 'Foam Yoga Blocks', description: 'Supports better alignment and balance.', price: 450, image: ThumbNail }
  ];

  const modules = [
    { title: "Introduction to the Course", duration: "1h 20m", lessons: 5 },
    { title: "Foundation and Core Concepts", duration: "4h 45m", lessons: 12 },
    { title: "Advanced Techniques & Practical Implementation", duration: "6h 10m", lessons: 15 },
  ];

  return (
    <div id='CourseDetails'>
      <section className='CourseBanner'>
        <div className='container'>
          <div className='HeroSection'>
            <span className='Badge'>Bestseller</span>
            <h1>The Complete Professional Mastery Bootcamp 2026</h1>
            <p className='ShortDesc'>Master the art of professional development with hands-on projects, industry insights, and expert mentorship.</p>
            <div className='MetaInfo'>
              <div className='InstructorInfo'>
                <Image src={Inst1} alt="Instructor" />
                <span>Created by <strong>Dr. Angela Yu</strong></span>
              </div>
              <div className='Ratings'>
                <AiFillStar className='star' />
                <span>4.9 (12,450 Reviews)</span>
                <span className='Students'><FiUsers /> 1.5M Students</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className='container'>
        <div className='CourseDetailsMain'>
          <div className='DetailsLeft'>
            <div className='HighlightBox LearningBox'>
              <h3>What you&apos;ll learn</h3>
              <div className='GridItems'>
                {[1, 2, 3, 4].map(item => (
                  <div key={item} className='LearnItem'>
                    <FiCheckCircle /> <span>Build professional projects from scratch for your portfolio.</span>
                  </div>
                ))}
              </div>
            </div>

             <div className='HighlightBox DescriptionSection'>
              <h3>Description</h3>
              <div className='ContentText'>
                <p>Welcome to the most comprehensive professional mastery bootcamp available online. This course is designed to take you from a complete beginner to an advanced professional through practical, project-based learning.</p>
                <p>Throughout this journey, you will explore core concepts, industry best practices, and advanced implementation strategies. Whether you are looking to switch careers or level up your existing skills, this bootcamp provides everything you need.</p>
                <h4>Who this course is for:</h4>
                <ul>
                  <li>Beginners who want to start a professional career.</li>
                  <li>Experienced professionals looking to master new technologies.</li>
                  <li>Self-taught developers needing a structured curriculum.</li>
                </ul>
              </div>
            </div>

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

            <div className='HighlightBox CourseContent'>
              <h3>Course Content</h3>
              <div className='AccordionList'>
                {modules.map((mod, index) => (
                  <div key={index} className={`AccordionItem ${activeAccordion === index ? 'active' : ''}`}>
                    <div className='AccordionHeader' onClick={() => setActiveAccordion(index)}>
                      <span>{mod.title}</span>
                      <div className='RightHeader'>
                        <small>{mod.lessons} lessons • {mod.duration}</small>
                        <FiChevronDown />
                      </div>
                    </div>
                    {activeAccordion === index && (
                      <div className='AccordionBody'>
                        <div className='LessonItem'>
                          <div className='LessonLeft'><FiPlayCircle /> <span>Introduction Video</span></div>
                          <span className='PreviewLink' onClick={() => setShowPreviewPopup(true)}>Preview</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
                        {/* INSTRUCTOR */}
            <div className='HighlightBox InstructorDetails'>
              <h3>Instructor</h3>
              <div className='InstructorCard'>
                <Image src={Inst1} alt="Instructor" />
                <div className='InsMeta'>
                  <h4>Dr. Angela Yu</h4>
                  <p>Developer and Lead Instructor at App Brewery</p>
                  <div className='Stats'>
                    <span className='ratingStar'><FiStar /> 4.8 Instructor Ratings</span>
                    <span><FiUsers /> 2,345,123 Students</span>
                  </div>
                </div>
              </div>
              <p className='Bio'>I&apos;m Angela, I&apos;m a developer with a passion for teaching...</p>
              <a href="#" className='MoreLink'>More about instructor</a>
            </div>

            <div className='HighlightBox ReviewsSection'>
            <h3>Student Feedback</h3>
            <div className='ReviewList'>
              {[1, 2].map(rev => (
                <div key={rev} className='SingleReview'>
                  <div className='ReviewTop'>
                    <div className='UserInfo'>
                    <Image src={Inst1} alt="User" className='UserImg' />
                      <div className='UserInfo'>
                      <h5>Emma Crieght <span>4 months ago</span></h5>
                    </div>
                    </div>
                       <div className='UserStars'>
                        <AiFillStar /><AiFillStar /><AiFillStar /><AiFillStar /><AiFillStar /> 
                        <span className='RatingNum'>5.0</span>
                      </div>
                  </div>
                  <p className='Comment'>Effortless booking, unbeatable affordability! Small yet comfortable rooms in the heart of Sheffield&apos;s nightlife. Peaceful gem!</p>
                </div>
              ))}
            </div>
            <button className='ReadAllBtn' onClick={() => setShowReviewPopup(true)}>Read all reviews</button>
          </div>

          <div className='HighlightBox SubmitReview'>
            <h3>Write a Review</h3>
            <div className='ReviewForm'>
                  <div className='RateInput'> 
                <span>Rate this course</span>
                <div className='rateIconBox'>
                  <FiStar />
                <FiStar />
                <FiStar />
                <FiStar />
                <FiStar />
                </div>
           
                </div>
              <textarea placeholder="Share your experience with this course..."></textarea>
              <div className='FormBottom'>
                  
                <button className='SubmitBtn'>Submit Review</button>
              </div>
            </div>
          </div>
          </div>

          <aside className='DetailsRight'>
            <div className='PreviewCard'>
              <div className='VideoThumb' onClick={() => setShowPreviewPopup(true)}>
                <Image src={ThumbNail} alt="Preview" />
                <button className='PlayBtn'><FiPlayCircle /></button>
                <span>Preview this course</span>
              </div>
              <div className='Pricing'>
                <div className='PriceRow'>
                  <h2>₹499</h2> <del>₹3,499</del> <span className='Off'>85% OFF</span>
                </div>
              </div>
              <div className='ActionBtns'>
                <button className='AddToCart'>Add to Cart</button>
                <button className='BuyNow'>Buy Now</button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* FIXED BOTTOM ACTION BAR */}
   <div className='FixedBottomCart'>
        <div className='container'>
          <div className='BottomFlex'>
            <div className='CourseBrief'>
              <Image src={ThumbNail} alt="course" width={50} height={50} />
              <div className='Text'>
                <h5>The Complete Professional Mastery Bootcamp 2026</h5>
                <p>₹499 <del>₹3,499</del></p>
              </div>
            </div>
            <div className='CartActions'>
              <div className='DrawerTrigger' onClick={() => setShowCartDrawer(!showCartDrawer)}>
                <FiChevronUp className={showCartDrawer ? 'rotate' : ''} />
              </div>
              <button className='GoToCartBtn'>Go To Cart <FiShoppingCart /></button>
            </div>
          </div>
        </div>

        {/* Drawer Logic Fixed (Removed undefined quantities) */}
        <div className={`CartDrawerPopup ${showCartDrawer ? 'active' : ''}`}>
          <h4>Items in your cart</h4>
          <div className='DrawerItem'>
            <p>Mastery Bootcamp 2026 (Course)</p>
            <span>₹499</span>
          </div>
          {cartItems.includes('prod1') && (
            <div className='DrawerItem'>
              <p>Professional Yoga Mat</p>
              <span>₹899</span>
            </div>
          )}
          {cartItems.includes('prod2') && (
            <div className='DrawerItem'>
              <p>Foam Yoga Blocks</p>
              <span>₹450</span>
            </div>
          )}
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
      {showReviewPopup && <ReviewPopup onClose={() => setShowReviewPopup(false)} />}
      {showPreviewPopup && <VideoPreviewPopup onClose={() => setShowPreviewPopup(false)} />}
    </div>
  );
};

export default Page;