import React, { useState, useEffect } from 'react';
import { 
    BookOpen, 
    Users, 
    Calendar, 
    Clock, 
    RefreshCw,
    ChevronRight,
    GraduationCap,
    FileText,
    ClipboardCheck,
    Award,
    AlertCircle,
    Star,
    School,
    LayoutGrid,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    UserCheck
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useTeacherAuth } from '../../../services/useTeacherAuth';
import {
    adminClassSubjectService,
    ClassSubject,
    ClassSubjectsResponse
} from '../../../services/AdminClassSubjectService';

interface TeacherInfo {
    id: number;
    teacher_id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    advisory_class?: {
        id: number;
        class_code: string;
        class_name: string;
        program?: string;
        year_level?: number;
    } | null;
    subjects?: {
        id: number;
        subject_code: string;
        subject_name: string;
        units?: number;
    }[];
}

interface TeacherClass {
    id: number;
    class_code: string;
    class_name: string;
    program?: string;
    year_level?: number;
    course?: {
        id: number;
        course_code: string;
        course_name: string;
    };
}

// Interface for classes with their subjects (derived from class-subject assignments)
interface ClassWithSubjects {
    id: number;
    class_code: string;
    class_name: string;
    program?: string;
    year_level?: number;
    subjects: {
        id: number;
        subject_code: string;
        subject_name: string;
    }[];
}

const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]';

// Helper function to format year level for college (1st Year, 2nd Year, etc.)
const formatYearLevel = (yearLevel: number | undefined): string => {
    if (!yearLevel) return '';
    switch (yearLevel) {
        case 1: return '1st Year';
        case 2: return '2nd Year';
        case 3: return '3rd Year';
        case 4: return '4th Year';
        case 5: return '5th Year';
        default: return `${yearLevel}th Year`;
    }
};

// Helper function to get full course name from program code
const getFullCourseName = (programCode: string | undefined): string => {
    if (!programCode) return '';
    const courseNames: { [key: string]: string } = {
        'BSIT': 'Bachelor of Science in Information Technology',
        'BSCS': 'Bachelor of Science in Computer Science',
        'BSMT': 'Bachelor of Science in Marine Transportation',
        'BSMarE': 'Bachelor of Science in Marine Engineering',
        'BSBA': 'Bachelor of Science in Business Administration',
        'BSA': 'Bachelor of Science in Accountancy',
        'BSED': 'Bachelor of Secondary Education',
        'BEED': 'Bachelor of Elementary Education',
        'BSN': 'Bachelor of Science in Nursing',
        'BSHM': 'Bachelor of Science in Hospitality Management',
        'BSTM': 'Bachelor of Science in Tourism Management',
    };
    return courseNames[programCode] || programCode;
};

interface Notification {
    type: 'success' | 'error';
    message: string;
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
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    icon: React.ElementType; 
    color: string;
    subtitle?: string;
}> = ({ title, value, icon: Icon, color, subtitle }) => {
    const displayValue = (typeof value === 'number' && isNaN(value)) ? 'N/A' : value;
    const bgColor = color.replace('text-', 'bg-').replace('-600', '-100').replace('[#003366]', '[#003366]/10');
    
    return (
        <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-white hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-white mb-1">{title}</p>
                    <p className={`text-3xl font-bold ${color}`}>{displayValue}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 dark:text-white mt-1">{subtitle}</p>
                    )}
                </div>
                <div className={`${bgColor} p-3 rounded-xl`}>
                    <Icon className={`h-8 w-8 ${color}`} />
                </div>
            </div>
        </div>
    );
};

