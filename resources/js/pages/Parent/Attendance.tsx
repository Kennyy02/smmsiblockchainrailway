import React, { useState, useEffect } from 'react';
import { 
    CalendarCheck, 
    Search, 
    Filter, 
    RefreshCw, 
    X, 
    Clock, 
    CheckSquare, 
    CalendarX,
    ClipboardCheck,
    Hash,
    TrendingUp,
    AlertCircle,
    Users
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { usePage } from '@inertiajs/react';
import { 
    adminAttendanceService, 
    Attendance, 
    AttendanceStats, 
    AttendanceResponse, 
    MinimalClassSubject,
    AttendanceStatus,
    AttendanceFilters,
    ApiResponse,
    PaginationData
} from '../../../services/AdminAttendanceService'; 

const PRIMARY_COLOR_CLASS = 'bg-[#007bff]'; 
const TEXT_COLOR_CLASS = 'text-[#007bff]';
const RING_COLOR_CLASS = 'focus:ring-[#007bff]';

// Helper function to get current date in Philippines timezone (Asia/Manila, UTC+8)
const getPhilippinesDate = (): string => {
    const now = new Date();
    // Use Intl.DateTimeFormat to get date in Philippines timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    // Format returns YYYY-MM-DD
    return formatter.format(now);
};

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
    class_subject_id: string;
    status: string;
    start_date: string;
    end_date: string;
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
                    <button onClick={onClose} className="ml-4 rounded-full p-1 hover:bg-white/20 transition-colors">
                        <X className="w-4 h-4" />
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

const renderStatusTag = (status: AttendanceStatus) => {
    let colorClass = 'bg-gray-100 text-gray-600';
    let icon = <Clock className="h-4 w-4" />;
    
    switch (status) {
        case 'Present':
            colorClass = 'bg-green-100 text-green-800';
            icon = <CheckSquare className="h-4 w-4" />;
            break;
        case 'Absent':
            colorClass = 'bg-red-100 text-red-800';
            icon = <CalendarX className="h-4 w-4" />;
            break;
        case 'Late':
            colorClass = 'bg-yellow-100 text-yellow-800';
            icon = <Clock className="h-4 w-4" />;
            break;
        case 'Excused':
            colorClass = 'bg-blue-100 text-blue-800';
            icon = <ClipboardCheck className="h-4 w-4" />;
            break;
    }

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
            {icon}
            <span className="ml-1">{status}</span>
        </span>
    );
};

