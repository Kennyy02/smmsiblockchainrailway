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
const QuickNavLink: React.FC<{ title: string; href: string; icon: React.ElementType; studentId?: number }> = ({ title, href, icon: Icon, studentId }) => {
    const finalHref = studentId ? `${href}?student_id=${studentId}` : href;
    return (
        <a 
            href={finalHref} 
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
        <div className="mb-8">
            {/* Child Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="text-gray-400 mr-4">
                            <GraduationCap className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {child.studentName}
                                {index > 0 && <span className="ml-2 text-sm font-normal text-gray-500">(Child {index + 1})</span>}
                            </h2>
                            <p className="text-gray-500 text-sm">Student ID: {child.studentIdNumber}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-10">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Program</p>
                            <p className="text-base font-medium text-gray-900">
                                {child.program || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Grade Level</p>
                            <p className="text-base font-medium text-gray-900">
                                {formatGradeLevel(child.yearLevel)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Section</p>
                            <p className="text-base font-medium text-gray-900">
                                {child.section || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Child Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatCard 
                    title="Total Subjects" 
                    value={child.totalSubjects} 
                    icon={BookOpen} 
                    color={TEXT_COLOR_CLASS} 
                />
                <StatCard 
                    title="Overall Avg. Grade" 
                    value={`${(child.overallAvgGrade ?? 0).toFixed(2)}%`} 
                    icon={Award} 
                    color="text-indigo-600" 
                />
                <StatCard 
                    title="Overall Attendance Rate" 
                    value={`${(child.overallAttendanceRate ?? 0).toFixed(2)}%`} 
                    icon={TrendingUp} 
                    color="text-green-600" 
                />
            </div>

            {/* Alerts and Navigation for this child */}
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
                            All good! No immediate alerts or missing tasks for {child.studentName}.
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

                {/* Quick Navigation for this child */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 space-y-4">
                    <h2 className={`text-xl font-bold ${TEXT_COLOR_CLASS} flex items-center`}>
                        <LayoutGrid className="h-6 w-6 mr-2" />
                        Quick Navigation
                    </h2>
                    
                    <div className="space-y-3">
                        <QuickNavLink title="My Subjects" href="/parent/children" icon={BookOpen} studentId={child.studentId} />
                        <QuickNavLink title="Course Materials" href="/parent/children" icon={FolderOpen} studentId={child.studentId} />
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
            <div className="p-8 space-y-8 min-h-screen bg-[#f3f4f6]">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
                        {user && parent && (
                            <p className="mt-2 text-gray-600">
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
                        className={`inline-flex items-center px-4 py-2 bg-white border border-gray-300 ${TEXT_COLOR_CLASS} rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-sm`}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Loading...' : 'Refresh Data'}
                    </button>
                </div>

                {/* Parent Info */}
                {parent && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="text-gray-400 mr-4">
                                    <Users className="h-8 w-8" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">{parent.full_name}</h2>
                                    <p className="text-gray-500 text-sm">{parent.email}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Linked Children</p>
                                <p className="text-2xl font-bold text-gray-900">{children.length}</p>
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
                        <p className="mt-4 text-lg">Loading your children's dashboard data...</p>
                    </div>
                ) : stats.children.length > 0 ? (
                    <>
                        {/* Overall Stats Across All Children */}
                        {stats.children.length > 1 && (
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
                                <h2 className={`text-xl font-bold ${TEXT_COLOR_CLASS} flex items-center mb-4`}>
                                    <Users className="h-6 w-6 mr-2" />
                                    Overall Summary (All Children)
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <StatCard 
                                        title="Total Children" 
                                        value={stats.overallStats.totalChildren} 
                                        icon={Users} 
                                        color={TEXT_COLOR_CLASS} 
                                    />
                                    <StatCard 
                                        title="Average Grade (All Children)" 
                                        value={`${(stats.overallStats.avgGradeAcrossChildren ?? 0).toFixed(2)}%`} 
                                        icon={Award} 
                                        color="text-indigo-600" 
                                    />
                                    <StatCard 
                                        title="Average Attendance (All Children)" 
                                        value={`${(stats.overallStats.avgAttendanceAcrossChildren ?? 0).toFixed(2)}%`} 
                                        icon={TrendingUp} 
                                        color="text-green-600" 
                                    />
                                </div>
                            </div>
                        )}

                        {/* Individual Child Sections */}
                        {stats.children.map((child, index) => (
                            <ChildSection 
                                key={child.studentId} 
                                child={child} 
                                index={index}
                                onViewChild={handleViewChild}
                            />
                        ))}
                        
                        {/* Announcements Section - Moved to Bottom */}
                        <div className="mt-6">
                            <AnnouncementCard role="parent" />
                        </div>
                    </>
                ) : (
                    <div className="py-20 text-center text-gray-500">
                        <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg">No children linked to your account.</p>
                        <p className="text-sm mt-2">Please contact the administrator to link your children's accounts.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default ParentDashboard;
