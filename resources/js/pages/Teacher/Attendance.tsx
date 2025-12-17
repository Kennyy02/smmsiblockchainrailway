import React, { useState, useEffect } from 'react';
import { 
    ClipboardCheck, 
    Plus, 
    Search, 
    Filter, 
    Edit, 
    Trash2, 
    X, 
    RefreshCw, 
    Calendar, 
    Users, 
    CheckCircle, 
    XCircle,
    Clock,
    AlertCircle
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useTeacherAuth } from '../../../services/useTeacherAuth';
import {
    adminAttendanceService,
    AttendanceRecord,
    AttendanceFormData,
    AttendanceStats,
    AttendanceStatus,
    AttendanceRecordsResponse,
    MinimalClassSubject,
    MinimalStudent
} from '../../../services/AdminAttendanceService';
import { adminClassSubjectService } from '../../../services/AdminClassSubjectService';
import { adminGradeService } from '../../../services/AdminGradeService';

const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]';

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

interface Filters {
    search: string;
    class_subject_id: string;
    status: string;
    start_date: string;
    end_date: string;
    page: number;
    per_page: number;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

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

const AttendanceModal: React.FC<{
    attendance: AttendanceRecord | null;
    onClose: () => void;
    onSave: (data: AttendanceFormData) => Promise<void>;
    errors: Record<string, string[]>;
    classSubjects: MinimalClassSubject[];
    students: MinimalStudent[];
    loadingLists: boolean;
}> = ({ attendance, onClose, onSave, errors, classSubjects, students, loadingLists }) => {

    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return new Date().toISOString().split('T')[0];
        return dateString.split('T')[0];
    };

    const [formData, setFormData] = useState<AttendanceFormData>({
        class_subject_id: attendance?.class_subject_id || (classSubjects.length > 0 ? classSubjects[0].id : 0),
        student_id: attendance?.student_id || (students.length > 0 ? students[0].id : 0),
        attendance_date: formatDate(attendance?.date),
        status: attendance?.status || 'Present',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!attendance) {
            if (classSubjects.length > 0 && formData.class_subject_id === 0) {
                setFormData(prev => ({ ...prev, class_subject_id: classSubjects[0].id }));
            }
            if (students.length > 0 && formData.student_id === 0) {
                setFormData(prev => ({ ...prev, student_id: students[0].id }));
            }
        }
    }, [classSubjects, students, attendance]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        console.log('📤 Submitting formData:', formData);
        console.log('📋 FormData keys:', Object.keys(formData));
        console.log('📅 attendance_date value:', formData.attendance_date);
        
