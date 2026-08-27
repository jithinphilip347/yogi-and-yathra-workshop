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
import { resolveMediaUrl } from '@/utils/mediaUrl';
import courseApi from '@/libs/courseApi';
import { fetchLiveSectionDetail } from '@/libs/course';
import DiscussionTab from '@/components/player/DiscussionTab';
import { CommunicationProvider } from '@/communication/CommunicationStore';
import useZoomMeeting from '@/hooks/useZoomMeeting';

import '../../../../assets/css/live-stream.scss';
import '../../../../assets/css/learning-player.scss';

const LiveStreamPlayer = ({ liveSection: initialLiveSection }) => {
  const router = useRouter();
  const videoRef = useRef(null);       // VideoSection — used for pre-join fullscreen
  const { user } = useSelector((state) => state.auth);

  // States
  const [liveSection, setLiveSection] = useState(initialLiveSection);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });

  const data = liveSection || {};
  const instructor = data.instructor || {};

  // ─── Shared Zoom meeting integration ────────────────────────────────
  const {
    meetingRef,
    iframeRef,
    isJoined,
    isIframeLoaded,
    isLaunchingZoom,
    isFullscreen,
    sdkParams,
    isEnrolled,
    lastError,
    handleJoinMeeting,
    retryWithFreshConfig,
    toggleMeetingFullscreen,
    togglePreviewFullscreen,
  } = useZoomMeeting({
    entityId: data.id,
    entityType: "live_section",
    entity: data,
    instructorId: data.instructor_id,
    signatureEndpoint: `live-sections/${data.id}/zoom-signature`,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Fetch Fresh Live Section Data
  // ─────────────────────────────────────────────────────────────────────────────
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
      setLoading(false);
    };

    fetchFreshData();
  }, [initialLiveSection?.id]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Countdown Timer
  // ─────────────────────────────────────────────────────────────────────────────
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

  // ─── Derived values ──────────────────────────────────────────────────
  const instructorName = instructor.name || "Instructor";
  const instructorAvatar = instructor.avatar_url || instructor.avatar
    ? resolveMediaUrl(instructor.avatar_url || instructor.avatar)
    : "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=150&h=150";

  const timezone = data.timezone || "IST";
  const humanDate = data.human_date || "";
  const timeDisplay = humanDate ? `${humanDate} at ${data.human_start_time || ""} (${timezone})` : "";

  const isHost = Boolean(user && (user.role === 'admin' || Number(data.instructor_id) === Number(user.id)));
  const isClassActive = data.can_join === true || data.status === 'live';
  const isCompleted = data.status === 'completed' || data.status === 'passed';
  const recordingAvailable = isCompleted && data.recording_available;
  const isFuture = !isClassActive && !isCompleted;

  // ─────────────────────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Not Enrolled Paywall
  // ─────────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div id="LiveStreamFull">
      <div className="VideoSection" ref={videoRef}>
        <button
          className="BackBtnOverlay"
          onClick={() => router.back()}
          aria-label="Go back"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.back(); } }}
        >
          <MdArrowBack />
        </button>

        <div className="VideoPlaceholder">
          {/* ─── ZoomMeetingContainer — dedicated fullscreen target ─── */}
          <div
            className={`ZoomMeetingContainer${isJoined && sdkParams ? ' ZoomMeetingContainer--active' : ''}`}
            ref={meetingRef}
            aria-label="Zoom Meeting"
          >
            {isJoined && sdkParams ? (
              <>
                {isFullscreen && (
                  <div className="FullscreenHint" aria-live="polite">
                    Press <kbd>Esc</kbd> to exit fullscreen
                  </div>
                )}

                <button
                  className="FitScreenBtn"
                  onClick={toggleMeetingFullscreen}
                  aria-label={isFullscreen ? "Exit fit screen" : "Fit to screen"}
                  title={isFullscreen ? "Exit fullscreen" : "Fit to screen"}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMeetingFullscreen(); } }}
                >
                  {isFullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
                </button>

                <iframe
                  ref={iframeRef}
                  src="/zoom-embed.html"
                  className="ZoomIframe"
                  allow="camera; microphone; display-capture; fullscreen; autoplay"
                  title="Zoom Meeting"
                />
              </>
            ) : (
              <div className="ZoomMeetingContainer__placeholder" />
            )}
          </div>

          {/* ─── Pre-join content area ─── */}
          {!isJoined && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: data.banner_image
                  ? `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url(${resolveMediaUrl(data.banner_image)})`
                  : "linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85))",
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                color: "#fff",
                textAlign: "center",
                padding: "0 20px",
              }}
            >
              {recordingAvailable && (
                <video
                  src={resolveMediaUrl(data.recording_url)}
                  controls
                  style={{ position: 'absolute', inset: 0, width: "100%", height: "100%", objectFit: "contain", background: '#000' }}
                  poster={data.banner_image ? resolveMediaUrl(data.banner_image) : undefined}
                />
              )}

              {isFuture && (
                <div style={{ maxWidth: "600px" }}>
                  <div style={{ 
                    background: isHost ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.15)", 
                    border: isHost ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.2)",
                    color: isHost ? "#34d399" : "#fff",
                    backdropFilter: "blur(6px)", 
                    display: "inline-flex", 
                    padding: "8px 16px", 
                    borderRadius: "20px", 
                    fontSize: "14px", 
                    fontWeight: "700", 
                    marginBottom: "20px", 
                    gap: "6px", 
                    alignItems: "center" 
                  }}>
                    <span style={{ width: "8px", height: "8px", background: isHost ? "#10b981" : "#f59e0b", borderRadius: "50%" }}></span> 
                    {isHost ? "Host Ready • Scheduled Session" : "Upcoming Live Class"}
                  </div>
                  <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "15px" }}>{data.title}</h2>
                  <p style={{ color: "#ccc", fontSize: "15px", marginBottom: "25px" }}>
                    {isHost ? `Scheduled for ${timeDisplay}. You can launch the host room early to prepare.` : timeDisplay}
                  </p>
                  
                  <div style={{ display: "flex", gap: "15px", justifyContent: "center", marginBottom: isHost ? "25px" : "0" }}>
                    {['days', 'hours', 'minutes', 'seconds'].map((label) => (
                      <div key={label} style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", minWidth: "80px", padding: "15px 10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)" }}>
                        <span style={{ display: "block", fontSize: "24px", fontWeight: "800" }}>{timeLeft[label]}</span>
                        <span style={{ display: "block", fontSize: "11px", color: "#aaa", textTransform: "uppercase", marginTop: "4px" }}>{label}</span>
                      </div>
                    ))}
                  </div>

                  {isHost && (
                    <div>
                      <button 
                        id="start-live-class-btn"
                        onClick={handleJoinMeeting}
                        disabled={isLaunchingZoom}
                        aria-label="Start Live Class as Host"
                        style={{
                          background: "var(--primaryColor)",
                          color: "#fff",
                          border: "none",
                          padding: "16px 40px",
                          borderRadius: "30px",
                          fontSize: "17px",
                          fontWeight: "700",
                          cursor: isLaunchingZoom ? "wait" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "10px",
                          boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
                          transition: "all 0.2s"
                        }}
                      >
                        <FiPlayCircle style={{ fontSize: "22px" }} /> {isLaunchingZoom ? "Launching Zoom Host Room..." : "Start Live Class (Host)"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isClassActive && (
                <div style={{ maxWidth: "550px" }}>
                  <div style={{ background: "rgba(220,38,38,0.2)", backdropFilter: "blur(6px)", border: "1px solid rgba(220,38,38,0.4)", display: "inline-flex", padding: "8px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: "700", marginBottom: "20px", gap: "6px", alignItems: "center", color: "#f87171" }}>
                    <span style={{ width: "8px", height: "8px", background: "#dc2626", borderRadius: "50%", animation: "pulse 1.5s infinite" }}></span> {isHost ? "Live Session Active (Host Mode)" : "Live Session Active"}
                  </div>
                  <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "15px" }}>{data.title}</h2>
                  <p style={{ color: "#ccc", fontSize: "15px", marginBottom: "30px" }}>
                    {isHost ? "The live Zoom session is active. Enter the room to instruct and manage participants." : "The live Zoom session is currently active and ready for you to join!"}
                  </p>
                  <button 
                    id="join-meeting-btn"
                    onClick={handleJoinMeeting}
                    disabled={isLaunchingZoom}
                    aria-label={isHost ? "Enter Live Meeting as Host" : "Join Live Zoom Class"}
                    style={{
                      background: "var(--primaryColor)",
                      color: "#fff",
                      border: "none",
                      padding: "16px 40px",
                      borderRadius: "30px",
                      fontSize: "17px",
                      fontWeight: "700",
                      cursor: isLaunchingZoom ? "wait" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "10px",
                      boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
                      transition: "all 0.2s"
                    }}
                  >
                    <MdLiveTv style={{ fontSize: "20px" }} /> {isLaunchingZoom ? "Launching Zoom Room..." : (isHost ? "Enter Live Meeting (Host)" : "Join Live Zoom Class")}
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

        {/* Pre-join fullscreen toggle */}
        {!isJoined && (
          <button
            className="FullscreenBtnOverlay"
            onClick={() => togglePreviewFullscreen(videoRef)}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePreviewFullscreen(videoRef); } }}
          >
            {isFullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
          </button>
        )}
      </div>

      {/* ── LMS metadata section ── */}
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

            <section className="DetailSection" style={{ borderTop: "1px solid #eaeaea", paddingTop: "40px", marginTop: "40px" }}>
              <h2 className="SectionTitle">Questions & Discussion</h2>
              <CommunicationProvider liveSectionId={data.id}>
                <DiscussionTab course={{ id: data.id }} entityType="live_section" />
              </CommunicationProvider>
            </section>
          </div>

          <div className="DetailsRight">
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
      {!isJoined && (isClassActive || isHost) && (
        <div className="MobileLiveBar">
          <div className="MobileLiveBadge">
            <span className="LiveDot"></span> {isClassActive ? (isHost ? "HOST LIVE" : "LIVE") : "HOST"}
          </div>
          <button 
            onClick={handleJoinMeeting}
            disabled={isLaunchingZoom}
            aria-label={isHost ? (isClassActive ? "Enter Live Meeting as Host" : "Start Live Class as Host") : "Join Live Class"}
            style={{
              background: "var(--primaryColor)",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: isLaunchingZoom ? "wait" : "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
            }}
          >
            {isLaunchingZoom ? "Launching..." : (isHost ? (isClassActive ? "Enter as Host" : "Start Live Class") : "Join Class")}
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveStreamPlayer;
