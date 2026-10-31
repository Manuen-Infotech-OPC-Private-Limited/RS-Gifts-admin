import apiClient from './api';

export const reviewService = {
  // Fetch reviews
  async fetchReviews() {
    try {
      const res = await apiClient.get('/admin/reviews');
      return res.data?.reviews || [];
    } catch (err) {
      console.warn('Could not load backend reviews:', err.message);
      return [];
    }
  },

  // Create review
  async createReview(payload) {
    const res = await apiClient.post('/admin/reviews', payload);
    return res.data?.review;
  },

  // Update review
  async updateReview(id, payload) {
    return await apiClient.put(`/admin/reviews/${id}`, payload);
  },

  // Toggle approve review
  async toggleApprove(id, isApproved) {
    return await apiClient.patch(`/admin/reviews/${id}/toggle-approve`, { isApproved });
  },

  // Delete review
  async deleteReview(id) {
    return await apiClient.delete(`/admin/reviews/${id}`);
  }
};

export default reviewService;

