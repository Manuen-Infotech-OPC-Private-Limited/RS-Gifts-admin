import React, { useState, useEffect } from 'react';
import {
  Store,
  Save,
  Globe,
  Instagram,
  Youtube,
  Facebook,
  ExternalLink
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { CloudinaryUpload } from '../common/CloudinaryUpload';

export const SettingsModule = () => {
  const { settings, updateSettings } = useAdmin();

  const [formData, setFormData] = useState({
    storeLogo: '',
    facebookUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    pinterestUrl: '',
    ...settings
  });

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        ...settings,
        facebookUrl: settings.facebookUrl ?? prev.facebookUrl ?? '',
        instagramUrl: settings.instagramUrl ?? prev.instagramUrl ?? '',
        youtubeUrl: settings.youtubeUrl ?? prev.youtubeUrl ?? '',
        pinterestUrl: settings.pinterestUrl ?? prev.pinterestUrl ?? '',
      }));
    }
  }, [settings]);

  const handleSave = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    updateSettings(formData);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl pb-10">
      <div>
        <h1 className="text-2xl font-bold text-charcoal tracking-tight">Settings</h1>
        <p className="text-sm text-soft-gray mt-1">
          Configure RS Gifts store identity, social channels, and public details.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Store Logo Section */}
        <div className="bg-surface p-6 rounded-2xl border border-soft-gray/20 shadow-card space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-charcoal">Store Logo</h3>
              <p className="text-xs text-soft-gray">Logo visible on the top navigation and footer</p>
            </div>
          </div>

          <div>
            <CloudinaryUpload
              value={formData.storeLogo || ''}
              onChange={(url) => setFormData(prev => ({ ...prev, storeLogo: url }))}
              label=""
            >
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-surface font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Logo
              </button>
            </CloudinaryUpload>
          </div>
        </div>

        {/* Social Media Links Section */}
        <div className="bg-surface p-6 rounded-2xl border border-soft-gray/20 shadow-card space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-charcoal">Footer Social Media Links</h3>
                <p className="text-xs text-soft-gray">
                  Configure dynamic URLs for customer storefront footer. Empty links will remain non-clickable.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Facebook URL */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-charcoal">
                <span className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center">
                  <Facebook className="w-3 h-3" />
                </span>
                Facebook URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://facebook.com/your-page"
                  value={formData.facebookUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, facebookUrl: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-soft-gray/30 bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-charcoal placeholder:text-soft-gray/60"
                />
                {formData.facebookUrl && (
                  <a
                    href={formData.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-soft-gray hover:text-primary transition-colors"
                    title="Test Facebook Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Instagram URL */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-charcoal">
                <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#C13584] text-white flex items-center justify-center">
                  <Instagram className="w-3 h-3" />
                </span>
                Instagram URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://instagram.com/your-handle"
                  value={formData.instagramUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagramUrl: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-soft-gray/30 bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-charcoal placeholder:text-soft-gray/60"
                />
                {formData.instagramUrl && (
                  <a
                    href={formData.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-soft-gray hover:text-primary transition-colors"
                    title="Test Instagram Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* YouTube URL */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-charcoal">
                <span className="w-5 h-5 rounded-full bg-[#FF0000] text-white flex items-center justify-center">
                  <Youtube className="w-3 h-3" />
                </span>
                YouTube URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://youtube.com/@your-channel"
                  value={formData.youtubeUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-soft-gray/30 bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-charcoal placeholder:text-soft-gray/60"
                />
                {formData.youtubeUrl && (
                  <a
                    href={formData.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-soft-gray hover:text-primary transition-colors"
                    title="Test YouTube Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between flex-wrap gap-3 border-t border-soft-gray/15">
            <p className="text-xs text-soft-gray">
              Note: If you leave a link empty, that icon in the footer will not redirect anywhere.
            </p>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-surface font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm cursor-pointer ml-auto"
            >
              <Save className="w-4 h-4" />
              Save Social Links
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
