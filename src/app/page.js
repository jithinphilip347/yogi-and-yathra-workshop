import HomeBanner from "@/components/home/HomeBanner";
import HomeCourse from "@/components/home/HomeCourse";
import HomeLiveClass from "@/components/home/HomeLiveClass";
import HomeLiveCourse from "@/components/home/HomeLiveCourse";
import HomeNew from "@/components/home/HomeNew";
import HomePopular from "@/components/home/HomePopular";
import HomeTeacher from "@/components/home/HomeTeacher";
import HomeTestimonial from "@/components/home/HomeTestimonial";
import HomeTopRated from "@/components/home/HomeTopRated";
import HomeTrending from "@/components/home/HomeTrending";
import { fetchCategories, fetchDailyClasses, fetchLiveSections } from "@/libs/course";

const revalidate = 600;



export default async function Home() {
  const dailyClasses = await fetchDailyClasses();
  const liveSections = await fetchLiveSections();
  const categories = await fetchCategories();
  return (
    <>
    <HomeBanner />
    <HomeLiveCourse liveSections={liveSections} />
    {/* <HomeCourse /> */}
    <HomePopular categories={categories} />
    <HomeTrending />
    <HomeLiveClass dailyClasses={dailyClasses} />
    <HomeNew />
    <HomeTopRated />
    <HomeTestimonial />
    <HomeTeacher />
    </>
  );
}
