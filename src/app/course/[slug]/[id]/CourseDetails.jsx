
"use client";
import React, { useState, useEffect } from 'react';
import { 
  FiPlayCircle, FiClock, FiGlobe, FiUsers, FiStar, FiChevronDown, 
  FiCheckCircle, FiChevronUp, FiShoppingCart 
} from 'react-icons/fi';
import { AiFillStar } from 'react-icons/ai';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Inst1 from '@/assets/images/instructor-1.jpg';
import ThumbNail from '@/assets/images/live1.jpg';


import ReviewPopup from '@/components/popup/ReviewPopup';
import VideoPreviewPopup from '@/components/popup/VideoPreviewPopup';
import ProductDetailPopup from '@/components/popup/ProductDetailPopup';
import { MEDIA_BASE_URL, PRODUCT_MEDIA_BASE_URL } from '@/utils/constants';
import useReview from '@/hooks/useReview';
import useFormatDate from '@/hooks/useFormatDate';

const CourseDetails = ({ courseDetails }) => {
  const course = courseDetails;
  const { getHowLongAgo } = useFormatDate();
  const { createCourseReview, getCourseReview } = useReview({ course_id: course?.id, perPage: 2 });
  const reviews = getCourseReview.data;
  useEffect(() => {

  }, [getCourseReview]);
  
  const [activeAccordion, setActiveAccordion] = useState(0);
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  // Review State
  const [rating, setRating] = useState(0);
  const [reviewContent, setReviewContent] = useState("");

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!reviewContent.trim()) {
      toast.error("Please write a review");
      return;
    }

    createCourseReview.mutate({
      course_id: course?.id,
      rating: rating,
      comment: reviewContent
    }, {
      onSuccess: () => {
        toast.success("Review submitted successfully");
        setRating(0);
        setReviewContent("");
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || "Failed to submit review");
      }
    });
  };

  const toggleCartItem = (id) => {
    setCartItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const products = course?.products || [];
  const modules = course?.sections || [];
  const instructor = course?.instructor;

  return (
    <div id='CourseDetails'>
      <section className='CourseBanner'>
        <div className='container'>
          <div className='HeroSection'>
            {course?.level && <span className='Badge' style={{textTransform: 'uppercase'}}>{course.level}</span>}
            {/* <span className='Badge'>Bestseller</span> */}
            <h1>{course?.title || "Course Title"}</h1>
            <p className='ShortDesc'>{course?.short_description || "Course Description"}</p>
            <div className='MetaInfo'>
              <div className='InstructorInfo'>
                {instructor?.avatar ? (
                    <Image src={`${MEDIA_BASE_URL}${instructor.avatar}`} alt="Instructor" width={40} height={40} style={{borderRadius: '50%'}} />
                ) : (
                    <Image src={Inst1} alt="Instructor" />
                )}
                <span>Created by <strong>{instructor?.name || "Instructor Name"}</strong></span>
              </div>
              <div className='Ratings'>
                <AiFillStar className='star' />
                <span>{course?.rating || "0"} ({course?.total_reviews || "0"} Reviews)</span>
                <span className='Students'><FiUsers /> {course?.enrollments_count || "0"} Students</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className='container'>
        <div className='CourseDetailsMain'>
          <div className='DetailsLeft'>
            {course?.learning_outcomes && Array.isArray(course.learning_outcomes) && (
              <div className='HighlightBox LearningBox'>
                <h3>What you&apos;ll learn</h3>
                <div className='GridItems'>
                  {course.learning_outcomes.map((item, idx) => (
                    <div key={idx} className='LearnItem'>
                      <FiCheckCircle /> <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

             <div className='HighlightBox DescriptionSection'>
              <h3>Description</h3>
              <div className='ContentText' dangerouslySetInnerHTML={{ __html: course?.description || "" }}>
              </div>
            </div>

            {/* REQUIREMENTS & PRODUCTS BOX */}
            <div className='HighlightBox RequirementsSection'>
              <h3>Course Requirements & Gear</h3>
              <p className='BoxSub'>To get the best results from this course, we recommend the following gear:</p>
              <ul className='ReqList'>
                {course?.requirements && Array.isArray(course.requirements) ? (
                  course.requirements.map((item, idx) => (
                    <li key={idx}><FiCheckCircle /> {item}</li>
                  ))
                ) : (
                  <li><FiCheckCircle /> No requirements mentioned.</li>
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

            <div className='HighlightBox CourseContent'>
              <h3>Course Content</h3>
              <div className='AccordionList'>
                {modules.map((mod, index) => (
                  <div key={index} className={`AccordionItem ${activeAccordion === index ? 'active' : ''}`}>
                    <div className='AccordionHeader' onClick={() => setActiveAccordion(index)}>
                      <span>{mod.title}</span>
                      <div className='RightHeader'>
                        <small>{mod.lessons?.length || 0} lessons</small>
                        <FiChevronDown />
                      </div>
                    </div>
                    {activeAccordion === index && (
                      <div className='AccordionBody'>
                        {mod.lessons?.map((lesson, lIdx) => (
                            <div className='LessonItem' key={lIdx}>
                                <div className='LessonLeft'><FiPlayCircle /> <span>{lesson.title}</span></div>
                                {lesson.is_preview && <span className='PreviewLink' onClick={() => setShowPreviewPopup(true)}>Preview</span>}
                            </div>
                        ))}
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
                {instructor?.avatar ? (
                    <Image src={`${MEDIA_BASE_URL}${instructor.avatar}`} alt="Instructor" width={100} height={100} style={{borderRadius: '50%'}} />
                ) : (
                    <Image src={Inst1} alt="Instructor" />
                )}
                <div className='InsMeta'>
                  <h4>{instructor?.name || "Instructor Name"}</h4>
                  <p style={{textTransform: 'capitalize'}}>{instructor?.role || "Instructor"}</p>
                  <div className='Stats'>
                    <span className='ratingStar'><FiStar /> 4.8 Instructor Ratings</span>
                    <span><FiUsers /> 1,234 Students</span>
                  </div>
                </div>
              </div>
              <div className='Bio ContentText' dangerouslySetInnerHTML={{ __html: instructor?.bio_graphy || "Instructor biography not available." }}></div>
              <a href="#" className='MoreLink'>More about instructor</a>
            </div>

            <div className='HighlightBox ReviewsSection'>
            <h3>Student Feedback</h3>
            <div className='ReviewList'>
              {reviews?.data?.map(rev => (
                <div key={rev.id} className='SingleReview'>
                  <div className='ReviewTop'>
                    <div className='UserInfo'>
                    <Image src={MEDIA_BASE_URL + rev.user.avatar} alt="User" className='UserImg' width={50} height={50} />
                      <div className='UserInfo'>
                      <h5>{rev.user.name} <span>{getHowLongAgo(rev.created_at)}</span></h5>
                    </div>
                    </div>
                       <div className='UserStars'>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <AiFillStar key={star} style={{ color: star <= rev.rating ? '#FFD700' : '#ccc' }} />
                        ))}
                        <span className='RatingNum'>{rev.rating}</span>
                      </div>
                  </div>
                  <p className='Comment'>{rev.comment}</p>
                </div>
              ))}
            </div>
            {reviews?.meta?.total > 2 && (
              <button className='ReadAllBtn' onClick={() => setShowReviewPopup(true)}>Read all reviews</button>
            )}
          </div>

            <div className='HighlightBox SubmitReview'>
            <h3>Write a Review</h3>
            <div className='ReviewForm'>
                  <div className='RateInput'> 
                <span>Rate this course</span>
                <div className='rateIconBox'>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      {star <= rating ? (
                        <AiFillStar style={{ color: '#FFD700', fontSize: '20px' }} />
                      ) : (
                        <FiStar style={{ fontSize: '20px' }} />
                      )}
                    </button>
                  ))}
                </div>
           
                </div>
              <textarea 
                placeholder="Share your experience with this course..."
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
              ></textarea>
              <div className='FormBottom'>
                  
                <button 
                  className='SubmitBtn' 
                  onClick={handleSubmitReview}
                  disabled={createCourseReview.isPending}
                >
                  {createCourseReview.isPending ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
          </div>

          <aside className='DetailsRight'>
            <div className='PreviewCard'>
              <div className='VideoThumb' onClick={() => setShowPreviewPopup(true)}>
                <Image src={course?.thumbnail ? `${MEDIA_BASE_URL}${course.thumbnail}` : ThumbNail} alt="Preview" width={400} height={225} />
                <button className='PlayBtn'><FiPlayCircle /></button>
                <span>Preview this course</span>
              </div>
              <div className='Pricing'>
                <div className='PriceRow'>
                  <h2>₹{course?.discount_price || course?.price || "0"}</h2> 
                  {course?.discount_price && <del>₹{course?.price}</del>}
                  {course?.discount_price && <span className='Off'>{Math.round(((course.price - course.discount_price) / course.price) * 100)}% OFF</span>}
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
              <Image src={course?.thumbnail ? `${MEDIA_BASE_URL}${course.thumbnail}` : ThumbNail} alt="course" width={50} height={50} />
              <div className='Text'>
                <h5>{course?.title || "Course Title"}</h5>
                <p>₹{course?.discount_price || course?.price || "0"} {course?.discount_price && <del>₹{course?.price}</del>}</p>
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

        {/* Drawer Logic */}
        <div className={`CartDrawerPopup ${showCartDrawer ? 'active' : ''}`}>
          <h4>Items in your cart</h4>
          <div className='DrawerItem'>
            <p>{course?.title || "Course"} (Course)</p>
            <span>₹{course?.discount_price || course?.price || "0"}</span>
          </div>
          {products.filter(p => cartItems.includes(p.value)).map((prod, idx) => (
            <div className='DrawerItem' key={idx}>
              <p>{prod.label}</p>
              <span>₹{prod.price}</span>
            </div>
          ))}
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
      {showReviewPopup && <ReviewPopup onClose={() => setShowReviewPopup(false)} course_id={course?.id} />}
      {showPreviewPopup && <VideoPreviewPopup onClose={() => setShowPreviewPopup(false)} />}
    </div>
  );
};


export default CourseDetails;