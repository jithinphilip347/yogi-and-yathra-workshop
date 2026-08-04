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
          instructorImg: c.instructor?.avatar || null,
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
        instructorImg: cls.instructor?.avatar || null,
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
        meeting_link: cls.meeting_link || cls.stream_url || "/live-stream",
      };
    });

  const publicDailyClasses = Array.isArray(dailyClassesQuery.data)
    ? dailyClassesQuery.data.map((cls) => ({
        id: cls.id,
        title: cls.title,
        category: cls.category?.name || cls.category || "POWER YOGA",
        instructor: cls.instructor?.name || "Achu Sivadasan",
        instructorImg: cls.instructor?.avatar || null,
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
        meeting_link: cls.meeting_link || cls.stream_url || "/live-stream",
      }))
    : [];

  const liveClasses = rawDailyClasses.length > 0 ? rawDailyClasses : publicDailyClasses;

  // Parse Live Sessions
  const rawLiveSessions = rawEnrollments
    .filter(
      (item) =>
        item.enrollable_type?.includes("LiveSection") ||
        item.product_type === "LiveSection" ||
        item.product_type === "live_section"
    )
    .map((item) => {
      const session = item.enrollable || item;
      return {
        id: session.id || item.id,
        title: session.title,
        instructor: session.instructor?.name || "Sarah Jenkins",
        date: session.date || "25 Oct 2026",
        time: session.time || "07:00 AM - 08:30 AM",
        duration: session.duration || "90 Min",
        category: session.category?.name || "Yoga",
        status: item.status || session.status || "upcoming",
        countdown: "Upcoming • Scheduled",
        image: session.image || session.thumbnail || null,
        meeting_link: session.meeting_link || session.stream_url || "/live-stream",
      };
    });

  const publicLiveSessions = Array.isArray(liveSectionsQuery.data)
    ? liveSectionsQuery.data.map((session) => ({
        id: session.id,
        title: session.title,
        instructor: session.instructor?.name || "Sarah Jenkins",
        date: session.date || "25 Oct 2026",
        time: session.time || "07:00 AM - 08:30 AM",
        duration: session.duration || "90 Min",
        category: session.category?.name || "Yoga",
        status: session.status || "upcoming",
        countdown: "Upcoming • Scheduled",
        image: session.image || session.thumbnail || null,
        meeting_link: session.meeting_link || session.stream_url || "/live-stream",
      }))
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
