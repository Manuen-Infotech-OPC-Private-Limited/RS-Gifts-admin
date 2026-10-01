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

  const handleSave = (e) => {
    e.preventDefault();
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
              <h3 className="text-base font-bold text-charcoal">Store Logo & Branding</h3>
              <p className="text-xs text-soft-gray">Store logo shown on receipts and website header</p>
            </div>
          </div>

          <div>
            <CloudinaryUpload
              value={formData.storeLogo || ''}
              onChange={(url) => setFormData({ ...formData, storeLogo: url })}
              label="Store Logo"
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
