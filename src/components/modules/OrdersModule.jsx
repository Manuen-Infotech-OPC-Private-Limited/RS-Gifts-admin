import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Eye,
  MapPin,
  Mail,
  Gift,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

const formatShippingAddress = (addr) => {
  if (!addr) return 'Standard Delivery Address';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    const parts = [
      addr.addressLine1 || addr.street || addr.address || '',
      addr.addressLine2 || addr.landmark || '',
      addr.city || '',
      addr.state || '',
      addr.postalCode || addr.pincode ? `PIN: ${addr.postalCode || addr.pincode}` : '',
      addr.country || ''
    ].filter(Boolean);
    const addressStr = parts.join(', ');
    const recipientStr = addr.recipientName
      ? `${addr.recipientName}${addr.phone ? ' (' + addr.phone + ')' : ''}`
      : '';
    if (recipientStr && addressStr) return `${recipientStr} — ${addressStr}`;
    return addressStr || recipientStr || 'Standard Delivery Address';
  }
  return String(addr);
};

const getCustomerName = (order) => {
  if (!order) return 'Customer';
  if (typeof order.customerName === 'string' && order.customerName.trim()) return order.customerName;
  if (typeof order.customerInfo === 'object' && order.customerInfo?.name) return order.customerInfo.name;
  if (typeof order.shippingAddress === 'object' && order.shippingAddress?.recipientName) return order.shippingAddress.recipientName;
  return 'Customer';
};

const getCustomerEmail = (order) => {
  if (!order) return '';
  if (typeof order.customerEmail === 'string') return order.customerEmail;
  if (typeof order.customerInfo === 'object' && order.customerInfo?.email) return order.customerInfo.email;
  return '';
};

const getCustomerPhone = (order) => {
  if (!order) return '';
  if (typeof order.customerPhone === 'string') return order.customerPhone;
  if (typeof order.customerInfo === 'object' && order.customerInfo?.phone) return order.customerInfo.phone;
  if (typeof order.shippingAddress === 'object' && order.shippingAddress?.phone) return order.shippingAddress.phone;
  return '';
};

