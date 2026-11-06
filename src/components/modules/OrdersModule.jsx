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
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-soft-gray/25 bg-warm-ivory shrink-0 flex items-center justify-center shadow-2xs">
                        {order.items[0]?.image ? (
                          <img
                            src={order.items[0]?.image}
                            alt={order.items[0]?.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-full bg-primary/10 flex items-center justify-center text-primary ${order.items[0]?.image ? 'hidden' : 'flex'}`}
                        >
                          <Gift className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-charcoal truncate max-w-[170px]" title={order.items[0]?.title}>
                          {order.items[0]?.title || 'Gift Item'}
                        </div>
                        <div className="text-[11px] text-soft-gray">
                          Qty: {order.items[0]?.quantity || 1}
                          {order.items.length > 1 && (
                            <span className="ml-1 text-primary font-bold">
                              (+{order.items.length - 1} more)
                            </span>
                          )}
                        </div>
                      </div>
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-charcoal flex items-center gap-2">
                  <Gift className="w-4 h-4 text-primary" />
                  Ordered Gift Items ({selectedOrder.items?.length || 0})
                </h4>
                <span className="text-xs font-semibold text-soft-gray">
                  Total Items: {selectedOrder.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0}
                </span>
              </div>

              <div className="space-y-3">
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-soft-gray/20 bg-surface space-y-3 shadow-xs hover:border-primary/40 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Product Thumbnail & Basic Info */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-soft-gray/20 bg-warm-ivory/60 shrink-0 flex items-center justify-center shadow-xs">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full bg-primary/5 flex flex-col items-center justify-center text-primary/60 ${item.image ? 'hidden' : 'flex'}`}
                          >
                            <Gift className="w-7 h-7" />
                            <span className="text-[9px] font-semibold mt-0.5">Gift</span>
                          </div>
                        </div>

                        <div className="min-w-0 space-y-1">
                          <h5 className="font-bold text-charcoal text-sm sm:text-base leading-snug">
                            {item.title}
                          </h5>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            {(item.productId || item.sku) && (
                              <span className="font-mono text-[11px] font-bold text-soft-gray bg-warm-ivory px-2 py-0.5 rounded border border-soft-gray/20">
                                SKU: {item.productId || item.sku}
                              </span>
                            )}
                            {item.category && (
                              <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {item.category}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-soft-gray font-medium">
                            Unit Price: {settings.currencySymbol || '₹'}{item.price} • Quantity: <span className="font-bold text-charcoal">{item.quantity}</span>
                          </p>
                        </div>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right sm:self-center shrink-0">
                        <span className="text-xs uppercase font-semibold text-soft-gray block">Subtotal</span>
                        <span className="text-base sm:text-lg font-bold text-primary">
                          {settings.currencySymbol || '₹'}{item.quantity * item.price}
                        </span>
                      </div>
                    </div>

                    {/* Customer Personalization Details */}
                    {item.personalizationData && (
                      <div className="pt-3 border-t border-soft-gray/15 space-y-2 text-xs">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-soft-gray block">
                          Customer Personalizations:
                        </span>

                        {item.personalizationData.customText && (
                          <div className="flex items-start gap-2 bg-warm-ivory/60 p-2.5 rounded-xl border border-soft-gray/15">
                            <span className="font-bold text-primary whitespace-nowrap">✨ Name / Engraving:</span>
                            <span className="font-bold text-charcoal bg-surface px-2 py-0.5 rounded border border-soft-gray/20">
                              "{item.personalizationData.customText}"
                            </span>
                          </div>
                        )}

                        {item.personalizationData.giftCardMessage && (
                          <div className="flex items-start gap-2 bg-[#FFF9F5] p-2.5 rounded-xl border border-[#F2E5DE]">
                            <span className="font-bold text-primary whitespace-nowrap">💌 Greeting Note:</span>
                            <span className="italic text-charcoal leading-relaxed">
                              "{item.personalizationData.giftCardMessage}"
                            </span>
                          </div>
                        )}

                        {item.personalizationData.photoUploaded && (
                          <div className="flex flex-wrap items-center gap-3 bg-warm-ivory/40 p-2.5 rounded-xl border border-soft-gray/15">
                            <span className="font-bold text-primary">📷 Customer Uploaded Photo:</span>
                            <a
                              href={item.personalizationData.photoUploaded}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-surface text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
                            >
                              <span>View & Download Photo</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}

                        {item.personalizationData.giftWrap && (
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-accent bg-accent/15 px-2.5 py-1 rounded-xl">
                            <Gift className="w-3.5 h-3.5" />
                            <span>Includes Premium Luxury Ribbon Wrap</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Order Cost Breakdown Box */}
              <div className="p-4 rounded-2xl bg-warm-ivory/70 border border-soft-gray/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="space-y-1 text-soft-gray">
                  <div>Payment Method: <span className="font-semibold text-charcoal">{typeof selectedOrder.paymentMethod === 'string' ? selectedOrder.paymentMethod : 'COD'}</span></div>
                  <div>Payment Status: <span className={`font-bold ${selectedOrder.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-amber-600'}`}>{selectedOrder.paymentStatus || 'Pending'}</span></div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-soft-gray block uppercase font-semibold">Total Order Value</span>
                  <span className="text-xl font-bold text-charcoal">
                    {settings.currencySymbol || '₹'}{selectedOrder.totalAmount}
                  </span>
                </div>
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
