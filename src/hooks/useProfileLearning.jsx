import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import courseApi from "@/libs/courseApi";

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
      return {
        id: cls.id || item.id,
        title: cls.title,
        category: cls.category?.name || cls.category || "POWER YOGA",
        instructor: cls.instructor?.name || "Achu Sivadasan",
        instructorImg: cls.instructor?.avatar_url || cls.instructor?.avatar || null,
        dateRange: cls.start_date && cls.end_date ? `${cls.start_date} - ${cls.end_date}` : "Ongoing",
        time: cls.time || "07:00 PM",
        days: cls.days || ["Tuesday", "Wednesday"],
        progress: item.progress || { currentDay: 4, totalDays: 10, percentage: 40 },
        todayStatus: {
          hasSession: true,
          isLive: false,
          isCompleted: false,
          message: "Starts Soon",
          helper: "Join opens 15 mins before",
          actionText: "Join Today's Class",
          actionType: "primary",
        },
        status: item.status || "active",
        meeting_link: `/daily-class/${cls.id}/${(cls.title || '').trim().replace(/\s+/g, '-').toLowerCase()}/player`,
      };
    });

  const publicDailyClasses = Array.isArray(dailyClassesQuery.data)
    ? dailyClassesQuery.data.map((cls) => ({
        id: cls.id,
        title: cls.title,
        category: cls.category?.name || cls.category || "POWER YOGA",
        instructor: cls.instructor?.name || "Achu Sivadasan",
        instructorImg: cls.instructor?.avatar_url || cls.instructor?.avatar || null,
        dateRange: cls.start_date && cls.end_date ? `${cls.start_date} - ${cls.end_date}` : "Scheduled",
        time: cls.time || "07:00 PM",
        days: cls.days || ["Tuesday", "Wednesday"],
        progress: { currentDay: 4, totalDays: 10, percentage: 40 },
        todayStatus: {
          hasSession: true,
          isLive: false,
          isCompleted: false,
          message: "Starts Soon",
          helper: "Join opens 15 mins before",
          actionText: "Join Today's Class",
          actionType: "primary",
        },
        status: "active",
        meeting_link: `/daily-class/${cls.id}/${(cls.title || '').trim().replace(/\s+/g, '-').toLowerCase()}/player`,
      }))
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

    // Dynamic countdown / relative label
    let countdownText = "";
    if (session.date) {
      const timePart = session.start_time
        ? session.start_time.length === 5
          ? `${session.start_time}:00`
          : session.start_time
        : "00:00:00";
      const sessionDate = new Date(`${session.date}T${timePart}`);
      if (!isNaN(sessionDate.getTime())) {
        const now = new Date();
        const diffMs = sessionDate - now;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffMs > 0 && diffHours < 1) {
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
      status: (isEnrollment ? item.status : null) || session.status || "upcoming",
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
