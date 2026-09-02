"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiCheck, FiRefreshCw, FiBell, FiChevronRight } from "react-icons/fi";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { getSafeActionUrl } from "@/utils/notificationHelpers";
import NotificationItem from "./NotificationItem";

const NotificationPopover = ({ isOpen, onClose }) => {
  const router = useRouter();
  const popoverRef = useRef(null);

  // Initialize push notification subscription auto-sync for authenticated sessions
  const { isSupported: isPushSupported, permission: pushPermission, subscribe: subscribePush } = usePushNotifications();

  const {
    data: notificationResponse,
    isLoading,
    isError,
    refetch,
  } = useNotifications({
    page: 1,
    per_page: 6,
  });

  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications = notificationResponse?.data || [];

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      markReadMutation.mutate(notif.id);
    }
    onClose();

    const targetUrl = getSafeActionUrl(notif.action_url);
    if (targetUrl) {
      router.push(targetUrl);
    }
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    if (unreadCount > 0 && !markAllReadMutation.isPending) {
      markAllReadMutation.mutate();
    }
  };

  return (
    <div
      className="NotificationPopover"
      ref={popoverRef}
      role="dialog"
      aria-label="Notifications popover"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="PopoverHeader">
        <div className="HeaderTitleBox">
          <h4>Notifications</h4>
          {unreadCount > 0 && (
            <span className="UnreadCountPill">
              {unreadCount > 99 ? "99+" : unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            className="MarkAllBtn"
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
            title="Mark all as read"
            aria-label="Mark all notifications as read"
          >
            <FiCheck /> Mark all read
          </button>
        )}
      </div>

      {/* Push Enable Banner if permission is default */}
      {isPushSupported && pushPermission === "default" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 14px",
            background: "#f0fdf4",
            borderBottom: "1px solid #dcfce7",
            gap: "10px",
            fontSize: "12px",
          }}
        >
          <span style={{ color: "#166534", fontWeight: "500" }}>
            Enable desktop push alerts
          </span>
          <button
            type="button"
            onClick={() => subscribePush()}
            style={{
              padding: "4px 10px",
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Enable
          </button>
        </div>
      )}

      {/* Body List */}
      <div className="PopoverBody">
        {isLoading ? (
          <div className="PopoverLoading">
            <div className="SkeletonItem">
              <div className="SkeletonLine short"></div>
              <div className="SkeletonLine"></div>
            </div>
            <div className="SkeletonItem">
              <div className="SkeletonLine short"></div>
              <div className="SkeletonLine"></div>
            </div>
            <div className="SkeletonItem">
              <div className="SkeletonLine short"></div>
              <div className="SkeletonLine"></div>
            </div>
          </div>
        ) : isError ? (
          <div className="PopoverStateBox">
            <p>Failed to load notifications</p>
            <button
              className="RetryBtn"
              onClick={() => refetch()}
              type="button"
            >
              <FiRefreshCw /> Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="PopoverStateBox empty">
            <FiBell className="EmptyIcon" />
            <p className="EmptyTitle">No notifications yet</p>
            <span className="EmptySubtitle">You&apos;re completely up to date!</span>
          </div>
        ) : (
          <div className="PopoverList">
            {notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onSelect={handleNotificationClick}
                compact={true}
                showActions={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="PopoverFooter">
        <Link
          href="/notifications"
          className="ViewAllLink"
          onClick={onClose}
        >
          View all notifications <FiChevronRight />
        </Link>
      </div>
    </div>
  );
};

export default NotificationPopover;
