import React from 'react';
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

export function App() {
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
