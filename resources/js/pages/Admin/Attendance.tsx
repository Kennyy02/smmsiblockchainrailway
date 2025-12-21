import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, X, RefreshCw, BarChart3, User, BookOpen, CalendarCheck, CalendarX, Eye } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { 
    adminAttendanceService, 
    Attendance, 
    AttendanceFormData, 
    AttendanceStats, 
    AttendanceResponse, 
    MinimalClassSubject,
    MinimalStudent,
    AttendanceStatus,
    PaginationData,
} from '../../../services/AdminAttendanceService'; 

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#4B8BBE]';
const HOVER_COLOR_CLASS = 'hover:bg-[#3A7CA5]';
const TEXT_COLOR_CLASS = 'text-[#4B8BBE]';
const RING_COLOR_CLASS = 'focus:ring-[#4B8BBE]';
const LIGHT_BG_CLASS = 'bg-[#4B8BBE]/10';
const LIGHT_HOVER_CLASS = 'hover:bg-[#f0f5f9]';

// ========================================================================
// 📦 INTERFACES & UTILS
// ========================================================================

interface Notification {
    type: 'success' | 'error';
    message: string;
}

interface Filters {
    search: string;
    class_subject_id: string;
    student_id: string;
    status: string;
    start_date: string;
    end_date: string;
    page: number;
    per_page: number;
}

const ATTENDANCE_STATUS_OPTIONS: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Excused'];

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
// 👁️ VIEW ATTENDANCE MODAL
// ========================================================================

