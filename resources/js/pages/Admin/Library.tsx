import React, { useState, useEffect } from 'react';
import { Library as LibraryIcon, Plus, Search, Edit, Trash2, X, RefreshCw, BookOpen } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { 
    adminLibraryService, 
    Book, 
    BookFormData, 
    LibraryStats, 
    BooksResponse, 
    ApiResponse 
} from '../../../services/AdminLibraryService';
import { 
    adminCategoryService,
    Category as CategoryType 
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
    category: string; // Can be category_id (number as string) or category name/slug
    page: number;
    per_page: number;
}

interface CategoryFilter {
    id: number;
    name: string;
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
// 📝 BOOK MODAL (For Add/Edit)
// ========================================================================

const BookModal: React.FC<{
    book: Book | null;
    onClose: () => void;
    onSave: (data: BookFormData) => Promise<void>;
    errors: Record<string, string[]>;
}> = ({ book, onClose, onSave, errors }) => {
    const [formData, setFormData] = useState<BookFormData>({
        isbn: book?.isbn || '',
        title: book?.title || '',
        author: book?.author || '',
        publisher: book?.publisher || '',
        publication_year: book?.publication_year || undefined,
        description: book?.description || '',
        category_id: book?.category_id || 0,
        total_copies: book?.total_copies || 1,
        available_copies: book?.available_copies || 1,
        location: book?.location || '',
        status: book?.status || 'available',
    });

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<CategoryType[]>([]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await adminCategoryService.getActiveCategories();
                if (response.success && response.data.length > 0) {
                    setCategories(response.data);
                    // Set default category if none selected or if value is 0
                    setFormData(prev => {
                        if (!prev.category_id || prev.category_id === 0) {
                            return { ...prev, category_id: response.data[0].id };
                        }
                        return prev;
                    });
                }
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        };
        loadCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        // Handle category_id as number
        if (name === 'category_id') {
            setFormData(prev => ({ 
                ...prev, 
                category_id: parseInt(value) || 0
            }));
            return;
        }
        
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' 
                ? parseInt(value) || 0 
                : value 
        }));
        
        // Auto-update available_copies if total_copies changes
        if (name === 'total_copies') {
            const newTotal = parseInt(value) || 0;
            setFormData(prev => ({
                ...prev,
                total_copies: newTotal,
                available_copies: Math.min(prev.available_copies, newTotal)
            }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-3xl transform overflow-hidden rounded-xl sm:rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-4 py-3 sm:px-6 sm:py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg sm:text-xl font-bold text-white">
                                {book ? 'Edit Book' : 'Add New Book'}
                            </h2>
                            <button onClick={onClose} className="rounded-full p-1.5 sm:p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="Book Title"
                                    required
                                />
                                {errors.title && (<p className="text-red-500 text-xs mt-1">{errors.title[0]}</p>)}
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Author</label>
                                <input
                                    type="text"
                                    name="author"
                                    value={formData.author}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="Author Name"
                                />
                                {errors.author && (<p className="text-red-500 text-xs mt-1">{errors.author[0]}</p>)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">ISBN</label>
                                <input
                                    type="text"
                                    name="isbn"
                                    value={formData.isbn}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="ISBN Number"
                                />
                                {errors.isbn && (<p className="text-red-500 text-xs mt-1">{errors.isbn[0]}</p>)}
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Category *</label>
                                <select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                    required
                                >
                                    <option value={0}>Select Category</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && (<p className="text-red-500 text-xs mt-1">{errors.category_id[0]}</p>)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Publisher</label>
                                <input
                                    type="text"
                                    name="publisher"
                                    value={formData.publisher}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="Publisher Name"
                                />
                                {errors.publisher && (<p className="text-red-500 text-xs mt-1">{errors.publisher[0]}</p>)}
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Publication Year</label>
                                <input
                                    type="number"
                                    name="publication_year"
                                    value={formData.publication_year || ''}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="YYYY"
                                    min="1000"
                                    max={new Date().getFullYear() + 1}
                                />
                                {errors.publication_year && (<p className="text-red-500 text-xs mt-1">{errors.publication_year[0]}</p>)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Total Copies *</label>
                                <input
                                    type="number"
                                    name="total_copies"
                                    value={formData.total_copies}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    min="1"
                                    required
                                />
                                {errors.total_copies && (<p className="text-red-500 text-xs mt-1">{errors.total_copies[0]}</p>)}
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Available Copies *</label>
                                <input
                                    type="number"
                                    name="available_copies"
                                    value={formData.available_copies}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    min="0"
                                    max={formData.total_copies}
                                    required
                                />
                                {errors.available_copies && (<p className="text-red-500 text-xs mt-1">{errors.available_copies[0]}</p>)}
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Status *</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                    required
                                >
                                    <option value="available">Available</option>
                                    <option value="borrowed">Borrowed</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="lost">Lost</option>
                                </select>
                                {errors.status && (<p className="text-red-500 text-xs mt-1">{errors.status[0]}</p>)}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Location</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                placeholder="e.g., Shelf A-101"
                            />
                            {errors.location && (<p className="text-red-500 text-xs mt-1">{errors.location[0]}</p>)}
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                rows={3}
                                placeholder="Book description or summary..."
                            />
                            {errors.description && (<p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>)}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
                            <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium" disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className={`w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base ${PRIMARY_COLOR_CLASS} text-white rounded-lg sm:rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg disabled:opacity-50`} disabled={loading}>
                                {loading ? 'Saving...' : book ? 'Update Book' : 'Add Book'}
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

const DeleteBookModal: React.FC<{
    book: Book;
    onClose: () => void;
    onConfirm: (id: number) => Promise<void>;
}> = ({ book, onClose, onConfirm }) => {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await onConfirm(book.id);
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
                            Are you absolutely sure you want to delete the book: 
                            <strong className="text-red-700 block mt-1">{book.title}</strong>? 
                            This action cannot be undone.
                        </p>
                        
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
                                disabled={loading}
                            >
                                {loading ? 'Deleting...' : 'Delete Book'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 🏠 MAIN LIBRARY PAGE
// ========================================================================

const Library: React.FC = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false); 
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    
    const [filters, setFilters] = useState<Filters>({
        search: '',
        category: '',
        page: 1,
        per_page: 15,
    });

    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    const [stats, setStats] = useState<LibraryStats>({
        total_books: 0,
        available_books: 0,
        borrowed_books: 0,
        lost_books: 0,
        total_copies: 0,
        available_copies: 0,
        borrowed_copies: 0,
        by_category: {},
    });

    const [categoryFilters, setCategoryFilters] = useState<CategoryFilter[]>([]);

    useEffect(() => {
        loadBooks();
        loadStats();
        loadCategoryFilters();
    }, []);

    const loadCategoryFilters = async () => {
        try {
            const response = await adminCategoryService.getActiveCategories();
            if (response.success) {
                setCategoryFilters(response.data.map(cat => ({ id: cat.id, name: cat.name })));
            }
        } catch (error) {
            console.error('Error loading category filters:', error);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadBooks();
        }, 500);
        
        return () => clearTimeout(delayDebounceFn);
    }, [filters.search, filters.category, filters.page, filters.per_page]);

    const loadBooks = async () => {
        setLoading(true);
        try {
            const apiFilters: any = {
                page: filters.page,
                per_page: filters.per_page,
            };
            
            if (filters.search) {
                apiFilters.search = filters.search;
            }
            
            if (filters.category) {
                apiFilters.category = filters.category;
            }
            
            const response: BooksResponse = await adminLibraryService.getBooks(apiFilters);
            if (response.success) {
                setBooks(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Error loading books:', error);
            setNotification({ type: 'error', message: 'Failed to load library data' });
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await adminLibraryService.getLibraryStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error loading library stats:', error);
        }
    };

    const handleAdd = () => {
        setSelectedBook(null);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleEdit = (book: Book) => {
        setSelectedBook(book);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleSave = async (data: BookFormData) => {
        // Ensure category_id is a number and is valid
        const bookData = {
            ...data,
            category_id: typeof data.category_id === 'string' ? parseInt(data.category_id) : data.category_id
        };
        
        if (!bookData.category_id || bookData.category_id === 0) {
            setValidationErrors({ category_id: ['Please select a category'] });
            return;
        }
        
        try {
            let response: ApiResponse<Book>;
            if (selectedBook) {
                response = await adminLibraryService.updateBook(selectedBook.id, bookData);
                setNotification({ type: 'success', message: 'Book updated successfully!' });
            } else {
                response = await adminLibraryService.createBook(bookData);
                setNotification({ type: 'success', message: 'Book added successfully!' });
            }
            
            if (response.success) {
                setShowModal(false);
                loadBooks();
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
            setNotification({ type: 'error', message: error.message || 'Failed to save book' });
        }
    };

    const handleDelete = (book: Book) => {
        setSelectedBook(book);
        setShowDeleteModal(true);
    };

    const getCategoryBadgeColor = (category?: { name?: string; color?: string }) => {
        if (category?.color) {
            // Use the category's custom color, but with better contrast for text
            return 'text-white';
        }
        // Fallback colors based on category name
        switch (category?.name) {
            case 'Fiction':
                return 'bg-purple-100 text-purple-800';
            case 'Non-Fiction':
                return 'bg-blue-100 text-blue-800';
            case 'Textbook':
                return 'bg-orange-100 text-orange-800';
            case 'Reference':
                return 'bg-indigo-100 text-indigo-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleConfirmDelete = async (id: number) => {
        try {
            await adminLibraryService.deleteBook(id);
            setNotification({ type: 'success', message: 'Book deleted successfully!' });
            setShowDeleteModal(false);
            loadBooks();
            loadStats();
        } catch (error: any) {
            console.error('Error deleting book:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to delete book' });
            setShowDeleteModal(false);
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'available':
                return 'bg-green-100 text-green-800';
            case 'borrowed':
                return 'bg-yellow-100 text-yellow-800';
            case 'maintenance':
                return 'bg-blue-100 text-blue-800';
            case 'lost':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };


    return (
        <AppLayout>
            <div className="min-h-screen bg-[#f3f4f6] dark:bg-gray-900">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
                    <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-4 sm:mb-6 md:mb-0">
                            <div className={`${PRIMARY_COLOR_CLASS} p-2 sm:p-3 rounded-lg sm:rounded-xl mr-2 sm:mr-3 md:mr-4`}>
                                <LibraryIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Library Management</h1>
                                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Manage library books and catalog</p>
                            </div>
                        </div>
                        <div className="flex space-x-2 sm:space-x-3">
                            <button 
                                onClick={handleAdd}
                                className={`inline-flex items-center px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-lg sm:rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-lg font-medium text-xs sm:text-sm md:text-base`}
                            >
                                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Add Book</span>
                                <span className="sm:hidden">Add</span>
                            </button>
                            
                            <button 
                                onClick={() => { loadBooks(); loadStats(); }}
                                className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-white border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards - Compact on Mobile */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-2 sm:p-4 md:p-5 border border-gray-100">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1 truncate">Available</p>
                                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 leading-tight">{stats.available_books}</p>
                                </div>
                                <div className="bg-green-100 p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
                                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-2 sm:p-4 md:p-5 border border-gray-100">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1 truncate">Borrowed</p>
                                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-600 leading-tight">{stats.borrowed_books || 0}</p>
                                </div>
                                <div className="bg-yellow-100 p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
                                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7 text-yellow-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-2 sm:p-4 md:p-5 border border-gray-100">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1 truncate">Lost</p>
                                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600 leading-tight">{stats.lost_books || 0}</p>
                                </div>
                                <div className="bg-red-100 p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
                                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7 text-red-600" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-2 sm:p-4 md:p-5 border border-gray-100">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1 truncate">Total</p>
                                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{stats.total_books}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl flex-shrink-0`}>
                                    <BookOpen className={`h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7 ${TEXT_COLOR_CLASS}`} />
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
                                    placeholder="Search by title, author, ISBN..."
                                />
                            </div>
                            <div>
                                <select
                                    value={filters.category}
                                    onChange={(e) => setFilters({...filters, category: e.target.value, page: 1})}
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all text-sm sm:text-base`}
                                >
                                    <option value="">All Categories</option>
                                    {categoryFilters.map((category) => (
                                        <option key={category.id} value={category.id.toString()}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table - Responsive: Mobile shows Title & Actions, Desktop shows all columns */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Title</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Author</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Category</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Copies</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Status</th>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                                <div className="flex justify-center">
                                                    <RefreshCw className={`h-6 w-6 sm:h-8 sm:w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : books.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-3 sm:mb-4" />
                                                    <p className="text-base sm:text-lg font-medium">No books found</p>
                                                    <p className="text-xs sm:text-sm">Add a new book or adjust filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        books.map((book) => (
                                            <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                    <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{book.title}</div>
                                                    {book.isbn && <div className="text-xs text-gray-500 truncate">ISBN: {book.isbn}</div>}
                                                    {/* Show additional info on mobile */}
                                                    <div className="md:hidden mt-1 space-y-1">
                                                        <div className="text-xs text-gray-600">Author: {book.author || 'N/A'}</div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {book.category ? (
                                                                <span 
                                                                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryBadgeColor(book.category)}`}
                                                                    style={book.category.color ? { backgroundColor: book.category.color } : {}}
                                                                >
                                                                    {book.category.name}
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                                                    N/A
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-gray-600">{book.available_copies} / {book.total_copies}</span>
                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeColor(book.status)}`}>
                                                                {book.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{book.author || 'N/A'}</td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    {book.category ? (
                                                        <span 
                                                            className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadgeColor(book.category)}`}
                                                            style={book.category.color ? { backgroundColor: book.category.color } : {}}
                                                        >
                                                            {book.category.name}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                                            N/A
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                                                    {book.available_copies} / {book.total_copies}
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(book.status)}`}>
                                                        {book.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end space-x-1 sm:space-x-2">
                                                        <button
                                                            onClick={() => handleEdit(book)}
                                                            className={`p-1.5 sm:p-2 ${TEXT_COLOR_CLASS} ${LIGHT_HOVER_CLASS} rounded-lg transition-colors`}
                                                            title="Edit Book"
                                                        >
                                                            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(book)}
                                                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Book"
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
                        <BookModal
                            book={selectedBook}
                            onClose={() => setShowModal(false)}
                            onSave={handleSave}
                            errors={validationErrors}
                        />
                    )}

                    {showDeleteModal && selectedBook && (
                        <DeleteBookModal
                            book={selectedBook}
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

export default Library;

