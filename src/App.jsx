import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { DashboardModule } from './components/modules/DashboardModule';
import { ProductsModule } from './components/modules/ProductsModule';
import { CategoriesModule } from './components/modules/CategoriesModule';
import { OrdersModule } from './components/modules/OrdersModule';
import { InventoryModule } from './components/modules/InventoryModule';
import { CustomersModule } from './components/modules/CustomersModule';
import { CouponsModule } from './components/modules/CouponsModule';
import { WebsiteContent } from './components/modules/WebsiteContent';
import { ReviewsModule } from './components/modules/ReviewsModule';
import { InquiriesModule } from './components/modules/InquiriesModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { AdminLoginPage } from './components/auth/AdminLoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { updateTabFavicon } from './utils/urlHelper';

export function App() {
  useEffect(() => {
    try {
      const savedLogo = localStorage.getItem('rs_gifts_store_logo');
      if (savedLogo) updateTabFavicon(savedLogo);
    } catch (e) {}

    const handleStorage = (e) => {
      if (e.key === 'rs_gifts_store_logo' && e.newValue) {
        updateTabFavicon(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<AdminLoginPage />} />

      {/* Protected Admin Console */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardModule />} />
        <Route path="dashboard" element={<DashboardModule />} />
        <Route path="products" element={<ProductsModule />} />
        <Route path="categories" element={<CategoriesModule />} />
        <Route path="orders" element={<OrdersModule />} />
        <Route path="inventory" element={<InventoryModule />} />
        <Route path="customers" element={<CustomersModule />} />
        <Route path="coupons" element={<CouponsModule />} />
        <Route path="content" element={<WebsiteContent />} />
        <Route path="reviews" element={<ReviewsModule />} />
        <Route path="inquiries" element={<InquiriesModule />} />
        <Route path="settings" element={<SettingsModule />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
