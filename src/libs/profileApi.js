import apiClient from "@/services/apiClient"
const ProfileApi = {
    update: ({ id,data }) => apiClient.post(`user/profile/${id}`,data, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    }),
}
export default ProfileApi