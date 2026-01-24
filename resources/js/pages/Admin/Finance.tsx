import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, Filter, Edit, Trash2, X, RefreshCw, Users, TrendingUp, CreditCard, AlertCircle, Eye, ChevronLeft, FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import {
    adminFinanceService,
    StudentFinanceRecord,
    ClassFinanceStats,
    FinanceStats,
    FinanceFilters,
} from '../../../services/AdminFinanceService';

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';

// ========================================================================
// 📋 INTERFACES
// ========================================================================

interface Notification {
    type: 'success' | 'error';
    message: string;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

type ViewMode = 'classes' | 'students' | 'records';

// ========================================================================
// 🔔 NOTIFICATION COMPONENT
// ========================================================================

const NotificationComponent: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
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
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 🏠 MAIN FINANCE PAGE
// ========================================================================

const Finance: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('classes');
    const [selectedClass, setSelectedClass] = useState<ClassFinanceStats | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<StudentFinanceRecord | null>(null);

    const [classes, setClasses] = useState<ClassFinanceStats[]>([]);
    const [students, setStudents] = useState<StudentFinanceRecord[]>([]);
    const [stats, setStats] = useState<FinanceStats>({
        total_revenue: 0,
        pending_balance: 0,
        total_miscellaneous_fees: 0,
        total_students: 0,
        average_balance_per_student: 0,
        paid_accounts: 0,
        pending_accounts: 0,
    });
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [search, setSearch] = useState('');

    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });

    const [filters, setFilters] = useState<FinanceFilters>({
        search: '',
        page: 1,
        per_page: 10,
    });

    useEffect(() => {
        loadStats();
        loadClassesFinance();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (viewMode === 'classes') {
                loadClassesFinance();
            } else if (viewMode === 'students' && selectedClass) {
                loadClassStudentsFinance();
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [filters.search, filters.page, filters.per_page, viewMode, selectedClass]);

    const loadStats = async () => {
        try {
            const response = await adminFinanceService.getFinanceStats();
            if (response.success && response.data) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error loading finance stats:', error);
            setNotification({ type: 'error', message: 'Failed to load finance statistics' });
        }
    };

    const loadClassesFinance = async () => {
        setLoading(true);
        try {
            const response = await adminFinanceService.getClassesFinance(filters);
            if (response.success && Array.isArray(response.data)) {
                setClasses(response.data);
            }
        } catch (error) {
            console.error('Error loading classes finance:', error);
            setNotification({ type: 'error', message: 'Failed to load classes finance' });
        } finally {
            setLoading(false);
        }
    };

    const loadClassStudentsFinance = async () => {
        if (!selectedClass) return;
        setLoading(true);
        try {
            const response = await adminFinanceService.getClassStudentsFinance(selectedClass.id, filters);
            if (response.success && Array.isArray(response.data)) {
                setStudents(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Error loading students finance:', error);
            setNotification({ type: 'error', message: 'Failed to load students finance' });
        } finally {
            setLoading(false);
        }
    };

    const handleViewStudents = (classItem: ClassFinanceStats) => {
        setSelectedClass(classItem);
        setSelectedStudent(null);
        setSearch('');
        setFilters({ search: '', page: 1, per_page: 10 });
        setPagination({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
        setViewMode('students');
    };

    const handleViewRecords = (student: StudentFinanceRecord) => {
        setSelectedStudent(student);
        setViewMode('records');
    };

    const handleBackToClasses = () => {
        setSelectedClass(null);
        setSelectedStudent(null);
        setSearch('');
        setFilters({ search: '', page: 1, per_page: 10 });
        setPagination({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
        setViewMode('classes');
    };

    const handleBackToStudents = () => {
        setSelectedStudent(null);
        setViewMode('students');
    };

    const renderPagination = () => {
        if (pagination.last_page <= 1) return null;

        return (
            <div className="bg-gray-50 dark:bg-gray-800 dark:border-white px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-white flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                <div className="text-xs sm:text-sm text-gray-700 dark:text-white text-center sm:text-left">
                    Showing <span className="font-semibold">{((pagination.current_page - 1) * pagination.per_page) + 1}</span> to{' '}
                    <span className="font-semibold">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> of{' '}
                    <span className="font-semibold">{pagination.total}</span> results
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setFilters({ ...filters, page: pagination.current_page - 1 })}
                        disabled={pagination.current_page === 1}
                        className={`px-3 py-1 text-sm border rounded-lg ${pagination.current_page === 1
                            ? 'border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500 cursor-not-allowed'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        Previous
                    </button>
                    {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setFilters({ ...filters, page })}
                            className={`px-3 py-1 text-sm border rounded-lg ${page === pagination.current_page
                                ? `${PRIMARY_COLOR_CLASS} text-white border-transparent`
                                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setFilters({ ...filters, page: pagination.current_page + 1 })}
                        disabled={pagination.current_page === pagination.last_page}
                        className={`px-3 py-1 text-sm border rounded-lg ${pagination.current_page === pagination.last_page
                            ? 'border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500 cursor-not-allowed'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
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
                                <div className="flex items-center">
                                    <div className={`${PRIMARY_COLOR_CLASS} p-2 sm:p-3 rounded-lg sm:rounded-xl mr-2 sm:mr-3 md:mr-4`}>
                                        <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Finance Management</h1>
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 sm:mt-1">Monitor financial records and balances</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
                        {/* Total Revenue */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">Total Revenue</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">₱{stats.total_revenue.toLocaleString()}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-2 sm:p-3 rounded-full mt-2 sm:mt-0`}>
                                    <TrendingUp className={`h-6 w-6 sm:h-7 sm:w-7 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                </div>
                            </div>
                        </div>

                        {/* Pending Balance */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">Pending Balance</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">₱{stats.pending_balance.toLocaleString()}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-2 sm:p-3 rounded-full mt-2 sm:mt-0`}>
                                    <AlertCircle className={`h-6 w-6 sm:h-7 sm:w-7 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                </div>
                            </div>
                        </div>

                        {/* Total Fees */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">Total Fees</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">₱{stats.total_miscellaneous_fees.toLocaleString()}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-2 sm:p-3 rounded-full mt-2 sm:mt-0`}>
                                    <CreditCard className={`h-6 w-6 sm:h-7 sm:w-7 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                </div>
                            </div>
                        </div>

                        {/* Total Students */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">Total Students</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats.total_students}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-2 sm:p-3 rounded-full mt-2 sm:mt-0`}>
                                    <Users className={`h-6 w-6 sm:h-7 sm:w-7 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Breadcrumb Navigation */}
                    {(viewMode === 'students' || viewMode === 'records') && (
                        <div className="mb-4 sm:mb-6 flex items-center space-x-2 text-sm">
                            {viewMode === 'students' && (
                                <>
                                    <button
                                        onClick={handleBackToClasses}
                                        className={`flex items-center space-x-1 ${TEXT_COLOR_CLASS} hover:underline font-medium`}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        <span>Classes</span>
                                    </button>
                                    <span className="text-gray-400">/</span>
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">{selectedClass?.class_code} - {selectedClass?.class_name}</span>
                                </>
                            )}
                            {viewMode === 'records' && (
                                <>
                                    <button
                                        onClick={handleBackToClasses}
                                        className={`flex items-center space-x-1 ${TEXT_COLOR_CLASS} hover:underline font-medium`}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        <span>Classes</span>
                                    </button>
                                    <span className="text-gray-400">/</span>
                                    <button
                                        onClick={handleBackToStudents}
                                        className={`flex items-center space-x-1 ${TEXT_COLOR_CLASS} hover:underline font-medium`}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        <span>Students</span>
                                    </button>
                                    <span className="text-gray-400">/</span>
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">{selectedStudent?.full_name}</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Search Bar */}
                    {viewMode !== 'records' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-gray-100 dark:border-gray-700">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                <input
                                    type="text"
                                    value={filters.search || ''}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                                    placeholder={viewMode === 'classes' ? 'Search by class code or name...' : 'Search by student name or ID...'}
                                    className={`pl-10 w-full px-4 py-2 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                />
                            </div>
                        </div>
                    )}

                    {/* Classes Table */}
                    {viewMode === 'classes' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700">
                                        <tr>
                                            <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Class</th>
                                            <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Program</th>
                                            <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Students</th>
                                            <th className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Total Balance</th>
                                            <th className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Avg Balance</th>
                                            <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                                    <div className="flex justify-center">
                                                        <RefreshCw className={`h-6 w-6 sm:h-8 sm:w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : classes.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500 dark:text-gray-400">
                                                    <div className="flex flex-col items-center">
                                                        <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mb-3 sm:mb-4" />
                                                        <p className="text-base sm:text-lg font-medium dark:text-gray-200">No classes found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            classes.map((classItem) => (
                                                <tr key={classItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                        <div>
                                                            <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{classItem.class_code}</div>
                                                            <div className="text-xs text-gray-600 dark:text-gray-400">{classItem.class_name}</div>
                                                        </div>
                                                    </td>
                                                    <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700 dark:text-white">{classItem.program}</td>
                                                    <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700 dark:text-white">{classItem.total_students}</td>
                                                    <td className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-orange-600 dark:text-orange-400">₱{classItem.total_balance.toLocaleString()}</td>
                                                    <td className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700 dark:text-white">₱{classItem.average_balance.toFixed(2)}</td>
                                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                                        <button
                                                            onClick={() => handleViewStudents(classItem)}
                                                            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white ${PRIMARY_COLOR_CLASS} ${HOVER_COLOR_CLASS} rounded-lg transition-colors`}
                                                        >
                                                            View Students
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Students Table */}
                    {viewMode === 'students' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700">
                                        <tr>
                                            <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Student</th>
                                            <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">ID</th>
                                            <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Balance</th>
                                            <th className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Misc. Fee</th>
                                            <th className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Amount Paid</th>
                                            <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                                    <div className="flex justify-center">
                                                        <RefreshCw className={`h-6 w-6 sm:h-8 sm:w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : students.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500 dark:text-gray-400">
                                                    <div className="flex flex-col items-center">
                                                        <Users className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mb-3 sm:mb-4" />
                                                        <p className="text-base sm:text-lg font-medium dark:text-gray-200">No students found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            students.map((student) => (
                                                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                        <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">{student.full_name}</div>
                                                    </td>
                                                    <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700 dark:text-white">{student.student_id}</td>
                                                    <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-orange-600 dark:text-orange-400">₱{student.balance.toFixed(2)}</td>
                                                    <td className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700 dark:text-white">₱{student.miscellaneous_fee.toFixed(2)}</td>
                                                    <td className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">₱{student.total_paid.toFixed(2)}</td>
                                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                                        <button
                                                            onClick={() => handleViewRecords(student)}
                                                            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white ${PRIMARY_COLOR_CLASS} ${HOVER_COLOR_CLASS} rounded-lg transition-colors`}
                                                        >
                                                            Records
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {renderPagination()}
                        </div>
                    )}

                    {/* Financial Records View */}
                    {viewMode === 'records' && selectedStudent && (
                        <div className="space-y-4 sm:space-y-6">
                            {/* Student Header Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-100 dark:border-gray-700">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name</label>
                                        <p className="text-gray-900 dark:text-white font-medium mt-1">{selectedStudent.full_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student ID</label>
                                        <p className="text-gray-900 dark:text-white font-medium mt-1">{selectedStudent.student_id}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Program</label>
                                        <p className="text-gray-900 dark:text-white font-medium mt-1">{selectedStudent.program}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</label>
                                        <p className="text-gray-900 dark:text-white font-medium mt-1 truncate">{selectedStudent.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-100 dark:border-gray-700">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">Balance</p>
                                    <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">₱{selectedStudent.balance.toFixed(2)}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-100 dark:border-gray-700">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">Misc. Fee</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">₱{selectedStudent.miscellaneous_fee.toFixed(2)}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-100 dark:border-gray-700">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">Amount Paid</p>
                                    <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">₱{selectedStudent.total_paid.toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Enrolled Subjects */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                                <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center space-x-2">
                                        <FileText className={`h-5 w-5 sm:h-6 sm:w-6 ${TEXT_COLOR_CLASS}`} />
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Enrolled Subjects</h3>
                                        <span className={`ml-auto px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full ${LIGHT_BG_CLASS} ${TEXT_COLOR_CLASS}`}>
                                            {selectedStudent.subjects_enrolled}
                                        </span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700">
                                            <tr>
                                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Subject Code</th>
                                                <th className="hidden md:table-cell px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Subject Name</th>
                                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {selectedStudent.subjects_enrolled > 0 ? (
                                                Array.from({ length: selectedStudent.subjects_enrolled }).map((_, i) => (
                                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">SUB{String(i + 1).padStart(3, '0')}</td>
                                                        <td className="hidden md:table-cell px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700 dark:text-white">Subject {i + 1}</td>
                                                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">₱{(5000 + i * 500).toFixed(2)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="px-4 sm:px-6 py-8 sm:py-12 text-center text-gray-500 dark:text-gray-400">
                                                        <p>No subjects enrolled</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {notification && (
                        <NotificationComponent
                            notification={notification}
                            onClose={() => setNotification(null)}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default Finance;

