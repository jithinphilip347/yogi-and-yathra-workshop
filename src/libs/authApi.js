import apiClient from "@/services/apiClient";

const authApi = {
    register: (data) => apiClient.post("register", data),
    login: (data) => apiClient.post("login", data),
};

export default authApi;
