import React, { useState, useEffect } from 'react';
import { 
    Layers, 
    Calendar, 
    Award, 
    FileText, 
    Users, 
    ClipboardCheck,
    RefreshCw,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    BookOpen,
    AlertCircle
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useTeacherAuth } from '../../../services/useTeacherAuth';

// Import necessary types and services
import { adminClassSubjectService, ClassSubject } from '../../../services/AdminClassSubjectService';
import { adminAssignmentService } from '../../../services/AdminAssignmentService';
import { adminStudentSubmissionService } from '../../../services/AdminStudentSubmissionService';
import { adminGradeService } from '../../../services/AdminGradeService';
import { adminAttendanceService } from '../../../services/AdminAttendanceService';


// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const TEXT_COLOR_CLASS = 'text-[#003366]';

// ========================================================================
// 📦 INTERFACES
// ========================================================================

interface DashboardStats {
    totalClasses: number;
    upcomingAssignments: number;
    ungradedSubmissions: number;
    avgClassGrade: number;
    avgAttendanceRate: number;
}

interface ClassSubjectSummary {
    id: number;
    className: string;
    subjectName: string;
    averageGrade: number;
    attendanceRate: number;
}

// ========================================================================
// 💡 UTILS
// ========================================================================

// Reusable Stat Card Component
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

// ========================================================================
// 📈 TEACHER DASHBOARD
// ========================================================================

