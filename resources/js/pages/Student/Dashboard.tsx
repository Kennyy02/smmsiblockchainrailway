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

// Reusable Stat Card Component - Matching Admin Style
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; iconBgClass: string; iconColorClass: string }> = ({ title, value, icon: Icon, iconBgClass, iconColorClass }) => {
    const displayValue = (typeof value === 'number' && isNaN(value)) ? 'N/A' : value;
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
            <div className="flex flex-col items-center text-center">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">{title}</p>
                <p className={`text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3`}>
                    {displayValue}
                </p>
                <div className={`p-2 sm:p-3 rounded-full ${iconBgClass}`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 ${iconColorClass}`} />
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
                    {/* ☀️ GREETING COMPONENT */}
                    <Greeting 
                        userName={user?.name || (student ? `${student.first_name} ${student.last_name}` : undefined)} 
                        userRole="student" 
                    />
                    
                    {/* Header/Subtitle */}
                    <div className="mb-4 sm:mb-6 md:mb-8 border-b dark:border-gray-700 pb-3 sm:pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">Student Dashboard</h1>
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
                    </div>

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
                            {/* Stats Summary - Main KPIs - Matching Admin Style */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
                                <StatCard 
                                    title="Total Subjects" 
                                    value={stats.totalSubjects} 
                                    icon={BookOpen} 
                                    iconBgClass="bg-blue-50 dark:bg-blue-900/20"
                                    iconColorClass="text-blue-600 dark:text-blue-400"
                                />
                                <StatCard 
                                    title="Overall Avg. Grade" 
                                    value={`${(stats.overallAvgGrade ?? 0).toFixed(2)}%`} 
                                    icon={Award} 
                                    iconBgClass="bg-purple-50 dark:bg-purple-900/20"
                                    iconColorClass="text-purple-600 dark:text-purple-400"
                                />
                                <StatCard 
                                    title="Overall Attendance Rate" 
                                    value={`${(stats.overallAttendanceRate ?? 0).toFixed(2)}%`} 
                                    icon={TrendingUp} 
                                    iconBgClass="bg-green-50 dark:bg-green-900/20"
                                    iconColorClass="text-green-600 dark:text-green-400"
                                />
                            </div>

                            {/* Quick Navigation */}
                            <div className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700 space-y-3 sm:space-y-4 mb-4 sm:mb-6 md:mb-8">
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
                            
                            {/* Announcements Section - At Bottom */}
                            <div className="mb-8">
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
