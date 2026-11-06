import React, { useState, useEffect } from 'react';
import {
  Store,
  Save,
  Globe,
  Instagram,
  Youtube,
  Facebook,
  ExternalLink,
  Truck,
  IndianRupee,
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
    standardShippingFee: 0,
    freeShippingThreshold: 0,
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
        standardShippingFee: settings.standardShippingFee !== undefined ? Number(settings.standardShippingFee) : (prev.standardShippingFee ?? 0),
        freeShippingThreshold: settings.freeShippingThreshold !== undefined ? Number(settings.freeShippingThreshold) : (prev.freeShippingThreshold ?? 0),
      }));
    }
  }, [settings]);

  const handleSaveLogo = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    updateSettings({
      ...formData,
      storeLogo: formData.storeLogo || '',
    });
  };

  const handleSaveDelivery = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    updateSettings({
      ...formData,
      standardShippingFee: Number(formData.standardShippingFee) || 0,
      freeShippingThreshold: Number(formData.freeShippingThreshold) || 0,
    });
  };

  const handleSaveSocial = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    updateSettings({
      ...formData,
      facebookUrl: formData.facebookUrl || '',
      instagramUrl: formData.instagramUrl || '',
      youtubeUrl: formData.youtubeUrl || '',
      pinterestUrl: formData.pinterestUrl || '',
    });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl pb-10">
      <div>
        <h1 className="text-2xl font-bold text-charcoal tracking-tight">Settings</h1>
        <p className="text-sm text-soft-gray mt-1">
          Configure RS Gifts store identity, delivery charges, social channels, and public details.
        </p>
      </div>

      <div className="space-y-8">
        {/* Delivery Charges & Shipping Rates Section */}
        <div className="bg-surface p-6 rounded-2xl border border-soft-gray/20 shadow-card space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-charcoal">Delivery Charges & Shipping Rates</h3>
                <p className="text-xs text-soft-gray">
                  Configure delivery charges applied across all products on RS Gifts customer checkout.
                </p>
              </div>
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Standard Delivery Charge */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-charcoal">
                <IndianRupee className="w-3.5 h-3.5 text-primary" />
                Standard Delivery Charge (₹)
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soft-gray font-semibold text-sm">
                  ₹
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.standardShippingFee ?? 0}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                    setFormData(prev => ({ ...prev, standardShippingFee: val }));
                  }}
                  placeholder="0"
                  className="w-full pl-8 pr-3.5 py-2.5 text-sm rounded-xl border border-soft-gray/30 bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-charcoal font-medium"
                />
              </div>
              <p className="text-[11px] text-soft-gray leading-relaxed">
                Applied to all customer orders. Enter <strong className="text-charcoal">0</strong> for <span className="text-green-600 font-semibold">100% Free Delivery</span> on all products.
              </p>
            </div>

            {/* Free Delivery Threshold */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-charcoal">
                <IndianRupee className="w-3.5 h-3.5 text-primary" />
                Free Delivery Above Order Amount (₹)
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soft-gray font-semibold text-sm">
                  ₹
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.freeShippingThreshold ?? 0}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                    setFormData(prev => ({ ...prev, freeShippingThreshold: val }));
                  }}
                  placeholder="0"
                  className="w-full pl-8 pr-3.5 py-2.5 text-sm rounded-xl border border-soft-gray/30 bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-charcoal font-medium"
                />
              </div>
            </div>
          </div>

          {/* Save Button for Delivery */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleSaveDelivery}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-surface font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Delivery Settings
            </button>
          </div>
        </div>

        {/* Store Logo Section */}
        <div className="bg-surface p-6 rounded-2xl border border-soft-gray/20 shadow-card space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-charcoal">Logo</h3>
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
                type="button"
                onClick={handleSaveLogo}
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
                <h3 className="text-base font-bold text-charcoal">Social Media Links</h3>
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

          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-soft-gray">
              Note: If you leave a link empty, that icon in the footer will not redirect anywhere.
            </p>
            <button
              type="button"
              onClick={handleSaveSocial}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-surface font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm cursor-pointer ml-auto"
            >
              <Save className="w-4 h-4" />
              Save Social Links
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
