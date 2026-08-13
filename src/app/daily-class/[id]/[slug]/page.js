import { fetchDailyClassDetails } from "@/libs/course";
import LiveDetails from "./LiveDetails";
import { resolveMediaUrl } from "@/utils/mediaUrl";

export const revalidate = 600;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await fetchDailyClassDetails(id);
  const dailyClass = data;

  if (!dailyClass) {
    return {
      title: "Daily Class Not Found | Yogify",
      description: "The daily class you are looking for does not exist.",
    };
  }

  return {
    title: `${dailyClass.title || "Daily Class"} | Yogify Live`,
    description:
      dailyClass.short_description?.substring(0, 160) ||
      dailyClass.description?.substring(0, 160) ||
      `Join our ${dailyClass.title} session. Live yoga and meditation with expert instructors.`,
    openGraph: {
      title: dailyClass.title,
      description: dailyClass.short_description || dailyClass.description,
      images: [
        {
          url: dailyClass.thumbnail
            ? resolveMediaUrl(dailyClass.thumbnail)
            : "/images/live-placeholder.webp",
          width: 1200,
          height: 630,
          alt: dailyClass.title,
        },
      ],
      type: "website",
    },
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const data = await fetchDailyClassDetails(id);
  const dailyClass = data;

  const bannerImage = dailyClass?.thumbnail
    ? resolveMediaUrl(dailyClass.thumbnail)
    : "/images/live-placeholder.webp";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: dailyClass?.title,
    description: dailyClass?.description,
    provider: {
      "@type": "Organization",
      name: "Yogify Workshop",
      sameAs: "https://yogify.com",
    },
    image: bannerImage,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      instructor: {
        "@type": "Person",
        name: dailyClass?.instructor?.name,
      },
      startDate: dailyClass?.start_date,
      endDate: dailyClass?.end_date,
    },
    offers: dailyClass?.pricing_plans?.length
      ? {
          "@type": "Offer",
          price: dailyClass.pricing_plans[0]?.price,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LiveDetails id={id} classDetails={data} />
    </>
  );
}
