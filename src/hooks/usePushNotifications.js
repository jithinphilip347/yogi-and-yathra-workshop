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

  // Synchronize initial browser support and permission
  useEffect(() => {
    const supported = isWebPushSupported();
    setIsSupported(supported);

    if (supported) {
      setPermission(getPushPermissionState());

      // Check existing subscription
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.ready
          .then((reg) => reg.pushManager.getSubscription())
          .then((sub) => {
            setIsSubscribed(!!sub);
          })
          .catch(() => {
            setIsSubscribed(false);
          });
      }
    }
  }, [isAuthenticated]);

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
        setError(err.message || "An unexpected error occurred.");
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
      setError(err.message || "An unexpected error occurred.");
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
  };
};

export default usePushNotifications;
