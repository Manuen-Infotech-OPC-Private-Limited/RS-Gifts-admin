import React, { useState, useMemo } from 'react';
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
  const currencySymbol = settings?.currencySymbol || '₹';

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

  // Sales Visualizer Mode: 'weekly' or 'monthly'
  const [timeFrame, setTimeFrame] = useState('weekly');

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const monthsOfYear = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Current Calendar Week and Year bounds for perfect chronological accuracy
  const { weekStart, weekEnd, todayIndex, currentYear, currentMonthIndex, weekSubtitle } = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
    const todayIndex = (currentDay + 6) % 7; // Mon = 0 ... Fri = 4 ... Sun = 6

    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
    const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6, 23, 59, 59, 999);

    const opt = { day: 'numeric', month: 'short' };
    const weekSubtitle = `Daily revenue for This Week (${weekStart.toLocaleDateString('en-IN', opt)} – ${weekEnd.toLocaleDateString('en-IN', opt)})`;

    return {
      weekStart,
      weekEnd,
      todayIndex,
      currentYear: now.getFullYear(),
      currentMonthIndex: now.getMonth(),
      weekSubtitle,
    };
  }, []);

  // Dynamic Sales Calculation strictly filtered for current week / current year
  const { chartData, ceilingAmount } = useMemo(() => {
    const validOrders = (orders || []).filter(o => o.orderStatus !== 'Cancelled');

    if (timeFrame === 'weekly') {
      const dailyTotals = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
      const dailyCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

      validOrders.forEach(order => {
        const dateStr = order.createdAt || order.date;
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;

        // PERFECT THIS-WEEK CHECK: Only include orders placed between this week's Monday 00:00 and Sunday 23:59
        if (d >= weekStart && d <= weekEnd) {
          const dayIndex = (d.getDay() + 6) % 7;
          const dayName = daysOfWeek[dayIndex];
          if (dayName) {
            dailyTotals[dayName] += Number(order.totalAmount) || 0;
            dailyCounts[dayName] += 1;
          }
        }
      });

      const rawMax = Math.max(...Object.values(dailyTotals), 500);
      let ceiling = 1000;
      if (rawMax <= 1000) ceiling = 1000;
      else if (rawMax <= 5000) ceiling = Math.ceil(rawMax / 1000) * 1000;
      else if (rawMax <= 20000) ceiling = Math.ceil(rawMax / 2500) * 2500;
      else if (rawMax <= 100000) ceiling = Math.ceil(rawMax / 10000) * 10000;
      else ceiling = Math.ceil(rawMax / 25000) * 25000;

      const items = daysOfWeek.map((day, idx) => {
        const amount = Math.round(dailyTotals[day] || 0);
        const count = dailyCounts[day] || 0;
        const isToday = idx === todayIndex;
        const isFuture = idx > todayIndex;
        const heightPercent = amount > 0 
          ? Math.max(10, Math.min(96, Math.round((amount / ceiling) * 100))) 
          : 0;

        const displayVal = amount >= 1000 
          ? `${(amount / 1000).toFixed(1).replace('.0', '')}K` 
          : `${amount}`;

        return {
          key: day,
          label: day,
          amount,
          count,
          isToday,
          isFuture,
          displayAmount: displayVal,
          formattedAmount: amount.toLocaleString('en-IN'),
          height: amount > 0 ? `${heightPercent}%` : '4px',
          hasSales: amount > 0,
        };
      });

      return {
        chartData: items,
        ceilingAmount: ceiling,
      };
    } else {
      // Monthly aggregation strictly filtered for current year
      const monthlyTotals = {};
      const monthlyCounts = {};
      monthsOfYear.forEach(m => {
        monthlyTotals[m] = 0;
        monthlyCounts[m] = 0;
      });

      validOrders.forEach(order => {
        const dateStr = order.createdAt || order.date;
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;

        // PERFECT THIS-YEAR CHECK: Only include orders placed within current calendar year
        if (d.getFullYear() === currentYear) {
          const monthName = monthsOfYear[d.getMonth()];
          if (monthName) {
            monthlyTotals[monthName] += Number(order.totalAmount) || 0;
            monthlyCounts[monthName] += 1;
          }
        }
      });

      const rawMax = Math.max(...Object.values(monthlyTotals), 1000);
      let ceiling = 2000;
      if (rawMax <= 2000) ceiling = 2000;
      else if (rawMax <= 10000) ceiling = Math.ceil(rawMax / 2000) * 2000;
      else if (rawMax <= 50000) ceiling = Math.ceil(rawMax / 10000) * 10000;
      else if (rawMax <= 200000) ceiling = Math.ceil(rawMax / 25000) * 25000;
      else ceiling = Math.ceil(rawMax / 50000) * 50000;

      const items = monthsOfYear.map((month, idx) => {
        const amount = Math.round(monthlyTotals[month] || 0);
        const count = monthlyCounts[month] || 0;
        const isCurrent = idx === currentMonthIndex;
        const isFuture = idx > currentMonthIndex;
        const heightPercent = amount > 0 
          ? Math.max(10, Math.min(96, Math.round((amount / ceiling) * 100))) 
          : 0;

        const displayVal = amount >= 1000 
          ? `${(amount / 1000).toFixed(1).replace('.0', '')}K` 
          : `${amount}`;

        return {
          key: month,
          label: month,
          amount,
          count,
          isToday: isCurrent,
          isFuture,
          displayAmount: displayVal,
          formattedAmount: amount.toLocaleString('en-IN'),
          height: amount > 0 ? `${heightPercent}%` : '4px',
          hasSales: amount > 0,
        };
      });

      return {
        chartData: items,
        ceilingAmount: ceiling,
      };
    }
  }, [orders, timeFrame, weekStart, weekEnd, todayIndex, currentYear, currentMonthIndex]);

  // Dynamic Y-Axis scale tiers (from ceiling down to 0)
  const yAxisTiers = useMemo(() => {
    const formatTier = (val) => {
      if (val === 0) return '0';
      if (val >= 1000) {
        const k = val / 1000;
        return `${k % 1 === 0 ? k : k.toFixed(1)}K`;
      }
      return `${Math.round(val)}`;
    };

    return [
      { label: formatTier(ceilingAmount), value: ceilingAmount },
      { label: formatTier(ceilingAmount * 0.75), value: ceilingAmount * 0.75 },
      { label: formatTier(ceilingAmount * 0.50), value: ceilingAmount * 0.50 },
      { label: formatTier(ceilingAmount * 0.25), value: ceilingAmount * 0.25 },
      { label: '0', value: 0 },
    ];
  }, [ceilingAmount]);

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
        {/* Sales Performance Visualizer - Weekly & Monthly Dynamic Bar Diagram */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-soft-gray/20 shadow-card flex flex-col justify-between">
          {/* Card Header with Weekly / Monthly Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
            <div>
              <h2 className="text-base font-bold text-charcoal">
                {timeFrame === 'weekly' ? 'Weekly Sales Overview' : 'Monthly Sales Overview'}
              </h2>
              <p className="text-xs text-soft-gray mt-0.5">
                {timeFrame === 'weekly'
                  ? weekSubtitle
                  : `Monthly revenue for ${currentYear} (Jan – Dec)`}
              </p>
            </div>

            {/* Clean Segmented Weekly / Monthly Toggle */}
            <div className="inline-flex items-center bg-warm-ivory border border-soft-gray/25 rounded-xl p-1 shadow-2xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTimeFrame('weekly')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeFrame === 'weekly'
                    ? 'bg-primary text-surface shadow-xs'
                    : 'text-soft-gray hover:text-charcoal'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setTimeFrame('monthly')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeFrame === 'monthly'
                    ? 'bg-primary text-surface shadow-xs'
                    : 'text-soft-gray hover:text-charcoal'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Dynamic Bar Diagram with Left Y-Axis Scale */}
          <div className="pt-4 pb-2">
            <div className="flex h-60 w-full">
              {/* Left Y-Axis Scale */}
              <div className="flex flex-col justify-between items-end pr-3 pb-8 text-[11px] font-mono text-soft-gray select-none shrink-0 w-12 sm:w-14">
                {yAxisTiers.map((tier, idx) => (
                  <span key={idx} className="leading-none font-semibold">
                    {currencySymbol}{tier.label}
                  </span>
                ))}
              </div>

              {/* Chart Canvas: Dynamic Vertical Bars */}
              <div className="flex-1 relative flex flex-col justify-between">
                {/* Vertical Bars Area */}
                <div className="relative z-10 flex-1 pb-8 flex items-end justify-between gap-1 sm:gap-2.5 px-1 sm:px-2">
                  {chartData.map((item) => (
                    <div
                      key={item.key}
                      className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                      title={`${item.label}${item.isToday ? ' (Today)' : item.isFuture ? ' (Upcoming)' : ''}: ${currencySymbol}${item.formattedAmount} (${item.count} orders)`}
                    >
                      {/* Amount above bar - Only show amount when there are sales */}
                      <div className="h-4 flex items-center justify-center mb-1.5">
                        {item.hasSales && (
                          <span className="text-[10px] sm:text-[11px] font-bold text-charcoal group-hover:text-primary transition-all whitespace-nowrap">
                            {currencySymbol}{item.displayAmount}
                          </span>
                        )}
                      </div>

                      {/* Bar Container - Clean and without ghost capsule when empty */}
                      <div className="w-full max-w-[32px] sm:max-w-[42px] h-full flex items-end justify-center">
                        {item.hasSales ? (
                          <div
                            className="w-full bg-primary hover:bg-primary/85 rounded-t-xl transition-all duration-500 ease-out group-hover:shadow-md"
                            style={{ height: item.height }}
                          />
                        ) : (
                          <div className="w-5 sm:w-6 h-1 rounded-full bg-soft-gray/20 mb-0.5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom X-Axis Labels */}
                <div className="flex items-center justify-between gap-1 sm:gap-2.5 px-1 sm:px-2 pt-1">
                  {chartData.map((item) => (
                    <div
                      key={item.key}
                      className="flex-1 text-center"
                    >
                      <div
                        className={`text-[11px] sm:text-xs font-semibold transition-colors ${
                          item.isToday
                            ? 'text-primary font-bold'
                            : item.hasSales
                            ? 'text-charcoal'
                            : 'text-soft-gray'
                        }`}
                      >
                        {item.label}
                      </div>
                      {timeFrame === 'weekly' && item.isToday && (
                        <span className="inline-block text-[9px] font-bold text-primary bg-primary/10 px-1 py-0.5 rounded-sm mt-0.5 leading-none">
                          Today
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
                  <td className="px-6 py-4 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-soft-gray/20 bg-warm-ivory shrink-0 flex items-center justify-center">
                        {order.items?.[0]?.image ? (
                          <img
                            src={order.items[0]?.image}
                            alt={order.items[0]?.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <Gift className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="truncate max-w-[140px] font-medium text-charcoal">
                        {order.items?.[0]?.title || `${order.items?.length || 0} items`}
                      </div>
                    </div>
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
