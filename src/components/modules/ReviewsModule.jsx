import React, { useState } from 'react';
import { Star, CheckCircle, EyeOff, Eye, Trash2, Search, MessageSquare, AlertCircle, Check, Package } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';

export const ReviewsModule = () => {
  const { reviews, approveReview, hideReview, deleteReview, products = [] } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteId, setDeleteId] = useState(null);

  // Reply modal / inline state
  const [replyReview, setReplyReview] = useState(null);
  const [replyText, setReplyText] = useState('');

  const filteredReviews = reviews.filter((r) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (r.productTitle || '').toLowerCase().includes(searchLower) ||
      (r.customerName || '').toLowerCase().includes(searchLower) ||
      (r.comment || '').toLowerCase().includes(searchLower);
    
    const isApproved = r.status === 'approved' || r.isApproved === true;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'approved' && isApproved) ||
      (statusFilter === 'hidden' && !isApproved);

    return matchesSearch && matchesStatus;
  });

  const totalCount = reviews.length;
  const visibleCount = reviews.filter((r) => r.status === 'approved' || r.isApproved === true).length;
  const hiddenCount = totalCount - visibleCount;
  const avgRating = totalCount > 0
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / totalCount).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal tracking-tight">Customer Reviews</h1>
          <p className="text-sm text-soft-gray mt-1">
            Real customer reviews submitted on your storefront. By default, customer reviews are visible on the website.
          </p>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-xs">
          <span className="text-xs font-semibold text-soft-gray uppercase tracking-wider block">Total Reviews</span>
          <span className="text-2xl font-bold text-charcoal mt-1 block">{totalCount}</span>
        </div>
        <div className="bg-surface p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Visible on Website</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{visibleCount}</span>
        </div>
        <div className="bg-surface p-4 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-xs">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">Hidden</span>
          <span className="text-2xl font-bold text-amber-700 mt-1 block">{hiddenCount}</span>
        </div>
        <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-xs">
          <span className="text-xs font-semibold text-soft-gray uppercase tracking-wider block">Average Rating</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-2xl font-bold text-charcoal">{avgRating}</span>
            <Star className="w-5 h-5 fill-accent text-accent" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-soft-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, product, or review text..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-soft-gray/25 bg-warm-ivory/40 text-charcoal placeholder-soft-gray focus:border-primary focus:bg-surface focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {[
            { id: 'ALL', label: `All (${totalCount})` },
            { id: 'approved', label: `Visible (${visibleCount})` },
            { id: 'hidden', label: `Hidden (${hiddenCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-primary text-surface shadow-sm'
                  : 'bg-warm-ivory/60 text-soft-gray hover:text-charcoal'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredReviews.map((review) => {
          const isVisible = review.status === 'approved' || review.isApproved === true;
          const reviewId = review.id || review._id;
          const matchedProduct = (products || []).find((p) => {
            const pid = review.productId || review.product?._id || review.product?.id || review.product;
            if (pid && (p.id === pid || p._id === pid)) return true;
            if (review.productTitle && p.title && p.title.trim().toLowerCase() === review.productTitle.trim().toLowerCase()) return true;
            return false;
          });
          const productImage = review.productImage || review.product?.image || matchedProduct?.image || matchedProduct?.gallery?.[0] || '';

          return (
            <div
              key={reviewId}
              className="bg-surface p-5 rounded-2xl border border-soft-gray/20 shadow-card flex flex-col justify-between transition-all hover:border-soft-gray/40"
            >
              <div>
                {/* Card Header: Product Title, Rating & Product Image */}
                <div className="flex items-start justify-between gap-4 pb-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold uppercase text-primary tracking-wider block">
                      Product
                    </span>
                    <h4 className="font-semibold text-sm text-charcoal truncate mt-0.5" title={review.productTitle}>
                      {review.productTitle || 'Store Gift Item'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5 text-accent">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < (Number(review.rating) || 5) ? 'fill-accent text-accent' : 'text-soft-gray/30'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-soft-gray">• {review.date || 'Recent'}</span>
                    </div>

                    {!isVisible && (
                      <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
                        Hidden from Website
                      </span>
                    )}
                  </div>

                  {/* Product Image Thumbnail in Top Right */}
                  <div className="shrink-0">
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={review.productTitle || 'Product'}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-soft-gray/25 shadow-xs bg-warm-ivory/30"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cdcd?w=200';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-dashed border-soft-gray/30 bg-warm-ivory/20 flex flex-col items-center justify-center text-soft-gray">
                        <Package className="w-6 h-6 text-soft-gray/50" />
                        <span className="text-[9px] mt-0.5 font-medium">No Image</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Body */}
                <p className="text-xs text-charcoal leading-relaxed my-4 italic bg-warm-ivory/30 p-3 rounded-xl border border-soft-gray/15">
                  "{review.comment}"
                </p>

                {/* Admin Reply (if exists) */}
                {review.adminReply && (
                  <div className="mb-4 p-3 rounded-xl bg-warm-ivory/60 border-l-3 border-primary text-xs">
                    <span className="font-bold text-primary block mb-0.5">Your Response:</span>
                    <p className="text-charcoal">{review.adminReply}</p>
                  </div>
                )}
              </div>

              {/* Card Footer: Reviewer Info & Moderate Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div>
                  <div className="text-xs font-bold text-charcoal">
                    {review.customerName || 'Verified Customer'}
                  </div>
                  {review.customerEmail && (
                    <div className="text-[11px] text-soft-gray">{review.customerEmail}</div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Quick Toggle: Hide / Visible */}
                  {isVisible ? (
                    <button
                      onClick={() => hideReview(reviewId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-charcoal bg-warm-ivory hover:bg-neutral-200 hover:text-charcoal border border-soft-gray/25 transition-all cursor-pointer"
                      title="Hide this review from the public website"
                    >
                      <EyeOff className="w-3.5 h-3.5 text-soft-gray" />
                      <span>Hide from Store</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => approveReview(reviewId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary/90 shadow-xs transition-all cursor-pointer"
                      title="Make this review visible on the store"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Make Visible</span>
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => setDeleteId(reviewId)}
                    className="p-1.5 rounded-xl text-soft-gray hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Permanently Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredReviews.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-16 px-4 bg-surface rounded-2xl border border-soft-gray/20 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-warm-ivory flex items-center justify-center mx-auto mb-3 text-soft-gray">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-base font-bold text-charcoal mb-1">
              {reviews.length === 0 ? 'No customer reviews yet' : 'No matching reviews found'}
            </h3>
            <p className="text-xs text-soft-gray max-w-md mx-auto">
              {reviews.length === 0
                ? 'When customers submit reviews on product pages, they will automatically appear here and on the live store.'
                : 'Try clearing your search or status filter to see other customer reviews.'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteReview(deleteId);
            setDeleteId(null);
          }
        }}
        title="Delete Customer Review"
        message="Are you sure you want to permanently remove this customer review? It will be deleted from the database and website."
      />
    </div>
  );
};
