import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Info,
  FileText,
  Package,
  Truck,
  X,
  RotateCcw
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
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

export const POPULAR_OCCASIONS = [
  'Birthday',
  'Anniversary',
  "Valentine's Day",
  'Wedding & Engagement',
  'Festive & Diwali',
  'Romantic Surprises',
  'Corporate & Executive',
  'Housewarming',
  'Congratulations',
  'Baby Shower'
];

export const ProductsModule = () => {
  const {
    products,
    categories,
    settings,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductActive
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPage, setSelectedPage] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('basic'); // 'basic' | 'description' | 'specs' | 'shipping'
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const initialFormState = {
    title: '',
    description: '',
    category: categories[0]?.name || 'Gifts',
    targetPage: 'Birthday Gifts',
    targetPages: ['Birthday Gifts'],
    occasions: ['Birthday Gifts'],
    price: '',
    stock: '',
    lowStockThreshold: 5,
    image: '',
    active: true,
    featured: false,

    // Dynamic Experience Highlight
    experienceTitle: 'The RS Gifts Experience',
    experienceText: 'Curated with high-grade materials and packaged inside our signature luxury box, ensuring an unforgettable unboxing moment.',

    // Dynamic Package & Specifications
    inTheBox: '',
    material: '',
    dimensions: '',
    weight: '',
    color: '',
    countryOfOrigin: 'India',
    careInstructions: '',
    customSpecs: [],

    // Dynamic Shipping & Returns
    dispatchTimeline: 'Orders placed before 4:00 PM IST are dispatched within 24 hours.',
    transitTimeline: 'Metro cities: 2-3 business days. Rest of India: 3-5 business days.',
    freeShippingNote: 'Applied automatically on all orders above ₹999 across India.',
    returnPolicy: '7-day hassle-free replacement in the unlikely event of transit damage or manufacturing defect.'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData(initialFormState);
    setActiveModalTab('basic');
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    const specs = product.specifications || {};
    const ship = product.shippingDetails || {};

    setFormData({
      ...product,
      targetPage: product.targetPage || (Array.isArray(product.targetPages) ? product.targetPages[0] : '') || '',
      targetPages: Array.isArray(product.targetPages) && product.targetPages.length > 0 ? product.targetPages : (product.targetPage ? [product.targetPage] : []),
      occasions: Array.isArray(product.occasions) && product.occasions.length > 0 ? product.occasions : (product.targetPages || []),
      price: (product.price || product.salePrice || '').toString(),
      stock: (product.stock ?? 0).toString(),
      lowStockThreshold: product.lowStockThreshold || 5,

      experienceTitle: product.experienceTitle || 'The RS Gifts Experience',
      experienceText: product.experienceText || 'Curated with high-grade materials and packaged inside our signature luxury box, ensuring an unforgettable unboxing moment.',

      inTheBox: product.inTheBox || '',
      material: specs.material || '',
      dimensions: specs.dimensions || '',
      weight: specs.weight || '',
      color: specs.color || '',
      countryOfOrigin: specs.countryOfOrigin || 'India',
      careInstructions: specs.careInstructions || '',
      customSpecs: Array.isArray(specs.customSpecs) ? specs.customSpecs : [],

      dispatchTimeline: ship.dispatchTimeline || 'Orders placed before 4:00 PM IST are dispatched within 24 hours.',
      transitTimeline: ship.transitTimeline || 'Metro cities: 2-3 business days. Rest of India: 3-5 business days.',
      freeShippingNote: ship.freeShippingNote || 'Applied automatically on all orders above ₹999 across India.',
      returnPolicy: ship.returnPolicy || '7-day hassle-free replacement in the unlikely event of transit damage or manufacturing defect.'
    });
    setActiveModalTab('basic');
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
    if (!formData.image.trim()) {
      errs.image = 'Product image is required.';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (errs.title || errs.price || errs.stock || errs.category || errs.image) {
        setActiveModalTab('basic');
      }
    }
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const targetPagesList = Array.isArray(formData.targetPages) && formData.targetPages.length > 0
      ? formData.targetPages
      : (formData.targetPage ? [formData.targetPage] : (formData.category ? [formData.category] : []));

    const occasionsList = Array.isArray(formData.occasions) && formData.occasions.length > 0
      ? formData.occasions
      : targetPagesList;

    const productPayload = {
      ...formData,
      targetPages: targetPagesList,
      targetPage: formData.targetPage || targetPagesList[0] || '',
      occasions: occasionsList,
      price: parseFloat(formData.price),
      salePrice: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      lowStockThreshold: parseInt(formData.lowStockThreshold, 10) || 5,

      experienceTitle: formData.experienceTitle || 'The RS Gifts Experience',
      experienceText: formData.experienceText || '',

      inTheBox: formData.inTheBox || '',
      specifications: {
        material: formData.material || '',
        dimensions: formData.dimensions || '',
        weight: formData.weight || '',
        color: formData.color || '',
        countryOfOrigin: formData.countryOfOrigin || 'India',
        careInstructions: formData.careInstructions || '',
        customSpecs: Array.isArray(formData.customSpecs) ? formData.customSpecs.filter(s => s.key && s.value) : []
      },

      shippingDetails: {
        dispatchTimeline: formData.dispatchTimeline || '',
        transitTimeline: formData.transitTimeline || '',
        freeShippingNote: formData.freeShippingNote || '',
        returnPolicy: formData.returnPolicy || ''
      }
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productPayload);
    } else {
      addProduct(productPayload);
    }
    setIsModalOpen(false);
  };

  const handleFillDefaultShipping = () => {
    setFormData(prev => ({
      ...prev,
      dispatchTimeline: 'Orders placed before 4:00 PM IST are dispatched within 24 hours.',
      transitTimeline: 'Metro cities: 2-3 business days. Rest of India: 3-5 business days.',
      freeShippingNote: 'Applied automatically on all orders above ₹999 across India.',
      returnPolicy: '7-day hassle-free replacement in the unlikely event of transit damage or manufacturing defect.'
    }));
  };

  const handleAddCustomSpec = () => {
    setFormData(prev => ({
      ...prev,
      customSpecs: [...(prev.customSpecs || []), { key: '', value: '' }]
    }));
  };

  const handleUpdateCustomSpec = (index, field, value) => {
    setFormData(prev => {
      const updated = [...(prev.customSpecs || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, customSpecs: updated };
    });
  };

  const handleRemoveCustomSpec = (index) => {
    setFormData(prev => ({
      ...prev,
      customSpecs: (prev.customSpecs || []).filter((_, i) => i !== index)
    }));
  };

  const filteredProducts = products.filter((p) => {
    const pId = p.productId || p.sku || (p.id ? String(p.id) : '');
    const matchesSearch =
      (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      pId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' || p.category === selectedCategory;

    const matchesPage =
      selectedPage === 'ALL' ||
      p.targetPage === selectedPage ||
      (Array.isArray(p.targetPages) && p.targetPages.includes(selectedPage));

    return matchesSearch && matchesCategory && matchesPage;
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal tracking-tight">Products Management</h1>
          <p className="text-sm text-soft-gray mt-1">
            Create, customize details & specs, and manage your gift items.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-surface font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Gift Product
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-soft-gray/20 shadow-card flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-soft-gray" />
          <input
            type="text"
            placeholder="Search by title, 6-digit ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-soft-gray/30 bg-surface focus:outline-none focus:border-primary text-charcoal"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-soft-gray/30 bg-surface text-charcoal focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-soft-gray/30 bg-surface text-charcoal focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Store Pages</option>
            {AVAILABLE_TARGET_PAGES.map((page) => (
              <option key={page} value={page}>
                {page}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-surface rounded-2xl border border-soft-gray/20 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-soft-gray/20 bg-warm-ivory/80 text-[11px] font-bold text-charcoal/70 uppercase tracking-wider">
                <th className="py-3.5 px-4 min-w-[280px]">Item & ID</th>
                <th className="py-3.5 px-4 min-w-[150px]">Category</th>
                <th className="py-3.5 px-4 min-w-[160px]">Store Pages</th>
                <th className="py-3.5 px-4 min-w-[110px]">Price</th>
                <th className="py-3.5 px-4 min-w-[130px]">Stock</th>
                <th className="py-3.5 px-4 min-w-[90px] text-center">Active</th>
                <th className="py-3.5 px-4 min-w-[100px] text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft-gray/10 text-sm">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-soft-gray">
                    No gifts match your search criteria.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const displayId = product.productId || product.sku || (product.id ? String(product.id) : '');
                  return (
                    <tr key={product.id} className="hover:bg-warm-ivory/30 transition-colors">
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-soft-gray/10 overflow-hidden flex items-center justify-center shrink-0 border border-soft-gray/20 shadow-xs">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-soft-gray/50" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-charcoal text-sm truncate max-w-[220px] sm:max-w-[280px]" title={product.title}>
                              {product.title}
                            </div>
                            <div className="text-[11px] font-mono text-soft-gray flex items-center gap-1.5 mt-0.5">
                              <span className="font-bold text-primary">ID:</span>
                              <span className="bg-primary/5 px-2 py-0.5 rounded-md border border-primary/20 text-charcoal font-semibold">
                                {displayId}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        <span className="inline-flex items-center text-xs font-semibold text-charcoal bg-warm-ivory px-2.5 py-1 rounded-lg border border-soft-gray/20 whitespace-nowrap shadow-2xs">
                          {product.category || 'General'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                          {(Array.isArray(product.targetPages) && product.targetPages.length > 0
                            ? product.targetPages
                            : [product.targetPage || 'Catalog']
                          ).map((pg) => (
                            <span
                              key={pg}
                              className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 whitespace-nowrap shadow-2xs"
                            >
                              {pg}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-middle font-bold text-charcoal text-sm tabular-nums whitespace-nowrap">
                        {settings.currencySymbol || '₹'}
                        {Number(product.price || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap shadow-2xs ${
                            (product.stock || 0) <= 0
                              ? 'bg-error/10 text-error border border-error/20'
                              : (product.stock || 0) <= 5
                                ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              (product.stock || 0) <= 0
                                ? 'bg-error'
                                : (product.stock || 0) <= 5
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-600'
                            }`}
                          />
                          {(product.stock || 0) <= 0
                            ? 'Out of stock'
                            : `${product.stock} in stock`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-middle text-center">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => toggleProductActive(product.id)}
                            className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                              product.active !== false ? 'bg-primary' : 'bg-soft-gray/30'
                            }`}
                            aria-label="Toggle active status"
                          >
                            <span
                              className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                                product.active !== false ? 'left-5' : 'left-1'
                              }`}
                            />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-middle text-right pr-6">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(product)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-soft-gray hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title="Edit Product & Dynamic Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(product.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-soft-gray hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="p-4 border-t border-soft-gray/15 flex items-center justify-between">
            <span className="text-xs text-soft-gray">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} gifts
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-soft-gray/30 text-charcoal disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2 text-charcoal">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-soft-gray/30 text-charcoal disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal with 4 Dynamic Tabs */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Gift Product Details' : 'Add New Gift Product'}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Sub-Tabs Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-b border-soft-gray/20 pb-3 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveModalTab('basic')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeModalTab === 'basic'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-warm-ivory/80 text-charcoal hover:bg-soft-gray/10'
                }`}
            >
              <Info className="w-3.5 h-3.5" />
              1. Basic Info
            </button>

            <button
              type="button"
              onClick={() => setActiveModalTab('description')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeModalTab === 'description'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-warm-ivory/80 text-charcoal hover:bg-soft-gray/10'
                }`}
            >
              <FileText className="w-3.5 h-3.5" />
              2. Product Description
            </button>

            <button
              type="button"
              onClick={() => setActiveModalTab('specs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeModalTab === 'specs'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-warm-ivory/80 text-charcoal hover:bg-soft-gray/10'
                }`}
            >
              <Package className="w-3.5 h-3.5" />
              3. In The Box & Specs
            </button>

            <button
              type="button"
              onClick={() => setActiveModalTab('shipping')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeModalTab === 'shipping'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-warm-ivory/80 text-charcoal hover:bg-soft-gray/10'
                }`}
            >
              <Truck className="w-3.5 h-3.5" />
              4. Shipping & Returns
            </button>
          </div>

          {/* TAB 1: BASIC INFO */}
          {activeModalTab === 'basic' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                    Product Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Personalized Wooden Moon Lamp"
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
                      <option value="">No categories created yet</option>
                    ) : (
                      categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Target Pages */}
              <div className="bg-warm-ivory/40 p-4 rounded-xl border border-soft-gray/25">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal">
                    Assign Storefront Pages
                  </label>
                  <span className="text-[11px] text-soft-gray">
                    Select where this product appears on the storefront
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {AVAILABLE_TARGET_PAGES.map((page) => {
                    const isSelected = (formData.targetPages || []).includes(page);
                    return (
                      <button
                        type="button"
                        key={page}
                        onClick={() => {
                          const currentPages = Array.isArray(formData.targetPages) ? [...formData.targetPages] : [];
                          let newPages = currentPages.includes(page)
                            ? currentPages.filter((p) => p !== page)
                            : [...currentPages, page];
                          setFormData({
                            ...formData,
                            targetPages: newPages,
                            targetPage: newPages[0] || ''
                          });
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${isSelected
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-surface text-charcoal border-soft-gray/30 hover:border-primary/50'
                          }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5 inline mr-1" /> : <Plus className="w-3.5 h-3.5 inline mr-1" />}
                        {page}
                      </button>
                    );
                  })}
                </div>
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
                    placeholder="1199"
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
                    placeholder="20"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-charcoal bg-surface focus:ring-1 focus:ring-primary ${errors.stock ? 'border-error ring-1 ring-error' : 'border-soft-gray/25'
                      }`}
                  />
                  {errors.stock && <p className="text-xs text-error mt-1">{errors.stock}</p>}
                </div>
              </div>

              <CloudinaryUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                label="Product Gift Image"
                recommendedDimensions="800 × 800 px"
                aspectRatio="1:1 (square)"
              />
              {errors.image && <p className="text-xs text-error mt-1">{errors.image}</p>}
            </div>
          )}

          {/* TAB 2: DESCRIPTION & EXPERIENCE */}
          {activeModalTab === 'description' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                  Product Description
                </label>
                <textarea
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter detailed description, key highlights, materials, and gift story for this product..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-muted-charcoal mt-1">
                  Paragraph breaks and line formatting will be preserved in the customer storefront Description tab.
                </p>
              </div>

              {/* Perfect Occasions */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5">
                  Product Occasions & Gift Tags (For catalog filtering)
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {POPULAR_OCCASIONS.map((occ) => {
                    const isSelected = (formData.occasions || []).includes(occ);
                    return (
                      <button
                        type="button"
                        key={occ}
                        onClick={() => {
                          const current = Array.isArray(formData.occasions) ? [...formData.occasions] : [];
                          const updated = current.includes(occ)
                            ? current.filter(o => o !== occ)
                            : [...current, occ];
                          setFormData({ ...formData, occasions: updated });
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${isSelected
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-surface text-charcoal border-soft-gray/30 hover:border-primary/50'
                          }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5 inline mr-1" /> : <Plus className="w-3.5 h-3.5 inline mr-1" />}
                        {occ}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SPECIFICATIONS & IN THE BOX */}
          {activeModalTab === 'specs' && (
            <div className="space-y-4 animate-fade-in">
              {/* In The Box */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                  In The Box / Package Contents
                </label>
                <input
                  type="text"
                  value={formData.inTheBox}
                  onChange={(e) => setFormData({ ...formData, inTheBox: e.target.value })}
                  placeholder="e.g. 1x Moon Lamp, 1x Solid Wood Stand, 1x USB Cable, 1x Remote Control, 1x Luxury Box"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-soft-gray mt-1">
                  List the items customer receives inside the package.
                </p>
              </div>

              {/* Standard Specifications Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Material
                  </label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    placeholder="e.g. 3D Printed PLA Plastic / Solid Wood"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-soft-gray/25 text-charcoal bg-surface"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Dimensions / Size
                  </label>
                  <input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    placeholder="e.g. 15 cm x 15 cm x 18 cm"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-soft-gray/25 text-charcoal bg-surface"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Weight
                  </label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="e.g. 450 grams"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-soft-gray/25 text-charcoal bg-surface"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Color / Finish
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g. 16 Color RGB + Warm White"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-soft-gray/25 text-charcoal bg-surface"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    value={formData.countryOfOrigin}
                    onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })}
                    placeholder="India"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-soft-gray/25 text-charcoal bg-surface"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Care Instructions
                  </label>
                  <input
                    type="text"
                    value={formData.careInstructions}
                    onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                    placeholder="e.g. Clean with a soft dry cloth"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-soft-gray/25 text-charcoal bg-surface"
                  />
                </div>
              </div>

              {/* Dynamic Custom Specifications */}
              <div className="pt-2 border-t border-soft-gray/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-charcoal">
                    Additional Specifications (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCustomSpec}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Attribute
                  </button>
                </div>

                <div className="space-y-2">
                  {(formData.customSpecs || []).map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Key (e.g. Battery Life)"
                        value={spec.key}
                        onChange={(e) => handleUpdateCustomSpec(idx, 'key', e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-soft-gray/30 bg-surface text-charcoal"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 8-10 Hours)"
                        value={spec.value}
                        onChange={(e) => handleUpdateCustomSpec(idx, 'value', e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-soft-gray/30 bg-surface text-charcoal"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomSpec(idx)}
                        className="p-1.5 text-soft-gray hover:text-error hover:bg-error/10 rounded-lg cursor-pointer"
                        title="Delete attribute"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {(formData.customSpecs || []).length === 0 && (
                    <p className="text-xs text-soft-gray italic">
                      No additional custom attributes added yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SHIPPING & RETURNS */}
          {activeModalTab === 'shipping' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between p-3 rounded-xl bg-warm-ivory/60 border border-soft-gray/20">
                <div>
                  <h4 className="text-xs font-bold text-charcoal">Product Shipping & Return Guidelines</h4>
                  <p className="text-[11px] text-soft-gray">
                    Customize dispatch times, transit estimates, and return terms specifically for this gift.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFillDefaultShipping}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors cursor-pointer"
                  title="Auto-fill standard store defaults"
                >
                  <RotateCcw className="w-3 h-3" />
                  Fill Standard Defaults
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                  Dispatch Timeline
                </label>
                <input
                  type="text"
                  value={formData.dispatchTimeline}
                  onChange={(e) => setFormData({ ...formData, dispatchTimeline: e.target.value })}
                  placeholder="e.g. Orders placed before 4:00 PM IST are dispatched within 24 hours."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                  Transit & Delivery Estimates
                </label>
                <input
                  type="text"
                  value={formData.transitTimeline}
                  onChange={(e) => setFormData({ ...formData, transitTimeline: e.target.value })}
                  placeholder="e.g. Metro cities: 2-3 business days. Rest of India: 3-5 business days."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                  Free Shipping Threshold Note
                </label>
                <input
                  type="text"
                  value={formData.freeShippingNote}
                  onChange={(e) => setFormData({ ...formData, freeShippingNote: e.target.value })}
                  placeholder="e.g. Applied automatically on all orders above ₹999 across India."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                  Return & Replacement Policy
                </label>
                <textarea
                  rows={2}
                  value={formData.returnPolicy}
                  onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })}
                  placeholder="e.g. 7-day hassle-free replacement in the unlikely event of transit damage or defect."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 pb-2 border-t border-soft-gray/20">
            <div className="flex items-center gap-1.5 text-xs text-soft-gray">
              <span>Tab {activeModalTab === 'basic' ? '1/4' : activeModalTab === 'description' ? '2/4' : activeModalTab === 'specs' ? '3/4' : '4/4'}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-soft-gray/25 text-sm font-medium text-charcoal hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-primary text-surface text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
              >
                {editingProduct ? 'Save Changes' : 'Create Gift Product'}
              </button>
            </div>
          </div>
        </form>
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
