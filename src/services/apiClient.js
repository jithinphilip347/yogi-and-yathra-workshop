import { API_BASE_URL } from "@/utils/constants";
import axios from "axios";
import { store } from "../../store";
import { logout } from "../features/auth/authSlice";
import { playerSessionCache } from "../libs/playerSessionCache";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000,
})

apiClient.interceptors.request.use(
    (config) => {
        const token = store.getState().auth.token;
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

// Guard against firing a redirect more than once when several requests 401 in parallel.
let isRedirectingToLogin = false;

/**
 * Whether a url points at an auth endpoint (login / register / OTP / reset).
 *
 * Matches both the way the app calls them (`auth/login`, relative to the axios
 * baseURL) and an absolute form (`/api/v1/auth/login`). The previous check —
 * `url.includes("/auth/")` — silently missed every relative call, which is all of
 * them, so a stale token could log a user out in the middle of re-authenticating.
 */
const isAuthEndpoint = (url = "") => /(^|\/)auth\//.test(String(url));

/**
 * Whether a 401 means "this visitor had a session and it is no longer valid".
 *
 * A guest has no session to expire. Many widgets that live on PUBLIC pages (the
 * nav, the home page's course rails) call endpoints that require a bearer token,
 * so an unauthenticated visitor legitimately collects 401s while browsing. Those
 * must never be treated as an expired session, or a signed-out visitor could not
 * open the home page at all — the very first such 401 would bounce them to the
 * login screen.
 *
 * Only a request that actually carried a bearer token — or auth state that claims
 * to be signed in — is evidence of an expired/revoked session. Login/register/OTP
 * 401s are excluded because the caller handles its own failure (wrong password).
 *
 * @param {object}  details
 * @param {number}  details.status            HTTP status of the failed response
 * @param {string}  [details.url]             request url as given to axios
 * @param {boolean} [details.hadToken]        the request carried an Authorization header
 * @param {boolean} [details.isAuthenticated] auth state claims a signed-in user
 * @returns {boolean}
 */
export function shouldRedirectToLogin({ status, url = "", hadToken = false, isAuthenticated = false }) {
    if (status !== 401) return false;
    if (isAuthEndpoint(url)) return false;

    return hadToken || isAuthenticated;
}

// Handle stale/revoked bearer tokens: clear auth state and send the user to login.
const handleUnauthorized = (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const auth = store.getState().auth || {};
    // The request interceptor attaches the token, so its presence is the reliable
    // "this visitor was signed in when the request left" signal.
    const hadToken = Boolean(error.config?.headers?.Authorization);

    const isExpiredSession = shouldRedirectToLogin({
        status,
        url,
        hadToken,
        isAuthenticated: Boolean(auth.isAuthenticated),
    });

    if (isExpiredSession && !isRedirectingToLogin) {
        // A revoked/expired session must never leave a previous user's course
        // session behind in the in-memory player cache.
        playerSessionCache.clear();
        store.dispatch(logout());
        // Avoid bouncing users who are mid-flow on any auth page (login, OTP, reset...).
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth")) {
            isRedirectingToLogin = true;
            window.location.href = "/auth/login";
        }
    }
    return Promise.reject(error);
}

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    handleUnauthorized
)

export default apiClient;
