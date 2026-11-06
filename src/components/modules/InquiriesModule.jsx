import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const InquiriesModule = () => {
  const { inquiries = [], updateInquiryStatus, deleteInquiry } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryToDelete, setInquiryToDelete] = useState(null);

  const handleOpenDetail = (inquiry) => {
    setSelectedInquiry(inquiry);
    if (inquiry.status === 'Unread') {
      updateInquiryStatus(inquiry.id || inquiry._id, 'Read');
      setSelectedInquiry({ ...inquiry, status: 'Read' });
    }
  };

  const handleStatusChange = (newStatus) => {
    if (!selectedInquiry) return;
    const targetId = selectedInquiry.id || selectedInquiry._id;
    updateInquiryStatus(targetId, newStatus);
    setSelectedInquiry({ ...selectedInquiry, status: newStatus });
  };

  const handleDelete = (inquiryId) => {
    setInquiryToDelete(inquiryId);
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (inq.fullName || '').toLowerCase().includes(term) ||
      (inq.email || '').toLowerCase().includes(term) ||
      (inq.phone || '').toLowerCase().includes(term) ||
      (inq.subject || '').toLowerCase().includes(term) ||
      (inq.message || '').toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'ALL' || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusList = ['ALL', 'Unread', 'Read', 'Replied'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-charcoal tracking-tight">Customer Inquiries & Messages</h1>
        <p className="text-sm text-soft-gray mt-1">
          Review customer inquiries, custom order consultations, and contact submissions from the storefront.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-soft-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search inquiries by customer name, email, phone, or keyword..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-soft-gray/25 bg-warm-ivory/40 text-charcoal placeholder-soft-gray focus:border-primary focus:bg-surface focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {statusList.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-primary text-surface shadow-sm'
                  : 'bg-warm-ivory/60 text-soft-gray hover:text-charcoal hover:bg-warm-ivory'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-surface rounded-2xl border border-soft-gray/20 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-charcoal">
            <thead className="bg-warm-ivory/60 text-xs uppercase font-semibold text-soft-gray border-b border-soft-gray/15">
              <tr>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Subject & Message</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft-gray/10">
              {filteredInquiries.map((inquiry) => (
                <tr key={inquiry.id || inquiry._id} className="hover:bg-warm-ivory/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-charcoal flex items-center gap-1.5">
                      {inquiry.fullName}
                      {inquiry.status === 'Unread' && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />
                      )}
                    </div>
                    <div className="text-xs text-soft-gray">{inquiry.email}</div>
                    {inquiry.phone && (
                      <div className="text-[11px] text-soft-gray flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-primary" />
                        <span>{inquiry.phone}</span>
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 max-w-sm">
                    <div className="font-semibold text-charcoal text-xs">{inquiry.subject || 'General Inquiry'}</div>
                    <div className="text-xs text-soft-gray line-clamp-1 mt-0.5">
                      {inquiry.message}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-xs text-soft-gray whitespace-nowrap">
                    {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : 'Recent'}
                  </td>

                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        inquiry.status === 'Replied'
                          ? 'success'
                          : inquiry.status === 'Read'
                          ? 'accent'
                          : 'primary'
                      }
                    >
                      {inquiry.status}
                    </Badge>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenDetail(inquiry)}
                        className="p-2 rounded-xl text-soft-gray hover:text-primary hover:bg-warm-ivory transition-colors cursor-pointer"
                        title="View Full Message"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <a
                        href={`mailto:${inquiry.email}?subject=Regarding your RS Gifts Inquiry: ${encodeURIComponent(inquiry.subject || '')}`}
                        className="p-2 rounded-xl text-soft-gray hover:text-primary hover:bg-warm-ivory transition-colors cursor-pointer"
                        title="Reply via Email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>

                      {inquiry.phone && (
                        <a
                          href={`https://wa.me/${inquiry.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(inquiry.fullName)},%20thank%20you%20for%20reaching%20out%20to%20RS%20Gifts!`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl text-soft-gray hover:text-emerald-600 hover:bg-warm-ivory transition-colors cursor-pointer"
                          title="Chat on WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        onClick={() => handleDelete(inquiry.id || inquiry._id)}
                        className="p-2 rounded-xl text-soft-gray hover:text-error hover:bg-warm-ivory transition-colors cursor-pointer"
                        title="Delete Inquiry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredInquiries.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-sm text-soft-gray">
                    {inquiries.length === 0
                      ? 'No customer inquiries received yet. Inquiries submitted via the Contact Us page will appear here.'
                      : 'No inquiries match the current search or status filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <Modal
          isOpen={!!selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          title={`Inquiry from ${selectedInquiry.fullName}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-5">
            {/* Customer Contact Card */}
            <div className="p-4 rounded-2xl border border-soft-gray/20 bg-warm-ivory/50 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-charcoal">{selectedInquiry.fullName}</h3>
                  <p className="text-xs text-soft-gray">{selectedInquiry.email}</p>
                  {selectedInquiry.phone && (
                    <p className="text-xs text-primary font-medium mt-0.5">Phone: {selectedInquiry.phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      selectedInquiry.status === 'Replied'
                        ? 'success'
                        : selectedInquiry.status === 'Read'
                        ? 'accent'
                        : 'primary'
                    }
                  >
                    {selectedInquiry.status}
                  </Badge>
                  <p className="text-[11px] text-soft-gray mt-1">
                    {selectedInquiry.createdAt ? new Date(selectedInquiry.createdAt).toLocaleString() : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Subject & Message Content */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal">
                Subject: {selectedInquiry.subject || 'General Inquiry'}
              </span>
              <div className="p-4 rounded-2xl border border-soft-gray/20 bg-surface text-charcoal text-xs leading-relaxed whitespace-pre-wrap">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <a
                href={`mailto:${selectedInquiry.email}?subject=Regarding your RS Gifts Inquiry: ${encodeURIComponent(selectedInquiry.subject || '')}`}
                onClick={() => handleStatusChange('Replied')}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-surface text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Reply Email</span>
              </a>

              {selectedInquiry.phone && (
                <a
                  href={`https://wa.me/${selectedInquiry.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(selectedInquiry.fullName)},%20thank%20you%20for%20reaching%20out%20to%20RS%20Gifts!`}
                  onClick={() => handleStatusChange('Replied')}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-surface text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Inquiry Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!inquiryToDelete}
        onClose={() => setInquiryToDelete(null)}
        onConfirm={() => {
          if (inquiryToDelete) {
            deleteInquiry(inquiryToDelete);
            if (selectedInquiry && (selectedInquiry.id === inquiryToDelete || selectedInquiry._id === inquiryToDelete)) {
              setSelectedInquiry(null);
            }
            setInquiryToDelete(null);
          }
        }}
        title="Delete Inquiry"
        message="Are you sure you want to delete this customer inquiry? This cannot be undone."
        confirmText="Delete Inquiry"
      />
    </div>
  );
};
export default InquiriesModule;
