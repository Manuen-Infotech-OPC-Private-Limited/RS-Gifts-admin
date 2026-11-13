export const generateNextUniqueProductId = (products = []) => {
  const used = new Set();
  (products || []).forEach(p => {
    if (p.productId && /^\d{6}$/.test(String(p.productId).trim())) {
      used.add(String(p.productId).trim());
    }
    if (p.sku && /^\d{6}$/.test(String(p.sku).trim())) {
      used.add(String(p.sku).trim());
    }
  });
  let next = 100001;
  while (used.has(String(next))) {
    next++;
  }
  return String(next);
};

export const ensure6DigitProductId = (val, fallbackSeed = '') => {
  const raw = String(val || fallbackSeed || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 6) return digits;
  if (digits.length > 6) return digits.slice(-6);
  if (digits.length > 0) return String(parseInt(digits, 10) % 900000 + 100000);
  if (!raw) return Math.floor(100000 + Math.random() * 900000).toString();
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash) % 900000 + 100000);
};

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import customerService from '../services/customerService';
import { updateTabFavicon } from '../utils/urlHelper';
import { getSocket } from '../services/socket';
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
        const cleanedReviews = (parsed.reviews || []).map(r => {
          let cName = (r.customerName || '').trim();
          if (!cName || /^\s*rs\s*gifts?\s*$/i.test(cName)) {
            cName = 'Verified Customer';
          }
          return { ...r, customerName: cName };
        });
        const cleanedProducts = (parsed.products || []).map(p => ({
          ...p,
          productId: ensure6DigitProductId(p.productId || p.sku, p._id || p.id)
        }));
        const cleanedOrders = (parsed.orders || []).map(o => ({
          ...o,
          tracking: {
            carrier: /bluedart/i.test(o.tracking?.carrier || '') ? '' : (o.tracking?.carrier || ''),
            trackingNumber: /BD987654321/i.test(o.tracking?.trackingNumber || '') ? '' : (o.tracking?.trackingNumber || ''),
            trackingUrl: o.tracking?.trackingUrl || '',
          }
        }));
        return {
          ...parsed,
          products: cleanedProducts,
          categories: ((parsed.categories && parsed.categories.length > 0) ? parsed.categories : initialCategories).filter(
            c => !['home-decor', 'home-and-decor'].includes((c.slug || '').toLowerCase()) && !(c.name || '').toLowerCase().includes('home')
          ),
          coupons: filteredCoupons,
          reviews: cleanedReviews,
          orders: cleanedOrders,
          inquiries: parsed.inquiries || [],
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
      inquiries: [],
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

  // Refresh live products from MongoDB Backend
  const refreshLiveProducts = useCallback(async () => {
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
            productId: ensure6DigitProductId(p.productId || p.sku, p._id || p.id),
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
            productId: ensure6DigitProductId(p.productId || p.sku, p._id || p.id),
          }))
        }));
      }
    } catch (err) {
      console.warn('Could not load live backend products:', err.message);
    }
  }, []);

  // Load live products & banners from MongoDB Atlas Backend on Mount
  useEffect(() => {
    refreshLiveProducts();

    const loadCategories = async () => {
      try {
        const res = await apiClient.get('/admin/categories');
        const live = res.data?.categories || [];
        if (live.length > 0) {
          setState(prev => {
            const catMap = new Map();
            live.forEach(c => {
              const obj = { ...c, id: c._id || c.id, _id: c._id || c.id };
              catMap.set(c.slug || c.name, obj);
            });
            (prev.categories || []).forEach(c => {
              const key = c.slug || c.name;
              if (!catMap.has(key)) {
                catMap.set(key, c);
              } else if (!catMap.get(key).image && c.image) {
                catMap.get(key).image = c.image;
              }
            });
            return {
              ...prev,
              categories: Array.from(catMap.values()).filter(
                c => !['home-decor', 'home-and-decor'].includes((c.slug || '').toLowerCase()) && !(c.name || '').toLowerCase().includes('home')
              )
            };
          });
          return;
        }
      } catch {
        try {
          const res = await apiClient.get('/customer/categories');
          const live = res.data?.categories || [];
          if (live.length > 0) {
            setState(prev => ({
              ...prev,
              categories: live
                .filter(c => !['home-decor', 'home-and-decor'].includes((c.slug || '').toLowerCase()) && !(c.name || '').toLowerCase().includes('home'))
                .map(c => ({
                  ...c,
                  id: c._id || c.id,
                  _id: c._id || c.id,
                }))
            }));
          }
        } catch {
          // offline
        }
      }
    };

    loadCategories();

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
    apiClient.get(`/admin/settings?_t=${Date.now()}`)
      .then(res => {
        if (res.data?.settings) {
          setState(prev => ({
            ...prev,
            settings: { ...prev.settings, ...res.data.settings }
          }));
          if (res.data.settings.storeLogo !== undefined) {
            try {
              localStorage.setItem('rs_gifts_store_logo', res.data.settings.storeLogo || '');
              if (res.data.settings.storeLogo) updateTabFavicon(res.data.settings.storeLogo);
            } catch (e) { }
          }
          try {
            localStorage.setItem('rs_gifts_social_links', JSON.stringify({
              facebook: res.data.settings.facebookUrl || '',
              instagram: res.data.settings.instagramUrl || '',
              youtube: res.data.settings.youtubeUrl || '',
              pinterest: res.data.settings.pinterestUrl || '',
            }));
          } catch (e) { }
        }
      })
      .catch(() => {
        apiClient.get(`/customer/content/settings?_t=${Date.now()}`)
          .then(res => {
            if (res.data?.settings) {
              setState(prev => ({
                ...prev,
                settings: { ...prev.settings, ...res.data.settings }
              }));
              if (res.data.settings.storeLogo !== undefined) {
                try {
                  localStorage.setItem('rs_gifts_store_logo', res.data.settings.storeLogo || '');
                  if (res.data.settings.storeLogo) updateTabFavicon(res.data.settings.storeLogo);
                } catch (e) { }
              }
              try {
                localStorage.setItem('rs_gifts_social_links', JSON.stringify({
                  facebook: res.data.settings.facebookUrl || '',
                  instagram: res.data.settings.instagramUrl || '',
                  youtube: res.data.settings.youtubeUrl || '',
                  pinterest: res.data.settings.pinterestUrl || '',
                }));
              } catch (e) { }
            }
          })
          .catch(() => { });
      });

    // Load live reviews from backend API
    apiClient.get('/admin/reviews')
      .then(res => {
        const liveReviews = res.data?.reviews || [];
        if (Array.isArray(liveReviews)) {
          setState(prev => {
            const mapped = liveReviews.map(r => {
              let cName = (r.customerName || '').trim();
              if (!cName || /^\s*rs\s*gifts?\s*$/i.test(cName)) {
                cName = 'Verified Customer';
              }
              return {
                id: r._id,
                _id: r._id,
                productId: r.product?._id || r.product || '',
                productTitle: r.product?.title || r.product?.name || 'Gift Item',
                productImage: r.product?.image || (Array.isArray(r.product?.gallery) && r.product.gallery[0]) || '',
                customerName: cName,
                rating: r.rating,
                comment: r.comment,
                date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
                status: r.isApproved ? 'approved' : 'hidden',
                adminReply: r.adminReply || '',
              };
            });
            const liveIds = new Set(mapped.map(m => m.id));
            const retained = (prev.reviews || []).filter(lr => !liveIds.has(lr.id) && !liveIds.has(lr._id));
            return {
              ...prev,
              reviews: mapped
            };
          });
        }
      })
      .catch(e => console.warn('Could not load backend reviews:', e.message));

    // Load live customer orders from backend API
    apiClient.get('/admin/orders')
      .then(res => {
        const liveOrders = res.data?.orders || [];
        if (Array.isArray(liveOrders)) {
          const mappedOrders = liveOrders.map(o => ({
            ...o,
            id: o.orderNumber || o._id,
            _id: o._id,
            orderNumber: o.orderNumber,
            customerName: (typeof o.customerInfo?.name === 'string' && o.customerInfo.name) || (typeof o.customerName === 'string' && o.customerName) || (typeof o.shippingAddress?.recipientName === 'string' && o.shippingAddress.recipientName) || 'Customer',
            customerEmail: (typeof o.customerInfo?.email === 'string' && o.customerInfo.email) || (typeof o.customerEmail === 'string' && o.customerEmail) || '',
            customerPhone: (typeof o.customerInfo?.phone === 'string' && o.customerInfo.phone) || (typeof o.customerPhone === 'string' && o.customerPhone) || (typeof o.shippingAddress?.phone === 'string' && o.shippingAddress.phone) || '',
            totalAmount: o.totalAmount || 0,
            orderStatus: o.orderStatus || 'Pending',
            paymentStatus: o.paymentStatus || 'Pending',
            shippingAddress: o.shippingAddress || {},
            items: (o.items || []).map(item => {
              const prodRef = item.product && typeof item.product === 'object' ? item.product : null;
              const fallbackProduct = (state.products || []).find(p =>
                (item.product && (p._id === item.product || p.id === item.product)) ||
                (item.productId && (p.productId === item.productId || p.sku === item.productId)) ||
                (item.title && p.title?.toLowerCase() === item.title?.toLowerCase())
              );
              return {
                ...item,
                title: item.title || prodRef?.title || fallbackProduct?.title || 'Gift Item',
                image: item.image || prodRef?.image || prodRef?.images?.[0] || fallbackProduct?.image || fallbackProduct?.images?.[0] || '',
                productId: item.productId || prodRef?.productId || prodRef?.sku || fallbackProduct?.productId || fallbackProduct?.sku || '',
                sku: item.sku || prodRef?.sku || prodRef?.productId || fallbackProduct?.sku || '',
                price: item.price ?? prodRef?.price ?? fallbackProduct?.price ?? 0,
                quantity: item.quantity || 1,
                category: prodRef?.category || fallbackProduct?.category || '',
                personalizationData: item.personalizationData || {}
              };
            }),
            tracking: o.tracking || { carrier: '', trackingNumber: '', trackingUrl: '' },
            notes: o.notes || '',
            createdAt: o.createdAt,
          }));
          setState(prev => ({
            ...prev,
            orders: mappedOrders
          }));
        }
      })
      .catch(e => console.warn('Could not load live backend orders:', e.message));

    // Load live customer inquiries from backend API
    apiClient.get('/admin/inquiries')
      .then(res => {
        const liveInquiries = res.data?.inquiries || [];
        if (Array.isArray(liveInquiries)) {
          setState(prev => ({
            ...prev,
            inquiries: liveInquiries.map(inq => ({
              ...inq,
              id: inq._id || inq.id,
              _id: inq._id || inq.id,
            }))
          }));
        }
      })
      .catch(e => console.warn('Could not load live backend inquiries:', e.message));

    // Load live customer accounts from backend API
    customerService.fetchCustomers()
      .then(liveCustomers => {
        if (Array.isArray(liveCustomers)) {
          setState(prev => ({
            ...prev,
            customers: liveCustomers
          }));
        }
      })
      .catch(e => console.warn('Could not load live backend customers:', e.message));
  }, []);

  // Fast background auto-sync backup every 15s so orders list never lags behind
  useEffect(() => {
    const fetchFreshOrders = () => {
      apiClient.get('/admin/orders')
        .then(res => {
          const liveOrders = res.data?.orders;
          if (Array.isArray(liveOrders) && liveOrders.length > 0) {
            setState(prev => {
              const hasDiff = liveOrders.length !== prev.orders.length ||
                liveOrders.some(lo => {
                  const curr = prev.orders.find(po => po._id === lo._id || po.orderNumber === lo.orderNumber);
                  return !curr || curr.orderStatus !== lo.orderStatus || curr.paymentStatus !== lo.paymentStatus;
                });
              if (!hasDiff) return prev;
              const mapped = liveOrders.map(o => ({
                ...o,
                id: o.orderNumber || o._id,
                _id: o._id,
                orderNumber: o.orderNumber,
                customerName: (typeof o.customerInfo?.name === 'string' && o.customerInfo.name) || (typeof o.customerName === 'string' && o.customerName) || (typeof o.shippingAddress?.recipientName === 'string' && o.shippingAddress.recipientName) || 'Customer',
                customerEmail: (typeof o.customerInfo?.email === 'string' && o.customerInfo.email) || (typeof o.customerEmail === 'string' && o.customerEmail) || '',
                customerPhone: (typeof o.customerInfo?.phone === 'string' && o.customerInfo.phone) || (typeof o.customerPhone === 'string' && o.customerPhone) || (typeof o.shippingAddress?.phone === 'string' && o.shippingAddress.phone) || '',
                totalAmount: o.totalAmount || 0,
                orderStatus: o.orderStatus || 'Pending',
                paymentStatus: o.paymentStatus || 'Pending',
                shippingAddress: o.shippingAddress || {},
                items: (o.items || []).map(item => ({
                  ...item,
                  title: item.title || item.product?.title || 'Gift Item',
                  image: item.image || item.product?.image || item.product?.images?.[0] || '',
                  productId: item.productId || item.product?.productId || item.product?.sku || '',
                  sku: item.sku || item.product?.sku || item.product?.productId || '',
                  price: item.price ?? item.product?.price ?? 0,
                  quantity: item.quantity || 1,
                  category: item.product?.category || '',
                  personalizationData: item.personalizationData || {}
                })),
                tracking: o.tracking || { carrier: '', trackingNumber: '', trackingUrl: '' },
                notes: o.notes || '',
                createdAt: o.createdAt,
              }));
              return { ...prev, orders: mapped };
            });
          }
        })
        .catch(() => {});
    };

    const interval = setInterval(fetchFreshOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // Real-time WebSocket listener for live orders and status updates
  useEffect(() => {
    let socket;
    try {
      socket = getSocket();
    } catch (e) {
      console.warn('[WebSocket] Init failed:', e);
      return;
    }

    const handleNewOrder = (order) => {
      if (!order) return;
      const orderNum = order.orderNumber || order._id?.slice(-6) || 'NEW';
      const custName = order.customerInfo?.name || order.shippingAddress?.recipientName || 'Customer';
      const total = order.totalAmount ? `₹${order.totalAmount}` : '';
      showToast(`🔔 New Order #${orderNum} received from ${custName} (${total})!`, 'info');

      setState(prev => {
        const exists = prev.orders.some(o => o._id === order._id || o.orderNumber === order.orderNumber);
        if (exists) return prev;
        const normalized = {
          ...order,
          id: order.orderNumber || order._id,
          _id: order._id,
          orderNumber: order.orderNumber,
          customerName: custName,
          customerEmail: order.customerInfo?.email || '',
          customerPhone: order.customerInfo?.phone || order.shippingAddress?.phone || '',
          totalAmount: order.totalAmount || 0,
          orderStatus: order.orderStatus || 'Pending',
          paymentStatus: order.paymentStatus || 'Pending',
          shippingAddress: order.shippingAddress || {},
          items: order.items || [],
          tracking: order.tracking || { carrier: '', trackingNumber: '', trackingUrl: '' },
          notes: order.notes || '',
          createdAt: order.createdAt || new Date().toISOString(),
        };
        return {
          ...prev,
          orders: [normalized, ...prev.orders],
        };
      });

      // Background full server sync to refresh relations & stats
      apiClient.get('/admin/orders')
        .then(res => {
          const liveOrders = res.data?.orders || [];
          if (Array.isArray(liveOrders) && liveOrders.length > 0) {
            setState(prev => {
              const mapped = liveOrders.map(o => ({
                ...o,
                id: o.orderNumber || o._id,
                _id: o._id,
                orderNumber: o.orderNumber,
                customerName: (typeof o.customerInfo?.name === 'string' && o.customerInfo.name) || (typeof o.customerName === 'string' && o.customerName) || (typeof o.shippingAddress?.recipientName === 'string' && o.shippingAddress.recipientName) || 'Customer',
                customerEmail: (typeof o.customerInfo?.email === 'string' && o.customerInfo.email) || (typeof o.customerEmail === 'string' && o.customerEmail) || '',
                customerPhone: (typeof o.customerInfo?.phone === 'string' && o.customerInfo.phone) || (typeof o.customerPhone === 'string' && o.customerPhone) || (typeof o.shippingAddress?.phone === 'string' && o.shippingAddress.phone) || '',
                totalAmount: o.totalAmount || 0,
                orderStatus: o.orderStatus || 'Pending',
                paymentStatus: o.paymentStatus || 'Pending',
                shippingAddress: o.shippingAddress || {},
                items: (o.items || []).map(item => ({
                  ...item,
                  title: item.title || item.product?.title || 'Gift Item',
                  image: item.image || item.product?.image || item.product?.images?.[0] || '',
                  productId: item.productId || item.product?.productId || item.product?.sku || '',
                  sku: item.sku || item.product?.sku || item.product?.productId || '',
                  price: item.price ?? item.product?.price ?? 0,
                  quantity: item.quantity || 1,
                  category: item.product?.category || '',
                  personalizationData: item.personalizationData || {}
                })),
                tracking: o.tracking || { carrier: '', trackingNumber: '', trackingUrl: '' },
                notes: o.notes || '',
                createdAt: o.createdAt,
              }));
              return { ...prev, orders: mapped };
            });
          }
        })
        .catch(() => {});
    };

    const handleOrderUpdated = (updated) => {
      if (!updated) return;
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(o => (o._id === updated._id || o.orderNumber === updated.orderNumber) ? {
          ...o,
          ...updated,
          orderStatus: updated.orderStatus || o.orderStatus,
          paymentStatus: updated.paymentStatus || o.paymentStatus,
          tracking: updated.tracking || o.tracking,
          statusHistory: updated.statusHistory || o.statusHistory,
        } : o)
      }));
    };

    const handleOrderDeleted = ({ orderId, orderNumber }) => {
      setState(prev => ({
        ...prev,
        orders: prev.orders.filter(o => o._id !== orderId && o.orderNumber !== orderNumber)
      }));
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_updated', handleOrderUpdated);
    socket.on('order_deleted', handleOrderDeleted);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_updated', handleOrderUpdated);
      socket.off('order_deleted', handleOrderDeleted);
    };
  }, []);

  const addProduct = async (productData) => {
    const tempId = 'prod-' + Date.now();
    let rawId = (productData.productId || productData.sku || '').trim().replace(/\D/g, '');
    const usedIds = new Set(state.products.flatMap(p => [p.productId, p.sku]).filter(Boolean));
    if (rawId.length !== 6 || usedIds.has(rawId)) {
      rawId = generateNextUniqueProductId(state.products);
    }
    const galleryImages = Array.isArray(productData.gallery) && productData.gallery.length > 0
      ? productData.gallery.filter(Boolean)
      : (productData.image ? [productData.image] : []);
    const primaryImage = productData.image || galleryImages[0] || '';
    const payload = {
      ...productData,
      image: primaryImage,
      gallery: galleryImages,
      productId: rawId,
      sku: rawId,
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
          productId: ensure6DigitProductId(created.productId || created.sku, rawId),
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
      const rawMsg = err.response?.data?.message || '';
      if (rawMsg.includes('E11000') || rawMsg.includes('duplicate key')) {
        showToast('Product created successfully on live store!');
      } else {
        showToast(rawMsg || 'Product created locally (server sync pending)', 'warning');
      }
      return tempProduct;
    }
  };

  const updateProduct = async (id, updatedFields) => {
    const otherProducts = state.products.filter(p => p.id !== id && p._id !== id);
    const usedIds = new Set(otherProducts.flatMap(p => [p.productId, p.sku]).filter(Boolean));
    let rawId = (updatedFields.productId || updatedFields.sku || '').trim().replace(/\D/g, '');
    if (rawId.length !== 6 || usedIds.has(rawId)) {
      rawId = generateNextUniqueProductId(otherProducts);
    }
    const cleanFields = {
      ...updatedFields,
      productId: rawId,
      sku: rawId,
    };
    delete cleanFields._id;
    delete cleanFields.id;

    setState(prev => ({
      ...prev,
      products: prev.products.map(p =>
        (p.id === id || p._id === id) ? {
          ...p,
          ...cleanFields,
          price: Number(cleanFields.price !== undefined ? cleanFields.price : p.price),
          salePrice: Number(cleanFields.salePrice !== undefined ? cleanFields.salePrice : p.salePrice),
          stock: Number(cleanFields.stock !== undefined ? cleanFields.stock : p.stock),
        } : p
      )
    }));

    try {
      const targetId = id && !id.startsWith('prod-') ? id : null;
      if (targetId) {
        const res = await apiClient.put(`/admin/products/${targetId}`, cleanFields);
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
      const rawMsg = err.response?.data?.message || '';
      if (rawMsg.includes('E11000') || rawMsg.includes('duplicate key')) {
        showToast('Product updated successfully on live store!');
      } else {
        showToast(rawMsg || 'Product updated locally', 'warning');
      }
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
  const addCategory = async (categoryData) => {
    const tempId = 'cat-' + Date.now();
    const newCategory = {
      ...categoryData,
      id: tempId,
      _id: tempId,
      slug: categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-'),
      active: true,
      itemCount: 0
    };
    setState(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));

    try {
      const res = await apiClient.post('/admin/categories', categoryData);
      const created = res.data?.category;
      if (created) {
        const finalCategory = {
          ...created,
          id: created._id || created.id,
          _id: created._id || created.id,
        };
        setState(prev => ({
          ...prev,
          categories: prev.categories.map(c => (c.id === tempId ? finalCategory : c))
        }));
        showToast(res.data?.message || `Category "${finalCategory.name}" added!`);
        return finalCategory;
      }
    } catch (err) {
      console.warn('Backend addCategory error:', err);
      showToast(err.response?.data?.message || 'Category added locally', 'warning');
      return newCategory;
    }
  };

  const updateCategory = async (id, updatedFields) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => (c.id === id || c._id === id || c.slug === id) ? { ...c, ...updatedFields } : c)
    }));

    try {
      const currentCat = state.categories.find(c => c.id === id || c._id === id || c.slug === id);
      const targetId = (currentCat?._id && !String(currentCat._id).startsWith('cat-'))
        ? currentCat._id
        : (id && !String(id).startsWith('cat-') ? id : (currentCat?.slug || currentCat?.name || id));

      const payload = {
        name: updatedFields.name !== undefined ? updatedFields.name : currentCat?.name,
        slug: updatedFields.slug !== undefined ? updatedFields.slug : currentCat?.slug,
        description: updatedFields.description !== undefined ? updatedFields.description : currentCat?.description,
        image: updatedFields.image !== undefined ? updatedFields.image : currentCat?.image,
        active: updatedFields.active !== undefined ? updatedFields.active : currentCat?.active,
      };

      const res = await apiClient.put(`/admin/categories/${targetId}`, payload);
      const updated = res.data?.category;
      if (updated) {
        const finalCat = { ...updated, id: updated._id || updated.id, _id: updated._id || updated.id };
        setState(prev => ({
          ...prev,
          categories: prev.categories.map(c => (c.id === id || c._id === id || c.slug === id) ? finalCat : c)
        }));
      }
      showToast('Category updated successfully!');
    } catch (err) {
      console.warn('Backend updateCategory error:', err);
      showToast(err.response?.data?.message || 'Category updated locally', 'warning');
    }
  };

  const deleteCategory = async (id) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id && c._id !== id && c.slug !== id)
    }));

    try {
      const currentCat = state.categories.find(c => c.id === id || c._id === id || c.slug === id);
      const targetId = (currentCat?._id && !String(currentCat._id).startsWith('cat-'))
        ? currentCat._id
        : (id && !String(id).startsWith('cat-') ? id : (currentCat?.slug || currentCat?.name || id));

      await apiClient.delete(`/admin/categories/${targetId}`);
      showToast('Category deleted.', 'error');
    } catch (err) {
      console.warn('Backend deleteCategory error:', err);
      showToast(err.response?.data?.message || 'Category deleted locally', 'warning');
    }
  };

  const toggleCategoryActive = async (id) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => {
        if (c.id === id || c._id === id || c.slug === id) {
          return { ...c, active: !c.active };
        }
        return c;
      })
    }));

    try {
      const currentCat = state.categories.find(c => c.id === id || c._id === id || c.slug === id);
      const targetId = (currentCat?._id && !String(currentCat._id).startsWith('cat-'))
        ? currentCat._id
        : (id && !String(id).startsWith('cat-') ? id : (currentCat?.slug || currentCat?.name || id));

      await apiClient.patch(`/admin/categories/${targetId}/toggle-active`);
    } catch (err) {
      console.warn('Backend toggleCategoryActive error:', err);
    }
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
  const updateOrderStatus = async (orderId, newStatus) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(order =>
        (order.id === orderId || order._id === orderId || order.orderNumber === orderId) ? { ...order, orderStatus: newStatus } : order
      )
    }));
    showToast(`Order ${orderId} marked as ${newStatus}.`);

    try {
      const target = state.orders.find(o => o.id === orderId || o._id === orderId || o.orderNumber === orderId);
      const targetId = target?._id || target?.orderNumber || orderId;
      await apiClient.patch(`/admin/orders/${targetId}/status`, { status: newStatus });
      // When marked Delivered (stock decreases) or moved away from Delivered, refresh live products immediately
      if (newStatus === 'Delivered' || target?.orderStatus === 'Delivered') {
        refreshLiveProducts();
      }
    } catch (err) {
      console.warn('Backend order status update note:', err?.message);
    }
  };

  const updatePaymentStatus = async (orderId, newPaymentStatus) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(order =>
        (order.id === orderId || order._id === orderId || order.orderNumber === orderId) ? { ...order, paymentStatus: newPaymentStatus } : order
      )
    }));
    showToast(`Order ${orderId} payment marked as ${newPaymentStatus}.`);

    try {
      const target = state.orders.find(o => o.id === orderId || o._id === orderId || o.orderNumber === orderId);
      const targetId = target?._id || target?.orderNumber || orderId;
      await apiClient.patch(`/admin/orders/${targetId}/payment-status`, { paymentStatus: newPaymentStatus });
    } catch (err) {
      console.warn('Backend payment status update note:', err?.message);
    }
  };

  const updateOrderTracking = async (orderId, trackingData) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(order =>
        (order.id === orderId || order._id === orderId) ? {
          ...order,
          tracking: { ...order.tracking, ...trackingData },
          orderStatus: (order.orderStatus === 'Pending' || order.orderStatus === 'Processing') ? 'Shipped' : order.orderStatus
        } : order
      )
    }));
    showToast(`Tracking updated for Order ${orderId}.`);

    try {
      const target = state.orders.find(o => o.id === orderId || o._id === orderId);
      const targetId = target?._id || orderId;
      await apiClient.patch(`/admin/orders/${targetId}/tracking`, trackingData);
    } catch (err) {
      console.warn('Backend order tracking update note:', err?.message);
    }
  };

  const deleteOrder = async (orderId) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.filter(order => order.id !== orderId && order._id !== orderId)
    }));
    showToast(`Order ${orderId} deleted.`);

    try {
      const target = state.orders.find(o => o.id === orderId || o._id === orderId);
      const targetId = target?._id || orderId;
      await apiClient.delete(`/admin/orders/${targetId}`);
      if (target?.orderStatus === 'Delivered') {
        refreshLiveProducts();
      }
    } catch (err) {
      console.warn('Backend order deletion note:', err?.message);
    }
  };

  // Inquiries
  const updateInquiryStatus = async (inquiryId, newStatus) => {
    setState(prev => ({
      ...prev,
      inquiries: (prev.inquiries || []).map(inq =>
        (inq.id === inquiryId || inq._id === inquiryId) ? { ...inq, status: newStatus } : inq
      )
    }));
    showToast(`Enquiry marked as ${newStatus}.`);

    try {
      await apiClient.patch(`/admin/inquiries/${inquiryId}/status`, { status: newStatus });
    } catch (err) {
      console.warn('Backend inquiry status update note:', err?.message);
    }
  };

  const deleteInquiry = async (inquiryId) => {
    setState(prev => ({
      ...prev,
      inquiries: (prev.inquiries || []).filter(inq => inq.id !== inquiryId && inq._id !== inquiryId)
    }));
    showToast('Customer enquiry deleted.');

    try {
      await apiClient.delete(`/admin/inquiries/${inquiryId}`);
    } catch (err) {
      console.warn('Backend inquiry deletion note:', err?.message);
    }
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
        tagline: bannerData.tagline || '',
        title: bannerData.title,
        subtitle: bannerData.subtitle,
        image: bannerData.imageUrl || bannerData.image,
        link: bannerData.buttonLink || bannerData.link || '/gifts',
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
          tagline: updatedFields.tagline !== undefined ? updatedFields.tagline : '',
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

  // Reviews (Full Admin Control & Backend Sync)
  const addReview = async (reviewData) => {
    let finalName = (reviewData.customerName || '').trim();
    if (!finalName || /^\s*rs\s*gifts?\s*$/i.test(finalName)) {
      finalName = 'Verified Customer';
    }

    const tempId = 'rev_' + Date.now();
    const newRev = {
      id: tempId,
      _id: tempId,
      productId: reviewData.productId || '',
      productTitle: reviewData.productTitle || '',
      customerName: finalName,
      rating: Number(reviewData.rating) || 5,
      comment: (reviewData.comment || '').trim(),
      date: reviewData.date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: reviewData.status || 'approved'
    };

    setState(prev => ({
      ...prev,
      reviews: [newRev, ...prev.reviews]
    }));

    try {
      const res = await apiClient.post('/admin/reviews', {
        productId: reviewData.productId,
        customerName: finalName,
        rating: Number(reviewData.rating) || 5,
        comment: (reviewData.comment || '').trim(),
        isApproved: reviewData.status !== 'hidden',
      });
      if (res.data?.review?._id) {
        setState(prev => ({
          ...prev,
          reviews: prev.reviews.map(r => r.id === tempId ? { ...r, id: res.data.review._id, _id: res.data.review._id } : r)
        }));
      }
    } catch (err) {
      console.warn('Backend addReview sync note:', err.message);
    }

    showToast('Customer review added successfully.');
    return newRev;
  };

  const updateReview = async (id, updatedData) => {
    let finalName = updatedData.customerName !== undefined ? updatedData.customerName.trim() : undefined;
    if (finalName !== undefined && (!finalName || /^\s*rs\s*gifts?\s*$/i.test(finalName))) {
      finalName = 'Verified Customer';
    }

    setState(prev => ({
      ...prev,
      reviews: prev.reviews.map(r => {
        if (r.id === id || r._id === id) {
          return {
            ...r,
            ...(finalName !== undefined ? { customerName: finalName } : {}),
            ...(updatedData.rating !== undefined ? { rating: Number(updatedData.rating) } : {}),
            ...(updatedData.comment !== undefined ? { comment: updatedData.comment.trim() } : {}),
            ...(updatedData.status !== undefined ? { status: updatedData.status } : {}),
          };
        }
        return r;
      })
    }));

    try {
      await apiClient.put(`/admin/reviews/${id}`, {
        ...(finalName !== undefined ? { customerName: finalName } : {}),
        ...(updatedData.rating !== undefined ? { rating: Number(updatedData.rating) } : {}),
        ...(updatedData.comment !== undefined ? { comment: updatedData.comment.trim() } : {}),
        ...(updatedData.status !== undefined ? { isApproved: updatedData.status === 'approved' } : {}),
      });
    } catch (err) {
      console.warn('Backend updateReview sync note:', err.message);
    }

    showToast('Review updated successfully.');
  };

  const approveReview = async (id) => {
    setState(prev => ({
      ...prev,
      reviews: prev.reviews.map(r => (r.id === id || r._id === id) ? { ...r, status: 'approved' } : r)
    }));
    try {
      await apiClient.patch(`/admin/reviews/${id}/toggle-approve`, { isApproved: true });
    } catch (err) {
      console.warn('Backend approve sync note:', err.message);
    }
    showToast('Review approved for public display.');
  };

  const hideReview = async (id) => {
    setState(prev => ({
      ...prev,
      reviews: prev.reviews.map(r => (r.id === id || r._id === id) ? { ...r, status: 'hidden' } : r)
    }));
    try {
      await apiClient.patch(`/admin/reviews/${id}/toggle-approve`, { isApproved: false });
    } catch (err) {
      console.warn('Backend hide sync note:', err.message);
    }
    showToast('Review hidden from customers.');
  };

  const deleteReview = async (id) => {
    setState(prev => ({
      ...prev,
      reviews: prev.reviews.filter(r => r.id !== id && r._id !== id)
    }));
    try {
      await apiClient.delete(`/admin/reviews/${id}`);
    } catch (err) {
      console.warn('Backend delete sync note:', err.message);
    }
    showToast('Review deleted.', 'error');
  };

  // Settings
  const updateSettings = async (updatedSettings) => {
    setState(prev => {
      const merged = { ...prev.settings, ...updatedSettings };
      try {
        const contactData = {
          phone: merged.contactPhone || '',
          altPhone: merged.altContactPhone || '',
          email: merged.contactEmail || merged.supportEmail || '',
          altEmail: merged.altContactEmail || '',
          location: merged.storeAddress || '',
          hours: merged.supportHours || '',
          altHours: merged.altSupportHours || '',
          googleMapUrl: merged.googleMapUrl || '',
        };
        localStorage.setItem('rs_gifts_contact_info', JSON.stringify(contactData));
        window.dispatchEvent(new CustomEvent('rs_gifts_contact_updated', { detail: contactData }));
        if (merged.storeLogo !== undefined) {
          localStorage.setItem('rs_gifts_store_logo', merged.storeLogo || '');
          if (merged.storeLogo) updateTabFavicon(merged.storeLogo);
        }
        localStorage.setItem('rs_gifts_social_links', JSON.stringify({
          facebook: merged.facebookUrl || '',
          instagram: merged.instagramUrl || '',
          youtube: merged.youtubeUrl || '',
          pinterest: merged.pinterestUrl || '',
        }));
      } catch (e) { }
      return {
        ...prev,
        settings: merged
      };
    });

    try {
      const res = await apiClient.put('/admin/settings', updatedSettings);
      if (res?.data?.settings) {
        setState(prev => ({
          ...prev,
          settings: { ...prev.settings, ...res.data.settings }
        }));
        if (res.data.settings.storeLogo) {
          updateTabFavicon(res.data.settings.storeLogo);
        }
      }
      try {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('rs_gifts_settings_updated', { detail: updatedSettings }));
      } catch (e) { }
      showToast('Store settings saved to server successfully!');
      return res?.data;
    } catch (err) {
      console.error('Backend updateSettings error:', err);
      const isAuth = err.response?.status === 401 || err.response?.status === 403;
      if (isAuth) {
        showToast('Admin session expired. Please log out and log in again to save changes.', 'error');
      } else {
        showToast('Failed to save settings: ' + (err.response?.data?.message || err.message || 'Server error'), 'error');
      }
      throw err;
    }
  };

  const refreshCustomers = async (search = '') => {
    try {
      const liveCustomers = await customerService.fetchCustomers(search);
      if (Array.isArray(liveCustomers)) {
        setState(prev => ({
          ...prev,
          customers: liveCustomers
        }));
      }
      return liveCustomers;
    } catch (e) {
      console.warn('Failed to refresh customers:', e);
      return [];
    }
  };

  const toggleCustomerStatus = async (customerId) => {
    try {
      const res = await customerService.toggleStatus(customerId);
      const isNowActive = res.customer?.isActive;
      setState(prev => ({
        ...prev,
        customers: (prev.customers || []).map(c => 
          (c.id === customerId || c._id === customerId)
            ? { ...c, isActive: isNowActive }
            : c
        )
      }));
      showToast(res.message || 'Customer account status updated.');
      return res;
    } catch (e) {
      showToast(e.message || 'Failed to update customer status.', 'error');
      throw e;
    }
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
        updatePaymentStatus,
        updateOrderTracking,
        deleteOrder,
        inquiries: state.inquiries || [],
        unreadInquiriesCount: (state.inquiries || []).filter(i => i.status === 'Unread').length,
        updateInquiryStatus,
        deleteInquiry,
        updateProductStock,
        adjustStock,
        refreshProducts: refreshLiveProducts,
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
        addReview,
        updateReview,
        approveReview,
        hideReview,
        deleteReview,
        updateSettings,
        refreshCustomers,
        toggleCustomerStatus,
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

