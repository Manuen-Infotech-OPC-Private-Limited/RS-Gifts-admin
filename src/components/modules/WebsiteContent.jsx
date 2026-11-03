import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Star,
  Image as ImageIcon,
  Phone,
  Mail,
  MapPin,
  Clock,
  Save
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CloudinaryUpload } from '../common/CloudinaryUpload';
import apiClient from '../../services/api';

export const WebsiteContent = () => {
  const {
    banners,
    products,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleBannerActive,
    toggleProductFeatured,
    settings,
    updateSettings,
    showToast,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('banners');
  const [featuredFilter, setFeaturedFilter] = useState('all');

  const [contactForm, setContactForm] = useState({
    phone: settings?.contactPhone || '',
    altPhone: settings?.altContactPhone || '',
    email: settings?.contactEmail || settings?.supportEmail || '',
    altEmail: settings?.altContactEmail || '',
    location: settings?.storeAddress || '',
    hours: settings?.supportHours || '',
    altHours: settings?.altSupportHours || '',
    googleMapUrl: settings?.googleMapUrl || '',
  });
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactErrors, setContactErrors] = useState({});

  useEffect(() => {
    // Fetch live contact settings dynamically from MongoDB
    const fetchMongoSettings = async () => {
      try {
        let res;
        try {
          res = await apiClient.get('/admin/settings');
        } catch {
          res = await apiClient.get('/customer/content/settings');
        }
        const s = res?.data?.settings;
        if (s) {
          setContactForm({
            phone: s.contactPhone || '',
            altPhone: s.altContactPhone || '',
            email: s.contactEmail || s.supportEmail || '',
            altEmail: s.altContactEmail || '',
            location: s.storeAddress || '',
            hours: s.supportHours || '',
            altHours: s.altSupportHours || '',
            googleMapUrl: s.googleMapUrl || '',
          });
        }
      } catch (e) {
        console.warn('Could not fetch settings from MongoDB:', e);
      }
    };
    fetchMongoSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setContactForm(prev => ({
        phone: settings.contactPhone ?? prev.phone,
        altPhone: settings.altContactPhone ?? prev.altPhone,
        email: settings.contactEmail ?? settings.supportEmail ?? prev.email,
        altEmail: settings.altContactEmail ?? prev.altEmail,
        location: settings.storeAddress ?? prev.location,
        hours: settings.supportHours ?? prev.hours,
        altHours: settings.altSupportHours ?? prev.altHours,
        googleMapUrl: settings.googleMapUrl ?? prev.googleMapUrl,
      }));
    }
  }, [settings]);

  const handleSaveContact = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const errs = {};
    if (!contactForm.phone.trim()) errs.phone = 'Phone number is required.';
    if (!contactForm.email.trim()) errs.email = 'Support email is required.';
    if (!contactForm.location.trim()) errs.location = 'Store location is required.';
    if (!contactForm.hours.trim()) errs.hours = 'Support hours are required.';

    if (Object.keys(errs).length > 0) {
      setContactErrors(errs);
      return;
    }

    setIsSavingContact(true);
    try {
      await updateSettings({
        contactPhone: contactForm.phone.trim(),
        altContactPhone: contactForm.altPhone.trim(),
        contactEmail: contactForm.email.trim(),
        altContactEmail: contactForm.altEmail.trim(),
        storeAddress: contactForm.location.trim(),
        supportHours: contactForm.hours.trim(),
        altSupportHours: contactForm.altHours.trim(),
        googleMapUrl: contactForm.googleMapUrl.trim(),
      });
      const contactData = {
        phone: contactForm.phone.trim(),
        altPhone: contactForm.altPhone.trim(),
        email: contactForm.email.trim(),
        altEmail: contactForm.altEmail.trim(),
        location: contactForm.location.trim(),
        hours: contactForm.hours.trim(),
        altHours: contactForm.altHours.trim(),
        googleMapUrl: contactForm.googleMapUrl.trim(),
      };
      localStorage.setItem('rs_gifts_contact_info', JSON.stringify(contactData));
      window.dispatchEvent(new CustomEvent('rs_gifts_contact_updated', { detail: contactData }));
      showToast('Contact Us info saved & updated on live website!');
    } catch (err) {
      console.error(err);
      showToast('Failed to save contact info', 'error');
    } finally {
      setIsSavingContact(false);
    }
  };

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
    setBannerForm({
      title: b.title || '',
      subtitle: b.subtitle || '',
      buttonText: b.buttonText || 'Shop Gifts',
      buttonLink: b.buttonLink || b.link || '/products',
      imageUrl: b.imageUrl || b.image || '',
    });
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
      updateBanner(editingBanner.id || editingBanner._id, bannerForm);
    } else {
      addBanner(bannerForm);
    }
    setIsBannerModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal tracking-tight">Website Content</h1>
          <p className="text-sm text-soft-gray mt-1">
            Control customer homepage hero slides and curate featured gift picks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'banners' && (
            <button
              onClick={handleOpenAddBanner}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-surface font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Hero Banner
            </button>
          )}
          {activeTab === 'contact' && (
            <button
              onClick={handleSaveContact}
              disabled={isSavingContact}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-surface font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSavingContact ? 'Saving...' : 'Save Contact Info'}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 py-2 text-sm font-semibold transition-all cursor-pointer ${activeTab === 'banners'
            ? 'text-primary font-bold'
            : 'text-soft-gray hover:text-charcoal'
            }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Homepage Banners ({banners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('featured')}
          className={`flex items-center gap-2 py-2 text-sm font-semibold transition-all cursor-pointer ${activeTab === 'featured'
            ? 'text-primary font-bold'
            : 'text-soft-gray hover:text-charcoal'
            }`}
        >
          <span>Featured Gifts Showcase ({products.filter((p) => p.featured).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-2 py-2 text-sm font-semibold transition-all cursor-pointer ${activeTab === 'contact'
            ? 'text-primary font-bold'
            : 'text-soft-gray hover:text-charcoal'
            }`}
        >
          <Phone className="w-4 h-4" />
          <span>Contact Us</span>
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
            banners.map((banner) => {
              const bannerId = banner.id || banner._id;
              return (
                <div
                  key={bannerId}
                  className="bg-white rounded-2xl border border-[#E5DFE3] shadow-card overflow-hidden flex flex-col justify-between isolate"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <div className="h-44 relative overflow-hidden rounded-t-[15px] bg-[#FAF6F4]">
                    <img
                      src={banner.imageUrl || banner.image}
                      alt={banner.title}
                      className="w-full h-full object-cover rounded-t-[15px]"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/hero-banner-1.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5">
                      <h3 className="text-white font-bold text-lg leading-snug drop-shadow-md">
                        {banner.title}
                      </h3>
                      {banner.subtitle && (
                        <p className="text-white/90 text-xs mt-1 line-clamp-1 drop-shadow-sm">{banner.subtitle}</p>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => toggleBannerActive(bannerId)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm border transition-colors ${banner.active
                          ? 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                          : 'bg-white text-stone-500 border-stone-300 hover:bg-stone-50'
                          }`}
                      >
                        {banner.active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-between bg-white border-t border-[#E5DFE3]">
                    <div className="text-xs text-soft-gray font-medium truncate max-w-[200px]">
                      Button: <span className="text-charcoal font-semibold">{banner.buttonText || 'Shop Now'}</span> ({banner.buttonLink || banner.link || '/gifts'})
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditBanner(banner)}
                        className="p-1.5 rounded-lg text-soft-gray hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Edit banner"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTarget({ type: 'banner', id: bannerId, name: banner.title })
                        }
                        className="p-1.5 rounded-lg text-soft-gray hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Delete banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'featured' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
                <Star className="w-5 h-5 text-[#C9A45C] fill-[#C9A45C]" />
                Featured Products Curation
              </h2>
              <p className="text-xs text-soft-gray mt-0.5">
                Click the star on an item to add it to Featured Products or remove it from Featured Products.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-warm-ivory/60 p-1 rounded-xl border border-soft-gray/15 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFeaturedFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${featuredFilter === 'all'
                  ? 'bg-surface text-charcoal shadow-sm'
                  : 'text-soft-gray hover:text-charcoal'
                  }`}
              >
                All ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setFeaturedFilter('featured')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${featuredFilter === 'featured'
                  ? 'bg-[#C9A45C] text-white shadow-sm'
                  : 'text-soft-gray hover:text-charcoal'
                  }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                Featured ({products.filter((p) => p.featured).length})
              </button>
              <button
                type="button"
                onClick={() => setFeaturedFilter('unfeatured')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${featuredFilter === 'unfeatured'
                  ? 'bg-surface text-charcoal shadow-sm'
                  : 'text-soft-gray hover:text-charcoal'
                  }`}
              >
                Not Featured ({products.filter((p) => !p.featured).length})
              </button>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 text-sm text-soft-gray">
              No products found in catalog. Add gifts to your product catalog first to feature them here.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products
                .filter((p) => {
                  if (featuredFilter === 'featured') return p.featured;
                  if (featuredFilter === 'unfeatured') return !p.featured;
                  return true;
                })
                .map((p) => {
                  const pid = p.id || p._id;
                  return (
                    <div
                      key={pid}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${p.featured
                        ? 'border-[#C9A45C]/40 bg-[#C9A45C]/5 shadow-xs'
                        : 'border-soft-gray/20 bg-warm-ivory/20 hover:border-soft-gray/40'
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-12 h-12 rounded-xl object-cover border border-soft-gray/20 shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/products/teddy-bear.png';
                          }}
                        />
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-charcoal truncate">{p.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-soft-gray truncate">{p.category}</span>
                            {p.featured && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C9A45C]/20 text-[#8C6D2D] font-bold uppercase tracking-wider shrink-0">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleProductFeatured(pid)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs ${p.featured
                          ? 'bg-[#C9A45C] text-white border-[#B48F47] hover:bg-[#B48F47]'
                          : 'bg-surface text-charcoal border-soft-gray/25 hover:border-[#C9A45C] hover:text-[#C9A45C] hover:bg-[#C9A45C]/10'
                          }`}
                        title={p.featured ? 'Remove from Featured Products' : 'Add to Featured Products'}
                      >
                        <Star className="w-3.5 h-3.5" fill={p.featured ? 'currentColor' : 'none'} />
                        <span>{p.featured ? 'Remove' : 'Add'}</span>
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'contact' && (
        <div className="space-y-6 max-w-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Contact Us Website Content
              </h2>
              <p className="text-xs text-soft-gray mt-0.5">
                Edit the phone number, email, address, and working hours displayed across the customer website footer.
              </p>
            </div>
          </div>

          <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-soft-gray/20 shadow-card space-y-5">
            <form onSubmit={handleSaveContact} className="space-y-5">
              {/* Phone Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    Customer Support Phone
                  </label>
                  <input
                    type="text"
                    value={contactForm.phone}
                    onChange={(e) => {
                      setContactForm({ ...contactForm, phone: e.target.value });
                      if (contactErrors.phone) setContactErrors({ ...contactErrors, phone: '' });
                    }}
                    placeholder="+91 98765 43210"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-charcoal bg-surface focus:border-primary focus:outline-none transition-colors ${contactErrors.phone ? 'border-error' : 'border-soft-gray/25'
                      }`}
                  />
                  {contactErrors.phone && (
                    <p className="text-xs text-error mt-1">{contactErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    Alternate Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={contactForm.altPhone}
                    onChange={(e) => {
                      setContactForm({ ...contactForm, altPhone: e.target.value });
                    }}
                    placeholder="+91 98765 43211 (Leave empty if none)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Email Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    Support Email Address
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => {
                      setContactForm({ ...contactForm, email: e.target.value });
                      if (contactErrors.email) setContactErrors({ ...contactErrors, email: '' });
                    }}
                    placeholder="support@rsgifts.in"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-charcoal bg-surface focus:border-primary focus:outline-none transition-colors ${contactErrors.email ? 'border-error' : 'border-soft-gray/25'
                      }`}
                  />
                  {contactErrors.email && (
                    <p className="text-xs text-error mt-1">{contactErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    Alternate Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={contactForm.altEmail}
                    onChange={(e) => {
                      setContactForm({ ...contactForm, altEmail: e.target.value });
                    }}
                    placeholder="info@rsgifts.com (Leave empty if none)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Store Location */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Location / Address
                </label>
                <input
                  type="text"
                  value={contactForm.location}
                  onChange={(e) => {
                    setContactForm({ ...contactForm, location: e.target.value });
                    if (contactErrors.location) setContactErrors({ ...contactErrors, location: '' });
                  }}
                  placeholder="Guntur, Andhra Pradesh"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-charcoal bg-surface focus:border-primary focus:outline-none transition-colors ${contactErrors.location ? 'border-error' : 'border-soft-gray/25'
                    }`}
                />
                {contactErrors.location && (
                  <p className="text-xs text-error mt-1">{contactErrors.location}</p>
                )}
              </div>

              {/* Working Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    Customer Support Hours
                  </label>
                  <input
                    type="text"
                    value={contactForm.hours}
                    onChange={(e) => {
                      setContactForm({ ...contactForm, hours: e.target.value });
                      if (contactErrors.hours) setContactErrors({ ...contactErrors, hours: '' });
                    }}
                    placeholder="Mon - Sat: 9:00 AM - 8:00 PM"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-charcoal bg-surface focus:border-primary focus:outline-none transition-colors ${contactErrors.hours ? 'border-error' : 'border-soft-gray/25'
                      }`}
                  />
                  {contactErrors.hours && (
                    <p className="text-xs text-error mt-1">{contactErrors.hours}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    Alternate / Weekend Hours (Optional)
                  </label>
                  <input
                    type="text"
                    value={contactForm.altHours}
                    onChange={(e) => {
                      setContactForm({ ...contactForm, altHours: e.target.value });
                    }}
                    placeholder="Sunday: 10:00 AM - 5:00 PM (Leave empty if none)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Google Navigation / Map Embed URL */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Google Navigation / Map Embed URL (Optional)
                </label>
                <input
                  type="text"
                  value={contactForm.googleMapUrl}
                  onChange={(e) => {
                    setContactForm({ ...contactForm, googleMapUrl: e.target.value });
                  }}
                  placeholder="https://www.google.com/maps/embed?pb=... (Leave empty to keep blank)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:border-primary focus:outline-none transition-colors"
                />
                <p className="text-[11px] text-soft-gray mt-1">
                  Paste your Google Maps embed iframe link or navigation URL here. If left empty, it will display as empty on the Contact page.
                </p>
              </div>

              <div className="pt-4 border-t border-soft-gray/15 flex items-center justify-between">
                <span className="text-xs text-soft-gray">
                  Changes update the website footer in real-time.
                </span>
                <button
                  type="submit"
                  disabled={isSavingContact}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-surface font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {isSavingContact ? 'Saving...' : 'Save Contact Info'}
                </button>
              </div>
            </form>
          </div>
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
              Tagline / Top Text
            </label>
            <input
              type="text"
              value={bannerForm.tagline}
              onChange={(e) => setBannerForm({ ...bannerForm, tagline: e.target.value })}
              placeholder="e.g. EXCLUSIVE CURATED GIFTS"
              className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:border-primary"
            />
          </div>

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
                placeholder="Shop Now"
                className="w-full px-3.5 py-2 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Button Link
              </label>
              <select
                value={bannerForm.buttonLink}
                onChange={(e) => setBannerForm({ ...bannerForm, buttonLink: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:border-primary cursor-pointer"
              >
                <option value="/gifts">All Gifts (/gifts)</option>
                <option value="/birthday-gifts">Birthday Gifts (/birthday-gifts)</option>
                <option value="/personalized-gifts">Personalized Gifts (/personalized-gifts)</option>
                <option value="/category/flowers-hampers">Flowers & Hampers (/category/flowers-hampers)</option>
                <option value="/category/toys-kids">Teddy & Plush Toys (/category/toys-kids)</option>
                <option value="/anniversary-gifts">Anniversary Gifts (/anniversary-gifts)</option>
                <option value="/category/corporate-gifts">Corporate Gifts (/category/corporate-gifts)</option>
                <option value="/category/home-decor">Home Decor (/category/home-decor)</option>
                <option value="/contact">Contact Us (/contact)</option>
                <option value="https://wa.me/919876543210">WhatsApp Chat</option>
                {!['/gifts', '/birthday-gifts', '/personalized-gifts', '/category/flowers-hampers', '/category/toys-kids', '/anniversary-gifts', '/category/corporate-gifts', '/category/home-decor', '/contact', 'https://wa.me/919876543210'].includes(bannerForm.buttonLink) && bannerForm.buttonLink && (
                  <option value={bannerForm.buttonLink}>{bannerForm.buttonLink}</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Badge 1
              </label>
              <input
                type="text"
                value={bannerForm.badge1}
                onChange={(e) => setBannerForm({ ...bannerForm, badge1: e.target.value })}
                placeholder="Fast & Reliable Delivery"
                className="w-full px-3 py-2 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Badge 2
              </label>
              <input
                type="text"
                value={bannerForm.badge2}
                onChange={(e) => setBannerForm({ ...bannerForm, badge2: e.target.value })}
                placeholder="Secure Payments"
                className="w-full px-3 py-2 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Badge 3
              </label>
              <input
                type="text"
                value={bannerForm.badge3}
                onChange={(e) => setBannerForm({ ...bannerForm, badge3: e.target.value })}
                placeholder="Easy Returns"
                className="w-full px-3 py-2 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:border-primary"
              />
            </div>
          </div>

          <CloudinaryUpload
            value={bannerForm.imageUrl}
            onChange={(url) => setBannerForm({ ...bannerForm, imageUrl: url })}
            label="Banner Hero Image *"
            preferredSize="1920 × 600 px"
            aspectRatio="21:9 (Ultra-Wide)"
            dimensionNote="Recommended: 1920 px Width × 600 px Height (Ultra-Wide ~21:9). More width, less height."
            hint="Recommended resolution: 1920 × 600 px (Supports JPG, PNG, WebP)."
            onDimensionsDetected={(dims) =>
              setBannerForm((prev) => ({
                ...prev,
                width: dims.width,
                height: dims.height,
                aspectRatio: dims.aspectRatio,
              }))
            }
          />
          {bannerErrors.imageUrl && <p className="text-xs text-error -mt-3">{bannerErrors.imageUrl}</p>}

          <div className="flex items-center justify-end gap-3 pt-3 pb-2 mt-4">
            <button
              type="button"
              onClick={() => setIsBannerModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-soft-gray/25 text-sm font-medium text-charcoal hover:border-primary hover:text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary text-surface text-sm font-semibold hover:bg-primary/90 shadow-sm cursor-pointer"
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

export const WebsiteContentModule = WebsiteContent;
export const ContentModule = WebsiteContent;
export default WebsiteContent;
