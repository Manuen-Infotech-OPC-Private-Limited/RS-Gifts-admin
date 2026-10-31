import apiClient from './api';

export const productService = {
  // Load products (tries /admin/products first, falls back to /customer/products)
  async fetchProducts() {
    try {
      const res = await apiClient.get('/admin/products');
      const live = res.data?.products || [];
      if (live.length > 0) return live;
    } catch {
      // Fallback to customer products if admin endpoint is not yet authorized or offline
    }

    try {
      const res = await apiClient.get('/customer/products');
      return res.data?.products || (Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Could not load live backend products:', err.message);
      return [];
    }
  },

  // Create a new product
  async createProduct(payload) {
    const res = await apiClient.post('/admin/products', payload);
    return res.data?.product;
  },

  // Update existing product by ID
  async updateProduct(id, updatedFields) {
    if (!id || String(id).startsWith('prod-')) return null;
    const res = await apiClient.put(`/admin/products/${id}`, updatedFields);
    return res.data?.product;
  },

  // Delete product by ID
  async deleteProduct(id) {
    if (!id || String(id).startsWith('prod-')) return null;
    return await apiClient.delete(`/admin/products/${id}`);
  },

  // Toggle active/visibility
  async toggleActive(id) {
    if (!id || String(id).startsWith('prod-')) return null;
    return await apiClient.patch(`/admin/products/${id}/toggle-active`);
  },

  // Toggle featured status
  async toggleFeatured(id) {
    if (!id || String(id).startsWith('prod-')) return null;
    const res = await apiClient.patch(`/admin/products/${id}/toggle-featured`);
    return res.data?.product;
  },

  // Update inventory stock
  async updateStock(productId, qty) {
    if (!productId || String(productId).startsWith('prod-')) return null;
    return await apiClient.patch(`/admin/products/${productId}/stock`, { stock: qty });
  }
};

export default productService;

