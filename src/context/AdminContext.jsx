import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api';
import {
  initialCategories,
  initialOccasions,
  initialProducts,
  initialOrders,
  initialCustomers,
  initialCoupons,
  initialContentBanners,
  initialTestimonials,
  initialReviews,
  initialSettings
} from '../data/initialData';

const AdminContext = createContext();
const STORAGE_KEY = 'rs_gifts_admin_clean_frame_v3';

export const AdminProvider = ({ children }) => {
  // Purge any older cached mock/demo data
  try {
    localStorage.removeItem('rs_gifts_admin_state_v1');
    localStorage.removeItem('rs_gifts_admin_empty_v2');
  } catch (e) { }

  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const filteredCoupons = (parsed.coupons || []).filter(
          c => c.code !== 'WELCOME10' && c.code !== 'FESTIVE25' && c.code !== 'FLAT200' && c.id !== 'coup-1' && c.id !== 'coup-2' && c.id !== 'coup-3'
        );
        return {
          ...parsed,
          categories: (parsed.categories && parsed.categories.length > 0) ? parsed.categories : initialCategories,
          coupons: filteredCoupons,
          settings: {
            ...initialSettings,
            ...(parsed.settings || {}),
            contactPhone: parsed.settings?.contactPhone ?? '',
            contactEmail: parsed.settings?.contactEmail ?? parsed.settings?.supportEmail ?? '',
            storeAddress: parsed.settings?.storeAddress ?? '',
            supportHours: parsed.settings?.supportHours ?? '',
          }
        };
      }
    } catch (e) {
      console.warn('Failed to load local storage state:', e);
    }
    return {
      products: initialProducts,
      categories: initialCategories,
      occasions: initialOccasions,
      orders: initialOrders,
      customers: initialCustomers,
      coupons: initialCoupons,
      banners: initialContentBanners,
      testimonials: initialTestimonials,
      reviews: initialReviews,
      settings: initialSettings
    };
  });

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save admin state:', e);
    }
  }, [state]);

  // Load live products & banners from MongoDB Atlas Backend on Mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await apiClient.get('/admin/products');
        const live = res.data?.products || [];
        if (live.length > 0) {
          setState(prev => ({
            ...prev,
            products: live.map(p => ({
              ...p,
              id: p._id || p.id,
              _id: p._id || p.id,
            }))
          }));
          return;
        }
      } catch {
        // Fallback to customer products if admin endpoint is not authorized yet
      }

      try {
        const res = await apiClient.get('/customer/products');
        const live = res.data?.products || (Array.isArray(res.data) ? res.data : []);
        if (live.length > 0) {
          setState(prev => ({
            ...prev,
            products: live.map(p => ({
              ...p,
              id: p._id || p.id,
              _id: p._id || p.id,
            }))
          }));
        }
      } catch (err) {
        console.warn('Could not load live backend products:', err.message);
      }
    };

    loadProducts();

    apiClient.get('/admin/content/banners')
      .then(res => {
        const liveBanners = res.data?.banners || [];
        if (liveBanners.length > 0) {
          setState(prev => ({
            ...prev,
            banners: liveBanners.map(b => ({
              ...b,
              id: b._id || b.id,
              _id: b._id || b.id,
              imageUrl: b.image || b.imageUrl,
              buttonText: b.buttonText || 'Shop Gifts',
              buttonLink: b.link || b.buttonLink || '/products',
            }))
          }));
        }
      })
      .catch(() => {
        apiClient.get('/customer/content/banners')
          .then(res => {
            const liveBanners = res.data?.banners || [];
            if (liveBanners.length > 0) {
              setState(prev => ({
                ...prev,
                banners: liveBanners.map(b => ({
                  ...b,
                  id: b._id || b.id,
                  _id: b._id || b.id,
                  imageUrl: b.image || b.imageUrl,
                  buttonText: b.buttonText || 'Shop Gifts',
                  buttonLink: b.link || b.buttonLink || '/products',
                }))
              }));
            }
          })
          .catch(e => console.warn('Could not load live banners:', e.message));
      });

    // Load live coupons from MongoDB Atlas Backend
    apiClient.get('/admin/coupons')
      .then(res => {
        const liveCoupons = res.data?.coupons || [];
        if (liveCoupons.length > 0) {
          setState(prev => ({
            ...prev,
            coupons: liveCoupons.map(c => ({
              ...c,
              id: c._id || c.id,
              _id: c._id || c.id,
              minSpend: c.minOrderValue ?? c.minSpend ?? 0,
            }))
          }));
        }
      })
      .catch(() => {
        apiClient.get('/customer/coupons')
          .then(res => {
            const liveCoupons = res.data?.coupons || [];
            if (liveCoupons.length > 0) {
              setState(prev => ({
                ...prev,
                coupons: liveCoupons.map(c => ({
                  ...c,
                  id: c._id || c.id,
                  _id: c._id || c.id,
                  minSpend: c.minOrderValue ?? c.minSpend ?? 0,
                }))
              }));
            }
          })
          .catch(e => console.warn('Could not load live coupons:', e.message));
      });

    // Load live settings from backend API
    apiClient.get('/admin/settings')
      .then(res => {
        if (res.data?.settings) {
          setState(prev => ({
            ...prev,
            settings: { ...prev.settings, ...res.data.settings }
          }));
        }
      })
      .catch(() => {
        apiClient.get('/customer/content/settings')
          .then(res => {
            if (res.data?.settings) {
              setState(prev => ({
                ...prev,
                settings: { ...prev.settings, ...res.data.settings }
              }));
            }
          })
          .catch(() => {});
      });
  }, []);

  // Products (Live Sync with MongoDB Backend)
  const addProduct = async (productData) => {
    const tempId = 'prod-' + Date.now();
    const payload = {
      ...productData,
      price: Number(productData.price) || 0,
      salePrice: Number(productData.salePrice) || Number(productData.price) || 0,
      stock: Number(productData.stock) || 0,
      lowStockThreshold: Number(productData.lowStockThreshold) || 5,
    };

    const tempProduct = { ...payload, id: tempId, _id: tempId };
    setState(prev => ({
      ...prev,
      products: [tempProduct, ...prev.products]
    }));

    try {
      const res = await apiClient.post('/admin/products', payload);
      const created = res.data?.product;
      if (created) {
        const finalProduct = {
          ...created,
          id: created._id || created.id,
          _id: created._id || created.id,
        };
        setState(prev => ({
          ...prev,
          products: prev.products.map(p => (p.id === tempId ? finalProduct : p))
        }));
        showToast(res.data.message || `Gift "${finalProduct.title}" created successfully!`);
        return finalProduct;
      }
    } catch (err) {
      console.warn('Backend addProduct error:', err);
      showToast(err.response?.data?.message || 'Product created locally (server sync pending)', 'warning');
      return tempProduct;
    }
  };

  const updateProduct = async (id, updatedFields) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p =>
        (p.id === id || p._id === id) ? {
          ...p,
          ...updatedFields,
          price: Number(updatedFields.price !== undefined ? updatedFields.price : p.price),
          salePrice: Number(updatedFields.salePrice !== undefined ? updatedFields.salePrice : p.salePrice),
          stock: Number(updatedFields.stock !== undefined ? updatedFields.stock : p.stock),
        } : p
      )
    }));

    try {
      const targetId = id && !id.startsWith('prod-') ? id : null;
      if (targetId) {
        const res = await apiClient.put(`/admin/products/${targetId}`, updatedFields);
        const updated = res.data?.product;
        if (updated) {
          const finalProduct = { ...updated, id: updated._id || updated.id, _id: updated._id || updated.id };
          setState(prev => ({
            ...prev,
            products: prev.products.map(p => (p.id === id || p._id === id) ? finalProduct : p)
          }));
        }
      }
      showToast('Product updated successfully on live store!');
    } catch (err) {
      console.warn('Backend updateProduct error:', err);
      showToast(err.response?.data?.message || 'Product updated locally', 'warning');
    }
  };

  const deleteProduct = async (id) => {
    setState(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id && p._id !== id)
    }));

    try {
      if (id && !id.startsWith('prod-')) {
        await apiClient.delete(`/admin/products/${id}`);
      }
      showToast('Product removed from catalog and store.', 'error');
    } catch (err) {
      console.warn('Backend deleteProduct error:', err);
      showToast(err.response?.data?.message || 'Product removed locally', 'warning');
    }
  };

  const toggleProductActive = async (id) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p =>
        (p.id === id || p._id === id) ? { ...p, active: !p.active } : p
      )
    }));

    try {
      if (id && !id.startsWith('prod-')) {
        await apiClient.patch(`/admin/products/${id}/toggle-active`);
      }
      showToast('Product visibility status updated.');
    } catch (err) {
      console.warn('toggleProductActive error:', err);
    }
  };

  const toggleProductFeatured = async (id) => {
    const target = state.products.find(p => p.id === id || p._id === id);
    const newFeatured = target ? !target.featured : true;

    setState(prev => ({
      ...prev,
      products: prev.products.map(p =>
        (p.id === id || p._id === id) ? { ...p, featured: newFeatured } : p
      )
    }));

    try {
      const targetId = target?._id || target?.id || id;
      if (targetId && !String(targetId).startsWith('prod-')) {
        const res = await apiClient.patch(`/admin/products/${targetId}/toggle-featured`);
        const updated = res.data?.product;
        if (updated) {
          setState(prev => ({
            ...prev,
            products: prev.products.map(p =>
              (p.id === id || p._id === id) ? { ...p, featured: updated.featured } : p
            )
          }));
        }
      }
      showToast(newFeatured ? 'Item added to featured products!' : 'Item removed from featured products.');
    } catch (err) {
      console.warn('toggleProductFeatured error:', err);
      showToast(err.response?.data?.message || 'Featured status updated locally', 'warning');
    }
  };

  // Categories & Occasions
  const addCategory = (categoryData) => {
    const newCategory = {
      ...categoryData,
      id: 'cat-' + Date.now(),
      slug: categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-'),
      active: true,
      itemCount: 0
    };
    setState(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
    showToast(`Category "${newCategory.name}" added!`);
  };

  const updateCategory = (id, updatedFields) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, ...updatedFields } : c)
    }));
    showToast('Category updated.');
  };

  const deleteCategory = (id) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id)
    }));
    showToast('Category deleted.', 'error');
  };

  const toggleCategoryActive = (id) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, active: !c.active } : c)
    }));
  };

  const addOccasion = (occasionData) => {
    const newOccasion = {
      ...occasionData,
      id: 'occ-' + Date.now(),
      slug: occasionData.slug || occasionData.name.toLowerCase().replace(/\s+/g, '-'),
      active: true,
      tagColor: 'primary'
    };
    setState(prev => ({
      ...prev,
      occasions: [...prev.occasions, newOccasion]
    }));
    showToast(`Occasion "${newOccasion.name}" added!`);
  };

  const updateOccasion = (id, updatedFields) => {
    setState(prev => ({
      ...prev,
      occasions: prev.occasions.map(o => o.id === id ? { ...o, ...updatedFields } : o)
    }));
    showToast('Occasion updated.');
  };

  const deleteOccasion = (id) => {
    setState(prev => ({
      ...prev,
      occasions: prev.occasions.filter(o => o.id !== id)
    }));
    showToast('Occasion removed.', 'error');
  };

  const toggleOccasionActive = (id) => {
    setState(prev => ({
      ...prev,
      occasions: prev.occasions.map(o => o.id === id ? { ...o, active: !o.active } : o)
    }));
  };

  // Orders
  const updateOrderStatus = (orderId, newStatus) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(order =>
        order.id === orderId ? { ...order, orderStatus: newStatus } : order
      )
    }));
    showToast(`Order ${orderId} marked as ${newStatus}.`);
  };

  const updateOrderTracking = (orderId, trackingData) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(order =>
        order.id === orderId ? {
          ...order,
          tracking: { ...order.tracking, ...trackingData }
        } : order
      )
    }));
    showToast(`Tracking updated for Order ${orderId}.`);
  };

  // Inventory
  const updateProductStock = async (productId, newQuantity) => {
    const qty = Math.max(0, parseInt(newQuantity, 10) || 0);
    setState(prev => ({
      ...prev,
      products: prev.products.map(p =>
        (p.id === productId || p._id === productId) ? { ...p, stock: qty } : p
      )
    }));

    try {
      if (productId && !productId.startsWith('prod-')) {
        await apiClient.patch(`/admin/products/${productId}/stock`, { stock: qty });
      }
      showToast('Inventory quantity updated on live store.');
    } catch (err) {
      console.warn('updateProductStock error:', err);
      showToast('Inventory updated locally', 'warning');
    }
  };

  const adjustStock = (productId, delta) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => {
        if (p.id === productId) {
          const updated = Math.max(0, p.stock + delta);
          return { ...p, stock: updated };
        }
        return p;
      })
    }));
  };

  // Coupons (Live Sync with MongoDB Backend)
  const addCoupon = async (couponData) => {
    const tempId = 'COUP-' + Date.now().toString().slice(-4);
    const newCoupon = {
      ...couponData,
      id: tempId,
      code: couponData.code.trim().toUpperCase(),
      discountType: couponData.discountType || 'percentage',
      discountValue: Number(couponData.discountValue) || 0,
      maxDiscount: Number(couponData.maxDiscount) || 0,
      minSpend: Number(couponData.minSpend) || 0,
      usageCount: 0,
      usageLimit: Number(couponData.usageLimit) || 100,
      perUserLimit: 1, // Enforced 1 redemption per customer only
      oneTimePerUser: true,
      categoryRestriction: couponData.categoryRestriction || 'All',
      expiryDate: couponData.expiryDate || '',
      active: couponData.active !== undefined ? couponData.active : true
    };
    setState(prev => ({
      ...prev,
      coupons: [newCoupon, ...prev.coupons]
    }));
    showToast(`Coupon ${newCoupon.code} generated!`);

    try {
      const res = await apiClient.post('/admin/coupons', {
        code: newCoupon.code,
        discountType: newCoupon.discountType === 'fixed' ? 'flat' : newCoupon.discountType,
        discountValue: newCoupon.discountValue,
        minOrderValue: newCoupon.minSpend,
        minSpend: newCoupon.minSpend,
        maxDiscount: newCoupon.maxDiscount,
        expiryDate: newCoupon.expiryDate || null,
        usageLimit: newCoupon.usageLimit,
        active: newCoupon.active,
        description: newCoupon.description || `${newCoupon.code} special offer`,
      });
      const saved = res.data?.coupon;
      if (saved) {
        setState(prev => ({
          ...prev,
          coupons: prev.coupons.map(c => c.id === tempId ? { ...saved, id: saved._id || saved.id, minSpend: saved.minOrderValue } : c)
        }));
      }
    } catch (err) {
      console.warn('Sync addCoupon to backend error:', err);
    }
  };

  const updateCoupon = async (id, updatedFields) => {
    setState(prev => ({
      ...prev,
      coupons: prev.coupons.map(c =>
        c.id === id ? {
          ...c,
          ...updatedFields,
          code: updatedFields.code ? updatedFields.code.trim().toUpperCase() : c.code,
          discountType: updatedFields.discountType || c.discountType || 'percentage',
          discountValue: Number(updatedFields.discountValue !== undefined ? updatedFields.discountValue : c.discountValue),
          maxDiscount: Number(updatedFields.maxDiscount !== undefined ? updatedFields.maxDiscount : (c.maxDiscount || 0)),
          minSpend: Number(updatedFields.minSpend !== undefined ? updatedFields.minSpend : c.minSpend),
          usageLimit: Number(updatedFields.usageLimit !== undefined ? updatedFields.usageLimit : (c.usageLimit || 100)),
          perUserLimit: 1, // Enforced 1 redemption per customer only
          oneTimePerUser: true,
          categoryRestriction: updatedFields.categoryRestriction !== undefined ? updatedFields.categoryRestriction : (c.categoryRestriction || 'All'),
          expiryDate: updatedFields.expiryDate !== undefined ? updatedFields.expiryDate : c.expiryDate
        } : c
      )
    }));
    showToast('Coupon details updated.');

    try {
      const couponObj = state.coupons.find(c => c.id === id) || {};
      const payload = {
        code: (updatedFields.code || couponObj.code || '').trim().toUpperCase(),
        discountType: (updatedFields.discountType || couponObj.discountType) === 'fixed' ? 'flat' : (updatedFields.discountType || couponObj.discountType),
        discountValue: Number(updatedFields.discountValue !== undefined ? updatedFields.discountValue : couponObj.discountValue),
        minOrderValue: Number(updatedFields.minSpend !== undefined ? updatedFields.minSpend : couponObj.minSpend),
        minSpend: Number(updatedFields.minSpend !== undefined ? updatedFields.minSpend : couponObj.minSpend),
        maxDiscount: Number(updatedFields.maxDiscount !== undefined ? updatedFields.maxDiscount : couponObj.maxDiscount),
        expiryDate: updatedFields.expiryDate || couponObj.expiryDate || null,
        usageLimit: Number(updatedFields.usageLimit !== undefined ? updatedFields.usageLimit : couponObj.usageLimit),
        active: updatedFields.active !== undefined ? updatedFields.active : (couponObj.active !== undefined ? couponObj.active : true),
      };

      const res = await apiClient.put(`/admin/coupons/${id}`, payload);
      const saved = res.data?.coupon;
      if (saved) {
        setState(prev => ({
          ...prev,
          coupons: prev.coupons.map(c => c.id === id ? { ...saved, id: saved._id || saved.id, minSpend: saved.minOrderValue } : c)
        }));
      }
    } catch (err) {
      console.warn('Sync updateCoupon to backend error:', err);
    }
  };

  const deleteCoupon = async (id) => {
    setState(prev => ({
      ...prev,
      coupons: prev.coupons.filter(c => c.id !== id)
    }));
    showToast('Coupon removed.', 'error');

    try {
      await apiClient.delete(`/admin/coupons/${id}`);
    } catch (err) {
      console.warn('Sync deleteCoupon error:', err);
    }
  };

  const toggleCouponActive = async (id) => {
    const current = state.coupons.find(c => c.id === id);
    const newActive = current ? !current.active : true;
    setState(prev => ({
      ...prev,
      coupons: prev.coupons.map(c => c.id === id ? { ...c, active: newActive } : c)
    }));

    try {
      await apiClient.patch(`/admin/coupons/${id}/toggle-active`).catch(() => {
        return apiClient.put(`/admin/coupons/${id}`, { active: newActive });
      });
    } catch (err) {
      console.warn('Sync toggleCouponActive error:', err);
    }
  };

  // Website Content (Live Sync with MongoDB Backend)
  const addBanner = async (bannerData) => {
    const tempId = 'BAN-' + Date.now().toString().slice(-4);
    const newBanner = {
      ...bannerData,
      id: tempId,
      _id: tempId,
      image: bannerData.imageUrl || bannerData.image,
      imageUrl: bannerData.imageUrl || bannerData.image,
      buttonText: bannerData.buttonText || 'Shop Gifts',
      buttonLink: bannerData.buttonLink || '/products',
      link: bannerData.buttonLink || '/products',
      active: true,
      position: 'hero',
    };
    setState(prev => ({
      ...prev,
      banners: [newBanner, ...prev.banners]
    }));
    showToast('New homepage hero banner added!');

    try {
      const res = await apiClient.post('/admin/content/banners', {
        title: bannerData.title,
        subtitle: bannerData.subtitle,
        image: bannerData.imageUrl || bannerData.image,
        link: bannerData.buttonLink || bannerData.link || '/products',
        buttonText: bannerData.buttonText || 'Shop Gifts',
        position: 'hero',
        active: true,
      });
      if (res.data?.banner) {
        const saved = res.data.banner;
        setState(prev => ({
          ...prev,
          banners: prev.banners.map(b => b.id === tempId ? {
            ...saved,
            id: saved._id || saved.id,
            _id: saved._id || saved.id,
            imageUrl: saved.image,
            buttonText: saved.buttonText || bannerData.buttonText || 'Shop Gifts',
            buttonLink: saved.link,
          } : b)
        }));
      }
    } catch (err) {
      console.warn('Failed to save banner to backend API:', err);
    }
  };

  const updateBanner = async (id, updatedFields) => {
    setState(prev => ({
      ...prev,
      banners: prev.banners.map(b => (b.id === id || b._id === id) ? {
        ...b,
        ...updatedFields,
        imageUrl: updatedFields.imageUrl || updatedFields.image || b.imageUrl,
        image: updatedFields.imageUrl || updatedFields.image || b.image,
      } : b)
    }));
    showToast('Banner updated.');

    try {
      if (id && !id.startsWith('BAN-')) {
        await apiClient.put(`/admin/content/banners/${id}`, {
          title: updatedFields.title,
          subtitle: updatedFields.subtitle,
          image: updatedFields.imageUrl || updatedFields.image,
          link: updatedFields.buttonLink || updatedFields.link,
          buttonText: updatedFields.buttonText,
        });
      }
    } catch (err) {
      console.warn('Failed to update banner in backend API:', err);
    }
  };

  const deleteBanner = async (id) => {
    setState(prev => ({
      ...prev,
      banners: prev.banners.filter(b => b.id !== id && b._id !== id)
    }));
    showToast('Banner deleted.', 'error');

    try {
      if (id && !id.startsWith('BAN-')) {
        await apiClient.delete(`/admin/content/banners/${id}`);
      }
    } catch (err) {
      console.warn('Failed to delete banner from backend API:', err);
    }
  };

  const toggleBannerActive = async (id) => {
    setState(prev => ({
      ...prev,
      banners: prev.banners.map(b => (b.id === id || b._id === id) ? { ...b, active: !b.active } : b)
    }));

    try {
      if (id && !id.startsWith('BAN-')) {
        await apiClient.patch(`/admin/content/banners/${id}/toggle-active`);
      }
    } catch (err) {
      console.warn('Failed to toggle banner in backend API:', err);
    }
  };

  const addTestimonial = (testimonialData) => {
    const newTestimonial = {
      ...testimonialData,
      id: 'TEST-' + Date.now().toString().slice(-4),
      rating: Number(testimonialData.rating) || 5,
      active: true
    };
    setState(prev => ({
      ...prev,
      testimonials: [...prev.testimonials, newTestimonial]
    }));
    showToast('Customer testimonial added!');
  };

  const deleteTestimonial = (id) => {
    setState(prev => ({
      ...prev,
      testimonials: prev.testimonials.filter(t => t.id !== id)
    }));
    showToast('Testimonial removed.', 'error');
  };

  const toggleTestimonialActive = (id) => {
    setState(prev => ({
      ...prev,
      testimonials: prev.testimonials.map(t => t.id === id ? { ...t, active: !t.active } : t)
    }));
  };

  // Reviews
  const approveReview = (id) => {
    setState(prev => ({
      ...prev,
      reviews: prev.reviews.map(r => r.id === id ? { ...r, status: 'approved' } : r)
    }));
    showToast('Review approved for public display.');
  };

  const hideReview = (id) => {
    setState(prev => ({
      ...prev,
      reviews: prev.reviews.map(r => r.id === id ? { ...r, status: 'hidden' } : r)
    }));
    showToast('Review hidden from customers.');
  };

  const deleteReview = (id) => {
    setState(prev => ({
      ...prev,
      reviews: prev.reviews.filter(r => r.id !== id)
    }));
    showToast('Review deleted.', 'error');
  };

  // Settings
  const updateSettings = async (updatedSettings) => {
    setState(prev => {
      const merged = { ...prev.settings, ...updatedSettings };
      try {
        localStorage.setItem('rs_gifts_contact_info', JSON.stringify({
          phone: merged.contactPhone,
          email: merged.contactEmail || merged.supportEmail,
          location: merged.storeAddress,
          hours: merged.supportHours,
        }));
      } catch (e) {}
      return {
        ...prev,
        settings: merged
      };
    });

    try {
      await apiClient.put('/admin/settings', updatedSettings);
    } catch (err) {
      console.warn('Backend updateSettings error:', err.message);
    }

    showToast('Store settings saved successfully!');
  };

  const resetToDefaultData = () => {
    const defaultData = {
      products: initialProducts,
      categories: initialCategories,
      occasions: initialOccasions,
      orders: initialOrders,
      customers: initialCustomers,
      coupons: initialCoupons,
      banners: initialContentBanners,
      testimonials: initialTestimonials,
      reviews: initialReviews,
      settings: initialSettings
    };
    setState(defaultData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    showToast('Catalog and records reset to clean empty frame.');
  };

  return (
    <AdminContext.Provider
      value={{
        ...state,
        toast,
        showToast,
        closeToast,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductActive,
        toggleProductFeatured,
        addCategory,
        updateCategory,
        deleteCategory,
        toggleCategoryActive,
        addOccasion,
        updateOccasion,
        deleteOccasion,
        toggleOccasionActive,
        updateOrderStatus,
        updateOrderTracking,
        updateProductStock,
        adjustStock,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        toggleCouponActive,
        addBanner,
        updateBanner,
        deleteBanner,
        toggleBannerActive,
        addTestimonial,
        deleteTestimonial,
        toggleTestimonialActive,
        approveReview,
        hideReview,
        deleteReview,
        updateSettings,
        resetToDefaultData
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

