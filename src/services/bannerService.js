import apiClient from './api';

export const bannerService = {
  // Fetch banners
  async fetchBanners() {
    try {
      const res = await apiClient.get('/admin/content/banners');
      const live = res.data?.banners || [];
      if (live.length > 0) return live;
    } catch {
      // Fallback
    }

    try {
      const res = await apiClient.get('/customer/content/banners');
      return res.data?.banners || [];
    } catch (err) {
      console.warn('Could not load live banners:', err.message);
      return [];
    }
  },

  // Create banner
  async createBanner(bannerData) {
    const res = await apiClient.post('/admin/content/banners', {
      title: bannerData.title,
      subtitle: bannerData.subtitle,
      image: bannerData.imageUrl || bannerData.image,
      link: bannerData.buttonLink || bannerData.link || '/products',
      buttonText: bannerData.buttonText || 'Shop Gifts',
      position: 'hero',
      active: true,
    });
    return res.data?.banner;
  },

  // Update banner
  async updateBanner(id, updatedFields) {
    if (!id || String(id).startsWith('BAN-')) return null;
    return await apiClient.put(`/admin/content/banners/${id}`, {
      title: updatedFields.title,
      subtitle: updatedFields.subtitle,
      image: updatedFields.imageUrl || updatedFields.image,
      link: updatedFields.buttonLink || updatedFields.link,
      buttonText: updatedFields.buttonText,
    });
  },

  // Delete banner
  async deleteBanner(id) {
    if (!id || String(id).startsWith('BAN-')) return null;
    return await apiClient.delete(`/admin/content/banners/${id}`);
  },

  // Toggle banner active
  async toggleActive(id) {
    if (!id || String(id).startsWith('BAN-')) return null;
    return await apiClient.patch(`/admin/content/banners/${id}/toggle-active`);
  }
};

export default bannerService;

