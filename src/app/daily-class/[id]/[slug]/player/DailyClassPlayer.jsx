"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  MdArrowBack,
  MdLiveTv,
  MdCheckCircle,
  MdEvent,
  MdAccessTime,
  MdStar,
  MdFullscreen,
  MdFullscreenExit,
  MdOutlineOndemandVideo,
  MdInfoOutline,
  MdCancel,
} from "react-icons/md";
import {
  FiClock,
  FiCalendar,
  FiUsers,
  FiGlobe,
  FiTrendingUp,
  FiMonitor,
  FiPlayCircle,
  FiAward,
  FiBookOpen,
  FiRefreshCw,
  FiCheck,
} from "react-icons/fi";
import { FaChalkboardTeacher } from "react-icons/fa";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import courseApi from "@/libs/courseApi";
import toast from "react-hot-toast";
import useZoomMeeting from "@/hooks/useZoomMeeting";
import CertificateViewerModal from "@/components/certificate/CertificateViewerModal";
import { useDailyClassCertificate } from "@/hooks/useDailyClassCertificate";

import "../../../../../assets/css/live-stream.scss";
import "../../../../../assets/css/learning-player.scss";
import "../../../../../assets/css/daily-class-player.scss";

/* ═══════════════════════════════════════════════════════════════════════════
   DAY MAP & TIME PARSER — Consistent schedule parsing across the app
   ═══════════════════════════════════════════════════════════════════════════ */

const dayMap = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tuesday: 2, tues: 2,
  wed: 3, wednesday: 3,
  thu: 4, thursday: 4, thur: 4, thurs: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

const parseTimeString = (timeStr) => {
  if (!timeStr) return { hours: 7, minutes: 0 };
  const str = String(timeStr).trim().toUpperCase();
  const isPM = str.includes("PM");
  const isAM = str.includes("AM");
  const match = str.match(/(\d+):(\d+)/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    return { hours, minutes };
  }
  return { hours: 7, minutes: 0 };
};

const getNextClassDate = (dailyClassObj) => {
  if (!dailyClassObj) return { targetTime: new Date(), isLive: false, hasEnded: false };

  const now = new Date();
  const timeObj = parseTimeString(
    dailyClassObj.class_time || dailyClassObj.human_class_time || "07:00 AM"
  );
  const durationMins = dailyClassObj.duration
    ? parseInt(dailyClassObj.duration, 10)
    : 60;

  // Check if class program end date has passed
  if (dailyClassObj.end_date) {
    const endDate = new Date(dailyClassObj.end_date);
    endDate.setHours(23, 59, 59, 999);
    if (now > endDate) {
      return { targetTime: endDate, isLive: false, hasEnded: true };
    }
  }

  const rawSchedule = dailyClassObj.schedule;
  const activeDays =
    Array.isArray(rawSchedule) && rawSchedule.length > 0
      ? rawSchedule
          .map((d) => {
            const key = String(d).toLowerCase().replace(/[^a-z]/g, "").slice(0, 3);
            return dayMap[key];
          })
          .filter((d) => d !== undefined)
      : [1, 2, 3, 4, 5]; // Default Mon-Fri

  for (let offset = 0; offset < 14; offset++) {
    const candidate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset,
      timeObj.hours,
      timeObj.minutes,
      0
    );
    const dayOfWeek = candidate.getDay();

    if (activeDays.includes(dayOfWeek)) {
      const classEnd = new Date(candidate.getTime() + durationMins * 60 * 1000);
      if (classEnd.getTime() > now.getTime()) {
        const isLive =
          now.getTime() >= candidate.getTime() - 15 * 60 * 1000 &&
          now.getTime() <= classEnd.getTime();
        return { targetTime: candidate, isLive, hasEnded: false };
      }
    }
  }

  const fallback = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    timeObj.hours,
    timeObj.minutes,
    0
  );
  return { targetTime: fallback, isLive: false, hasEnded: false };
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — DailyClassPlayer
   ═══════════════════════════════════════════════════════════════════════════ */

