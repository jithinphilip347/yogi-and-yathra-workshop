import apiClient from "@/services/apiClient";

const authApi = {
  register: (data) => apiClient.post("auth/register", data),
  login: (data) => apiClient.post("auth/login", data),
  change: (data) => apiClient.post("auth/change-password", data),
  getGoogleAuthUrl: () => apiClient.get("auth/google/url"),
  googleCallback: (data) => apiClient.post("auth/google/callback", data),
};

export default authApi;
