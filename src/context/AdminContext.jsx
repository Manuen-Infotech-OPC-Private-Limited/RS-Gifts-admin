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

  // Load live products from MongoDB Atlas Backend on Mount
  useEffect(() => {
    apiClient.get('/customer/products')
      .then(res => {
        const live = res.data?.products || (Array.isArray(res.data) ? res.data : []);
        if (live.length > 0) {
          setState(prev => ({
            ...prev,
            products: live.map(p => ({
              ...p,
              id: p._id || p.id,
            }))
          }));
        }
      })
      .catch(err => console.warn('Could not load live backend products:', err.message));
  }, []);

  // Products
  const addProduct = (productData) => {
    const newProduct = {
      ...productData,
      id: 'prod-' + Date.now(),
      active: true,
      featured: productData.featured || false,
      price: Number(productData.price) || 0,
      salePrice: Number(productData.salePrice) || Number(productData.price) || 0,
      stock: Number(productData.stock) || 0,
      lowStockThreshold: Number(productData.lowStockThreshold) || 5,
    };
    setState(prev => ({
      ...prev,
      products: [newProduct, ...prev.products]
    }));
    showToast(`Gift "${newProduct.title}" created successfully!`);
    return newProduct;
  };

  const updateProduct = (id, updatedFields) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p =>
        p.id === id ? {
          ...p,
          ...updatedFields,
          price: Number(updatedFields.price !== undefined ? updatedFields.price : p.price),
          salePrice: Number(updatedFields.salePrice !== undefined ? updatedFields.salePrice : p.salePrice),
          stock: Number(updatedFields.stock !== undefined ? updatedFields.stock : p.stock),
        } : p
      )
    }));
    showToast('Product updated successfully!');
  };

  const deleteProduct = (id) => {
    setState(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
    showToast('Product removed from catalog.', 'error');
  };

  const toggleProductActive = (id) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p =>
        p.id === id ? { ...p, active: !p.active } : p
      )
    }));
    showToast('Product status updated.');
  };

  const toggleProductFeatured = (id) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p =>
        p.id === id ? { ...p, featured: !p.featured } : p
      )
    }));
    showToast('Featured status updated.');
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
  const updateProductStock = (productId, newQuantity) => {
    const qty = Math.max(0, parseInt(newQuantity, 10) || 0);
    setState(prev => ({
      ...prev,
      products: prev.products.map(p =>
        p.id === productId ? { ...p, stock: qty } : p
      )
    }));
    showToast('Inventory quantity updated.');
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

  // Coupons
  const addCoupon = (couponData) => {
    const newCoupon = {
      ...couponData,
      id: 'COUP-' + Date.now().toString().slice(-4),
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
      active: true
    };
    setState(prev => ({
      ...prev,
      coupons: [newCoupon, ...prev.coupons]
    }));
    showToast(`Coupon ${newCoupon.code} generated!`);
  };

  const updateCoupon = (id, updatedFields) => {
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
  };

  const deleteCoupon = (id) => {
    setState(prev => ({
      ...prev,
      coupons: prev.coupons.filter(c => c.id !== id)
    }));
    showToast('Coupon removed.', 'error');
  };

  const toggleCouponActive = (id) => {
    setState(prev => ({
      ...prev,
      coupons: prev.coupons.map(c => c.id === id ? { ...c, active: !c.active } : c)
    }));
  };

  // Website Content
  const addBanner = (bannerData) => {
    const newBanner = {
      ...bannerData,
      id: 'BAN-' + Date.now().toString().slice(-4),
      active: true
    };
    setState(prev => ({
      ...prev,
      banners: [...prev.banners, newBanner]
    }));
    showToast('New homepage banner added!');
  };

  const updateBanner = (id, updatedFields) => {
    setState(prev => ({
      ...prev,
      banners: prev.banners.map(b => b.id === id ? { ...b, ...updatedFields } : b)
    }));
    showToast('Banner updated.');
  };

  const deleteBanner = (id) => {
    setState(prev => ({
      ...prev,
      banners: prev.banners.filter(b => b.id !== id)
    }));
    showToast('Banner deleted.', 'error');
  };

  const toggleBannerActive = (id) => {
    setState(prev => ({
      ...prev,
      banners: prev.banners.map(b => b.id === id ? { ...b, active: !b.active } : b)
    }));
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
  const updateSettings = (updatedSettings) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updatedSettings }
    }));
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

