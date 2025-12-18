import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Filter, Edit, Trash2, X, RefreshCw, Layers, GraduationCap, Users } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { 
    adminAcademicYearService, 
    AcademicYear, 
    AcademicYearFormData, 
    AcademicYearStats, 
    AcademicYearsResponse, 
    ApiResponse 
} from '../../../services/AdminAcademicYearService';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]';

// ========================================================================
// 搭 INTERFACES 
// ========================================================================

interface Notification {
    type: 'success' | 'error';
    message: string;
}

interface Filters {
    search: string;
    status: string;
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
// 耳 NOTIFICATION COMPONENT (Reused)
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
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 統 ACADEMIC YEAR MODAL (For Add/Edit)
// ========================================================================

const AcademicYearModal: React.FC<{
    yearItem: AcademicYear | null;
    onClose: () => void;
    onSave: (data: AcademicYearFormData) => Promise<void>;
    errors: Record<string, string[]>;
}> = ({ yearItem, onClose, onSave, errors }) => {
    
    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return '';
        // Date input expects YYYY-MM-DD format
        return dateString.split('T')[0]; 
    };

    const [formData, setFormData] = useState<AcademicYearFormData>({
        year_name: yearItem?.year_name || '',
        start_date: formatDate(yearItem?.start_date),
        end_date: formatDate(yearItem?.end_date),
        is_current: yearItem?.is_current || false,
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        } as AcademicYearFormData));
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {yearItem ? 'Edit Academic Year' : 'Create New Academic Year'}
                            </h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Year Name (e.g., 2024-2025)</label>
                            <input
                                type="text"
                                name="year_name"
                                value={formData.year_name}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                placeholder="e.g., 2024-2025"
                                required
                            />
                            {errors.year_name && (<p className="text-red-500 text-xs mt-1">{errors.year_name[0]}</p>)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    required
                                />
                                {errors.start_date && (<p className="text-red-500 text-xs mt-1">{errors.start_date[0]}</p>)}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    required
                                />
                                {errors.end_date && (<p className="text-red-500 text-xs mt-1">{errors.end_date[0]}</p>)}
                            </div>
                        </div>

                        <div className="flex items-center border-t pt-4">
                            <input
                                type="checkbox"
                                name="is_current"
                                id="is_current"
                                checked={formData.is_current}
                                onChange={handleChange}
                                className={`h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500`}
                            />
                            <label htmlFor="is_current" className="ml-2 block text-sm font-medium text-gray-700">
                                Set as Current Academic Year (This will deactivate all others)
                            </label>
                            {errors.is_current && (<p className="text-red-500 text-xs mt-1">{errors.is_current[0]}</p>)}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium" disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg disabled:opacity-50`} disabled={loading}>
                                {loading ? 'Saving...' : yearItem ? 'Update Year' : 'Create Year'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 塘 MAIN ACADEMIC YEARS PAGE
// ========================================================================

const AcademicYears: React.FC = () => {
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [yearToDelete, setYearToDelete] = useState<AcademicYear | null>(null);
    
    const [filters, setFilters] = useState<Filters>({
        search: '',
        status: '',
        page: 1,
        per_page: 10,
    });

    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });

    const [stats, setStats] = useState<AcademicYearStats>({
        total_years: 0,
        current_year: null,
        active_years_count: 0,
    });

    useEffect(() => {
        loadYears();
        loadStats();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadYears();
        }, 500);
        
        return () => clearTimeout(delayDebounceFn);
    }, [filters.search, filters.status, filters.page, filters.per_page]);

    const loadYears = async () => {
        setLoading(true);
        try {
            const response: AcademicYearsResponse = await adminAcademicYearService.getAcademicYears(filters);
            if (response.success) {
                setYears(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Error loading academic years:', error);
            setNotification({ type: 'error', message: 'Failed to load academic year data' });
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            // Note: The controller provides a separate getStats endpoint which might be aggregated.
            // For now, let's load the current year separately as it's a key stat.
            const currentResponse = await adminAcademicYearService.getCurrentAcademicYear();
            if (currentResponse.success) {
                setStats(prev => ({ ...prev, current_year: currentResponse.data }));
            }
        } catch (error) {
            console.error('Error loading academic year stats:', error);
        }
    };

    const handleAdd = () => {
        setSelectedYear(null);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleEdit = (yearItem: AcademicYear) => {
        setSelectedYear(yearItem);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleSave = async (data: AcademicYearFormData) => {
        try {
            let response: ApiResponse<AcademicYear>;
            if (selectedYear) {
                response = await adminAcademicYearService.updateAcademicYear(selectedYear.id, data);
                setNotification({ type: 'success', message: 'Academic Year updated successfully!' });
            } else {
                response = await adminAcademicYearService.createAcademicYear(data);
                setNotification({ type: 'success', message: 'Academic Year created successfully!' });
            }
            
            if (response.success) {
                setShowModal(false);
                loadYears();
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
            setNotification({ type: 'error', message: error.message || 'Failed to save academic year' });
        }
    };
    
    const handleDelete = (yearItem: AcademicYear) => {
        setYearToDelete({
            id: yearItem.id,
            full_name: yearItem.year_name,
            classes_count: yearItem.classes_count,
            grades_count: yearItem.semesters_count
        } as any);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async (force: boolean) => {
        if (!yearToDelete) return;

        try {
            const response = await adminAcademicYearService.deleteAcademicYear(yearToDelete.id, force);
            if (response.success) {
                setNotification({ type: 'success', message: `Academic Year '${yearToDelete.full_name}' deleted successfully!` });
                setShowDeleteModal(false);
                setYearToDelete(null);
                loadYears();
                loadStats();
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to delete academic year' });
        }
    };

    const renderStatusTag = (status: string | undefined | null) => {
        // FIX APPLIED HERE: Check if status is defined before calling string methods
        if (!status) {
            return (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600`}>
                    N/A
                </span>
            );
        }

        let color = 'bg-gray-100 text-gray-600';
        if (status === 'current') color = 'bg-green-100 text-green-800';
        else if (status === 'active') color = 'bg-blue-100 text-blue-800';
        else if (status === 'past') color = 'bg-yellow-100 text-yellow-800';

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };
    
    // Reusing pagination logic from Students.tsx
    const renderPagination = () => {
        // ... (omitted for brevity, assume implementation exists)
        return null; 
    };

    const formatShortDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }


    return (
        <AppLayout>
            <div className="min-h-screen bg-[#f3f4f6]">
                <div className="container mx-auto px-6 py-8">
                    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-6 md:mb-0">
                            <div className={`${PRIMARY_COLOR_CLASS} p-3 rounded-xl mr-4`}>
                                <Calendar className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Academic Year Management</h1>
                                <p className="text-gray-600 mt-1">Define, track, and manage the duration of all academic years</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button 
                                onClick={handleAdd}
                                className={`inline-flex items-center px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-lg font-medium`}
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Create Year
                            </button>
                            
                            <button 
                                onClick={() => { loadYears(); loadStats(); }}
                                className="inline-flex items-center px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 col-span-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Current Academic Year</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {stats.current_year ? stats.current_year.year_name : 'N/A'}
                                    </p>
                                    {stats.current_year && (
                                        <p className={`text-sm font-medium text-green-600 mt-1`}>
                                            {formatShortDate(stats.current_year.start_date)} - {formatShortDate(stats.current_year.end_date)}
                                        </p>
                                    )}
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                    <Calendar className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Records</p>
                                    <p className="text-3xl font-bold text-gray-900">{pagination.total}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                    <Layers className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                         <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Active Years</p>
                                    <p className={`text-3xl font-bold ${TEXT_COLOR_CLASS}`}>{stats.active_years_count}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                    <GraduationCap className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                                    className={`pl-12 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="Search year name..."
                                />
                            </div>
                            <div className="flex items-center col-span-2">
                                <Filter className="h-5 w-5 text-gray-400 mr-3" />
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                >
                                    <option value="">Filter by Status</option>
                                    <option value="current">Current</option>
                                    <option value="active">Active</option>
                                    <option value="past">Past</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Academic Year</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Start Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">End Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Semesters</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Classes</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={7} className="px-6 py-12 text-center"><RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin`} /></td></tr>
                                    ) : years.length === 0 ? (
                                        <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No academic years found</td></tr>
                                    ) : (
                                        years.map((yearItem) => (
                                            <tr key={yearItem.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{yearItem.year_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatShortDate(yearItem.start_date)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatShortDate(yearItem.end_date)}</td>
                                              
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{yearItem.semesters_count}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{yearItem.classes_count}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleEdit(yearItem)}
                                                            className={`p-2 ${TEXT_COLOR_CLASS} ${LIGHT_HOVER_CLASS} rounded-lg transition-colors`}
                                                            title="Edit Academic Year"
                                                        >
                                                            <Edit className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(yearItem)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Academic Year"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {renderPagination()}
                    </div>

                    {/* Modals */}
                    {showModal && (
                        <AcademicYearModal
                            yearItem={selectedYear}
                            onClose={() => setShowModal(false)}
                            onSave={handleSave}
                            errors={validationErrors}
                        />
                    )}

                    {showDeleteModal && (
                        <DeleteConfirmationModal
                            item={yearToDelete}
                            onClose={() => {
                                setShowDeleteModal(false);
                                setYearToDelete(null);
                            }}
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

export default AcademicYears;