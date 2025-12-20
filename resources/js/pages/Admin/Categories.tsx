import React, { useState, useEffect } from 'react';
import { Tag, Plus, Search, Edit, Trash2, X, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { 
    adminCategoryService, 
    Category, 
    CategoryFormData, 
    CategoryStats, 
    CategoriesResponse, 
    ApiResponse 
} from '../../../services/AdminCategoryService';

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]';

// ========================================================================
// 📦 INTERFACES 
// ========================================================================

interface Notification {
    type: 'success' | 'error';
    message: string;
}

interface Filters {
    search: string;
    is_active: string;
    page: number;
    per_page: number;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

// ========================================================================
// 🔔 NOTIFICATION COMPONENT
// ========================================================================

const Notification: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = notification.type === 'success' 
        ? PRIMARY_COLOR_CLASS
        : 'bg-gradient-to-r from-red-500 to-red-600';

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
            <div className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                    <div className="font-medium">{notification.message}</div>
                    <button 
                        onClick={onClose}
                        className="ml-4 rounded-full p-1 hover:bg-white/20 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 📝 CATEGORY MODAL (For Add/Edit)
// ========================================================================

const CategoryModal: React.FC<{
    category: Category | null;
    onClose: () => void;
    onSave: (data: CategoryFormData) => Promise<void>;
    errors: Record<string, string[]>;
}> = ({ category, onClose, onSave, errors }) => {
    const [formData, setFormData] = useState<CategoryFormData>({
        name: category?.name || '',
        slug: category?.slug || '',
        description: category?.description || '',
        color: category?.color || '#6366f1',
        is_active: category?.is_active ?? true,
        sort_order: category?.sort_order || 0,
    });

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' 
                ? (e.target as HTMLInputElement).checked
                : type === 'number'
                ? parseInt(value) || 0
                : value 
        }));
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl sm:rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-4 py-3 sm:px-6 sm:py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg sm:text-xl font-bold text-white">
                                {category ? 'Edit Category' : 'Add New Category'}
                            </h2>
                            <button onClick={onClose} className="rounded-full p-1.5 sm:p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="Category Name"
                                    required
                                />
                                {errors.name && (<p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>)}
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Slug</label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="auto-generated"
                                />
                                {errors.slug && (<p className="text-red-500 text-xs mt-1">{errors.slug[0]}</p>)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        name="color"
                                        value={formData.color}
                                        onChange={handleChange}
                                        className="h-10 sm:h-12 w-14 sm:w-16 border border-gray-200 rounded-lg sm:rounded-xl cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={formData.color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                        className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                        placeholder="#6366f1"
                                        pattern="^#[0-9A-Fa-f]{6}$"
                                    />
                                </div>
                                {errors.color && (<p className="text-red-500 text-xs mt-1">{errors.color[0]}</p>)}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Sort Order</label>
                                    <input
                                        type="number"
                                        name="sort_order"
                                        value={formData.sort_order}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                        min="0"
                                    />
                                    {errors.sort_order && (<p className="text-red-500 text-xs mt-1">{errors.sort_order[0]}</p>)}
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Status</label>
                                    <label className="flex items-center h-10 sm:h-12 px-3 sm:px-4 border border-gray-200 rounded-lg sm:rounded-xl bg-gray-50">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={formData.is_active}
                                            onChange={handleChange}
                                            className="w-4 h-4 sm:w-5 sm:h-5 text-[#003366] border-gray-300 rounded focus:ring-[#003366]"
                                        />
                                        <span className="ml-2 text-xs sm:text-sm text-gray-700">Active</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                rows={3}
                                placeholder="Category description..."
                            />
                            {errors.description && (<p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>)}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
                            <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium" disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className={`w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base ${PRIMARY_COLOR_CLASS} text-white rounded-lg sm:rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg disabled:opacity-50`} disabled={loading}>
                                {loading ? 'Saving...' : category ? 'Update Category' : 'Add Category'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// ❌ DELETE CONFIRMATION MODAL
// ========================================================================

const DeleteCategoryModal: React.FC<{
    category: Category;
    onClose: () => void;
    onConfirm: (id: number) => Promise<void>;
}> = ({ category, onClose, onConfirm }) => {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await onConfirm(category.id);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className="bg-red-600 px-6 py-4">
                        <h2 className="text-xl font-bold text-white">Confirm Deletion</h2>
                    </div>
                    
                    <div className="p-6">
                        <p className="text-gray-600 mb-4">
                            Are you absolutely sure you want to delete the category: 
                            <strong className="text-red-700 block mt-1">{category.name}</strong>? 
                            This action cannot be undone.
                        </p>
                        {category.books_count && category.books_count > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-yellow-800">
                                    <strong>Warning:</strong> This category has {category.books_count} book(s). You cannot delete it until all books are reassigned or removed.
                                </p>
                            </div>
                        )}
                        
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium shadow-lg disabled:opacity-50"
                                disabled={loading || (category.books_count && category.books_count > 0)}
                            >
                                {loading ? 'Deleting...' : 'Delete Category'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 🏠 MAIN CATEGORIES PAGE
// ========================================================================

const Categories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false); 
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    
    const [filters, setFilters] = useState<Filters>({
        search: '',
        is_active: '',
        page: 1,
        per_page: 15,
    });

    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    const [stats, setStats] = useState<CategoryStats>({
        total_categories: 0,
        active_categories: 0,
        categories_with_books: 0,
        by_category: [],
    });

    useEffect(() => {
        loadCategories();
        loadStats();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadCategories();
        }, 500);
        
        return () => clearTimeout(delayDebounceFn);
    }, [filters.search, filters.is_active, filters.page, filters.per_page]);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const apiFilters: any = {
                page: filters.page,
                per_page: filters.per_page,
            };
            
            if (filters.search) {
                apiFilters.search = filters.search;
            }
            
            if (filters.is_active !== '') {
                apiFilters.is_active = filters.is_active === 'true';
            }
            
            const response: CategoriesResponse = await adminCategoryService.getCategories(apiFilters);
            if (response.success) {
                setCategories(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            setNotification({ type: 'error', message: 'Failed to load category data' });
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await adminCategoryService.getCategoryStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error loading category stats:', error);
        }
    };

    const handleAdd = () => {
        setSelectedCategory(null);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleEdit = (category: Category) => {
        setSelectedCategory(category);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleSave = async (data: CategoryFormData) => {
        try {
            let response: ApiResponse<Category>;
            if (selectedCategory) {
                response = await adminCategoryService.updateCategory(selectedCategory.id, data);
                setNotification({ type: 'success', message: 'Category updated successfully!' });
            } else {
                response = await adminCategoryService.createCategory(data);
                setNotification({ type: 'success', message: 'Category added successfully!' });
            }
            
            if (response.success) {
                setShowModal(false);
                loadCategories();
                loadStats();
                setValidationErrors({});
            }
        } catch (error: any) {
            if (error.message && error.message.includes(':')) {
                const errorsObj: Record<string, string[]> = {};
                error.message.split(';').forEach((err: string) => {
                    const [field, msg] = err.split(':').map((s: string) => s.trim());
                    if (field && msg) {
                        errorsObj[field] = [msg];
                    }
                });
                setValidationErrors(errorsObj);
            }
            setNotification({ type: 'error', message: error.message || 'Failed to save category' });
        }
    };

    const handleDelete = (category: Category) => {
        setSelectedCategory(category);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async (id: number) => {
        try {
            await adminCategoryService.deleteCategory(id);
            setNotification({ type: 'success', message: 'Category deleted successfully!' });
            setShowDeleteModal(false);
            loadCategories();
            loadStats();
        } catch (error: any) {
            console.error('Error deleting category:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to delete category' });
            setShowDeleteModal(false);
        }
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-[#f3f4f6] dark:bg-gray-900">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
                    <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-4 sm:mb-6 md:mb-0">
                            <div className={`${PRIMARY_COLOR_CLASS} p-2 sm:p-3 rounded-lg sm:rounded-xl mr-2 sm:mr-3 md:mr-4`}>
                                <Tag className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Category Management</h1>
                                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Manage library book categories</p>
                            </div>
                        </div>
                        <div className="flex space-x-2 sm:space-x-3">
                            <button 
                                onClick={handleAdd}
                                className={`inline-flex items-center px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-lg sm:rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-lg font-medium text-xs sm:text-sm md:text-base`}
                            >
                                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Add Category</span>
                                <span className="sm:hidden">Add</span>
                            </button>
                            
                            <button 
                                onClick={() => { loadCategories(); loadStats(); }}
                                className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-white border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards - Centered layout with icon below value */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 border border-gray-100">
                            <div className="flex flex-col items-center text-center">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Total</p>
                                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">{stats.total_categories}</p>
                                <div className={`${LIGHT_BG_CLASS} p-2 sm:p-3 rounded-full`}>
                                    <Tag className={`h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 border border-gray-100">
                            <div className="flex flex-col items-center text-center">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Active</p>
                                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 mb-2 sm:mb-3">{stats.active_categories}</p>
                                <div className="bg-green-100 p-2 sm:p-3 rounded-full">
                                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 border border-gray-100 col-span-2 sm:col-span-1">
                            <div className="flex flex-col items-center text-center">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">With Books</p>
                                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 mb-2 sm:mb-3">{stats.categories_with_books}</p>
                                <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                                    <Tag className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters - Compact on Mobile */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                                    className={`pl-10 sm:pl-12 w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all text-sm sm:text-base`}
                                    placeholder="Search categories..."
                                />
                            </div>
                            <div>
                                <select
                                    value={filters.is_active}
                                    onChange={(e) => setFilters({...filters, is_active: e.target.value, page: 1})}
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all text-sm sm:text-base`}
                                >
                                    <option value="">All Status</option>
                                    <option value="true">Active Only</option>
                                    <option value="false">Inactive Only</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table - Responsive: Mobile shows Name & Actions, Desktop shows all columns */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Name</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Slug</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Color</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Books</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Status</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Sort Order</th>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                                <div className="flex justify-center">
                                                    <RefreshCw className={`h-6 w-6 sm:h-8 sm:w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : categories.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <Tag className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-3 sm:mb-4" />
                                                    <p className="text-base sm:text-lg font-medium">No categories found</p>
                                                    <p className="text-xs sm:text-sm">Add a new category or adjust filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        categories.map((category) => (
                                            <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                    <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{category.name}</div>
                                                    {category.description && (
                                                        <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                                                            {category.description}
                                                        </div>
                                                    )}
                                                    {/* Show additional info on mobile */}
                                                    <div className="md:hidden mt-1 space-y-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <div className="flex items-center">
                                                                <div 
                                                                    className="w-4 h-4 rounded-full border border-gray-200"
                                                                    style={{ backgroundColor: category.color }}
                                                                ></div>
                                                                <span className="ml-1 text-xs text-gray-600">{category.color}</span>
                                                            </div>
                                                            <span className="text-xs text-gray-600">{category.books_count || 0} books</span>
                                                            {category.is_active ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                                    <CheckCircle className="h-3 w-3 mr-0.5" />
                                                                    Active
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                                                    <XCircle className="h-3 w-3 mr-0.5" />
                                                                    Inactive
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{category.slug}</td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div 
                                                            className="w-8 h-8 rounded-full border-2 border-gray-200"
                                                            style={{ backgroundColor: category.color }}
                                                        ></div>
                                                        <span className="ml-2 text-xs text-gray-600">{category.color}</span>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                                                    {category.books_count || 0}
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    {category.is_active ? (
                                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                                                    {category.sort_order}
                                                </td>
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end space-x-1 sm:space-x-2">
                                                        <button
                                                            onClick={() => handleEdit(category)}
                                                            className={`p-1.5 sm:p-2 ${TEXT_COLOR_CLASS} ${LIGHT_HOVER_CLASS} rounded-lg transition-colors`}
                                                            title="Edit Category"
                                                        >
                                                            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(category)}
                                                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Category"
                                                        >
                                                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Modals */}
                    {showModal && (
                        <CategoryModal
                            category={selectedCategory}
                            onClose={() => setShowModal(false)}
                            onSave={handleSave}
                            errors={validationErrors}
                        />
                    )}

                    {showDeleteModal && selectedCategory && (
                        <DeleteCategoryModal
                            category={selectedCategory}
                            onClose={() => setShowDeleteModal(false)}
                            onConfirm={handleConfirmDelete}
                        />
                    )}

                    {notification && (
                        <Notification
                            notification={notification}
                            onClose={() => setNotification(null)}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default Categories;

