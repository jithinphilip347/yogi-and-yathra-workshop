"use client";
import React from "react";
import Image from "next/image";
import { FiClock, FiCheck, FiX, FiVideo, FiCalendar, FiBookOpen, FiCreditCard, FiAward, FiBell } from "react-icons/fi";
import { formatRelativeTime, formatNotificationDateTime, getNotificationCategoryMeta, getSafeActionUrl } from "@/utils/notificationHelpers";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import defaultCourseImg from "@/assets/images/courseImg-1.webp";

/**
 * Category Icon Mapper
 */
const getCategoryIcon = (variant) => {
  switch (variant) {
    case "live":
      return <FiVideo className="CategoryIcon" />;
    case "daily":
      return <FiCalendar className="CategoryIcon" />;
    case "course":
      return <FiBookOpen className="CategoryIcon" />;
    case "payment":
      return <FiCreditCard className="CategoryIcon" />;
    case "certificate":
      return <FiAward className="CategoryIcon" />;
    default:
      return <FiBell className="CategoryIcon" />;
  }
};

/**
 * Reusable Notification Item Presentation Component.
 * Supports both compact (popover) and expanded (center page) modes with full a11y & responsive support.
 */
const NotificationItem = ({
  notification,
  onSelect,
  onMarkRead,
  onDelete,
  compact = false,
  showActions = true,
}) => {
  if (!notification) return null;

  const {
    id,
    title = "Notification",
    body = "",
    category = "general",
    type = "",
    created_at,
    is_read = false,
    action_url = null,
    metadata = {},
  } = notification;

  const { label: categoryLabel, variant } = getNotificationCategoryMeta(category, type);
  const relativeTime = formatRelativeTime(created_at);
  const { time: detailTime, date: detailDate } = formatNotificationDateTime(created_at);
  const hasAction = Boolean(getSafeActionUrl(action_url));

  const imageSrc = metadata?.thumbnail || metadata?.image;
  const resolvedThumbnail = imageSrc ? resolveMediaUrl(imageSrc) : null;

  const handleClick = (e) => {
    if (onSelect) {
      onSelect(notification, e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(e);
    }
  };

  const handleMarkReadClick = (e) => {
    e.stopPropagation();
    if (onMarkRead) {
      onMarkRead(notification, e);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification, e);
    }
  };

  const ariaLabelText = `${is_read ? "" : "Unread. "}${categoryLabel}: ${title}. ${body || ""}. ${relativeTime || ""}`;

  return (
    <div
      className={`NotificationItem ${compact ? "NotificationItem--compact" : "NotificationItem--card"} ${
        is_read ? "is-read" : "is-unread"
      } ${hasAction ? "is-clickable" : ""}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={ariaLabelText}
      data-id={id}
    >
      {/* Visual unread bar / indicator */}
      {!is_read && <span className="NotificationItem__unreadIndicator" aria-hidden="true" />}

      {/* Thumbnail or Category Icon Badge */}
      {!compact && (
        <div className="NotificationItem__media">
          {resolvedThumbnail ? (
            <img
              src={resolvedThumbnail}
              alt={title}
              className="NotificationItem__thumb"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = defaultCourseImg.src;
              }}
            />
          ) : (
            <div className={`NotificationItem__iconBadge iconBadge--${variant}`}>
              {getCategoryIcon(variant)}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="NotificationItem__content">
        <div className="NotificationItem__metaRow">
          <span className={`NotificationItem__categoryTag tag--${variant}`}>
            {getCategoryIcon(variant)} {categoryLabel}
          </span>
          <span className="NotificationItem__timestamp" title={created_at ? new Date(created_at).toLocaleString() : ""}>
            {compact ? relativeTime : detailDate || relativeTime}
            {!compact && detailTime && (
              <span className="NotificationItem__timeDetail">
                <FiClock className="ClockIcon" /> {detailTime}
              </span>
            )}
          </span>
        </div>

        <h5 className="NotificationItem__title">{title}</h5>
        {body && <p className="NotificationItem__body">{body}</p>}
      </div>

      {/* Actions (Mark read, Delete, or Unread Dot in Compact Mode) */}
      <div className="NotificationItem__actions">
        {compact ? (
          <>
            {!is_read && <span className="NotificationItem__unreadDot" title="Unread" aria-hidden="true" />}
          </>
        ) : (
          showActions && (
            <div className="NotificationItem__btnGroup">
              {!is_read && onMarkRead && (
                <button
                  type="button"
                  className="NotificationItem__actionBtn NotificationItem__actionBtn--read"
                  onClick={handleMarkReadClick}
                  title="Mark as read"
                  aria-label="Mark notification as read"
                >
                  <FiCheck />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  className="NotificationItem__actionBtn NotificationItem__actionBtn--delete"
                  onClick={handleDeleteClick}
                  title="Delete notification"
                  aria-label="Delete notification"
                >
                  <FiX />
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
