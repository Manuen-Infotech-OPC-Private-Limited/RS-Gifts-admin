import React, { useState } from 'react';
import {
  Store,
  Save
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { CloudinaryUpload } from '../common/CloudinaryUpload';

export const SettingsModule = () => {
  const { settings, updateSettings } = useAdmin();

  const [formData, setFormData] = useState({ ...settings });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const errs = {};
    if (!formData.storeName.trim()) errs.storeName = 'Store name is required.';
    if (!formData.supportEmail.trim() || !formData.supportEmail.includes('@')) {
      errs.supportEmail = 'Valid support email is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    updateSettings(formData);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-charcoal tracking-tight">Store & Admin Settings</h1>
        <p className="text-sm text-soft-gray mt-1">
          Configure RS Gifts store identity, contact details, and address.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-surface p-6 rounded-2xl border border-soft-gray/20 shadow-card space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-soft-gray/15">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-charcoal">Store Identity & Contact</h3>
              <p className="text-xs text-soft-gray">General information shown on receipts and store header</p>
            </div>
          </div>

          <div>
            <CloudinaryUpload
              value={formData.storeLogo || ''}
              onChange={(url) => setFormData({ ...formData, storeLogo: url })}
              label="Store Logo"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Store Name
              </label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-charcoal bg-surface focus:border-primary ${errors.storeName ? 'border-error' : 'border-soft-gray/25'
                  }`}
              />
              {errors.storeName && <p className="text-xs text-error mt-1">{errors.storeName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Store Tagline
              </label>
              <input
                type="text"
                value={formData.storeTagline}
                onChange={(e) => setFormData({ ...formData, storeTagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Customer Support Email
              </label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-charcoal bg-surface focus:border-primary ${errors.supportEmail ? 'border-error' : 'border-soft-gray/25'
                  }`}
              />
              {errors.supportEmail && (
                <p className="text-xs text-error mt-1">{errors.supportEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Contact Number
              </label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.storeAddress}
              onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:border-primary"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-primary text-surface font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Store Settings
          </button>
        </div>
      </form>
    </div>
  );
};
