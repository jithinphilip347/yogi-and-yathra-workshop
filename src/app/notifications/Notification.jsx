"use client";
import React, { useState } from "react";
import { FiClock, FiX, FiCheck, FiChevronLeft, FiChevronRight } from "react-icons/fi";
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
import { resolveMediaUrl } from "@/utils/mediaUrl";
import defaultCourseImg from "@/assets/images/courseImg-1.webp";
import "@/assets/css/notification.css";

const formatNotificationTime = (isoString) => {
  if (!isoString) return { time: "", date: "" };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { time: "", date: "" };

    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    let date = d.toLocaleDateString([], { month: "short", day: "numeric" });
    if (isToday) date = "Today";
    else if (isYesterday) date = "Yesterday";

    return { time, date };
  } catch {
    return { time: "", date: "" };
  }
};

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

  const handleCardClick = (notif) => {
    if (!notif.is_read) {
      markReadMutation.mutate(notif.id);
    }
    if (notif.action_url) {
      router.push(notif.action_url);
    }
  };

  const handleMarkAsRead = (e, notif) => {
    e.stopPropagation();
    if (!notif.is_read) {
      markReadMutation.mutate(notif.id);
    }
  };

  const handleDelete = (e, notif) => {
    e.stopPropagation();
    deleteMutation.mutate(notif.id);
  };

  const handleMarkAllAsRead = () => {
    markAllReadMutation.mutate();
  };

  return (
    <div id="Notification">
      <div className="container">
        {isAuthenticated && (
          <div className="NotificationTopBar">
            {unreadCount > 0 && (
              <button
                className="ActionBtn"
                onClick={handleMarkAllAsRead}
                disabled={markAllReadMutation.isPending}
              >
                <FiCheck className="Icon" /> Mark all as read
              </button>
            )}
          </div>
        )}

        <div className="NotificationList">
          {!isAuthenticated ? (
            <div className="EmptyState">
              <h3>Please Log In</h3>
              <p>You need to be logged in to view your notifications.</p>
              <div style={{ marginTop: "16px" }}>
                <Link
                  href="/auth/login"
                  style={{
                    padding: "8px 20px",
                    background: "var(--primaryColor, #ff725e)",
                    color: "#fff",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Log In
                </Link>
              </div>
            </div>
          ) : isLoading ? (
            <div className="EmptyState">
              <h3>Loading notifications...</h3>
              <p>Please wait a moment.</p>
            </div>
          ) : isError ? (
            <div className="EmptyState">
              <h3>Failed to load notifications</h3>
              <p>Something went wrong while retrieving your notifications.</p>
              <div style={{ marginTop: "16px" }}>
                <button
                  onClick={() => refetch()}
                  style={{
                    padding: "8px 20px",
                    background: "var(--primaryColor, #ff725e)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : notifications.length > 0 ? (
            <>
              <div className="NotifItems">
                {notifications.map((notif) => {
                  const { time, date } = formatNotificationTime(notif.created_at);
                  const imageUrl = resolveMediaUrl(
                    notif.metadata?.thumbnail || notif.metadata?.image,
                    defaultCourseImg.src
                  );

                  return (
                    <div
                      className={`NotifCard ${notif.is_read ? "read" : "unread"}`}
                      key={notif.id}
                      onClick={() => handleCardClick(notif)}
                      style={{ cursor: notif.action_url ? "pointer" : "default" }}
                    >
                      <div className="CardLeft">
                        <div className="ImageWrapper">
                          <img src={imageUrl} alt={notif.title} />
                        </div>
                        <div className="NotifContent">
                          <h5>{notif.title}</h5>
                          <p>{notif.body}</p>
                        </div>
                      </div>

                      <div className="CardRight">
                        <div className="NotifDateTime">
                          <span>{date}</span>
                          {time && (
                            <span className="Time">
                              <FiClock /> {time}
                            </span>
                          )}
                        </div>

                        <div className="CardActions">
                          {!notif.is_read && (
                            <button
                              className="MarkReadBtn"
                              onClick={(e) => handleMarkAsRead(e, notif)}
                              title="Mark as read"
                              aria-label="Mark as read"
                            >
                              <FiCheck />
                            </button>
                          )}
                          <button
                            className="DeleteBtn"
                            onClick={(e) => handleDelete(e, notif)}
                            title="Delete Notification"
                            aria-label="Delete Notification"
                          >
                            <FiX />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {meta.last_page > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "12px",
                    marginTop: "30px",
                  }}
                >
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page <= 1}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "8px 16px",
                      border: "1px solid #e2e8f0",
                      background: page <= 1 ? "#f8fafc" : "#fff",
                      color: page <= 1 ? "#94a3b8" : "#1e293b",
                      borderRadius: "8px",
                      cursor: page <= 1 ? "not-allowed" : "pointer",
                      fontWeight: 500,
                    }}
                  >
                    <FiChevronLeft /> Previous
                  </button>

                  <span style={{ fontSize: "14px", color: "#64748b" }}>
                    Page {meta.current_page} of {meta.last_page}
                  </span>

                  <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, meta.last_page))}
                    disabled={page >= meta.last_page}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "8px 16px",
                      border: "1px solid #e2e8f0",
                      background: page >= meta.last_page ? "#f8fafc" : "#fff",
                      color: page >= meta.last_page ? "#94a3b8" : "#1e293b",
                      borderRadius: "8px",
                      cursor: page >= meta.last_page ? "not-allowed" : "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Next <FiChevronRight />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="EmptyState">
              <h3>No notifications yet.</h3>
              <p>You&apos;re all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notification;