import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  CLASS_STATE,
  REGISTRATION_WINDOW_STATE,
  classState,
  normalizeRegistrationWindowState,
  registrationViewerState,
  registrationWindowState,
} from "@/utils/registrationWindow";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (...segments) =>
  fs.readFileSync(path.resolve(__dirname, ...segments), "utf8");

const homeRailSource = read("../../components/home/HomeLiveCourse.jsx");
const dailyClassDetailSource = read(
  "../../app/daily-class/[id]/[slug]/LiveDetails.jsx"
);
const liveSectionDetailSource = read(
  "../../app/live-section/[id]/[slug]/LiveYogaDetails.jsx"
);

// ── A window with both bounds, in the application's own convention ──────────
const OPEN_AT = "2026-09-10T09:00:00+05:30";
const CLOSE_AT = "2026-09-15T23:59:00+05:30";
const window_ = {
  registration_open_at: OPEN_AT,
  registration_close_at: CLOSE_AT,
};

const at = (iso) => new Date(iso);

describe("registrationWindow — boundary convention (inclusive both ends)", () => {
  it("is not_open one second before the window opens", () => {
    expect(
      registrationWindowState(window_, at("2026-09-10T08:59:59+05:30"))
    ).toBe(REGISTRATION_WINDOW_STATE.NOT_OPEN);
  });

  it("is open at exactly registration_open_at (inclusive)", () => {
    expect(registrationWindowState(window_, at(OPEN_AT))).toBe(
      REGISTRATION_WINDOW_STATE.OPEN
    );
  });

  it("is open one second after the window opens", () => {
    expect(
      registrationWindowState(window_, at("2026-09-10T09:00:01+05:30"))
    ).toBe(REGISTRATION_WINDOW_STATE.OPEN);
  });

  it("is open one second before the window closes", () => {
    expect(
      registrationWindowState(window_, at("2026-09-15T23:58:59+05:30"))
    ).toBe(REGISTRATION_WINDOW_STATE.OPEN);
  });

  it("is open at exactly registration_close_at (inclusive)", () => {
    expect(registrationWindowState(window_, at(CLOSE_AT))).toBe(
      REGISTRATION_WINDOW_STATE.OPEN
    );
  });

  it("is closed one second after the window closes", () => {
    expect(
      registrationWindowState(window_, at("2026-09-16T00:00:01+05:30"))
    ).toBe(REGISTRATION_WINDOW_STATE.CLOSED);
  });

  it("treats a missing bound as no constraint on that side", () => {
    expect(
      registrationWindowState({ registration_close_at: null }, at(OPEN_AT))
    ).toBe(REGISTRATION_WINDOW_STATE.OPEN);
    expect(
      registrationWindowState({ registration_open_at: null }, at(OPEN_AT))
    ).toBe(REGISTRATION_WINDOW_STATE.OPEN);
    expect(registrationWindowState({}, at(OPEN_AT))).toBe(
      REGISTRATION_WINDOW_STATE.OPEN
    );
  });

  it("prefers the server's own status when it reports one", () => {
    // Server already accounted for timezone and capacity — do not recompute.
    expect(
      registrationWindowState({ ...window_, registration_status: "not_open" }, at(CLOSE_AT))
    ).toBe(REGISTRATION_WINDOW_STATE.NOT_OPEN);
  });

  it("folds availability states into the window answer they imply", () => {
    expect(normalizeRegistrationWindowState("full")).toBe(
      REGISTRATION_WINDOW_STATE.CLOSED
    );
    expect(normalizeRegistrationWindowState("passed")).toBe(
      REGISTRATION_WINDOW_STATE.CLOSED
    );
    expect(normalizeRegistrationWindowState("unavailable")).toBe(
      REGISTRATION_WINDOW_STATE.CLOSED
    );
    expect(normalizeRegistrationWindowState("open")).toBe(
      REGISTRATION_WINDOW_STATE.OPEN
    );
  });
});

