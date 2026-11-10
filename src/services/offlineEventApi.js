import apiClient from "./apiClient";
import { resolveMediaUrl } from "@/utils/mediaUrl";

const unwrap = (response) => response?.data?.data ?? response?.data ?? null;

export const offlineEventApi = {
  async list(params = {}) {
    const response = await apiClient.get("public/offline-events", { params });
    const payload = unwrap(response);
    return Array.isArray(payload) ? payload : [];
  },
  async listPage(params = {}, options = {}) {
    const response = await apiClient.get("public/offline-events", { ...options, params });
    const payload = response?.data;
    const records = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];
    return {
      data: records,
      meta: payload?.meta || null,
      links: payload?.links || null,
    };
  },
  async get(id) {
    const response = await apiClient.get(`public/offline-events/${encodeURIComponent(id)}`);
    return unwrap(response);
  },
};

const dateLabel = (value) => {
  if (!value) return "";
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const displayStatus = (status) => ({
  open: "Booking Open",
  almost_full: "Almost Full",
  full: "Fully Booked",
  upcoming: "Registration Upcoming",
  closed: "Registration Closed",
  unavailable: "Unavailable",
}[status] || "Upcoming");

export function adaptOfflineEvent(event) {
  if (!event) return null;
  const start = event.event_start_date || event.event_date;
  const end = event.event_end_date || start;
  const startLabel = dateLabel(start);
  const endLabel = dateLabel(end);
  const date = !startLabel ? "Date to be announced" : start === end ? startLabel : `${startLabel} – ${endLabel}`;
  const durationDays = start && end ? Math.max(1, Math.floor((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1) : null;
  const minutes = Number(event.duration_minutes);
  const duration = durationDays ? `${durationDays} ${durationDays === 1 ? "Day" : "Days"}${minutes ? ` · ${minutes} min/session` : ""}` : minutes ? `${minutes} min` : "";
  const available = event.available_seats;
  return {
    ...event,
    image: resolveMediaUrl(event.thumbnail, ""),
    videoUrl: event.intro_video || "",
    date,
    duration,
    venue: event.venue_name || "",
    location: event.address || "",
    price: event.ticket_price == null ? "" : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(event.ticket_price)),
    seats: available == null ? "Unlimited seats" : `${available} ${available === 1 ? "Seat" : "Seats"} Left`,
    status: displayStatus(event.public_booking_status),
    link: `/event/${encodeURIComponent(event.slug || event.id)}`,
  };
}

export { dateLabel as formatOfflineEventDate, displayStatus as formatOfflineEventStatus };
