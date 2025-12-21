import HomeBanner from "@/components/home/HomeBanner";
import HomeCourse from "@/components/home/HomeCourse";
import HomeLiveClass from "@/components/home/HomeLiveClass";
import HomeLiveCourse from "@/components/home/HomeLiveCourse";
import HomeNew from "@/components/home/HomeNew";
import HomePopular from "@/components/home/HomePopular";
import HomeTestimonial from "@/components/home/HomeTestimonial";
import HomeTopRated from "@/components/home/HomeTopRated";
import HomeTrending from "@/components/home/HomeTrending";


export default function Home() {
  return (
    <>
    <HomeBanner />
    <HomeLiveCourse />
    {/* <HomeCourse /> */}
    <HomePopular />
    <HomeTrending />
    <HomeLiveClass />
    <HomeNew />
    <HomeTopRated />
    <HomeTestimonial />
    </>
  );
}
