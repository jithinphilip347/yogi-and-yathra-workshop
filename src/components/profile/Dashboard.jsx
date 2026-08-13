"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiBookOpen, FiClock, FiUsers, FiCalendar, FiPlayCircle, FiMoreVertical, FiZap, FiAward } from "react-icons/fi";
import { MdMoreVert, MdEvent, MdAccessTime, MdLiveTv } from "react-icons/md";
import { FaChalkboardTeacher } from "react-icons/fa";
import { AiFillStar } from "react-icons/ai";
import courseApi from "@/libs/courseApi";
import useWishlist from "@/hooks/useWishlist";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import CourseCard from "@/components/coursebox/CourseCard";

const Dashboard = ({
  courses = [],
  continueCourses = [],
  liveClasses = [],
  liveSessions = [],
  user,
}) => {
  const { findWishlistIcon } = useWishlist();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    courseApi.getStudentAnalytics()
      .then((res) => {
        setAnalytics(res.data?.data || res.data);
      })
      .catch(() => {});
  }, []);

  const activeDailyClass = liveClasses && liveClasses.length > 0 ? liveClasses[0] : null;
  const activeLiveSession = liveSessions && liveSessions.length > 0 ? liveSessions[0] : null;

  return (
    <div className="DashBoard" style={{ width: '100%' }}>
      {/* Learning Intelligence KPI Summary Cards */}
      {analytics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          width: '100%',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(135, 68, 41, 0.1)',
              color: 'var(--primaryColor, #874429)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              <FiClock />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                {analytics.total_watch_hours || 0} hrs
              </span>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                Total Watch Time
              </span>
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(234, 179, 8, 0.1)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              <FiZap />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                {analytics.learning_streak_days || 0} Days
              </span>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                Learning Streak
              </span>
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              <FiAward />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                {analytics.completed_lessons || 0}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                Lessons Finished
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Continue Learning */}
      <div className="ContinueWatchBox">
        <div className="DashBoardHead">
          <h2>Continue Learning</h2>
          <p>Pick up right where you left off.</p>
        </div>
        <div className="ContinueGrid">
          {continueCourses.length === 0 ? (
            <div className="EmptyState" style={{ padding: "20px", textAlign: "center", color: "#aaa", gridColumn: "1 / -1" }}>
              <p>No active courses to continue.</p>
            </div>
          ) : (
            continueCourses.map((item, index) => (
              <div className="ContinueCard" key={index} style={{ width: "100%", maxWidth: "550px" }}>
                <div className="Thumb">
                  <Image
                    src={item.image ? resolveMediaUrl(item.image) : null}
                    alt={item.title || "Course"}
                    width={200}
                    height={120}
                  />
                </div>
                <div className="Details">
                  <h4>{item.title}</h4>

                  <div className="ProgressContainer">
                    <div className="Bar">
                      <div
                        className="Fill"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                    <p>{item.progress}% Complete</p>
                  </div>

                  <div className="CardFooter">
                    <div className="Instructor">
                      {item.instructorImg && (
                        <Image
                          src={resolveMediaUrl(item.instructorImg)}
                          alt={item.instructorName || "Instructor"}
                          width={30}
                          height={30}
                        />
                      )}
                      <span>{item.instructorName}</span>
                    </div>
                    <Link href={item.current_lesson_id ? `/course/${item.slug}/learn/${item.current_lesson_id}` : `/course/${item.slug || ""}`}>
                      <button className="ContinueBtn">Continue</button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Today's Daily Live Class */}
      <div className="UpcomingDailyClassBox">
        <div className="DashBoardHead">
          <h2>Today&apos;s Daily Live Class</h2>
          <p>Your daily routine awaits. Join today&apos;s session.</p>
        </div>
        
        <div className="LiveClasses">
          <div className="ClassList">
            {activeDailyClass ? (
              <div className="ProgramCard active">
                <div className="ActiveBadge">ACTIVE</div>
                <div className="MoreOptions">
                  <button className="MoreBtn"><FiMoreVertical /></button>
                </div>

                <div className="CardLeft">
                  <div className="Header">
                    <div className="Thumb">
                      <Image
                        src={activeDailyClass.instructorImg ? resolveMediaUrl(activeDailyClass.instructorImg) : LiveThumb1}
                        alt={activeDailyClass.title}
                        width={100}
                        height={70}
                        className="Img"
                      />
                      <span className="Category">{activeDailyClass.category}</span>
                    </div>
                    <div className="TitleInfo">
                      <h3>{activeDailyClass.title}</h3>
                      <p className="Instructor">Instructor: <span>{activeDailyClass.instructor}</span></p>
                    </div>
                  </div>

                  <div className="ScheduleMeta">
                    <div className="MetaItem">
                      <FiCalendar className="Icon" />
                      <span>{activeDailyClass.dateRange}</span>
                    </div>
                    <div className="MetaItem">
                      <FiClock className="Icon" />
                      <span>{activeDailyClass.time}</span>
                    </div>
                  </div>

                  <div className="WeeklyChips">
                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day, idx) => (
                      <span key={idx} className={`Chip ${activeDailyClass.days?.includes(day) || ['Tu', 'We'].includes(day) ? "Active" : ""}`}>
                        {day}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="CardRight">
                  <div className="ProgressHero">
                    <div className="ProgressHeader">
                      <span className="Label">PROGRESS</span>
                      <span className="Value">Day {activeDailyClass.progress?.currentDay || 1} / {activeDailyClass.progress?.totalDays || 10}</span>
                    </div>
                    <div className="ProgressBar">
                      <div className="Fill" style={{ width: `${activeDailyClass.progress?.percentage || 0}%` }}></div>
                    </div>
                  </div>

                  <div className="TodayStatusBox">
                    <div className="StatusHeader">
                      <span className="Title">Today&apos;s Class</span>
                    </div>
                    <div className="StatusMessage">{activeDailyClass.todayStatus?.message || "Starts Soon"}</div>
                    <div className="HelperText">{activeDailyClass.todayStatus?.helper || "Join opens 15 mins before"}</div>
                  </div>

                  <Link href={activeDailyClass.meeting_link || "/live-stream"} passHref>
                    <button className="ActionBtn primary">
                      <FiPlayCircle className="BtnIcon" /> Join Today&apos;s Class
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="EmptyState" style={{ padding: "30px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "12px" }}>
                <p style={{ color: "#aaa" }}>No live classes scheduled for today.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Live Session */}
      <div className="UpcomingSessionBox">
        <div className="DashBoardHead">
          <h2>Upcoming Live Session</h2>
          <p>Don&apos;t miss out on your booked special events.</p>
        </div>
        
        <div className="LiveYoga">
          <div className="SessionsList">
            {activeLiveSession ? (
              <div className="SessionCard">
                <div className="ThumbnailWrapper">
                  <Image
                    src={activeLiveSession.image ? resolveMediaUrl(activeLiveSession.image) : LiveImg1}
                    alt={activeLiveSession.title}
                    width={150}
                    height={150}
                    className="Thumbnail"
                  />
                </div>

                <div className="SessionDetails">
                  <div className="CardHeader">
                    <div className="TitleArea">
                      <span className="StatusBadge status-upcoming">
                        {activeLiveSession.countdown || "Upcoming"}
                      </span>
                      <h3 className="Title">{activeLiveSession.title}</h3>
                    </div>
                    
                    <div className="MoreMenuWrapper">
                      <MdMoreVert className="MoreIcon" />
                    </div>
                  </div>

                  <div className="InfoGrid">
                    <span className="InfoItem">
                      <MdEvent className="Icon" /> {activeLiveSession.date}
                    </span>
                    <span className="InfoItem">
                      <MdAccessTime className="Icon" /> {activeLiveSession.time}
                    </span>
                    <span className="InfoItem">
                      <FaChalkboardTeacher className="Icon" /> {activeLiveSession.instructor}
                    </span>
                  </div>

                  <div className="CardFooter">
                    <div className="FooterLeft">
                      <div className="BookingId">ID: #{activeLiveSession.id}</div>
                    </div>
                    <div className="FooterRight">
                      <Link href={`/live-stream/${activeLiveSession.id}/${activeLiveSession.slug || 'live-session'}`} passHref>
                        <button className="ActionBtn primary live-btn">
                          <MdLiveTv style={{ marginRight: '6px' }} /> Join Live
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="EmptyState" style={{ padding: "30px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "12px" }}>
                <p style={{ color: "#aaa" }}>No upcoming live sessions booked.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Purchased Courses */}
      <div className="EnrolldCourseBox">
        <div className="DashBoardHead">
          <h2>Purchased Courses</h2>
          <p>Access your complete library of courses.</p>
        </div>
        {courses.length === 0 ? (
          <div className="EmptyState" style={{ padding: "30px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "12px" }}>
            <p style={{ color: "#aaa", marginBottom: "15px" }}>You haven&apos;t purchased any courses yet.</p>
            <Link href="/course">
              <button className="ExploreBtn" style={{ padding: "8px 20px", background: "var(--primary-color, #ff6b6b)", color: "#fff", borderRadius: "6px", border: "none", cursor: "pointer" }}>Explore Courses</button>
            </Link>
          </div>
        ) : (
          <div className="CourseGrid">
            {courses.filter(Boolean).map((course, i) => (
              <div className="CourseItem" key={course?.id || i}>
                <CourseCard
                  image={course?.staticImage || (course?.thumbnail ? resolveMediaUrl(course.thumbnail) : null)}
                  title={course?.title}
                  lessons={course?.lessons_count}
                  duration={(course?.duration || 0) + " hrs"}
                  price={Number(course?.price || 0)}
                  oldPrice={Number(course?.discount_price || 0)}
                  rating="4.5" 
                  students={course?.enrollments_count}
                  instructorName={course?.instructor?.name}
                  wishlistIcon={findWishlistIcon(course?.id, "course")}
                  lessonsIcon={<FiBookOpen />}
                  clockIcon={<FiClock />}
                  priceIcon="₹"
                  oldPriceIcon="₹"
                  lessonsLabel="Lessons"
                  ratingIcon={<AiFillStar />}
                  userIcon={<FiUsers />}
                  buttonText="Continue Learning"
                  instructorImg={course?.instructor?.avatar_url || course?.instructor?.avatar ? resolveMediaUrl(course.instructor.avatar_url || course.instructor.avatar) : null}
                  instructorLabel={course?.instructor?.role}
                  id={course?.id}
                  type="course"
                  slug={course?.slug}
                />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
