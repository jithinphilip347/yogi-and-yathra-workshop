"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import apiClient from "@/services/apiClient";

/**
 * Shared Zoom Meeting hook — used by both LiveStreamPlayer and DailyClassPlayer.
 *
 * Encapsulates:
 *   • Enrollment / host verification
 *   • Zoom SDK iframe lifecycle (postMessage ↔ zoom-embed.html)
 *   • Fullscreen management
 *   • Zoom signature fetch (role-aware: instructor=host, student=participant)
 *   • Attendance recording
 *   • Cleanup on unmount
 *
 * @param {Object} options
 * @param {number|string} options.entityId         — LiveSection or DailyClass ID
 * @param {string}        options.entityType       — "live_section" | "daily_class"
 * @param {Object|null}   options.entity           — The entity data object
 * @param {number|null}  options.instructorId      — The assigned instructor's user ID
 * @param {string}        options.signatureEndpoint — API path for zoom-signature (without leading /)
 *                                                    e.g. "live-sections/123/zoom-signature"
 *                                                    or    "daily-classes/123/zoom-signature"
 * @param {Function}      [options.onJoined]       — Called after successful join
 * @param {Function}      [options.onLeft]         — Called after leaving meeting
 * @param {Function}      [options.onFailed]       — Called on join failure
 */
export default function useZoomMeeting({
  entityId,
  entityType,
  entity,
  instructorId,
  signatureEndpoint,
  onJoined,
  onLeft,
  onFailed,
}) {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);

  const meetingRef = useRef(null); // ZoomMeetingContainer — fullscreen target
  const iframeRef = useRef(null); // The Zoom iframe

  const [isJoined, setIsJoined] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isLaunchingZoom, setIsLaunchingZoom] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sdkParams, setSdkParams] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // ─── 1. Fullscreen state — driven by the browser event ─────────────
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // ─── 2. Enrollment / access verification ───────────────────────────
  useEffect(() => {
    if (!entityId || !user?.id) return;

    const checkAccess = async () => {
      try {
        const res = await apiClient.get(
          user.id ? `enrollments/user/${user.id}` : "enrolled-courses",
          { params: { product_type: entityType === "live_section" ? "live_section" : "daily_class" } },
        );
        const list = res.data?.data || res.data || [];
        const enrolled = list.some(
          (e) =>
            Number(e.enrollable_id) === Number(entityId) &&
            (e.status === "active" || e.status === "completed"),
        );

        // Host: admin or assigned instructor
        const isHost =
          user.role === "admin" ||
          Number(instructorId) === Number(user.id);

        setIsEnrolled(enrolled || isHost);
      } catch (err) {
        console.error("Failed to verify enrollment", err);
        // Default to enrolled check — the backend will reject if not authorized
        const isHost =
          user.role === "admin" ||
          Number(instructorId) === Number(user.id);
        setIsEnrolled(isHost);
      }
    };

    checkAccess();
  }, [entityId, entityType, instructorId, user?.id, user?.role]);

  // ─── 3. Zoom iframe postMessage listener ───────────────────────────
  useEffect(() => {
    const handleZoomMessage = async (event) => {
      const payload = event.data;
      if (!payload) return;

      if (payload.event === "zoom_event_loaded") {
        setIsIframeLoaded(true);
      } else if (payload.event === "zoom_event_joined") {
        setIsLaunchingZoom(false);
        toast.success("Joined Zoom session successfully!");

        // Record attendance
        try {
          await apiClient.post("attendance", {
            entity_type: entityType,
            entity_id: entityId,
            student_id: user.id,
            status: "present",
            attendance_date: new Date().toISOString().split("T")[0],
            notes: "Successfully joined embedded Zoom meeting container",
          });
        } catch (e) {
          console.error("Attendance marking failed", e);
        }

        if (typeof onJoined === "function") onJoined();
      } else if (payload.event === "zoom_event_left") {
        setIsJoined(false);
        setIsIframeLoaded(false);
        setIsLaunchingZoom(false);

        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }

        toast.success("You have left the live session.");
        if (typeof onLeft === "function") onLeft();
      } else if (payload.event === "zoom_event_failed") {
        setIsJoined(false);
        setIsIframeLoaded(false);
        setIsLaunchingZoom(false);

        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }

        const errDetails = payload.error || {};
        toast.error(
          `Zoom connection failed: ${errDetails.message || "Unknown error"}`,
        );
        if (typeof onFailed === "function") onFailed(errDetails);
      }
    };

    window.addEventListener("message", handleZoomMessage);
    return () => window.removeEventListener("message", handleZoomMessage);
  }, [entityId, entityType, user?.id, onJoined, onLeft, onFailed]);

  // ─── 4. Trigger Zoom join when iframe is ready ─────────────────────
  useEffect(() => {
    if (isJoined && isIframeLoaded && sdkParams && iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(
        { action: "zoom_action_join", ...sdkParams },
        "*",
      );
    }
  }, [isJoined, isIframeLoaded, sdkParams]);

  // ─── 5. Cleanup on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage(
            { action: "zoom_action_leave" },
            "*",
          );
        } catch (e) {
          console.error("Failed to trigger zoom client unmount cleanup:", e);
        }
      }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // ─── 6. Join meeting — must be called from a click handler ─────────
  const handleJoinMeeting = useCallback(async () => {
    if (!user) {
      toast.error("Please login to join the session");
      router.push("/login");
      return;
    }

    // Step 1: Request fullscreen synchronously (browser user-gesture requirement)
    let fullscreenGranted = false;
    if (meetingRef.current && meetingRef.current.requestFullscreen) {
      try {
        await meetingRef.current.requestFullscreen();
        fullscreenGranted = true;
      } catch (fsErr) {
        console.warn(
          "[Zoom] Fullscreen request denied — joining in normal mode:",
          fsErr.message,
        );
      }
    }

    // Step 2: Fetch Zoom signature
    setIsLaunchingZoom(true);
    const toastId = toast.loading("Authorizing Zoom session...");

    try {
      const signRes = await apiClient.post(`/${signatureEndpoint}`);
      if (!signRes.data || !signRes.data.success) {
        throw new Error(
          signRes.data?.message || "Failed to generate Zoom signature",
        );
      }
      const sdkConfig = signRes.data.data;

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
      toast.error(err.message || "Unable to authorize Zoom session", {
        id: toastId,
      });

      if (fullscreenGranted && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [user, router, signatureEndpoint]);

  // ─── 7. Toggle fullscreen for meeting container ────────────────────
  const toggleMeetingFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      meetingRef.current?.requestFullscreen?.().catch((e) => {
        console.warn("[Zoom] Fit-screen request denied:", e.message);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // ─── 8. Toggle fullscreen for pre-join preview ─────────────────────
  const togglePreviewFullscreen = useCallback((previewRef) => {
    if (!document.fullscreenElement) {
      previewRef?.current?.requestFullscreen?.().catch((err) => {
        console.warn("Preview fullscreen request denied:", err.message);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  return {
    // Refs
    meetingRef,
    iframeRef,
    // State
    isJoined,
    isIframeLoaded,
    isLaunchingZoom,
    isFullscreen,
    sdkParams,
    isEnrolled,
    // Actions
    handleJoinMeeting,
    toggleMeetingFullscreen,
    togglePreviewFullscreen,
    setIsJoined,
    setIsLaunchingZoom,
  };
}
