import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import apiClient, { shouldRedirectToLogin } from "@/services/apiClient";
import { store } from "../../../store";
import { setLogin, logout } from "@/features/auth/authSlice";

/**
 * Public-page access for signed-out visitors.
 *
 * Widgets that live on PUBLIC pages (the nav, the home page's course rails) call
 * endpoints that require a bearer token, so an unauthenticated visitor legitimately
 * collects 401s while browsing. Treating those as an "expired session" bounced the
 * visitor to /auth/login, which made the home page unreachable when signed out.
 *
 * These tests pin the decision (pure predicate) and then exercise the REAL axios
 * response interceptor, so the wiring is covered too.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (...segments) =>
  fs.readFileSync(path.resolve(__dirname, ...segments), "utf8");

const apiClientSource = read("../../services/apiClient.js");
const useCourseSource = read("../../hooks/useCourse.jsx");

/** The real response interceptor handler (axios keeps the chain on the instance). */
const { rejected } = apiClient.interceptors.response.handlers[0];

/** A 401 as axios would reject it, optionally carrying a bearer token. */
const unauthorized = ({ url = "enrolled-courses", token = null } = {}) => ({
  response: { status: 401 },
  config: { url, headers: token ? { Authorization: `Bearer ${token}` } : {} },
});

describe("Signed-out visitors keep access to public pages", () => {
  beforeEach(() => {
    store.dispatch(logout());
  });

  it("does not treat a guest's 401 as an expired session", () => {
    expect(shouldRedirectToLogin({ status: 401, url: "enrolled-courses" })).toBe(false);
    expect(shouldRedirectToLogin({ status: 401, url: "student/analytics" })).toBe(false);
    expect(
      shouldRedirectToLogin({ status: 401, url: "wishlist", hadToken: false, isAuthenticated: false })
    ).toBe(false);
  });

  it("leaves auth state untouched when a guest hits an authenticated endpoint", async () => {
    const dispatch = vi.spyOn(store, "dispatch");

    await expect(rejected(unauthorized())).rejects.toBeTruthy();

    expect(dispatch).not.toHaveBeenCalled();
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.token).toBeNull();

    dispatch.mockRestore();
  });

  it("gates the home page's enrollment query on an authenticated user", () => {
    // `useCourse` powers the public course rails; its enrollments query must not
    // fire for a guest.
    const enrollmentsQuery = useCourseSource.slice(
      useCourseSource.indexOf("enrollmentsQuery")
    );

    expect(enrollmentsQuery).toMatch(/enabled:\s*!!userId\s*&&\s*!!isAuthenticated/);
    expect(useCourseSource).toMatch(/useSelector\(\(state\) => state\.auth\)/);
  });

  it("does not regress to redirecting on any 401", () => {
    expect(apiClientSource).toMatch(/shouldRedirectToLogin\(\{/);
    expect(apiClientSource).not.toMatch(/status === 401 && !isAuthRequest && !isRedirectingToLogin/);
  });
});

describe("Expired sessions still send the user to login", () => {
  beforeEach(() => {
    store.dispatch(logout());
  });

  afterEach(() => {
    store.dispatch(logout());
  });

  it("treats a 401 for a request that carried a token as an expired session", () => {
    expect(
      shouldRedirectToLogin({ status: 401, url: "enrolled-courses", hadToken: true })
    ).toBe(true);
  });

  it("heals auth state that claims to be signed in without a token", () => {
    expect(
      shouldRedirectToLogin({
        status: 401,
        url: "enrolled-courses",
        hadToken: false,
        isAuthenticated: true,
      })
    ).toBe(true);
  });

  it("clears the session through the real interceptor", async () => {
    store.dispatch(setLogin({ user: { id: 7, name: "Revoked" }, token: "stale-token" }));
    expect(store.getState().auth.isAuthenticated).toBe(true);

    const dispatch = vi.spyOn(store, "dispatch");
    await expect(rejected(unauthorized({ token: "stale-token" }))).rejects.toBeTruthy();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0].type).toBe(logout().type);
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.token).toBeNull();

    dispatch.mockRestore();
  });
});

describe("Auth endpoint failures stay with their caller", () => {
  it("never redirects on a login/register/OTP 401, however the url is spelled", () => {
    for (const url of [
      "auth/login",
      "/auth/login",
      "api/v1/auth/login",
      "auth/register",
      "auth/otp/verify",
      "auth/forgetpassword",
    ]) {
      expect(shouldRedirectToLogin({ status: 401, url, hadToken: true })).toBe(false);
      expect(shouldRedirectToLogin({ status: 401, url, isAuthenticated: true })).toBe(false);
    }
  });

  it("still recognises non-auth endpoints that merely contain 'auth'", () => {
    // Guards against an over-eager pattern: only a real `auth/` segment counts.
    expect(shouldRedirectToLogin({ status: 401, url: "authoring/notes", hadToken: true })).toBe(
      true
    );
  });

  it("ignores every status other than 401", () => {
    for (const status of [400, 403, 404, 422, 500, 502]) {
      expect(shouldRedirectToLogin({ status, url: "enrolled-courses", hadToken: true })).toBe(
        false
      );
    }
  });
});
