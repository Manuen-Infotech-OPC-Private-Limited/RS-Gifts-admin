import React, { useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadToCloudinary, validateImageFile } from '../../services/cloudinary';
import { useAdmin } from '../../context/AdminContext';

export const CloudinaryUpload = ({
  value,
  onChange,
  label = 'Product Image',
  hint = ''
}) => {
  const { settings } = useAdmin();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [useUrlInput, setUseUrlInput] = useState(false);

  const cloudName = settings?.cloudinaryCloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = settings?.cloudinaryUploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const handleFile = async (file) => {
    if (!file) return;

    setError(null);
    const validation = validateImageFile(file, 5);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    try {
      setUploading(true);
      const result = await uploadToCloudinary(file, cloudName, uploadPreset);
      onChange(result.url);
    } catch (err) {
      setError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-charcoal">{label}</label>
        <button
          type="button"
          onClick={() => setUseUrlInput(!useUrlInput)}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {useUrlInput ? 'Switch to File Upload' : 'Paste Direct Image URL'}
        </button>
      </div>

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-soft-gray/20 bg-warm-ivory group h-48 flex items-center justify-center">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              setError('Unable to load image from provided link.');
            }}
          />
          <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-2 rounded-lg bg-surface text-error hover:bg-error hover:text-surface transition-colors shadow"
              title="Remove Image"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-surface/90 text-charcoal text-xs font-medium flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            Image Ready
          </div>
        </div>
      ) : useUrlInput ? (
        <div className="space-y-2">
          <input
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 bg-surface text-sm text-charcoal focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {hint && <p className="text-xs text-soft-gray">{hint}</p>}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${dragActive
            ? 'border-primary bg-secondary/15'
            : 'border-soft-gray/30 hover:border-primary/60 bg-warm-ivory/50'
            }`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm font-medium text-charcoal">
                  Processing & Uploading Image...
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-primary">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-charcoal">
                  <span className="text-primary font-semibold">Click to upload</span> or drag and drop
                </p>
                {hint && <p className="text-xs text-soft-gray">{hint}</p>}
                {cloudName && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-accent font-medium mt-1">
                    ☁️ Cloudinary: {cloudName}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-error mt-1 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
