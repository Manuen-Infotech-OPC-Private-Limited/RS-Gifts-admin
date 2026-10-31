import apiClient from './api';

export const inquiryService = {
  // Fetch inquiries
  async fetchInquiries() {
    try {
      const res = await apiClient.get('/admin/inquiries');
      return res.data?.inquiries || [];
    } catch (err) {
      console.warn('Could not load live backend inquiries:', err.message);
      return [];
    }
  },

  // Update inquiry status (e.g. 'Read', 'Replied')
  async updateStatus(inquiryId, status) {
    return await apiClient.patch(`/admin/inquiries/${inquiryId}/status`, { status });
  },

  // Delete inquiry
  async deleteInquiry(inquiryId) {
    return await apiClient.delete(`/admin/inquiries/${inquiryId}`);
  }
};

export default inquiryService;

