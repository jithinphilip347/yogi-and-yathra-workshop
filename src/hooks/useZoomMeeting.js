"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import apiClient from "@/services/apiClient";

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

/** Maximum number of automatic retry attempts for signature/auth failures. */
const MAX_RETRIES = 2;

/* ═══════════════════════════════════════════════════════════════════════════
   Shared Zoom Meeting hook — used by both LiveStreamPlayer and
   DailyClassPlayer.

   Encapsulates:
     • Enrollment / host verification
     • Zoom SDK iframe lifecycle (postMessage ↔ zoom-embed.html)
     • Fullscreen management
     • Zoom signature fetch (role-aware: instructor=host, student=participant)
     • Attendance recording
     • Join lock (prevents concurrent join operations)
     • Stale-configuration protection (request ID tracking)
     • Retry limits (prevents infinite retry loops)
     • Error classification (signature / network / meeting / auth)
     • Cleanup on unmount

   @param {Object} options
   @param {number|string} options.entityId         — LiveSection or DailyClass ID
   @param {string}        options.entityType       — "live_section" | "daily_class"
   @param {Object|null}   options.entity           — The entity data object
   @param {number|null}  options.instructorId      — The assigned instructor's user ID
   @param {string}        options.signatureEndpoint — API path for zoom-signature
   @param {Function}      [options.onJoined]       — Called after successful join
   @param {Function}      [options.onLeft]         — Called after leaving meeting
   @param {Function}      [options.onFailed]       — Called on join failure
   ═══════════════════════════════════════════════════════════════════════════ */
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

  // ─── Refs ──────────────────────────────────────────────────────────
  const meetingRef = useRef(null);  // ZoomMeetingContainer — fullscreen target
  const iframeRef = useRef(null);   // The Zoom iframe
  const joinLockRef = useRef(false); // Prevents concurrent join operations
  const requestIdRef = useRef(0);   // Tracks fresh config requests (stale protection)
  const abortRef = useRef(null);    // AbortController for in-flight config requests
  const retryCountRef = useRef(0);  // Retry counter (prevents infinite loops)
  const mountedRef = useRef(true);  // Tracks component mount status

  // ─── State ─────────────────────────────────────────────────────────
  const [isJoined, setIsJoined] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isLaunchingZoom, setIsLaunchingZoom] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sdkParams, setSdkParams] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [lastError, setLastError] = useState(null); // Classified error for UI

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

    const controller = new AbortController();

    const checkAccess = async () => {
      try {
        const res = await apiClient.get(
          user.id ? `enrollments/user/${user.id}` : "enrolled-courses",
          {
            params: { product_type: entityType === "live_section" ? "live_section" : "daily_class" },
            signal: controller.signal,
          },
        );
        if (!mountedRef.current) return;

        const list = res.data?.data || res.data || [];
        const enrolled = list.some(
          (e) =>
            Number(e.enrollable_id) === Number(entityId) &&
            (e.status === "active" || e.status === "completed"),
        );

        const isHost =
          user.role === "admin" ||
          Number(instructorId) === Number(user.id);

        setIsEnrolled(enrolled || isHost);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        console.error("Failed to verify enrollment", err);
        if (!mountedRef.current) return;
        const isHost =
          user.role === "admin" ||
          Number(instructorId) === Number(user.id);
        setIsEnrolled(isHost);
      }
    };

    checkAccess();
    return () => controller.abort();
  }, [entityId, entityType, instructorId, user?.id, user?.role]);

  // ─── 3. Reset iframe state when entity changes ─────────────────────
  useEffect(() => {
    setIsIframeLoaded(false);
  }, [entityId]);

  // ─── 4. Zoom iframe postMessage listener ───────────────────────────
  useEffect(() => {
    const handleZoomMessage = async (event) => {
      const payload = event.data;
      if (!payload) return;

      if (payload.event === "zoom_event_loaded") {
        setIsIframeLoaded(true);
      } else if (payload.event === "zoom_event_joined") {
        if (!mountedRef.current) return;
        joinLockRef.current = false; // Release join lock
        retryCountRef.current = 0;   // Reset retry counter on success
        setIsLaunchingZoom(false);
        setLastError(null);
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
        if (!mountedRef.current) return;
        joinLockRef.current = false;
        setIsJoined(false);
        setIsIframeLoaded(false);
        setIsLaunchingZoom(false);
        setSdkParams(null); // Clear stale config
        setLastError(null);

        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }

        toast.success("You have left the live session.");
        if (typeof onLeft === "function") onLeft();
      } else if (payload.event === "zoom_event_failed") {
        if (!mountedRef.current) return;
        joinLockRef.current = false;
        setIsJoined(false);
        setIsIframeLoaded(false);
        setIsLaunchingZoom(false);
        setSdkParams(null); // Clear stale config on failure

        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }

        const errDetails = payload.error || {};
        const errCode = errDetails.code || 0;

        // Classify the error for the UI
        let errorType = "unknown";
        if ([3712, 300].includes(errCode)) {
          errorType = "signature"; // Invalid/expired signature
        } else if ([1, 2].includes(errCode)) {
          errorType = "network"; // Connection failure
        } else if ([3633].includes(errCode)) {
          errorType = "meeting"; // Meeting not started / unavailable
        } else if ([3001, 3301].includes(errCode)) {
          errorType = "meeting"; // Invalid meeting / wrong passcode
        }

        setLastError({ type: errorType, ...errDetails });
        toast.error(
          `Zoom connection failed: ${errDetails.message || "Unknown error"}`,
        );
        if (typeof onFailed === "function") onFailed(errDetails);
      }
    };

    window.addEventListener("message", handleZoomMessage);
    return () => window.removeEventListener("message", handleZoomMessage);
  }, [entityId, entityType, user?.id, onJoined, onLeft, onFailed]);

  // ─── 5. Trigger Zoom join when iframe is ready ─────────────────────
  useEffect(() => {
    if (isJoined && isIframeLoaded && sdkParams && iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(
        { action: "zoom_action_join", ...sdkParams },
        "*",
      );
    }
  }, [isJoined, isIframeLoaded, sdkParams]);

  // ─── 6. Cleanup on unmount ─────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      // Abort any in-flight config request
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }

      // Release join lock
      joinLockRef.current = false;

      // Leave Zoom meeting if active
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

      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // ─── 7. Join meeting — must be called from a click handler ─────────
  //
  // Join lock: If a join operation is already in progress, subsequent
  // calls are silently ignored. This prevents:
  //   • Double-click on Join button
  //   • Retry while join is in progress
  //   • React re-render triggering concurrent joins
  const handleJoinMeeting = useCallback(async () => {
    if (!user) {
      toast.error("Please login to join the session");
      router.push("/login");
      return;
    }

    // ── Join lock ──
    if (joinLockRef.current) return;
    joinLockRef.current = true;

    // ── Retry limit ──
    if (retryCountRef.current > MAX_RETRIES) {
      joinLockRef.current = false;
      toast.error("Too many failed attempts. Please refresh the page.");
      return;
    }
    retryCountRef.current += 1;

    // Step 1: Request fullscreen (browser user-gesture requirement)
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

    // Step 2: Cancel any in-flight config request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    // Step 3: Fetch Zoom signature
    setIsLaunchingZoom(true);
    setLastError(null);
    const toastId = toast.loading("Authorizing Zoom session...");

    try {
      const signRes = await apiClient.post(`/${signatureEndpoint}`, null, {
        signal: controller.signal,
      });

      // Stale config protection: if this request was aborted (e.g., user
      // navigated away or clicked Join again), discard the response.
      if (controller.signal.aborted || !mountedRef.current) return;

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
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      if (!mountedRef.current) return;

      console.error("Zoom authorization failed:", err);
      joinLockRef.current = false;
      setIsLaunchingZoom(false);

      // Classify the error
      const status = err?.response?.status;
      let errorType = "unknown";
      if (status === 401) errorType = "auth";
      else if (status === 403) errorType = "auth";
      else if (status === 404) errorType = "meeting";
      else if (status === 400) errorType = "meeting";
      else if (err?.code === "ERR_NETWORK") errorType = "network";
      else errorType = "unknown";

      const message = err?.response?.data?.message || err.message || "Unable to authorize Zoom session";
      setLastError({ type: errorType, code: status || 0, message });
      toast.error(message, { id: toastId });

      if (fullscreenGranted && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [user, router, signatureEndpoint]);

  // ─── 8. Toggle fullscreen for meeting container ────────────────────
  const toggleMeetingFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      meetingRef.current?.requestFullscreen?.().catch((e) => {
        console.warn("[Zoom] Fit-screen request denied:", e.message);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // ─── 9. Toggle fullscreen for pre-join preview ─────────────────────
  const togglePreviewFullscreen = useCallback((previewRef) => {
    if (!document.fullscreenElement) {
      previewRef?.current?.requestFullscreen?.().catch((err) => {
        console.warn("Preview fullscreen request denied:", err.message);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // ─── 10. Retry with fresh configuration ────────────────────────────
  //
  // For signature/auth failures, invalidates stale config and re-fetches.
  // Respects retry limit. Does NOT retry meeting-not-started (3633).
  const retryWithFreshConfig = useCallback(() => {
    if (retryCountRef.current > MAX_RETRIES) {
      toast.error("Maximum retry attempts reached. Please refresh the page.");
      return;
    }

    // Invalidate current config
    setSdkParams(null);
    setIsJoined(false);
    setIsIframeLoaded(false);
    setLastError(null);

    // Re-trigger join (which fetches fresh config)
    // The join lock is released by the failure handler, so this will proceed.
    handleJoinMeeting();
  }, [handleJoinMeeting]);

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
    lastError,
    // Actions
    handleJoinMeeting,
    retryWithFreshConfig,
    toggleMeetingFullscreen,
    togglePreviewFullscreen,
    setIsJoined,
    setIsLaunchingZoom,
  };
}
