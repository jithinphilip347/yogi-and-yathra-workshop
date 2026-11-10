import apiClient from "./apiClient";
import { resolveMediaUrl } from "@/utils/mediaUrl";

const unwrap = (response) => response?.data?.data ?? response?.data ?? null;
const dateLabel = (value) => {
  if (!value) return "Date to be announced";
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export const travelPackageApi = {
  async list(params = {}) {
    const response = await apiClient.get("public/yoga-travel-packages", { params });
    const data = unwrap(response);
    return Array.isArray(data) ? data : [];
  },
  async listPage(params = {}, options = {}) {
    const response = await apiClient.get("public/yoga-travel-packages", { ...options, params });
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
    const response = await apiClient.get(`public/yoga-travel-packages/${encodeURIComponent(id)}`);
    return unwrap(response);
  },
};

const labels = {
  yoga_retreat: "Yoga Retreat",
  spiritual_journey: "Spiritual Journey",
  wellness_tour: "Wellness Tour",
};
const statusLabels = {
  open: "Booking Open",
  almost_full: "Almost Full",
  full: "Fully Booked",
  upcoming: "Upcoming",
  closed: "Registration Closed",
  unavailable: "Unavailable",
};

export function adaptTravelPackage(record) {
  if (!record) return null;
  const regular = Number(record.price_per_person) || 0;
  const discounted = record.discount_price == null ? null : Number(record.discount_price);
  const hasDiscount = discounted != null && discounted >= 0 && discounted < regular;
  const startDate = record.start_date || "";
  const endDate = record.end_date || "";
  const availableSlots = record.available_slots == null ? null : Number(record.available_slots);
  const totalSlots = record.total_slots == null ? null : Number(record.total_slots);
  const bookedSlots = Number(record.booked_slots) || 0;
  const formatDateRange = startDate
    ? `${dateLabel(startDate)}${endDate && endDate !== startDate ? ` – ${dateLabel(endDate)}` : ""}`
    : "Dates to be announced";
  const days = Number(record.duration_days) || 0;
  const nights = Number(record.duration_nights) || 0;

  return {
    ...record,
    image: resolveMediaUrl(record.thumbnail, ""),
    videoUrl: record.intro_video || "",
    categoryLabel: labels[record.category] || record.category || "Travel",
    statusLabel: statusLabels[record.public_booking_status] || "Upcoming",
    destinationLabel: [record.destination, record.starting_point].filter(Boolean).join(" · "),
    dateLabel: formatDateRange,
    durationLabel: days ? `${days} ${days === 1 ? "Day" : "Days"} / ${nights} ${nights === 1 ? "Night" : "Nights"}` : "Duration to be announced",
    effectivePrice: hasDiscount ? discounted : regular,
    regularPrice: regular,
    hasDiscount,
    totalSlots,
    bookedSlots,
    availableSlots,
    link: `/travel/${encodeURIComponent(record.slug || record.id)}`,
    coordinator: record.coordinator || null,
    title: record.title || "",
    description: record.short_description || "",
    categoryName: labels[record.category] || record.category || "Travel",
    statusName: statusLabels[record.public_booking_status] || "Upcoming",
    destination: record.destination || "",
    startDate: formatDateRange,
    duration: days ? `${days} ${days === 1 ? "Day" : "Days"} / ${nights} ${nights === 1 ? "Night" : "Nights"}` : "",
    price: new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(hasDiscount ? discounted : regular),
    originalPrice: hasDiscount ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(regular) : "",
  };
}

export { dateLabel as formatTravelDate };
