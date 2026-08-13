import { fetchLiveSections, fetchLiveSectionDetail } from "@/libs/course";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import LiveStreamPlayer from "./LiveStreamPlayer";

export const revalidate = 600;

export async function generateMetadata({ params }) {
  const { id } = await params;
  let liveSection = null;

  if (id) {
    const res = await fetchLiveSectionDetail(id);
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
      title: "Live Yoga Session | Yogify",
      description: "Join our live yoga sessions with expert instructors.",
    };
  }

  return {
    title: `${liveSection.title} - Live Stream | Yogify`,
    description:
      liveSection.description?.substring(0, 160) ||
      `Join the live stream for ${liveSection.title}. Live yoga with expert instructors.`,
    openGraph: {
      title: liveSection.title,
      description: liveSection.description?.substring(0, 160),
      images: [
        {
          url: liveSection.thumbnail
            ? resolveMediaUrl(liveSection.thumbnail)
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

export default async function Page({ params }) {
  const { id } = await params;
  let liveSection = null;

  if (id) {
    const res = await fetchLiveSectionDetail(id);
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
      <LiveStreamPlayer liveSection={liveSection} />
    </div>
  );
}
