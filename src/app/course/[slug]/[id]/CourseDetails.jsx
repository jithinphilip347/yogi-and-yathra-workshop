"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useCart } from "@/features/commerce/hooks/useCommerceHooks";
import { useCourseAccess } from "@/hooks/useCourseAccess";
import {
  FiPlayCircle,
  FiClock,
  FiGlobe,
  FiUsers,
  FiStar,
  FiChevronDown,
  FiCheckCircle,
  FiChevronUp,
  FiShoppingCart,
} from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import Image from "next/image";
import Link from "next/link";
import Inst1 from "@/assets/images/instructor-1.webp";
import ThumbNail from "@/assets/images/live1.webp";

import ReviewPopup from "@/components/popup/ReviewPopup";
import VideoPreviewPopup from "@/components/popup/VideoPreviewPopup";
import ProductDetailPopup from "@/components/popup/ProductDetailPopup";
import { useCourseReviews, formatReviewDate } from "@/components/reviews/useCourseReviews";
import { reviewApi } from "@/services/reviewApi";
import { resolveMediaUrl, resolveProductMediaUrl } from "@/utils/mediaUrl";

const CourseDetails = ({ courseDetails }) => {
  const course = courseDetails;

  useEffect(() => {
    console.log(course);
  }, [course]);

  // Purchase/access-aware CTA state (see useCourseAccess for the state machine).
  const { ctaState, watchPath } = useCourseAccess(course);

  const [activeAccordion, setActiveAccordion] = useState(0);
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isEditingReview, setIsEditingReview] = useState(false);
  const router = useRouter();
  const { items: cartItems, addItem, buyNow, removeItem, isInCart } = useCart();

  // Live review list + rating summary, fetched client-side from the same
  // backend contract the Course Player uses. This prevents the page from
  // showing a stale, server-cached review list ("No reviews yet") after a
  // review has been submitted or moderated.
  const [reviews, setReviews] = useState(() =>
    Array.isArray(course?.reviews) ? course.reviews : []
  );
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [summary, setSummary] = useState({
    average_rating: course?.average_rating ?? course?.rating ?? 0,
    total_reviews: course?.review_count ?? course?.total_reviews ?? 0,
  });

  const loadReviews = useCallback(async () => {
    if (!course?.id) return;
    try {
      setReviewsLoading(true);
      const res = await reviewApi.getReviews({
        target_type: "course",
        target_id: course.id,
        // The "Read all reviews" popup relies on this list, so fetch a
        // generous limit rather than the player's 5-review preview.
        per_page: 100,
      });
      setReviews(res.data?.data || []);
    } catch {
      // Keep the current list on failure — never break the page.
    } finally {
      setReviewsLoading(false);
    }
  }, [course?.id]);

  const loadSummary = useCallback(async () => {
    if (!course?.id) return;
    try {
      const res = await reviewApi.getSummary("course", course.id);
      const data = res.data?.data ?? {};
      setSummary({
        average_rating: data.average_rating ?? 0,
        total_reviews: data.total_reviews ?? 0,
      });
    } catch {
      // Ignore — the header keeps the server-provided values.
    }
  }, [course?.id]);

  useEffect(() => {
    loadReviews();
    loadSummary();
  }, [loadReviews, loadSummary]);

  const {
    eligibility: reviewEligibility,
    loading: reviewLoading,
    submitting: isSubmittingReview,
    submitReview,
    updateReview,
    removeReview,
  } = useCourseReviews(course?.id);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    const result = isEditingReview
      ? await updateReview(reviewEligibility.review.id, {
          rating: reviewRating,
          content: reviewComment,
        })
      : await submitReview({ rating: reviewRating, content: reviewComment });
    if (result) {
      setIsEditingReview(false);
      setReviewComment("");
      setReviewRating(5);
      // Reviews are published instantly — refresh the public list & summary.
      loadReviews();
      loadSummary();
    }
  };

  const startEditReview = () => {
    setIsEditingReview(true);
    setReviewRating(reviewEligibility?.review?.rating ?? 5);
    setReviewComment(reviewEligibility?.review?.content ?? "");
  };

  const handleDeleteReview = async () => {
    if (!reviewEligibility?.review?.id) return;
    if (!window.confirm("Delete your review? This cannot be undone.")) return;
    const deleted = await removeReview(reviewEligibility.review.id);
    if (deleted) {
      loadReviews();
      loadSummary();
    }
  };

  const toggleCartItem = (value) => {
    // Resolve the full product (from the list, or the popup's selected product)
    // so both the popup and the inline buttons normalize identically.
    const prod =
      products.find((p) => String(p.value) === String(value)) || selectedProduct;
    const key = prod?.value ?? value;
    if (isInCart(key, 'Product')) {
      removeItem('Product', key);
    } else if (prod) {
      addItem(prod, 'Product');
    }
  };

  const products = course?.products || [];
  const modules = course?.sections || [];
  const instructor = course?.instructor;

  const instructorName = instructor?.name || "Instructor";
  const instructorRole = instructor?.professional_title || instructor?.role || "Instructor";
  const instructorAvatar = instructor?.avatar_url || instructor?.avatar
    ? resolveMediaUrl(instructor.avatar_url || instructor.avatar)
    : null;

  const instructorRatingVal = Number(
    instructor?.instructor_rating ?? instructor?.average_rating ?? 0
  );
  const instructorRatingText = instructorRatingVal > 0
    ? `${instructorRatingVal.toFixed(1)} Instructor Ratings`
    : "5.0 Instructor Ratings";

  const instructorStudents = Number(
    instructor?.total_students ?? instructor?.students_count ?? 0
  );
  const instructorStudentsText = `${instructorStudents.toLocaleString()} ${
    instructorStudents === 1 ? "Student" : "Students"
  }`;

  const instructorBio =
    instructor?.bio_graphy ||
    instructor?.short_bio ||
    instructor?.full_biography ||
    "";

  const instructorSlug = instructor?.slug || instructor?.id || "";

  // Centralized CTA renderer — the only place purchase/access conditions live.
  // - loading:        skeleton so enrolled students never see a purchase flash
  // - watch-now / continue-watching / watch-again: single learning CTA
  // - otherwise:      existing Add to Cart / Buy Now purchase flow
  const renderCourseCta = () => {
    if (ctaState === "loading") {
      return (
        <>
          <Skeleton height={52} borderRadius={8} />
          <Skeleton height={52} borderRadius={8} />
        </>
      );
    }

    if (
      ctaState === "watch-now" ||
      ctaState === "continue-watching" ||
      ctaState === "watch-again"
    ) {
      const label =
        ctaState === "continue-watching"
          ? "Continue Watching"
          : ctaState === "watch-again"
            ? "Watch Again"
            : "Watch Now";
      return (
        <button
          className="AddToCart"
          onClick={() => watchPath && router.push(watchPath)}
        >
          {label}
        </button>
      );
    }

    // Default: existing purchase CTA.
    return (
      <>
        {isInCart(course?.id, "Course") ? (
          <button className="AddToCart added" onClick={() => router.push("/cart")}>
            Go to Cart
          </button>
        ) : (
          <button className="AddToCart" onClick={() => addItem(course, "Course")}>
            Add to Cart
          </button>
        )}
        <button className="BuyNow" onClick={() => buyNow(course, "Course", router)}>
          Buy Now
        </button>
      </>
    );
  };

  return (
    <div id="CourseDetails">
      <section className="CourseBanner">
        <div className="container">
          <div className="HeroSection">
            {/* MOBILE ONLY: Video Preview */}
            <div className="MobilePreviewCard">
              <div
                className="VideoThumb"
                onClick={() => setShowPreviewPopup(true)}
              >
                <Image
                  src={
                    course?.thumbnail
                      ? resolveMediaUrl(course.thumbnail)
                      : ThumbNail
                  }
                  alt="Preview"
                  width={400}
                  height={225}
                />
                <button className="PlayBtn">
                  <FiPlayCircle />
                </button>
                <span>Preview this course</span>
              </div>
            </div>

            {course?.level && (
              <span className="Badge" style={{ textTransform: "uppercase" }}>
                {course.level}
              </span>
            )}
            {/* <span className='Badge'>Bestseller</span> */}
            <h1>{course?.title || "Course Title"}</h1>
            <p className="ShortDesc">
              {course?.short_description || "Course Description"}
            </p>
            <div className="MetaInfo">
              <div className="InstructorInfo">
                {instructorAvatar ? (
                  <Image
                    src={instructorAvatar}
                    alt={instructorName}
                    width={40}
                    height={40}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <Image src={Inst1} alt={instructorName} width={40} height={40} style={{ borderRadius: "50%" }} />
                )}
                <span>
                  Created by{" "}
                  <strong>{instructorName}</strong>
                </span>
              </div>
              <div className="Ratings">
                <AiFillStar className="star" />
                <span>
                  {summary.average_rating} ({summary.total_reviews} Reviews)
                </span>
                <span className="Students">
                  <FiUsers /> {course?.enrollments_count || "0"} Students
                </span>
              </div>
            </div>

            {/* MOBILE ONLY: Purchasing Box */}
            <div className="MobilePricingBox">
              <div className="Pricing">
                <div className="PriceRow">
                  <h2>₹{course?.discount_price || course?.price || "0"}</h2>
                  {course?.discount_price && <del>₹{course?.price}</del>}
                  {course?.discount_price && (
                    <span className="Off">
                      {Math.round(
                        ((course.price - course.discount_price) /
                          course.price) *
                          100,
                      )}
                      % OFF
                    </span>
                  )}
                </div>
              </div>
              <div className="ActionBtns">{renderCourseCta()}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="CourseDetailsMain">
          <div className="DetailsLeft">
            {course?.learning_outcomes &&
              Array.isArray(course.learning_outcomes) && (
                <div className="HighlightBox LearningBox">
                  <h3>What you&apos;ll learn</h3>
                  <div className="GridItems">
                    {course.learning_outcomes.map((item, idx) => (
                      <div key={idx} className="LearnItem">
                        <FiCheckCircle /> <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="HighlightBox DescriptionSection">
              <h3>Description</h3>
              <div
                className="ContentText"
                dangerouslySetInnerHTML={{ __html: course?.description || "" }}
              ></div>
            </div>

            {/* REQUIREMENTS & PRODUCTS BOX */}
            <div className="HighlightBox RequirementsSection">
              <h3>Course Requirements & Gear</h3>
              <p className="BoxSub">
                To get the best results from this course, we recommend the
                following gear:
              </p>
              <ul className="ReqList">
                {course?.requirements && Array.isArray(course.requirements) ? (
                  course.requirements.map((item, idx) => (
                    <li key={idx}>
                      <FiCheckCircle /> {item}
                    </li>
                  ))
                ) : (
                  <li>
                    <FiCheckCircle /> No requirements mentioned.
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
                            ? resolveProductMediaUrl(prod.image)
                            : ThumbNail
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
                        className={`AddToCartBtn ${isInCart(prod.value, 'Product') ? "added" : ""}`}
                        onClick={() =>
                          isInCart(prod.value, 'Product')
                            ? removeItem('Product', prod.value)
                            : addItem(prod, 'Product')
                        }
                      >
                        {isInCart(prod.value, 'Product')
                          ? "Remove from Cart"
                          : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="HighlightBox CourseContent">
              <h3>Course Content</h3>
              <div className="AccordionList">
                {modules.map((mod, index) => (
                  <div
                    key={index}
                    className={`AccordionItem ${activeAccordion === index ? "active" : ""}`}
                  >
                    <div
                      className="AccordionHeader"
                      onClick={() => setActiveAccordion(index)}
                    >
                      <span>{mod.title}</span>
                      <div className="RightHeader">
                        <small>{mod.lessons?.length || 0} lessons</small>
                        <FiChevronDown />
                      </div>
                    </div>
                    {activeAccordion === index && (
                      <div className="AccordionBody">
                        {mod.lessons?.map((lesson, lIdx) => (
                          <div className="LessonItem" key={lIdx}>
                            <div className="LessonLeft">
                              <FiPlayCircle /> <span>{lesson.title}</span>
                            </div>
                            {lesson.is_preview && (
                              <span
                                className="PreviewLink"
                                onClick={() => setShowPreviewPopup(true)}
                              >
                                Preview
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* INSTRUCTOR */}
            <div className="HighlightBox InstructorDetails">
              <h3>Instructor</h3>
              <div className="InstructorCard">
                {instructorAvatar ? (
                  <Image
                    src={instructorAvatar}
                    alt={instructorName}
                    width={100}
                    height={100}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <Image src={Inst1} alt={instructorName} width={100} height={100} style={{ borderRadius: "50%" }} />
                )}
                <div className="InsMeta">
                  <h4>{instructorName}</h4>
                  <p style={{ textTransform: "capitalize" }}>
                    {instructorRole}
                  </p>
                  <div className="Stats">
                    <span className="ratingStar">
                      <FiStar /> {instructorRatingText}
                    </span>
                    <span>
                      <FiUsers /> {instructorStudentsText}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="Bio ContentText"
                dangerouslySetInnerHTML={{
                  __html:
                    instructorBio ||
                    "Instructor biography not available.",
                }}
              ></div>
              <Link
                href={instructorSlug ? `/teacher-list/${instructorSlug}` : "#"}
                className="MoreLink"
              >
                More about instructor
              </Link>
            </div>

            <div className="HighlightBox ReviewsSection">
              <h3>Student Feedback</h3>
              <div className="ReviewList">
                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <div key={rev.id} className="SingleReview">
                      <div className="ReviewTop">
                        <div className="UserInfo">
                          {rev.user_image ? (
                            <img
                              src={resolveMediaUrl(rev.user_image)}
                              alt={rev.user_name || "Reviewer"}
                              className="UserImg"
                            />
                          ) : (
                            <div className="UserImg UserImgFallback">
                              {(rev.user_name || "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="UserInfo">
                            <h5>
                              {rev.user_name || "Anonymous"}{" "}
                              <span>{formatReviewDate(rev.created_at)}</span>
                            </h5>
                          </div>
                        </div>
                        <div className="UserStars">
                          {[1, 2, 3, 4, 5].map((s) =>
                            s <= rev.rating ? (
                              <AiFillStar key={s} />
                            ) : (
                              <FiStar key={s} style={{ opacity: 0.35 }} />
                            )
                          )}
                          <span className="RatingNum">{rev.rating}.0</span>
                        </div>
                      </div>
                      <p className="Comment">{rev.content}</p>
                    </div>
                  ))
                ) : reviewsLoading ? (
                  <p className="NoReviewsText">Loading reviews…</p>
                ) : (
                  <p className="NoReviewsText">
                    No reviews yet. Be the first to review this course.
                  </p>
                )}
              </div>
              <button
                className="ReadAllBtn"
                onClick={() => setShowReviewPopup(true)}
              >
                Read all reviews
              </button>
            </div>

            <div className="HighlightBox SubmitReview">
              {reviewLoading ? (
                <>
                  <h3>Write a Review</h3>
                  <p className="ReviewHint">Loading your review status…</p>
                </>
              ) : !reviewEligibility ? (
                <>
                  <h3>Write a Review</h3>
                  <p className="ReviewHint">
                    Please refresh the page and try again later.
                  </p>
                </>
              ) : reviewEligibility.reason === "auth_required" ? (
                <>
                  <h3>Write a Review</h3>
                  <p className="ReviewHint">
                    <a href="/auth/login" className="ReviewLoginLink">
                      Log in
                    </a>{" "}
                    to review this course.
                  </p>
                </>
              ) : reviewEligibility.reason === "purchase_required" ? (
                <>
                  <h3>Write a Review</h3>
                  <p className="ReviewHint">
                    Purchase this course to share your review.
                  </p>
                </>
              ) : reviewEligibility.has_review && !isEditingReview ? (
                <>
                  <h3>Your Review</h3>
                  <div className="ReviewForm">
                    <div className="RateInput">
                      <span>Your rating</span>
                      <div className="rateIconBox">
                        {[1, 2, 3, 4, 5].map((s) =>
                          s <= (reviewEligibility.review?.rating || 0) ? (
                            <AiFillStar key={s} />
                          ) : (
                            <FiStar key={s} style={{ opacity: 0.35 }} />
                          )
                        )}
                      </div>
                    </div>
                    <p className="MyReviewText">
                      {reviewEligibility.review?.content}
                    </p>
                    <div className="FormBottom">
                      <button
                        className="CancelBtn"
                        onClick={handleDeleteReview}
                        type="button"
                      >
                        Delete
                      </button>
                      <button
                        className="SubmitBtn"
                        onClick={startEditReview}
                        type="button"
                      >
                        Edit Review
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3>
                    {isEditingReview ? "Edit Your Review" : "Write a Review"}
                  </h3>
                  <form
                    className="ReviewForm"
                    onSubmit={handleSubmitReview}
                  >
                    <div className="RateInput">
                      <span>Rate this course</span>
                      <div className="rateIconBox">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className="ReviewStarBtn"
                            onClick={() => setReviewRating(star)}
                          >
                            {star <= reviewRating ? (
                              <AiFillStar />
                            ) : (
                              <FiStar />
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this course..."
                      required
                    ></textarea>
                    <div className="FormBottom">
                      <button
                        className="SubmitBtn"
                        type="submit"
                        disabled={isSubmittingReview}
                      >
                        {isSubmittingReview
                          ? "Submitting..."
                          : isEditingReview
                            ? "Update Review"
                            : "Submit Review"}
                      </button>
                      {isEditingReview && (
                        <button
                          type="button"
                          className="CancelBtn"
                          onClick={() => setIsEditingReview(false)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>

          <aside className="DetailsRight">
            <div className="PreviewCard">
              <div
                className="VideoThumb"
                onClick={() => setShowPreviewPopup(true)}
              >
                <Image
                  src={
                    course?.thumbnail
                      ? resolveMediaUrl(course.thumbnail)
                      : ThumbNail
                  }
                  alt="Preview"
                  width={400}
                  height={225}
                />
                <button className="PlayBtn">
                  <FiPlayCircle />
                </button>
                <span>Preview this course</span>
              </div>
              <div className="Pricing">
                <div className="PriceRow">
                  <h2>₹{course?.discount_price || course?.price || "0"}</h2>
                  {course?.discount_price && <del>₹{course?.price}</del>}
                  {course?.discount_price && (
                    <span className="Off">
                      {Math.round(
                        ((course.price - course.discount_price) /
                          course.price) *
                          100,
                      )}
                      % OFF
                    </span>
                  )}
                </div>
              </div>
              <div className="ActionBtns">{renderCourseCta()}</div>
            </div>
          </aside>
        </div>
      </div>

      {/* FIXED BOTTOM ACTION BAR */}
      <div className="FixedBottomCart">
        <div className="container">
          <div className="BottomFlex">
            <div className="CourseBrief">
              <Image
                src={
                  course?.thumbnail
                    ? resolveMediaUrl(course.thumbnail)
                    : ThumbNail
                }
                alt="course"
                width={50}
                height={50}
              />
              <div className="Text">
                <h5>{course?.title || "Course Title"}</h5>
                <p>
                  ₹{course?.discount_price || course?.price || "0"}{" "}
                  {course?.discount_price && <del>₹{course?.price}</del>}
                </p>
              </div>
            </div>
            <div className="CartActions">
              <div
                className="DrawerTrigger"
                onClick={() => setShowCartDrawer(!showCartDrawer)}
              >
                <FiChevronUp className={showCartDrawer ? "rotate" : ""} />
              </div>
              <button className="GoToCartBtn" onClick={() => router.push('/cart')}>
                Go To Cart <FiShoppingCart />
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Logic */}
        <div className={`CartDrawerPopup ${showCartDrawer ? "active" : ""}`}>
          <h4>Items in your cart</h4>
          {cartItems.length === 0 ? (
            <div className="DrawerItem">
              <p>Your cart is empty</p>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div className="DrawerItem" key={idx}>
                <p>{item.title}</p>
                <span>₹{item.price}</span>
              </div>
            ))
          )}
        </div>
      </div>
      {selectedProduct && (
        <ProductDetailPopup
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onToggleCart={toggleCartItem}
          isAdded={isInCart(selectedProduct.value, 'Product')}
        />
      )}
      {showReviewPopup && (
        <ReviewPopup
          reviews={reviews}
          onClose={() => setShowReviewPopup(false)}
        />
      )}
      {showPreviewPopup && (
        <VideoPreviewPopup onClose={() => setShowPreviewPopup(false)} />
      )}
    </div>
  );
};

export default CourseDetails;
