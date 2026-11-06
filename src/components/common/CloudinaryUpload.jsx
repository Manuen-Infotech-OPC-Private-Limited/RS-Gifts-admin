import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Link2, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Image as ImageIcon,
  Plus,
  X
} from 'lucide-react';
import { uploadToCloudinary, uploadMultipleFiles, validateImageFile } from '../../services/cloudinary';
import { useAdmin } from '../../context/AdminContext';

export const CloudinaryUpload = ({
  value,
  onChange,
  gallery = null,
  onGalleryChange = null,
  maxGallerySlots = 4,
  label = '',
  hint = '',
  recommendedDimensions = '1200 × 600 px',
  preferredSize,
  aspectRatio = '2:1 (landscape)',
  maxSizeMB = 5,
  children,
}) => {
  const { settings } = useAdmin();
  const fileInputRef = useRef(null);
  const targetSlotRef = useRef(null);

  const isGalleryMode = Array.isArray(gallery) && typeof onGalleryChange === 'function';
  const currentGallery = isGalleryMode ? gallery.filter(Boolean) : [];
  const [activeSlot, setActiveSlot] = useState(0);

  const displayDimensions = preferredSize || recommendedDimensions;

  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');

  const cloudName = settings?.cloudinaryCloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = settings?.cloudinaryUploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Active preview image is strictly the main image (value)
  const currentPreview = value || '';

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setError(null);

    // If one of the 4 slots below was clicked
    if (isGalleryMode && targetSlotRef.current !== null) {
      const slotIdx = targetSlotRef.current;
      targetSlotRef.current = null;
      const file = files[0];
      const validation = validateImageFile(file, maxSizeMB);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      try {
        setUploading(true);
        const result = await uploadToCloudinary(file, cloudName, uploadPreset);
        const updated = Array.isArray(gallery) ? [...gallery] : [];
        updated[slotIdx] = result.url;
        onGalleryChange(updated.filter(Boolean));
        setShowUrlInput(false);
      } catch (err) {
        setError(err.message || 'Image upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
      return;
    }

    // Otherwise, upload is for the Main Image (top box)
    const file = files[0];
    const validation = validateImageFile(file, maxSizeMB);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    try {
      setUploading(true);
      const result = await uploadToCloudinary(file, cloudName, uploadPreset);
      if (onChange) onChange(result.url);
      setShowUrlInput(false);
    } catch (err) {
      setError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleApplyUrl = () => {
    const trimmed = (urlDraft || '').trim();
    if (!trimmed) {
      setError('Please provide a valid image URL');
      return;
    }
    setError(null);

    if (isGalleryMode && targetSlotRef.current !== null) {
      const slotIdx = targetSlotRef.current;
      targetSlotRef.current = null;
      const updated = Array.isArray(gallery) ? [...gallery] : [];
      updated[slotIdx] = trimmed;
      onGalleryChange(updated.filter(Boolean));
      setShowUrlInput(false);
      setUrlDraft('');
      return;
    }

    // Otherwise apply to Main Image
    if (onChange) onChange(trimmed);
    setShowUrlInput(false);
    setUrlDraft('');
  };

  const handleRemoveImage = () => {
    setError(null);
    setUrlDraft('');
    setShowUrlInput(false);
    if (onChange) onChange('');
  };

  const handleRemoveSlot = (slotIdx) => {
    if (!isGalleryMode) return;
    const updated = (gallery || []).filter((_, i) => i !== slotIdx);
    onGalleryChange(updated);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
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
    <div className="space-y-2 select-none">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal">
          {label}
        </label>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={isGalleryMode}
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        disabled={uploading}
        className="hidden"
      />

      {/* Main 2-Column Layout */}
      <div 
        className="transition-all"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Left Column: Image Preview + 4 Slots */}
          <div className="md:col-span-7 flex flex-col gap-3">
            <div className={`bg-[#FAF7F5] p-4 rounded-2xl flex flex-col justify-between min-h-[260px] ${
              dragActive ? 'ring-2 ring-primary bg-secondary/10' : ''
            }`}>
              {/* Image Preview Area */}
              <div className="w-full flex-1 flex items-center justify-center min-h-[190px] relative">
                {uploading ? (
                  <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-xs font-semibold text-charcoal">Uploading to Cloudinary...</p>
                    <span className="text-[11px] text-soft-gray">Please wait while the image is processed</span>
                  </div>
                ) : currentPreview ? (
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <img
                      src={currentPreview}
                      alt="Product Preview"
                      className="max-h-[180px] w-auto max-w-full object-contain drop-shadow-xs transition-transform duration-200 hover:scale-[1.02]"
                      onError={() => {
                        setError('Unable to load image from URL. Please check the link or upload a new image.');
                      }}
                    />
                  </div>
                ) : (
                  <div 
                    onClick={() => {
                      targetSlotRef.current = null;
                      triggerFileInput();
                    }}
                    className="w-full h-full border-2 border-dashed border-neutral-300 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:border-primary/60 hover:bg-white/60 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-primary mb-2">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-charcoal">No Image Selected</p>
                    <p className="text-[11px] text-soft-gray mt-1">
                      Drag and drop an image here, or use the buttons on the right
                    </p>
                  </div>
                )}
              </div>

              {/* Status Banner (shown when image is ready) */}
              {currentPreview && !uploading && (
                <div className="mt-3 p-3 rounded-xl bg-[#EDF7ED] border border-[#C8E6C9] flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#1B5E20] leading-tight">
                      Image ready and fully visible
                    </p>
                    <p className="text-[11px] text-[#2E7D32]/85 mt-0.5 leading-tight">
                      The image is displayed as it will appear on the website.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Exactly 4 Square Slots Underneath the Preview (as drawn in red) */}
            {isGalleryMode && (
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: maxGallerySlots }).map((_, idx) => {
                  const slotImage = (gallery || [])[idx];

                  return slotImage ? (
                    <div
                      key={idx}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-white border-2 border-neutral-200 hover:border-[#821D38]/60 transition-all shadow-xs"
                    >
                      <img
                        src={slotImage}
                        alt={`Additional Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSlot(idx);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  ) : (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        targetSlotRef.current = idx;
                        triggerFileInput();
                      }}
                      disabled={uploading}
                      className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 hover:border-[#821D38] hover:bg-white/70 flex flex-col items-center justify-center text-neutral-400 hover:text-[#821D38] transition-all cursor-pointer"
                      title={`Add photo ${idx + 1}`}
                    >
                      <Plus className="w-5 h-5 stroke-[2]" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Action Buttons & Image Requirements */}
          <div className="md:col-span-5 py-1 px-1 flex flex-col justify-between h-full">
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="space-y-2.5">
              {/* Button 1: Replace / Upload Image */}
              <button
                type="button"
                onClick={() => {
                  targetSlotRef.current = null;
                  triggerFileInput();
                }}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#821D38] hover:bg-[#6E162E] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{currentPreview ? 'Upload / Add Image' : 'Upload Image'}</span>
              </button>

              {/* Button 2: Use Image URL */}
              <button
                type="button"
                onClick={() => {
                  setShowUrlInput(!showUrlInput);
                  if (!showUrlInput && currentPreview) setUrlDraft(currentPreview);
                }}
                disabled={uploading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-neutral-800 border font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer active:scale-[0.99] ${
                  showUrlInput 
                    ? 'border-[#821D38] bg-[#FAF5F7] text-[#821D38]' 
                    : 'bg-white hover:bg-neutral-50 border-neutral-300'
                }`}
              >
                <Link2 className="w-4 h-4 text-neutral-600" />
                <span>Use Image URL</span>
              </button>

              {/* URL Input Drawer */}
              {showUrlInput && (
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 animate-fadeIn text-left">
                  <label className="block text-[11px] font-semibold text-neutral-600 uppercase tracking-wide">
                    Direct Image Link
                  </label>
                  <input
                    type="url"
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 bg-white text-neutral-800 focus:outline-none focus:border-[#821D38] focus:ring-1 focus:ring-[#821D38]"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(false)}
                      className="px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-900 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-3 py-1 text-xs font-semibold bg-[#821D38] hover:bg-[#6E162E] text-white rounded-lg transition-colors shadow-2xs"
                    >
                      Apply URL
                    </button>
                  </div>
                </div>
              )}

              {/* Button 3: Remove Image */}
              {currentPreview && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer active:scale-[0.99]"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Remove Image</span>
                </button>
              )}
            </div>

            {/* Image Requirements Checklist */}
            <div className="pt-1">
              <p className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 text-left">
                Image Requirements
              </p>
              <ul className="space-y-1.5 text-left">
                <li className="flex items-center gap-2 text-xs text-neutral-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.2]" />
                  <span>Recommended: {displayDimensions}</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-neutral-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.2]" />
                  <span>JPG, PNG or WebP</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-neutral-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.2]" />
                  <span>Max size: {maxSizeMB} MB</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-neutral-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.2]" />
                  <span>Aspect ratio: {aspectRatio}</span>
                </li>
              </ul>
            </div>
          </div>
          {children && (
              <div className="pt-3 mt-auto">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default CloudinaryUpload;
