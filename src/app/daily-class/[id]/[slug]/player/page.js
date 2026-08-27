import { fetchDailyClassDetails } from "@/libs/course";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import DailyClassPlayer from "./DailyClassPlayer";

export const revalidate = 600;

/**
 * Derive a URL-safe slug from the daily class title.
 * Matches the pattern used by HomeLiveClass and CourseCard:
 *   title.trim().replace(/\s+/g, "-").toLowerCase()
 */
function deriveSlug(title) {
  return title?.trim().replace(/\s+/g, "-").toLowerCase() || "";
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const dailyClass = await fetchDailyClassDetails(id);

  if (!dailyClass) {
    return {
      title: "Daily Class Not Found | Yogify",
      description: "The daily class you are looking for does not exist.",
    };
  }

  return {
    title: `${dailyClass.title || "Daily Class"} - Player | Yogify`,
    description:
      dailyClass.short_description?.substring(0, 160) ||
      dailyClass.description?.substring(0, 160) ||
      `Join the live session for ${dailyClass.title}. Live yoga and meditation with expert instructors.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const dailyClass = await fetchDailyClassDetails(id);

  if (!dailyClass) {
    return <DailyClassPlayer dailyClass={null} />;
  }

  // Derive slug to match the URL pattern used across the app
  const slug = deriveSlug(dailyClass.title);

  // Resolve thumbnail for banner display
  const bannerImage = dailyClass.thumbnail
    ? resolveMediaUrl(dailyClass.thumbnail)
    : null;

  return (
    <DailyClassPlayer
      dailyClass={dailyClass}
      slug={slug}
      bannerImage={bannerImage}
    />
  );
}
