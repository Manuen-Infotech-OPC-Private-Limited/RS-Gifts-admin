import React, { useState } from 'react';
import { Star, CheckCircle, EyeOff, Trash2, Search, Plus, X, Pencil, AlertCircle } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';

export const ReviewsModule = () => {
  const { reviews, products, addReview, updateReview, approveReview, hideReview, deleteReview } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteId, setDeleteId] = useState(null);

  // Add Review Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newReviewForm, setNewReviewForm] = useState({
    productId: '',
    productTitle: '',
    customerName: '',
    rating: 5,
    comment: '',
    status: 'approved',
  });

  // Edit Review Modal state
  const [editingReview, setEditingReview] = useState(null);

  const handleProductSelect = (prodId) => {
    const selected = products.find((p) => p.id === prodId || p._id === prodId);
    setNewReviewForm((prev) => ({
      ...prev,
      productId: prodId,
      productTitle: selected ? (selected.name || selected.title) : '',
    }));
  };

  const handleCreateReview = (e) => {
    e.preventDefault();
    const trimmedName = (newReviewForm.customerName || '').trim();
    if (!newReviewForm.productId || !trimmedName || !newReviewForm.comment.trim()) {
      alert('Please fill in product, customer name, and comment.');
      return;
    }

    if (/^\s*rs\s*gifts?\s*$/i.test(trimmedName)) {
      alert('Please enter the customer\'s name (e.g. Pooja Verma, Rahul Sharma), not "RS Gifts".');
      return;
    }

    addReview({
      productId: newReviewForm.productId,
      productTitle: newReviewForm.productTitle,
      customerName: trimmedName,
      rating: Number(newReviewForm.rating),
      comment: newReviewForm.comment.trim(),
      status: newReviewForm.status,
    });

    setIsAddModalOpen(false);
    setNewReviewForm({
      productId: '',
      productTitle: '',
      customerName: '',
      rating: 5,
      comment: '',
      status: 'approved',
    });
  };

  const handleUpdateReview = (e) => {
    e.preventDefault();
    if (!editingReview) return;
    const trimmedName = (editingReview.customerName || '').trim();
    if (!trimmedName || /^\s*rs\s*gifts?\s*$/i.test(trimmedName)) {
      alert('Please enter a valid customer name (e.g. Pooja Verma, Rahul Sharma), not "RS Gifts".');
      return;
    }
    if (!editingReview.comment?.trim()) {
      alert('Review comment is required.');
      return;
    }

    updateReview(editingReview.id || editingReview._id, {
      customerName: trimmedName,
      rating: Number(editingReview.rating) || 5,
      comment: editingReview.comment.trim(),
      status: editingReview.status || 'approved',
    });

    setEditingReview(null);
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      (r.productTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.comment || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal tracking-tight">Customer Reviews & Ratings</h1>
          <p className="text-sm text-soft-gray mt-1">
            Reviews only appear on the customer website when set or approved by admin.
          </p>
        </div>

        <button
          onClick={() => {
            const firstProd = products[0];
            setNewReviewForm({
              productId: firstProd ? (firstProd.id || firstProd._id) : '',
              productTitle: firstProd ? (firstProd.name || firstProd.title) : '',
              customerName: '',
              rating: 5,
              comment: '',
              status: 'approved',
            });
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-surface text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Review</span>
        </button>
      </div>

      <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-soft-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name, reviewer, or review text..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-soft-gray/25 bg-warm-ivory/40 text-charcoal placeholder-soft-gray focus:border-primary focus:bg-surface focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'approved', 'hidden'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === status
                  ? 'bg-primary text-surface shadow-sm'
                  : 'bg-warm-ivory/60 text-soft-gray hover:text-charcoal'
              }`}
            >
              {status === 'ALL' ? 'All Reviews' : status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className="bg-surface p-5 rounded-2xl border border-soft-gray/20 shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-soft-gray/10">
                <div>
                  <h4 className="font-semibold text-sm text-charcoal">{review.productTitle}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-0.5 text-accent">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.rating ? 'fill-accent' : 'text-soft-gray/30'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-soft-gray">• {review.date}</span>
                  </div>
                </div>

                <Badge variant={review.status === 'approved' ? 'success' : 'charcoal'}>
                  {review.status === 'approved' ? 'Approved' : 'Hidden'}
                </Badge>
              </div>

              <p className="text-xs text-charcoal leading-relaxed my-4 italic">
                "{review.comment}"
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-soft-gray/10">
              <div>
                <span className="text-xs font-bold text-charcoal">{review.customerName}</span>
                {/^\s*rs\s*gifts?\s*$/i.test(review.customerName) && (
                  <div className="text-[10px] text-amber-700 font-medium flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    <span>Store name detected. Click Edit to set customer name</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingReview({ ...review })}
                  className="p-1.5 rounded-xl text-soft-gray hover:text-charcoal hover:bg-warm-ivory transition-colors cursor-pointer"
                  title="Edit Customer Name or Review"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                {review.status !== 'approved' ? (
                  <button
                    onClick={() => approveReview(review.id || review._id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-surface bg-primary hover:bg-primary/90 shadow-sm transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                ) : (
                  <button
                    onClick={() => hideReview(review.id || review._id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-charcoal bg-warm-ivory hover:bg-primary/10 hover:text-primary border border-soft-gray/25 transition-colors cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    Hide
                  </button>
                )}

                <button
                  onClick={() => setDeleteId(review.id || review._id)}
                  className="p-1.5 rounded-xl text-soft-gray hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  title="Delete Review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredReviews.length === 0 && (
          <div className="col-span-2 text-center py-12 text-sm text-soft-gray bg-surface rounded-2xl border border-soft-gray/20">
            {reviews.length === 0
              ? 'No customer reviews submitted yet. Customer feedback will appear here for moderation.'
              : 'No customer reviews found matching your search.'}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteReview(deleteId)}
        title="Delete Customer Review"
        message="Are you sure you want to permanently delete this customer feedback?"
      />

      {/* Add Review Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl border border-soft-gray/20 shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-soft-gray/15 bg-warm-ivory/40">
              <div>
                <h3 className="text-base font-bold text-charcoal">Add Customer Review</h3>
                <p className="text-xs text-soft-gray mt-0.5">
                  Set verified reviews that will appear on the customer-facing product page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-soft-gray hover:text-charcoal hover:bg-surface transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="p-5 space-y-4">
              {/* Product Select */}
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Select Product <span className="text-primary">*</span>
                </label>
                <select
                  required
                  value={newReviewForm.productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-soft-gray/30 bg-surface text-charcoal focus:border-primary focus:outline-none"
                >
                  <option value="" disabled>-- Select a gift product --</option>
                  {products.map((p) => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.name || p.title} ({p.sku || 'No SKU'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reviewer Name */}
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Customer Name <span className="text-primary">*</span>
                  <span className="text-[11px] font-normal text-soft-gray ml-1.5">(Enter recipient or customer name, e.g. Pooja Verma. Do not enter RS Gifts)</span>
                </label>
                <input
                  type="text"
                  required
                  value={newReviewForm.customerName}
                  onChange={(e) => setNewReviewForm((prev) => ({ ...prev, customerName: e.target.value }))}
                  placeholder="e.g. Pooja Verma, Rahul Sharma"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-soft-gray/30 bg-surface text-charcoal focus:border-primary focus:outline-none"
                />
              </div>

              {/* Star Rating Select */}
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Rating <span className="text-primary">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewForm((prev) => ({ ...prev, rating: star }))}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= newReviewForm.rating ? 'fill-accent text-accent' : 'text-soft-gray/30'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-primary ml-2">
                    {newReviewForm.rating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Review Text / Feedback <span className="text-primary">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={newReviewForm.comment}
                  onChange={(e) => setNewReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                  placeholder="e.g. Beautiful presentation, the luxury gift box arrived in perfect condition!"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-soft-gray/30 bg-surface text-charcoal focus:border-primary focus:outline-none resize-none"
                />
              </div>

              {/* Status Radio / Select */}
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Website Display Status
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-charcoal cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="approved"
                      checked={newReviewForm.status === 'approved'}
                      onChange={() => setNewReviewForm((prev) => ({ ...prev, status: 'approved' }))}
                      className="accent-primary"
                    />
                    <span>Approved (Show on Website)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-charcoal cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="hidden"
                      checked={newReviewForm.status === 'hidden'}
                      onChange={() => setNewReviewForm((prev) => ({ ...prev, status: 'hidden' }))}
                      className="accent-primary"
                    />
                    <span>Hidden (Draft / Off-site)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-soft-gray/15">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-soft-gray/30 text-xs font-semibold text-soft-gray hover:text-charcoal hover:bg-warm-ivory transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-surface text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                >
                  Save & Publish Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl border border-soft-gray/20 shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-soft-gray/15 bg-warm-ivory/40">
              <div>
                <h3 className="text-base font-bold text-charcoal">Edit Customer Review</h3>
                <p className="text-xs text-soft-gray mt-0.5">
                  Update customer name, star rating, comment, or display visibility.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-soft-gray hover:text-charcoal hover:bg-surface transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateReview} className="p-5 space-y-4">
              {/* Product Info Display */}
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Product</label>
                <p className="text-xs text-charcoal font-semibold px-3 py-2 bg-warm-ivory/50 rounded-xl border border-soft-gray/20">
                  {editingReview.productTitle || 'Selected Gift Item'}
                </p>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Customer Name <span className="text-primary">*</span>
                  <span className="text-[11px] font-normal text-soft-gray ml-1.5">
                    (Customer's name, e.g. Pooja Verma — do not enter RS Gifts)
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={editingReview.customerName}
                  onChange={(e) => setEditingReview((prev) => ({ ...prev, customerName: e.target.value }))}
                  placeholder="e.g. Pooja Verma, Rahul Sharma"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-soft-gray/30 bg-surface text-charcoal focus:border-primary focus:outline-none"
                />
              </div>

              {/* Star Rating Select */}
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Rating <span className="text-primary">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditingReview((prev) => ({ ...prev, rating: star }))}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= editingReview.rating ? 'fill-accent text-accent' : 'text-soft-gray/30'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-primary ml-2">
                    {editingReview.rating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Review Text <span className="text-primary">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={editingReview.comment}
                  onChange={(e) => setEditingReview((prev) => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-soft-gray/30 bg-surface text-charcoal focus:border-primary focus:outline-none resize-none"
                />
              </div>

              {/* Status Radio */}
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Website Display Status
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-charcoal cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      value="approved"
                      checked={editingReview.status === 'approved'}
                      onChange={() => setEditingReview((prev) => ({ ...prev, status: 'approved' }))}
                      className="accent-primary"
                    />
                    <span>Approved (Show on Website)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-charcoal cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      value="hidden"
                      checked={editingReview.status === 'hidden'}
                      onChange={() => setEditingReview((prev) => ({ ...prev, status: 'hidden' }))}
                      className="accent-primary"
                    />
                    <span>Hidden (Draft / Off-site)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-soft-gray/15">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 rounded-xl border border-soft-gray/30 text-xs font-semibold text-soft-gray hover:text-charcoal hover:bg-warm-ivory transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-surface text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
