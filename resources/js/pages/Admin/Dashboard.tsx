import React, { useState, useEffect } from 'react';
import { 
    Award, BarChart, Hash, Zap, BookOpen, Clock, TrendingDown, 
    Sunrise, Sun, Moon, RefreshCw, Users, GraduationCap, UserCheck 
} from 'lucide-react';
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

// Custom Stat Card Component
interface StatCardProps {
    title: string;
    value: string | number | React.ReactNode; // Value can be a node (like the loading spinner)
    icon: React.ElementType;
    iconBgClass: string;
    iconColorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, iconBgClass, iconColorClass }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transition-shadow duration-300 hover:shadow-xl">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                <p className="text-3xl font-bold text-gray-900">
                    {value}
                </p>
            </div>
            <div className={`p-3 rounded-xl ${iconBgClass}`}>
                <Icon className={`w-6 h-6 ${iconColorClass}`} />
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
// ☀️ GREETING COMPONENT
// ========================================================================

const Greeting: React.FC = () => {
    const hours = new Date().getHours();
    let greeting = 'Hello';
    let Icon = Sun;
    let iconColor = 'text-yellow-500';

    if (hours >= 5 && hours < 12) {
        greeting = 'Good Morning';
        Icon = Sunrise;
        iconColor = 'text-orange-500';
    } else if (hours >= 12 && hours < 18) {
        greeting = 'Good Afternoon';
        Icon = Sun;
        iconColor = 'text-yellow-600';
    } else {
        greeting = 'Good Evening';
        Icon = Moon;
        iconColor = 'text-indigo-400';
    }

    return (
        <div className="flex items-center space-x-3 mb-6 p-4 bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border-l-4 border-yellow-500 animate-in fade-in duration-500">
            <div className={`p-2 rounded-full ${iconColor} bg-white shadow-inner`}>
                <Icon className={`w-8 h-8 ${iconColor} animate-spin-slow`} />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800">
                {greeting}, Administrator!
            </h2>
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
            {/* 🐛 FIX: Replaced <style jsx global> with standard <style> to remove React warnings */}
            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 15s linear infinite;
                }
            `}</style>

            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    
                    {/* ☀️ GREETING COMPONENT */}
                    <Greeting />

                    {/* Header/Subtitle */}
                    <div className="mb-8 border-b pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">School Overview</h1>
                                <p className="text-gray-600">{dashboardSubtitle}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Summary - Main KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <StatCard 
                            title="Total Students"
                            value={displayStats.total_students}
                            icon={GraduationCap}
                            iconBgClass="bg-blue-50"
                            iconColorClass="text-blue-600"
                        />
                        <StatCard 
                            title="Total Teachers"
                            value={displayStats.total_teachers}
                            icon={UserCheck}
                            iconBgClass="bg-purple-50"
                            iconColorClass="text-purple-600"
                        />
                        <StatCard 
                            title="Total Parents"
                            value={displayStats.total_parents}
                            icon={Users}
                            iconBgClass="bg-green-50"
                            iconColorClass="text-green-600"
                        />
                        <StatCard 
                            title="Failed Students"
                            value={displayStats.failed_students}
                            icon={TrendingDown}
                            iconBgClass="bg-red-50"
                            iconColorClass="text-red-600"
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