import { redirect } from "next/navigation";

// This legacy static route previously displayed a sample instructor and hardcoded rating.
// Real instructor profiles are served by the dynamic /teacher-list/[slug] route.
export default function LegacyTeacherDetailsRedirect() {
  redirect("/teacher-list");
}