const ViewAttendanceModal: React.FC<{
    attendance: Attendance;
    onClose: () => void;
    renderStatusTag: (status: AttendanceStatus, color: string) => JSX.Element;
}> = ({ attendance, onClose, renderStatusTag }) => {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Attendance Details</h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        {/* Header */}
                        <div className="mb-6 pb-6 border-b">
                            <h3 className="text-2xl font-bold text-gray-900">{attendance.student?.full_name || 'N/A'}</h3>
                            <p className="text-gray-500">{attendance.student?.student_id || 'N/A'}</p>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</label>
                                <p className="text-gray-900 font-medium mt-1">{attendance.student?.full_name || 'N/A'}</p>
                                <p className="text-sm text-gray-500">{attendance.student?.student_id || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Class / Subject</label>
                                <p className="text-gray-900 font-medium mt-1">{attendance.class_subject?.subject?.subject_name || 'N/A'}</p>
                                <p className="text-sm text-gray-500">{attendance.class_subject?.class?.class_code || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</label>
                                <p className="text-gray-900 font-medium mt-1">
                                    {new Date(attendance.attendance_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
                                <div className="mt-1">{renderStatusTag(attendance.status, attendance.status_color)}</div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end mt-6 pt-6 border-t">
                            <button
                                onClick={onClose}
                                className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium`}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 📝 ATTENDANCE MODAL (For Add/Edit)
// ========================================================================

const AttendanceModal: React.FC<{
    attendance: Attendance | null;
    onClose: () => void;
    onSave: (data: AttendanceFormData) => Promise<void>;
    errors: Record<string, string[]>;
    classSubjects: MinimalClassSubject[];
    students: MinimalStudent[];
    loadingLists: boolean;
}> = ({ attendance, onClose, onSave, errors, classSubjects, students, loadingLists }) => {

    const [formData, setFormData] = useState<AttendanceFormData>({
        class_subject_id: attendance?.class_subject_id || (classSubjects[0]?.id || 0),
        student_id: attendance?.student_id || (students[0]?.id || 0),
        attendance_date: attendance?.attendance_date || new Date().toISOString().substring(0, 10),
        status: attendance?.status || 'Present',
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!attendance && !loadingLists) {
             setFormData(prev => ({
                ...prev,
                class_subject_id: prev.class_subject_id || (classSubjects[0]?.id || 0),
                student_id: prev.student_id || (students[0]?.id || 0),
            }));
        }
    }, [loadingLists, attendance, classSubjects, students]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dataToSubmit: AttendanceFormData = {
                ...formData,
                class_subject_id: parseInt(formData.class_subject_id as unknown as string),
                student_id: parseInt(formData.student_id as unknown as string),
                // Ensure date format is correct for API
                attendance_date: new Date(formData.attendance_date).toISOString().substring(0, 10), 
            };
            
            await onSave(dataToSubmit);
        } catch (error) {
            console.error('❌ FORM SUBMIT ERROR:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value } as AttendanceFormData));
    };

    const title = attendance ? 'Edit Attendance Record' : 'Record New Attendance';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">{title}</h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        
                        {/* Class & Subject */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Class & Subject</label>
                            <select
                                name="class_subject_id"
                                value={formData.class_subject_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                required
                                disabled={loadingLists}
                            >
                                <option value={0} disabled>
                                    {loadingLists ? 'Loading subjects...' : 'Select Class Subject'}
                                </option>
                                {classSubjects.map(cs => (
                                    <option key={cs.id} value={cs.id}>
                                        {cs.class?.class_code} - {cs.subject?.subject_name}
                                    </option>
                                ))}
                            </select>
                            {errors.class_subject_id && (<p className="text-red-500 text-xs mt-1">{errors.class_subject_id[0]}</p>)}
                        </div>
                        
                        {/* Student */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Student</label>
                            <select
                                name="student_id"
                                value={formData.student_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                required
                                disabled={loadingLists}
                            >
                                <option value={0} disabled>
                                    {loadingLists ? 'Loading students...' : 'Select Student'}
                                </option>
                                {students.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.full_name} ({student.student_id})
                                    </option>
                                ))}
                            </select>
                            {errors.student_id && (<p className="text-red-500 text-xs mt-1">{errors.student_id[0]}</p>)}
                        </div>

                        {/* Date and Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Attendance Date</label>
                                <input
                                    type="date"
                                    name="attendance_date"
                                    value={formData.attendance_date}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    required
                                />
                                {errors.attendance_date && (<p className="text-red-500 text-xs mt-1">{errors.attendance_date[0]}</p>)}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                    required
                                >
                                    {ATTENDANCE_STATUS_OPTIONS.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                                {errors.status && (<p className="text-red-500 text-xs mt-1">{errors.status[0]}</p>)}
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium" disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg disabled:opacity-50`} disabled={loading}>
                                {loading ? 'Saving...' : attendance ? 'Update Record' : 'Record Attendance'}
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

const DeleteAttendanceModal: React.FC<{
    attendance: Attendance;
    onClose: () => void;
    onConfirm: (id: number) => Promise<void>;
}> = ({ attendance, onClose, onConfirm }) => {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await onConfirm(attendance.id);
        } finally {
            setLoading(false);
        }
    };

    const date = new Date(attendance.attendance_date).toLocaleDateString();

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
                            Are you sure you want to delete the attendance record for: 
                            <strong className="text-red-700 block mt-1">
                                {attendance.student.full_name} ({attendance.status}) on {date}
                            </strong>? 
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
                                {loading ? 'Deleting...' : 'Delete Record'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// ========================================================================
// 🏠 MAIN ATTENDANCE PAGE
// ========================================================================

const AttendancePage: React.FC = () => {
    const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
    const [classSubjects, setClassSubjects] = useState<MinimalClassSubject[]>([]);
    const [students, setStudents] = useState<MinimalStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingLists, setLoadingLists] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    
    const [filters, setFilters] = useState<Filters>({
        search: '', // Not directly used in API but kept for consistency
        class_subject_id: '',
        student_id: '',
        status: '',
        start_date: '',
        end_date: '',
        page: 1,
        per_page: 15,
    });

    const [pagination, setPagination] = useState<PaginationData>({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    const [stats, setStats] = useState<AttendanceStats>({
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        attendance_rate: 0,
        by_class_subject: [],
    });

    // --- Data List Loaders ---
    const loadLists = async () => {
        setLoadingLists(true);
        try {
            const options = await adminAttendanceService.getAllDropdownOptions();
            setClassSubjects(options.classSubjects);
            setStudents(options.students);
        } catch (error) {
            console.error('❌ Error loading dropdown lists:', error);
            setNotification({ type: 'error', message: 'Failed to load dropdown lists.' });
        } finally {
            setLoadingLists(false);
        }
    }

    useEffect(() => {
        loadLists();
        loadAttendance();
        loadStats();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadAttendance();
            loadStats(); 
        }, 500);
        
        return () => clearTimeout(delayDebounceFn);
    }, [filters.class_subject_id, filters.student_id, filters.status, filters.start_date, filters.end_date, filters.page, filters.per_page]);

    const loadAttendance = async () => {
        setLoading(true);
        try {
            const apiFilters = {
                ...filters,
                class_subject_id: filters.class_subject_id ? parseInt(filters.class_subject_id) : undefined,
                student_id: filters.student_id ? parseInt(filters.student_id) : undefined,
                status: filters.status as AttendanceStatus | undefined,
            };
            const response: AttendanceResponse = await adminAttendanceService.getAttendanceRecords(apiFilters);
            if (response.success && Array.isArray(response.data)) {
                setAttendanceRecords(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Error loading attendance:', error);
            setNotification({ type: 'error', message: 'Failed to load attendance records' });
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await adminAttendanceService.getAttendanceStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error loading attendance stats:', error);
        }
    };

    const handleCreate = () => {
        if (loadingLists || classSubjects.length === 0 || students.length === 0) {
            setNotification({ type: 'error', message: 'Cannot create record: Required lists are empty or still loading.' });
            return;
        }
        setSelectedAttendance(null);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleEdit = (attendance: Attendance) => {
        setSelectedAttendance(attendance);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleView = (attendance: Attendance) => {
        setSelectedAttendance(attendance);
        setShowViewModal(true);
    };

    const handleSave = async (data: AttendanceFormData) => {
        setValidationErrors({});
        try {
            let response: AttendanceResponse;
            
            if (selectedAttendance) {
                response = await adminAttendanceService.updateAttendance(selectedAttendance.id, data);
                setNotification({ type: 'success', message: 'Attendance record updated successfully!' });
            } else {
                response = await adminAttendanceService.createAttendance(data);
                setNotification({ type: 'success', message: 'Attendance recorded successfully!' });
            }
            
            if (response.success) {
                setShowModal(false);
                loadAttendance();
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
            setNotification({ type: 'error', message: error.message || 'Failed to save attendance' });
        }
    };
    
    const handleDelete = (attendance: Attendance) => {
        setSelectedAttendance(attendance);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async (id: number) => {
        try {
            await adminAttendanceService.deleteAttendance(id);
            setNotification({ type: 'success', message: 'Attendance record deleted successfully!' });
            setShowDeleteModal(false);
            loadAttendance();
            loadStats();
        } catch (error: any) {
            console.error('Error deleting attendance:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to delete attendance record.' });
        }
    };

    const renderStatusTag = (status: AttendanceStatus, color: string) => {
        const baseClass = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border';
        const colors = {
            'green': 'bg-green-100 text-green-800 border-green-200',
            'red': 'bg-red-100 text-red-800 border-red-200',
            'yellow': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'blue': 'bg-blue-100 text-blue-800 border-blue-200',
            'gray': 'bg-gray-100 text-gray-800 border-gray-200',
        };

        return (
            <span className={`${baseClass} ${colors[color as keyof typeof colors] || colors.gray}`}>
                {status}
            </span>
        );
    };

    const renderPagination = () => {
        // Implementation similar to Grades.tsx
        const { current_page, last_page, total, per_page } = pagination;
        if (last_page <= 1) return null;
        
        const pages = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, current_page - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(last_page, startPage + maxPagesToShow - 1);
        
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return (
            <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-gray-700">
                    Showing <span className="font-semibold">{((current_page - 1) * per_page) + 1}</span> to{' '}
                    <span className="font-semibold">{Math.min(current_page * per_page, total)}</span> of{' '}
                    <span className="font-semibold">{total}</span> results
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={current_page === 1}
                        className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        Previous
                    </button>
                    {pages.map(page => (
                        <button
                            key={page}
                            onClick={() => setFilters(prev => ({ ...prev, page }))}
                            className={`px-3 py-1 border rounded-lg transition-colors ${
                                page === current_page
                                    ? `${PRIMARY_COLOR_CLASS} text-white border-transparent`
                                    : 'hover:bg-gray-50'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={current_page === last_page}
                        className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
                    {/* Header */}
                    <div className="mb-4 sm:mb-6 md:mb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="mb-4 sm:mb-6 md:mb-0">
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Attendance Management</h1>
                                <p className="text-xs sm:text-sm text-gray-600">Track and manage daily student attendance records</p>
                            </div>
                            <button
                                onClick={handleCreate}
                                className={`flex items-center px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-lg sm:rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg text-xs sm:text-sm md:text-base`}
                            >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Record New Attendance</span>
                                <span className="sm:hidden">New</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats - Mobile: Centered with icon below, Desktop: Icon on right */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100">
                            {/* Mobile: Centered layout */}
                            <div className="flex flex-col items-center text-center md:hidden">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Total Records</p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">{stats.total || 0}</p>
                                <div className={`p-2 sm:p-3 rounded-full ${LIGHT_BG_CLASS}`}>
                                    <CalendarCheck className={`w-5 h-5 sm:w-6 sm:h-6 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                            {/* Desktop: Original layout with icon on right */}
                            <div className="hidden md:flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Records</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.total || 0}</p>
                                </div>
                                <div className={`p-3 ${LIGHT_BG_CLASS} rounded-xl`}>
                                    <CalendarCheck className={`w-6 h-6 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100">
                            {/* Mobile: Centered layout */}
                            <div className="flex flex-col items-center text-center md:hidden">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Attendance Rate</p>
                                <p className="text-2xl sm:text-3xl font-bold text-green-600 mb-2 sm:mb-3">{Number(stats.attendance_rate ?? 0).toFixed(1)}%</p>
                                <div className="p-2 sm:p-3 bg-green-50 rounded-full">
                                    <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                                </div>
                            </div>
                            {/* Desktop: Original layout with icon on right */}
                            <div className="hidden md:flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Attendance Rate</p>
                                    <p className="text-3xl font-bold text-green-600">{Number(stats.attendance_rate ?? 0).toFixed(1)}%</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-xl">
                                    <BarChart3 className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100">
                            {/* Mobile: Centered layout */}
                            <div className="flex flex-col items-center text-center md:hidden">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Total Absent</p>
                                <p className="text-2xl sm:text-3xl font-bold text-red-600 mb-2 sm:mb-3">{stats.absent || 0}</p>
                                <div className="p-2 sm:p-3 bg-red-50 rounded-full">
                                    <CalendarX className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                                </div>
                            </div>
                            {/* Desktop: Original layout with icon on right */}
                            <div className="hidden md:flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Absent</p>
                                    <p className="text-3xl font-bold text-red-600">{stats.absent || 0}</p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-xl">
                                    <CalendarX className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100">
                            {/* Mobile: Centered layout */}
                            <div className="flex flex-col items-center text-center md:hidden">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Total Late</p>
                                <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-2 sm:mb-3">{stats.late || 0}</p>
                                <div className="p-2 sm:p-3 bg-yellow-50 rounded-full">
                                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                                </div>
                            </div>
                            {/* Desktop: Original layout with icon on right */}
                            <div className="hidden md:flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Late</p>
                                    <p className="text-3xl font-bold text-yellow-600">{stats.late || 0}</p>
                                </div>
                                <div className="p-3 bg-yellow-50 rounded-xl">
                                    <User className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters - Compact on Mobile */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                                    className={`pl-10 sm:pl-12 w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all text-sm sm:text-base`}
                                    placeholder="Search student..."
                                />
                            </div>
                            <div className="flex items-center">
                                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3" />
                                <select
                                    value={filters.class_subject_id}
                                    onChange={(e) => setFilters({...filters, class_subject_id: e.target.value, page: 1})}
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white text-sm sm:text-base`}
                                >
                                    <option value="">Filter by Subject</option>
                                    {classSubjects.map(cs => (
                                        <option key={cs.id} value={cs.id}>
                                            {cs.subject?.subject_code} - {cs.class?.class_code}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center">
                                <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3" />
                                <select
                                    value={filters.student_id}
                                    onChange={(e) => setFilters({...filters, student_id: e.target.value, page: 1})}
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white text-sm sm:text-base`}
                                >
                                    <option value="">Filter by Student</option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.student_id} - {student.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center">
                                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3" />
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white text-sm sm:text-base`}
                                >
                                    <option value="">Filter by Status</option>
                                    {ATTENDANCE_STATUS_OPTIONS.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table - Responsive: Mobile shows Date + Student + Actions, Desktop shows all columns */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Date</th>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Student</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Class / Subject</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Status</th>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                                <div className="flex justify-center">
                                                    <RefreshCw className={`h-6 w-6 sm:h-8 sm:w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : attendanceRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <CalendarCheck className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-3 sm:mb-4" />
                                                    <p className="text-base sm:text-lg font-medium">No attendance records found</p>
                                                    <p className="text-xs sm:text-sm">Record new attendance or adjust filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        attendanceRecords.map((record) => (
                                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                                                    {new Date(record.attendance_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                    <div className="text-xs sm:text-sm font-semibold text-gray-900">{record.student?.full_name || 'N/A'}</div>
                                                    <div className="text-xs text-gray-500">{record.student?.student_id || 'N/A'}</div>
                                                    {/* Show additional info on mobile */}
                                                    <div className="md:hidden mt-1 space-y-1">
                                                        <div className="text-xs text-gray-600">{record.class_subject?.subject?.subject_name || 'N/A'}</div>
                                                        <div className="text-xs text-gray-500">{record.class_subject?.class?.class_code || 'N/A'}</div>
                                                        <div>{renderStatusTag(record.status, record.status_color)}</div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm font-semibold text-gray-900">{record.class_subject?.subject?.subject_name || 'N/A'}</div>
                                                    <div className="text-xs text-gray-500">{record.class_subject?.class?.class_code || 'N/A'}</div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    {renderStatusTag(record.status, record.status_color)}
                                                </td>
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end space-x-1 sm:space-x-2">
                                                        <button
                                                            onClick={() => handleView(record)}
                                                            className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(record)}
                                                            className={`p-1.5 sm:p-2 ${TEXT_COLOR_CLASS} ${LIGHT_HOVER_CLASS} rounded-lg transition-colors`}
                                                            title="Edit Record"
                                                        >
                                                            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(record)}
                                                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Record"
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
                        
                        {renderPagination()}
                    </div>

                    {/* Modals */}
                    {showModal && (
                        <AttendanceModal
                            attendance={selectedAttendance}
                            onClose={() => {
                                setShowModal(false);
                                setValidationErrors({});
                            }}
                            onSave={handleSave}
                            errors={validationErrors}
                            classSubjects={classSubjects}
                            students={students}
                            loadingLists={loadingLists}
                        />
                    )}

                    {showViewModal && selectedAttendance && (
                        <ViewAttendanceModal
                            attendance={selectedAttendance}
                            onClose={() => setShowViewModal(false)}
                            renderStatusTag={renderStatusTag}
                        />
                    )}

                    {showDeleteModal && selectedAttendance && (
                        <DeleteAttendanceModal
                            attendance={selectedAttendance}
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

export default AttendancePage;