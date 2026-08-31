import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { getEcho } from "@/libs/echo";
import toast from "react-hot-toast";

/**
 * Hook to manage real-time WebSocket subscription for in-app notifications.
 * Automatically updates TanStack Query caches, unread badge counter, and displays toast alerts.
 */
export const useNotificationRealtime = () => {
  const { user, isAuthenticated, token } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    const echo = getEcho(token);
    if (!echo) {
      return;
    }

    const channelName = `user.${user.id}`;
    const channel = echo.private(channelName);

    const handleNotification = (data) => {
      const newNotif = data?.notification;
      const newUnreadCount = data?.unread_count;

      if (!newNotif) {
        return;
      }

      // 1. Instantly update unread counter in TanStack Query cache
      queryClient.setQueryData(["notifications", "unread-count"], (prev) => {
        if (typeof newUnreadCount === "number") {
          return newUnreadCount;
        }
        return typeof prev === "number" ? prev + 1 : 1;
      });

      // 2. Real-time insertion: Prepend the new notification to active notification lists
      queryClient.setQueriesData({ queryKey: ["notifications"] }, (oldData) => {
        if (!oldData || !Array.isArray(oldData.data)) {
          return oldData;
        }

        // Deduplicate against duplicate broadcasts
        if (oldData.data.some((item) => item.id === newNotif.id)) {
          return oldData;
        }

        return {
          ...oldData,
          data: [newNotif, ...oldData.data],
          meta: oldData.meta
            ? { ...oldData.meta, total: (oldData.meta.total || 0) + 1 }
            : oldData.meta,
        };
      });

      // 3. Trigger in-app toast notification alert
      toast(newNotif.title || "New Notification", {
        icon: "🔔",
        id: `notif-${newNotif.id}`,
        duration: 4000,
      });
    };

    channel.listen(".notification.created", handleNotification);
    channel.listen("NotificationCreatedBroadcast", handleNotification);

    // Reconnection handling: Re-sync queries when connection recovers
    const handleReconnect = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    };

    const connection = echo.connector?.pusher?.connection;
    if (connection && typeof connection.bind === "function") {
      connection.bind("connected", handleReconnect);
    }

    return () => {
      if (connection && typeof connection.unbind === "function") {
        connection.unbind("connected", handleReconnect);
      }
      if (echo && user?.id) {
        echo.leave(channelName);
      }
    };
  }, [isAuthenticated, user?.id, token, queryClient]);
};

export default useNotificationRealtime;
