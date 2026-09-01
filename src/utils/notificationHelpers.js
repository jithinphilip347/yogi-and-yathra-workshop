/**
 * Utility helpers for notification presentation, formatting, and route handling.
 */

/**
 * Format timestamp into a human-friendly relative string.
 *
 * @param {string|Date} isoString
 * @returns {string}
 */
export const formatRelativeTime = (isoString) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) {
      return "Just now";
    }
    if (diffMin < 60) {
      return `${diffMin}m ago`;
    }
    if (diffHours < 24 && d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      return `${diffHours}h ago`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear()
    ) {
      return "Yesterday";
    }

    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

/**
 * Format full date and time for detail views.
 *
 * @param {string|Date} isoString
 * @returns {{ date: string, time: string }}
 */
export const formatNotificationDateTime = (isoString) => {
  if (!isoString) return { date: "", time: "" };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: "", time: "" };

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

    return { date, time };
  } catch {
    return { date: "", time: "" };
  }
};

/**
 * Get category display metadata (label, CSS variant class).
 *
 * @param {string} category
 * @param {string} type
 * @returns {{ label: string, variant: string }}
 */
export const getNotificationCategoryMeta = (category = "", type = "") => {
  const cat = (category || "").toLowerCase();
  const t = (type || "").toLowerCase();

  if (cat === "live_class" || t.includes("live_class") || t.includes("live_section")) {
    return { label: "Live Class", variant: "live" };
  }
  if (cat === "daily_class" || t.includes("daily_class") || t.includes("upcoming_class")) {
    return { label: "Daily Class", variant: "daily" };
  }
  if (cat === "course" || t.includes("course") || t.includes("enrollment")) {
    return { label: "Course", variant: "course" };
  }
  if (cat === "payment" || t.includes("payment") || t.includes("order")) {
    return { label: "Payment", variant: "payment" };
  }
  if (cat === "certificate" || t.includes("certificate")) {
    return { label: "Certificate", variant: "certificate" };
  }
  return { label: "General", variant: "general" };
};

/**
 * Sanitize and validate action URL for internal routing.
 *
 * @param {string|null|undefined} url
 * @returns {string|null}
 */
export const getSafeActionUrl = (url) => {
  if (!url || typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();

  // Block dangerous schemes
  if (/^(javascript:|data:|vbscript:|file:)/i.test(trimmed)) {
    return null;
  }

  // Internal path (e.g. /live-stream/1/flow, /daily-class/2/routine, /course/3/yoga)
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  // If absolute http(s) URL, parse safely
  try {
    const parsed = new URL(trimmed, "http://localhost");
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return null;
  }

  return null;
};