const ParentAttendance: React.FC = () => {
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
    
    const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [classSubjects, setClassSubjects] = useState<MinimalClassSubject[]>([]);
    const [stats, setStats] = useState<AttendanceStats | null>(null);

    const [filters, setFilters] = useState<LocalFilters>({
        class_subject_id: '',
        status: '',
        start_date: '',
        end_date: getPhilippinesDate(),
        page: 1,
        per_page: 15,
    });

    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    const selectedChild = children.find(c => c.id === selectedStudentId);

    const loadDropdownOptions = async () => {
        if (!selectedStudentId) return;
        
        try {
            const response = await adminAttendanceService.getClassSubjectsMinimal(selectedStudentId);
            if (response.success) {
                setClassSubjects(response.data || []);
            }
        } catch (error) {
            console.error('Failed to load dropdown options:', error);
        }
    };

    const loadAttendance = async () => {
        if (!selectedStudentId) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        try {
            const studentFilters: AttendanceFilters = {
                page: filters.page,
                per_page: filters.per_page,
                student_id: selectedStudentId,
                class_subject_id: filters.class_subject_id ? parseInt(filters.class_subject_id) : undefined,
                status: filters.status as AttendanceStatus || undefined,
                start_date: filters.start_date && filters.start_date !== '' ? filters.start_date : undefined,
                end_date: filters.end_date && filters.end_date !== '' ? filters.end_date : undefined,
            };
            
            const response: AttendanceResponse = await adminAttendanceService.getAttendance(studentFilters);
            
            if (response.success) {
                setAttendanceRecords(response.data);
                if ('pagination' in response && response.pagination) {
                    setPagination(response.pagination);
                }
            } else {
                setAttendanceRecords([]);
                setPagination(prev => ({ ...prev, total: 0 }));
            }
        } catch (error) {
            console.error('Failed to load attendance:', error);
            setNotification({ type: 'error', message: 'Failed to load attendance records.' });
            setAttendanceRecords([]);
            setPagination(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        if (!selectedStudentId) {
            return;
        }
        try {
            const statsParams = {
                student_id: selectedStudentId,
                class_subject_id: filters.class_subject_id ? parseInt(filters.class_subject_id) : undefined,
            };
            
            const response: ApiResponse<AttendanceStats> = await adminAttendanceService.getAttendanceStats(statsParams);
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error loading attendance stats:', error);
        }
    };

    useEffect(() => {
        if (selectedStudentId) {
            loadDropdownOptions(); 
        } else {
            setLoading(false);
        }
    }, [selectedStudentId]);

    // Update "To" date to current Philippines date on component mount and when window gains focus
    useEffect(() => {
        const updateDate = () => {
            setFilters(prev => ({ ...prev, end_date: getPhilippinesDate() }));
        };
        
        // Update on mount
        updateDate();
        
        // Update when window gains focus (user returns to tab)
        window.addEventListener('focus', updateDate);
        
        return () => {
            window.removeEventListener('focus', updateDate);
        };
    }, []);

    useEffect(() => {
        if (selectedStudentId) {
            const debounceTimer = setTimeout(() => {
                loadAttendance();
                loadStats(); 
            }, 300);
            return () => clearTimeout(debounceTimer);
        } else {
            setLoading(false);
        }
    }, [filters.class_subject_id, filters.status, filters.start_date, filters.end_date, filters.page, selectedStudentId]);

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
            <div className="min-h-screen bg-[#f3f4f6]">
                <div className="container mx-auto px-6 py-8">
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center">
                            <div className={`${PRIMARY_COLOR_CLASS} p-3 rounded-xl mr-4`}>
                                <CalendarCheck className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Child's Attendance</h1>
                                {selectedChild && (
                                    <p className="text-gray-600 mt-1">
                                        Viewing attendance for: <span className="font-semibold text-gray-800">{selectedChild.full_name || `${selectedChild.first_name} ${selectedChild.last_name}`}</span> ({selectedChild.student_id})
                                    </p>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={() => { loadAttendance(); loadStats(); }}
                            className={`inline-flex items-center px-4 py-3 bg-white border border-gray-300 ${TEXT_COLOR_CLASS} rounded-xl hover:bg-gray-50 transition-all shadow-sm`}
                        >
                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* --- Child Selector (if multiple children) --- */}
                    {children.length > 1 && (
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
                            <div className="flex items-center">
                                <Users className="h-5 w-5 text-gray-400 mr-3" />
                                <label className="text-sm font-medium text-gray-700 mr-3">Select Child:</label>
                                <select
                                    value={selectedStudentId || ''}
                                    onChange={(e) => {
                                        const newId = parseInt(e.target.value);
                                        setSelectedStudentId(newId);
                                        setFilters(prev => ({...prev, page: 1}));
                                        window.history.replaceState({}, '', `/parent/attendance?student_id=${newId}`);
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

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <StatCard title="Total Records" value={stats?.total_records || 0} icon={Hash} color={TEXT_COLOR_CLASS} />
                        <StatCard title="Present Count" value={stats?.present_count || 0} icon={CheckSquare} color="text-green-600" />
                        <StatCard title="Absent Count" value={stats?.absent_count || 0} icon={CalendarX} color="text-red-600" />
                        <StatCard title="Attendance Rate" value={`${(stats?.attendance_rate ?? 0).toFixed(1)}%`} icon={TrendingUp} color="text-indigo-600" />
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="flex items-center">
                                <Filter className="h-5 w-5 text-gray-400 mr-3" />
                                <select
                                    value={filters.class_subject_id}
                                    onChange={(e) => setFilters({...filters, class_subject_id: e.target.value, page: 1})}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                >
                                    <option value="">All Subjects</option>
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
                                    value={filters.status}
                                    onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Late">Late</option>
                                    <option value="Excused">Excused</option>
                                </select>
                            </div>
                            
                            <div className="flex items-center">
                                <Filter className="h-5 w-5 text-gray-400 mr-3" />
                                <label className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">From:</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={filters.start_date}
                                    onChange={(e) => setFilters({...filters, start_date: e.target.value, page: 1})}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="Start Date"
                                />
                            </div>
                            
                            <div className="flex items-center">
                                <Filter className="h-5 w-5 text-gray-400 mr-3" />
                                <label className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">To:</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={filters.end_date}
                                    onChange={(e) => setFilters({...filters, end_date: e.target.value, page: 1})}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="End Date"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Subject</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Class</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin mx-auto`} />
                                                <p className="mt-2 text-sm text-gray-600">Loading attendance...</p>
                                            </td>
                                        </tr>
                                    ) : attendanceRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                No attendance records found matching the current filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        attendanceRecords.map((record) => (
                                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(record.attendance_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {record.class_subject?.subject?.subject_name || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {record.class_subject?.subject?.subject_code || ''}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {renderStatusTag(record.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {record.class_subject?.class?.class_code || 'N/A'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {renderPagination()}
                    </div>

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

export default ParentAttendance;

