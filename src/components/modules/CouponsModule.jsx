import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Tag, 
  Search, 
  Check, 
  Copy,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

/**
 * Pure frontend logic for dynamic coupon validation & calculation
 * (Emulates backend validation engine on the client side)
 */
export const evaluateCoupon = (coupon, cartTotal = 0, selectedCategory = 'All', userUsageCount = 0) => {
  if (!coupon) {
    return { valid: false, error: 'Please select a coupon code.' };
  }

  // 1. Active status check
  if (!coupon.active) {
    return { valid: false, error: `Coupon "${coupon.code}" is currently deactivated.` };
  }

  // 2. Expiry check (calculated dynamically against today's date)
  if (coupon.expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(coupon.expiryDate);
    exp.setHours(23, 59, 59, 999);
    if (exp.getTime() < today.getTime()) {
      return { valid: false, error: `Coupon "${coupon.code}" expired on ${coupon.expiryDate}.` };
    }
  }

  // 3. One time per user check (1 user for 1 time only)
  const perUserLimit = coupon.perUserLimit !== undefined ? Number(coupon.perUserLimit) : 1;
  if (perUserLimit > 0 && userUsageCount >= perUserLimit) {
    return {
      valid: false,
      error: `Coupon "${coupon.code}" can only be redeemed once per customer. It cannot be used more than 1 time.`
    };
  }

  // 4. Usage limit check (Total storewide redemptions)
  const usageCount = Number(coupon.usageCount) || 0;
  const usageLimit = Number(coupon.usageLimit) || 0;
  if (usageLimit > 0 && usageCount >= usageLimit) {
    return { valid: false, error: `Coupon "${coupon.code}" has reached its maximum redemption limit (${usageLimit} uses).` };
  }

  // 4. Minimum spend requirement
  const minSpend = Number(coupon.minSpend) || 0;
  const total = Number(cartTotal) || 0;
  if (total < minSpend) {
    return { 
      valid: false, 
      error: `Order amount (₹${total}) does not meet the minimum requirement of ₹${minSpend}. Add ₹${minSpend - total} more to apply.` 
    };
  }

  // 5. Category restriction
  if (coupon.categoryRestriction && coupon.categoryRestriction !== 'All') {
    if (selectedCategory !== 'All' && coupon.categoryRestriction !== selectedCategory) {
      return { 
        valid: false, 
        error: `Valid only for products in "${coupon.categoryRestriction}" category.` 
      };
    }
  }

  // 6. Discount calculation
  let discountAmount = 0;
  const discValue = Number(coupon.discountValue) || 0;

  if (coupon.discountType === 'percentage') {
    discountAmount = (total * discValue) / 100;
    // Cap at max discount if specified
    const maxCap = Number(coupon.maxDiscount) || 0;
    if (maxCap > 0 && discountAmount > maxCap) {
      discountAmount = maxCap;
    }
  } else {
    // Fixed flat discount
    discountAmount = discValue;
  }

  // Discount cannot exceed the cart total
  discountAmount = Math.min(discountAmount, total);
  const finalPayable = Math.max(0, total - discountAmount);

  return {
    valid: true,
    discountAmount,
    finalPayable,
    savingsText: `Saved ₹${discountAmount.toLocaleString('en-IN')}`
  };
};