describe("registrationWindow — entitlement outlives the window", () => {
  const afterClose = at("2026-09-20T12:00:00+05:30");

  it("does NOT show a closed state to a viewer who already has access", () => {
    const viewer = registrationViewerState(window_, {
      hasAccess: true,
      now: afterClose,
    });

    expect(viewer.state).toBe(REGISTRATION_WINDOW_STATE.CLOSED);
    expect(viewer.accessPreserved).toBe(true);
    expect(viewer.showClosedState).toBe(false);
  });

  it("shows the closed state to a viewer without access", () => {
    const viewer = registrationViewerState(window_, {
      hasAccess: false,
      now: afterClose,
    });

    expect(viewer.showClosedState).toBe(true);
    expect(viewer.accessPreserved).toBe(false);
    expect(viewer.canRegister).toBe(false);
    expect(viewer.showRegistrationCta).toBe(false);
  });

  it("stops preserving access once the class itself has ended", () => {
    const viewer = registrationViewerState(
      { ...window_, class_end_date_time: "2026-09-18T10:00:00+05:30" },
      { hasAccess: true, now: afterClose }
    );

    // The class end — not the registration end — is what ends entitlement.
    expect(viewer.classState).toBe(CLASS_STATE.ENDED);
    expect(viewer.accessPreserved).toBe(false);
  });

  it("keeps access while the class is still active, past the window", () => {
    const viewer = registrationViewerState(
      { ...window_, class_end_date_time: "2026-09-30T10:00:00+05:30" },
      { hasAccess: true, now: afterClose }
    );

    expect(viewer.classState).toBe(CLASS_STATE.ACTIVE);
    expect(viewer.accessPreserved).toBe(true);
    expect(viewer.showClosedState).toBe(false);
  });

  it("offers a registration CTA only while the window is open", () => {
    expect(
      registrationViewerState(window_, {
        now: at("2026-09-12T10:00:00+05:30"),
      }).showRegistrationCta
    ).toBe(true);

    expect(
      registrationViewerState(window_, { now: afterClose })
        .showRegistrationCta
    ).toBe(false);
  });

  it("shows the not-yet-open state before the window starts", () => {
    const viewer = registrationViewerState(window_, {
      now: at("2026-09-01T10:00:00+05:30"),
    });

    expect(viewer.state).toBe(REGISTRATION_WINDOW_STATE.NOT_OPEN);
    expect(viewer.showClosedState).toBe(true);
  });

  it("treats class end as a separate question from registration end", () => {
    // Window still open, class already over — the two must not be collapsed.
    expect(
      classState({ class_end_date_time: "2026-09-05T10:00:00+05:30" }, at(OPEN_AT))
    ).toBe(CLASS_STATE.ENDED);
    expect(registrationWindowState(window_, at(OPEN_AT))).toBe(
      REGISTRATION_WINDOW_STATE.OPEN
    );
  });

  it("never reports an entitlement for an unauthenticated viewer", () => {
    const viewer = registrationViewerState(window_, { now: afterClose });
    expect(viewer.accessPreserved).toBe(false);
  });
});

describe("registrationWindow — consumers use the shared rule", () => {
  it("the rail composes the window through registrationViewerState", () => {
    expect(homeRailSource).toContain(
      'import { registrationViewerState } from "@/utils/registrationWindow"'
    );
    expect(homeRailSource).toContain("registrationViewerState(event,");
  });

  it("the rail never blocks the CTA on a registration constraint for an entitled viewer", () => {
    expect(homeRailSource).toContain("const registrationBlocked =");
    expect(homeRailSource).toContain("!hasAccess &&");
    // The lock badge must not appear for someone who owns the session.
    expect(homeRailSource).toContain("{isRegistrationClosed && !hasAccess && (");
  });

  it("the rail resolves enrollment once for the whole rail, not per card", () => {
    expect(homeRailSource).toContain("viewer-live-section-enrollments");
    expect(homeRailSource).toContain("courseApi.userEnrollments(user.id,");
    expect(homeRailSource).toContain("hasAccess={enrolledIds.has(Number(event.id))}");
  });

  it("the rail routes an entitled viewer to their session instead of re-buying it", () => {
    expect(homeRailSource).toContain("if (hasAccess) {");
    expect(homeRailSource).toContain('if (hasAccess) return "View Session";');
  });

  it("the DailyClass detail page mirrors the same shared rule", () => {
    expect(dailyClassDetailSource).toContain(
      "registrationViewerState(dailyClass,"
    );
    expect(dailyClassDetailSource).toContain("hasAccess: subStatus === \"active\"");
  });

  it("DailyClass gates only a NEW registration, leaving active subscribers alone", () => {
    // The closed branch is a sibling of the subscribe CTA, and the active-
    // subscription branch keeps its classroom button unconditionally.
    expect(dailyClassDetailSource).toContain(
      ") : registration.showClosedState ? ("
    );
    expect(dailyClassDetailSource).toMatch(
      /subStatus === "active" \? \([\s\S]*?Enter Class Room/
    );
  });

  it("the LiveSection detail page keeps its own entitlement path untouched", () => {
    // The audit found its gating is enrollment-driven, not window-driven.
    expect(liveSectionDetailSource).toContain("userEnrollments(user.id, 'live_section')");
  });
});
