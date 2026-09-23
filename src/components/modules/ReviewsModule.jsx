import React, { useState } from 'react';
import { Star, CheckCircle, EyeOff, Trash2, Search } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';

export const ReviewsModule = () => {
  const { reviews, approveReview, hideReview, deleteReview } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteId, setDeleteId] = useState(null);

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-charcoal tracking-tight">Customer Reviews & Ratings</h1>
        <p className="text-sm text-soft-gray mt-1">
          Moderate customer feedback, approve verified gift testimonials, or hide inappropriate submissions.
        </p>
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
              <span className="text-xs font-bold text-charcoal">{review.customerName}</span>

              <div className="flex items-center gap-2">
                {review.status !== 'approved' ? (
                  <button
                    onClick={() => approveReview(review.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-surface bg-primary hover:bg-primary/90 shadow-sm transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                ) : (
                  <button
                    onClick={() => hideReview(review.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-charcoal bg-warm-ivory hover:bg-primary/10 hover:text-primary border border-soft-gray/25 transition-colors"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    Hide
                  </button>
                )}

                <button
                  onClick={() => setDeleteId(review.id)}
                  className="p-1.5 rounded-xl text-soft-gray hover:text-primary hover:bg-primary/10 transition-colors"
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
    </div>
  );
};
