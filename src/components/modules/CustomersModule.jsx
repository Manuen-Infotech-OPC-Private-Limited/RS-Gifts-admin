import React, { useState } from 'react';
import { 
  Search, 
  Mail, 
  Phone, 
  ShoppingBag, 
  Eye, 
  User, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  Users, 
  CreditCard 
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const CustomersModule = () => {
  const { customers, orders, settings, refreshCustomers, toggleCustomerStatus, showToast } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'addresses' | 'orders'
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshCustomers(searchTerm);
      showToast('Customer accounts synced with database.');
    } catch {
      showToast('Failed to sync customers.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleStatus = async (customer) => {
    const custId = customer.id || customer._id;
    setTogglingId(custId);
    try {
      await toggleCustomerStatus(custId);
      if (selectedCustomer && (selectedCustomer.id === custId || selectedCustomer._id === custId)) {
        setSelectedCustomer((prev) => ({
          ...prev,
          isActive: !prev.isActive,
        }));
      }
    } catch {
      // toast handled in context
    } finally {
      setTogglingId(null);
    }
  };

  // Safe filter logic
  const filteredCustomers = (customers || []).filter((c) => {
    if (!c) return false;
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    const name = (c.name || `${c.firstName || ''} ${c.lastName || ''}`).toLowerCase();
    const email = (c.email || '').toLowerCase();
    const phone = String(c.phone || '');
    const location = String(c.address || '').toLowerCase();

    return name.includes(term) || email.includes(term) || phone.includes(term) || location.includes(term);
  });

  // Calculate customer orders
  const getCustomerOrders = (customer) => {
    if (!customer) return [];
    const custEmail = (customer.email || '').toLowerCase();
    const custId = String(customer.id || customer._id || '');

    return (orders || []).filter((o) => {
      const orderEmail = (o.customerEmail || o.customerInfo?.email || '').toLowerCase();
      const orderCustId = String(o.customer || o.customerId || '');
      return (custEmail && orderEmail === custEmail) || (custId && orderCustId === custId);
    });
  };

  const selectedOrders = selectedCustomer ? getCustomerOrders(selectedCustomer) : [];

  // Summary Metrics
  const totalCustomers = (customers || []).length;
  const activeCustomers = (customers || []).filter((c) => c && c.isActive !== false).length;
  const totalSpendAll = (customers || []).reduce((sum, c) => sum + (Number(c.totalSpent) || 0), 0);
  const totalOrdersAll = (customers || []).reduce((sum, c) => sum + (Number(c.totalOrders) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal tracking-tight">Customer Accounts & Profiles</h1>
          <p className="text-sm text-soft-gray mt-1">
            View registered gift customers, full personal profiles, delivery addresses, and past order activity.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-surface border border-soft-gray/25 text-charcoal hover:bg-warm-ivory shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-primary ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Refresh Records'}</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-soft-gray/20 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-soft-gray">Total Customers</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal mt-2">{totalCustomers}</p>
          <span className="text-[11px] text-soft-gray">Registered customer accounts</span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-soft-gray/20 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-soft-gray">Active Accounts</span>
            <div className="w-8 h-8 rounded-xl bg-success/10 text-success flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal mt-2">{activeCustomers}</p>
          <span className="text-[11px] text-success font-medium">Eligible for purchases</span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-soft-gray/20 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-soft-gray">Customer Orders</span>
            <div className="w-8 h-8 rounded-xl bg-accent/20 text-charcoal flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal mt-2">{totalOrdersAll}</p>
          <span className="text-[11px] text-soft-gray">Total orders placed</span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-soft-gray/20 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-soft-gray">Lifetime Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-charcoal mt-2">
            {settings.currencySymbol || '₹'}{totalSpendAll.toLocaleString()}
          </p>
          <span className="text-[11px] text-soft-gray">Cumulative customer spend</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-soft-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers by name, email, phone number, or city..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-soft-gray/25 bg-warm-ivory/40 text-charcoal placeholder-soft-gray focus:border-primary focus:bg-surface focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="bg-surface rounded-2xl border border-soft-gray/20 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-charcoal">
            <thead className="bg-warm-ivory/60 text-xs uppercase font-semibold text-soft-gray border-b border-soft-gray/15">
              <tr>
                <th className="px-6 py-3.5">Customer Name & ID</th>
                <th className="px-6 py-3.5">Contact Details</th>
                <th className="px-6 py-3.5">Gender / DOB</th>
                <th className="px-6 py-3.5">Primary Location</th>
                <th className="px-6 py-3.5 text-center">Orders</th>
                <th className="px-6 py-3.5">Total Spent</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft-gray/10">
              {filteredCustomers.map((cust) => {
                const displayName = cust.name || `${cust.firstName || ''} ${cust.lastName || ''}`.trim() || 'Customer';
                const initial = displayName.charAt(0).toUpperCase() || 'C';
                const isActive = cust.isActive !== false;

                return (
                  <tr key={cust.id || cust._id} className="hover:bg-warm-ivory/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/40 text-primary flex items-center justify-center font-bold text-sm border border-soft-gray/20 shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-charcoal truncate">{displayName}</div>
                          <div className="text-[11px] text-soft-gray font-mono truncate">
                            ID: {String(cust.id || cust._id).slice(-8).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-charcoal font-medium">
                        <Mail className="w-3.5 h-3.5 text-soft-gray shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-soft-gray">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{cust.phone || '—'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-soft-gray">
                      <div>
                        {cust.gender ? (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-warm-ivory border border-soft-gray/20 text-charcoal text-[11px] font-medium mr-1.5">
                            {cust.gender}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-soft-gray mt-0.5">
                        {cust.dob ? `DOB: ${cust.dob}` : 'DOB: Not set'}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-soft-gray">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-soft-gray shrink-0" />
                        <span className="truncate max-w-[150px]">{cust.address || '—'}</span>
                      </div>
                      {cust.addressesCount > 1 && (
                        <span className="text-[10px] text-primary font-medium">
                          +{cust.addressesCount} saved addresses
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-charcoal px-2.5 py-1 rounded-full bg-warm-ivory border border-soft-gray/20 text-xs">
                        {cust.totalOrders || 0}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-bold text-charcoal">
                      {settings.currencySymbol || '₹'}{(Number(cust.totalSpent) || 0).toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(cust)}
                        disabled={togglingId === (cust.id || cust._id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Click to toggle status"
                      >
                        {isActive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            <span>Blocked</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedCustomer(cust);
                          setActiveTab('profile');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-surface bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Profile</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-16 text-sm text-soft-gray">
                    {(customers || []).length === 0
                      ? 'No customer accounts found in the database. Customer profiles will automatically appear here as users register on the website.'
                      : 'No customer accounts match your current search query.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Customer Profile & Order History Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer Account: ${selectedCustomer.name || 'Profile'}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5 font-sans">
            {/* Customer Header Banner */}
            <div className="p-5 rounded-2xl bg-warm-ivory border border-soft-gray/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-primary text-surface flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                  {(selectedCustomer.name || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-charcoal text-lg">
                      {selectedCustomer.name || `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim() || 'Customer'}
                    </h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        selectedCustomer.isActive !== false
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {selectedCustomer.isActive !== false ? 'Active Account' : 'Blocked'}
                    </span>
                  </div>
                  <p className="text-xs text-soft-gray mt-0.5">
                    {selectedCustomer.email} • {selectedCustomer.phone || 'No phone'}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-soft-gray/20">
                <p className="text-xs uppercase font-semibold text-soft-gray">Lifetime Spend</p>
                <p className="text-xl font-bold text-charcoal">
                  {settings.currencySymbol || '₹'}
                  {(Number(selectedCustomer.totalSpent) || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-soft-gray/20 gap-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'profile'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-soft-gray hover:text-charcoal'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Personal Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('addresses')}
                className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'addresses'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-soft-gray hover:text-charcoal'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Saved Addresses ({selectedCustomer.addresses?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'orders'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-soft-gray hover:text-charcoal'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Orders History ({selectedOrders.length})</span>
              </button>
            </div>

            {/* Tab 1: Personal Profile Fields */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-warm-ivory/50 border border-soft-gray/15">
                    <p className="text-[11px] font-semibold text-soft-gray uppercase tracking-wider">Full Name</p>
                    <p className="text-sm font-bold text-charcoal mt-1">
                      {selectedCustomer.name || '—'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-warm-ivory/50 border border-soft-gray/15">
                    <p className="text-[11px] font-semibold text-soft-gray uppercase tracking-wider">Email Address</p>
                    <p className="text-sm font-bold text-charcoal mt-1 truncate">
                      {selectedCustomer.email || '—'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-warm-ivory/50 border border-soft-gray/15">
                    <p className="text-[11px] font-semibold text-soft-gray uppercase tracking-wider">Phone / Mobile</p>
                    <p className="text-sm font-bold text-charcoal mt-1">
                      {selectedCustomer.phone || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-warm-ivory/50 border border-soft-gray/15">
                    <p className="text-[11px] font-semibold text-soft-gray uppercase tracking-wider">Gender</p>
                    <p className="text-sm font-bold text-charcoal mt-1">
                      {selectedCustomer.gender || 'Not specified'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-warm-ivory/50 border border-soft-gray/15">
                    <p className="text-[11px] font-semibold text-soft-gray uppercase tracking-wider">Date of Birth</p>
                    <p className="text-sm font-bold text-charcoal mt-1">
                      {selectedCustomer.dob || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-warm-ivory/50 border border-soft-gray/15">
                    <p className="text-[11px] font-semibold text-soft-gray uppercase tracking-wider">Joined Date</p>
                    <p className="text-sm font-bold text-charcoal mt-1">
                      {selectedCustomer.createdAt
                        ? new Date(selectedCustomer.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : selectedCustomer.joinedAt || '—'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-warm-ivory/50 border border-soft-gray/15">
                    <p className="text-[11px] font-semibold text-soft-gray uppercase tracking-wider">Last Login</p>
                    <p className="text-sm font-bold text-charcoal mt-1">
                      {selectedCustomer.lastLogin
                        ? new Date(selectedCustomer.lastLogin).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : 'Never logged in'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-warm-ivory/50 border border-soft-gray/15">
                    <p className="text-[11px] font-semibold text-soft-gray uppercase tracking-wider">Database ID</p>
                    <p className="text-xs font-mono text-charcoal mt-1 truncate">
                      {selectedCustomer.id || selectedCustomer._id}
                    </p>
                  </div>
                </div>

                {/* Account Status Control */}
                <div className="p-4 rounded-xl border border-soft-gray/20 bg-surface flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-charcoal">Account Authorization</h4>
                    <p className="text-[11px] text-soft-gray mt-0.5">
                      Toggle whether this customer can log in and place orders on RS Gifts.
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(selectedCustomer)}
                    disabled={togglingId === (selectedCustomer.id || selectedCustomer._id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      selectedCustomer.isActive !== false
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {selectedCustomer.isActive !== false ? 'Block Account' : 'Activate Account'}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Saved Delivery Addresses */}
            {activeTab === 'addresses' && (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {(selectedCustomer.addresses || []).length > 0 ? (
                  selectedCustomer.addresses.map((addr, idx) => (
                    <div
                      key={addr._id || addr.id || idx}
                      className="p-4 rounded-xl border border-soft-gray/20 bg-surface space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-charcoal">
                          {addr.recipientName || selectedCustomer.name}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            Default Address
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-soft-gray">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                      </p>
                      <p className="text-xs text-charcoal font-medium">
                        {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')}
                        {addr.country ? ` (${addr.country})` : ''}
                      </p>
                      <p className="text-[11px] text-soft-gray">
                        Phone: {addr.phone || selectedCustomer.phone || '—'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-warm-ivory/40 rounded-xl border border-dashed border-soft-gray/30">
                    <MapPin className="w-8 h-8 text-soft-gray mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-charcoal">No saved delivery addresses</p>
                    <p className="text-[11px] text-soft-gray mt-1">
                      This customer has not saved any permanent shipping addresses to their profile yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Order History */}
            {activeTab === 'orders' && (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {selectedOrders.length > 0 ? (
                  selectedOrders.map((order) => (
                    <div
                      key={order.id || order._id}
                      className="p-4 rounded-xl border border-soft-gray/20 bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-charcoal font-mono">
                            {order.id || order.orderNumber}
                          </span>
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
                          <span className="text-[11px] text-soft-gray">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>

                        <p className="text-xs text-soft-gray mt-1">
                          {order.items?.length || 0} item(s) • Payment: {order.paymentMethod || 'COD'} ({order.paymentStatus || 'Pending'})
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="font-bold text-charcoal text-sm">
                          {settings.currencySymbol || '₹'}{order.totalAmount}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-warm-ivory/40 rounded-xl border border-dashed border-soft-gray/30">
                    <ShoppingBag className="w-8 h-8 text-soft-gray mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-charcoal">No purchase records found</p>
                    <p className="text-[11px] text-soft-gray mt-1">
                      This customer has not completed any gift orders yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CustomersModule;
