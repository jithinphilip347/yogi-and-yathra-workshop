"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  FaStar,
  FaUsers,
  FaBookOpen,
  FaMicrophone,
  FaTrophy,
  FaRegPlayCircle,
  FaRegClock,
  FaRupeeSign,
  FaInstagram,
  FaFacebook,
  FaLinkedin,
  FaCheckCircle,
  FaCalendarAlt,
  FaVideo,
  FaArrowRight,
  FaUserGraduate,
} from "react-icons/fa";
import { fetchInstructorDetails } from "@/libs/course";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import TeacherBox from "../../../components/teachersBox/TeacherBox";
import CourseCard from "../../../components/coursebox/CourseCard";

const Page = () => {
  const params = useParams();
  const slug = params?.slug;

  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;

    const loadInstructor = async () => {
      try {
        setLoading(true);
        const res = await fetchInstructorDetails(slug);
        const data = res?.data;

        if (!data) {
          setError("Instructor not found");
          return;
        }

        setTeacher(data);
      } catch (err) {
        console.error("Failed to load instructor:", err);
        setError("Failed to load instructor details");
      } finally {
        setLoading(false);
      }
    };

    loadInstructor();
  }, [slug]);

  // ─── Helpers ──────────────────────────────────────────────────────────

  const buildAvatarUrl = (url) => (url ? resolveMediaUrl(url) : null);

  const buildThumbnailUrl = (thumb) => (thumb ? resolveMediaUrl(thumb) : null);

  const formatDuration = (duration) => {
    if (!duration) return "0h";
    const parts = duration.split(":");
    if (parts.length === 3) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
    return duration;
  };

  const formatPrice = (price) => {
    if (!price || price <= 0) return "Free";
    return price.toLocaleString("en-IN");
  };

  // ─── Loading State ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div id="TeacherDetails">
        <div className="container">
          <div className="TeacherProfileWrapper">
            <div className="ProfileSidebar">
              <div className="skeleton skeleton-img" style={{ width: "100%", height: 300 }}></div>
              <div className="ProfileBasicInfo">
                <div className="skeleton skeleton-text" style={{ width: "70%", height: 28, marginBottom: 8 }}></div>
                <div className="skeleton skeleton-text" style={{ width: "50%", height: 18 }}></div>
              </div>
            </div>
            <div className="ProfileContent">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="ContentSection">
                    <div className="skeleton skeleton-text" style={{ width: "40%", height: 24, marginBottom: 16 }}></div>
                    <div className="skeleton skeleton-text" style={{ width: "100%", height: 14, marginBottom: 8 }}></div>
                    <div className="skeleton skeleton-text" style={{ width: "100%", height: 14, marginBottom: 8 }}></div>
                    <div className="skeleton skeleton-text" style={{ width: "60%", height: 14 }}></div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────────

  if (error || !teacher) {
    return (
      <div id="TeacherDetails">
        <div className="container">
          <div className="TeacherProfileWrapper" style={{ justifyContent: "center", textAlign: "center", padding: "60px 20px" }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", color: "#d9534f", marginBottom: 12 }}>
                {error || "Instructor not found"}
              </h2>
              <p style={{ color: "#666", marginBottom: 24 }}>
                The instructor you are looking for does not exist or may have been removed.
              </p>
              <Link href="/teacher-list" className="loadMoreBtn" style={{ display: "inline-block", padding: "12px 24px" }}>
                Back to Instructors
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Data Mapping ──────────────────────────────────────────────────────

  const avatarUrl = buildAvatarUrl(teacher.avatar_url);
  const expertise = Array.isArray(teacher.expertise) ? teacher.expertise : [];
  const courses = Array.isArray(teacher.taught_courses) ? teacher.taught_courses : [];
  const dailyClasses = Array.isArray(teacher.taught_daily_classes) ? teacher.taught_daily_classes : [];
  const liveSections = Array.isArray(teacher.taught_live_sections) ? teacher.taught_live_sections : [];
  const reviews = Array.isArray(teacher.reviews) ? teacher.reviews : [];

  const ratingBreakdownObj = teacher.rating_breakdown || {};
  const ratingBreakdown = [5, 4, 3, 2, 1].map((stars, idx) => {
    const count = Array.isArray(ratingBreakdownObj)
      ? (ratingBreakdownObj[idx] || 0)
      : (ratingBreakdownObj[stars] || ratingBreakdownObj[String(stars)] || 0);
    return { stars, count };
  });
  const totalReviewsInBreakdown = ratingBreakdown.reduce((acc, curr) => acc + curr.count, 0);

  const totalReviews = Number(teacher.review_count || teacher.total_reviews || totalReviewsInBreakdown || 0);
  const reviewsText = `(${totalReviews} ${totalReviews === 1 ? "Review" : "Reviews"})`;

  // Stats for the ProfileStatsRight section
  const stats = [
    { icon: <FaStar />, value: teacher.average_rating ? Number(teacher.average_rating).toFixed(1) : "0.0", label: "Rating" },
    { icon: <FaUserGraduate />, value: (teacher.total_students ?? teacher.students_count ?? 0).toLocaleString(), label: "Students" },
    { icon: <FaBookOpen />, value: (teacher.taught_courses_count ?? courses.length ?? 0).toString(), label: "Courses" },
    { icon: <FaRegClock />, value: (teacher.taught_daily_classes_count ?? dailyClasses.length ?? 0).toString(), label: "Daily Classes" },
    { icon: <FaMicrophone />, value: (teacher.taught_live_sections_count ?? liveSections.length ?? 0).toString(), label: "Live Sessions" },
    { icon: <FaTrophy />, value: teacher.years_of_experience ? `${teacher.years_of_experience}+ Years` : "Experienced", label: "Experience" },
  ];

  // Social links
  const socials = [];
  if (teacher.instagram) socials.push({ icon: <FaInstagram />, link: teacher.instagram.startsWith("http") ? teacher.instagram : `https://instagram.com/${teacher.instagram}` });
  if (teacher.facebook) socials.push({ icon: <FaFacebook />, link: teacher.facebook.startsWith("http") ? teacher.facebook : `https://facebook.com/${teacher.facebook}` });
  if (teacher.linkdin) socials.push({ icon: <FaLinkedin />, link: teacher.linkdin.startsWith("http") ? teacher.linkdin : `https://linkedin.com/in/${teacher.linkdin}` });

  const biography = teacher.full_biography || teacher.bio_graphy || "";

  return (
    <div id="TeacherDetails">
      <div className="container">
        <div className="TeacherProfileWrapper">
          {/* LEFT SIDEBAR */}
          <div className="ProfileSidebar">
            <div className="ProfileImageWrapper">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={teacher.name} fill style={{ objectFit: "cover" }} />
              ) : (
                <div className="ProfileImagePlaceholder" style={{ width: "100%", height: "100%", background: "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", color: "#999" }}>
                  {teacher.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <div className="ImageOverlay"></div>
            </div>

            <div className="ProfileBasicInfo">
              <h1>{teacher.name}</h1>
              <p className="Role">{teacher.professional_title || "Instructor"}</p>

              <div className="HeaderTrustBadge">
                <div className="Stars">
                  <FaStar className="star-icon" />
                  <span>{teacher.average_rating || "0"}</span>
                </div>
                <div className="ReviewCount">{reviewsText}</div>
              </div>
              {teacher.is_featured && <div className="FeaturedBadge">Featured Instructor</div>}

              {socials.length > 0 && (
                <div className="SocialLinks">
                  {socials.map((social, index) => (
                    <a key={index} href={social.link} target="_blank" rel="noopener noreferrer" className="social-icon">
                      {social.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="ProfileContent">

            {/* ABOUT SECTION */}
            <div className="ContentSection AboutSection">
              <h2>About me</h2>
              <p className="BioText">{biography || "No biography available."}</p>

              <div className="ProfileStatsRight">
                {stats.map((stat, index) => (
                  <div className="StatBox" key={index}>
                    <div className="StatIcon">{stat.icon}</div>
                    <div className="StatInfo">
                      <h4>{stat.value}</h4>
                      <p>{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {expertise.length > 0 && (
                <div className="ExpertiseArea">
                  <h4>Areas of Expertise</h4>
                  <ul className="ExpertiseList">
                    {expertise.map((item, index) => (
                      <li key={index}><FaCheckCircle className="check-icon" /> {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Languages - preserved for layout, hidden when no data */}
              <div className="LanguagesArea" style={!teacher.languages || teacher.languages.length === 0 ? { display: 'none' } : {}}>
                <h4>Languages</h4>
                <div className="LangList">
                  {(teacher.languages || []).length > 0 ? (
                    teacher.languages.map((lang, index) => (
                      <span key={index} className="LangBadge">{lang}</span>
                    ))
                  ) : (
                    <span className="LangBadge" style={{ opacity: 0.5 }}>Not specified</span>
                  )}
                </div>
              </div>
            </div>

            {/* PUBLISHED COURSES - Always render the section per original design */}
            <div className="ContentSection CoursesSection">
              <div className="SectionHeader">
                <h2>{courses.length} Published Courses</h2>
                <Link href="/course" className="ViewAllLink">View All <FaArrowRight /></Link>
              </div>

              {courses.length > 0 ? (
                <div className="TeacherCoursesGrid">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      id={course.id}
                      slug={course.slug || "course"}
                      image={buildThumbnailUrl(course.thumbnail) || null}
                      title={course.title}
                      lessons={course.lessons_count?.toString() || "0"}
                      duration={formatDuration(course.duration)}
                      price={formatPrice(course.price)}
                      oldPrice={course.discount_price > 0 ? formatPrice(course.discount_price) : null}
                      rating={course.rating?.toString() || "0"}
                      students={course.enrollments_count?.toString() || "0"}
                      lessonsLabel="Lessons"
                      buttonText="View Course"
                      lessonsIcon={<FaRegPlayCircle />}
                      clockIcon={<FaRegClock />}
                      priceIcon={<FaRupeeSign />}
                      ratingIcon={<FaStar />}
                      userIcon={<FaUsers />}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: "center", color: "#999", padding: "20px 0" }}>
                  No published courses yet.
                </p>
              )}
            </div>

            {/* UPCOMING DAILY LIVE CLASSES */}
            {dailyClasses.length > 0 && (
              <div className="ContentSection LiveClassesSection">
                <h2>Upcoming Daily Live Classes</h2>
                <div className="DailyClassesGrid">
                  {dailyClasses.map((cls) => (
                    <div className="DailyClassCard" key={cls.id}>
                      <div className="ClassInfo">
                        <h4>{cls.title}</h4>
                        <div className="ClassMeta">
                          {cls.schedule && Array.isArray(cls.schedule) && (
                            <span><FaCalendarAlt /> {cls.schedule.slice(0, 2).join(" • ")}</span>
                          )}
                          <span><FaRegClock /> {cls.human_class_time || cls.class_time || "TBD"}</span>
                          <span><FaVideo /> {cls.duration || "N/A"}</span>
                          <span><FaUserGraduate /> {cls.enrollments_count ?? 0}</span>
                        </div>
                      </div>
                      <Link href={`/daily-class/${cls.id}/${cls.slug || 'class'}`} className="EnrollBtn" style={{ display: 'inline-block', textAlign: 'center' }}>
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* UPCOMING LIVE SESSIONS / WORKSHOPS */}
            {liveSections.length > 0 && (
              <div className="ContentSection WorkshopsSection">
                <h2>Upcoming Live Sessions</h2>
                <div className="WorkshopsGrid">
                  {liveSections.map((ws) => {
                    const dateParts = ws.human_date ? ws.human_date.split(" ") : [];
                    return (
                      <div className="WorkshopCard" key={ws.id}>
                        {dateParts.length >= 2 && (
                          <div className="WsDate">
                            <span className="WsDay">{dateParts[0]}</span>
                            <span className="WsMonth">{dateParts[1]}</span>
                          </div>
                        )}
                        <div className="WsInfo">
                          <h4>{ws.title}</h4>
                          <div className="WsMeta">
                            <span><FaRegClock /> {ws.human_start_time || "TBD"}</span>
                            <span><FaVideo /> {ws.duration ? `${ws.duration} min` : "N/A"}</span>
                          </div>
                          {ws.capacity > 0 && (
                            <div className="SeatsLeft">{ws.capacity} Seats</div>
                          )}
                        </div>
                        <Link href={`/live-section/${ws.id}/${ws.slug || 'session'}`} className="PreBookBtn" style={{ display: 'inline-block', textAlign: 'center' }}>
                          Pre Book
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STUDENT REVIEWS */}
            <div className="ContentSection ReviewsSection">
              <div className="ReviewsTop">
                <div className="OverallRating">
                  <h2>{teacher.average_rating || "0"}</h2>
                  <div className="Stars">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className={i < Math.floor(teacher.average_rating || 0) ? "star-active" : ""} />
                    ))}
                  </div>
                  <p>{totalReviews} {totalReviews === 1 ? "Review" : "Reviews"}</p>
                </div>

                <div className="RatingBreakdown">
                  {ratingBreakdown.map((breakdown) => (
                    <div className="BreakdownRow" key={breakdown.stars}>
                      <div className="StarLabel">{breakdown.stars} <FaStar className="star-icon" /></div>
                      <div className="ProgressBar">
                        <div
                          className="ProgressFill"
                          style={{
                            width: totalReviewsInBreakdown > 0
                              ? `${(breakdown.count / totalReviewsInBreakdown) * 100}%`
                              : "0%",
                          }}
                        ></div>
                      </div>
                      <div className="CountLabel">{breakdown.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {reviews.length > 0 && (
                <div className="ReviewsList">
                  <h3 className="LatestReviewsTitle">Latest Reviews</h3>
                  {reviews.map((review) => (
                    <div className="ReviewCard" key={review.id}>
                      <div className="ReviewHeader">
                        <div className="ReviewUser">
                          {review.user_image ? (
                            <Image
                              src={buildAvatarUrl(review.user_image)}
                              alt={review.user_name}
                              width={50}
                              height={50}
                              className="UserAvat"
                              style={{ borderRadius: "50%", objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              className="UserAvat"
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: "50%",
                                background: "#e0e0e0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.2rem",
                                color: "#999",
                              }}
                            >
                              {review.user_name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                          )}
                          <div className="UserInfo">
                            <h4>{review.user_name}</h4>
                            {review.created_at && (
                              <span>{new Date(review.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                            )}
                          </div>
                        </div>
                        <div className="ReviewStars">
                          {[...Array(review.rating)].map((_, i) => (
                            <FaStar key={i} className="star-active" />
                          ))}
                        </div>
                      </div>
                      <p className="ReviewText">&quot;{review.comment}&quot;</p>
                    </div>
                  ))}
                </div>
              )}

              {reviews.length === 0 && (
                <div className="ReviewsList">
                  <p style={{ textAlign: "center", color: "#999", padding: "20px 0" }}>
                    No reviews yet.
                  </p>
                </div>
              )}
            </div>

            {/* TEACHING PHILOSOPHY - preserved for layout */}
            {biography && (
              <div className="ContentSection PhilosophySection">
                <div className="TeachingPhilosophy">
                  <h4>Teaching Philosophy</h4>
                  <blockquote>&quot;{biography.split('. ').slice(0, 2).join('. ')}.&quot;</blockquote>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* RELATED TEACHERS - preserved for layout, shown when data available */}
        {teacher.related_instructors && teacher.related_instructors.length > 0 && (
          <div className="RelatedTeachersFullWidth">
            <h2>Meet More Instructors</h2>
            <div className="RelatedTeachersGrid">
              {teacher.related_instructors.map((rel) => (
                <TeacherBox
                  key={rel.id}
                  image={buildAvatarUrl(rel.avatar_url)}
                  name={rel.name}
                  position={rel.professional_title || (Array.isArray(rel.expertise) ? rel.expertise[0] : 'Instructor')}
                  twitter={rel.linkdin ? "#" : undefined}
                  instagram={rel.instagram ? "#" : undefined}
                  profileLink={`/teacher-list/${rel.slug || rel.id}`}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Page;
