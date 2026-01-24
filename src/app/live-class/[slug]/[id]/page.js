import { fetchDailyClassDetails } from "@/libs/course";
import LiveDetails from "./LiveDetails";
import { MEDIA_BASE_URL } from "@/utils/constants";

export const revalidate = 600;

export async function generateMetadata({ params }) {
    const { id } = await params;
    const data = await fetchDailyClassDetails(id);
    const liveClass = data;

    if (!liveClass) {
        return {
            title: "Live Class Not Found | Yogify",
            description: "The live class you are looking for does not exist.",
        };
    }

    return {
        title: `${liveClass.title} | Yogify Live`,
        description: liveClass.description?.substring(0, 160) || `Join our ${liveClass.title} session. Live yoga and meditation with expert instructors.`,
        openGraph: {
            title: liveClass.title,
            description: liveClass.short_description || liveClass.description,
            images: [
                {
                    url: liveClass.thumbnail ? `${MEDIA_BASE_URL}${liveClass.thumbnail}` : "/images/live-placeholder.jpg",
                    width: 1200,
                    height: 630,
                    alt: liveClass.title,
                },
            ],
            type: "website",
        },
    };
}

export default async function Page({ params }) {
  const { id } = await params;
  const data = await fetchDailyClassDetails(id);
  const liveClass = data;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": liveClass?.title,
    "description": liveClass?.description,
    "provider": {
        "@type": "Organization",
        "name": "Yogify Workshop",
        "sameAs": "https://yogify.com"
    },
    "image": liveClass?.thumbnail ? `${MEDIA_BASE_URL}${liveClass.thumbnail}` : "/images/live-placeholder.jpg",
    "hasCourseInstance": {
        "@type": "CourseInstance",
        "courseMode": "Online",
        "instructor": {
            "@type": "Person",
            "name": liveClass?.instructor?.name
        },
        "startDate": liveClass?.start_date,
        "endDate": liveClass?.end_date,
    },
    "offers": {
        "@type": "Offer",
        "price": liveClass?.price,
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock"
    }
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