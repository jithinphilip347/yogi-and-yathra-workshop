"use client";
import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import {
  isWebPushSupported,
  getPushPermissionState,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/libs/webPush";

export const PushNotificationContext = createContext(null);

/**
 * Single Authoritative Provider for Web Push Notification Lifecycle.
 *
 * Ensures device registration is strictly idempotent and owned by a single component
 * at the application root, preventing duplicate registration calls across multiple UI components.
 */
export function PushNotificationProvider({ children }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth || {});
  const userId = user?.id || null;

  const [permission, setPermission] = useState("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const syncingRef = useRef(false);
  const permissionRef = useRef("default");

  const syncSubscription = useCallback(
    async (forced = false) => {
      if (!isWebPushSupported()) {
        return;
      }

      const currentPermission = getPushPermissionState();
      setPermission(currentPermission);
      permissionRef.current = currentPermission;

      if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
        return;
      }

      if (syncingRef.current && !forced) {
        return;
      }
      syncingRef.current = true;

      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);

        // If user is authenticated and browser permission is granted, ensure backend has active device subscription
        if (isAuthenticated && currentPermission === "granted") {
          const result = await subscribeToPushNotifications({}, userId, forced);
          if (result.success) {
            setIsSubscribed(true);
            setError(null);
          } else if (result.error) {
            console.warn("Web Push auto-synchronization notice:", result.error);
            setError(result.error);
          }
        }
      } catch (err) {
        console.warn("Web Push subscription check error:", err);
        setIsSubscribed(false);
      } finally {
        syncingRef.current = false;
      }
    },
    [isAuthenticated, userId]
  );

  // Authoritative lifecycle synchronization (runs ONCE per provider mount or when userId/auth toggles)
  useEffect(() => {
    const supported = isWebPushSupported();
    setIsSupported(supported);

    if (!supported) {
      return;
    }

    syncSubscription();

    // Listen to permission state change via Permissions API if supported
    let permissionStatusObj = null;
    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "notifications" })
        .then((permissionStatus) => {
          permissionStatusObj = permissionStatus;
          permissionStatus.onchange = () => {
            if (permissionRef.current !== permissionStatus.state) {
              syncSubscription(true);
            }
          };
        })
        .catch((e) => {
          console.log(e);
        });
    }

    // On window focus, ONLY re-sync if the browser permission has actually changed
    const handleFocus = () => {
      const freshPerm = getPushPermissionState();
      if (permissionRef.current !== freshPerm) {
        syncSubscription(true);
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      if (permissionStatusObj) {
        permissionStatusObj.onchange = null;
      }
    };
  }, [syncSubscription]);

  const subscribe = useCallback(
    async (deviceMetadata = {}) => {
      if (!isSupported) {
        setError("Web Push notifications are not supported in this browser.");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await subscribeToPushNotifications(deviceMetadata, userId, true);
        if (result.success) {
          setIsSubscribed(true);
          setPermission(getPushPermissionState());
          return true;
        } else {
          setError(result.error || "Failed to subscribe to notifications.");
          return false;
        }
      } catch (err) {
        const errMsg = err?.message || "An unexpected error occurred during subscription.";
        setError(errMsg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported, userId]
  );

  const unsubscribe = useCallback(async () => {
    if (!isSupported) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await unsubscribeFromPushNotifications();
      if (result.success) {
        setIsSubscribed(false);
        return true;
      } else {
        setError(result.error || "Failed to unsubscribe from notifications.");
        return false;
      }
    } catch (err) {
      setError(err?.message || "An unexpected error occurred.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const value = useMemo(
    () => ({
      isSupported,
      permission,
      isSubscribed,
      isLoading,
      error,
      subscribe,
      unsubscribe,
      syncSubscription,
    }),
    [
      isSupported,
      permission,
      isSubscribed,
      isLoading,
      error,
      subscribe,
      unsubscribe,
      syncSubscription,
    ]
  );

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
    </PushNotificationContext.Provider>
  );
}

export default PushNotificationProvider;
