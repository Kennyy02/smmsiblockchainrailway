import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Search,
    RefreshCw,
    ArrowLeft,
    GraduationCap,
    Mail,
    Phone,
    User,
    BookOpen,
    AlertCircle,
    Star,
    School
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useTeacherAuth } from '../../../services/useTeacherAuth';

interface Student {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    email?: string;
    phone?: string;
    gender?: string;
    year_level?: number;
    program?: string;
    enrollment_status?: string;
    enrollment_date?: string;
}

interface ClassInfo {
    id: number;
    class_code: string;
    class_name: string;
    program?: string;
    year_level?: number;
    section?: string;
    academic_year?: string;
    semester?: string;
}

interface Props {
    classId?: number | null;
}

const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';

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

const AdvisoryStudents: React.FC<Props> = ({ classId: propClassId }) => {
    const { currentTeacherId, isTeacher, teacher } = useTeacherAuth();
    
    const [students, setStudents] = useState<Student[]>([]);
    const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentClassId, setCurrentClassId] = useState<number | null>(propClassId || null);
    const [teacherAdvisoryClassId, setTeacherAdvisoryClassId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Check if the current class is the teacher's advisory class
    const isAdvisoryClass = teacherAdvisoryClassId !== null && currentClassId === teacherAdvisoryClassId;

    // Fetch teacher info to get their advisory class
    const fetchTeacherInfo = async () => {
        if (!currentTeacherId) return;
        
        try {
            const response = await fetch(`/api/teachers/${currentTeacherId}`);
            const data = await response.json();
            if (data.success && data.data?.advisory_class?.id) {
                setTeacherAdvisoryClassId(data.data.advisory_class.id);
                // If no class ID provided in props, use advisory class
                if (!propClassId) {
                    setCurrentClassId(data.data.advisory_class.id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch teacher info:', error);
        }
    };

    // Fetch students in the class
    const fetchStudents = async () => {
        if (!currentClassId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`/api/classes/${currentClassId}/students?per_page=100`);
            const data = await response.json();
            
            if (data.success) {
                setStudents(data.data || []);
                setClassInfo(data.class_info || null);
            } else {
                setError(data.message || 'Failed to load students');
            }
        } catch (error) {
            console.error('Failed to fetch students:', error);
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentTeacherId) {
            fetchTeacherInfo();
        }
    }, [currentTeacherId]);

    useEffect(() => {
        if (currentClassId) {
            fetchStudents();
        }
    }, [currentClassId]);

    // Filter students based on search term
    const filteredStudents = students.filter(student => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            student.student_id?.toLowerCase().includes(search) ||
            student.first_name?.toLowerCase().includes(search) ||
            student.last_name?.toLowerCase().includes(search) ||
            student.email?.toLowerCase().includes(search)
        );
    });

    // Access denied if not a teacher
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
                        <div className="flex items-center gap-3 mb-2">
                            <a 
                                href="/teacher/my-classes"
                                className={`flex items-center px-3 py-2 text-sm ${TEXT_COLOR_CLASS} hover:bg-gray-100 rounded-lg transition-colors`}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to My Classes
                            </a>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <Users className={`h-8 w-8 mr-3 ${TEXT_COLOR_CLASS}`} />
                            {isAdvisoryClass ? 'Advisory Class Students' : 'Class Students'}
                        </h1>
                        <p className="mt-2 text-gray-600">
                            {isAdvisoryClass ? 'View and manage students in your advisory class' : 'View students in this class'}
                        </p>
                    </div>
                    <button
                        onClick={fetchStudents}
                        className={`flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium ${TEXT_COLOR_CLASS} hover:bg-gray-50 transition-colors`}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Class Info Card - Different styling for advisory vs regular class */}
                {classInfo && (
                    <div className={`${isAdvisoryClass ? PRIMARY_COLOR_CLASS + ' text-white' : 'bg-white border border-gray-200'} rounded-2xl shadow-lg p-6`}>
                        <div className="flex items-center justify-between">
                            <div>
                                {isAdvisoryClass && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star className="h-5 w-5 fill-white" />
                                        <span className="text-sm font-semibold uppercase tracking-wider opacity-90">Advisory Class</span>
                                    </div>
                                )}
                                <h2 className={`text-2xl font-bold ${isAdvisoryClass ? '' : TEXT_COLOR_CLASS}`}>{classInfo.class_code}</h2>
                                {classInfo.program && (
                                    <p className={`text-sm mt-1 ${isAdvisoryClass ? 'text-white/80' : 'text-gray-600'}`}>
                                        {getFullCourseName(classInfo.program)} - {formatYearLevel(classInfo.year_level)}
                                    </p>
                                )}
                                <div className={`flex items-center gap-4 mt-3 text-sm ${isAdvisoryClass ? 'text-white/70' : 'text-gray-500'}`}>
                                    {classInfo.academic_year && (
                                        <span>AY: {classInfo.academic_year}</span>
                                    )}
                                    {classInfo.semester && (
                                        <span>• {classInfo.semester}</span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`${isAdvisoryClass ? 'bg-white/20 backdrop-blur-sm' : LIGHT_BG_CLASS} p-4 rounded-xl inline-flex flex-col items-center`}>
                                    <School className={`h-8 w-8 mb-1 ${isAdvisoryClass ? 'text-white' : TEXT_COLOR_CLASS}`} />
                                    <span className={`text-2xl font-bold ${isAdvisoryClass ? '' : TEXT_COLOR_CLASS}`}>{filteredStudents.length}</span>
                                    <span className={`text-xs ${isAdvisoryClass ? 'text-white/80' : 'text-gray-500'}`}>Students</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                            placeholder="Search by student ID, name, or email..."
                        />
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 mr-3" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className={`h-12 w-12 ${TEXT_COLOR_CLASS} animate-spin`} />
                        <p className="ml-4 text-lg text-gray-600">Loading students...</p>
                    </div>
                ) : !currentClassId ? (
                    // No Class Selected
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                        <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No Class Selected
                        </h3>
                        <p className="text-gray-600">
                            Please select a class to view its students.
                        </p>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    // No Students Found
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchTerm ? 'No students match your search' : 'No students enrolled'}
                        </h3>
                        <p className="text-gray-600">
                            {searchTerm 
                                ? 'Try adjusting your search criteria' 
                                : 'There are no students enrolled in this class yet'}
                        </p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className={`mt-4 px-6 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-lg ${HOVER_COLOR_CLASS} transition-all font-medium`}
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    // Students List
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className={`${PRIMARY_COLOR_CLASS} text-white`}>
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">#</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Student ID</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Gender</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredStudents.map((student, index) => (
                                        <tr 
                                            key={student.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-sm font-mono font-medium ${TEXT_COLOR_CLASS}`}>
                                                    {student.student_id}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className={`${LIGHT_BG_CLASS} p-2 rounded-full mr-3`}>
                                                        <User className={`h-5 w-5 ${TEXT_COLOR_CLASS}`} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {student.last_name}, {student.first_name}
                                                            {student.middle_name && ` ${student.middle_name.charAt(0)}.`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {student.email ? (
                                                    <a 
                                                        href={`mailto:${student.email}`}
                                                        className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
                                                    >
                                                        <Mail className="h-4 w-4 mr-2" />
                                                        {student.email}
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600 capitalize">
                                                    {student.gender || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full
                                                    ${student.enrollment_status === 'enrolled' 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : student.enrollment_status === 'completed'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {student.enrollment_status || 'Active'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Results count */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                            <p className="text-sm text-gray-600">
                                Showing {filteredStudents.length} of {students.length} students
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default AdvisoryStudents;

