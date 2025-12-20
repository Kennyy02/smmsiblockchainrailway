import React, { useState, useEffect } from 'react';
import { 
    Award, BarChart, Hash, Zap, BookOpen, Clock, TrendingDown, 
    Sunrise, Sun, Moon, RefreshCw, Users, GraduationCap, UserCheck 
} from 'lucide-react';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { 
    adminGradeService, 
    GradeStats, 
    ApiResponse,
    AcademicYearOption,
    SemesterOption,
} from '../../../services/AdminGradeService';
import { adminStudentService } from '../../../services/AdminStudentService';
import { adminTeacherService } from '../../../services/AdminTeacherService';
import { adminParentService } from '../../../services/AdminParentService';
import AnnouncementCard from '@/components/AnnouncementCard';
import Greeting from '@/components/Greeting'; 

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';

// ========================================================================
// 📦 INTERFACES & UTILS
// ========================================================================

interface Notification {
    type: 'success' | 'error';
    message: string;
}

// Custom Stat Card Component - Clickable
interface StatCardProps {
    title: string;
    value: string | number | React.ReactNode; // Value can be a node (like the loading spinner)
    icon: React.ElementType;
    iconBgClass: string;
    iconColorClass: string;
    onClick?: () => void;
    clickable?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, iconBgClass, iconColorClass, onClick, clickable = false }) => (
    <div 
        className={`bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100 transition-all duration-300 ${clickable ? 'hover:shadow-xl cursor-pointer hover:scale-105' : 'hover:shadow-xl'}`}
        onClick={clickable ? onClick : undefined}
    >
        <div className="flex flex-col items-center text-center">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">{title}</p>
            <p className={`text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3`}>
                {value}
            </p>
            <div className={`p-2 sm:p-3 rounded-full ${iconBgClass}`}>
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 ${iconColorClass}`} />
            </div>
        </div>
    </div>
);

// Top Failing Subjects / Classes Visualization
const TopFailingSubjects: React.FC<{ stats: GradeStats }> = ({ stats }) => {
    // Safely access array and create a copy before sorting
    const topFailing = (stats.by_class_subject ?? [])
        .slice() 
        .sort((a, b) => (b.failed_count || 0) - (a.failed_count || 0))
        .slice(0, 5)
        .filter(item => (item.failed_count || 0) > 0);

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold mb-4 flex items-center text-red-700">
                <TrendingDown className="w-5 h-5 mr-2" /> Top 5 Failing Subjects
            </h3>
            {topFailing.length === 0 ? (
                <p className="text-gray-500">No significant failing grades recorded in this filter period.</p>
            ) : (
                <ul className="space-y-4">
                    {topFailing.map((item, index) => (
                        <li key={index} className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0">
                            <div className="flex items-center">
                                <span className={`w-8 h-8 flex items-center justify-center font-bold text-lg rounded-full mr-3 ${LIGHT_BG_CLASS} ${TEXT_COLOR_CLASS}`}>
                                    {index + 1}
                                </span>
                                <div>
                                    <p className="font-semibold text-gray-800">{item.subject_name}</p>
                                    <p className="text-sm text-gray-500">{item.class_code}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-red-600 text-lg">{item.failed_count}</p>
                                <p className="text-xs text-gray-500">Failures</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};


// ========================================================================
// 🏠 MAIN DASHBOARD PAGE
// ========================================================================

interface DashboardStats {
    total_students: number;
    total_teachers: number;
    total_parents: number;
    failed_students: number;
}

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats>({
        total_students: 0,
        total_teachers: 0,
        total_parents: 0,
        failed_students: 0,
    });
    const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
    const [semesters, setSemesters] = useState<SemesterOption[]>([]);
    const [selectedAY, setSelectedAY] = useState<number | 'all'>('all');
    const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');

    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<Notification | null>(null);

    const loadOptions = async () => {
        try {
            const options = await adminGradeService.getAllDropdownOptions();
            setAcademicYears(options.academicYears);
            setSemesters(options.semesters);

            // Set default filter to current AY and Semester if available
            const currentAY = options.academicYears.find(ay => ay.is_current)?.id || 'all';
            const currentSem = options.semesters.find(sem => sem.is_current)?.id || 'all';
            setSelectedAY(currentAY);
            setSelectedSemester(currentSem);

        } catch (error) {
            console.error('❌ Error loading options:', error);
            setNotification({ type: 'error', message: 'Failed to load dashboard options.' });
        }
    };

    const loadStats = async (ayId: number | 'all', semId: number | 'all') => {
        setLoading(true);
        try {
            // Fetch all stats in parallel
            const [studentStatsRes, teacherStatsRes, parentStatsRes, gradeStatsRes] = await Promise.all([
                adminStudentService.getStudentStats(),
                adminTeacherService.getTeacherStats(),
                adminParentService.getParentStats(),
                adminGradeService.getGradeStats(ayId, semId)
            ]);

            // Count unique failed students from grade stats
            const failedStudents = gradeStatsRes.success && gradeStatsRes.data?.failed_count
                ? gradeStatsRes.data.failed_count
                : 0;

            setStats({
                total_students: studentStatsRes.success ? studentStatsRes.data.total_students : 0,
                total_teachers: teacherStatsRes.success ? teacherStatsRes.data.total_teachers : 0,
                total_parents: parentStatsRes.success ? parentStatsRes.data.total_parents : 0,
                failed_students: failedStudents
            });
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            setNotification({ type: 'error', message: 'Failed to load dashboard statistics.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOptions();
    }, []);

    useEffect(() => {
        // Load stats whenever filters change
        if (selectedAY !== 0 && selectedSemester !== 0) {
            loadStats(selectedAY, selectedSemester);
        }
    }, [selectedAY, selectedSemester]);

    // Format display data and handle loading state with spinners
    const currentAYName = academicYears.find(ay => ay.id === selectedAY)?.year_name || 'Overall';
    const currentSemName = semesters.find(sem => sem.id === selectedSemester)?.semester_name || 'All Semesters';
    
    const loadingSpinner = <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />;

    const displayStats = loading ? {
        total_students: loadingSpinner,
        total_teachers: loadingSpinner,
        total_parents: loadingSpinner,
        failed_students: loadingSpinner,
    } : {
        total_students: stats.total_students,
        total_teachers: stats.total_teachers,
        total_parents: stats.total_parents,
        failed_students: stats.failed_students,
    };
    
    const dashboardSubtitle = `Overview of School Population`;

    return (
        <AppLayout>
            <div className="min-h-screen bg-[#f3f4f6]">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
                    {/* ☀️ GREETING COMPONENT */}
                    <Greeting userRole="admin" />

                    {/* Header/Subtitle */}
                    <div className="mb-4 sm:mb-6 md:mb-8 border-b pb-3 sm:pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">School Overview</h1>
                                <p className="text-xs sm:text-sm text-gray-600">{dashboardSubtitle}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Summary - Main KPIs - Clickable and Responsive */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
                        <StatCard 
                            title="Total Students"
                            value={displayStats.total_students}
                            icon={GraduationCap}
                            iconBgClass="bg-blue-50"
                            iconColorClass="text-blue-600"
                            clickable={true}
                            onClick={() => router.visit('/admin/students')}
                        />
                        <StatCard 
                            title="Total Teachers"
                            value={displayStats.total_teachers}
                            icon={UserCheck}
                            iconBgClass="bg-purple-50"
                            iconColorClass="text-purple-600"
                            clickable={true}
                            onClick={() => router.visit('/admin/teachers')}
                        />
                        <StatCard 
                            title="Total Parents"
                            value={displayStats.total_parents}
                            icon={Users}
                            iconBgClass="bg-green-50"
                            iconColorClass="text-green-600"
                            clickable={true}
                            onClick={() => router.visit('/admin/parents')}
                        />
                        <StatCard 
                            title="Failed Students"
                            value={displayStats.failed_students}
                            icon={TrendingDown}
                            iconBgClass="bg-red-50"
                            iconColorClass="text-red-600"
                            clickable={true}
                            onClick={() => router.visit('/admin/students')}
                        />
                    </div>

                    {/* Announcements Section - At Bottom */}
                    <div className="mb-8">
                        <AnnouncementCard role="admin" />
                    </div>

                    {/* Notification */}
                    {notification && (
                        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
                            <div className={`${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 rounded-xl shadow-2xl`}>
                                {notification.message}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AppLayout>
    );
};

export default Dashboard;