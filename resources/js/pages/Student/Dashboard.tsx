import React, { useState, useEffect } from 'react';
import { 
    LayoutGrid, 
    BookOpen, 
    FileText, 
    ClipboardCheck, 
    Calendar, 
    Award, 
    RefreshCw,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    GraduationCap,
    FolderOpen
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { usePage } from '@inertiajs/react';
import AnnouncementCard from '@/components/AnnouncementCard';
import Greeting from '@/components/Greeting';

// Import necessary services
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

interface AuthUser {
    id: number;
    name: string;
    student?: StudentDetails;
}

interface DashboardStats {
    totalSubjects: number;
    overallAvgGrade: number;
    overallAttendanceRate: number;
}

// Helper function for grade level formatting (Elementary, Junior High, Senior High)
// Format grade level display
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

// Reusable Stat Card Component 
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => {
    const displayValue = (typeof value === 'number' && isNaN(value)) ? 'N/A' : value;
    const bgColor = color.replace('text-', 'bg-').replace('-600', '-100').replace('[#007bff]', '[#007bff]/10');
    
    return (
        <div className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1 truncate">{title}</p>
                    <p className={`text-xl sm:text-2xl md:text-3xl font-bold ${color} leading-tight`}>{displayValue}</p>
                </div>
                <div className={`${bgColor} p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 ${color}`} />
                </div>
            </div>
        </div>
    );
};

// Reusable Navigation Link Component
const QuickNavLink: React.FC<{ title: string; href: string; icon: React.ElementType }> = ({ title, href, icon: Icon }) => (
    <a 
        href={href} 
        className={`flex items-center justify-between p-2.5 sm:p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg sm:rounded-xl ${TEXT_COLOR_CLASS} hover:bg-[#e6f2ff] dark:hover:bg-gray-700 transition-colors`}
    >
        <div className="flex items-center">
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 ${TEXT_COLOR_CLASS}`} />
            <span className="text-sm sm:text-base font-medium text-gray-800 dark:text-white">{title}</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 opacity-60">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
    </a>
);


// ========================================================================
// 🧑‍🎓 STUDENT DASHBOARD
// ========================================================================

const StudentDashboard: React.FC = () => {
    // Get auth user from Inertia
    const { auth } = usePage().props as { auth: { user: AuthUser } };
    const user = auth?.user;
    const student = user?.student;
    const currentStudentId = student?.id;
    
    const [stats, setStats] = useState<DashboardStats>({
        totalSubjects: 0,
        overallAvgGrade: 0,
        overallAttendanceRate: 0,
    });
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<string | null>(null);

    // --- Data Fetching Logic ---
    const fetchDashboardData = async () => {
        setLoading(true);
        setNotification(null);
        
        if (!currentStudentId) {
            setNotification('Error: User is not authenticated as a student.');
            setLoading(false);
            return;
        }

        try {
            // 1. Fetch Class/Subjects student is enrolled in
            const classSubjectsRes = await adminClassSubjectService.getClassSubjects({ student_id: currentStudentId, per_page: 999 });
            const totalSubjects = classSubjectsRes.success ? classSubjectsRes.data.length : 0;
            
            // 2. Fetch grade and attendance stats
            const gradeStatsRes = await adminGradeService.getGradeStats({ student_id: currentStudentId });
            const attendanceStatsRes = await adminAttendanceService.getAttendanceStats({ student_id: currentStudentId });

            const newStats: DashboardStats = {
                totalSubjects: totalSubjects,
                overallAvgGrade: gradeStatsRes.success ? (gradeStatsRes.data.average_final_rating ?? 0) : 0,
                overallAttendanceRate: attendanceStatsRes.success ? (attendanceStatsRes.data.attendance_rate ?? 0) : 0,
            };
            setStats(newStats);

        } catch (error) {
            console.error("Student Dashboard data fetch failed:", error);
            setNotification('Failed to load dashboard data. Please check network connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentStudentId) {
            fetchDashboardData();
        } else {
            setLoading(false);
            setNotification('Please log in as a student to view the dashboard.');
        }
    }, [currentStudentId]);

    const alerts = [];
    if (stats.overallAttendanceRate < 80 && stats.overallAttendanceRate > 0) {
         alerts.push({
            id: 1,
            title: 'Attendance Alert!',
            description: `Your overall attendance rate is only ${stats.overallAttendanceRate.toFixed(2)}%. This is below the required minimum.`,
            icon: AlertTriangle,
            color: 'text-red-600',
            link: '/student/attendance'
        });
    }

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
                    {/* Greeting */}
                    <Greeting 
                        userName={user?.name || (student ? `${student.first_name} ${student.last_name}` : undefined)} 
                        userRole="student" 
                    />
                    
                    {/* Header */}
                    <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="mb-4 sm:mb-6 md:mb-0">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Student Dashboard</h1>
                            {user && student && (
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                    Welcome back, {user.name}! (ID: {student.student_id})
                                </p>
                            )}
                        </div>
                        <button 
                            onClick={fetchDashboardData}
                            className={`inline-flex items-center px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 ${TEXT_COLOR_CLASS} rounded-lg sm:rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-sm text-xs sm:text-sm md:text-base`}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">{loading ? 'Loading...' : 'Refresh Data'}</span>
                            <span className="sm:hidden">{loading ? 'Loading...' : 'Refresh'}</span>
                        </button>
                    </div>

                    {/* Student Info - Course, Grade Level, and Section */}
                    {student && (
                        <div className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6 md:mb-8">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                                <div className="flex items-center">
                                    <div className="text-gray-400 dark:text-gray-300 mr-3 sm:mr-4">
                                        <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{student.first_name} {student.last_name}</h2>
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Student ID: {student.student_id}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 lg:gap-10 w-full sm:w-auto">
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Program</p>
                                        <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                                            {student.course?.course_name || student.program || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Grade Level</p>
                                        <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                                            {formatGradeLevel(student.year_level)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Section</p>
                                        <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                                            {student.section || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notification */}
                    {notification && (
                        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg sm:rounded-xl">
                            {notification}
                        </div>
                    )}
                    
                    {/* Display loading state */}
                    {loading && !notification ? (
                        <div className="py-12 sm:py-20 text-center text-gray-500 dark:text-gray-400">
                            <RefreshCw className={`h-10 w-10 sm:h-12 sm:w-12 mx-auto ${TEXT_COLOR_CLASS} animate-spin`} />
                            <p className="mt-4 text-sm sm:text-base md:text-lg">Loading your personalized dashboard data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Main Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
                                <StatCard title="Total Subjects" value={stats.totalSubjects} icon={BookOpen} color={TEXT_COLOR_CLASS} />
                                <StatCard title="Overall Avg. Grade" value={`${(stats.overallAvgGrade ?? 0).toFixed(2)}%`} icon={Award} color="text-indigo-600" />
                                <StatCard title="Overall Attendance Rate" value={`${(stats.overallAttendanceRate ?? 0).toFixed(2)}%`} icon={TrendingUp} color="text-green-600" />
                            </div>

                            {/* Alerts and Navigation */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6 md:mb-8">
                                {/* Alerts/Announcements */}
                                <div className="lg:col-span-2 bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700 space-y-3 sm:space-y-4">
                                    <h2 className={`text-lg sm:text-xl font-bold ${TEXT_COLOR_CLASS} flex items-center`}>
                                        <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                                        Important Alerts & Notices
                                    </h2>
                                    
                                    {alerts.length === 0 ? (
                                        <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg sm:rounded-xl flex items-center">
                                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                                            <span className="text-sm sm:text-base">All good! No immediate alerts or missing tasks.</span>
                                        </div>
                                    ) : (
                                        alerts.map((item) => (
                                            <a 
                                                key={item.id}
                                                href={item.link}
                                                className="block p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg sm:rounded-xl transition-colors border border-red-200 dark:border-red-800"
                                            >
                                                <div className="flex items-start">
                                                    <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 ${item.color} flex-shrink-0`} />
                                                    <div>
                                                        <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{item.title}</p>
                                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">{item.description}</p>
                                                    </div>
                                                </div>
                                            </a>
                                        ))
                                    )}
                                </div>

                                {/* Quick Navigation */}
                                <div className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700 space-y-3 sm:space-y-4">
                                    <h2 className={`text-lg sm:text-xl font-bold ${TEXT_COLOR_CLASS} flex items-center`}>
                                        <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                                        Quick Navigation
                                    </h2>
                                    
                                    <div className="space-y-2 sm:space-y-3">
                                        <QuickNavLink title="My Subjects" href="/student/my-subjects" icon={BookOpen} />
                                        <QuickNavLink title="Course Materials" href="/student/course-materials" icon={FolderOpen} />
                                        <QuickNavLink title="My Grades" href="/student/grades" icon={Award} />
                                        <QuickNavLink title="My Attendance" href="/student/attendance" icon={ClipboardCheck} />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Announcements Section - Moved to Bottom */}
                            <div className="mt-4 sm:mt-6">
                                <AnnouncementCard role="student" />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};


export default StudentDashboard;
