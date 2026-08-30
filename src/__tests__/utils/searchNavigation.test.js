import { describe, it, expect } from "vitest";
import {
  getSearchResultRoute,
  getSearchResultTypeLabel,
  isValidSearchResult,
  SEARCH_ENTITY_TYPES,
} from "../../utils/searchNavigation";

describe("Sprint 9 — Search Navigation & Route Resolver", () => {
  describe("Type Label Mapping", () => {
    it("maps 'course' to 'Course'", () => {
      expect(getSearchResultTypeLabel(SEARCH_ENTITY_TYPES.COURSE)).toBe("Course");
    });

    it("maps 'live_section' to 'Live Class'", () => {
      expect(getSearchResultTypeLabel(SEARCH_ENTITY_TYPES.LIVE_SECTION)).toBe("Live Class");
    });

    it("maps 'daily_class' to 'Daily Class'", () => {
      expect(getSearchResultTypeLabel(SEARCH_ENTITY_TYPES.DAILY_CLASS)).toBe("Daily Class");
    });

    it("returns empty string for unknown or missing type", () => {
      expect(getSearchResultTypeLabel("unknown")).toBe("");
      expect(getSearchResultTypeLabel(null)).toBe("");
      expect(getSearchResultTypeLabel(undefined)).toBe("");
    });
  });

  describe("Canonical Route Resolution", () => {
    it("resolves course destination to /course/${slug}/${id}", () => {
      const result = {
        type: "course",
        id: 15,
        slug: "hatha-yoga-masterclass",
        title: "Hatha Yoga Masterclass",
      };
      expect(getSearchResultRoute(result)).toBe("/course/hatha-yoga-masterclass/15");
    });

    it("resolves live_section destination to /live-section/${id}/${slug}", () => {
      const result = {
        type: "live_section",
        id: 42,
        slug: "evening-vinyasa-flow",
        title: "Evening Vinyasa Flow",
      };
      expect(getSearchResultRoute(result)).toBe("/live-section/42/evening-vinyasa-flow");
    });

    it("resolves daily_class destination to /daily-class/${id}/${slug}", () => {
      const result = {
        type: "daily_class",
        id: 88,
        slug: "morning-pranayama",
        title: "Morning Pranayama",
      };
      expect(getSearchResultRoute(result)).toBe("/daily-class/88/morning-pranayama");
    });
  });

  describe("Mandatory Test 1: Same Title across Different Types", () => {
    it("routes purely based on result.type when titles are identical", () => {
      const title = "Yoga Class";

      const courseResult = { type: "course", id: 10, slug: "yoga-class", title };
      const liveResult = { type: "live_section", id: 20, slug: "yoga-class", title };
      const dailyResult = { type: "daily_class", id: 30, slug: "yoga-class", title };

      expect(getSearchResultRoute(courseResult)).toBe("/course/yoga-class/10");
      expect(getSearchResultRoute(liveResult)).toBe("/live-section/20/yoga-class");
      expect(getSearchResultRoute(dailyResult)).toBe("/daily-class/30/yoga-class");
    });
  });

  describe("Mandatory Test 2: Misleading Titles", () => {
    it("routes course titled 'Morning Live Class' to Course destination", () => {
      const misleadingCourse = {
        type: "course",
        id: 101,
        slug: "morning-live-class",
        title: "Morning Live Class",
      };
      expect(getSearchResultRoute(misleadingCourse)).toBe("/course/morning-live-class/101");
      expect(getSearchResultTypeLabel(misleadingCourse.type)).toBe("Course");
    });

    it("routes live_section titled 'Yoga Course' to Live Section destination", () => {
      const misleadingLive = {
        type: "live_section",
        id: 202,
        slug: "yoga-course",
        title: "Yoga Course",
      };
      expect(getSearchResultRoute(misleadingLive)).toBe("/live-section/202/yoga-course");
      expect(getSearchResultTypeLabel(misleadingLive.type)).toBe("Live Class");
    });

    it("routes daily_class titled 'Live Course Session' to Daily Class destination", () => {
      const misleadingDaily = {
        type: "daily_class",
        id: 303,
        slug: "live-course-session",
        title: "Live Course Session",
      };
      expect(getSearchResultRoute(misleadingDaily)).toBe("/daily-class/303/live-course-session");
      expect(getSearchResultTypeLabel(misleadingDaily.type)).toBe("Daily Class");
    });
  });

  describe("Mandatory Test 3: Same Numeric IDs across Different Types", () => {
    it("routes correctly when IDs are identical across types", () => {
      const courseResult = { type: "course", id: 1, slug: "yoga-foundations" };
      const liveResult = { type: "live_section", id: 1, slug: "weekend-retreat" };
      const dailyResult = { type: "daily_class", id: 1, slug: "daily-meditation" };

      expect(getSearchResultRoute(courseResult)).toBe("/course/yoga-foundations/1");
      expect(getSearchResultRoute(liveResult)).toBe("/live-section/1/weekend-retreat");
      expect(getSearchResultRoute(dailyResult)).toBe("/daily-class/1/daily-meditation");
    });
  });

  describe("Missing / Malformed Parameter Safety", () => {
    it("falls back cleanly when slug is missing or null without producing /undefined", () => {
      const courseWithoutSlug = { type: "course", id: 99 };
      const liveWithoutSlug = { type: "live_section", id: 99, slug: null };
      const dailyWithoutSlug = { type: "daily_class", id: 99, slug: "" };

      expect(getSearchResultRoute(courseWithoutSlug)).toBe("/course/details/99");
      expect(getSearchResultRoute(liveWithoutSlug)).toBe("/live-section/99/details");
      expect(getSearchResultRoute(dailyWithoutSlug)).toBe("/daily-class/99/details");

      // Verify no /undefined in any route
      expect(getSearchResultRoute(courseWithoutSlug)).not.toContain("undefined");
      expect(getSearchResultRoute(liveWithoutSlug)).not.toContain("undefined");
      expect(getSearchResultRoute(dailyWithoutSlug)).not.toContain("undefined");
    });

    it("returns '#' safely for missing, null, or non-numeric ID", () => {
      expect(getSearchResultRoute({ type: "course" })).toBe("#");
      expect(getSearchResultRoute({ type: "course", id: null })).toBe("#");
      expect(getSearchResultRoute({ type: "course", id: undefined })).toBe("#");
      expect(getSearchResultRoute({ type: "course", id: "abc" })).toBe("#");
    });

    it("returns '#' safely for unknown entity types", () => {
      expect(getSearchResultRoute({ type: "unknown_entity", id: 5 })).toBe("#");
      expect(getSearchResultRoute({ type: "article", id: 10 })).toBe("#");
      expect(getSearchResultRoute({ id: 5 })).toBe("#");
    });

    it("returns '#' safely for null or non-object inputs", () => {
      expect(getSearchResultRoute(null)).toBe("#");
      expect(getSearchResultRoute(undefined)).toBe("#");
      expect(getSearchResultRoute("string")).toBe("#");
      expect(getSearchResultRoute(123)).toBe("#");
    });
  });

  describe("Security & Zoom Isolation", () => {
    it("never routes to zoom_meeting_url or external domains directly", () => {
      const searchItemWithZoom = {
        type: "live_section",
        id: 77,
        slug: "live-zoom-class",
        zoom_meeting_url: "https://zoom.us/j/123456789",
      };

      const destination = getSearchResultRoute(searchItemWithZoom);
      expect(destination).toBe("/live-section/77/live-zoom-class");
      expect(destination).not.toContain("zoom.us");
      expect(destination).not.toContain("http");
      expect(destination.startsWith("/")).toBe(true);
    });

    it("sanitizes dangerous slug characters", () => {
      const dangerousResult = {
        type: "course",
        id: 5,
        slug: "../../admin?hack=true",
      };
      const route = getSearchResultRoute(dangerousResult);
      expect(route).not.toContain("..");
      expect(route).toBe("/course/-admin-hack-true/5");
    });
  });

  describe("isValidSearchResult Helper", () => {
    it("returns true for valid search results and false for invalid ones", () => {
      expect(isValidSearchResult({ type: "course", id: 1 })).toBe(true);
      expect(isValidSearchResult({ type: "live_section", id: 2 })).toBe(true);
      expect(isValidSearchResult({ type: "daily_class", id: 3 })).toBe(true);

      expect(isValidSearchResult({ type: "unknown", id: 1 })).toBe(false);
      expect(isValidSearchResult({ type: "course", id: null })).toBe(false);
      expect(isValidSearchResult(null)).toBe(false);
    });
  });
});
