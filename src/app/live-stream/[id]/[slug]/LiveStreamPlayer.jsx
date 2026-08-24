"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import apiClient from '@/services/apiClient';
import { fetchLiveSectionDetail } from '@/libs/course';
import DiscussionTab from '@/components/player/DiscussionTab';
import { CommunicationProvider } from '@/communication/CommunicationStore';

import '../../../../assets/css/live-stream.scss';
import '../../../../assets/css/learning-player.scss';

const LiveStreamPlayer = ({ liveSection: initialLiveSection }) => {
  const router = useRouter();
  const videoRef = useRef(null);       // VideoSection — used for non-Zoom fullscreen
  const meetingRef = useRef(null);     // Dedicated Zoom meeting container — fullscreen target
  const iframeRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  // States
  const [liveSection, setLiveSection] = useState(initialLiveSection);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);    // driven by fullscreenchange
  const [isLaunchingZoom, setIsLaunchingZoom] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [sdkParams, setSdkParams] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });

  const data = liveSection || {};
  const instructor = data.instructor || {};

  // ─────────────────────────────────────────────────────────────────────────────
  // FULLSCREEN STATE — driven by the browser event, not a manual toggle flag.
  // document.fullscreenElement is the authoritative source of truth.
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);

      // If fullscreen was exited externally (ESC, browser UI) while the
      // meeting is still active, keep isJoined as-is — the meeting continues
      // in the normal VideoSection container.
      if (!document.fullscreenElement && isJoined) {
        // Meeting remains active; layout returns to normal VideoSection height.
        // No re-init or re-join needed.
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [isJoined]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Fetch Fresh Live Section Data & Check Enrollment Status
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

  // ─────────────────────────────────────────────────────────────────────────────
  // 2.1 Zoom iframe event listener hook
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleZoomMessage = async (event) => {
      const payload = event.data;
      if (!payload) return;

      if (payload.event === 'zoom_event_loaded') {
        setIsIframeLoaded(true);
      } else if (payload.event === 'zoom_event_joined') {
        setIsLaunchingZoom(false);
        toast.success("Joined Zoom class successfully!");

        // Record attendance
        try {
          await apiClient.post("attendance", {
            entity_type: "live_section",
            entity_id: data.id,
            student_id: user.id,
            status: "present",
            attendance_date: new Date().toISOString().split("T")[0],
            notes: "Successfully joined embedded Zoom meeting container",
          });
        } catch (e) {
          console.error("Attendance marking failed", e);
        }
      } else if (payload.event === 'zoom_event_left') {
        setIsJoined(false);
        setIsIframeLoaded(false);
        setIsLaunchingZoom(false);

        // Exit fullscreen if still active when the meeting is left
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }

        toast.success("You have left the live session.");
      } else if (payload.event === 'zoom_event_failed') {
        setIsJoined(false);
        setIsIframeLoaded(false);
        setIsLaunchingZoom(false);

        // Exit fullscreen if the meeting failed to start
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }

        const errDetails = payload.error || {};
        toast.error(`Zoom connection failed: ${errDetails.message || 'Unknown error'}`);
      }
    };

    window.addEventListener('message', handleZoomMessage);
    return () => {
      window.removeEventListener('message', handleZoomMessage);
    };
  }, [data.id, user?.id]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2.2 Trigger Zoom join action when iframe is ready
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isJoined && isIframeLoaded && sdkParams && iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({
        action: 'zoom_action_join',
        ...sdkParams
      }, '*');
    }
  }, [isJoined, isIframeLoaded, sdkParams]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2.3 Cleanup Zoom client on component unmount
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage({
            action: 'zoom_action_leave'
          }, '*');
        } catch (e) {
          console.error("Failed to trigger zoom client unmount cleanup:", e);
        }
      }
      // Ensure fullscreen is released if user navigates away
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Fullscreen Toggle (for non-Zoom preview mode)
  //    Used by the FullscreenBtnOverlay button shown before joining.
  // ─────────────────────────────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen?.().catch((err) => {
        console.warn("Preview fullscreen request denied:", err.message);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Join Meeting Action
  //
  // CRITICAL: requestFullscreen() MUST be called within the synchronous part of
  // the click handler — before any await — to satisfy the browser's user-gesture
  // requirement. The async signature fetch happens after fullscreen is entered.
  // If fullscreen is denied (browser policy, iframe restriction, etc.), the
  // meeting still joins normally in the normal container.
  // ─────────────────────────────────────────────────────────────────────────────
  const handleJoinClass = async () => {
    if (!user) {
      toast.error("Please login to join the live session");
      router.push('/login');
      return;
    }

    // ── Step 1: Request fullscreen synchronously while the user gesture is live.
    //    Target: meetingRef (the dedicated Zoom container div).
    let fullscreenGranted = false;
    if (meetingRef.current && meetingRef.current.requestFullscreen) {
      try {
        await meetingRef.current.requestFullscreen();
        fullscreenGranted = true;
      } catch (fsErr) {
        // Fullscreen denied — log safe diagnostic, continue with normal join.
        console.warn("[Zoom] Fullscreen request denied — joining in normal mode:", fsErr.message);
      }
    }

    // ── Step 2: Start loading state and fetch Zoom signature.
    setIsLaunchingZoom(true);
    const toastId = toast.loading("Authorizing Zoom session...");

    try {
      // Fetch SDK Signature dynamically — unchanged authentication flow
      const signRes = await apiClient.post(`/live-sections/${data.id}/zoom-signature`);
      if (!signRes.data || !signRes.data.success) {
        throw new Error(signRes.data?.message || "Failed to generate Zoom signature");
      }
      const sdkConfig = signRes.data.data;

      // Set signature parameters — iframe will receive these via postMessage
      setSdkParams({
        sdkKey: sdkConfig.sdk_key,
        signature: sdkConfig.signature,
        meetingNumber: sdkConfig.meeting_number,
        passcode: sdkConfig.passcode,
        userName: sdkConfig.user_name,
        userEmail: sdkConfig.user_email,
        role: sdkConfig.role,
        zak: sdkConfig.zak || null,
      });

      setIsJoined(true);
      toast.dismiss(toastId);

    } catch (err) {
      console.error("Zoom authorization failed:", err);
      setIsLaunchingZoom(false);
      toast.error(err.message || "Unable to authorize Zoom session", { id: toastId });

      // If auth failed and we entered fullscreen, exit it cleanly
      if (fullscreenGranted && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Derived values
  // ─────────────────────────────────────────────────────────────────────────────
  const instructorName = instructor.name || "Instructor";
  const instructorAvatar = instructor.avatar_url || instructor.avatar
    ? resolveMediaUrl(instructor.avatar_url || instructor.avatar)
    : "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=150&h=150";

  const timezone = data.timezone || "IST";
  const humanDate = data.human_date || "";
  const timeDisplay = humanDate ? `${humanDate} at ${data.human_start_time || ""} (${timezone})` : "";

  // Render State check
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
      {/*
        VideoSection: the overall preview + meeting area.
        ref={videoRef} is used only for the pre-join fullscreen toggle button.
      */}
      <div className="VideoSection" ref={videoRef}>
        <button className="BackBtnOverlay" onClick={() => router.back()} aria-label="Go back">
          <MdArrowBack />
        </button>

        {/*
          VideoPlaceholder: fills VideoSection via position:absolute; inset:0.
          Contains both the Zoom meeting container and the pre-join placeholder.
        */}
        <div className="VideoPlaceholder">

          {/*
            ZoomMeetingContainer: the DEDICATED fullscreen target.
            This is the element passed to requestFullscreen().
            It wraps only the Zoom iframe — nothing else.

            CSS classes:
              .ZoomMeetingContainer         — normal (inline) mode
              .ZoomMeetingContainer:fullscreen — fills viewport
          */}
          <div
            className={`ZoomMeetingContainer${isJoined && sdkParams ? ' ZoomMeetingContainer--active' : ''}`}
            ref={meetingRef}
            aria-label="Zoom Meeting"
          >
            {isJoined && sdkParams ? (
              <>
                {/*
                  Fullscreen escape hint overlay — visible only while in
                  actual browser fullscreen. Fades out automatically.
                  Does NOT interfere with Zoom controls.
                */}
                {isFullscreen && (
                  <div className="FullscreenHint" aria-live="polite">
                    Press <kbd>Esc</kbd> to exit fullscreen
                  </div>
                )}

                {/*
                  The Zoom iframe.
                  allow="fullscreen" is required for Zoom's own native
                  fullscreen button to work inside the iframe.
                  The iframe fills the ZoomMeetingContainer completely.
                  No recursive sizing applied to iframe descendants.
                */}
                <iframe
                  ref={iframeRef}
                  src="/zoom-embed.html"
                  className="ZoomIframe"
                  allow="camera; microphone; display-capture; fullscreen; autoplay"
                  title="Zoom Meeting"
                />
              </>
            ) : (
              /*
                Pre-join placeholder — shown inside ZoomMeetingContainer when
                not yet joined. Invisible when the meeting is active.
              */
              <div className="ZoomMeetingContainer__placeholder" />
            )}
          </div>

          {/* Pre-join content area — overlaid on top of the empty container */}
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
                    id="join-meeting-btn"
                    onClick={handleJoinClass}
                    disabled={isLaunchingZoom}
                    aria-label="Join Live Zoom Class"
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

        {/* Pre-join fullscreen toggle — hidden once the meeting is active */}
        {!isJoined && (
          <button
            className="FullscreenBtnOverlay"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
          </button>
        )}
      </div>

      {/* ── LMS metadata section — outside Zoom container, outside fullscreen target */}
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
            aria-label="Join Class"
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
