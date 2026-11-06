import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Star,
  Check,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAdmin, ensure6DigitProductId, generateNextUniqueProductId } from '../../context/AdminContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CloudinaryUpload } from '../common/CloudinaryUpload';

export const AVAILABLE_TARGET_PAGES = [
  'Birthday Gifts',
  'Anniversary Gifts',
  'Personalized Gifts',
  'Festival Gifts',
  'Hampers',
  'New Arrivals'
];

export const ProductsModule = () => {
  const {
    products,
    categories,
    settings,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductActive,
    toggleProductFeatured
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPage, setSelectedPage] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const initialFormState = {
    title: '',
    description: '',
    category: categories[0]?.name || 'Gifts',
    targetPage: 'Birthday Gifts',
    targetPages: ['Birthday Gifts'],
    price: '',
    stock: '',
    lowStockThreshold: 5,
    image: '',
    gallery: [],
    active: true,
    featured: false
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData(initialFormState);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    const prodGallery = Array.isArray(product.gallery) && product.gallery.length > 0 ? product.gallery.filter(Boolean) : (product.image ? [product.image] : []);
    const primaryImg = product.image || prodGallery[0] || '';
    const normalizedGallery = prodGallery.includes(primaryImg) ? prodGallery : (primaryImg ? [primaryImg, ...prodGallery] : []);
    setFormData({
      ...product,
      gallery: normalizedGallery,
      image: primaryImg,
      targetPage: product.targetPage || (Array.isArray(product.targetPages) ? product.targetPages[0] : '') || '',
      targetPages: Array.isArray(product.targetPages) && product.targetPages.length > 0 ? product.targetPages : (product.targetPage ? [product.targetPage] : []),
      price: (product.price || product.salePrice || '').toString(),
      stock: (product.stock ?? 0).toString(),
      lowStockThreshold: product.lowStockThreshold || 5
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      errs.title = 'Title must be at least 3 characters.';
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      errs.price = 'Selling price must be greater than 0.';
    }
    const stockNum = parseInt(formData.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      errs.stock = 'Stock must be 0 or a positive number.';
    }
    if (!formData.category) {
      errs.category = 'Please select a category.';
    }
    const hasImage = Boolean(formData.image && formData.image.trim()) || (Array.isArray(formData.gallery) && formData.gallery.length > 0);
    if (!hasImage) {
      errs.image = 'At least one product image is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const targetPagesList = Array.isArray(formData.targetPages) && formData.targetPages.length > 0
      ? formData.targetPages
      : (formData.targetPage ? [formData.targetPage] : (formData.category ? [formData.category] : []));

    const rawGallery = Array.isArray(formData.gallery) && formData.gallery.length > 0 ? formData.gallery.filter(Boolean) : (formData.image ? [formData.image] : []);
    const primaryImage = formData.image || rawGallery[0] || '';
    const finalGallery = rawGallery.includes(primaryImage) ? rawGallery : (primaryImage ? [primaryImage, ...rawGallery] : []);
    const productPayload = {
      ...formData,
      image: primaryImage,
      gallery: finalGallery,
      targetPages: targetPagesList,
      targetPage: formData.targetPage || targetPagesList[0] || '',
      occasions: targetPagesList,
      price: parseFloat(formData.price),
      salePrice: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      lowStockThreshold: parseInt(formData.lowStockThreshold, 10) || 5
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productPayload);
    } else {
      addProduct(productPayload);
    }
    setIsModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    const pId = p.productId || p.sku || (p.id ? String(p.id) : '');
    const matchesSearch =
      (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      pId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const pPages = Array.isArray(p.targetPages) && p.targetPages.length > 0
      ? p.targetPages
      : (p.targetPage ? [p.targetPage] : [p.category]);
    const matchesPage =
      selectedPage === 'ALL' ||
      pPages.some((pg) => pg?.toLowerCase() === selectedPage.toLowerCase()) ||
      p.targetPage?.toLowerCase() === selectedPage.toLowerCase() ||
      p.category?.toLowerCase() === selectedPage.toLowerCase();

    return matchesSearch && matchesCat && matchesPage;
  });

  // Pagination (7 products per page, scrollable)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, startIndex, itemsPerPage]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal tracking-tight">Gift Catalog</h1>
          <p className="text-sm text-soft-gray mt-1">
            Manage your gift products, pricing, stock levels, and assign to customer pages.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-surface font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New Gift
        </button>
      </div>

      <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-soft-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search gifts by name or ID..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-soft-gray/25 bg-warm-ivory/40 text-charcoal placeholder-soft-gray focus:border-primary focus:bg-surface focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="w-full md:w-48">
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-soft-gray/25 bg-surface text-charcoal focus:border-primary focus:ring-1 focus:ring-primary font-medium"
          >
            <option value="ALL">All Store Pages</option>
            {AVAILABLE_TARGET_PAGES.map((p) => (
              <option key={p} value={p}>
                Page: {p}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-soft-gray/25 bg-surface text-charcoal focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-soft-gray/20 shadow-card overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[460px] no-scrollbar">
          <table className="w-full text-left text-sm text-charcoal relative border-collapse">
            <thead className="sticky top-0 z-20 bg-warm-ivory text-xs uppercase font-semibold text-soft-gray border-b border-soft-gray/15 shadow-xs">
              <tr>
                <th className="px-6 py-3.5 bg-warm-ivory">Product</th>
                <th className="px-6 py-3.5 bg-warm-ivory">Product ID</th>
                <th className="px-6 py-3.5 bg-warm-ivory">Category</th>
                <th className="px-6 py-3.5 bg-warm-ivory">Selling Price</th>
                <th className="px-6 py-3.5 bg-warm-ivory">Stock</th>
                <th className="px-6 py-3.5 bg-warm-ivory">Status</th>
                <th className="px-6 py-3.5 text-right bg-warm-ivory">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft-gray/10">
              {paginatedProducts.map((p) => {
                const isLowStock = p.stock <= (p.lowStockThreshold || 5) && p.stock > 0;
                const isOutOfStock = p.stock === 0;

                return (
                  <tr key={p.id} className="hover:bg-warm-ivory/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-12 h-12 rounded-xl object-cover border border-soft-gray/20 flex-shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              if (e.target.nextElementSibling) {
                                e.target.nextElementSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-12 h-12 rounded-xl bg-secondary/15 border border-soft-gray/20 flex-shrink-0 items-center justify-center text-primary ${p.image ? 'hidden' : 'flex'
                            }`}
                        >
                          <ImageIcon className="w-5 h-5 text-primary/70" />
                        </div>
                        <div>
                          <div className="font-semibold text-charcoal">
                            <span>{p.title}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center text-xs font-mono font-bold text-primary bg-warm-ivory/80 px-2.5 py-1 rounded-lg border border-soft-gray/20 shadow-xs">
                        {ensure6DigitProductId(p.productId || p.sku, p.id || p._id)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-charcoal">{p.category}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-charcoal">
                        {settings.currencySymbol || '₹'}
                        {p.price || p.salePrice || 0}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="font-semibold text-charcoal">{p.stock} units</span>
                        {isOutOfStock ? (
                          <Badge variant="error">Out of Stock</Badge>
                        ) : isLowStock ? (
                          <Badge variant="error">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">In Stock</Badge>
                        )}
                      </div>
                    </td>


                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleProductActive(p.id)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors ${p.active
                          ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                          : 'bg-soft-gray/10 text-soft-gray border-soft-gray/20 hover:bg-soft-gray/20'
                          }`}
                      >
                        {p.active ? 'Active' : 'Draft'}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleProductFeatured(p.id || p._id)}
                          className={`p-1.5 rounded-lg border transition-colors ${p.featured
                            ? 'bg-[#C9A45C]/15 text-[#916F2E] border-[#C9A45C]/40 hover:bg-[#C9A45C]/25'
                            : 'text-soft-gray border-soft-gray/20 hover:text-[#C9A45C] hover:bg-[#C9A45C]/10'
                            }`}
                          title={p.featured ? 'Remove from Featured Products' : 'Add to Featured Products'}
                        >
                          <Star className="w-4 h-4" fill={p.featured ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-soft-gray hover:text-primary hover:bg-primary/10 border border-soft-gray/20 hover:border-primary/40 transition-colors"
                          title="Edit Gift Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="p-1.5 rounded-lg text-soft-gray hover:text-primary hover:bg-primary/10 border border-soft-gray/20 hover:border-primary/40 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-sm text-soft-gray">
                    {products.length === 0
                      ? "No gifts in catalog yet. Click 'Add Gift Product' above to create your first gift item."
                      : "No gifts found matching your search and filter criteria."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Bar (7 products per page) */}
        {filteredProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3.5 border-t border-soft-gray/15 bg-warm-ivory/30 gap-3">
            <div className="text-xs text-soft-gray font-medium">
              Showing <span className="font-semibold text-charcoal">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-charcoal">
                {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
              </span>{' '}
              of <span className="font-semibold text-charcoal">{filteredProducts.length}</span> products
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Gift Product' : 'Add New Gift Product'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Product Name
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Personalized Photo Frame"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-charcoal bg-surface focus:ring-1 focus:ring-primary ${errors.title ? 'border-error ring-1 ring-error' : 'border-soft-gray/25'
                  }`}
              />
              {errors.title && <p className="text-xs text-error mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:ring-1 focus:ring-primary"
              >
                {categories.length === 0 ? (
                  <option value="">No categories created yet (Add in Categories tab)</option>
                ) : (
                  <>
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal">
                Description
              </label>
              <span className="text-[11px] text-soft-gray font-medium">
                {formData.description?.length || 0} characters
              </span>
            </div>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief gift highlight or product description..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:ring-1 focus:ring-primary leading-relaxed resize-y min-h-[75px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Selling Price ({settings.currencySymbol || '₹'})
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="1499"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-charcoal bg-surface focus:ring-1 focus:ring-primary ${errors.price ? 'border-error ring-1 ring-error' : 'border-soft-gray/25'
                  }`}
              />
              {errors.price && <p className="text-xs text-error mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                Inventory Stock Count
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="25"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-charcoal bg-surface focus:ring-1 focus:ring-primary ${errors.stock ? 'border-error ring-1 ring-error' : 'border-soft-gray/25'
                  }`}
              />
              {errors.stock && <p className="text-xs text-error mt-1">{errors.stock}</p>}
            </div>
          </div>

          <CloudinaryUpload
            value={formData.image}
            onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
            gallery={formData.gallery}
            onGalleryChange={(newGallery) => {
              setFormData((prev) => ({
                ...prev,
                gallery: newGallery
              }));
            }}
            maxGallerySlots={4}
            label="Product Gift Image"
            recommendedDimensions="800 × 800 px"
            aspectRatio="1:1 (square)"
          >
            <div className="flex items-center justify-end gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-soft-gray/25 text-sm font-medium text-charcoal hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-primary text-surface text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                {editingProduct ? 'Save Changes' : 'Create Gift Product'}
              </button>
            </div>
          </CloudinaryUpload>
          {errors.image && <p className="text-xs text-error mt-1">{errors.image}</p>}</form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteProduct(deleteId)}
        title="Remove Gift from Catalog"
        message="Are you sure you want to delete this product? It will immediately stop appearing on the customer storefront."
        confirmText="Yes, Delete Gift"
      />
    </div>
  );
};
