import apiClient from './apiClient';

export const experienceBookingApi = {
  async create(formData) {
    const response = await apiClient.post('experience-bookings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return response?.data?.data ?? response?.data;
  },
  async get(id) {
    const response = await apiClient.get(`experience-bookings/${encodeURIComponent(id)}`);
    return response?.data?.data ?? response?.data;
  },
  async getBooking(id) {
    const response = await apiClient.get(`experience-bookings/${encodeURIComponent(id)}`);
    return response?.data?.data ?? response?.data;
  },
};
