import React, { useState, useEffect } from 'react';
import { 
    Users, 
    GraduationCap, 
    BookOpen, 
    Award, 
    ClipboardCheck, 
    RefreshCw,
    Calendar,
    School,
    ChevronRight,
    Search
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { usePage } from '@inertiajs/react';
import { adminClassSubjectService } from '../../../services/AdminClassSubjectService';
import { adminGradeService } from '../../../services/AdminGradeService';
import { adminAttendanceService } from '../../../services/AdminAttendanceService';

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#007bff]'; 
const TEXT_COLOR_CLASS = 'text-[#007bff]';
const HOVER_COLOR_CLASS = 'hover:bg-[#0056b3]';

// ========================================================================
// 📦 INTERFACES
// ========================================================================

interface StudentDetails {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    full_name: string;
    program?: string;
    year_level?: number;
    section?: string;
    course?: {
        id: number;
        course_code: string;
        course_name: string;
        level?: string;
    };
}

interface ParentDetails {
    id: number;
    first_name: string;
    last_name: string;
    middle_name?: string;
    full_name: string;
    email: string;
    phone?: string;
    students?: StudentDetails[];
}

interface AuthUser {
    id: number;
    role: string;
    name?: string;
    email?: string;
    parent?: ParentDetails;
}

interface ChildInfo {
    student: StudentDetails;
    totalSubjects: number;
    overallAvgGrade: number;
    overallAttendanceRate: number;
}

// Helper function for grade level formatting
const formatGradeLevel = (grade?: number): string => {
    if (!grade) return 'N/A';
    if (grade >= 13) {
        const yearNames = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
        return yearNames[grade - 13] || `${grade - 12}th Year`;
    }
    return `Grade ${grade}`;
};

// ========================================================================
// 💡 COMPONENTS
// ========================================================================

const ChildCard: React.FC<{ 
    childInfo: ChildInfo; 
    index: number;
    onViewDetails: (studentId: number) => void;
}> = ({ childInfo, index, onViewDetails }) => {
    const { student, totalSubjects, overallAvgGrade, overallAttendanceRate } = childInfo;

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-xl mr-4">
                        <GraduationCap className="h-6 w-6 text-blue-700" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            {student.full_name || `${student.first_name} ${student.last_name}`}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Student ID: {student.student_id}</p>
                    </div>
                </div>
                <button
                    onClick={() => onViewDetails(student.id)}
                    className={`px-4 py-2 ${TEXT_COLOR_CLASS} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center`}
                >
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Program</p>
                    <p className="text-sm font-medium text-gray-900">
                        {student.course?.course_name || student.program || 'N/A'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Grade Level</p>
                    <p className="text-sm font-medium text-gray-900">
                        {formatGradeLevel(student.year_level)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Section</p>
                    <p className="text-sm font-medium text-gray-900">
                        {student.section || 'N/A'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Subjects</p>
                    <p className="text-sm font-medium text-gray-900">
                        {totalSubjects}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div className="flex items-center">
                    <Award className="h-5 w-5 text-indigo-600 mr-2" />
                    <div>
                        <p className="text-xs text-gray-400">Average Grade</p>
                        <p className="text-lg font-bold text-indigo-600">
                            {overallAvgGrade.toFixed(2)}%
                        </p>
                    </div>
                </div>
                <div className="flex items-center">
                    <ClipboardCheck className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                        <p className="text-xs text-gray-400">Attendance Rate</p>
                        <p className="text-lg font-bold text-green-600">
                            {overallAttendanceRate.toFixed(2)}%
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                    <a
                        href={`/parent/grades?student_id=${student.id}`}
                        className={`flex-1 px-3 py-2 text-center text-sm font-medium ${TEXT_COLOR_CLASS} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors`}
                    >
                        View Grades
                    </a>
                    <a
                        href={`/parent/attendance?student_id=${student.id}`}
                        className={`flex-1 px-3 py-2 text-center text-sm font-medium ${TEXT_COLOR_CLASS} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors`}
                    >
                        View Attendance
                    </a>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 👨‍👩‍👧‍👦 PARENT CHILDREN PAGE
// ========================================================================

const ParentChildrenPage: React.FC = () => {
    const { auth } = usePage().props as { auth: { user: AuthUser } };
    const user = auth?.user;
    const parent = user?.parent;
    const children = parent?.students || [];

    const [childrenInfo, setChildrenInfo] = useState<ChildInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchChildrenData = async () => {
        if (!children || children.length === 0) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const childInfoPromises = children.map(async (child) => {
                const studentId = child.id;

                const [classSubjectsRes, gradeStatsRes, attendanceStatsRes] = await Promise.all([
                    adminClassSubjectService.getClassSubjects({ student_id: studentId, per_page: 999 }),
                    adminGradeService.getGradeStats({ student_id: studentId }),
                    adminAttendanceService.getAttendanceStats({ student_id: studentId }),
                ]);

                const totalSubjects = classSubjectsRes.success ? classSubjectsRes.data.length : 0;
                const avgGrade = gradeStatsRes.success ? (gradeStatsRes.data.average_final_rating ?? 0) : 0;
                const attendanceRate = attendanceStatsRes.success ? (attendanceStatsRes.data.attendance_rate ?? 0) : 0;

                return {
                    student: child,
                    totalSubjects,
                    overallAvgGrade: avgGrade,
                    overallAttendanceRate: attendanceRate,
                } as ChildInfo;
            });

            const childInfo = await Promise.all(childInfoPromises);
            setChildrenInfo(childInfo);
        } catch (error) {
            console.error('Error fetching children data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (parent && children && children.length > 0) {
            fetchChildrenData();
        } else {
            setLoading(false);
        }
    }, [parent, children]);

    const handleViewDetails = (studentId: number) => {
        window.location.href = `/parent/grades?student_id=${studentId}`;
    };

    const filteredChildren = childrenInfo.filter(child => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            child.student.full_name?.toLowerCase().includes(searchLower) ||
            child.student.student_id?.toLowerCase().includes(searchLower) ||
            child.student.first_name?.toLowerCase().includes(searchLower) ||
            child.student.last_name?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <AppLayout>
            <div className="p-8 space-y-8 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Children</h1>
                        {user && parent && (
                            <p className="mt-2 text-gray-600">
                                View and manage information for your {children.length} {children.length === 1 ? 'child' : 'children'}
                            </p>
                        )}
                    </div>
                    <button 
                        onClick={fetchChildrenData}
                        className={`inline-flex items-center px-4 py-2 bg-white border border-gray-300 ${TEXT_COLOR_CLASS} rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-sm`}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Loading...' : 'Refresh Data'}
                    </button>
                </div>

                {/* Search Bar */}
                {childrenInfo.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or student ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="py-20 text-center text-gray-500">
                        <RefreshCw className={`h-12 w-12 mx-auto ${TEXT_COLOR_CLASS} animate-spin`} />
                        <p className="mt-4 text-lg">Loading your children's information...</p>
                    </div>
                ) : childrenInfo.length === 0 ? (
                    <div className="py-20 text-center text-gray-500">
                        <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg">No children linked to your account.</p>
                        <p className="text-sm mt-2">Please contact the administrator to link your children's accounts.</p>
                    </div>
                ) : filteredChildren.length === 0 ? (
                    <div className="py-20 text-center text-gray-500">
                        <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg">No children found matching your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredChildren.map((childInfo, index) => (
                            <ChildCard
                                key={childInfo.student.id}
                                childInfo={childInfo}
                                index={index}
                                onViewDetails={handleViewDetails}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default ParentChildrenPage;