export const CouponsModule = () => {
  const { 
    coupons, 
    categories, 
    settings, 
    addCoupon, 
    updateCoupon, 
    deleteCoupon, 
    toggleCouponActive 
  } = useAdmin();

  const currency = settings.currencySymbol || '₹';

  // Modal and deletion states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'expired'
  const [copiedId, setCopiedId] = useState(null);

  // Form State
  const initialForm = {
    code: '',
    discountType: 'percentage', // 'percentage' | 'fixed'
    discountValue: '',
    maxDiscount: '',
    minSpend: '',
    categoryRestriction: 'All',
    expiryDate: '',
    usageLimit: 100, // Total storewide usage limit
    perUserLimit: 1, // Enforced: 1 user for 1 time only
    oneTimePerUser: true,
    active: true
  };

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});

  // Dynamic helpers for easy-to-understand coupon validity & expiry
  const getDefaultExpiryDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const toInputDate = (dateVal) => {
    if (!dateVal) return getDefaultExpiryDate();
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return getDefaultExpiryDate();
      return d.toISOString().split('T')[0];
    } catch {
      return getDefaultExpiryDate();
    }
  };

  // Dynamic helper: check expiry status against current local date
  const getExpiryInfo = (expiryDate) => {
    if (!expiryDate) {
      return { 
        isExpired: false, 
        label: 'Lifetime Validity', 
        daysLeft: null, 
        formattedDate: 'No Expiry' 
      };
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    if (isNaN(exp.getTime())) {
      return { 
        isExpired: false, 
        label: 'Active', 
        daysLeft: null, 
        formattedDate: String(expiryDate) 
      };
    }
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.round((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const formattedDate = exp.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    if (diffDays < 0) {
      const daysAgo = Math.abs(diffDays);
      return {
        isExpired: true,
        label: `Expired (${daysAgo === 1 ? 'yesterday' : `${daysAgo}d ago`})`,
        daysLeft: diffDays,
        formattedDate
      };
    }
    if (diffDays === 0) return { isExpired: false, label: 'Expires Today', daysLeft: 0, formattedDate };
    if (diffDays === 1) return { isExpired: false, label: 'Expires Tomorrow', daysLeft: 1, formattedDate };
    return { isExpired: false, label: `${diffDays} days left`, daysLeft: diffDays, formattedDate };
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setFormData({
      ...initialForm,
      expiryDate: getDefaultExpiryDate()
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue?.toString() || '',
      maxDiscount: coupon.maxDiscount ? coupon.maxDiscount.toString() : '',
      minSpend: coupon.minSpend ? coupon.minSpend.toString() : '',
      categoryRestriction: coupon.categoryRestriction || 'All',
      expiryDate: toInputDate(coupon.expiryDate),
      usageLimit: coupon.usageLimit || 100,
      perUserLimit: 1,
      oneTimePerUser: true,
      active: coupon.active !== undefined ? coupon.active : true
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // Copy code handler
  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Dynamic Form Validation
  const validateForm = () => {
    const errs = {};
    const trimmedCode = formData.code.trim().toUpperCase();

    if (!trimmedCode || trimmedCode.length < 3) {
      errs.code = 'Coupon code must be at least 3 characters.';
    } else if (
      coupons.some((c) => c.code === trimmedCode && (!editingCoupon || c.id !== editingCoupon.id))
    ) {
      errs.code = 'A coupon with this promo code already exists.';
    }

    const val = parseFloat(formData.discountValue);
    if (isNaN(val) || val <= 0) {
      errs.discountValue = 'Please enter a valid discount amount greater than 0.';
    } else if (formData.discountType === 'percentage' && val > 100) {
      errs.discountValue = 'Percentage discount cannot exceed 100%.';
    }

    if (!formData.expiryDate) {
      errs.expiryDate = 'Please select an expiry date.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Form Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      code: formData.code.trim().toUpperCase(),
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue) || 0,
      maxDiscount: formData.discountType === 'percentage' && formData.maxDiscount ? parseFloat(formData.maxDiscount) : 0,
      minSpend: parseFloat(formData.minSpend) || 0,
      categoryRestriction: formData.categoryRestriction || 'All',
      expiryDate: formData.expiryDate,
      usageLimit: parseInt(formData.usageLimit, 10) || 100,
      perUserLimit: 1, // Strictly 1 use per user only
      oneTimePerUser: true,
      active: formData.active
    };

    if (editingCoupon) {
      updateCoupon(editingCoupon.id, payload);
    } else {
      addCoupon(payload);
    }
    setIsModalOpen(false);
  };


  // Filtered Coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const matchSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase());
      const expInfo = getExpiryInfo(c.expiryDate);

      if (statusFilter === 'active') {
        return matchSearch && c.active && !expInfo.isExpired;
      }
      if (statusFilter === 'expired') {
        return matchSearch && expInfo.isExpired;
      }
      return matchSearch;
    });
  }, [coupons, searchTerm, statusFilter]);

  // Pagination (fixed 7 items per page, scrollable)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCoupons = useMemo(() => {
    return filteredCoupons.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCoupons, startIndex, itemsPerPage]);

  // Statistics
  const stats = useMemo(() => {
    let activeCount = 0;
    let expiredCount = 0;
    let totalRedemptions = 0;

    coupons.forEach((c) => {
      const exp = getExpiryInfo(c.expiryDate);
      if (exp.isExpired) expiredCount++;
      else if (c.active) activeCount++;
      totalRedemptions += Number(c.usageCount) || 0;
    });

    return { total: coupons.length, active: activeCount, expired: expiredCount, redemptions: totalRedemptions };
  }, [coupons]);

  // Today's date string for input min attribute
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal tracking-tight">Coupons & Special Offers</h1>
          <p className="text-sm text-soft-gray mt-1">
            Create percentage or flat discount vouchers with expiry and dynamic usage restrictions.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-surface font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Promo Coupon
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card">
          <p className="text-xs font-semibold text-soft-gray uppercase tracking-wider">Total Coupons</p>
          <p className="text-2xl font-bold text-charcoal mt-1">{stats.total}</p>
        </div>
        <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card">
          <p className="text-xs font-semibold text-success uppercase tracking-wider">Active Offers</p>
          <p className="text-2xl font-bold text-success mt-1">{stats.active}</p>
        </div>
        <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card">
          <p className="text-xs font-semibold text-error uppercase tracking-wider">Expired</p>
          <p className="text-2xl font-bold text-error mt-1">{stats.expired}</p>
        </div>
        <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card">
          <p className="text-xs font-semibold text-accent uppercase tracking-wider">Total Redeemed</p>
          <p className="text-2xl font-bold text-charcoal mt-1">{stats.redemptions}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-soft-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search coupon code..."
            className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-soft-gray/25 text-charcoal bg-surface focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 self-stretch sm:self-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'expired', label: 'Expired' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                statusFilter === tab.id
                  ? 'bg-primary text-surface shadow-sm'
                  : 'text-soft-gray hover:text-charcoal hover:bg-warm-ivory'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Coupons Table */}
      <div className="bg-surface rounded-2xl border border-soft-gray/20 shadow-card overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[460px] no-scrollbar">
          <table className="w-full text-left text-sm text-charcoal relative border-collapse">
            <thead className="sticky top-0 z-20 bg-warm-ivory text-xs uppercase font-semibold text-soft-gray border-b border-soft-gray/15 shadow-xs">
              <tr>
                <th className="px-6 py-3.5 bg-warm-ivory">Promo Code</th>
                <th className="px-6 py-3.5 bg-warm-ivory">Discount Offer</th>
                <th className="px-6 py-3.5 bg-warm-ivory">Usage Restrictions</th>
                <th className="px-6 py-3.5 bg-warm-ivory">Validity / Expiry</th>
                <th className="px-6 py-3.5 bg-warm-ivory">Redemptions</th>
                <th className="px-6 py-3.5 bg-warm-ivory">Status</th>
                <th className="px-6 py-3.5 text-right bg-warm-ivory">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft-gray/10">
              {paginatedCoupons.map((coupon) => {
                const expInfo = getExpiryInfo(coupon.expiryDate);
                const isMaxedOut = coupon.usageLimit > 0 && (coupon.usageCount || 0) >= coupon.usageLimit;

                return (
                  <tr key={coupon.id} className="hover:bg-warm-ivory/40 transition-colors">
                    {/* Code & Copy */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-lg bg-secondary/20 text-primary font-mono font-bold tracking-wider text-xs border border-secondary/40">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(coupon.code, coupon.id)}
                          className="p-1 rounded text-soft-gray hover:text-primary transition-colors"
                          title="Copy Code"
                        >
                          {copiedId === coupon.id ? (
                            <Check className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Discount */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-charcoal">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}% OFF`
                          : `${currency}${coupon.discountValue} FLAT OFF`}
                      </div>
                      {coupon.discountType === 'percentage' && coupon.maxDiscount > 0 && (
                        <p className="text-[11px] text-soft-gray mt-0.5">
                          Up to {currency}{coupon.maxDiscount}
                        </p>
                      )}
                    </td>

                    {/* Restrictions */}
                    <td className="px-6 py-4 text-xs space-y-1">
                      <div>
                        <span className="text-soft-gray">Min Spend: </span>
                        <span className="font-medium text-charcoal">
                          {coupon.minSpend > 0 ? `${currency}${coupon.minSpend}` : 'None'}
                        </span>
                      </div>
                      {coupon.categoryRestriction && coupon.categoryRestriction !== 'All' && (
                        <div>
                          <span className="text-soft-gray">Category: </span>
                          <span className="font-medium text-primary">
                            {coupon.categoryRestriction}
                          </span>
                        </div>
                      )}
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                          <UserCheck className="w-3 h-3 text-primary shrink-0" />
                          1 use per user only
                        </span>
                      </div>
                    </td>

                    {/* Validity / Expiry - Plain Date Only */}
                    <td className="px-6 py-4 text-xs font-semibold text-charcoal whitespace-nowrap">
                      {expInfo.formattedDate}
                    </td>

                    {/* Usage Progress */}
                    <td className="px-6 py-4 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-charcoal">
                        <span>{coupon.usageCount || 0}</span>
                        <span className="text-soft-gray font-normal">/ {coupon.usageLimit} total</span>
                      </div>
                      <div className="w-24 bg-soft-gray/15 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isMaxedOut ? 'bg-error' : 'bg-primary'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              ((coupon.usageCount || 0) / (coupon.usageLimit || 1)) * 100
                            )}%`
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-soft-gray mt-1">Single-use per customer</p>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {expInfo.isExpired ? (
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-error/10 text-error border border-error/20">
                          Expired
                        </span>
                      ) : isMaxedOut ? (
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-soft-gray/15 text-soft-gray border border-soft-gray/30">
                          Limit Reached
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleCouponActive(coupon.id)}
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors ${
                            coupon.active
                              ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                              : 'bg-soft-gray/10 text-soft-gray border-soft-gray/20 hover:bg-soft-gray/20'
                          }`}
                          title="Click to toggle status"
                        >
                          {coupon.active ? 'Active' : 'Inactive'}
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(coupon)}
                          className="p-1.5 rounded-lg text-soft-gray hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit Coupon"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(coupon.id)}
                          className="p-1.5 rounded-lg text-soft-gray hover:text-error hover:bg-error/10 transition-colors"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCoupons.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-sm text-soft-gray">
                    <Tag className="w-8 h-8 text-soft-gray/40 mx-auto mb-2" />
                    <p className="font-semibold text-charcoal">No promo coupons found</p>
                    <p className="text-xs text-soft-gray mt-1">
                      {coupons.length === 0
                        ? "Click 'Create Promo Coupon' above to create your first discount offer."
                        : 'No coupons matched your search criteria.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls (7 coupons per page) */}
        {filteredCoupons.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3.5 border-t border-soft-gray/15 bg-warm-ivory/30 gap-3">
            <div className="text-xs text-soft-gray font-medium">
              Showing <span className="font-semibold text-charcoal">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-charcoal">
                {Math.min(startIndex + itemsPerPage, filteredCoupons.length)}
              </span>{' '}
              of <span className="font-semibold text-charcoal">{filteredCoupons.length}</span> coupons
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-soft-gray/25 text-charcoal hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                      currentPage === pageNum
                        ? 'bg-primary text-surface shadow-xs'
                        : 'text-charcoal hover:bg-warm-ivory/80 border border-soft-gray/20'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-soft-gray/25 text-charcoal hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? 'Edit Promo Coupon' : 'Create New Promo Coupon'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Coupon Code */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
              Coupon Code
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. FESTIVE20, BIRTHDAY100"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono text-charcoal uppercase bg-surface focus:ring-1 focus:ring-primary ${
                errors.code ? 'border-error ring-1 ring-error' : 'border-soft-gray/25'
              }`}
            />
            {errors.code && <p className="text-xs text-error mt-1">{errors.code}</p>}
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Discount Type
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-soft-gray/25 bg-surface text-charcoal focus:ring-1 focus:ring-primary"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Flat ({currency})</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                {formData.discountType === 'percentage' ? 'Percentage Off (%)' : `Discount Amount (${currency})`}
              </label>
              <input
                type="number"
                min="1"
                max={formData.discountType === 'percentage' ? 100 : undefined}
                step="any"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                placeholder={formData.discountType === 'percentage' ? '20' : '200'}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border text-charcoal bg-surface focus:ring-1 focus:ring-primary ${
                  errors.discountValue ? 'border-error ring-1 ring-error' : 'border-soft-gray/25'
                }`}
              />
              {errors.discountValue && (
                <p className="text-xs text-error mt-1">{errors.discountValue}</p>
              )}
            </div>
          </div>

          {/* Max Discount Cap for percentage */}
          {formData.discountType === 'percentage' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Max Discount Cap ({currency}) <span className="text-soft-gray font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                placeholder="e.g. 500 (Leave empty for no upper cap)"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-soft-gray/25 bg-surface text-charcoal focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] text-soft-gray mt-1">
                Limits the maximum discount amount an order can receive.
              </p>
            </div>
          )}

          {/* Usage Restrictions: Min spend and storewide usage limit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Min Order Spend ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={formData.minSpend}
                onChange={(e) => setFormData({ ...formData, minSpend: e.target.value })}
                placeholder="e.g. 999 (0 for none)"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-soft-gray/25 bg-surface text-charcoal focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Max Redemption Limit
              </label>
              <input
                type="number"
                min="1"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                placeholder="e.g. 100"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-soft-gray/25 bg-surface text-charcoal focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Category restriction */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
              Applicable Category Restriction
            </label>
            <select
              value={formData.categoryRestriction}
              onChange={(e) => setFormData({ ...formData, categoryRestriction: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-soft-gray/25 bg-surface text-charcoal focus:ring-1 focus:ring-primary"
            >
              <option value="All">All Categories (Storewide)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  Only for {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Validity / Expiry Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal">
                Validity / Expiry Date
              </label>
              <span className="text-[11px] text-soft-gray font-medium">
                {formData.expiryDate ? getExpiryInfo(formData.expiryDate).formattedDate : 'Select date'}
              </span>
            </div>
            <input
              type="date"
              min={todayStr}
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border text-charcoal bg-surface focus:ring-1 focus:ring-primary ${
                errors.expiryDate ? 'border-error ring-1 ring-error' : 'border-soft-gray/25'
              }`}
            />
            {errors.expiryDate ? (
              <p className="text-xs text-error mt-1">{errors.expiryDate}</p>
            ) : formData.expiryDate ? (
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                ✓ Valid until {getExpiryInfo(formData.expiryDate).formattedDate} ({getExpiryInfo(formData.expiryDate).label})
              </p>
            ) : (
              <p className="text-[11px] text-soft-gray mt-1">
                Select the expiry date for this coupon.
              </p>
            )}
          </div>

          {/* Active Switch */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="activeCouponSwitch"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-soft-gray/30"
            />
            <label htmlFor="activeCouponSwitch" className="text-xs font-semibold text-charcoal cursor-pointer">
              Active
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 pb-2 mt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-soft-gray/25 text-sm font-medium text-charcoal hover:border-primary hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary text-surface text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
            >
              {editingCoupon ? 'Save Changes' : 'Generate Coupon'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteCoupon(deleteId)}
        title="Delete Promo Coupon"
        message="Are you sure you want to deactivate and remove this coupon code?"
      />
    </div>
  );
};
