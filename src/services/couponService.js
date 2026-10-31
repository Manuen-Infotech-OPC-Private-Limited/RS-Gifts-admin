import apiClient from './api';

export const couponService = {
  // Fetch coupons
  async fetchCoupons() {
    try {
      const res = await apiClient.get('/admin/coupons');
      const live = res.data?.coupons || [];
      if (live.length > 0) return live;
    } catch {
      // Fallback
    }

    try {
      const res = await apiClient.get('/customer/coupons');
      return res.data?.coupons || [];
    } catch (err) {
      console.warn('Could not load live coupons:', err.message);
      return [];
    }
  },

  // Create coupon
  async createCoupon(payload) {
    const res = await apiClient.post('/admin/coupons', {
      code: payload.code,
      discountType: payload.discountType === 'fixed' ? 'flat' : payload.discountType,
      discountValue: payload.discountValue,
      minOrderValue: payload.minSpend,
      minSpend: payload.minSpend,
      maxDiscount: payload.maxDiscount,
      expiryDate: payload.expiryDate || null,
      usageLimit: payload.usageLimit,
      active: payload.active,
      description: payload.description || `${payload.code} special offer`,
    });
    return res.data?.coupon;
  },

  // Update coupon
  async updateCoupon(id, payload) {
    const res = await apiClient.put(`/admin/coupons/${id}`, payload);
    return res.data?.coupon;
  },

  // Delete coupon
  async deleteCoupon(id) {
    return await apiClient.delete(`/admin/coupons/${id}`);
  },

  // Toggle active
  async toggleActive(id, newActive) {
    try {
      return await apiClient.patch(`/admin/coupons/${id}/toggle-active`);
    } catch {
      return await apiClient.put(`/admin/coupons/${id}`, { active: newActive });
    }
  }
};

export default couponService;

