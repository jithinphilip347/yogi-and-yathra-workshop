import { describe, it, expect, vi, beforeEach } from "vitest";
import authApi from "@/libs/authApi";
import apiClient from "@/services/apiClient";
import authReducer, { setLogin, logout } from "@/features/auth/authSlice";

vi.mock("@/services/apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("Google Authentication Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authApi Google endpoints", () => {
    it("calls GET auth/google/url to retrieve the authorization URL", async () => {
      const mockUrl = "https://accounts.google.com/o/oauth2/v2/auth?client_id=123";
      apiClient.get.mockResolvedValueOnce({ data: { url: mockUrl } });

      const response = await authApi.getGoogleAuthUrl();

      expect(apiClient.get).toHaveBeenCalledWith("auth/google/url");
      expect(response.data.url).toBe(mockUrl);
    });

    it("calls POST auth/google/callback with authorization code", async () => {
      const mockAuthResponse = {
        message: "Login successful",
        user: {
          id: 42,
          name: "Google Yogi",
          email: "yogi@example.com",
          role: "student",
          avatar: "https://lh3.googleusercontent.com/avatar.jpg",
        },
        token: "1|sanctum_bearer_token_xyz",
      };

      apiClient.post.mockResolvedValueOnce({ data: mockAuthResponse });

      const response = await authApi.googleCallback({ code: "google_auth_code_123" });

      expect(apiClient.post).toHaveBeenCalledWith("auth/google/callback", {
        code: "google_auth_code_123",
      });
      expect(response.data.user.email).toBe("yogi@example.com");
      expect(response.data.token).toBe("1|sanctum_bearer_token_xyz");
    });
  });

  describe("authSlice Redux state updates for Google Login", () => {
    it("updates auth state correctly when setLogin is dispatched with Google auth payload", () => {
      const initialState = {
        user: null,
        isAuthenticated: false,
        token: null,
      };

      const payload = {
        user: {
          id: 10,
          name: "Test User",
          email: "test@example.com",
          role: "student",
        },
        token: "sanctum-token-abc",
      };

      const newState = authReducer(initialState, setLogin(payload));

      expect(newState.isAuthenticated).toBe(true);
      expect(newState.user).toEqual(payload.user);
      expect(newState.token).toBe("sanctum-token-abc");
    });

    it("clears user and token when logout is dispatched after Google session", () => {
      const loggedInState = {
        user: { id: 10, name: "Test User", email: "test@example.com" },
        isAuthenticated: true,
        token: "active-token",
      };

      const loggedOutState = authReducer(loggedInState, logout());

      expect(loggedOutState.isAuthenticated).toBe(false);
      expect(loggedOutState.user).toBeNull();
      expect(loggedOutState.token).toBeNull();
    });
  });
});