        try {
            await onSave(formData);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        console.log('📝 Form field changed:', { name, value, type: typeof value });
        
        if (name === 'class_subject_id' || name === 'student_id') {
            setFormData(prev => {
                const updated = { ...prev, [name]: parseInt(value) };
                console.log('📊 Updated formData:', updated);
                return updated;
            });
        } else {
            setFormData(prev => {
                const updated = { ...prev, [name]: value };
                console.log('📊 Updated formData:', updated);
                return updated;
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <h2 className="text-xl font-bold text-white">
                            {attendance ? 'Edit Attendance' : 'Mark Attendance'}
                        </h2>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6">
                        {loadingLists && (
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-center">
                                    <RefreshCw className="h-4 w-4 text-blue-600 mr-2 animate-spin" />
                                    <p className="text-sm text-blue-700">
                                        Loading class subjects and students...
                                    </p>
                                </div>
                            </div>
                        )}

                        {!loadingLists && classSubjects.length === 0 && (
                            <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl">
                                <div className="flex items-start">
                                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-yellow-800">
                                            No Classes Available
                                        </p>
                                        <p className="text-xs text-yellow-700 mt-1">
                                            You are not assigned to any classes yet. Please contact your administrator or check the console (F12) for details.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => window.location.reload()}
                                            className="mt-2 px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition"
                                        >
                                            Reload Page
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Class & Subject *
                                    </label>
                                    <select
                                        name="class_subject_id"
                                        value={formData.class_subject_id}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                        disabled={!!attendance || loadingLists || classSubjects.length === 0}
                                        required
                                    >
                                        {classSubjects.length === 0 ? (
                                            <option value="0">No classes available</option>
                                        ) : (
                                            classSubjects.map(cs => (
                                                <option key={cs.id} value={cs.id}>
                                                    {cs.class?.class_code || 'Unknown'} - {cs.subject?.subject_code || 'Unknown'}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {errors.class_subject_id && <p className="mt-1 text-sm text-red-600">{errors.class_subject_id[0]}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Student *
                                    </label>
                                    <select
                                        name="student_id"
                                        value={formData.student_id}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                        disabled={!!attendance || loadingLists}
                                        required
                                    >
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.full_name} ({s.student_id})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.student_id && <p className="mt-1 text-sm text-red-600">{errors.student_id[0]}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="attendance_date"
                                        value={formData.attendance_date}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                        required
                                    />
                                    {errors.attendance_date && <p className="mt-1 text-sm text-red-600">{errors.attendance_date[0]}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status *
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                        required
                                    >
                                        <option value="Present">Present</option>
                                        <option value="Absent">Absent</option>
                                        <option value="Late">Late</option>
                                        <option value="Excused">Excused</option>
                                    </select>
                                    {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status[0]}</p>}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg disabled:opacity-50`}
                                disabled={loading || loadingLists || classSubjects.length === 0}
                            >
                                {loading ? 'Saving...' : (attendance ? 'Update' : 'Mark Attendance')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => {
    const displayValue = (typeof value === 'number' && isNaN(value)) ? 'N/A' : value;
    const bgColor = color.replace('text-', 'bg-').replace('-600', '-100').replace('[#003366]', '[#003366]/10');
    
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

const AttendancePage: React.FC = () => {
    const { currentTeacherId, isTeacher, user } = useTeacherAuth();
    
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [stats, setStats] = useState<AttendanceStats | null>(null);
    const [classSubjects, setClassSubjects] = useState<MinimalClassSubject[]>([]);
    const [students, setStudents] = useState<MinimalStudent[]>([]);
    const [loadingLists, setLoadingLists] = useState(true);
    const [classStudents, setClassStudents] = useState<MinimalStudent[]>([]);
    const [loadingClassStudents, setLoadingClassStudents] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>(getPhilippinesDate());
    const [studentAttendanceMap, setStudentAttendanceMap] = useState<Record<number, AttendanceStatus>>({});
    const [studentAttendanceRecordIds, setStudentAttendanceRecordIds] = useState<Record<number, number>>({});
    
    const [filters, setFilters] = useState<Filters>({
        search: '',
        class_subject_id: '',
        status: '',
        start_date: '',
        end_date: '',
        page: 1,
        per_page: 10,
    });
    
    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });
    
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

    const fetchAttendance = async () => {
        if (!currentTeacherId) return;
        
        setLoading(true);
        try {
            const response = await adminAttendanceService.getAttendanceRecords({
                page: filters.page,
                per_page: filters.per_page,
                search: filters.search || undefined,
                class_subject_id: filters.class_subject_id ? parseInt(filters.class_subject_id) : undefined,
                status: filters.status as AttendanceStatus || undefined,
                start_date: filters.start_date || undefined,
                end_date: filters.end_date || undefined,
            });
            
            if (response.success && Array.isArray(response.data)) {
                setAttendanceRecords(response.data);
                if ('pagination' in response && response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
            setNotification({ type: 'error', message: 'Failed to load attendance records.' });
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        if (!currentTeacherId) return;
        
        try {
            const params: any = {};
            if (filters.class_subject_id) {
                params.class_subject_id = parseInt(filters.class_subject_id);
            }
            const response = await adminAttendanceService.getAttendanceStats(params);
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    // Load attendance for selected date and class to determine button states
    const fetchAttendanceForDate = async () => {
        if (!filters.class_subject_id || !selectedDate) {
            setStudentAttendanceMap({});
            setStudentAttendanceRecordIds({});
            return;
        }

        try {
            const response = await adminAttendanceService.getAttendanceRecords({
                class_subject_id: parseInt(filters.class_subject_id),
                start_date: selectedDate,
                end_date: selectedDate,
                per_page: 9999,
            });

            if (response.success && Array.isArray(response.data)) {
                const attendanceMap: Record<number, AttendanceStatus> = {};
                const recordIdsMap: Record<number, number> = {};
                response.data.forEach((record) => {
                    attendanceMap[record.student_id] = record.status;
                    recordIdsMap[record.student_id] = record.id;
                });
                setStudentAttendanceMap(attendanceMap);
                setStudentAttendanceRecordIds(recordIdsMap);
            } else {
                setStudentAttendanceMap({});
                setStudentAttendanceRecordIds({});
            }
        } catch (error) {
            console.error('Error fetching attendance for date:', error);
            setStudentAttendanceMap({});
            setStudentAttendanceRecordIds({});
        }
    };

    const fetchDropdownLists = async () => {
        if (!currentTeacherId) {
            console.warn('⚠️ [ATTENDANCE] No teacher ID available');
            return;
        }
        
        setLoadingLists(true);
        try {
            console.log('🔍 [ATTENDANCE] Fetching dropdowns for teacher ID:', currentTeacherId);
            
            let classSubjectsData: MinimalClassSubject[] = [];
            let studentsData: MinimalStudent[] = [];
            
            try {
                console.log('📡 Method 1: Using getClassSubjectsMinimal()...');
                const classSubjectsRes = await adminAttendanceService.getClassSubjectsMinimal();
                
                console.log('📦 Method 1 Response:', classSubjectsRes);
                
                if (classSubjectsRes.data && Array.isArray(classSubjectsRes.data)) {
                    const allClassSubjects = classSubjectsRes.data;
                    classSubjectsData = allClassSubjects.filter(
                        (cs: any) => cs.teacher_id === currentTeacherId
                    );
                    console.log('✅ Method 1: Filtered to', classSubjectsData.length, 'class subjects');
                }
            } catch (error) {
                console.warn('⚠️ Method 1 failed:', error);
            }
            
            if (classSubjectsData.length === 0) {
                try {
                    console.log('📡 Method 2: Using adminClassSubjectService...');
                    const response = await adminClassSubjectService.getClassSubjects({
                        teacher_id: currentTeacherId,
                        per_page: 999
                    });
                    
                    console.log('📦 Method 2 Response:', response);
                    
                    if (response.success && response.data) {
                        const data = Array.isArray(response.data) ? response.data : [];
                        classSubjectsData = data.filter((cs: any) => cs.teacher_id === currentTeacherId);
                        console.log('✅ Method 2: Found', classSubjectsData.length, 'class subjects');
                    }
                } catch (error) {
                    console.warn('⚠️ Method 2 failed:', error);
                }
            }
            
            if (classSubjectsData.length === 0) {
                try {
                    console.log('📡 Method 3: Getting all class subjects...');
                    const response = await adminClassSubjectService.getClassSubjects({
                        per_page: 999
                    });
                    
                    console.log('📦 Method 3 Response:', response);
                    
                    if (response.success && response.data) {
                        const all = Array.isArray(response.data) ? response.data : [];
                        classSubjectsData = all.filter((cs: any) => cs.teacher_id === currentTeacherId);
                        console.log('✅ Method 3: Filtered to', classSubjectsData.length, 'class subjects');
                    }
                } catch (error) {
                    console.warn('⚠️ Method 3 failed:', error);
                }
            }
            
            if (classSubjectsData.length === 0) {
                try {
                    console.log('📡 Method 4: Loading ALL class subjects (TESTING)...');
                    const response = await adminClassSubjectService.getClassSubjects({
                        per_page: 999
                    });
                    
                    if (response.success && response.data) {
                        classSubjectsData = Array.isArray(response.data) ? response.data : [];
                        console.warn('⚠️ TESTING MODE: Showing ALL', classSubjectsData.length, 'class subjects');
                    }
                } catch (error) {
                    console.error('❌ Method 4 failed:', error);
                }
            }
            
            try {
                const studentsRes = await adminAttendanceService.getStudentsMinimal();
                studentsData = studentsRes.data || [];
            } catch (error) {
                console.error('Failed to fetch students:', error);
            }
            
            setClassSubjects(classSubjectsData);
            setStudents(studentsData);
            
            console.log('📊 [ATTENDANCE] FINAL:', {
                classSubjects: classSubjectsData.length,
                students: studentsData.length
            });
            
            if (classSubjectsData.length === 0) {
                console.error('❌ CRITICAL: No class subjects found!');
                console.log('💡 FIX: UPDATE class_subjects SET teacher_id =', currentTeacherId, 'WHERE id IN (1,2,3);');
            } else {
                console.log('✅ Dropdowns loaded successfully');
                console.table(classSubjectsData.slice(0, 3).map((cs: any) => ({
                    id: cs.id,
                    class: cs.class?.class_code,
                    subject: cs.subject?.subject_code,
                    teacher_id: cs.teacher_id
                })));
            }
            
        } catch (error) {
            console.error('❌ FATAL ERROR in fetchDropdownLists:', error);
            setClassSubjects([]);
            setStudents([]);
        } finally {
            setLoadingLists(false);
        }
    };

    useEffect(() => {
        if (currentTeacherId) {
            fetchAttendance();
            fetchStats();
            fetchDropdownLists();
        }
    }, [filters, currentTeacherId]);

    // Update date to current Philippines date on component mount and when window gains focus
    useEffect(() => {
        const updateDate = () => {
            setSelectedDate(getPhilippinesDate());
        };
        
        // Update on mount
        updateDate();
        
        // Update when window gains focus (user returns to tab)
        window.addEventListener('focus', updateDate);
        
        return () => {
            window.removeEventListener('focus', updateDate);
        };
    }, []);

    // Fetch attendance for selected date when date or class changes
    useEffect(() => {
        if (filters.class_subject_id && selectedDate) {
            fetchAttendanceForDate();
            fetchStats(); // Refresh stats when class changes
        } else {
            setStudentAttendanceMap({});
            // Reset stats when no class is selected
            if (!filters.class_subject_id) {
                setStats({
                    total_records: 0,
                    present_count: 0,
                    absent_count: 0,
                    late_count: 0,
                    excused_count: 0,
                    attendance_rate: 0,
                });
            }
        }
    }, [filters.class_subject_id, selectedDate]);

    // Load students for selected class
    useEffect(() => {
        const loadClassStudents = async () => {
            if (!filters.class_subject_id) {
                setClassStudents([]);
                return;
            }

            const selectedClassSubject = classSubjects.find(cs => cs.id === parseInt(filters.class_subject_id));
            if (!selectedClassSubject) {
                setClassStudents([]);
                return;
            }

            // Get class_id from class_subject - try multiple ways
            const classId = (selectedClassSubject as any).class_id 
                || (selectedClassSubject as any).class?.id
                || (selectedClassSubject as any).class_id;
            
            if (!classId) {
                console.warn('⚠️ Could not find class_id for class_subject:', selectedClassSubject);
                setClassStudents([]);
                return;
            }

            setLoadingClassStudents(true);
            try {
                const response = await adminGradeService.getStudentsMinimal(classId);
                if (response.success) {
                    setClassStudents(response.data || []);
                } else {
                    setClassStudents([]);
                }
            } catch (error) {
                console.error('Error loading class students:', error);
                setClassStudents([]);
            } finally {
                setLoadingClassStudents(false);
            }
        };

        if (classSubjects.length > 0 && filters.class_subject_id) {
            loadClassStudents();
        }
    }, [filters.class_subject_id, classSubjects]);


    const handleEdit = (attendance: AttendanceRecord) => {
        setSelectedAttendance(attendance);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleSave = async (data: AttendanceFormData) => {
        console.log('💾 handleSave called with data:', data);
        console.log('🔑 Data keys:', Object.keys(data));
        console.log('📅 attendance_date in data:', data.attendance_date);
        
        try {
            if (selectedAttendance) {
                console.log('✏️ Updating attendance:', selectedAttendance.id);
                await adminAttendanceService.updateAttendance(selectedAttendance.id, data);
                setNotification({ type: 'success', message: 'Attendance updated successfully!' });
            } else {
                console.log('➕ Creating new attendance');
                await adminAttendanceService.createAttendance(data);
                setNotification({ type: 'success', message: 'Attendance marked successfully!' });
            }
            setShowModal(false);
            setValidationErrors({});
            fetchAttendance();
            fetchStats();
        } catch (error: any) {
            console.error('❌ handleSave error:', error);
            if (error.message && error.message.includes(':')) {
                const errorParts = error.message.split(';').reduce((acc, part) => {
                    const [field, msg] = part.split(':').map(s => s.trim());
                    if (field && msg) acc[field] = [msg];
                    return acc;
                }, {} as Record<string, string[]>);
                setValidationErrors(errorParts);
            } else {
                setNotification({ type: 'error', message: error.message || 'Failed to save attendance.' });
            }
        }
    };

    const handleQuickMark = async (studentId: number, status: AttendanceStatus) => {
        if (!filters.class_subject_id) {
            setNotification({ type: 'error', message: 'Please select a class first.' });
            return;
        }

        try {
            const existingStatus = studentAttendanceMap[studentId];
            const existingRecordId = studentAttendanceRecordIds[studentId];

            // If clicking the same status, delete/unmark the attendance
            if (existingStatus === status && existingRecordId) {
                await adminAttendanceService.deleteAttendance(existingRecordId);
                setNotification({ type: 'success', message: `Attendance unmarked successfully!` });
            } 
            // If a different status exists, update it
            else if (existingStatus && existingRecordId) {
                await adminAttendanceService.updateAttendance(existingRecordId, { status });
                setNotification({ type: 'success', message: `Attendance updated to ${status} successfully!` });
            }
            // If no attendance exists, create a new one
            else {
                const data: AttendanceFormData = {
                    class_subject_id: parseInt(filters.class_subject_id),
                    student_id: studentId,
                    attendance_date: selectedDate,
                    status: status,
                };

                await adminAttendanceService.createAttendance(data);
                setNotification({ type: 'success', message: `Attendance marked as ${status} successfully!` });
            }

            // Refresh all data
            fetchAttendance();
            fetchStats();
            fetchAttendanceForDate(); // Refresh button states
        } catch (error: any) {
            console.error('Error marking attendance:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to mark attendance.' });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this attendance record?')) return;
        
        try {
            await adminAttendanceService.deleteAttendance(id);
            setNotification({ type: 'success', message: 'Attendance record deleted successfully!' });
            fetchAttendance();
            fetchStats();
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to delete attendance record.' });
        }
    };

    const getStatusBadge = (status: AttendanceStatus) => {
        const statusConfig = {
            'Present': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
            'Absent': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
            'Late': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
            'Excused': { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle },
        };

        const config = statusConfig[status] || statusConfig['Present'];
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                <Icon className="h-3 w-3 mr-1" />
                {status}
            </span>
        );
    };

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

    if (!isTeacher) {
        return (
            <AppLayout>
                <div className="p-8">
                    <div className="bg-red-50 border border-red-400 text-red-700 px-6 py-4 rounded-xl">
                        <div className="flex items-center">
                            <AlertCircle className="h-6 w-6 mr-3" />
                            <div>
                                <p className="font-bold">Access Denied</p>
                                <p className="text-sm">This page is only accessible to teachers.</p>
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <ClipboardCheck className={`h-8 w-8 mr-3 ${TEXT_COLOR_CLASS}`} />
                            Student Attendance Management
                         
                        </h1>
                        <p className="mt-2 text-gray-600">Track and manage student attendance for your classes</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => { 
                                fetchAttendance(); 
                                fetchStats(); 
                                fetchDropdownLists();
                                if (filters.class_subject_id && selectedDate) {
                                    fetchAttendanceForDate();
                                }
                            }}
                            className={`flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium ${TEXT_COLOR_CLASS} hover:bg-gray-50 transition-colors`}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </button>
                    </div>
                </div>

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <StatCard 
                            title="Total Students" 
                            value={filters.class_subject_id ? classStudents.length : 0} 
                            icon={ClipboardCheck} 
                            color={TEXT_COLOR_CLASS} 
                        />
                        <StatCard 
                            title="Present" 
                            value={stats.present_count || 0} 
                            icon={CheckCircle} 
                            color="text-green-600" 
                        />
                        <StatCard 
                            title="Absent" 
                            value={stats.absent_count || 0} 
                            icon={XCircle} 
                            color="text-red-600" 
                        />
                        <StatCard 
                            title="Attendance Rate" 
                            value={`${stats.attendance_rate?.toFixed(1) || 0}%`} 
                            icon={Users} 
                            color="text-blue-600" 
                        />
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="relative col-span-2">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                                className={`pl-12 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                placeholder="Search student..."
                            />
                        </div>
                        
                        <select
                            value={filters.class_subject_id}
                            onChange={(e) => setFilters({...filters, class_subject_id: e.target.value, page: 1})}
                            className={`px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                        >
                            <option value="">Select Classes</option>
                            {classSubjects.map(cs => (
                                <option key={cs.id} value={cs.id}>
                                    {cs.class?.class_code} - {cs.subject?.subject_code}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                            className={`px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                        >
                            <option value="">All Statuses</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late">Late</option>
                            <option value="Excused">Excused</option>
                        </select>
                    </div>
                    
                    {/* Attendance Marking Grid */}
                    {filters.class_subject_id && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Mark Attendance</h3>
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium text-gray-700">Date:</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className={`px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    />
                                </div>
                            </div>
                            
                            {loadingClassStudents ? (
                                <div className="text-center py-8">
                                    <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin mx-auto`} />
                                    <p className="mt-2 text-sm text-gray-600">Loading students...</p>
                                </div>
                            ) : classStudents.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No students enrolled in this class.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300">#</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300">Student ID</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300">Student Name</th>
                                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {classStudents.map((student, index) => (
                                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-300">{index + 1}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-300">{student.student_id}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">{student.full_name}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => handleQuickMark(student.id, 'Present')}
                                                                className={`px-4 py-2 rounded-lg transition-colors font-semibold text-sm shadow-sm ${
                                                                    studentAttendanceMap[student.id] === 'Present'
                                                                        ? 'bg-green-500 text-white hover:bg-green-600'
                                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                }`}
                                                                title="Present"
                                                            >
                                                                P
                                                            </button>
                                                            <button
                                                                onClick={() => handleQuickMark(student.id, 'Absent')}
                                                                className={`px-4 py-2 rounded-lg transition-colors font-semibold text-sm shadow-sm ${
                                                                    studentAttendanceMap[student.id] === 'Absent'
                                                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                }`}
                                                                title="Absent"
                                                            >
                                                                A
                                                            </button>
                                                            <button
                                                                onClick={() => handleQuickMark(student.id, 'Late')}
                                                                className={`px-4 py-2 rounded-lg transition-colors font-semibold text-sm shadow-sm ${
                                                                    studentAttendanceMap[student.id] === 'Late'
                                                                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                }`}
                                                                title="Late"
                                                            >
                                                                L
                                                            </button>
                                                            <button
                                                                onClick={() => handleQuickMark(student.id, 'Excused')}
                                                                className={`px-4 py-2 rounded-lg transition-colors font-semibold text-sm shadow-sm ${
                                                                    studentAttendanceMap[student.id] === 'Excused'
                                                                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                }`}
                                                                title="Excused"
                                                            >
                                                                E
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {showModal && (
                    <AttendanceModal
                        attendance={selectedAttendance}
                        onClose={() => setShowModal(false)}
                        onSave={handleSave}
                        errors={validationErrors}
                        classSubjects={classSubjects}
                        students={students}
                        loadingLists={loadingLists}
                    />
                )}

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

export default AttendancePage;