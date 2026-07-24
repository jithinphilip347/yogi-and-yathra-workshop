import apiClient from "./apiClient";

export const blogApi = {
  getBlogs: (params = {}) => apiClient.get("/blogs", { params }),
  getBlogBySlug: (slug) => apiClient.get(`/blogs/${slug}`),
  getCategories: () => apiClient.get("/blog-categories"),
  getTags: () => apiClient.get("/blog-tags"),
  getRelatedBlogs: (categoryId, excludeId) =>
    apiClient.get("/blogs", {
      params: {
        category_id: categoryId,
        per_page: 4,
      },
    }),
};
