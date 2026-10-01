import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  AlertTriangle,
  Gift,
  ArrowUpRight,
  Plus,
  Percent
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Badge } from '../common/Badge';

export const DashboardModule = () => {
  const { products, orders, customers, categories, settings } = useAdmin();

  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalOrdersCount = orders.length;
  const totalCustomersCount = customers.length;
  const lowStockProducts = products.filter(p => p.stock <= (p.lowStockThreshold || 5));
  const recentOrders = [...orders].reverse().slice(0, 5);
  const processingCount = orders.filter(o => o.orderStatus === 'Processing').length;

  const stats = [
    {
      title: 'Total Revenue',
      value: `${settings.currencySymbol || '₹'}${totalRevenue.toLocaleString()}`,
      subtitle: totalRevenue > 0 ? 'Total fulfilled revenue' : 'No sales recorded yet',
      icon: TrendingUp,
      accentColor: 'primary',
    },
    {
      title: 'Total Orders',
      value: totalOrdersCount,
      subtitle: processingCount > 0 ? `${processingCount} order(s) in processing` : 'No pending orders',
      icon: ShoppingBag,
      accentColor: 'accent',
    },
    {
      title: 'Total Customers',
      value: totalCustomersCount,
      subtitle: totalCustomersCount > 0 ? 'Active customer accounts' : 'No customer accounts yet',
      icon: Users,
      accentColor: 'charcoal',
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockProducts.length,
      subtitle: lowStockProducts.length > 0 ? 'Requires stock replenishment' : 'All items in stock',
      icon: AlertTriangle,
      accentColor: lowStockProducts.length > 0 ? 'error' : 'success',
    },
  ];

  // Dynamic Weekly Sales calculation from actual orders
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyTotals = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  
  orders.forEach(order => {
    if (order.createdAt) {
      const date = new Date(order.createdAt);
      const dayIndex = (date.getDay() + 6) % 7; // Convert Sun=0..Sat=6 to Mon=0..Sun=6
      const dayName = daysOfWeek[dayIndex];
      if (dayName) {
        dailyTotals[dayName] += (order.totalAmount || 0);
      }
    }
  });

  const maxDailyAmount = Math.max(...Object.values(dailyTotals), 1);
  const weeklySales = daysOfWeek.map(day => ({
    day,
    amount: dailyTotals[day] || 0,
    height: dailyTotals[day] > 0 ? `${Math.round((dailyTotals[day] / maxDailyAmount) * 100)}%` : '4%'
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-soft-gray/20 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-charcoal tracking-tight">
              Welcome Admin
            </h1>
          </div>
          <p className="text-sm text-soft-gray mt-1">
            Overview of store performance, catalog inventory, and incoming customer gift orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-surface text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Gift Product
          </Link>
          <Link
            to="/coupons"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface text-charcoal border border-soft-gray/25 text-sm font-semibold hover:border-primary hover:text-primary transition-all"
          >
            <Percent className="w-4 h-4 text-primary" />
            New Offer
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-surface p-5 rounded-2xl border border-soft-gray/20 shadow-card hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-soft-gray">
                  {stat.title}
                </span>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    stat.accentColor === 'primary'
                      ? 'bg-primary/10 text-primary'
                      : stat.accentColor === 'accent'
                      ? 'bg-accent/20 text-accent'
                      : stat.accentColor === 'error'
                      ? 'bg-error/15 text-error'
                      : stat.accentColor === 'success'
                      ? 'bg-success/15 text-success'
                      : 'bg-secondary/20 text-charcoal'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-charcoal">{stat.value}</div>
                <p className="text-xs text-soft-gray mt-1 flex items-center gap-1 font-medium">
                  {stat.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column Analytics & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Visualizer */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-soft-gray/20 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-soft-gray/15">
            <div>
              <h2 className="text-base font-bold text-charcoal">Weekly Sales Overview</h2>
              <p className="text-xs text-soft-gray">Daily revenue generated across gift orders</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-accent/20 text-charcoal font-semibold">
              This Week
            </span>
          </div>

          <div className="pt-6 pb-2">
            <div className="flex items-end justify-between h-48 gap-3 sm:gap-6 px-2">
              {weeklySales.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[11px] font-semibold text-soft-gray opacity-0 group-hover:opacity-100 transition-opacity">
                    {settings.currencySymbol || '₹'}{item.amount}
                  </div>
                  <div className="w-full bg-warm-ivory rounded-t-xl h-full flex items-end overflow-hidden">
                    <div
                      className="w-full bg-primary hover:bg-primary/90 transition-all rounded-t-xl"
                      style={{ height: item.height }}
                    />
                  </div>
                  <span className="text-xs font-medium text-soft-gray group-hover:text-charcoal">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-soft-gray/15 text-xs text-soft-gray">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary inline-block" />
              <span>Orders Revenue</span>
            </div>
            <span>Calculated from live orders</span>
          </div>
        </div>

        {/* Gift Categories Distribution */}
        <div className="bg-surface p-6 rounded-2xl border border-soft-gray/20 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-soft-gray/15">
            <div>
              <h2 className="text-base font-bold text-charcoal">Top Gift Categories</h2>
              <p className="text-xs text-soft-gray">Active items count by category</p>
            </div>
            <Link to="/categories" className="text-xs font-semibold text-primary hover:underline">
              View All
            </Link>
          </div>

          <div className="py-4 space-y-4">
            {categories.length > 0 ? (
              categories.slice(0, 5).map((cat) => {
                const catProducts = products.filter(p => p.category === cat.name);
                const percentage = products.length > 0 
                  ? Math.min(100, Math.round((catProducts.length / products.length) * 100))
                  : 0;
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-charcoal">{cat.name}</span>
                      <span className="text-soft-gray">{catProducts.length} gifts ({percentage}%)</span>
                    </div>
                    <div className="h-2 w-full bg-warm-ivory rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-soft-gray">
                No categories created yet. Click 'Categories' to define your first gift category.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-soft-gray/15">
            <Link
              to="/products"
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-surface bg-primary hover:bg-primary/90 shadow-sm transition-colors"
            >
              Browse Catalog Products
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-surface rounded-2xl border border-soft-gray/20 shadow-card overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-soft-gray/15">
          <div>
            <h2 className="text-base font-bold text-charcoal">Recent Gift Orders</h2>
            <p className="text-xs text-soft-gray">Latest orders placed by customers requiring fulfillment</p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Manage All Orders
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-charcoal">
            <thead className="bg-warm-ivory/60 text-xs uppercase font-semibold text-soft-gray border-b border-soft-gray/15">
              <tr>
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Items</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Payment</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft-gray/10">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-warm-ivory/40 transition-colors">
                  <td className="px-6 py-4 font-semibold text-charcoal">
                    {order.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-charcoal">{order.customerName}</div>
                    <div className="text-xs text-soft-gray">{order.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-soft-gray text-xs">
                    {order.items?.length || 0} gift item{(order.items?.length || 0) > 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 font-semibold text-charcoal">
                    {settings.currencySymbol || '₹'}{order.totalAmount}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={order.paymentStatus === 'Paid' ? 'success' : 'accent'}>
                      {order.paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        order.orderStatus === 'Delivered'
                          ? 'success'
                          : order.orderStatus === 'Shipped'
                          ? 'accent'
                          : order.orderStatus === 'Cancelled'
                          ? 'error'
                          : 'primary'
                      }
                    >
                      {order.orderStatus}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to="/orders"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}

              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-sm text-soft-gray">
                    No customer gift orders placed yet. Orders will appear here automatically when received.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
