import React, { useState, useEffect, useCallback } from 'react';
import { 
    Award, 
    Filter, 
    RefreshCw, 
    X, 
    BarChart, 
    Hash, 
    TrendingUp, 
    TrendingDown, 
    ClipboardList,
    AlertCircle
} from 'lucide-react';

// --- Local Imports ---
import AppLayout from '@/layouts/app-layout';
import { useStudentAuth } from '../../../services/usestudentauth';
import { 
    adminGradeService, 
    Grade, 
    GradeStats, 
    GradeRemarks,
    AcademicYearOption,  
    SemesterOption,      
    GradeFilters,
    MinimalClassSubject
} from '../../../services/AdminGradeService'; 

// ====================================================================
// --- 1. Constants and Types
// ====================================================================

const PRIMARY_COLOR_CLASS = 'bg-[#007bff]'; 
const TEXT_COLOR_CLASS = 'text-[#007bff]';
const RING_COLOR_CLASS = 'focus:ring-[#007bff]';

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

interface LocalFilters {
    search: string;
    class_subject_id: string; 
    academic_year_id: string; 
    semester_id: string;
    remarks: string;
    page: number;
    per_page: number;
}

// ====================================================================
// --- 2. Helper Components & Utilities
// ====================================================================

/**
 * Renders a transient notification popup.
 */
const Notification: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = notification.type === 'success' ? PRIMARY_COLOR_CLASS : 'bg-red-500';

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

/**
 * Renders a single statistic card for the dashboard view.
 */
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => {
    const displayValue = (typeof value === 'number' && isNaN(value)) ? 'N/A' : value;
    const bgColor = color.replace('text-', 'bg-').replace('-600', '-100').replace('[#007bff]', '[#007bff]/10');
    
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className={`text-3xl font-bold ${color}`}>{displayValue}</p>
                </div>
                <div className={`${bgColor} p-3 rounded-xl`}>
                    <Icon className={`h-8 w-8 ${color}`} />
                </div>
            </div>
        </div>
    );
};

/**
 * Renders a colored pill/tag based on the grade's remark.
 */
const renderRemarksTag = (remarks: GradeRemarks | undefined) => {
    if (!remarks) {
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                N/A
            </span>
        );
    }

    let color = 'bg-gray-100 text-gray-600';
    if (remarks === 'Passed') color = 'bg-green-100 text-green-800';
    else if (remarks === 'Failed') color = 'bg-red-100 text-red-800';
    else if (remarks === 'Incomplete') color = 'bg-yellow-100 text-yellow-800';

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
            {remarks}
        </span>
    );
};

// ====================================================================
// --- 3. Main Component
// ====================================================================

