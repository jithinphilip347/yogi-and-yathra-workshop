import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import courseApi from "@/libs/courseApi";

const parseDailyClassSchedule = (schedule) => {
  if (Array.isArray(schedule)) return schedule;
  if (typeof schedule === "string") {
    try {
      const parsed = JSON.parse(schedule);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      return schedule.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

const formatTime12h = (timeStr) => {
  if (!timeStr) return "07:00 PM";
  if (typeof timeStr === "string" && (timeStr.includes("AM") || timeStr.includes("PM"))) {
    return timeStr;
  }
  try {
    const [hours, mins] = timeStr.split(":");
    const h = parseInt(hours, 10);
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    const formattedH = h12 < 10 ? `0${h12}` : `${h12}`;
    return `${formattedH}:${mins || "00"} ${ampm}`;
  } catch (_) {
    return timeStr;
  }
};

const computeDailyClassProgress = (item, cls) => {
  if (item?.progress && typeof item.progress === "object" && item.progress.totalDays) {
    const current = item.progress.currentDay ?? item.progress.attended ?? 0;
    const total = item.progress.totalDays || 1;
    const pct = item.progress.percentage ?? Math.min(100, Math.round((current / total) * 100));
    return {
      currentDay: current,
      totalDays: total,
      percentage: pct,
    };
  }

  const totalSessions =
    item?.total_sessions ||
    cls?.pricing_plans?.[0]?.sessions_count ||
    cls?.subscription_plans?.[0]?.sessions_count ||
    10;

  const attendedSessions =
    item?.attended_sessions ??
    (typeof item?.progress === "number" ? item.progress : 0);

  const percentage =
    typeof item?.attendance_percentage === "number"
      ? item.attendance_percentage
      : totalSessions > 0
      ? Math.min(100, Math.round((attendedSessions / totalSessions) * 100))
      : 0;

  return {
    currentDay: attendedSessions,
    totalDays: totalSessions,
    percentage: Math.min(100, Math.max(0, percentage)),
  };
};

const computeDailyClassTodayStatus = (cls, daysArray, formattedTime) => {
  const now = new Date();
  const dayNamesFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayNames3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayNames2 = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const todayFull = dayNamesFull[now.getDay()];
  const today3 = dayNames3[now.getDay()];
  const today2 = dayNames2[now.getDay()];

  const isScheduledToday = Array.isArray(daysArray) && daysArray.length > 0 && daysArray.some((d) => {
    if (typeof d !== "string") return false;
    const norm = d.trim().toLowerCase();
    return (
      norm === todayFull.toLowerCase() ||
      norm === today3.toLowerCase() ||
      norm === today2.toLowerCase() ||
      todayFull.toLowerCase().startsWith(norm) ||
      norm.startsWith(today2.toLowerCase())
    );
  });

  let isPastEnd = false;
  let isBeforeStart = false;

  if (cls?.start_date) {
    const start = new Date(cls.start_date);
    start.setHours(0, 0, 0, 0);
    if (now < start) {
      isBeforeStart = true;
    }
  }

  if (cls?.end_date) {
    const end = new Date(cls.end_date);
    end.setHours(23, 59, 59, 999);
    if (now > end) {
      isPastEnd = true;
    }
  }

  if (isPastEnd) {
    return {
      hasSession: false,
      isLive: false,
      isCompleted: true,
      message: "Course Completed",
      helper: "This daily class batch has ended",
      actionText: "View Details",
      actionType: "secondary",
    };
  }

  if (isBeforeStart) {
    const startDateDisplay = cls.human_start_date || cls.start_date || "Soon";
    return {
      hasSession: false,
      isLive: false,
      isCompleted: false,
      message: "Batch Starts Soon",
      helper: `First class on ${startDateDisplay}`,
      actionText: "View Schedule",
      actionType: "secondary",
    };
  }

  if (!isScheduledToday) {
    return {
      hasSession: false,
      isLive: false,
      isCompleted: false,
      message: "No Live Class Today",
      helper: "Next session on your scheduled days",
      actionText: "View Schedule",
      actionType: "secondary",
    };
  }

  const timeRaw = cls?.class_time || cls?.time;
  let classToday = null;
  if (timeRaw) {
    try {
      const [hours, mins] = timeRaw.split(":");
      classToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours, 10), parseInt(mins, 10), 0);
    } catch (_) {}
  }

  if (!classToday || isNaN(classToday.getTime())) {
    return {
      hasSession: true,
      isLive: false,
      isCompleted: false,
      message: "Scheduled Today",
      helper: `Class time: ${formattedTime}`,
      actionText: "Join Today's Class",
      actionType: "primary",
    };
  }

  const durationMins = parseInt(cls?.duration, 10) || 60;
  const classEnd = new Date(classToday.getTime() + durationMins * 60 * 1000);
  const joinOpenTime = new Date(classToday.getTime() - 15 * 60 * 1000);

  if (now > classEnd) {
    return {
      hasSession: true,
      isLive: false,
      isCompleted: true,
      message: "Today's Class Completed",
      helper: "See you in the next session",
      actionText: "Class Ended",
      actionType: "disabled",
    };
  }

  if (now >= joinOpenTime && now <= classEnd) {
    const isActuallyLive = now >= classToday;
    return {
      hasSession: true,
      isLive: isActuallyLive,
      isCompleted: false,
      message: isActuallyLive ? "Class Live Now" : "Starts Soon",
      helper: isActuallyLive ? "Session in progress — Join now!" : "Join opens 15 mins before",
      actionText: "Join Today's Class",
      actionType: "primary",
    };
  }

  return {
    hasSession: true,
    isLive: false,
    isCompleted: false,
    message: "Scheduled Today",
    helper: `Starts at ${formattedTime} (Join opens 15 mins before)`,
    actionText: "Join Today's Class",
    actionType: "primary",
  };
};

export const useProfileLearning = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.id;

  // 1. Fetch user enrollments (all product types: course, daily_class, live_section)
  const userEnrollmentsQuery = useQuery({
    queryKey: ["user-enrollments", userId],
    queryFn: async () => {
      const res = await courseApi.userEnrollments(userId);
      return res.data?.data || res.data?.courses || res.data || [];
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });

  // 2. Fetch public/featured daily classes (as fallback/browse)
  const dailyClassesQuery = useQuery({
    queryKey: ["public-daily-classes"],
    queryFn: async () => {
      const res = await courseApi.dailyClasses();
      return res.data?.data || res.data?.daily_classes || res.data || [];
    },
    refetchOnWindowFocus: false,
  });

  // 3. Fetch public live sections (as fallback/browse)
  const liveSectionsQuery = useQuery({
    queryKey: ["public-live-sections"],
    queryFn: async () => {
      const res = await courseApi.liveSections();
      return res.data?.data || res.data?.live_sections || res.data || [];
    },
    refetchOnWindowFocus: false,
  });

  // 4. Fetch student continue learning feed
  const continueLearningQuery = useQuery({
    queryKey: ["student-continue-learning", userId],
    queryFn: async () => {
      const res = await courseApi.continueLearning();
      return res.data?.data || res.data || [];
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });

  // 5. Fetch dashboard upcoming events
  const upcomingEventsQuery = useQuery({
    queryKey: ["dashboard-upcoming-events"],
    queryFn: async () => {
      const res = await courseApi.upcomingEvents();
      return res.data?.data || res.data || [];
    },
    refetchOnWindowFocus: false,
  });

  const rawEnrollments = Array.isArray(userEnrollmentsQuery.data)
    ? userEnrollmentsQuery.data
    : [];

  // Parse Enrolled Courses
  const enrolledCourses = rawEnrollments
    .filter(
      (item) =>
        !item.enrollable_type ||
        item.enrollable_type.includes("Course") ||
        item.product_type === "Course" ||
        item.course
    )
    .map((item) => {
      const courseObj = item.course || item.enrollable || item;
      return {
        ...courseObj,
        enrollment_id: item.id,
        enrollment_status: item.status,
        progress_percentage: item.progress?.percentage ?? item.progress ?? 0,
      };
    })
    .filter((c) => c && (c.id || c.title));

  // Parse Continue Learning Feed
  const rawContinue = Array.isArray(continueLearningQuery.data) ? continueLearningQuery.data : [];
  const continueCourses = rawContinue.length > 0
    ? rawContinue.map((c) => ({
        id: c.id,
        title: c.title,
        image: c.thumbnail ? c.thumbnail : null,
        instructorName: c.instructorName || "Yogify Instructor",
        instructorImg: c.instructorImg || null,
        progress: typeof c.progress === "number" ? c.progress : 0,
        slug: c.slug,
        current_lesson_id: c.current_lesson_id,
        current_lesson_title: c.current_lesson_title,
      }))
    : enrolledCourses
        .filter((c) => (c.progress_percentage > 0 || c.enrollment_status === "active"))
        .map((c) => ({
          id: c.id,
          title: c.title,
          image: c.thumbnail ? c.thumbnail : null,
          instructorName: c.instructor?.name || "Yogify Instructor",
          instructorImg: c.instructor?.avatar_url || c.instructor?.avatar || null,
          progress: typeof c.progress_percentage === "number" ? c.progress_percentage : 0,
          slug: c.slug,
          current_lesson_id: c.current_lesson_id || null,
          current_lesson_title: c.current_lesson_title || null,
        }));

  // Parse Daily Classes
  const rawDailyClasses = rawEnrollments
    .filter(
      (item) =>
        item.enrollable_type?.includes("DailyClass") ||
        item.product_type === "DailyClass" ||
        item.product_type === "daily_class"
    )
    .map((item) => {
      const cls = item.enrollable || item;
      const days = parseDailyClassSchedule(cls.schedule || cls.days);
      const displayTime = cls.human_class_time || formatTime12h(cls.class_time || cls.time);
      const progress = computeDailyClassProgress(item, cls);
      const todayStatus = computeDailyClassTodayStatus(cls, days, displayTime);

      return {
        id: cls.id || item.id,
        title: cls.title,
        category: cls.category?.name || (typeof cls.category === "string" ? cls.category : "POWER YOGA"),
        instructor: cls.instructor?.name || (typeof cls.instructor === "string" ? cls.instructor : "Yogify Instructor"),
        instructorImg: cls.instructor?.avatar_url || cls.instructor?.avatar || cls.instructorImg || null,
        dateRange: cls.start_date && cls.end_date ? `${cls.start_date} - ${cls.end_date}` : (cls.human_start_date ? `${cls.human_start_date} - ${cls.human_end_date}` : "Ongoing"),
        time: displayTime,
        days: days.length > 0 ? days : ["Tuesday", "Wednesday"],
        progress,
        todayStatus,
        status: item.status || "active",
        meeting_link: `/daily-class/${cls.id}/${(cls.title || '').trim().replace(/\s+/g, '-').toLowerCase()}/player`,
      };
    });

  const publicDailyClasses = Array.isArray(dailyClassesQuery.data)
    ? dailyClassesQuery.data.map((cls) => {
        const days = parseDailyClassSchedule(cls.schedule || cls.days);
        const displayTime = cls.human_class_time || formatTime12h(cls.class_time || cls.time);
        const progress = computeDailyClassProgress(null, cls);
        const todayStatus = computeDailyClassTodayStatus(cls, days, displayTime);

        return {
          id: cls.id,
          title: cls.title,
          category: cls.category?.name || (typeof cls.category === "string" ? cls.category : "POWER YOGA"),
          instructor: cls.instructor?.name || (typeof cls.instructor === "string" ? cls.instructor : "Yogify Instructor"),
          instructorImg: cls.instructor?.avatar_url || cls.instructor?.avatar || cls.instructorImg || null,
          dateRange: cls.start_date && cls.end_date ? `${cls.start_date} - ${cls.end_date}` : (cls.human_start_date ? `${cls.human_start_date} - ${cls.human_end_date}` : "Scheduled"),
          time: displayTime,
          days: days.length > 0 ? days : ["Tuesday", "Wednesday"],
          progress,
          todayStatus,
          status: "active",
          meeting_link: `/daily-class/${cls.id}/${(cls.title || '').trim().replace(/\s+/g, '-').toLowerCase()}/player`,
        };
      })
    : [];

  const liveClasses = rawDailyClasses.length > 0 ? rawDailyClasses : publicDailyClasses;

  const formatLiveSessionItem = (item, isEnrollment = true) => {
    const session = item.enrollable || item;

    // Resolve instructor name
    const instructorName =
      session.instructor?.name ||
      session.instructor_name ||
      (typeof session.instructor === "string" ? session.instructor : null) ||
      "Yogify Instructor";

    // Format date: Prefer human_date ("01 Sep 2026"), human_start_date, then formatted date
    let displayDate = session.human_date || session.human_start_date || "";
    if (!displayDate && session.date) {
      try {
        const parsed = new Date(session.date);
        if (!isNaN(parsed.getTime())) {
          displayDate = parsed.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        } else {
          displayDate = session.date;
        }
      } catch (_) {
        displayDate = session.date;
      }
    }

    // Format time: Prefer human_start_time ("02:30 PM"), human_class_time, start_time, or time
    let displayTime = session.human_start_time || session.human_class_time || "";
    if (!displayTime && session.start_time) {
      try {
        const [hours, mins] = session.start_time.split(":");
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        const formattedH = h12 < 10 ? `0${h12}` : `${h12}`;
        displayTime = `${formattedH}:${mins} ${ampm}`;
      } catch (_) {
        displayTime = session.start_time;
      }
    }
    if (!displayTime && session.time) {
      displayTime = session.time;
    }
    if (!displayTime) {
      displayTime = "Scheduled";
    }

    // Temporal status & countdown calculation
    let isPast = Boolean(session.is_ended);
    let isLive = false;
    let computedStatus = session.time_status || session.status || "upcoming";
    let countdownText = "";

    if (session.date) {
      const timePart = session.start_time
        ? session.start_time.length === 5
          ? `${session.start_time}:00`
          : session.start_time
        : "00:00:00";
      const sessionDate = new Date(`${session.date}T${timePart}`);
      const durationMins = parseInt(session.duration, 10) || 60;
      const sessionEnd = new Date(sessionDate.getTime() + durationMins * 60 * 1000);
      const now = new Date();

      if (!isNaN(sessionDate.getTime())) {
        const diffMs = sessionDate - now;
        const diffEndMs = sessionEnd - now;

        if (diffEndMs < 0 || session.is_ended) {
          isPast = true;
          computedStatus = "completed";
          countdownText = "";
        } else if (diffMs <= 15 * 60 * 1000 && diffEndMs >= 0) {
          isLive = true;
          computedStatus = diffMs <= 0 ? "live" : "ready";
          countdownText = diffMs <= 0 ? "LIVE NOW" : "Starts Soon";
        } else {
          computedStatus = "upcoming";
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          if (diffHours < 1) {
            countdownText = "Starts in < 1 hour";
          } else if (diffDays === 0) {
            countdownText = "Starts today";
          } else if (diffDays === 1) {
            countdownText = "Starts tomorrow";
          } else if (diffDays > 1) {
            countdownText = `Starts in ${diffDays} days`;
          }
        }
      }
    }

    if (session.status === "cancelled" || session.status === "expired") {
      computedStatus = session.status;
    }

    return {
      id: session.id || item.id,
      enrollment_id: isEnrollment ? item.id : null,
      title: session.title,
      slug: session.slug || "live-session",
      instructor: instructorName,
      instructor_img: session.instructor?.avatar_url || session.instructor?.avatar || null,
      date: displayDate,
      time: displayTime,
      duration: session.duration ? `${session.duration} Min` : "",
      category: session.category?.name || (typeof session.category === "string" ? session.category : "Yoga"),
      status: computedStatus,
      is_past: isPast,
      is_live: isLive,
      enrollment_status: isEnrollment ? item.status : null,
      has_certificate: Boolean(session.has_certificate),
      can_issue_certificate: Boolean(session.can_issue_certificate),
      certificate_template_id: session.certificate_template_id || null,
      countdown: countdownText,
      image: session.thumbnail || session.banner_image || session.image || null,
      meeting_link: `/live-stream/${session.id}/${session.slug || "live-session"}`,
    };
  };

  // Parse Live Sessions
  const rawLiveSessions = rawEnrollments
    .filter(
      (item) =>
        item.enrollable_type?.includes("LiveSection") ||
        item.product_type === "LiveSection" ||
        item.product_type === "live_section" ||
        item.product_type === "Live Section"
    )
    .map((item) => formatLiveSessionItem(item, true));

  const publicLiveSessions = Array.isArray(liveSectionsQuery.data)
    ? liveSectionsQuery.data.map((session) => formatLiveSessionItem(session, false))
    : [];

  const liveSessions = rawLiveSessions.length > 0 ? rawLiveSessions : publicLiveSessions;

  const isLoading =
    userEnrollmentsQuery.isLoading ||
    dailyClassesQuery.isLoading ||
    liveSectionsQuery.isLoading;

  return {
    courses: enrolledCourses,
    continueCourses,
    liveClasses,
    liveSessions,
    upcomingEvents: upcomingEventsQuery.data || [],
    isLoading,
    userEnrollmentsQuery,
  };
};

export default useProfileLearning;
