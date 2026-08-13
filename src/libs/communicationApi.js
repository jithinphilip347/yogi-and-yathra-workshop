import apiClient from '@/services/apiClient';

export const communicationApi = {
  getCourseChannel: async (courseId) => {
    const res = await apiClient.get(`communication/channels/courses/${courseId}`);
    return res.data;
  },

  getLessonChannel: async (lessonId) => {
    const res = await apiClient.get(`communication/channels/lessons/${lessonId}`);
    return res.data;
  },

  getThreads: async (params = {}, signal) => {
    const res = await apiClient.get('communication/threads', { params, signal });
    return res.data;
  },

  getThreadDetails: async (id) => {
    const res = await apiClient.get(`communication/threads/${id}`);
    return res.data;
  },

  createThread: async (payload) => {
    const res = await apiClient.post('communication/threads', payload);
    return res.data;
  },

  getThreadMessages: async (threadId, params = {}) => {
    const res = await apiClient.get(`communication/threads/${threadId}/messages`, { params });
    return res.data;
  },

  createReply: async (threadId, payload) => {
    const res = await apiClient.post(`communication/threads/${threadId}/messages`, payload);
    return res.data;
  },

  toggleReaction: async (messageId, reaction) => {
    const res = await apiClient.post(`communication/messages/${messageId}/reaction`, { reaction });
    return res.data;
  },
};

export default communicationApi;