const MyGrades: React.FC = () => {
    const { currentStudentId, isStudent, user } = useStudentAuth(); 
    
    // --- State Management ---
    const [grades, setGrades] = useState<Grade[]>([]);
    const [stats, setStats] = useState<GradeStats | null>(null);
    const [classSubjects, setClassSubjects] = useState<MinimalClassSubject[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
    const [semesters, setSemesters] = useState<SemesterOption[]>([]);
    
    const [filters, setFilters] = useState<LocalFilters>({
        search: '',
        class_subject_id: '',
        academic_year_id: '',
        semester_id: '',
        remarks: '',
        page: 1,
        per_page: 15,
    });
    
    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });
    
    const [loading, setLoading] = useState(true);
    const [loadingLists, setLoadingLists] = useState(true);
    const [notification, setNotification] = useState<Notification | null>(null);

    // --- Data Fetching Logic (Optimized & uses useCallback) ---

    const fetchGrades = useCallback(async () => {
        if (!currentStudentId) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        try {
            // Construct the API query parameters based on current filters
            const queryParams: GradeFilters = {
                page: filters.page,
                per_page: filters.per_page,
                search: filters.search || undefined,
                student_id: currentStudentId, 
                class_subject_id: filters.class_subject_id ? parseInt(filters.class_subject_id) : undefined,
                academic_year_id: filters.academic_year_id ? parseInt(filters.academic_year_id) : undefined,
                semester_id: filters.semester_id ? parseInt(filters.semester_id) : undefined,
                remarks: filters.remarks as GradeRemarks || undefined,
            };

            // ✅ FIX APPLIED: Ensure the full queryParams object is passed to getGrades
            const response = await adminGradeService.getGrades(queryParams); 
            
            if (response.success && Array.isArray(response.data)) {
                setGrades(response.data);
                if ('pagination' in response && response.pagination) {
                    setPagination(response.pagination);
                }
            } else {
                setGrades([]); 
                setPagination(prev => ({ ...prev, total: 0 }));
            }
        } catch (error) {
            console.error('❌ Failed to fetch grades:', error);
            setNotification({ type: 'error', message: 'Failed to load grades.' });
            setGrades([]);
            setPagination(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStudentId, filters.search, filters.class_subject_id, filters.academic_year_id, filters.semester_id, filters.remarks, filters.page, filters.per_page]);

    const fetchStats = useCallback(async () => {
        if (!currentStudentId) return;
        
        try {
            const response = await adminGradeService.getGradeStats({ 
                student_id: currentStudentId 
            });
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('❌ Failed to fetch stats:', error);
        }
    }, [currentStudentId]);

    const fetchDropdownLists = useCallback(async () => {
        if (!currentStudentId) return;
        
        setLoadingLists(true);
        try {
            // Fetch dropdown options filtered by the student ID (if service supports it)
            const response = await adminGradeService.getAllDropdownOptions(undefined, currentStudentId);
            
            setClassSubjects(response.classSubjects || []);
            setAcademicYears(response.academicYears || []);
            setSemesters(response.semesters || []);
            
        } catch (error) {
            console.error('❌ Failed to load dropdowns:', error);
        } finally {
            setLoadingLists(false);
        }
    }, [currentStudentId]);

    // --- Effects ---
    
    // 1. Fetch dropdown lists once on component mount/student ID change
    useEffect(() => {
        if (currentStudentId) {
            fetchDropdownLists();
        }
    }, [currentStudentId, fetchDropdownLists]);

    // 2. Fetch grades/stats when filters or student ID change (with debounce)
    useEffect(() => {
        if (currentStudentId) {
            // Debounce for better performance while user types/selects filters
            const debounceTimer = setTimeout(() => {
                fetchGrades();
                fetchStats();
            }, 300);
            return () => clearTimeout(debounceTimer);
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.search, filters.class_subject_id, filters.academic_year_id, filters.semester_id, filters.remarks, filters.page, filters.per_page, currentStudentId]);

    // --- Renderers ---

    const renderPagination = () => {
        if (pagination.last_page <= 1) return null;

        return (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                    Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setFilters(prev => ({...prev, page: prev.page - 1}))}
                        disabled={pagination.current_page === 1}
                        className={`px-4 py-2 border border-gray-300 rounded-lg ${TEXT_COLOR_CLASS} hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setFilters(prev => ({...prev, page: prev.page + 1}))}
                        disabled={pagination.current_page === pagination.last_page}
                        className={`px-4 py-2 border border-gray-300 rounded-lg ${TEXT_COLOR_CLASS} hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    if (!isStudent) {
        return (
            <AppLayout>
                <div className="p-8">
                    <div className="bg-red-50 border border-red-400 text-red-700 px-6 py-4 rounded-xl">
                        <div className="flex items-center">
                            <AlertCircle className="h-6 w-6 mr-3" />
                            <div>
                                <p className="font-bold">Access Denied</p>
                                <p className="text-sm">This page is only accessible to students.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-8 space-y-6 min-h-screen bg-[#f3f4f6]">
                
                {/* --- Header Section --- */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className={`${PRIMARY_COLOR_CLASS} p-3 rounded-xl mr-4`}>
                            <Award className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Grades</h1>
                            <p className="text-gray-600 mt-1">
                                Student: <span className="font-semibold text-gray-800">{user?.name || 'N/A'}</span> | Student ID: <span className="font-semibold text-[#007bff]">{user?.id || 'N/A'}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => { fetchGrades(); fetchStats(); }}
                        className={`flex items-center px-4 py-3 bg-white border border-gray-300 ${TEXT_COLOR_CLASS} rounded-xl hover:bg-gray-50 transition-all shadow-sm`}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* --- Stats Cards --- */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <StatCard 
                            title="Total Grades" 
                            value={stats.total_grades} 
                            icon={Hash} 
                            color={TEXT_COLOR_CLASS} 
                        />
                        <StatCard 
                            title="Average Rating" 
                            value={`${stats.average_final_rating?.toFixed(2) || 0}%`} 
                            icon={BarChart} 
                            color="text-blue-600" 
                        />
                        <StatCard 
                            title="Passing Rate" 
                            value={`${stats.passing_rate?.toFixed(1) || 0}%`} 
                            icon={TrendingUp} 
                            color="text-green-600" 
                        />
                        <StatCard 
                            title="Passed" 
                            value={stats.passed_grades} 
                            icon={ClipboardList} 
                            color="text-indigo-600" 
                        />
                        <StatCard 
                            title="Failed" 
                            value={stats.failed_count} 
                            icon={TrendingDown} 
                            color="text-red-600" 
                        />
                    </div>
                )}

                {/* --- Filter Section --- */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center">
                            <Filter className="h-5 w-5 text-gray-400 mr-3" />
                            <select
                                value={filters.class_subject_id}
                                onChange={(e) => setFilters({...filters, class_subject_id: e.target.value, page: 1})}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                disabled={loadingLists}
                            >
                                <option value="">{loadingLists ? 'Loading Subjects...' : 'All Subjects'}</option>
                                {classSubjects.map(cs => (
                                    <option key={cs.id} value={cs.id}>
                                        {cs.subject?.subject_name || cs.subject?.subject_code}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-center">
                            <Filter className="h-5 w-5 text-gray-400 mr-3" />
                            <select
                                value={filters.academic_year_id}
                                onChange={(e) => setFilters({...filters, academic_year_id: e.target.value, page: 1})}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                disabled={loadingLists}
                            >
                                <option value="">{loadingLists ? 'Loading Years...' : 'All Academic Years'}</option>
                                {academicYears.map(ay => (
                                    <option key={ay.id} value={ay.id}>
                                        {ay.year_name} {ay.is_current ? '(Current)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center">
                            <Filter className="h-5 w-5 text-gray-400 mr-3" />
                            <select
                                value={filters.semester_id}
                                onChange={(e) => setFilters({...filters, semester_id: e.target.value, page: 1})}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                disabled={loadingLists}
                            >
                                <option value="">{loadingLists ? 'Loading Semesters...' : 'All Semesters'}</option>
                                {semesters.map(sem => (
                                    <option key={sem.id} value={sem.id}>
                                        {sem.semester_name} {sem.is_current ? '(Current)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center">
                            <Filter className="h-5 w-5 text-gray-400 mr-3" />
                            <select
                                value={filters.remarks}
                                onChange={(e) => setFilters({...filters, remarks: e.target.value, page: 1})}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                disabled={loadingLists}
                            >
                                <option value="">All Remarks</option>
                                <option value="Passed">Passed</option>
                                <option value="Failed">Failed</option>
                                <option value="Incomplete">Incomplete</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* --- Grades Table --- */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Academic Year / Semester</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Prelim / Midterm / Final</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Final Rating</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin mx-auto`} />
                                            <p className="mt-2 text-sm text-gray-600">Loading grades...</p>
                                        </td>
                                    </tr>
                                ) : grades.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No grade records found matching the current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    grades.map((grade) => (
                                        <tr key={grade.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {grade.class_subject?.subject?.subject_name || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {grade.class_subject?.subject?.subject_code || ''}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                     {academicYears.find(ay => ay.id === grade.academic_year_id)?.year_name || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {semesters.find(s => s.id === grade.semester_id)?.semester_name || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                <p>Prelim: {grade.prelim_grade ?? 'N/A'}</p>
                                                <p>Midterm: {grade.midterm_grade ?? 'N/A'}</p>
                                                <p>Final: {grade.final_grade ?? 'N/A'}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`text-2xl font-bold ${grade.final_rating && grade.final_rating >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {grade.final_rating ?? 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {renderRemarksTag(grade.remarks)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {renderPagination()}
                </div>

                {/* --- Notification Popup --- */}
                {notification && (
                    <Notification
                        notification={notification}
                        onClose={() => setNotification(null)}
                    />
                )}
            </div>
        </AppLayout>
    );
};

export default MyGrades;