const Dashboard: React.FC = () => {
    // ✅ DYNAMIC: Get current teacher ID from auth
    const { currentTeacherId, isTeacher, user } = useTeacherAuth();
    
    const [stats, setStats] = useState<DashboardStats>({
        totalClasses: 0,
        upcomingAssignments: 0,
        ungradedSubmissions: 0,
        avgClassGrade: 0,
        avgAttendanceRate: 0,
    });
    const [classSummaries, setClassSummaries] = useState<ClassSubjectSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<string | null>(null);

    // --- Data Fetching Logic (Aggregating multiple service calls) ---
    const fetchDashboardData = async () => {
        setLoading(true);
        setNotification(null);
        
        // ✅ VALIDATION: Check if teacher ID exists
        if (!currentTeacherId) {
            setNotification('Error: Unable to identify teacher. Please ensure you are logged in.');
            setLoading(false);
            return;
        }

        try {
            // 1. Fetch Class/Subjects taught by this teacher (using dynamic teacher ID)
            const classSubjectsRes = await adminClassSubjectService.getClassSubjects({ 
                teacher_id: currentTeacherId, 
                per_page: 999 
            });
            const classSubjects = classSubjectsRes.success ? (classSubjectsRes.data as ClassSubject[]) : [];
            
            // Get combined stats across ALL subjects taught by the teacher (using dynamic teacher ID)
            const assignmentStatsRes = await adminAssignmentService.getAssignmentStats(undefined, currentTeacherId);
            const submissionStatsRes = await adminStudentSubmissionService.getSubmissionStats(undefined, currentTeacherId);
            const gradeStatsRes = await adminGradeService.getGradeStats({ teacher_id: currentTeacherId });
            const attendanceStatsRes = await adminAttendanceService.getAttendanceStats({ teacher_id: currentTeacherId });

            // 2. Aggregate the main dashboard metrics
            const newStats: DashboardStats = {
                totalClasses: classSubjects.length,
                upcomingAssignments: assignmentStatsRes.success ? assignmentStatsRes.data.upcoming_assignments : 0,
                ungradedSubmissions: submissionStatsRes.success ? submissionStatsRes.data.ungraded_count : 0,
                avgClassGrade: gradeStatsRes.success ? (gradeStatsRes.data.average_final_rating ?? 0) : 0,
                avgAttendanceRate: attendanceStatsRes.success ? (attendanceStatsRes.data.attendance_rate ?? 0) : 0,
            };
            setStats(newStats);

            // 3. Prepare Class Summaries for the Alerts/To-Do list
            // NOTE: This is a simplified list. In a real application, fetching individual class stats 
            // would be slow and should be optimized on the backend (e.g., a dedicated dashboard endpoint).
            const summaries: ClassSubjectSummary[] = classSubjects.map(cs => ({
                id: cs.id,
                className: cs.class_name || 'N/A',
                subjectName: cs.subject_name || 'N/A',
                // Mocking these for a simple display, as getting per-class stats is complex without one call
                averageGrade: (Math.random() * 20 + 70), // Mock 70-90%
                attendanceRate: (Math.random() * 10 + 90), // Mock 90-100%
            }));
            setClassSummaries(summaries);

        } catch (error) {
            console.error("Dashboard data fetch failed:", error);
            setNotification('Failed to load dashboard data. Please check network connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // ✅ Only fetch data if teacher is authenticated
        if (currentTeacherId) {
            fetchDashboardData();
        } else {
            setLoading(false);
            setNotification('You must be logged in as a teacher to view this dashboard.');
        }
    }, [currentTeacherId]);

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
                                <p className="text-sm">This dashboard is only accessible to teachers.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }


    const lowPerformanceAlerts = classSummaries
        .filter(cs => cs.averageGrade < 75) // Alert if average grade is below 75%
        .map((cs, index) => ({
            id: 3 + index,
            title: `Low Average Grade in ${cs.subjectName}`,
            description: `The class average is ${cs.averageGrade.toFixed(2)}%. Review student performance.`,
            icon: AlertTriangle,
            color: 'text-red-600',
            link: `/teacher/my-classes`
        }));


    return (
        <AppLayout>
            <div className="p-8 space-y-8 min-h-screen bg-[#f3f4f6]">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Teacher Dashboard
                         
                        </h1>
                        <p className="mt-2 text-gray-600">Quick overview of your current academic workload.</p>
                    </div>
                    <button 
                        onClick={fetchDashboardData}
                        className={`inline-flex items-center px-4 py-2 bg-white border border-gray-300 ${TEXT_COLOR_CLASS} rounded-xl hover:bg-gray-50 transition-all shadow-sm`}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Loading...' : 'Refresh Data'}
                    </button>
                </div>
                
                {/* Notification */}
                {notification && (
                    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
                        {notification}
                    </div>
                )}

                {/* Main Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <StatCard 
                        title="My Classes/Subjects" 
                        value={stats.totalClasses} 
                        icon={Layers} 
                        color={TEXT_COLOR_CLASS} 
                    />
                    <StatCard 
                        title="Upcoming Assignments" 
                        value={stats.upcomingAssignments} 
                        icon={Calendar} 
                        color="text-blue-600" 
                    />
                    <StatCard 
                        title="Avg. Grade (All Classes)" 
                        value={`${(stats.avgClassGrade ?? 0).toFixed(2)}%`} 
                        icon={Award} 
                        color="text-indigo-600" 
                    />
                    <StatCard 
                        title="Ungraded Submissions" 
                        value={stats.ungradedSubmissions} 
                        icon={FileText} 
                        color="text-yellow-600" 
                    />
                    <StatCard 
                        title="Avg. Attendance Rate" 
                        value={`${(stats.avgAttendanceRate ?? 0).toFixed(2)}%`} 
                        icon={TrendingUp} 
                        color="text-green-600" 
                    />
                </div>

                {/* To-Do List & Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols- gap-6">
                  
                    {/* Quick Navigation */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 space-y-4">
                        <h2 className={`text-xl font-bold ${TEXT_COLOR_CLASS} flex items-center`}>
                            <BookOpen className="h-6 w-6 mr-2" />
                            Quick Navigation
                        </h2>
                        
                        <div className="space-y-3">
                            <QuickNavLink title="My Classes & Subjects" href="/teacher/my-classes" icon={Layers} />
                            <QuickNavLink title="Assignments Management" href="/teacher/assignments" icon={Calendar} />
                            <QuickNavLink title="Grades Entry" href="/teacher/grades" icon={Award} />
                            <QuickNavLink title="Attendance Recording" href="/teacher/attendance" icon={ClipboardCheck} />
                            <QuickNavLink title="Submissions Review" href="/teacher/submissions" icon={FileText} />
                        </div>
                    </div>
                </div>

            </div>
        </AppLayout>
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


export default Dashboard;