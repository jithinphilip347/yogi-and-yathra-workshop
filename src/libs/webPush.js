import notificationApi from "@/libs/notificationApi";

/**
 * Converts a base64 VAPID public key string into a Uint8Array required by PushManager.
 *
 * @param {string} base64String
 * @returns {Uint8Array}
 */
export function urlBase64ToUint8Array(base64String) {
  if (!base64String) {
    throw new Error("Base64 string is required");
  }

  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Checks if the browser supports native Web Push notifications.
 *
 * @returns {boolean}
 */
export function isWebPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Get current browser notification permission state.
 *
 * @returns {"granted" | "denied" | "default" | "unsupported"}
 */
export function getPushPermissionState() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Registers the Web Push Service Worker.
 *
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerPushServiceWorker() {
  if (!isWebPushSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error("Failed to register Service Worker for Push:", error);
    return null;
  }
}

// Module-level in-flight promise deduplicator and registered fingerprint cache
let inFlightSubscriptionPromise = null;
let lastRegisteredFingerprint = null;

/**
 * Clear the in-memory registration cache (e.g. on logout or for testing).
 */
export function clearRegistrationCache() {
  lastRegisteredFingerprint = null;
  inFlightSubscriptionPromise = null;
}

/**
 * Subscribe the current browser to native Web Push notifications.
 *
 * @param {Object} [deviceMetadata={}] - Optional metadata { device_name, platform, browser }
 * @param {string|number|null} [userId=null] - Current authenticated user ID for fingerprinting
 * @param {boolean} [force=false] - Force backend re-registration even if fingerprint matches
 * @returns {Promise<{ success: boolean, subscription?: PushSubscription, alreadyRegistered?: boolean, error?: string }>}
 */
export async function subscribeToPushNotifications(
  deviceMetadata = {},
  userId = null,
  force = false
) {
  if (!isWebPushSupported()) {
    return { success: false, error: "Web Push is not supported in this browser" };
  }

  // Deduplicate concurrent in-flight subscription attempts
  if (inFlightSubscriptionPromise && !force) {
    return inFlightSubscriptionPromise;
  }

  const executeSubscription = async () => {
    try {
      // 1. Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return { success: false, error: "Notification permission was not granted" };
      }

      // 2. Register or get existing Service Worker registration
      const registration = await registerPushServiceWorker();
      if (!registration) {
        return { success: false, error: "Failed to register Service Worker" };
      }

      // Fast check: if subscription already exists and fingerprint matches, avoid network calls
      let subscription = await registration.pushManager.getSubscription();
      const currentFingerprint = subscription
        ? `${userId || "anon"}:${subscription.endpoint}`
        : null;

      if (!force && currentFingerprint && lastRegisteredFingerprint === currentFingerprint) {
        return { success: true, subscription, alreadyRegistered: true };
      }

      // 3. Fetch VAPID public key from backend API
      const response = await notificationApi.getPushPublicKey();
      const publicKey = response?.data?.data?.public_key || response?.data?.public_key;

      if (!publicKey) {
        return { success: false, error: "Failed to retrieve VAPID public key from server" };
      }

      // 4. Subscribe to PushManager with active VAPID applicationServerKey
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // If existing subscription has mismatched applicationServerKey, renew it
      if (subscription) {
        try {
          const currentKeyBuffer = subscription.options?.applicationServerKey;
          if (currentKeyBuffer) {
            const currentKeyArray = new Uint8Array(currentKeyBuffer);
            const isKeyMatch =
              currentKeyArray.length === applicationServerKey.length &&
              currentKeyArray.every((val, idx) => val === applicationServerKey[idx]);

            if (!isKeyMatch) {
              await subscription.unsubscribe();
              subscription = null;
            }
          }
        } catch (e) {
          // Fallback: continue with subscription check
        }
      }

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      const postFingerprint = `${userId || "anon"}:${subscription.endpoint}`;
      if (!force && lastRegisteredFingerprint === postFingerprint) {
        return { success: true, subscription, alreadyRegistered: true };
      }

      const subscriptionJson = subscription.toJSON();

      // 5. Send endpoint and cryptographic keys to backend API
      await notificationApi.subscribePush({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscriptionJson.keys?.p256dh || "",
          auth: subscriptionJson.keys?.auth || "",
        },
        browser: deviceMetadata.browser || (typeof navigator !== "undefined" ? (navigator.userAgent.includes("Edg") ? "Edge" : navigator.userAgent.includes("Chrome") ? "Chrome" : navigator.userAgent.includes("Firefox") ? "Firefox" : navigator.userAgent.includes("Safari") ? "Safari" : "Browser") : "Browser"),
        platform: deviceMetadata.platform || (typeof navigator !== "undefined" ? navigator.platform : "Web"),
        device_name: deviceMetadata.device_name || "Web Browser",
      });

      // Cache the successful registration fingerprint
      lastRegisteredFingerprint = postFingerprint;

      return { success: true, subscription };
    } catch (error) {
      console.error("Error subscribing to Web Push:", error);
      return { success: false, error: error.message || "Failed to subscribe to Web Push" };
    } finally {
      inFlightSubscriptionPromise = null;
    }
  };

  inFlightSubscriptionPromise = executeSubscription();
  return inFlightSubscriptionPromise;
}

/**
 * Unsubscribe the current browser device from Web Push notifications.
 *
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function unsubscribeFromPushNotifications() {
  if (!isWebPushSupported()) {
    return { success: false, error: "Web Push is not supported in this browser" };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      // Notify backend to remove/revoke the device record
      await notificationApi.unsubscribePush({ endpoint });
    }

    lastRegisteredFingerprint = null;
    return { success: true };
  } catch (error) {
    console.error("Error unsubscribing from Web Push:", error);
    return { success: false, error: error.message || "Failed to unsubscribe from Web Push" };
  }
}
