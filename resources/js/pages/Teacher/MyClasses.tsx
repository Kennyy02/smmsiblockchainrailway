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
    School
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
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className={`text-3xl font-bold ${color}`}>{displayValue}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
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
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:scale-[1.02] overflow-hidden">
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
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Subject</p>
                    <p className="text-lg font-bold text-gray-900">
                        {classSubject.subject?.subject_name || 'Unknown Subject'}
                    </p>
                    <p className="text-sm text-gray-600">
                        {classSubject.subject?.subject_code || 'N/A'}
                    </p>
                </div>

                {/* Academic Info */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Academic Year</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {classSubject.academic_year?.year_name || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Semester</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {classSubject.semester?.semester_name || 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                {classSubject.subject?.units && (
                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Units</p>
                        <p className="text-sm font-semibold text-gray-900">
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
            <div className="p-8 space-y-6 min-h-screen bg-[#f3f4f6]">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <GraduationCap className={`h-8 w-8 mr-3 ${TEXT_COLOR_CLASS}`} />
                            My Assigned Classes & Subjects
                        </h1>
                        <p className="mt-2 text-gray-600">
                            View and manage all classes assigned to you
                        </p>
                    </div>
                    <button
                        onClick={fetchMyClasses}
                        className={`flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium ${TEXT_COLOR_CLASS} hover:bg-gray-50 transition-colors`}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </button>
                </div>

                {/* Advisory Class Card */}
                {teacherInfo?.advisory_class && (
                    <div className={`${PRIMARY_COLOR_CLASS} rounded-2xl shadow-lg p-6 text-white`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Star className="h-5 w-5 fill-white" />
                                    <span className="text-sm font-semibold uppercase tracking-wider opacity-90">Advisory Class</span>
                                </div>
                                <h2 className="text-2xl font-bold">{teacherInfo.advisory_class.class_code}</h2>
                                <p className="text-white/80">{teacherInfo.advisory_class.class_name}</p>
                                {teacherInfo.advisory_class.program && (
                                    <p className="text-sm text-white/70 mt-1">{teacherInfo.advisory_class.program}</p>
                                )}
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                                <School className="h-10 w-10 text-white" />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <a 
                                href={`/teacher/advisory-students/${teacherInfo.advisory_class.id}`}
                                className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Users className="h-4 w-4 mr-2" />
                                View Students
                            </a>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        title="Classes Assigned" 
                        value={stats.totalClasses} 
                        icon={BookOpen} 
                        color={TEXT_COLOR_CLASS}
                        subtitle="Different classes"
                    />
                    <StatCard 
                        title="Subjects Teaching" 
                        value={stats.totalSubjects} 
                        icon={FileText} 
                        color="text-blue-600"
                        subtitle="Unique subjects assigned"
                    />
                    <StatCard 
                        title="Current Semester" 
                        value={stats.currentSemesterClasses} 
                        icon={Calendar} 
                        color="text-green-600"
                        subtitle="Active this semester"
                    />
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative col-span-2">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <BookOpen className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                                placeholder="Search by class or subject name..."
                            />
                        </div>

                        <select
                            value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}
                            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all appearance-none bg-white"
                        >
                            <option value="">All Semesters</option>
                            {uniqueSemesters.map((semester, idx) => (
                                <option key={idx} value={semester}>{semester}</option>
                            ))}
                        </select>
                    </div>
                </div>


                {/* My Classes Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className={`h-12 w-12 ${TEXT_COLOR_CLASS} animate-spin`} />
                        <p className="ml-4 text-lg text-gray-600">Loading your classes...</p>
                    </div>
                ) : classesWithSubjects.length === 0 && !teacherInfo?.advisory_class ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                        <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchTerm || filterSemester ? 'No classes match your filters' : 'No classes assigned yet'}
                        </h3>
                        <p className="text-gray-600">
                            {searchTerm || filterSemester 
                                ? 'Try adjusting your search or filter criteria'
                                : 'You will see your assigned classes here once they are set up'}
                        </p>
                        {(searchTerm || filterSemester) && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterSemester('');
                                    setFilterYear('');
                                }}
                                className={`mt-4 px-6 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-lg ${HOVER_COLOR_CLASS} transition-all font-medium`}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : filteredClasses.length > 0 && (
                    <>
                        <h2 className={`text-xl font-bold ${TEXT_COLOR_CLASS} mb-4`}>My Classes</h2>
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className={`${PRIMARY_COLOR_CLASS} text-white`}>
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold">#</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold">Class</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold">Subject</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold">Program</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold">Semester</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredClasses.map((classSubject, index) => (
                                            <tr 
                                                key={classSubject.id}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className={`text-sm font-semibold ${TEXT_COLOR_CLASS}`}>
                                                            {classSubject.class?.class_code || 'N/A'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {classSubject.class?.class_name}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {classSubject.subject?.subject_name || 'N/A'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {classSubject.subject?.subject_code}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-600">
                                                        {classSubject.class?.program ? `${classSubject.class.program} - ${formatYearLevel(classSubject.class.year_level)}` : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-600">
                                                        {classSubject.semester?.semester_name || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <a
                                                            href={`/teacher/advisory-students/${classSubject.class?.id}`}
                                                            className={`inline-flex items-center px-3 py-1.5 text-xs font-medium ${LIGHT_BG_CLASS} ${TEXT_COLOR_CLASS} rounded-lg hover:bg-[#003366]/20 transition-colors`}
                                                        >
                                                            <Users className="h-3.5 w-3.5 mr-1" />
                                                            Students
                                                        </a>
                                                        <a
                                                            href={`/teacher/grades?class_subject_id=${classSubject.id}`}
                                                            className={`inline-flex items-center px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors`}
                                                        >
                                                            <Award className="h-3.5 w-3.5 mr-1" />
                                                            Grades
                                                        </a>
                                                        <a
                                                            href={`/teacher/attendance?class_subject_id=${classSubject.id}`}
                                                            className={`inline-flex items-center px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors`}
                                                        >
                                                            <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                                                            Attendance
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Results count */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                                <p className="text-sm text-gray-600">
                                    Showing {filteredClasses.length} of {classSubjects.length} classes
                                </p>
                            </div>
                        </div>
                    </>
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

export default MyClasses;