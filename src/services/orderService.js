import apiClient from './api';

export const orderService = {
  // Fetch all orders
  async fetchOrders() {
    try {
      const res = await apiClient.get('/admin/orders');
      return res.data?.orders || [];
    } catch (err) {
      console.warn('Could not load live backend orders:', err.message);
      return [];
    }
  },

  // Update order status
  async updateStatus(targetId, newStatus) {
    return await apiClient.patch(`/admin/orders/${targetId}/status`, { status: newStatus });
  },

  // Update order courier tracking info
  async updateTracking(targetId, trackingData) {
    return await apiClient.patch(`/admin/orders/${targetId}/tracking`, trackingData);
  },

  // Delete order
  async deleteOrder(targetId) {
    return await apiClient.delete(`/admin/orders/${targetId}`);
  }
};

export default orderService;

