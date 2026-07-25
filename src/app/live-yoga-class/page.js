import { fetchLiveSections, fetchLiveSectionDetail } from "@/libs/course";
import { MEDIA_BASE_URL } from "@/utils/constants";
import LiveYogaDetails from "./LiveYogaDetails";

export const revalidate = 600;

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  let liveSection = null;

  if (params?.id) {
    const res = await fetchLiveSectionDetail(params.id);
    liveSection = res?.data;
  } else {
    const listRes = await fetchLiveSections();
    const sections = listRes?.data || [];
    if (sections.length > 0) {
      const res = await fetchLiveSectionDetail(sections[0].id);
      liveSection = res?.data;
    }
  }

  if (!liveSection) {
    return {
      title: "Live Yoga Class | Yogify",
      description: "Join our live yoga sessions with expert instructors.",
    };
  }

  return {
    title: `${liveSection.title} | Yogify Live`,
    description:
      liveSection.description?.substring(0, 160) ||
      `Join our ${liveSection.title} session. Live yoga with expert instructors.`,
    openGraph: {
      title: liveSection.title,
      description: liveSection.description?.substring(0, 160),
      images: [
        {
          url: liveSection.thumbnail
            ? `${MEDIA_BASE_URL}${liveSection.thumbnail}`
            : "/images/live-placeholder.webp",
          width: 1200,
          height: 630,
          alt: liveSection.title,
        },
      ],
      type: "website",
    },
  };
}

export default async function Page({ searchParams }) {
  const params = await searchParams;
  let liveSection = null;

  if (params?.id) {
    const res = await fetchLiveSectionDetail(params.id);
    liveSection = res?.data;
  } else {
    const listRes = await fetchLiveSections();
    const sections = listRes?.data || [];
    if (sections.length > 0) {
      const res = await fetchLiveSectionDetail(sections[0].id);
      liveSection = res?.data;
    }
  }

  return (
    <div>
      <LiveYogaDetails liveSection={liveSection} />
    </div>
  );
}
