import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Eye,
  MessageCircle
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const InquiriesModule = () => {
  const { inquiries = [], deleteInquiry } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryToDelete, setInquiryToDelete] = useState(null);

  const handleOpenDetail = (inquiry) => {
    setSelectedInquiry(inquiry);
  };

  const handleDelete = (inquiryId) => {
    setInquiryToDelete(inquiryId);
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const term = searchTerm.toLowerCase();
    return (
      (inq.fullName || '').toLowerCase().includes(term) ||
      (inq.email || '').toLowerCase().includes(term) ||
      (inq.phone || '').toLowerCase().includes(term) ||
      (inq.subject || '').toLowerCase().includes(term) ||
      (inq.message || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-charcoal tracking-tight">Customer Enquiries & Messages</h1>
        <p className="text-sm text-soft-gray mt-1">
          Review customer enquiries, custom order consultations, and contact submissions from the storefront.
        </p>
      </div>

      {/* Search Toolbar */}
      <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card flex items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-soft-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search enquiries by customer name, email, phone, or keyword..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-soft-gray/25 bg-warm-ivory/40 text-charcoal placeholder-soft-gray focus:border-primary focus:bg-surface focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-surface rounded-2xl border border-soft-gray/20 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-charcoal">
            <thead className="bg-warm-ivory/60 text-xs uppercase font-semibold text-soft-gray border-b border-soft-gray/15">
              <tr>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Subject & Message</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft-gray/10">
              {filteredInquiries.map((inquiry) => (
                <tr key={inquiry.id || inquiry._id} className="hover:bg-warm-ivory/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-charcoal">{inquiry.fullName}</div>
                    <div className="text-xs text-soft-gray">{inquiry.email}</div>
                    {inquiry.phone && (
                      <div className="text-[11px] text-soft-gray flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-primary" />
                        <span>{inquiry.phone}</span>
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 max-w-sm">
                    <div className="font-semibold text-charcoal text-xs">{inquiry.subject || 'General Enquiry'}</div>
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
                        href={`mailto:${inquiry.email}?subject=Regarding your RS Gifts Enquiry: ${encodeURIComponent(inquiry.subject || '')}`}
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
                        title="Delete Enquiry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredInquiries.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-sm text-soft-gray">
                    {inquiries.length === 0
                      ? 'No customer enquiries received yet. Enquiries submitted via the Contact Us page will appear here.'
                      : 'No enquiries match the current search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enquiry Detail Modal */}
      {selectedInquiry && (
        <Modal
          isOpen={!!selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          title={`Enquiry from ${selectedInquiry.fullName}`}
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
                  <p className="text-xs text-soft-gray">
                    {selectedInquiry.createdAt ? new Date(selectedInquiry.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Subject & Message Content */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal">
                Subject: {selectedInquiry.subject || 'General Enquiry'}
              </span>
              <div className="p-4 rounded-2xl border border-soft-gray/20 bg-surface text-charcoal text-xs leading-relaxed whitespace-pre-wrap">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <a
                href={`mailto:${selectedInquiry.email}?subject=Regarding your RS Gifts Enquiry: ${encodeURIComponent(selectedInquiry.subject || '')}`}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-surface text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Reply Email</span>
              </a>

              {selectedInquiry.phone && (
                <a
                  href={`https://wa.me/${selectedInquiry.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(selectedInquiry.fullName)},%20thank%20you%20for%20reaching%20out%20to%20RS%20Gifts!`}
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

      {/* Delete Enquiry Confirmation Dialog */}
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
        title="Delete Enquiry"
        message="Are you sure you want to delete this customer enquiry? This cannot be undone."
        confirmText="Delete Enquiry"
      />
    </div>
  );
};

export default InquiriesModule;
