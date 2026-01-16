import apiClient from "@/services/apiClient"
const ProfileApi = {
    update: ({ id,data }) => apiClient.put(`user/profile/${id}`,data),
}
export default ProfileApi