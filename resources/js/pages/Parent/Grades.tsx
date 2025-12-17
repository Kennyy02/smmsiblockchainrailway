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
    AlertCircle,
    GraduationCap,
    Users
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { usePage } from '@inertiajs/react';
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

interface StudentDetails {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    full_name: string;
}

interface ParentDetails {
    id: number;
    students?: StudentDetails[];
}

interface AuthUser {
    id: number;
    role: string;
    name?: string;
    parent?: ParentDetails;
}

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

const ParentGrades: React.FC = () => {
    const { auth } = usePage().props as { auth: { user: AuthUser } };
    const user = auth?.user;
    const parent = user?.parent;
    const children = parent?.students || [];

    // Get student_id from URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const initialStudentId = urlParams.get('student_id');
    
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
        initialStudentId ? parseInt(initialStudentId) : (children.length > 0 ? children[0].id : null)
    );
    
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

    const selectedChild = children.find(c => c.id === selectedStudentId);

    const fetchGrades = useCallback(async () => {
        if (!selectedStudentId) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        try {
            const queryParams: GradeFilters = {
                page: filters.page,
                per_page: filters.per_page,
                search: filters.search || undefined,
                student_id: selectedStudentId, 
                class_subject_id: filters.class_subject_id ? parseInt(filters.class_subject_id) : undefined,
                academic_year_id: filters.academic_year_id ? parseInt(filters.academic_year_id) : undefined,
                semester_id: filters.semester_id ? parseInt(filters.semester_id) : undefined,
                remarks: filters.remarks as GradeRemarks || undefined,
            };

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
            console.error('Failed to fetch grades:', error);
            setNotification({ type: 'error', message: 'Failed to load grades.' });
            setGrades([]);
            setPagination(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
    }, [selectedStudentId, filters.search, filters.class_subject_id, filters.academic_year_id, filters.semester_id, filters.remarks, filters.page, filters.per_page]);

    const fetchStats = useCallback(async () => {
        if (!selectedStudentId) return;
        
        try {
            const response = await adminGradeService.getGradeStats({ 
                student_id: selectedStudentId 
            });
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, [selectedStudentId]);

    const fetchDropdownLists = useCallback(async () => {
        if (!selectedStudentId) return;
        
        setLoadingLists(true);
        try {
            const response = await adminGradeService.getAllDropdownOptions(undefined, selectedStudentId);
            
            setClassSubjects(response.classSubjects || []);
            setAcademicYears(response.academicYears || []);
            setSemesters(response.semesters || []);
            
        } catch (error) {
            console.error('Failed to load dropdowns:', error);
        } finally {
            setLoadingLists(false);
        }
    }, [selectedStudentId]);

    useEffect(() => {
        if (selectedStudentId) {
            fetchDropdownLists();
        }
    }, [selectedStudentId, fetchDropdownLists]);

    useEffect(() => {
        if (selectedStudentId) {
            const debounceTimer = setTimeout(() => {
                fetchGrades();
                fetchStats();
            }, 300);
            return () => clearTimeout(debounceTimer);
        } else {
            setLoading(false);
        }
    }, [filters.search, filters.class_subject_id, filters.academic_year_id, filters.semester_id, filters.remarks, filters.page, filters.per_page, selectedStudentId, fetchGrades, fetchStats]);

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

    if (!parent || children.length === 0) {
        return (
            <AppLayout>
                <div className="p-8">
                    <div className="bg-red-50 border border-red-400 text-red-700 px-6 py-4 rounded-xl">
                        <div className="flex items-center">
                            <AlertCircle className="h-6 w-6 mr-3" />
                            <div>
                                <p className="font-bold">No Children Linked</p>
                                <p className="text-sm">No children are linked to your account. Please contact the administrator.</p>
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
                            <h1 className="text-3xl font-bold text-gray-900">Child's Grades</h1>
                            {selectedChild && (
                                <p className="text-gray-600 mt-1">
                                    Viewing grades for: <span className="font-semibold text-gray-800">{selectedChild.full_name || `${selectedChild.first_name} ${selectedChild.last_name}`}</span> | Student ID: <span className="font-semibold text-[#007bff]">{selectedChild.student_id}</span>
                                </p>
                            )}
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

                {/* --- Child Selector (if multiple children) --- */}
                {children.length > 1 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center">
                            <Users className="h-5 w-5 text-gray-400 mr-3" />
                            <label className="text-sm font-medium text-gray-700 mr-3">Select Child:</label>
                            <select
                                value={selectedStudentId || ''}
                                onChange={(e) => {
                                    const newId = parseInt(e.target.value);
                                    setSelectedStudentId(newId);
                                    setFilters(prev => ({...prev, page: 1}));
                                    window.history.replaceState({}, '', `/parent/grades?student_id=${newId}`);
                                }}
                                className={`flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                            >
                                {children.map(child => (
                                    <option key={child.id} value={child.id}>
                                        {child.full_name || `${child.first_name} ${child.last_name}`} ({child.student_id})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

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

export default ParentGrades;

