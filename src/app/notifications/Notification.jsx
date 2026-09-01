"use client";
import React, { useState } from "react";
import { FiCheck, FiChevronLeft, FiChevronRight, FiBell, FiRefreshCw } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Link from "next/link";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import { getSafeActionUrl } from "@/utils/notificationHelpers";
import NotificationItem from "@/components/notifications/NotificationItem";
import "@/assets/css/notification.css";

const Notification = () => {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [page, setPage] = useState(1);

  const {
    data: notificationResponse,
    isLoading,
    isError,
    refetch,
  } = useNotifications({
    page,
    per_page: 10,
  });

  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const notifications = notificationResponse?.data || [];
  const meta = notificationResponse?.meta || { current_page: 1, last_page: 1, total: 0 };

  const handleNotificationSelect = (notif) => {
    if (!notif.is_read) {
      markReadMutation.mutate(notif.id);
    }
    const targetUrl = getSafeActionUrl(notif.action_url);
    if (targetUrl) {
      router.push(targetUrl);
    }
  };

  const handleMarkAsRead = (notif) => {
    if (!notif.is_read) {
      markReadMutation.mutate(notif.id);
    }
  };

  const handleDelete = (notif) => {
    deleteMutation.mutate(notif.id);
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0 && !markAllReadMutation.isPending) {
      markAllReadMutation.mutate();
    }
  };

  return (
    <div id="Notification">
      <div className="container">
        {/* Page Header */}
        <div className="NotificationHeaderSection">
          <div className="HeaderTitleWrapper">
            <h1 className="PageHeading">Notifications</h1>
            {isAuthenticated && unreadCount > 0 && (
              <span className="UnreadPill">
                {unreadCount > 99 ? "99+" : unreadCount} unread
              </span>
            )}
          </div>

          {isAuthenticated && unreadCount > 0 && (
            <button
              type="button"
              className="MarkAllBtn"
              onClick={handleMarkAllAsRead}
              disabled={markAllReadMutation.isPending}
              title="Mark all notifications as read"
              aria-label="Mark all notifications as read"
            >
              <FiCheck className="Icon" /> Mark all as read
            </button>
          )}
        </div>

        {/* Content Section */}
        <div className="NotificationList">
          {!isAuthenticated ? (
            <div className="NotificationStateBox empty">
              <FiBell className="StateIcon" />
              <h3>Please Log In</h3>
              <p>You need to be logged in to view and manage your notifications.</p>
              <div style={{ marginTop: "20px" }}>
                <Link href="/auth/login" className="PrimaryActionBtn">
                  Log In
                </Link>
              </div>
            </div>
          ) : isLoading ? (
            <div className="NotificationLoadingList">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="SkeletonCard">
                  <div className="SkeletonThumb"></div>
                  <div className="SkeletonContent">
                    <div className="SkeletonBar short"></div>
                    <div className="SkeletonBar medium"></div>
                    <div className="SkeletonBar long"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="NotificationStateBox error">
              <FiBell className="StateIcon" />
              <h3>Failed to load notifications</h3>
              <p>Something went wrong while retrieving your notifications.</p>
              <div style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="PrimaryActionBtn"
                >
                  <FiRefreshCw /> Retry
                </button>
              </div>
            </div>
          ) : notifications.length > 0 ? (
            <>
              <div className="NotifItems">
                {notifications.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onSelect={handleNotificationSelect}
                    onMarkRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    compact={false}
                    showActions={true}
                  />
                ))}
              </div>

              {/* Server-side Pagination */}
              {meta.last_page > 1 && (
                <div className="NotificationPagination">
                  <button
                    type="button"
                    className="PaginationBtn"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page <= 1}
                    aria-label="Previous Page"
                  >
                    <FiChevronLeft /> Previous
                  </button>

                  <span className="PaginationInfo">
                    Page {meta.current_page} of {meta.last_page} ({meta.total} total)
                  </span>

                  <button
                    type="button"
                    className="PaginationBtn"
                    onClick={() => setPage((prev) => Math.min(prev + 1, meta.last_page))}
                    disabled={page >= meta.last_page}
                    aria-label="Next Page"
                  >
                    Next <FiChevronRight />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="NotificationStateBox empty">
              <FiBell className="StateIcon" />
              <h3>No notifications yet</h3>
              <p>You&apos;re completely caught up! We will notify you when exciting updates occur.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notification;