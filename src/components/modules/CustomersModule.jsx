import React, { useState } from 'react';
import { Search, Mail, Phone, ShoppingBag, Eye } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const CustomersModule = () => {
  const { customers, orders, settings } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const customerOrders = selectedCustomer
    ? orders.filter(
        (o) =>
          o.customerEmail.toLowerCase() === selectedCustomer.email.toLowerCase() ||
          o.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()
      )
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-charcoal tracking-tight">Customer Accounts</h1>
        <p className="text-sm text-soft-gray mt-1">
          View registered gift buyers, contact profiles, lifetime spend, and past order history.
        </p>
      </div>

      <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-soft-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers by name, email, or phone number..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-soft-gray/25 bg-warm-ivory/40 text-charcoal placeholder-soft-gray focus:border-primary focus:bg-surface focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-soft-gray/20 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-charcoal">
            <thead className="bg-warm-ivory/60 text-xs uppercase font-semibold text-soft-gray border-b border-soft-gray/15">
              <tr>
                <th className="px-6 py-3.5">Customer Name</th>
                <th className="px-6 py-3.5">Contact Info</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">Total Orders</th>
                <th className="px-6 py-3.5">Total Spent</th>
                <th className="px-6 py-3.5">Last Order</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft-gray/10">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-warm-ivory/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/30 text-charcoal flex items-center justify-center font-bold text-sm">
                        {cust.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-charcoal">{cust.name}</div>
                        <div className="text-xs text-soft-gray font-mono">{cust.id}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-xs space-y-0.5">
                    <div className="text-charcoal font-medium">{cust.email}</div>
                    <div className="text-soft-gray">{cust.phone}</div>
                  </td>

                  <td className="px-6 py-4 text-xs text-soft-gray">
                    {cust.address || '—'}
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-semibold text-charcoal">
                      {cust.totalOrders} order{cust.totalOrders === 1 ? '' : 's'}
                    </span>
                  </td>

                  <td className="px-6 py-4 font-bold text-charcoal">
                    {settings.currencySymbol || '₹'}{cust.totalSpent.toLocaleString()}
                  </td>

                  <td className="px-6 py-4 text-xs text-soft-gray">
                    {cust.lastOrderDate}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedCustomer(cust)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-surface bg-primary hover:bg-primary/90 shadow-sm transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Order History
                    </button>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-sm text-soft-gray">
                    {customers.length === 0
                      ? 'No customer accounts registered yet. Customer profiles and order records will appear here automatically.'
                      : 'No customers found matching your search term.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer Profile: ${selectedCustomer.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-warm-ivory border border-soft-gray/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary text-surface flex items-center justify-center font-bold text-lg">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-charcoal text-base">{selectedCustomer.name}</h3>
                  <p className="text-xs text-soft-gray">{selectedCustomer.email} • {selectedCustomer.phone}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs uppercase font-semibold text-soft-gray">Total Spend</p>
                <p className="text-lg font-bold text-charcoal">
                  {settings.currencySymbol || '₹'}{selectedCustomer.totalSpent.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-charcoal flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" />
                Purchased Gift Orders ({customerOrders.length})
              </h4>

              <div className="space-y-3 max-h-72 overflow-y-auto">
                {customerOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl border border-soft-gray/20 bg-surface flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-charcoal">{order.id}</span>
                        <Badge
                          variant={
                            order.orderStatus === 'Delivered'
                              ? 'success'
                              : order.orderStatus === 'Shipped'
                              ? 'accent'
                              : 'primary'
                          }
                        >
                          {order.orderStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-soft-gray mt-1">
                        {order.items.length} item(s) • {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-charcoal text-sm">
                        {settings.currencySymbol || '₹'}{order.totalAmount}
                      </span>
                      <p className="text-[11px] text-soft-gray">{order.paymentStatus}</p>
                    </div>
                  </div>
                ))}

                {customerOrders.length === 0 && (
                  <p className="text-sm text-soft-gray py-4 text-center">
                    No orders recorded for this customer yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
