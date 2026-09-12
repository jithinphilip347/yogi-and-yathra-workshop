import { useContext } from "react";
import { PushNotificationContext } from "@/context/PushNotificationContext";

/**
 * Consumer hook for Web Push notifications.
 *
 * Reads authoritative state and actions from PushNotificationProvider.
 * Multiple invocations across components (Nav, NotificationPopover, Preferences)
 * consume the same shared state and NEVER trigger redundant device registrations.
 */
export const usePushNotifications = () => {
  const context = useContext(PushNotificationContext);

  if (!context) {
    // Fallback if rendered outside of PushNotificationProvider (e.g. isolated test environments)
    return {
      isSupported: false,
      permission: "default",
      isSubscribed: false,
      isLoading: false,
      error: null,
      subscribe: async () => false,
      unsubscribe: async () => false,
      syncSubscription: async () => {},
    };
  }

  return context;
};

export default usePushNotifications;
