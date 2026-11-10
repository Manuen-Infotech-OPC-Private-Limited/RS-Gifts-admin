import React, { useState, useMemo } from 'react';
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
  CreditCard,
  Gift,
  Package
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import customerService from '../../services/customerService';

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

  // Calculate customer orders (matches by email, phone, or customer ID)
  const getCustomerOrders = (customer) => {
    if (!customer) return [];
    const custEmail = (customer.email || '').toLowerCase().trim();
    const custPhone = String(customer.phone || '').trim();
    const custId = String(customer.id || customer._id || '');

    return (orders || []).filter((o) => {
      const orderEmail = (o.customerEmail || o.customerInfo?.email || '').toLowerCase().trim();
      const orderPhone = String(o.customerPhone || o.customerInfo?.phone || '').trim();
      const orderCustId = String(o.customer?._id || o.customer || o.customerId || '');
      return (
        (custId && orderCustId && custId === orderCustId) ||
        (custEmail && orderEmail && custEmail === orderEmail) ||
        (custPhone && orderPhone && custPhone === orderPhone)
      );
    });
  };

  const selectedOrders = selectedCustomer ? getCustomerOrders(selectedCustomer) : [];

  // Customer delivery addresses from user profile
  const getCustomerAddresses = (customer) => {
    if (!customer) return [];
    const list = [...(customer.addresses || [])];

    if (list.length === 0 && customer.address && customer.address !== '—' && customer.address !== 'Not provided') {
      list.push({
        id: 'registered_addr',
        _id: 'registered_addr',
        recipientName: customer.name || 'Registered Customer',
        phone: customer.phone || '',
        addressLine1: customer.address,
        isDefault: true,
      });
    }

    return list;
  };

  const customerAddresses = selectedCustomer ? getCustomerAddresses(selectedCustomer) : [];

  const primaryAddressText = useMemo(() => {
    if (!selectedCustomer) return 'Not provided';
    if (selectedCustomer.address && selectedCustomer.address !== '—' && selectedCustomer.address !== 'Not provided') {
      return selectedCustomer.address;
    }
    if (customerAddresses.length > 0) {
      const def = customerAddresses.find((a) => a.isDefault) || customerAddresses[0];
      return [def.addressLine1, def.addressLine2, def.city, def.state, def.postalCode].filter(Boolean).join(', ');
    }
    return 'Not provided';
  }, [selectedCustomer, customerAddresses]);

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
                        <span className="truncate max-w-[180px]">
                          {cust.address && cust.address !== '—' && cust.address !== 'Not provided'
                            ? cust.address
                            : (() => {
                                const o = getCustomerOrders(cust);
                                const s = o[0]?.shippingAddress;
                                return s ? [s.addressLine1, s.city, s.postalCode].filter(Boolean).join(', ') : 'Not provided';
                              })()}
                        </span>
                      </div>
                      {(cust.addressesCount > 1 || (cust.addresses?.length || 0) > 1) && (
                        <span className="text-[10px] text-primary font-medium block mt-0.5">
                          +{cust.addressesCount || cust.addresses?.length} saved addresses
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
                        onClick={async () => {
                          setSelectedCustomer(cust);
                          setActiveTab('profile');
                          try {
                            const fresh = await customerService.fetchCustomerById(cust.id || cust._id);
                            if (fresh?.customer) {
                              setSelectedCustomer(fresh.customer);
                            }
                          } catch {
                            // keep fallback
                          }
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
                <span>Saved Addresses ({customerAddresses.length})</span>
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

                  <div className="p-3.5 rounded-xl bg-warm-ivory/50 border border-soft-gray/15 sm:col-span-2">
                    <p className="text-[11px] font-semibold text-soft-gray uppercase tracking-wider">Address / Location</p>
                    <p className="text-sm font-bold text-charcoal mt-1">
                      {primaryAddressText}
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
                {customerAddresses.length > 0 ? (
                  customerAddresses.map((addr, idx) => (
                    <div
                      key={addr._id || addr.id || idx}
                      className="p-4 rounded-xl border border-soft-gray/20 bg-surface space-y-1.5"
                    >
                      {addr.isDefault && (
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            Default Address
                          </span>
                        </div>
                      )}
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
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {selectedOrders.length > 0 ? (
                  selectedOrders.map((order) => (
                    <div
                      key={order.id || order._id}
                      className="p-4 sm:p-5 rounded-2xl border border-soft-gray/20 bg-surface space-y-3.5 shadow-2xs hover:border-primary/30 transition-all"
                    >
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-charcoal font-mono bg-warm-ivory px-2.5 py-1 rounded-lg border border-soft-gray/20">
                            #{order.orderNumber || order.id || order._id}
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
                          <span className="text-xs text-soft-gray flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                          </span>
                        </div>
                      </div>

                      {/* Items Ordered - Photo & Clear Details */}
                      <div className="space-y-2.5">
                        {(order.items || []).map((item, idx) => {
                            const itemImg = item.image || item.productImage || item.img || item.product?.image;
                            const itemTitle = item.title || item.name || item.productTitle || item.product?.title || 'Custom Gift';
                            const itemPrice = Number(item.price) || 0;
                            const itemQty = Number(item.quantity || item.qty) || 1;
                            const itemSubtotal = itemPrice * itemQty;
                            const persData = item.personalizationData || item.customizations || item.customization;

                            return (
                              <div
                                key={item._id || item.id || idx}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-3 rounded-xl bg-warm-ivory/40 border border-soft-gray/15 hover:bg-warm-ivory/70 transition-colors"
                              >
                                {/* Photo & Details */}
                                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                                  {/* Product Thumbnail Photo */}
                                  <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border border-soft-gray/25 bg-surface shrink-0 shadow-2xs flex items-center justify-center">
                                    {itemImg ? (
                                      <img
                                        src={itemImg}
                                        alt={itemTitle}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div className={`w-full h-full bg-primary/10 flex flex-col items-center justify-center text-primary ${itemImg ? 'hidden' : 'flex'}`}>
                                      <Gift className="w-6 h-6" />
                                      <span className="text-[9px] font-semibold mt-0.5">Gift</span>
                                    </div>
                                  </div>

                                  {/* Title & Metadata */}
                                  <div className="min-w-0 space-y-1">
                                    <h5 className="font-bold text-sm text-charcoal leading-snug">
                                      {itemTitle}
                                    </h5>

                                    <div className="flex flex-wrap items-center gap-2 text-xs text-soft-gray">
                                      <span>
                                        Qty: <strong className="text-charcoal font-semibold">{itemQty}</strong>
                                      </span>
                                      <span>•</span>
                                      <span>
                                        Price: <strong className="text-charcoal font-semibold">{settings.currencySymbol || '₹'}{itemPrice.toLocaleString()}</strong>
                                      </span>
                                    </div>

                                    {/* Personalization Details */}
                                    {persData && (persData.customText || persData.giftCardMessage || persData.photoUploaded) && (
                                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                                        {persData.customText && (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                                            <span>✨ Engraving:</span>
                                            <strong className="text-charcoal">"{persData.customText}"</strong>
                                          </span>
                                        )}
                                        {persData.giftCardMessage && (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 font-medium">
                                            <span>💌 Note:</span>
                                            <span className="italic max-w-[200px] truncate">"{persData.giftCardMessage}"</span>
                                          </span>
                                        )}
                                        {persData.photoUploaded && (
                                          <a
                                            href={persData.photoUploaded}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:underline font-semibold text-[11px]"
                                          >
                                            <Eye className="w-3 h-3" />
                                            <span>Custom Photo</span>
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Item Total */}
                                <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-soft-gray/10">
                                  <span className="text-[10px] uppercase font-semibold text-soft-gray sm:block">Subtotal: </span>
                                  <span className="font-bold text-charcoal text-sm sm:text-base">
                                    {settings.currencySymbol || '₹'}{itemSubtotal.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                      {/* Footer: Payment & Delivery Details */}
                      <div className="flex flex-wrap items-center justify-between text-xs text-soft-gray gap-2">
                        <span>
                          Payment: <strong className="text-charcoal font-semibold">{order.paymentMethod || 'COD'}</strong> ({order.paymentStatus || 'Pending'})
                        </span>
                        {order.shippingAddress && (
                          <span className="truncate max-w-[300px]">
                            {[order.shippingAddress.addressLine1, order.shippingAddress.city, order.shippingAddress.postalCode].filter(Boolean).join(', ')}
                          </span>
                        )}
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
