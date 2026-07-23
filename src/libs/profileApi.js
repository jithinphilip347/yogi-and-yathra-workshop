import apiClient from "@/services/apiClient";

const ProfileApi = {
  update: ({ id, data }) =>
    apiClient.post(`auth/profile`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};

export default ProfileApi;