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
import { ContentModule } from './components/modules/ContentModule';
import { ReviewsModule } from './components/modules/ReviewsModule';
import { SettingsModule } from './components/modules/SettingsModule';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<DashboardModule />} />
        <Route path="dashboard" element={<DashboardModule />} />
        <Route path="products" element={<ProductsModule />} />
        <Route path="categories" element={<CategoriesModule />} />
        <Route path="orders" element={<OrdersModule />} />
        <Route path="inventory" element={<InventoryModule />} />
        <Route path="customers" element={<CustomersModule />} />
        <Route path="coupons" element={<CouponsModule />} />
        <Route path="content" element={<ContentModule />} />
        <Route path="reviews" element={<ReviewsModule />} />
        <Route path="settings" element={<SettingsModule />} />
        {/* Catch-all redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
