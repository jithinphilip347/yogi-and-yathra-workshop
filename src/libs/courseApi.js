const { default: apiClient } = require("@/services/apiClient");


const courseApi = {
    all: (queries) => apiClient.get("home/course",{
        params: queries
    }),

    enrollments: () => apiClient.get("enrolled-courses")
    
}
export default courseApi;