const DailyClassPlayer = ({ dailyClass: initialDailyClass, slug, bannerImage }) => {
  const router = useRouter();
  const videoRef = useRef(null);       // Pre-join preview fullscreen target
  const { user } = useSelector((state) => state.auth);

  const [classData, setClassData] = useState(
    initialDailyClass?.data || initialDailyClass || null
  );
  const [loading, setLoading] = useState(!initialDailyClass);
  const [timeLeft, setTimeLeft] = useState({
    days: "00", hours: "00", minutes: "00", seconds: "00",
  });
  const [isLive, setIsLive] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

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
    entityId: classData?.id,
    entityType: "daily_class",
    entity: classData,
    instructorId: classData?.instructor_id,
    signatureEndpoint: `daily-classes/${classData?.id}/zoom-signature`,
  });

  // ─── Authoritative Certificate State (Sprint 3) ──────────────────────
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const {
    eligibility: certEligibility,
    isLoading: isCertLoading,
    isClaiming: isClaimingCert,
    claimCertificate,
    refetch: refetchCertificate,
  } = useDailyClassCertificate(classData?.id, isEnrolled);

  const handleClaimCertificate = async () => {
    try {
      const cert = await claimCertificate();
      if (cert) {
        setIsViewerOpen(true);
      }
    } catch (_) {
      // Errors are already toasted in the hook
    }
  };

  // Client-side fallback fetch if initial data wasn't provided directly
  useEffect(() => {
    if (initialDailyClass) {
      setClassData(initialDailyClass?.data || initialDailyClass);
      setLoading(false);
      return;
    }

    const pathParts = window.location.pathname.split("/");
    const idFromUrl = pathParts[2]; // /daily-class/[id]/[slug]/player

    if (!idFromUrl) {
      setLoading(false);
      return;
    }

    const fetchClass = async () => {
      try {
        const res = await courseApi.dailyClass(idFromUrl);
        if (res.data) {
          setClassData(res.data?.data || res.data);
        }
      } catch (err) {
        console.error("Failed to fetch daily class", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClass();
  }, [initialDailyClass]);

  // Countdown timer lifecycle
  useEffect(() => {
    if (!classData) return;

    const updateTimer = () => {
      const { targetTime, isLive: liveNow, hasEnded: ended } = getNextClassDate(classData);
      setIsLive(liveNow);
      setHasEnded(ended);

      const distance = targetTime.getTime() - Date.now();
      if (distance <= 0) {
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        return;
      }

      setTimeLeft({
        days: String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, "0"),
        hours: String(Math.floor((distance / (1000 * 60 * 60)) % 24)).padStart(2, "0"),
        minutes: String(Math.floor((distance / (1000 * 60)) % 60)).padStart(2, "0"),
        seconds: String(Math.floor((distance / 1000) % 60)).padStart(2, "0"),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [classData]);

  const derivedSlug =
    slug || classData?.title?.trim().replace(/\s+/g, "-").toLowerCase() || "";
  const detailsUrl = `/daily-class/${classData?.id}/${derivedSlug}`;

  const handleBack = () => {
    router.push(detailsUrl);
  };

  // Derived values
  const instructor = classData?.instructor || {};
  const instructorName = instructor.name || "Achu Sivadasan";
  const instructorAvatar = instructor.avatar_url || instructor.avatar
    ? resolveMediaUrl(instructor.avatar_url || instructor.avatar)
    : "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=150&h=150";

  const thumbnailSrc = classData?.thumbnail
    ? resolveMediaUrl(classData.thumbnail)
    : bannerImage;

  const bgImage = thumbnailSrc
    ? `linear-gradient(rgba(0,0,0,0.68), rgba(0,0,0,0.88)), url(${thumbnailSrc})`
    : "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)";

  const days = classData?.schedule || [];
  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const humanClassTime = classData?.human_class_time || "07:00 AM";
  const timeDisplay = `${classData?.human_start_date || "Ongoing"} • Daily at ${humanClassTime} (IST)`;
  const learningOutcomes = Array.isArray(classData?.learning_outcomes) ? classData.learning_outcomes : [];
  const requirements = Array.isArray(classData?.requirements) ? classData.requirements : [];

  // Access control
  const isHost = Boolean(
    user && (user.role === "admin" || Number(classData?.instructor_id) === Number(user.id))
  );

  // Loading state
  if (loading) {
    return (
      <div id="LiveStreamFull" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 50, height: 50, border: "4px solid #eee", borderTopColor: "var(--primaryColor)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }}></div>
          <p style={{ color: "#666" }}>Loading class room...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Not found state
  if (!classData) {
    return (
      <div id="LiveStreamFull" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: "550px", padding: "40px 20px", background: "#fdfdfd", border: "1px solid #eaeaea", borderRadius: "12px" }}>
          <div style={{ fontSize: "52px", color: "#f59e0b", marginBottom: "20px" }}><MdInfoOutline /></div>
          <h2>Daily Class Not Found</h2>
          <p style={{ color: "#666", marginTop: "15px", lineHeight: "1.6" }}>
            The daily class session you are trying to access does not exist or has been removed.
          </p>
          <div style={{ marginTop: "30px" }}>
            <button
              style={{ padding: "12px 25px", background: "var(--primaryColor)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}
              onClick={() => router.push("/")}
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not enrolled paywall
  if (!isEnrolled && user) {
    return (
      <div id="LiveStreamFull" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: "550px", padding: "40px 20px", background: "#fdfdfd", border: "1px solid #eaeaea", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "52px", color: "#f59e0b", marginBottom: "20px" }}><MdCancel /></div>
          <h2>Daily Class Access Restricted</h2>
          <p style={{ color: "#666", marginTop: "15px", lineHeight: "1.6" }}>
            You are not currently enrolled in this daily class. Access to the live session and Zoom classroom is restricted to enrolled students.
          </p>
          <div style={{ marginTop: "30px", display: "flex", gap: "15px", justifyContent: "center" }}>
            <button
              style={{ padding: "12px 25px", background: "#6b7280", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}
              onClick={() => router.back()}
            >
              Go Back
            </button>
            <button
              style={{ padding: "12px 25px", background: "var(--primaryColor)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "15px" }}
              onClick={() => router.push(detailsUrl)}
            >
              View Class Overview
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="LiveStreamFull">
      {/* ═══ 1. HERO VIDEO / MEETING SECTION ═══ */}
      <div className="VideoSection" ref={videoRef}>
        <button
          className="BackBtnOverlay"
          onClick={handleBack}
          aria-label="Go back"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBack(); } }}
        >
          <MdArrowBack />
        </button>

        <div className="VideoPlaceholder">
          {/* ─── ZoomMeetingContainer — dedicated fullscreen target ─── */}
          <div
            className={`ZoomMeetingContainer${isJoined && sdkParams ? " ZoomMeetingContainer--active" : ""}`}
            ref={meetingRef}
            aria-label="Zoom Meeting"
          >
            {isJoined && sdkParams ? (
              <>
                {/* Fullscreen escape hint */}
                {isFullscreen && (
                  <div className="FullscreenHint" aria-live="polite">
                    Press <kbd>Esc</kbd> to exit fullscreen
                  </div>
                )}

                {/* Fit-screen toggle */}
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

                {/* The Zoom iframe */}
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

          {/* ─── Pre-join content area (overlaid when not joined) ─── */}
          {!isJoined && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: bgImage,
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
              {/* When session is Upcoming / Scheduled */}
              {!isLive && !hasEnded && (
                <div style={{ maxWidth: "620px", width: "100%" }}>
                  <div
                    style={{
                      background: isHost ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.15)",
                      border: isHost ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.2)",
                      color: isHost ? "#34d399" : "#fff",
                      backdropFilter: "blur(6px)",
                      WebkitBackdropFilter: "blur(6px)",
                      display: "inline-flex",
                      padding: "8px 18px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: "700",
                      marginBottom: "20px",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ width: "8px", height: "8px", background: isHost ? "#10b981" : "#f59e0b", borderRadius: "50%" }}></span>
                    {isHost ? "Host Ready • Daily Class" : "Upcoming Daily Class"}
                  </div>

                  <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "12px", lineHeight: "1.2" }}>
                    {classData.title}
                  </h2>

                  <p style={{ color: "#ccc", fontSize: "15px", marginBottom: "25px" }}>
                    {timeDisplay}
                  </p>

                  {/* Modern Countdown Timer Block */}
                  <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: isHost ? "28px" : "0" }}>
                    {["days", "hours", "minutes", "seconds"].map((label) => (
                      <div
                        key={label}
                        style={{
                          background: "rgba(255,255,255,0.1)",
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                          minWidth: "80px",
                          padding: "14px 10px",
                          borderRadius: "10px",
                          border: "1px solid rgba(255,255,255,0.18)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        }}
                      >
                        <span style={{ display: "block", fontSize: "26px", fontWeight: "800", color: "#fff", lineHeight: "1.1" }}>
                          {timeLeft[label]}
                        </span>
                        <span style={{ display: "block", fontSize: "10px", color: "#cbd5e1", textTransform: "uppercase", marginTop: "4px", letterSpacing: "0.8px", fontWeight: "600" }}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Host Start Button / Student Join Button */}
                  <div style={{ marginTop: isHost ? "0" : "28px" }}>
                    <button
                      onClick={handleJoinMeeting}
                      disabled={isLaunchingZoom}
                      style={{
                        background: isHost ? "var(--primaryColor)" : "var(--primaryColor)",
                        color: "#fff",
                        border: "none",
                        padding: "16px 42px",
                        borderRadius: "30px",
                        fontSize: "17px",
                        fontWeight: "700",
                        cursor: isLaunchingZoom ? "wait" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        boxShadow: "0 10px 24px rgba(0,0,0,0.3)",
                        transition: "all 0.2s ease",
                        opacity: isLaunchingZoom ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => !isLaunchingZoom && (e.currentTarget.style.transform = "translateY(-2px)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                    >
                      <FiPlayCircle style={{ fontSize: "22px" }} />
                      {isLaunchingZoom
                        ? "Launching Zoom..."
                        : isHost
                          ? "Start Daily Class (Host)"
                          : "Enter Class Room"}
                    </button>
                  </div>
                </div>
              )}

              {/* When session is LIVE */}
              {isLive && (
                <div style={{ maxWidth: "580px", width: "100%" }}>
                  <div
                    style={{
                      background: "rgba(220,38,38,0.25)",
                      backdropFilter: "blur(6px)",
                      WebkitBackdropFilter: "blur(6px)",
                      border: "1px solid rgba(220,38,38,0.45)",
                      display: "inline-flex",
                      padding: "8px 18px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: "700",
                      marginBottom: "20px",
                      gap: "8px",
                      alignItems: "center",
                      color: "#f87171",
                    }}
                  >
                    <span style={{ width: "8px", height: "8px", background: "#dc2626", borderRadius: "50%", animation: "pulse 1.5s infinite" }}></span>
                    {isHost ? "Live Session Active (Host Mode)" : "Live Session Active"}
                  </div>

                  <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "15px" }}>
                    {classData.title}
                  </h2>

                  <p style={{ color: "#e2e8f0", fontSize: "15px", marginBottom: "30px", lineHeight: "1.6" }}>
                    {isHost
                      ? "The live daily class session is active. Enter the room to instruct and manage participants."
                      : `The live daily yoga class is happening right now! Join the classroom to practice with ${instructorName}.`}
                  </p>

                  <button
                    onClick={handleJoinMeeting}
                    disabled={isLaunchingZoom}
                    style={{
                      background: isHost ? "var(--primaryColor)" : "#16a34a",
                      color: "#fff",
                      border: "none",
                      padding: "16px 44px",
                      borderRadius: "30px",
                      fontSize: "17px",
                      fontWeight: "700",
                      cursor: isLaunchingZoom ? "wait" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "10px",
                      boxShadow: isHost ? "0 10px 24px rgba(0,0,0,0.3)" : "0 10px 25px rgba(22,163,74,0.35)",
                      transition: "all 0.2s ease",
                      opacity: isLaunchingZoom ? 0.7 : 1,
                    }}
                  >
                    <MdLiveTv style={{ fontSize: "22px" }} />
                    {isLaunchingZoom
                      ? "Launching Zoom..."
                      : isHost
                        ? "Enter Live Meeting (Host)"
                        : "Join Live Class Now"}
                  </button>
                </div>
              )}

              {/* When session has ended */}
              {hasEnded && (
                <div style={{ maxWidth: "550px", width: "100%" }}>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(6px)",
                      display: "inline-flex",
                      padding: "8px 18px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: "700",
                      marginBottom: "20px",
                      gap: "6px",
                      alignItems: "center",
                    }}
                  >
                    Program Completed
                  </div>

                  <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "15px" }}>
                    {classData.title}
                  </h2>

                  <p style={{ color: "#ccc", fontSize: "15px", marginBottom: "25px" }}>
                    This class program duration has completed. Explore other upcoming daily classes and workshops.
                  </p>

                  <button
                    onClick={handleBack}
                    style={{
                      background: "var(--primaryColor)",
                      color: "#fff",
                      border: "none",
                      padding: "14px 32px",
                      borderRadius: "30px",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    View Class Overview
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pre-join fullscreen toggle — hidden once the meeting is active */}
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

      {/* ═══ 2. METADATA & DETAILS SECTION ═══ */}
      <div className="StreamContainer">
        {/* Main Info Row */}
        <div className="MainInfoRow">
          <div className="InfoLeft">
            <h1 className="StreamTitle">{classData.title}</h1>
            <p className="StreamSubtitle">{classData.category?.name || "Daily Meditation & Flow"}</p>
          </div>

          <div className="InfoMiddle">
            <img src={instructorAvatar} alt={instructorName} className="InstructorAvatar" />
            <div className="InstructorDetails">
              <h3 className="Name">{instructorName}</h3>
              <div className="InstructorMeta">
                <span className="Rating">
                  <MdStar className="StarIcon" /> {classData.average_rating || 4.9}
                </span>
                <span className="Students">
                  {instructor.years_of_experience ? `${instructor.years_of_experience}+ Years Experience` : "Expert Instructor"}
                </span>
              </div>
            </div>
          </div>

          <div className="InfoRight">
            <div className="StatsGroup">
              <div className="StatItem">
                <span className="StatValue">{classData.duration || 60} mins</span>
                <span className="StatLabel">Duration</span>
              </div>
              <div className="StatItem">
                <span className="StatValue">{humanClassTime}</span>
                <span className="StatLabel">Class Time</span>
              </div>
            </div>
            {isLive && (
              <div className="LiveNowBadge">
                <span className="LiveDot"></span> LIVE NOW
              </div>
            )}
          </div>
        </div>

        {/* Stream Details Grid */}
        <div className="StreamDetailsGrid">
          {/* Left Column */}
          <div className="DetailsLeft">
            <section className="DetailSection">
              <h2 className="SectionTitle">About This Daily Class</h2>
              <div
                className="SectionText"
                dangerouslySetInnerHTML={{
                  __html:
                    classData.description ||
                    "<p>Join this daily live practice to build strength, flexibility, and inner calm with expert guidance.</p>",
                }}
              />
              <div className="InfoPills">
                <span className="Pill"><MdLiveTv className="PillIcon" /> Daily Live Session</span>
                {classData?.has_certificate ? (
                  <span className="Pill"><MdCheckCircle className="PillIcon" /> Certificate Included</span>
                ) : null}
                <span className="Pill"><MdEvent className="PillIcon" /> Live Interaction</span>
                <span className="Pill"><MdAccessTime className="PillIcon" /> Regular Practice</span>
                <span className="Pill"><FaChalkboardTeacher className="PillIcon" /> Expert Instructor</span>
              </div>
            </section>

            {/* Certificate & Attendance Status Section */}
            {classData?.has_certificate && (
              <section className="DetailSection" style={{ borderTop: "1px solid #eaeaea", paddingTop: "35px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                  <h2 className="SectionTitle" style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                    <FiAward style={{ color: "var(--primaryColor, #874429)" }} />
                    <span>Course Certificate & Attendance</span>
                  </h2>
                  {certEligibility?.status === "issued" && (
                    <span style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      backgroundColor: "#dcfce7",
                      color: "#166534",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}>
                      <FiCheck /> Certificate Issued
                    </span>
                  )}
                  {certEligibility?.status === "eligible" && !certEligibility?.is_claimed && (
                    <span style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      backgroundColor: "#dbeafe",
                      color: "#1e40af",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}>
                      <FiAward /> Eligible to Claim
                    </span>
                  )}
                </div>

                {!isEnrolled ? (
                  <div style={{
                    background: "#f8fafc",
                    padding: "20px 24px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    color: "#475569",
                    fontSize: "14px",
                    lineHeight: "1.6",
                  }}>
                    <p style={{ margin: "0 0 10px 0" }}>
                      Earn an official <strong>Certificate of Completion</strong> upon meeting the required attendance criteria.
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748b" }}>
                      <FiAward style={{ color: "var(--primaryColor)" }} />
                      <span>Minimum Required Attendance: <strong>{classData.minimum_attendance_percentage || 70}%</strong></span>
                    </div>
                  </div>
                ) : isCertLoading ? (
                  <div style={{
                    background: "#f8fafc",
                    padding: "24px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    color: "#64748b",
                    fontSize: "14px",
                  }}>
                    <FiRefreshCw className="spin" style={{ fontSize: "18px", color: "var(--primaryColor)" }} />
                    <span>Checking certificate eligibility & attendance...</span>
                  </div>
                ) : (
                  <div style={{
                    background: "#f8fafc",
                    padding: "22px 24px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                  }}>
                    {/* Attendance Statistics Grid */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "14px",
                    }}>
                      <div style={{
                        background: "#ffffff",
                        padding: "14px 18px",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}>
                        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>
                          Your Attendance
                        </div>
                        <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
                          {certEligibility?.attendance_percentage ?? 0}%
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          {certEligibility?.qualifying_attendance_count ?? 0} of {certEligibility?.eligible_occurrence_count ?? 0} sessions attended
                        </div>
                      </div>

                      <div style={{
                        background: "#ffffff",
                        padding: "14px 18px",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}>
                        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>
                          Required Attendance
                        </div>
                        <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--primaryColor, #874429)", marginTop: "4px" }}>
                          {certEligibility?.minimum_attendance_percentage ?? (classData.minimum_attendance_percentage || 70)}%
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          Threshold configured by instructor
                        </div>
                      </div>
                    </div>

                    {/* Informative explanation / reason from backend */}
                    <div style={{
                      padding: "12px 16px",
                      borderRadius: "8px",
                      backgroundColor: certEligibility?.is_claimed || certEligibility?.eligible ? "#f0fdf4" : "#fffbeb",
                      border: `1px solid ${certEligibility?.is_claimed || certEligibility?.eligible ? "#bbf7d0" : "#fef3c7"}`,
                      fontSize: "13.5px",
                      color: certEligibility?.is_claimed || certEligibility?.eligible ? "#166534" : "#92400e",
                      lineHeight: "1.5",
                    }}>
                      {certEligibility?.reason || (
                        certEligibility?.is_claimed
                          ? "Your certificate has been issued and is ready to view and download."
                          : certEligibility?.eligible
                          ? "You have satisfied all attendance and completion requirements. Ready to claim!"
                          : "Attend required daily live sessions to build eligibility."
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      {certEligibility?.is_claimed && certEligibility?.certificate ? (
                        <button
                          type="button"
                          onClick={() => setIsViewerOpen(true)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 20px",
                            fontSize: "14px",
                            fontWeight: "700",
                            borderRadius: "8px",
                            border: "none",
                            backgroundColor: "var(--primaryColor, #874429)",
                            color: "#ffffff",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(135, 68, 41, 0.25)",
                          }}
                        >
                          <FiAward style={{ fontSize: "16px" }} />
                          <span>View Certificate</span>
                        </button>
                      ) : certEligibility?.eligible ? (
                        <button
                          type="button"
                          onClick={handleClaimCertificate}
                          disabled={isClaimingCert}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 22px",
                            fontSize: "14px",
                            fontWeight: "700",
                            borderRadius: "8px",
                            border: "none",
                            backgroundColor: "#16a34a",
                            color: "#ffffff",
                            cursor: isClaimingCert ? "wait" : "pointer",
                            boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
                            opacity: isClaimingCert ? 0.7 : 1,
                          }}
                        >
                          {isClaimingCert ? (
                            <>
                              <FiRefreshCw className="spin" style={{ fontSize: "16px" }} />
                              <span>Claiming Certificate...</span>
                            </>
                          ) : (
                            <>
                              <FiAward style={{ fontSize: "16px" }} />
                              <span>Claim Certificate</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div style={{ fontSize: "13px", color: "#64748b", fontStyle: "italic" }}>
                          {certEligibility?.status === "in_progress"
                            ? "Certificate will unlock after class end date and requirements are satisfied."
                            : "Meet the minimum attendance requirement across class sessions to claim."}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Weekly Schedule Display */}
            <section className="DetailSection" style={{ borderTop: "1px solid #eaeaea", paddingTop: "35px" }}>
              <h2 className="SectionTitle">Weekly Schedule</h2>
              <div
                style={{
                  background: "#f8fafc",
                  padding: "20px 24px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ background: "#e2e8f0", padding: "10px", borderRadius: "8px", color: "var(--primaryColor)" }}>
                    <FiClock style={{ fontSize: "20px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>
                      Daily Time
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                      {humanClassTime} (IST)
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", marginBottom: "10px" }}>
                    Active Days:
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {allDays.map((day) => {
                      const isActive =
                        days.length > 0
                          ? days.some((d) => day.toLowerCase().startsWith(String(d).toLowerCase().slice(0, 3)))
                          : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(day);
                      return (
                        <div
                          key={day}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: "600",
                            background: isActive ? "var(--primaryColor)" : "#fff",
                            color: isActive ? "#fff" : "#94a3b8",
                            border: isActive ? "1px solid var(--primaryColor)" : "1px solid #e2e8f0",
                            boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                          }}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="DetailsRight">
            {/* What You'll Learn */}
            {learningOutcomes.length > 0 && (
              <section
                className="DetailSection"
                style={{
                  background: "#f9fafb",
                  padding: "24px",
                  borderRadius: "12px",
                  border: "1px solid #eaeaea",
                }}
              >
                <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px", color: "#111" }}>
                  What You&apos;ll Learn
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                  {learningOutcomes.map((item, idx) => (
                    <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13.5px", color: "#444" }}>
                      <MdCheckCircle style={{ color: "#10b981", fontSize: "16px", marginTop: "2px", flexShrink: 0 }} /> {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Class Requirements */}
            {requirements.length > 0 && (
              <section
                className="DetailSection"
                style={{
                  background: "#f9fafb",
                  padding: "24px",
                  borderRadius: "12px",
                  border: "1px solid #eaeaea",
                  marginTop: learningOutcomes.length > 0 ? "20px" : "0",
                }}
              >
                <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px", color: "#111" }}>
                  What to Bring
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                  {requirements.map((item, idx) => (
                    <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13.5px", color: "#444" }}>
                      <MdCheckCircle style={{ color: "var(--primaryColor)", fontSize: "16px", marginTop: "2px", flexShrink: 0 }} /> {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Instructor Profile Summary */}
            <section
              className="DetailSection"
              style={{
                background: "#f9fafb",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #eaeaea",
                marginTop: "20px",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px", color: "#111" }}>
                Your Instructor
              </h3>
              <div style={{ display: "flex", gap: "14px", alignItems: "center", marginBottom: "12px" }}>
                <img
                  src={instructorAvatar}
                  alt={instructorName}
                  style={{ width: "54px", height: "54px", borderRadius: "50%", objectFit: "cover" }}
                />
                <div>
                  <h4 style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: "700", color: "#111" }}>
                    {instructorName}
                  </h4>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    {instructor.professional_title || instructor.role || "Senior Yoga Teacher"}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.6", margin: 0 }}>
                {instructor.full_biography || instructor.bio_graphy || "Certified yoga master with years of teaching experience."}
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* ═══ 3. MOBILE STICKY BOTTOM BAR ═══ */}
      {!isJoined && (
        <div className="MobileLiveBar">
          <div className="MobileLiveBadge">
            <span className="LiveDot"></span> {isLive ? (isHost ? "HOST LIVE" : "LIVE") : "UPCOMING"}
          </div>
          <button
            onClick={handleJoinMeeting}
            disabled={isLaunchingZoom}
            style={{
              background: isLive ? "#16a34a" : "var(--primaryColor)",
              color: "#fff",
              border: "none",
              padding: "10px 22px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: isLaunchingZoom ? "wait" : "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            }}
          >
            {isLaunchingZoom ? "Launching..." : isLive ? (isHost ? "Enter as Host" : "Join Live Class") : (isHost ? "Start Daily Class" : "Enter Class Room")}
          </button>
        </div>
      )}

      {/* ═══ 4. CERTIFICATE VIEWER MODAL ═══ */}
      {isViewerOpen && (
        <CertificateViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          certificate={certEligibility?.certificate}
          entity={classData}
        />
      )}
    </div>
  );
};

export default DailyClassPlayer;