const ClassCard: React.FC<{ classSubject: ClassSubject }> = ({ classSubject }) => {
    return (
        <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg border border-gray-100 dark:border-white hover:shadow-xl transition-all hover:scale-[1.02] overflow-hidden">
            {/* Header with gradient */}
            <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            {classSubject.class?.class_code || 'N/A'}
                        </h3>
                        <p className="text-sm text-white/80">
                            {classSubject.class?.class_name || 'Unknown Class'}
                        </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                        <BookOpen className="h-6 w-6 text-white" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
                {/* Subject Info */}
                <div>
                    <p className="text-xs text-gray-500 dark:text-white uppercase tracking-wider mb-1">Subject</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {classSubject.subject?.subject_name || 'Unknown Subject'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-white">
                        {classSubject.subject?.subject_code || 'N/A'}
                    </p>
                </div>

                {/* Academic Info */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-white">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-white mb-1">Academic Year</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {classSubject.academic_year?.year_name || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-white mb-1">Semester</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {classSubject.semester?.semester_name || 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                {classSubject.subject?.units && (
                    <div className="pt-4 border-t border-gray-100 dark:border-white">
                        <p className="text-xs text-gray-500 dark:text-white mb-1">Units</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {classSubject.subject.units} {classSubject.subject.units === 1 ? 'unit' : 'units'}
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                    <a
                        href={`/teacher/assignments?class_subject_id=${classSubject.id}`}
                        className={`flex items-center justify-center px-4 py-2 ${LIGHT_BG_CLASS} ${TEXT_COLOR_CLASS} rounded-lg ${LIGHT_HOVER_CLASS} transition-colors text-sm font-medium`}
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Assignments
                    </a>
                    <a
                        href={`/teacher/grades?class_subject_id=${classSubject.id}`}
                        className={`flex items-center justify-center px-4 py-2 ${LIGHT_BG_CLASS} ${TEXT_COLOR_CLASS} rounded-lg ${LIGHT_HOVER_CLASS} transition-colors text-sm font-medium`}
                    >
                        <Award className="h-4 w-4 mr-2" />
                        Grades
                    </a>
                </div>

                <a
                    href={`/teacher/attendance?class_subject_id=${classSubject.id}`}
                    className={`flex items-center justify-center w-full px-4 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-lg ${HOVER_COLOR_CLASS} transition-all text-sm font-medium shadow-lg`}
                >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Attendance
                </a>
            </div>
        </div>
    );
};

const MyClasses: React.FC = () => {
    // ✅ DYNAMIC: Get current teacher ID from auth (now using fixed hook)
    const { currentTeacherId, isTeacher, user, teacher } = useTeacherAuth();
    
    const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
    const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
    const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSemester, setFilterSemester] = useState('');
    const [filterYear, setFilterYear] = useState('');

    const fetchTeacherInfo = async () => {
        if (!currentTeacherId) return;
        
        try {
            const response = await fetch(`/api/teachers/${currentTeacherId}`);
            const data = await response.json();
            if (data.success) {
                setTeacherInfo(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch teacher info:', error);
        }
    };

    const fetchTeacherClasses = async () => {
        if (!currentTeacherId) return;
        
        try {
            const response = await fetch(`/api/teachers/${currentTeacherId}/classes`);
            const data = await response.json();
            if (data.success) {
                setTeacherClasses(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch teacher classes:', error);
        }
    };

    const fetchMyClasses = async () => {
        if (!currentTeacherId) {
            console.warn('⚠️ No teacher ID available, teacher data:', teacher);
            setLoading(false);
            return;
        }
        
        setLoading(true);
        try {
            console.log('🔍 [MY CLASSES] Fetching classes for teacher ID:', currentTeacherId);
            
            const response = await adminClassSubjectService.getClassSubjects({
                teacher_id: currentTeacherId,
                per_page: 999, // Get all
            });
            
            console.log('📦 [MY CLASSES] Response:', response);
            
            if (response.success) {
                const data = Array.isArray(response.data) ? response.data : [];
                setClassSubjects(data);
                console.log('✅ [MY CLASSES] Loaded', data.length, 'class-subjects');
            }
        } catch (error) {
            console.error('❌ [MY CLASSES] Failed to fetch:', error);
            setNotification({ type: 'error', message: 'Failed to load your classes.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('🔍 [MY CLASSES] Auth state - teacherId:', currentTeacherId, 'teacher:', teacher, 'user:', user);
        if (currentTeacherId) {
            fetchTeacherInfo();
            fetchTeacherClasses();
            fetchMyClasses();
        } else if (!isTeacher) {
            setLoading(false);
        }
    }, [currentTeacherId]);

    // Filter classes based on search and filters
    const filteredClasses = classSubjects.filter(cs => {
        const matchesSearch = !searchTerm || 
            cs.class?.class_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cs.class?.class_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cs.subject?.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cs.subject?.subject_code?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesSemester = !filterSemester || cs.semester_id?.toString() === filterSemester;
        const matchesYear = !filterYear || cs.academic_year_id?.toString() === filterYear;

        return matchesSearch && matchesSemester && matchesYear;
    });

    // Get unique semesters and years for filters
    const uniqueSemesters = Array.from(new Set(classSubjects.map(cs => cs.semester?.semester_name).filter(Boolean)));
    const uniqueYears = Array.from(new Set(classSubjects.map(cs => cs.academic_year?.year_name).filter(Boolean)));

    // Derive unique classes with their subjects from class-subject assignments
    const classesWithSubjects: ClassWithSubjects[] = React.useMemo(() => {
        const classMap = new Map<number, ClassWithSubjects>();
        
        classSubjects.forEach(cs => {
            if (!cs.class?.id) return;
            
            const classId = cs.class.id;
            
            if (!classMap.has(classId)) {
                classMap.set(classId, {
                    id: classId,
                    class_code: cs.class.class_code || 'N/A',
                    class_name: cs.class.class_name || 'Unknown',
                    program: cs.class.program,
                    year_level: cs.class.year_level,
                    subjects: []
                });
            }
            
            // Add subject if not already added
            const classData = classMap.get(classId)!;
            if (cs.subject && !classData.subjects.some(s => s.id === cs.subject!.id)) {
                classData.subjects.push({
                    id: cs.subject.id,
                    subject_code: cs.subject.subject_code || cs.subject.code || 'N/A',
                    subject_name: cs.subject.subject_name || cs.subject.name || 'Unknown'
                });
            }
        });
        
        return Array.from(classMap.values());
    }, [classSubjects]);

    // Calculate stats - use derived classes
    const uniqueClassIds = classesWithSubjects.map(c => c.id);
    // Include advisory class in count if exists and not already in the list
    const advisoryClassId = teacherInfo?.advisory_class?.id;
    const allClassIds = advisoryClassId && !uniqueClassIds.includes(advisoryClassId)
        ? [...uniqueClassIds, advisoryClassId]
        : uniqueClassIds;
    
    const stats = {
        totalClasses: allClassIds.length,
        totalSubjects: new Set([
            ...classSubjects.map(cs => cs.subject_id),
            ...(teacherInfo?.subjects?.map(s => s.id) || [])
        ]).size,
        currentSemesterClasses: classSubjects.filter(cs => cs.semester?.is_current).length,
        hasAdvisoryClass: !!teacherInfo?.advisory_class,
    };

    // ✅ GUARD: Show access denied if not a teacher
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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
                    {/* Header */}
                    <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center mb-4 sm:mb-6 md:mb-0">
                            <div className={`${PRIMARY_COLOR_CLASS} p-2 sm:p-3 rounded-lg sm:rounded-xl mr-2 sm:mr-3 md:mr-4`}>
                                <LayoutGrid className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">My Assigned Classes</h1>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 sm:mt-1">View and manage all classes and subjects assigned to you</p>
                            </div>
                        </div>
                        <div className="flex space-x-2 sm:space-x-3">
                            <button 
                                onClick={fetchMyClasses}
                                className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                            >
                                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${loading ? 'animate-spin' : ''} dark:text-gray-300`} />
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards - Mobile: Centered with icon below, Desktop: Icon on right */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100 dark:border-gray-700">
                            {/* Mobile: Centered layout */}
                            <div className="flex flex-col items-center text-center md:hidden">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">Total</p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">{stats.totalClasses}</p>
                                <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-2 sm:p-3 rounded-full`}>
                                    <LayoutGrid className={`h-5 w-5 sm:h-6 sm:w-6 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                </div>
                            </div>
                            {/* Desktop: Original layout with icon on right */}
                            <div className="hidden md:flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Total Classes</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalClasses}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-3 rounded-xl`}>
                                    <LayoutGrid className={`h-8 w-8 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100 dark:border-gray-700">
                            {/* Mobile: Centered layout */}
                            <div className="flex flex-col items-center text-center md:hidden">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">Subjects</p>
                                <p className={`text-2xl sm:text-3xl font-bold ${TEXT_COLOR_CLASS} dark:text-white mb-2 sm:mb-3`}>{stats.totalSubjects}</p>
                                <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-2 sm:p-3 rounded-full`}>
                                    <BookOpen className={`h-5 w-5 sm:h-6 sm:w-6 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                </div>
                            </div>
                            {/* Desktop: Original layout with icon on right */}
                            <div className="hidden md:flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Subjects Teaching</p>
                                    <p className={`text-3xl font-bold ${TEXT_COLOR_CLASS} dark:text-white`}>{stats.totalSubjects}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-3 rounded-xl`}>
                                    <BookOpen className={`h-8 w-8 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100 dark:border-gray-700">
                            {/* Mobile: Centered layout */}
                            <div className="flex flex-col items-center text-center md:hidden">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">Current</p>
                                <p className={`text-2xl sm:text-3xl font-bold ${TEXT_COLOR_CLASS} dark:text-white mb-2 sm:mb-3`}>{stats.currentSemesterClasses}</p>
                                <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-2 sm:p-3 rounded-full`}>
                                    <Calendar className={`h-5 w-5 sm:h-6 sm:w-6 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                </div>
                            </div>
                            {/* Desktop: Original layout with icon on right */}
                            <div className="hidden md:flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Current Semester</p>
                                    <p className={`text-3xl font-bold ${TEXT_COLOR_CLASS} dark:text-white`}>{stats.currentSemesterClasses}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-3 rounded-xl`}>
                                    <Calendar className={`h-8 w-8 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100 dark:border-gray-700">
                            {/* Mobile: Centered layout */}
                            <div className="flex flex-col items-center text-center md:hidden">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">Advisory</p>
                                <p className={`text-2xl sm:text-3xl font-bold ${TEXT_COLOR_CLASS} dark:text-white mb-2 sm:mb-3`}>{stats.hasAdvisoryClass ? '1' : '0'}</p>
                                <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-2 sm:p-3 rounded-full`}>
                                    <UserCheck className={`h-5 w-5 sm:h-6 sm:w-6 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                </div>
                            </div>
                            {/* Desktop: Original layout with icon on right */}
                            <div className="hidden md:flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Advisory Class</p>
                                    <p className={`text-3xl font-bold ${TEXT_COLOR_CLASS} dark:text-white`}>{stats.hasAdvisoryClass ? '1' : '0'}</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-3 rounded-xl`}>
                                    <UserCheck className={`h-8 w-8 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters - Compact on Mobile */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`pl-10 sm:pl-12 w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                                    placeholder="Search code, name, or program..."
                                />
                            </div>
                            <div className="flex items-center">
                                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 mr-2 sm:mr-3" />
                                <select
                                    value={filterSemester}
                                    onChange={(e) => setFilterSemester(e.target.value)}
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none`}
                                >
                                    <option value="">Filter by Semester...</option>
                                    {uniqueSemesters.map((semester, idx) => (
                                        <option key={idx} value={semester}>{semester}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center">
                                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 mr-2 sm:mr-3" />
                                <select
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value)}
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none`}
                                >
                                    <option value="">Filter by Academic Year...</option>
                                    {uniqueYears.map((year, idx) => (
                                        <option key={idx} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>


                    {/* Table - Responsive: Mobile shows Class Code & Name + Actions, Desktop shows all columns */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className={`${PRIMARY_COLOR_CLASS}`}>
                                    <tr>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Class Code & Name</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Subject</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Program & Year</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Semester</th>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <RefreshCw className={`h-6 w-6 sm:h-8 sm:w-8 ${TEXT_COLOR_CLASS} dark:text-white animate-spin mb-2`} />
                                                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Loading classes...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredClasses.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500 dark:text-gray-400">
                                                <div className="flex flex-col items-center">
                                                    <LayoutGrid className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mb-3 sm:mb-4" />
                                                    <p className="text-base sm:text-lg font-medium dark:text-white">
                                                        {searchTerm || filterSemester || filterYear ? 'No classes match your filters' : 'No classes assigned yet'}
                                                    </p>
                                                    <p className="text-xs sm:text-sm dark:text-gray-400">
                                                        {searchTerm || filterSemester || filterYear 
                                                            ? 'Try adjusting your search or filter criteria'
                                                            : 'You will see your assigned classes here once they are set up'}
                                                    </p>
                                                    {(searchTerm || filterSemester || filterYear) && (
                                                        <button
                                                            onClick={() => {
                                                                setSearchTerm('');
                                                                setFilterSemester('');
                                                                setFilterYear('');
                                                            }}
                                                            className={`mt-4 px-4 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-lg ${HOVER_COLOR_CLASS} transition-all font-medium text-sm`}
                                                        >
                                                            Clear Filters
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredClasses.map((classSubject) => (
                                            <tr 
                                                key={classSubject.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                    <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">{classSubject.class?.class_code || 'N/A'}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{classSubject.class?.class_name || 'Unknown Class'}</div>
                                                    {/* Show additional info on mobile */}
                                                    <div className="md:hidden mt-1 space-y-1">
                                                        <div className="text-xs text-gray-600 dark:text-gray-300">
                                                            <span className="font-medium">{classSubject.subject?.subject_name || 'N/A'}</span>
                                                            <span className="text-gray-500 dark:text-gray-400"> ({classSubject.subject?.subject_code})</span>
                                                        </div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-300">
                                                            {classSubject.class?.program ? `${classSubject.class.program} - ${formatYearLevel(classSubject.class.year_level)}` : '-'}
                                                        </div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-300">
                                                            {classSubject.semester?.semester_name || '-'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{classSubject.subject?.subject_name || 'N/A'}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{classSubject.subject?.subject_code || ''}</div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{classSubject.class?.program || '-'}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{classSubject.class?.year_level ? formatYearLevel(classSubject.class.year_level) : '-'}</div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-white">{classSubject.semester?.semester_name || '-'}</td>
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end space-x-1 sm:space-x-2">
                                                        <a
                                                            href={`/teacher/grades?class_subject_id=${classSubject.id}`}
                                                            className="p-1.5 sm:p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                                            title="View Grades"
                                                        >
                                                            <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </a>
                                                        <a
                                                            href={`/teacher/attendance?class_subject_id=${classSubject.id}`}
                                                            className={`p-1.5 sm:p-2 ${TEXT_COLOR_CLASS} dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors`}
                                                            title="View Attendance"
                                                        >
                                                            <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </a>
                                                        <a
                                                            href={`/teacher/advisory-students/${classSubject.class?.id}`}
                                                            className="p-1.5 sm:p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                                                            title="View Students"
                                                        >
                                                            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Results count */}
                        {!loading && filteredClasses.length > 0 && (
                            <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                    Showing {filteredClasses.length} of {classSubjects.length} class-subject assignments
                                </p>
                            </div>
                        )}
                    </div>
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

export default MyClasses;
export default MyClasses;