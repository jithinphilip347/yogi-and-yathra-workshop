import { fetchCourseDetails } from "@/libs/course";
import CourseDetails from "./CourseDetails";
import { MEDIA_BASE_URL } from "@/utils/constants";

const revalidate = 600;

export async function generateMetadata({ params }) {
    const { id } = await params;
    const response = await fetchCourseDetails(id);
    const course = response?.data;

    if (!course) {
        return {
            title: "Course Not Found | Yogify",
            description: "The course you are looking for does not exist.",
        };
    }

    return {
        title: `${course.title} | Yogify Workshop`,
        description: course.short_description || `Join our ${course.title} workshop. Learn ${course.category?.name || 'Yoga'} from expert instructors.`,
        openGraph: {
            title: course.title,
            description: course.short_description,
            images: [
                {
                    url: course.thumbnail ? `${MEDIA_BASE_URL}${course.thumbnail}` : "/images/course-placeholder.jpg",
                    width: 1200,
                    height: 630,
                    alt: course.title,
                },
            ],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: course.title,
            description: course.short_description,
            images: [course.thumbnail ? `${MEDIA_BASE_URL}${course.thumbnail}` : "/images/course-placeholder.jpg"],
        },
    };
}

export default async function Page({ params }) {
    const { id } = await params;
    const response = await fetchCourseDetails(id);
    const course = response?.data;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": course?.title,
        "description": course?.short_description,
        "provider": {
            "@type": "Organization",
            "name": "Yogify Workshop",
            "sameAs": "https://yogify.com"
        },
        "image": course?.thumbnail ? `${MEDIA_BASE_URL}${course.thumbnail}` : "/images/course-placeholder.jpg",
        "offers": {
            "@type": "Offer",
            "price": course?.discount_price || course?.price,
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock"
        },
        "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "Online",
            "instructor": {
                "@type": "Person",
                "name": course?.instructor?.name
            }
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <CourseDetails courseDetails={response} />
        </>
    );
}