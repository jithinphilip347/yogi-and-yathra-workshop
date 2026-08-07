"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { 
  MdArrowBack, MdStar, MdFullscreen, MdFullscreenExit, MdCheckCircle, 
  MdCancel, MdEvent, MdAccessTime, MdLiveTv, MdOutlineOndemandVideo 
} from 'react-icons/md';
import { FaChalkboardTeacher, FaRegCalendarAlt } from 'react-icons/fa';
import { FiUsers, FiAward, FiClock, FiPlayCircle, FiCheck, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { MEDIA_BASE_URL } from '@/utils/constants';
import courseApi from '@/libs/courseApi';
import apiClient from '@/services/apiClient';
import { fetchLiveSectionDetail } from '@/libs/course';
import DiscussionTab from '@/components/player/DiscussionTab';
import { CommunicationProvider } from '@/communication/CommunicationStore';

import '../../../../assets/css/live-stream.scss';
import '../../../../assets/css/learning-player.scss';

const LiveStreamPlayer = ({ liveSection: initialLiveSection }) => {
  const router = useRouter();
  const videoRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  // States
  const [liveSection, setLiveSection] = useState(initialLiveSection);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLaunchingZoom, setIsLaunchingZoom] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });

  const data = liveSection || {};
  const instructor = data.instructor || {};

  // 1. Fetch Fresh Live Section Data & Check Enrollment Status
  useEffect(() => {
    const fetchFreshData = async () => {
      if (!initialLiveSection?.id) {
        setLoading(false);
        return;
      }

      try {
        const freshRes = await fetchLiveSectionDetail(initialLiveSection.id);
        if (freshRes?.success && freshRes?.data) {
          setLiveSection(freshRes.data);
        }
      } catch (err) {
        console.error("Failed to fetch fresh live section details", err);
      }

      // Check if user is enrolled
      if (user?.id) {
        try {
          const enrollRes = await courseApi.userEnrollments(user.id, 'live_section');
          const list = enrollRes.data?.data || enrollRes.data || [];
          const enrolled = list.some(
            (e) => Number(e.enrollable_id) === Number(initialLiveSection.id) && e.status === 'active'
          );
          setIsEnrolled(enrolled || user.role === 'admin' || Number(initialLiveSection.instructor_id) === Number(user.id));
        } catch (err) {
          console.error("Failed to verify enrollment", err);
        }
      }
      setLoading(false);
    };

    fetchFreshData();
  }, [initialLiveSection?.id, user?.id]);

  // 2. Countdown Timer
  useEffect(() => {
    if (!data.class_date_time) return;

    const targetTime = new Date(data.class_date_time).getTime();

    const calcTimeLeft = () => {
      const distance = targetTime - Date.now();
      if (distance <= 0) return { days: "00", hours: "00", minutes: "00", seconds: "00" };
      return {
        days: String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, "0"),
        hours: String(Math.floor((distance / (1000 * 60 * 60)) % 24)).padStart(2, "0"),
        minutes: String(Math.floor((distance / (1000 * 60)) % 60)).padStart(2, "0"),
        seconds: String(Math.floor((distance / 1000) % 60)).padStart(2, "0"),
      };
    };

    const timer = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [data.class_date_time]);

  // 3. Fullscreen Controller
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (videoRef.current?.requestFullscreen) {
        videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // 4. Join Meeting Action & Attendance Logger
  const handleJoinClass = async () => {
    if (!user) {
      toast.error("Please login to join the live session");
      router.push('/login');
      return;
    }

    setIsLaunchingZoom(true);
    const toastId = toast.loading("Launching class portal & recording attendance...");

    try {
      // Record Attendance
      await apiClient.post("attendance", {
        entity_type: "live_section",
        entity_id: data.id,
        student_id: user.id,
        status: "present",
        attendance_date: new Date().toISOString().split("T")[0],
        notes: "Joined class from live stream player portal",
      });
      toast.success("Attendance marked successfully!", { id: toastId });

      // Determine meeting launch target
      const isHost = user.role === 'admin' || Number(data.instructor_id) === Number(user.id);
      const targetUrl = isHost && data.zoom_start_url ? data.zoom_start_url : data.zoom_meeting_url;

      if (targetUrl) {
        setTimeout(() => {
          window.open(targetUrl, "_blank", "noopener,noreferrer");
          setIsLaunchingZoom(false);
        }, 1000);
      } else {
        toast.error("Zoom link is not generated yet. Please contact the instructor.", { id: toastId });
        setIsLaunchingZoom(false);
      }
    } catch (err) {
      console.error("Attendance marking failed", err);
      // Fallback redirect even if attendance marking failed
      const isHost = user.role === 'admin' || Number(data.instructor_id) === Number(user.id);
      const targetUrl = isHost && data.zoom_start_url ? data.zoom_start_url : data.zoom_meeting_url;
      if (targetUrl) {
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Zoom meeting URL not available", { id: toastId });
      }
      setIsLaunchingZoom(false);
    }
  };

  // derived values
  const instructorName = instructor.name || "Instructor";
  const instructorAvatar = instructor.avatar
    ? instructor.avatar.includes("http") ? instructor.avatar : `${MEDIA_BASE_URL}${instructor.avatar}`
    : "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=150&h=150";

  const timezone = data.timezone || "IST";
  const humanDate = data.human_date || "";
  const timeDisplay = humanDate ? `${humanDate} at ${data.human_start_time || ""} (${timezone})` : "";

  // Render State check
  const isClassActive = data.can_join === true || data.status === 'live';
  const isCompleted = data.status === 'completed' || data.status === 'passed';
  const recordingAvailable = isCompleted && data.recording_available;
  const isFuture = !isClassActive && !isCompleted;

  if (loading) {
    return (
      <div id="LiveStreamFull" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, height: 50, border: "4px solid #eee", borderTopColor: "var(--primaryColor)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }}></div>
          <p style={{ color: "#666" }}>Loading live class portal...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Not Enrolled Paywall/Access Denied
  if (!isEnrolled) {
    return (
      <div id="LiveStreamFull" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: "550px", padding: "40px 20px", background: "#fdfdfd", border: "1px solid #eaeaea", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "52px", color: "#f59e0b", marginBottom: "20px" }}><MdCancel /></div>
          <h2>Live Stream Access Restricted</h2>
          <p style={{ color: "#666", marginTop: "15px", lineHeight: "1.6" }}>
            You are not currently enrolled in this live session. Access to this live class stream, Zoom meeting room, and classroom chat is restricted to enrolled students.
          </p>
          <div style={{ marginTop: "30px", display: "flex", gap: "15px", justifyContent: "center" }}>
            <button className="BackBtnOverlay" style={{ position: "static", borderRadius: "8px", width: "auto", height: "auto", padding: "12px 25px", fontSize: "15px" }} onClick={() => router.back()}>
              Go Back
            </button>
            <button 
              className="ActionBtn primary" 
              style={{ padding: "12px 25px", background: "var(--primaryColor)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}
              onClick={() => router.push(`/live-section/${data.id}/${data.slug}`)}
            >
              View Registration Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="LiveStreamFull">
      <div className="VideoSection" ref={videoRef}>
        <button className="BackBtnOverlay" onClick={() => router.back()}>
          <MdArrowBack />
        </button>

        <div className="VideoPlaceholder">
          {recordingAvailable ? (
            <video
              src={data.recording_url.includes("http") ? data.recording_url : `${MEDIA_BASE_URL}${data.recording_url}`}
              controls
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              poster={data.banner_image ? `${MEDIA_BASE_URL}${data.banner_image}` : undefined}
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              backgroundImage: data.banner_image ? `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url(${MEDIA_BASE_URL}${data.banner_image})` : "linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85))",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              color: "#fff",
              textAlign: "center",
              padding: "0 20px"
            }}>
              {isFuture && (
                <div style={{ maxWidth: "600px" }}>
                  <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", display: "inline-flex", padding: "8px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: "700", marginBottom: "20px", gap: "6px", alignItems: "center" }}>
                    <span style={{ width: "8px", height: "8px", background: "#f59e0b", borderRadius: "50%" }}></span> Upcoming Live Class
                  </div>
                  <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "15px" }}>{data.title}</h2>
                  <p style={{ color: "#ccc", fontSize: "15px", marginBottom: "30px" }}>{timeDisplay}</p>
                  
                  {/* Countdown Timer Block */}
                  <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
                    {['days', 'hours', 'minutes', 'seconds'].map((label) => (
                      <div key={label} style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", minWidth: "80px", padding: "15px 10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)" }}>
                        <span style={{ display: "block", fontSize: "24px", fontWeight: "800" }}>{timeLeft[label]}</span>
                        <span style={{ display: "block", fontSize: "11px", color: "#aaa", textTransform: "uppercase", marginTop: "4px" }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isClassActive && (
                <div style={{ maxWidth: "550px" }}>
                  <div style={{ background: "rgba(220,38,38,0.2)", backdropFilter: "blur(6px)", border: "1px solid rgba(220,38,38,0.4)", display: "inline-flex", padding: "8px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: "700", marginBottom: "20px", gap: "6px", alignItems: "center", color: "#f87171" }}>
                    <span style={{ width: "8px", height: "8px", background: "#dc2626", borderRadius: "50%", animation: "pulse 1.5s infinite" }}></span> Live Session Active
                  </div>
                  <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "15px" }}>{data.title}</h2>
                  <p style={{ color: "#ccc", fontSize: "15px", marginBottom: "30px" }}>The live Zoom session is currently active and ready for you to join!</p>
                  <button 
                    onClick={handleJoinClass}
                    disabled={isLaunchingZoom}
                    style={{
                      background: "var(--primaryColor)",
                      color: "#fff",
                      border: "none",
                      padding: "16px 40px",
                      borderRadius: "30px",
                      fontSize: "17px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "10px",
                      boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
                      transition: "all 0.2s"
                    }}
                  >
                    <MdLiveTv style={{ fontSize: "20px" }} /> {isLaunchingZoom ? "Launching Zoom Room..." : "Join Live Zoom Class"}
                  </button>
                </div>
              )}

              {isCompleted && !recordingAvailable && (
                <div style={{ maxWidth: "550px" }}>
                  <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", display: "inline-flex", padding: "8px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: "700", marginBottom: "20px", gap: "6px", alignItems: "center" }}>
                    Session Completed
                  </div>
                  <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "15px" }}>{data.title}</h2>
                  <p style={{ color: "#ccc", fontSize: "15px" }}>
                    This live session has completed. The recording is currently being processed and will be available to stream shortly.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <button className="FullscreenBtnOverlay" onClick={toggleFullscreen}>
          {isFullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
        </button>
      </div>

      <div className="StreamContainer">
        <div className="MainInfoRow">
          <div className="InfoLeft">
            <h1 className="StreamTitle">{data.title}</h1>
            <p className="StreamSubtitle">{data.category?.name || "Live Class"}</p>
          </div>

          <div className="InfoMiddle">
            <img src={instructorAvatar} alt={instructorName} className="InstructorAvatar" />
            <div className="InstructorDetails">
              <h3 className="Name">{instructorName}</h3>
              <div className="InstructorMeta">
                {instructor.average_rating > 0 && (
                  <span className="Rating"><MdStar className="StarIcon"/> {instructor.average_rating}</span>
                )}
                <span className="Students">{instructor.years_of_experience ? `${instructor.years_of_experience}+ Years Experience` : "Expert Instructor"}</span>
              </div>
            </div>
          </div>

          <div className="InfoRight">
            <div className="StatsGroup">
              <div className="StatItem">
                <span className="StatValue">{data.duration} mins</span>
                <span className="StatLabel">Duration</span>
              </div>
            </div>
            {isClassActive && (
              <div className="LiveNowBadge">
                <span className="LiveDot"></span> LIVE NOW
              </div>
            )}
          </div>
        </div>

        {/* Detailed Column and Q&A Board Sidebar */}
        <div className="StreamDetailsGrid">
          <div className="DetailsLeft">
            <section className="DetailSection">
              <h2 className="SectionTitle">About This Live Session</h2>
              <div className="SectionText" dangerouslySetInnerHTML={{ __html: data.description || "" }} />
              <div className="InfoPills">
                <span className="Pill"><MdLiveTv className="PillIcon" /> Live Session</span>
                {data.can_issue_certificate && <span className="Pill"><MdCheckCircle className="PillIcon" /> Certificate</span>}
                <span className="Pill"><MdEvent className="PillIcon" /> Live Q&A</span>
                {data.recording_available && <span className="Pill"><MdAccessTime className="PillIcon" /> Recording</span>}
                <span className="Pill"><FaChalkboardTeacher className="PillIcon" /> Expert Instructor</span>
              </div>
            </section>

            {/* Q&A Board integration */}
            <section className="DetailSection" style={{ borderTop: "1px solid #eaeaea", paddingTop: "40px", marginTop: "40px" }}>
              <h2 className="SectionTitle">Questions & Discussion</h2>
              <CommunicationProvider liveSectionId={data.id}>
                <DiscussionTab course={{ id: data.id }} entityType="live_section" />
              </CommunicationProvider>
            </section>
          </div>

          <div className="DetailsRight">
            {/* Sidebar info */}
            {data.what_youll_learn && data.what_youll_learn.length > 0 && (
              <section className="DetailSection" style={{ background: "#f9fafb", padding: "25px", borderRadius: "12px", border: "1px solid #eaeaea" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px", color: "#111" }}>What You&apos;ll Learn</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                  {data.what_youll_learn.map((item, idx) => (
                    <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13.5px", color: "#444" }}>
                      <MdCheckCircle style={{ color: "#10b981", fontSize: "16px", marginTop: "2px", flexShrink: 0 }} /> {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.what_to_bring && data.what_to_bring.length > 0 && (
              <section className="DetailSection" style={{ background: "#f9fafb", padding: "25px", borderRadius: "12px", border: "1px solid #eaeaea", marginTop: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px", color: "#111" }}>What to Bring</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                  {data.what_to_bring.map((item, idx) => (
                    <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13.5px", color: "#444" }}>
                      <MdCheckCircle style={{ color: "var(--primaryColor)", fontSize: "16px", marginTop: "2px", flexShrink: 0 }} /> {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      {isClassActive && (
        <div className="MobileLiveBar">
          <div className="MobileLiveBadge">
            <span className="LiveDot"></span> LIVE
          </div>
          <button 
            onClick={handleJoinClass}
            disabled={isLaunchingZoom}
            style={{
              background: "var(--primaryColor)",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
            }}
          >
            {isLaunchingZoom ? "Launching..." : "Join Class"}
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveStreamPlayer;
