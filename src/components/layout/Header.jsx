import React, { useState } from 'react';
import { Menu, Bell, Search, User, Gift, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

export const Header = ({ onOpenSidebar }) => {
  const navigate = useNavigate();
  const { settings, orders, products } = useAdmin();
  const [showNotifications, setShowNotifications] = useState(false);

  const pendingOrders = orders.filter(o => o.orderStatus === 'Pending');
  const lowStockItems = products.filter(p => p.stock <= (p.lowStockThreshold || 5));
  const totalNotifications = pendingOrders.length + lowStockItems.length;

  const handleLogout = () => {
    // Invalidate server-side admin session in MongoDB
    apiClient.post('/admin/auth/logout').catch(() => null);
    localStorage.removeItem('rs_admin_token');
    localStorage.removeItem('rs_admin_user');
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 h-20 bg-surface border-b border-soft-gray/20 px-4 sm:px-8 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-charcoal hover:bg-warm-ivory border border-soft-gray/20 lg:hidden"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full hidden sm:block">
          <Search className="w-4 h-4 text-soft-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search orders, gifts, or customers..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-soft-gray/25 bg-warm-ivory/50 text-charcoal placeholder-soft-gray focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl text-charcoal hover:bg-warm-ivory border border-soft-gray/20 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-charcoal" />
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-surface text-[10px] font-bold flex items-center justify-center border-2 border-surface">
                {totalNotifications}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowNotifications(false)} 
              />
              <div className="fixed inset-x-3 top-20 mt-2 max-w-md mx-auto sm:inset-x-auto sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:max-w-none sm:mx-0 rounded-2xl bg-surface border border-soft-gray/20 shadow-modal z-40 p-4 animate-slide-up">
                <div className="flex items-center justify-between pb-3 border-b border-soft-gray/15">
                  <h4 className="text-sm font-bold text-charcoal">Activity & Alerts</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/30 text-charcoal font-semibold shrink-0">
                    {totalNotifications} Alerts
                  </span>
                </div>

                <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
                  {pendingOrders.map(order => (
                    <Link
                      key={order.id}
                      to="/orders"
                      onClick={() => setShowNotifications(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-warm-ivory/70 transition-colors block text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-charcoal flex-shrink-0 mt-0.5">
                        <Gift className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-charcoal">
                          New Pending Order {order.id}
                        </p>
                        <p className="text-[11px] text-soft-gray truncate">
                          {order.customerName} • {settings.currencySymbol}{order.totalAmount}
                        </p>
                      </div>
                    </Link>
                  ))}

                  {lowStockItems.map(item => (
                    <Link
                      key={item.id}
                      to="/inventory"
                      onClick={() => setShowNotifications(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-warm-ivory/70 transition-colors block text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-error/15 flex items-center justify-center text-error flex-shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-charcoal">
                          Low Stock Alert: {item.title}
                        </p>
                        <p className="text-[11px] text-error font-medium">
                          Only {item.stock} left in stock (Threshold: {item.lowStockThreshold || 5})
                        </p>
                      </div>
                    </Link>
                  ))}

                  {totalNotifications === 0 && (
                    <div className="text-center py-6 text-sm text-soft-gray">
                      No active alerts. All orders and inventory are up to date!
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-soft-gray/15 text-center">
                  <Link
                    to="/orders"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View All Orders →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="p-2 px-3 rounded-xl text-soft-gray hover:text-error hover:bg-error/10 border border-soft-gray/20 transition-colors text-xs font-semibold cursor-pointer"
            title="Sign out of admin"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
