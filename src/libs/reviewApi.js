const { default: apiClient } = require("@/services/apiClient")

const reviewApi = {
    getCourseReview: async (course_id, perPage) => {
        const res = await apiClient.get("/reviews/course", { params: { course_id, perPage } });
        return res.data;
    },
    postCourseReview: async (data) => {
        const res = await apiClient.post("/reviews/course", data);
        return res.data;
    }
}

export default reviewApi;