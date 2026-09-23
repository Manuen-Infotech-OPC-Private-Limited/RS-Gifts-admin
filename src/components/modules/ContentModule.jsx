import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Star,
  Image as ImageIcon
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CloudinaryUpload } from '../common/CloudinaryUpload';

export const ContentModule = () => {
  const {
    banners,
    products,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleBannerActive,
    toggleProductFeatured
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('banners');

  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    buttonText: '',
    buttonLink: '',
    imageUrl: ''
  });
  const [bannerErrors, setBannerErrors] = useState({});

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      title: '',
      subtitle: '',
      buttonText: 'Shop Gifts',
      buttonLink: '/products',
      imageUrl: ''
    });
    setBannerErrors({});
    setIsBannerModalOpen(true);
  };

  const handleOpenEditBanner = (b) => {
    setEditingBanner(b);
    setBannerForm({ ...b });
    setBannerErrors({});
    setIsBannerModalOpen(true);
  };

  const handleBannerSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!bannerForm.title.trim()) errs.title = 'Banner headline is required.';
    if (!bannerForm.imageUrl.trim()) errs.imageUrl = 'Banner image is required.';
    if (Object.keys(errs).length > 0) {
      setBannerErrors(errs);
      return;
    }

    if (editingBanner) {
      updateBanner(editingBanner.id, bannerForm);
    } else {
      addBanner(bannerForm);
    }
    setIsBannerModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal tracking-tight">Website Content & Curation</h1>
          <p className="text-sm text-soft-gray mt-1">
            Control customer homepage hero slides and curate featured gift picks.
          </p>
        </div>

        {activeTab === 'banners' && (
          <button
            onClick={handleOpenAddBanner}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-surface font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Hero Banner
          </button>
        )}
      </div>

      <div className="flex border-b border-soft-gray/20">
        <button
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'banners'
              ? 'border-primary text-primary'
              : 'border-transparent text-soft-gray hover:text-charcoal'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Homepage Banners ({banners.length})
        </button>

        <button
          onClick={() => setActiveTab('featured')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'featured'
              ? 'border-primary text-primary'
              : 'border-transparent text-soft-gray hover:text-charcoal'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Featured Gifts Showcase ({products.filter(p => p.featured).length})
        </button>
      </div>

      {activeTab === 'banners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.length === 0 ? (
            <div className="col-span-full bg-surface p-12 rounded-2xl border border-soft-gray/20 text-center shadow-card">
              <ImageIcon className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="text-base font-bold text-charcoal">No Hero Banners Yet</h3>
              <p className="text-xs text-soft-gray mt-1 max-w-sm mx-auto leading-relaxed">
                Add homepage banners with custom promotional headlines, images, and shop action buttons.
              </p>
              <button
                onClick={handleOpenAddBanner}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-surface text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Hero Banner
              </button>
            </div>
          ) : (
            banners.map((banner) => (
              <div
                key={banner.id}
                className="bg-surface rounded-2xl border border-soft-gray/20 shadow-card overflow-hidden flex flex-col justify-between"
              >
                <div className="h-44 relative bg-warm-ivory">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cdcd?w=800';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent flex flex-col justify-end p-5">
                    <h3 className="text-surface font-bold text-lg leading-snug drop-shadow-sm">
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-surface/80 text-xs mt-1 line-clamp-1">{banner.subtitle}</p>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => toggleBannerActive(banner.id)}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm border ${
                        banner.active
                          ? 'bg-surface text-success border-success/30'
                          : 'bg-surface text-soft-gray border-soft-gray/30'
                      }`}
                    >
                      {banner.active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between bg-surface border-t border-soft-gray/10">
                  <div className="text-xs text-soft-gray font-medium truncate max-w-[200px]">
                    Button: <span className="text-charcoal font-semibold">{banner.buttonText || 'None'}</span> ({banner.buttonLink || '#'})
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditBanner(banner)}
                      className="p-1.5 rounded-lg text-soft-gray hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteTarget({ type: 'banner', id: banner.id, name: banner.title })
                      }
                      className="p-1.5 rounded-lg text-soft-gray hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'featured' && (
        <div className="bg-surface rounded-2xl border border-soft-gray/20 shadow-card p-6 space-y-4">
          {products.length === 0 ? (
            <div className="text-center py-12 text-sm text-soft-gray">
              No products found in catalog. Add gifts to your product catalog first to feature them here.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    p.featured
                      ? 'border-accent/40 bg-accent/5'
                      : 'border-soft-gray/20 bg-warm-ivory/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-12 h-12 rounded-xl object-cover border border-soft-gray/20"
                    />
                    <div>
                      <h4 className="font-semibold text-sm text-charcoal line-clamp-1">{p.title}</h4>
                      <p className="text-xs text-soft-gray">{p.category}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleProductFeatured(p.id)}
                    className={`p-2 rounded-xl border transition-all ${
                      p.featured
                        ? 'bg-accent text-surface border-accent shadow-sm'
                        : 'bg-surface text-soft-gray border-soft-gray/25 hover:text-charcoal'
                    }`}
                    title={p.featured ? 'Remove from Featured' : 'Mark as Featured'}
                  >
                    <Star className="w-4 h-4" fill={p.featured ? 'currentColor' : 'none'} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        title={editingBanner ? 'Edit Hero Banner' : 'Create Hero Banner'}
      >
        <form onSubmit={handleBannerSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
              Headline Title
            </label>
            <input
              type="text"
              value={bannerForm.title}
              onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
              placeholder="e.g. Crafted with Love, Given with Joy"
              className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:border-primary"
            />
            {bannerErrors.title && <p className="text-xs text-error mt-1">{bannerErrors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
              Subtitle Description
            </label>
            <textarea
              rows={2}
              value={bannerForm.subtitle}
              onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
              placeholder="e.g. Discover personalized engraved keepsakes and luxury celebration hampers."
              className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Button Text
              </label>
              <input
                type="text"
                value={bannerForm.buttonText}
                onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                placeholder="Shop Collection"
                className="w-full px-3.5 py-2 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Button Link
              </label>
              <input
                type="text"
                value={bannerForm.buttonLink}
                onChange={(e) => setBannerForm({ ...bannerForm, buttonLink: e.target.value })}
                placeholder="/products"
                className="w-full px-3.5 py-2 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:border-primary"
              />
            </div>
          </div>

          <CloudinaryUpload
            value={bannerForm.imageUrl}
            onChange={(url) => setBannerForm({ ...bannerForm, imageUrl: url })}
            label="Banner Hero Image *"
          />
          {bannerErrors.imageUrl && <p className="text-xs text-error -mt-3">{bannerErrors.imageUrl}</p>}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-soft-gray/15">
            <button
              type="button"
              onClick={() => setIsBannerModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-soft-gray/25 text-sm font-medium text-charcoal hover:border-primary hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary text-surface text-sm font-semibold hover:bg-primary/90 shadow-sm"
            >
              Save Banner
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget?.type === 'banner') deleteBanner(deleteTarget.id);
          setDeleteTarget(null);
        }}
        title="Delete Hero Banner"
        message="Are you sure you want to remove this hero banner?"
      />
    </div>
  );
};
