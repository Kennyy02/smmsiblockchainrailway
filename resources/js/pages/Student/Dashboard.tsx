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

// Reusable Navigation Link Component
const QuickNavLink: React.FC<{ title: string; href: string; icon: React.ElementType }> = ({ title, href, icon: Icon }) => (
    <a 
        href={href} 
        className={`flex items-center justify-between p-3 border border-gray-200 rounded-lg ${TEXT_COLOR_CLASS} hover:bg-[#e6f2ff] transition-colors`}
    >
        <div className="flex items-center">
            <Icon className={`h-5 w-5 mr-3 ${TEXT_COLOR_CLASS}`} />
            <span className="font-medium text-gray-800">{title}</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 opacity-60">
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
            <div className="p-8 space-y-8 min-h-screen bg-[#f3f4f6] dark:bg-gray-900">
                {/* Greeting */}
                <Greeting 
                    userName={user?.name || (student ? `${student.first_name} ${student.last_name}` : undefined)} 
                    userRole="student" 
                />
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
                        {user && student && (
                            <p className="mt-2 text-gray-600">
                                Welcome back, {user.name}! (ID: {student.student_id})
                            </p>
                        )}
                    </div>
                    <button 
                        onClick={fetchDashboardData}
                        className={`inline-flex items-center px-4 py-2 bg-white border border-gray-300 ${TEXT_COLOR_CLASS} rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-sm`}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Loading...' : 'Refresh Data'}
                    </button>
                </div>

                {/* Student Info - Course, Grade Level, and Section */}
                {student && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="text-gray-400 mr-4">
                                    <GraduationCap className="h-8 w-8" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">{student.first_name} {student.last_name}</h2>
                                    <p className="text-gray-500 text-sm">Student ID: {student.student_id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-10">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Program</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {student.course?.course_name || student.program || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Grade Level</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {formatGradeLevel(student.year_level)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Section</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {student.section || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notification */}
                {notification && (
                    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
                        {notification}
                    </div>
                )}
                
                {/* Display loading state */}
                {loading && !notification ? (
                    <div className="py-20 text-center text-gray-500">
                        <RefreshCw className={`h-12 w-12 mx-auto ${TEXT_COLOR_CLASS} animate-spin`} />
                        <p className="mt-4 text-lg">Loading your personalized dashboard data...</p>
                    </div>
                ) : (
                    <>
                        {/* Main Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard title="Total Subjects" value={stats.totalSubjects} icon={BookOpen} color={TEXT_COLOR_CLASS} />
                            <StatCard title="Overall Avg. Grade" value={`${(stats.overallAvgGrade ?? 0).toFixed(2)}%`} icon={Award} color="text-indigo-600" />
                            <StatCard title="Overall Attendance Rate" value={`${(stats.overallAttendanceRate ?? 0).toFixed(2)}%`} icon={TrendingUp} color="text-green-600" />
                        </div>

                        {/* Alerts and Navigation */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Alerts/Announcements */}
                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100 space-y-4">
                                <h2 className={`text-xl font-bold ${TEXT_COLOR_CLASS} flex items-center`}>
                                    <AlertTriangle className="h-6 w-6 mr-2" />
                                    Important Alerts & Notices
                                </h2>
                                
                                {alerts.length === 0 ? (
                                    <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center">
                                        <CheckCircle className="h-5 w-5 mr-3" />
                                        All good! No immediate alerts or missing tasks.
                                    </div>
                                ) : (
                                    alerts.map((item) => (
                                        <a 
                                            key={item.id}
                                            href={item.link}
                                            className="block p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200"
                                        >
                                            <div className="flex items-start">
                                                <item.icon className={`h-6 w-6 mr-3 ${item.color}`} />
                                                <div>
                                                    <p className="font-semibold text-gray-900">{item.title}</p>
                                                    <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                                                </div>
                                            </div>
                                        </a>
                                    ))
                                )}
                            </div>

                            {/* Quick Navigation */}
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 space-y-4">
                                <h2 className={`text-xl font-bold ${TEXT_COLOR_CLASS} flex items-center`}>
                                    <LayoutGrid className="h-6 w-6 mr-2" />
                                    Quick Navigation
                                </h2>
                                
                                <div className="space-y-3">
                                    <QuickNavLink title="My Subjects" href="/student/my-subjects" icon={BookOpen} />
                                    <QuickNavLink title="Course Materials" href="/student/course-materials" icon={FolderOpen} />
                                    <QuickNavLink title="My Grades" href="/student/grades" icon={Award} />
                                    <QuickNavLink title="My Attendance" href="/student/attendance" icon={ClipboardCheck} />
                                </div>
                            </div>
                        </div>
                        
                        {/* Announcements Section - Moved to Bottom */}
                        <div>
                            <AnnouncementCard role="student" />
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
};


export default StudentDashboard;