export const OrdersModule = () => {
  const { orders, settings, updateOrderStatus, updatePaymentStatus, deleteOrder } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
  };

  const handleStatusChange = (newStatus) => {
    if (!selectedOrder) return;
    const targetId = selectedOrder._id || selectedOrder.id;
    updateOrderStatus(targetId, newStatus);
    setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
  };

  const handlePaymentStatusChange = (newPaymentStatus) => {
    if (!selectedOrder) return;
    const targetId = selectedOrder._id || selectedOrder.id;
    updatePaymentStatus(targetId, newPaymentStatus);
    setSelectedOrder({ ...selectedOrder, paymentStatus: newPaymentStatus });
  };

  const handleDeleteOrder = (orderId) => {
    setOrderToDelete(orderId);
  };

  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (o.id || o._id || o.orderNumber || '').toLowerCase().includes(term) ||
      (o.customerName || o.customerInfo?.name || '').toLowerCase().includes(term) ||
      (o.customerEmail || o.customerInfo?.email || '').toLowerCase().includes(term) ||
      (o.customerPhone || o.customerInfo?.phone || '').toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusList = ['ALL', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-charcoal tracking-tight">Customer Gift Orders</h1>
        <p className="text-sm text-soft-gray mt-1">
          Review customer orders, inspect custom gift notes and engravings, update fulfillment status and courier tracking.
        </p>
      </div>

      <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-soft-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order ID, customer name or email..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-soft-gray/25 bg-warm-ivory/40 text-charcoal placeholder-soft-gray focus:border-primary focus:bg-surface focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {statusList.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${statusFilter === status
                  ? 'bg-primary text-surface shadow-sm'
                  : 'bg-warm-ivory/60 text-soft-gray hover:text-charcoal hover:bg-warm-ivory'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-soft-gray/20 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-charcoal">
            <thead className="bg-warm-ivory/60 text-xs uppercase font-semibold text-soft-gray border-b border-soft-gray/15">
              <tr>
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Items</th>
                <th className="px-6 py-3.5">Total Amount</th>
                <th className="px-6 py-3.5">Payment</th>
                <th className="px-6 py-3.5">Order Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft-gray/10">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-warm-ivory/40 transition-colors">
                  <td className="px-6 py-4 font-semibold text-charcoal">
                    {order.id}
                    <div className="text-[11px] text-soft-gray font-normal">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-semibold text-charcoal">{getCustomerName(order)}</div>
                    <div className="text-xs text-soft-gray">{getCustomerEmail(order)}</div>
                  </td>

                  <td className="px-6 py-4 text-xs">
                    <span className="font-semibold text-charcoal">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''}
                    </span>
                    <div className="text-soft-gray truncate max-w-xs">
                      {order.items[0]?.title}
                    </div>
                  </td>

                  <td className="px-6 py-4 font-bold text-charcoal">
                    {settings.currencySymbol || '₹'}{order.totalAmount}
                  </td>

                  <td className="px-6 py-4">
                    <select
                      value={order.paymentStatus || 'Pending'}
                      onChange={(e) => {
                        const targetId = order._id || order.id;
                        updatePaymentStatus(targetId, e.target.value);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold border cursor-pointer outline-none transition-all shadow-xs ${
                        order.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : order.paymentStatus === 'Failed'
                            ? 'bg-red-50 text-red-800 border-red-300'
                            : order.paymentStatus === 'Refunded'
                              ? 'bg-gray-100 text-gray-800 border-gray-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      }`}
                      title="Click to update Payment Status"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </select>
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
                    <button
                      onClick={() => handleOpenDetail(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-surface bg-primary hover:bg-primary/90 shadow-sm transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View & Manage
                    </button>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-sm text-soft-gray">
                    {orders.length === 0
                      ? 'No customer orders placed yet..'
                      : 'No customer orders found matching this filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details: ${selectedOrder.id}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between p-4 rounded-2xl bg-warm-ivory border border-soft-gray/20 gap-4">
              <div>
                <span className="text-xs uppercase font-semibold text-soft-gray">Current Status</span>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge
                    variant={
                      selectedOrder.orderStatus === 'Delivered'
                        ? 'success'
                        : selectedOrder.orderStatus === 'Shipped'
                          ? 'accent'
                          : selectedOrder.orderStatus === 'Cancelled'
                            ? 'error'
                            : 'primary'
                    }
                  >
                    Order: {selectedOrder.orderStatus}
                  </Badge>
                  <Badge
                    variant={
                      selectedOrder.paymentStatus === 'Paid'
                        ? 'success'
                        : selectedOrder.paymentStatus === 'Failed'
                          ? 'error'
                          : 'accent'
                    }
                  >
                    Payment: {selectedOrder.paymentStatus || 'Pending'}
                  </Badge>
                  <span className="text-xs text-soft-gray">
                    Ordered on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-semibold text-charcoal whitespace-nowrap">Order Status:</label>
                  <select
                    value={selectedOrder.orderStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-soft-gray/25 bg-surface text-xs font-semibold text-charcoal focus:border-primary cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-semibold text-charcoal whitespace-nowrap">Payment:</label>
                  <select
                    value={selectedOrder.paymentStatus || 'Pending'}
                    onChange={(e) => handlePaymentStatusChange(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold focus:border-primary cursor-pointer transition-all ${
                      selectedOrder.paymentStatus === 'Paid'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : selectedOrder.paymentStatus === 'Failed'
                          ? 'bg-red-50 text-red-800 border-red-300'
                          : selectedOrder.paymentStatus === 'Refunded'
                            ? 'bg-gray-100 text-gray-800 border-gray-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Failed">Failed</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-soft-gray/20 bg-surface space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  Customer Details
                </h4>
                <p className="text-sm font-semibold text-charcoal">{getCustomerName(selectedOrder)}</p>
                <p className="text-xs text-soft-gray">{getCustomerEmail(selectedOrder)}</p>
                <p className="text-xs text-soft-gray">{getCustomerPhone(selectedOrder)}</p>
              </div>

              <div className="p-4 rounded-2xl border border-soft-gray/20 bg-surface space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Delivery Destination
                </h4>
                <p className="text-xs text-charcoal leading-relaxed font-medium">
                  {formatShippingAddress(selectedOrder.shippingAddress)}
                </p>
                <p className="text-xs text-soft-gray">
                  Payment Method: <span className="font-semibold text-charcoal">{typeof selectedOrder.paymentMethod === 'string' ? selectedOrder.paymentMethod : 'COD'}</span> • Status: <span className={`font-bold ${selectedOrder.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-amber-600'}`}>{typeof selectedOrder.paymentStatus === 'string' ? selectedOrder.paymentStatus : 'Pending'}</span>
                </p>
                {selectedOrder.notes && (
                  <p className="text-xs text-primary bg-primary/5 p-2 rounded-lg font-medium">
                    Note: {selectedOrder.notes}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-charcoal flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                Ordered Gift Items & Customer Personalizations
              </h4>

              <div className="space-y-3">
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-soft-gray/20 bg-warm-ivory/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-charcoal text-sm">{item.title}</p>
                        <p className="text-xs text-soft-gray">Qty: {item.quantity} × {settings.currencySymbol || '₹'}{item.price}</p>
                      </div>
                      <span className="font-bold text-charcoal text-sm">
                        {settings.currencySymbol || '₹'}{item.quantity * item.price}
                      </span>
                    </div>

                    {item.personalizationData && (
                      <div className="pt-2 border-t border-soft-gray/15 space-y-1.5 text-xs">
                        {item.personalizationData.customText && (
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-primary">Engraving Text:</span>
                            <span className="font-medium text-charcoal bg-surface px-2 py-0.5 rounded border border-soft-gray/15">
                              "{item.personalizationData.customText}"
                            </span>
                          </div>
                        )}

                        {item.personalizationData.giftCardMessage && (
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-primary">Greeting Note:</span>
                            <span className="italic text-charcoal bg-surface px-2 py-0.5 rounded border border-soft-gray/15">
                              "{item.personalizationData.giftCardMessage}"
                            </span>
                          </div>
                        )}

                        {item.personalizationData.photoUploaded && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="font-semibold text-primary">Customer Photo:</span>
                            <a
                              href={item.personalizationData.photoUploaded}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                            >
                              View Uploaded Photo <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        {item.personalizationData.giftWrap && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent px-2 py-0.5 rounded bg-accent/15">
                            <Gift className="w-3 h-3" /> Includes Luxury Ribbon Wrap
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Order Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={() => {
          if (orderToDelete) {
            deleteOrder(orderToDelete);
            if (selectedOrder && (selectedOrder.id === orderToDelete || selectedOrder._id === orderToDelete)) {
              setSelectedOrder(null);
            }
            setOrderToDelete(null);
          }
        }}
        title="Delete Order"
        message={`Are you sure you want to delete order #${orderToDelete}? This cannot be undone.`}
        confirmText="Delete Order"
      />
    </div>
  );
};
