import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CloudinaryUpload } from '../common/CloudinaryUpload';

export const CategoriesModule = () => {
  const {
    categories,
    products,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryActive
  } = useAdmin();

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', image: '' });
  const [catErrors, setCatErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleOpenAddCat = () => {
    setEditingCategory(null);
    setCatForm({ name: '', slug: '', description: '', image: '' });
    setCatErrors({});
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat) => {
    setEditingCategory(cat);
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || ''
    });
    setCatErrors({});
    setIsCatModalOpen(true);
  };

  const handleCatSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!catForm.name.trim()) errs.name = 'Category name is required.';
    if (Object.keys(errs).length > 0) {
      setCatErrors(errs);
      return;
    }

    const autoSlug = (catForm.slug?.trim() || catForm.name.trim())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const finalForm = {
      ...catForm,
      slug: autoSlug || 'category'
    };

    if (editingCategory) {
      updateCategory(editingCategory._id || editingCategory.id, finalForm);
    } else {
      addCategory(finalForm);
    }
    setIsCatModalOpen(false);
  };

  const executeDelete = () => {
    if (!deleteTarget) return;
    deleteCategory(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal tracking-tight">Gift Categories</h1>
          <p className="text-sm text-soft-gray mt-1">
            Organize customer gift exploration by product categories.
          </p>
        </div>

        <button
          onClick={handleOpenAddCat}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-surface font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.length === 0 ? (
          <div className="col-span-full bg-surface p-12 rounded-2xl border border-soft-gray/20 text-center shadow-card">
            <Tag className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-base font-bold text-charcoal">No Gift Categories Yet</h3>
            <p className="text-xs text-soft-gray mt-1 max-w-sm mx-auto leading-relaxed">
              Define gift categories (e.g. Personalized Gifts, Hampers, Accessories) to structure your gift catalog.
            </p>
            <button
              onClick={handleOpenAddCat}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-surface text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Category
            </button>
          </div>
        ) : (
          categories.map((cat) => {
            const itemCount = products.filter((p) => p.category === cat.name).length;
            return (
              <div
                key={cat._id || cat.id}
                className="bg-surface rounded-2xl border border-soft-gray/20 shadow-card overflow-hidden flex flex-col justify-between hover:shadow-card-hover transition-all"
              >
                <div>
                  <div className="h-40 relative bg-[#FAF7F5] p-2 flex items-center justify-center">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="max-h-full max-w-full object-contain"
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
                      className={`w-full h-full items-center justify-center bg-secondary/15 text-primary ${cat.image ? 'hidden' : 'flex'
                        }`}
                    >
                      <Tag className="w-8 h-8 text-primary/50" />
                    </div>
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => toggleCategoryActive(cat._id || cat.id)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm border ${cat.active
                            ? 'bg-surface text-success border-success/30'
                            : 'bg-surface text-soft-gray border-soft-gray/30'
                          }`}
                      >
                        {cat.active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-base text-charcoal">{cat.name}</h3>
                    <p className="text-xs text-soft-gray mt-2 line-clamp-2 leading-relaxed">
                      {cat.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-soft-gray/10 mt-2">
                  <span className="text-xs font-semibold text-charcoal">
                    {itemCount} active product{itemCount === 1 ? '' : 's'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditCat(cat)}
                      className="p-1.5 rounded-lg text-soft-gray hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteTarget({ id: cat._id || cat.id, name: cat.name })
                      }
                      className="p-1.5 rounded-lg text-soft-gray hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCategory ? 'Edit Gift Category' : 'Create New Category'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCatSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={catForm.name}
              onChange={(e) => {
                const name = e.target.value;
                setCatForm({
                  ...catForm,
                  name,
                  slug: editingCategory ? catForm.slug : name.toLowerCase().replace(/\s+/g, '-')
                });
              }}
              placeholder="e.g. Personalized Wooden Gifts"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-charcoal bg-surface focus:ring-1 focus:ring-primary ${catErrors.name ? 'border-error' : 'border-soft-gray/25'
                }`}
            />
            {catErrors.name && <p className="text-xs text-error mt-1">{catErrors.name}</p>}
          </div>


          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={catForm.description}
              onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              placeholder="Short description for customer browsing..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-soft-gray/25 text-sm text-charcoal bg-surface focus:ring-1 focus:ring-primary"
            />
          </div>

          <CloudinaryUpload
            value={catForm.image}
            onChange={(url) => setCatForm({ ...catForm, image: url })}
            label="Category Banner Image"
          />

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsCatModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-soft-gray/25 text-sm font-medium text-charcoal hover:border-primary hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary text-surface text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
            >
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Items tagged with this category will remain in catalog.`}
      />
    </div>
  );
};
