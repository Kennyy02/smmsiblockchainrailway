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
    FolderOpen,
    Users
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

interface ChildStats {
    studentId: number;
    studentName: string;
    studentIdNumber: string;
    totalSubjects: number;
    overallAvgGrade: number;
    overallAttendanceRate: number;
    program?: string;
    yearLevel?: number;
    section?: string;
}

interface DashboardStats {
    children: ChildStats[];
    overallStats: {
        totalChildren: number;
        avgGradeAcrossChildren: number;
        avgAttendanceAcrossChildren: number;
    };
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
const QuickNavLink: React.FC<{ title: string; href: string; icon: React.ElementType; studentId?: number }> = ({ title, href, icon: Icon, studentId }) => {
    const finalHref = studentId ? `${href}?student_id=${studentId}` : href;
    return (
        <a 
            href={finalHref} 
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
};

// Child Section Component
const ChildSection: React.FC<{ 
    child: ChildStats; 
    index: number;
    onViewChild: (studentId: number) => void;
}> = ({ child, index, onViewChild }) => {
    const alerts = [];
    if (child.overallAttendanceRate < 80 && child.overallAttendanceRate > 0) {
        alerts.push({
            id: 1,
            title: 'Attendance Alert!',
            description: `${child.studentName}'s overall attendance rate is only ${child.overallAttendanceRate.toFixed(2)}%. This is below the required minimum.`,
            icon: AlertTriangle,
            color: 'text-red-600',
            link: `/parent/grades?student_id=${child.studentId}`
        });
    }

    return (
        <div className="mb-6 sm:mb-8">
            {/* Child Header */}
            <div className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                    <div className="flex items-center">
                        <div className="text-gray-400 dark:text-gray-300 mr-3 sm:mr-4">
                            <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                                {child.studentName}
                                {index > 0 && <span className="ml-2 text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400">(Child {index + 1})</span>}
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Student ID: {child.studentIdNumber}</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 lg:gap-10 w-full sm:w-auto">
                        <div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Program</p>
                            <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                                {child.program || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Grade Level</p>
                            <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                                {formatGradeLevel(child.yearLevel)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Section</p>
                            <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                                {child.section || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Child Stats Cards - Matching Admin Style */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6">
                <StatCard 
                    title="Total Subjects" 
                    value={child.totalSubjects} 
                    icon={BookOpen} 
                    iconBgClass="bg-blue-50 dark:bg-blue-900/20"
                    iconColorClass="text-blue-600 dark:text-blue-400"
                />
                <StatCard 
                    title="Overall Avg. Grade" 
                    value={`${(child.overallAvgGrade ?? 0).toFixed(2)}%`} 
                    icon={Award} 
                    iconBgClass="bg-purple-50 dark:bg-purple-900/20"
                    iconColorClass="text-purple-600 dark:text-purple-400"
                />
                <StatCard 
                    title="Overall Attendance Rate" 
                    value={`${(child.overallAttendanceRate ?? 0).toFixed(2)}%`} 
                    icon={TrendingUp} 
                    iconBgClass="bg-green-50 dark:bg-green-900/20"
                    iconColorClass="text-green-600 dark:text-green-400"
                />
            </div>

            {/* Alerts and Navigation for this child */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Alerts/Announcements */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700 space-y-3 sm:space-y-4">
                    <h2 className={`text-lg sm:text-xl font-bold ${TEXT_COLOR_CLASS} flex items-center`}>
                        <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                        Important Alerts & Notices
                    </h2>
                    
                    {alerts.length === 0 ? (
                        <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg sm:rounded-xl flex items-center">
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                            <span className="text-sm sm:text-base">All good! No immediate alerts or missing tasks for {child.studentName}.</span>
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

                {/* Quick Navigation for this child */}
                <div className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700 space-y-3 sm:space-y-4">
                    <h2 className={`text-lg sm:text-xl font-bold ${TEXT_COLOR_CLASS} flex items-center`}>
                        <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                        Quick Navigation
                    </h2>
                    
                    <div className="space-y-2 sm:space-y-3">
                        <QuickNavLink title="My Children" href="/parent/children" icon={Users} studentId={child.studentId} />
                        <QuickNavLink title="Grades" href="/parent/grades" icon={Award} studentId={child.studentId} />
                        <QuickNavLink title="Attendance" href="/parent/attendance" icon={ClipboardCheck} studentId={child.studentId} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 👨‍👩‍👧‍👦 PARENT DASHBOARD
// ========================================================================

const ParentDashboard: React.FC = () => {
    // Get auth user from Inertia
    const { auth } = usePage().props as { auth: { user: AuthUser } };
    const user = auth?.user;
    const parent = user?.parent;
    const children = parent?.students || [];
    
    const [stats, setStats] = useState<DashboardStats>({
        children: [],
        overallStats: {
            totalChildren: 0,
            avgGradeAcrossChildren: 0,
            avgAttendanceAcrossChildren: 0,
        },
    });
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<string | null>(null);

    // --- Data Fetching Logic ---
    const fetchDashboardData = async () => {
        setLoading(true);
        setNotification(null);
        
        if (!parent || !children || children.length === 0) {
            setNotification('No children linked to your account. Please contact the administrator.');
            setLoading(false);
            return;
        }

        try {
            const childStatsPromises = children.map(async (child) => {
                const studentId = child.id;
                
                // Fetch data for this child
                const [classSubjectsRes, gradeStatsRes, attendanceStatsRes] = await Promise.all([
                    adminClassSubjectService.getClassSubjects({ student_id: studentId, per_page: 999 }),
                    adminGradeService.getGradeStats({ student_id: studentId }),
                    adminAttendanceService.getAttendanceStats({ student_id: studentId }),
                ]);

                const totalSubjects = classSubjectsRes.success ? classSubjectsRes.data.length : 0;
                const avgGrade = gradeStatsRes.success ? (gradeStatsRes.data.average_final_rating ?? 0) : 0;
                const attendanceRate = attendanceStatsRes.success ? (attendanceStatsRes.data.attendance_rate ?? 0) : 0;

                return {
                    studentId: studentId,
                    studentName: child.full_name || `${child.first_name} ${child.last_name}`,
                    studentIdNumber: child.student_id,
                    totalSubjects: totalSubjects,
                    overallAvgGrade: avgGrade,
                    overallAttendanceRate: attendanceRate,
                    program: child.program || child.course?.course_name,
                    yearLevel: child.year_level,
                    section: child.section || child.currentClass?.class_code || child.current_class?.class_code,
                } as ChildStats;
            });

            const childStats = await Promise.all(childStatsPromises);

            // Calculate overall stats across all children
            const totalChildren = childStats.length;
            const avgGradeAcrossChildren = childStats.length > 0
                ? childStats.reduce((sum, child) => sum + child.overallAvgGrade, 0) / childStats.length
                : 0;
            const avgAttendanceAcrossChildren = childStats.length > 0
                ? childStats.reduce((sum, child) => sum + child.overallAttendanceRate, 0) / childStats.length
                : 0;

            setStats({
                children: childStats,
                overallStats: {
                    totalChildren: totalChildren,
                    avgGradeAcrossChildren: avgGradeAcrossChildren,
                    avgAttendanceAcrossChildren: avgAttendanceAcrossChildren,
                },
            });

        } catch (error) {
            console.error("Parent Dashboard data fetch failed:", error);
            setNotification('Failed to load dashboard data. Please check network connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (parent && children && children.length > 0) {
            fetchDashboardData();
        } else {
            setLoading(false);
            if (!parent) {
                setNotification('Please log in as a parent to view the dashboard.');
            }
        }
    }, [parent, children]);

    const handleViewChild = (studentId: number) => {
        // Navigate to child's detailed view
        window.location.href = `/parent/children?student_id=${studentId}`;
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
                    {/* ☀️ GREETING COMPONENT */}
                    <Greeting 
                        userName={user?.name || parent?.full_name} 
                        userRole="parent" 
                    />
                    
                    {/* Header/Subtitle */}
                    <div className="mb-4 sm:mb-6 md:mb-8 border-b dark:border-gray-700 pb-3 sm:pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">Parent Dashboard</h1>
                                {user && parent && (
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                        Welcome back, {user.name || parent.full_name}!
                                        {children.length > 0 && (
                                            <span className="ml-2">
                                                ({children.length} {children.length === 1 ? 'child' : 'children'})
                                            </span>
                                        )}
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
                            <p className="mt-4 text-sm sm:text-base md:text-lg">Loading your children's dashboard data...</p>
                        </div>
                    ) : stats.children.length > 0 ? (
                        <>
                            {/* Stats Summary - Main KPIs - Matching Admin Style */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
                                <StatCard 
                                    title="Total Children" 
                                    value={stats.overallStats.totalChildren} 
                                    icon={Users} 
                                    iconBgClass="bg-blue-50 dark:bg-blue-900/20"
                                    iconColorClass="text-blue-600 dark:text-blue-400"
                                />
                                <StatCard 
                                    title="Average Grade (All Children)" 
                                    value={`${(stats.overallStats.avgGradeAcrossChildren ?? 0).toFixed(2)}%`} 
                                    icon={Award} 
                                    iconBgClass="bg-purple-50 dark:bg-purple-900/20"
                                    iconColorClass="text-purple-600 dark:text-purple-400"
                                />
                                <StatCard 
                                    title="Average Attendance (All Children)" 
                                    value={`${(stats.overallStats.avgAttendanceAcrossChildren ?? 0).toFixed(2)}%`} 
                                    icon={TrendingUp} 
                                    iconBgClass="bg-green-50 dark:bg-green-900/20"
                                    iconColorClass="text-green-600 dark:text-green-400"
                                />
                            </div>

                            {/* Individual Child Sections */}
                            {stats.children.map((child, index) => (
                                <ChildSection 
                                    key={child.studentId} 
                                    child={child} 
                                    index={index}
                                    onViewChild={handleViewChild}
                                />
                            ))}
                            
                            {/* Announcements Section - At Bottom */}
                            <div className="mb-8">
                                <AnnouncementCard role="parent" />
                            </div>
                        </>
                    ) : (
                        <div className="py-12 sm:py-20 text-center text-gray-500 dark:text-gray-400">
                            <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                            <p className="text-sm sm:text-base md:text-lg">No children linked to your account.</p>
                            <p className="text-xs sm:text-sm mt-2">Please contact the administrator to link your children's accounts.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default ParentDashboard;
