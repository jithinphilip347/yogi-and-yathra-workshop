const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const getScheduledDays = (schedule) => {
  if (Array.isArray(schedule)) return schedule;
  if (typeof schedule !== "string") return [];

  try {
    const parsed = JSON.parse(schedule);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Some legacy records store comma-separated weekday names.
  }

  return schedule.split(",").map((day) => day.trim()).filter(Boolean);
};

const getLocalDateParts = (date, timeZone) => {
  const options = {
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  };

  let parts;
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      ...options,
      ...(timeZone ? { timeZone } : {}),
    }).formatToParts(date);
  } catch {
    // Match the backend's configured fallback for invalid/missing legacy zones.
    parts = new Intl.DateTimeFormat("en-US", {
      ...options,
      timeZone: "Asia/Kolkata",
    }).formatToParts(date);
  }

  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
};

/** True only during a scheduled occurrence, using the class's local timezone. */
export function isDailyClassLiveNow(dailyClass, now = new Date()) {
  if (!dailyClass?.start_date || !dailyClass?.end_date || !dailyClass?.class_time) return false;

  const timeMatch = String(dailyClass.class_time).match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!timeMatch) return false;

  let startHour = Number(timeMatch[1]);
  const startMinute = Number(timeMatch[2]);
  const meridiem = timeMatch[3]?.toUpperCase();
  if (meridiem) {
    if (startHour < 1 || startHour > 12) return false;
    startHour = (startHour % 12) + (meridiem === "PM" ? 12 : 0);
  }
  if (startHour > 23 || startMinute > 59) return false;

  const durationMinutes = Number(dailyClass.duration);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return false;

  const local = getLocalDateParts(now, dailyClass.timezone || "Asia/Kolkata");
  const localDate = `${local.year}-${local.month}-${local.day}`;
  if (localDate < String(dailyClass.start_date).slice(0, 10) || localDate > String(dailyClass.end_date).slice(0, 10)) {
    return false;
  }

  const weekday = local.weekday.toLowerCase().slice(0, 3);
  const scheduledToday = getScheduledDays(dailyClass.schedule).some((day) => {
    const normalized = String(day?.day ?? day).trim().toLowerCase().slice(0, 3);
    return WEEKDAYS.includes(normalized) && normalized === weekday;
  });
  if (!scheduledToday) return false;

  const currentMinutes = Number(local.hour) * 60 + Number(local.minute);
  const startMinutes = startHour * 60 + startMinute;
  return currentMinutes >= startMinutes && currentMinutes < startMinutes + durationMinutes;
}

