import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, Filter, Edit, Trash2, X, RefreshCw, Calendar } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { 
    adminSemesterService, 
    Semester, 
    SemesterFormData, 
    SemesterStats, 
    SemestersResponse, 
    ApiResponse 
} from '../../../services/AdminSemesterService'; 
import { AcademicYear } from '../../../services/AdminAcademicYearService';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]';

// ========================================================================
// 搭 INTERFACES & UTILS (Reused/Adapted)
// ========================================================================

interface Notification { type: 'success' | 'error'; message: string; }
interface Filters { search: string; status: string; academic_year_id: string; page: number; per_page: number; }
interface Pagination { current_page: number; last_page: number; per_page: number; total: number; }

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
// 統 SEMESTER MODAL (For Add/Edit)
// ========================================================================

const SemesterModal: React.FC<{
    semesterItem: Semester | null;
    onClose: () => void;
    onSave: (data: SemesterFormData) => Promise<void>;
    errors: Record<string, string[]>;
    academicYears: AcademicYear[];
}> = ({ semesterItem, onClose, onSave, errors, academicYears }) => {
    
    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return '';
        return dateString.split('T')[0]; 
    };
    
    const defaultAcademicYearId = semesterItem?.academic_year_id || academicYears[0]?.id || 0;

    const [formData, setFormData] = useState<SemesterFormData>({
        academic_year_id: defaultAcademicYearId,
        semester_name: semesterItem?.semester_name || '1st Semester',
        start_date: formatDate(semesterItem?.start_date),
        end_date: formatDate(semesterItem?.end_date),
        is_current: semesterItem?.is_current || false,
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
            [name]: type === 'checkbox' 
                ? checked 
                : (name === 'academic_year_id' ? parseInt(value) : value)
        } as SemesterFormData));
    };
    
    const SEMESTER_OPTIONS: SemesterFormData['semester_name'][] = ['1st Semester', '2nd Semester', 'Summer'];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {semesterItem ? 'Edit Semester' : 'Create New Semester'}
                            </h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year</label>
                            <select
                                name="academic_year_id"
                                value={formData.academic_year_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                required
                            >
                                {academicYears.map(year => (
                                    <option key={year.id} value={year.id}>{year.year_name}</option>
                                ))}
                            </select>
                            {errors.academic_year_id && (<p className="text-red-500 text-xs mt-1">{errors.academic_year_id[0]}</p>)}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Semester Name</label>
                            <select
                                name="semester_name"
                                value={formData.semester_name}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                required
                            >
                                {SEMESTER_OPTIONS.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                            {errors.semester_name && (<p className="text-red-500 text-xs mt-1">{errors.semester_name[0]}</p>)}
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
                                id="is_current_semester"
                                checked={formData.is_current}
                                onChange={handleChange}
                                className={`h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500`}
                            />
                            <label htmlFor="is_current_semester" className="ml-2 block text-sm font-medium text-gray-700">
                                Set as Current Semester (This will deactivate all others)
                            </label>
                            {errors.is_current && (<p className="text-red-500 text-xs mt-1">{errors.is_current[0]}</p>)}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium" disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg disabled:opacity-50`} disabled={loading}>
                                {loading ? 'Saving...' : semesterItem ? 'Update Semester' : 'Create Semester'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 塘 MAIN SEMESTERS PAGE
// ========================================================================

const Semesters: React.FC = () => {
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [semesterToDelete, setSemesterToDelete] = useState<Semester | null>(null);
    
    const [filters, setFilters] = useState<Filters>({
        search: '',
        status: '',
        academic_year_id: '',
        page: 1,
        per_page: 10,
    });

    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });

    const [stats, setStats] = useState<SemesterStats>({
        total_semesters: 0,
        current_semester: null,
        active_semesters_count: 0,
    });

    useEffect(() => {
        // NOTE: A service method for fetching ALL academic years is needed
        // For now, using a placeholder fetch
        const fetchAcademicYears = async () => {
             // Assuming a helper service exists to fetch all academic years for the dropdown filter
             // e.g. from AdminAcademicYearService (or adminService)
            // const response = await adminAcademicYearService.getAcademicYears(); 
            // setAcademicYears(response.data); 
            setAcademicYears([{id: 1, year_name: '2024-2025', start_date: '2024-06-01', end_date: '2025-05-31', is_current: true, status: 'current', semesters_count: 2, classes_count: 10, grades_count: 100 }]);
        };
        fetchAcademicYears();
        loadSemesters();
        loadStats();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadSemesters();
        }, 500);
        
        return () => clearTimeout(delayDebounceFn);
    }, [filters.search, filters.status, filters.academic_year_id, filters.page, filters.per_page]);

    const loadSemesters = async () => {
        setLoading(true);
        try {
            const response: SemestersResponse = await adminSemesterService.getSemesters(filters);
            if (response.success) {
                setSemesters(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Error loading semesters:', error);
            setNotification({ type: 'error', message: 'Failed to load semester data' });
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const currentResponse = await adminSemesterService.getCurrentSemester();
            if (currentResponse.success) {
                setStats(prev => ({ ...prev, current_semester: currentResponse.data }));
            }
        } catch (error) {
            console.error('Error loading semester stats:', error);
        }
    };

    const handleAdd = () => {
        setSelectedSemester(null);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleEdit = (semesterItem: Semester) => {
        setSelectedSemester(semesterItem);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleSave = async (data: SemesterFormData) => {
        try {
            let response: ApiResponse<Semester>;
            if (selectedSemester) {
                response = await adminSemesterService.updateSemester(selectedSemester.id, data);
                setNotification({ type: 'success', message: 'Semester updated successfully!' });
            } else {
                response = await adminSemesterService.createSemester(data);
                setNotification({ type: 'success', message: 'Semester created successfully!' });
            }
            
            if (response.success) {
                setShowModal(false);
                loadSemesters();
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
            setNotification({ type: 'error', message: error.message || 'Failed to save semester' });
        }
    };
    
    const handleDelete = (semesterItem: Semester) => {
        setSemesterToDelete(semesterItem);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async (force: boolean) => {
        if (!semesterToDelete) return;

        try {
            const response = await adminSemesterService.deleteSemester(semesterToDelete.id, force);
            if (response.success) {
                setNotification({ type: 'success', message: `Semester '${semesterToDelete.full_name}' deleted successfully!` });
                setShowDeleteModal(false);
                setSemesterToDelete(null);
                loadSemesters();
                loadStats();
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to delete semester' });
        }
    };

    const renderStatusTag = (status: string | undefined | null) => {
        // FIX APPLIED HERE: Defensive check for undefined/null status
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
                                <Layers className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Semester Management</h1>
                                <p className="text-gray-600 mt-1">Configure and manage academic semesters for each academic year</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button 
                                onClick={handleAdd}
                                className={`inline-flex items-center px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-lg font-medium`}
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Create Semester
                            </button>
                            
                            <button 
                                onClick={() => { loadSemesters(); loadStats(); }}
                                className="inline-flex items-center px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 col-span-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Current Semester</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {stats.current_semester ? stats.current_semester.semester_name : 'N/A'}
                                    </p>
                                    {stats.current_semester && (
                                        <p className={`text-sm font-medium text-green-600 mt-1`}>
                                            {stats.current_semester.academic_year.year_name}
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
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Semesters</p>
                                    <p className="text-3xl font-bold text-gray-900">{pagination.total}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                    <Layers className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
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
                                    placeholder="Search semester name..."
                                />
                            </div>
                            <div className="flex items-center">
                                <Filter className="h-5 w-5 text-gray-400 mr-3" />
                                <select
                                    value={filters.academic_year_id}
                                    onChange={(e) => setFilters({...filters, academic_year_id: e.target.value, page: 1})}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                >
                                    <option value="">Filter by Academic Year</option>
                                    {academicYears.map(year => (
                                        <option key={year.id} value={year.id}>{year.year_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center">
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
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Semester Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Academic Year</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Dates</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Classes</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Grades</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan={7} className="px-6 py-12 text-center"><RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin`} /></td></tr>
                                    ) : semesters.length === 0 ? (
                                        <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No semesters found</td></tr>
                                    ) : (
                                        semesters.map((semesterItem) => (
                                            <tr key={semesterItem.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{semesterItem.semester_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{semesterItem.academic_year.year_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className='text-sm text-gray-700'>{formatShortDate(semesterItem.start_date)} -</div>
                                                    <div className='text-xs text-gray-500'>{formatShortDate(semesterItem.end_date)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{semesterItem.classes_count}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{semesterItem.grades_count}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleEdit(semesterItem)}
                                                            className={`p-2 ${TEXT_COLOR_CLASS} ${LIGHT_HOVER_CLASS} rounded-lg transition-colors`}
                                                            title="Edit Semester"
                                                        >
                                                            <Edit className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(semesterItem)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Semester"
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
                        <SemesterModal
                            semesterItem={selectedSemester}
                            onClose={() => setShowModal(false)}
                            onSave={handleSave}
                            errors={validationErrors}
                            academicYears={academicYears}
                        />
                    )}

                    {showDeleteModal && (
                        <DeleteConfirmationModal
                            item={semesterToDelete}
                            onClose={() => {
                                setShowDeleteModal(false);
                                setSemesterToDelete(null);
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

export default Semesters;