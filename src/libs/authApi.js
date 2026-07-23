import apiClient from "@/services/apiClient";

const authApi = {
  register: (data) => apiClient.post("auth/register", data),
  login: (data) => apiClient.post("auth/login", data),
  change: (data) => apiClient.post("auth/change-password", data),
};

export default authApi;
