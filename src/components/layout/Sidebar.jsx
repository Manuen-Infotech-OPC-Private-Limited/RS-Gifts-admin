import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Gift,
  Tag,
  ShoppingBag,
  Boxes,
  Users,
  Percent,
  LayoutTemplate,
  Star,
  MessageSquare,
  Settings,
  X
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

const resolveLogoUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();
  if (clean.startsWith('data:') || clean.startsWith('blob:') || clean.startsWith('https://')) return clean;
  if (clean.startsWith('http://res.cloudinary.com')) return clean.replace(/^http:\/\//i, 'https://');
  if (clean.startsWith('/uploads/') || clean.startsWith('uploads/')) {
    const p = clean.startsWith('/') ? clean : `/${clean}`;
    return `https://rs-gifts-backend.onrender.com${p}`;
  }
  if (clean.includes('localhost:5000') || clean.includes('127.0.0.1:5000')) {
    return clean.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000/, 'https://rs-gifts-backend.onrender.com');
  }
  if (clean.startsWith('http://')) return clean.replace(/^http:\/\//i, 'https://');
  return clean;
};

export const Sidebar = ({ isOpen, onClose }) => {
  const { products, orders, unreadInquiriesCount, settings } = useAdmin();

  // Prevent background scroll and eliminate edge scrollbar when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const pendingOrdersCount = orders.filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'Processing').length;
  const lowStockCount = products.filter(p => p.stock <= (p.lowStockThreshold || 5)).length;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/products', label: 'Products', icon: Gift, badge: products.length > 0 ? products.length : null },
    { path: '/categories', label: 'Categories', icon: Tag },
    { 
      path: '/orders', 
      label: 'Orders', 
      icon: ShoppingBag, 
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
      badgeVariant: 'accent' 
    },
    { 
      path: '/inventory', 
      label: 'Inventory', 
      icon: Boxes, 
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : null,
      badgeVariant: 'error' 
    },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/coupons', label: 'Coupons & Offers', icon: Percent },
    { path: '/content', label: 'Website Content', icon: LayoutTemplate },
    { path: '/reviews', label: 'Reviews', icon: Star },
    { 
      path: '/inquiries', 
      label: 'Enquiries', 
      icon: MessageSquare, 
      badge: unreadInquiriesCount > 0 ? `${unreadInquiriesCount} New` : null,
      badgeVariant: 'primary' 
    },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-charcoal/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-surface border-r border-soft-gray/20 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-soft-gray/15 bg-white">
          <div className="flex items-center gap-3.5 select-none">
            <div className="w-14 h-14 rounded-2xl bg-white border border-soft-gray/15 flex items-center justify-center text-primary flex-shrink-0 overflow-hidden shadow-xs">
              {settings.storeLogo ? (
                <img
                  src={resolveLogoUrl(settings.storeLogo)}
                  alt={settings.storeName || 'RS GIFTS'}
                  className="w-full h-full object-contain p-0.5 bg-white mix-blend-multiply [filter:contrast(1.15)_brightness(1.03)]"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    if (e.target.nextElementSibling) {
                      e.target.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full items-center justify-center text-primary bg-white ${
                  settings.storeLogo ? 'hidden' : 'flex'
                }`}
              >
                <Gift className="w-6 h-6 text-primary" />
              </div>
            </div>
            <span className="font-bold text-lg tracking-tight text-charcoal">
              {settings.storeName || 'RS GIFTS'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-soft-gray hover:bg-surface hover:text-charcoal lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-primary text-surface shadow-sm font-semibold'
                      : 'text-charcoal hover:bg-secondary/15 hover:text-primary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-5 h-5 transition-colors ${
                          isActive
                            ? 'text-surface'
                            : 'text-soft-gray group-hover:text-primary'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge !== null && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isActive
                            ? 'bg-surface/20 text-surface'
                            : item.badgeVariant === 'error'
                            ? 'bg-error/15 text-error'
                            : item.badgeVariant === 'accent'
                            ? 'bg-accent/20 text-charcoal'
                            : 'bg-warm-ivory text-soft-gray'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

      </aside>
    </>
  );
};
