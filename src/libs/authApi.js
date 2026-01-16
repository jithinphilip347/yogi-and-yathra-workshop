import apiClient from "@/services/apiClient";

const authApi = {
    register: (data) => apiClient.post("register", data),
    login: (data) => apiClient.post("login", data),
    change: (data) => apiClient.post("change-password", data),
};

export default authApi;
