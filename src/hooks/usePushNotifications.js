import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  isWebPushSupported,
  getPushPermissionState,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/libs/webPush";

/**
 * Hook for managing Web Push subscription lifecycle in React components.
 */
export const usePushNotifications = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [permission, setPermission] = useState("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const syncSubscription = useCallback(async () => {
    if (!isWebPushSupported()) {
      return;
    }

    const currentPermission = getPushPermissionState();
    setPermission(currentPermission);

    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);

      // If user is authenticated and browser permission is granted, ensure backend has active device subscription
      if (isAuthenticated && currentPermission === "granted") {
        const result = await subscribeToPushNotifications();
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
    }
  }, [isAuthenticated]);

  // Synchronize initial browser support, permission, and listen for permission transitions
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
            syncSubscription();
          };
        })
        .catch((e) => {
          console.log(e)
        });
    }

    // Also re-verify on window focus (e.g. when user changes permission in browser site settings)
    const handleFocus = () => {
      syncSubscription();
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
        const result = await subscribeToPushNotifications(deviceMetadata);
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
    [isSupported]
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

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    syncSubscription,
  };
};

export default usePushNotifications;
