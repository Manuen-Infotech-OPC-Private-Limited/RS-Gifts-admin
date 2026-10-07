import React, { useState } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Save
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Badge } from '../common/Badge';

export const InventoryModule = () => {
  const { products, updateProductStock, adjustStock, settings } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const [editQuantities, setEditQuantities] = useState({});

  const lowStockCount = products.filter(
    (p) => p.stock <= (p.lowStockThreshold || 5) && p.stock > 0
  ).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const inStockCount = products.filter((p) => p.stock > (p.lowStockThreshold || 5)).length;
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);

  const filteredProducts = products.filter((p) => {
    const pId = p.productId || p.sku || (p.id ? String(p.id) : '');
    const matchesSearch =
      (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      pId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'LOW') return p.stock <= (p.lowStockThreshold || 5) && p.stock > 0;
    if (filterType === 'OUT') return p.stock === 0;
    return true;
  });

  const handleInlineChange = (productId, val) => {
    setEditQuantities({
      ...editQuantities,
      [productId]: val
    });
  };

  const handleSaveInline = (productId) => {
    const val = editQuantities[productId];
    if (val !== undefined && val !== '') {
      updateProductStock(productId, val);
      const updated = { ...editQuantities };
      delete updated[productId];
      setEditQuantities(updated);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-charcoal tracking-tight">Inventory & Stock Control</h1>
        <p className="text-sm text-soft-gray mt-1">
          Monitor warehouse stock, quickly update gift quantities, and resolve low-stock alerts before items sell out.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-soft-gray">
              Total Items
            </span>
            <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center text-primary">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-charcoal mt-2">{totalStockUnits}</div>
          <p className="text-xs text-soft-gray mt-0.5">Across {products.length} gift items</p>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-soft-gray">
              Healthy Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center text-success">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-charcoal mt-2">{inStockCount}</div>
          <p className="text-xs text-soft-gray mt-0.5">Items with sufficient stock</p>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-soft-gray">
              Low Stock Alerts
            </span>
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-charcoal mt-2">{lowStockCount}</div>
          <p className="text-xs text-accent font-medium mt-0.5">Stock &lt;= 5 units</p>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-soft-gray">
              Out of Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-error/15 flex items-center justify-center text-error">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-charcoal mt-2">{outOfStockCount}</div>
          <p className="text-xs text-error font-medium mt-0.5">Unavailable for purchase</p>
        </div>
      </div>

      <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-soft-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search inventory by title, ID, or category..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-soft-gray/25 bg-warm-ivory/40 text-charcoal placeholder-soft-gray focus:border-primary focus:bg-surface focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filterType === 'ALL'
                ? 'bg-primary text-surface shadow-sm'
                : 'bg-warm-ivory/60 text-soft-gray hover:text-charcoal'
              }`}
          >
            All Items ({products.length})
          </button>
          <button
            onClick={() => setFilterType('LOW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filterType === 'LOW'
                ? 'bg-primary text-surface shadow-sm'
                : 'bg-warm-ivory/60 text-soft-gray hover:text-charcoal'
              }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterType('OUT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filterType === 'OUT'
                ? 'bg-primary text-surface shadow-sm'
                : 'bg-warm-ivory/60 text-soft-gray hover:text-charcoal'
              }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-soft-gray/20 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-charcoal">
            <thead className="bg-warm-ivory/60 text-xs uppercase font-semibold text-soft-gray border-b border-soft-gray/15">
              <tr>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">Product ID</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Price</th>
                <th className="px-6 py-3.5">Stock Status</th>
                <th className="px-6 py-3.5">Current Stock</th>
                <th className="px-6 py-3.5 text-center">Quick Adjust</th>
                <th className="px-6 py-3.5 text-right">Manual Input</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft-gray/10">
              {filteredProducts.map((product) => {
                const isLow = product.stock <= (product.lowStockThreshold || 5) && product.stock > 0;
                const isOut = product.stock === 0;
                const pendingInput = editQuantities[product.id];

                return (
                  <tr key={product.id} className="hover:bg-warm-ivory/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-10 h-10 rounded-xl object-cover border border-soft-gray/20 flex-shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cdcd?w=200';
                          }}
                        />
                        <p className="font-semibold text-charcoal">{product.title}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center text-xs font-mono font-bold text-primary bg-warm-ivory/80 px-2.5 py-1 rounded-lg border border-soft-gray/20 shadow-xs">
                        {product.productId || product.sku || (product.id ? String(product.id).slice(-6).toUpperCase() : 'N/A')}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-charcoal">
                      {product.category}
                    </td>

                    <td className="px-6 py-4 font-semibold text-charcoal">
                      {settings.currencySymbol || '₹'}{product.salePrice || product.price}
                    </td>

                    <td className="px-6 py-4">
                      {isOut ? (
                        <Badge variant="error">Out of Stock</Badge>
                      ) : isLow ? (
                        <Badge variant="accent">Low Stock (≤{product.lowStockThreshold || 5})</Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-base font-bold text-charcoal">
                        {product.stock}
                      </span>
                      <span className="text-xs text-soft-gray ml-1">units</span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1 bg-warm-ivory p-1 rounded-xl border border-soft-gray/20">
                        <button
                          onClick={() => adjustStock(product.id, -1)}
                          disabled={product.stock <= 0}
                          className="p-1 rounded-lg hover:bg-surface text-charcoal disabled:opacity-30 transition-colors"
                          title="Reduce by 1"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => adjustStock(product.id, 1)}
                          className="p-1 rounded-lg hover:bg-surface text-charcoal transition-colors"
                          title="Add 1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          min="0"
                          value={pendingInput !== undefined ? pendingInput : product.stock}
                          onChange={(e) => handleInlineChange(product.id, e.target.value)}
                          className="w-20 px-2.5 py-1.5 text-xs text-center font-semibold rounded-xl border border-soft-gray/25 text-charcoal bg-surface focus:border-primary"
                        />
                        {pendingInput !== undefined && (
                          <button
                            onClick={() => handleSaveInline(product.id)}
                            className="p-1.5 rounded-lg bg-primary text-surface hover:bg-primary/90 transition-colors shadow-sm"
                            title="Save Quantity"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-sm text-soft-gray">
                    {products.length === 0
                      ? 'No inventory items in catalog yet. Add products to monitor warehouse stock and adjust quantities.'
                      : 'No items found matching the selected stock filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
