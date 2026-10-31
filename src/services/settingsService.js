import apiClient from './api';

export const settingsService = {
  // Fetch store settings
  async fetchSettings() {
    try {
      const res = await apiClient.get('/admin/settings');
      if (res.data?.settings) return res.data.settings;
    } catch {
      // Fallback to customer content settings
    }

    try {
      const res = await apiClient.get('/customer/content/settings');
      return res.data?.settings || null;
    } catch {
      return null;
    }
  },

  // Update store settings
  async updateSettings(updatedSettings) {
    const res = await apiClient.put('/admin/settings', updatedSettings);
    return res.data?.settings;
  }
};

export default settingsService;

