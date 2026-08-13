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

// Handle stale/revoked/missing bearer tokens: clear auth state and send the user to login.
const handleUnauthorized = (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    // A 401 on an auth endpoint (login/register) is handled by the caller itself;
    // every other 401 means the session is invalid or absent, so bounce to login.
    const isAuthRequest = url.includes("/auth/");
    if (status === 401 && !isAuthRequest && !isRedirectingToLogin) {
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
