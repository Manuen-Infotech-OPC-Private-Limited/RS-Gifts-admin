import apiClient from './api';

export const categoryService = {
  // Load categories (tries admin first, then customer)
  async fetchCategories() {
    try {
      const res = await apiClient.get('/admin/categories');
      const live = res.data?.categories || [];
      if (live.length > 0) return live;
    } catch {
      // Fallback to customer categories
    }

    try {
      const res = await apiClient.get('/customer/categories');
      return res.data?.categories || [];
    } catch (err) {
      console.warn('Could not load categories:', err.message);
      return [];
    }
  },

  // Create a new category
  async createCategory(categoryData) {
    const res = await apiClient.post('/admin/categories', categoryData);
    return res.data?.category;
  },

  // Update category
  async updateCategory(targetId, payload) {
    const res = await apiClient.put(`/admin/categories/${targetId}`, payload);
    return res.data?.category;
  },

  // Delete category
  async deleteCategory(targetId) {
    return await apiClient.delete(`/admin/categories/${targetId}`);
  },

  // Toggle category active
  async toggleActive(targetId) {
    return await apiClient.patch(`/admin/categories/${targetId}/toggle-active`);
  }
};

export default categoryService;

