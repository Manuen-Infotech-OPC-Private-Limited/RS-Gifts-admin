import apiClient from './api';

export const customerService = {
  // Fetch all registered customers with aggregate stats
  async fetchCustomers(search = '') {
    try {
      const params = search ? { search } : {};
      const res = await apiClient.get('/admin/customers', { params });
      return res.data?.customers || [];
    } catch (err) {
      console.warn('Could not load live backend customers:', err.message);
      return [];
    }
  },

  // Fetch detailed customer profile and past orders
  async fetchCustomerById(customerId) {
    try {
      const res = await apiClient.get(`/admin/customers/${customerId}`);
      return res.data || null;
    } catch (err) {
      console.warn(`Could not load customer ${customerId}:`, err.message);
      return null;
    }
  },

  // Toggle active / blocked status
  async toggleStatus(customerId) {
    const res = await apiClient.patch(`/admin/customers/${customerId}/toggle-status`);
    return res.data;
  },
};

export default customerService;
