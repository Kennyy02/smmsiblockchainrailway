import React, { useState, useEffect } from 'react';
import { 
    Award, BarChart, Hash, Zap, BookOpen, Clock, TrendingDown, 
    Sunrise, Sun, Moon, RefreshCw 
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { 
    adminGradeService, 
    GradeStats, 
    ApiResponse,
    AcademicYearOption,
    SemesterOption,
} from '../../../services/AdminGradeService'; 

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

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<GradeStats>({
        total_grades: 0,
        average_final_rating: 0,
        passing_rate: 0,
        failed_count: 0,
        by_class_subject: [],
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
            const response: ApiResponse<GradeStats> = await adminGradeService.getGradeStats(ayId, semId);
            if (response.success && response.data) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error loading grade stats:', error);
            setNotification({ type: 'error', message: 'Failed to load grade statistics.' });
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
        total_grades: loadingSpinner,
        average_final_rating: loadingSpinner,
        passing_rate: loadingSpinner,
        failed_count: loadingSpinner,
    } : {
        total_grades: stats.total_grades,
        average_final_rating: `${Number(stats.average_final_rating ?? 0).toFixed(1)}%`,
        passing_rate: `${Number(stats.passing_rate ?? 0).toFixed(1)}%`,
        failed_count: stats.failed_count,
    };
    
    const dashboardSubtitle = `Data for: ${currentAYName} - ${currentSemName}`;

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
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Grade Overview</h1>
                                <p className="text-gray-600">{dashboardSubtitle}</p>
                            </div>
                        </div>
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-700 mb-3 border-b pb-2">Filter Data</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Academic Year Filter */}
                            <div className="flex items-center">
                                <Clock className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
                                <select
                                    value={selectedAY}
                                    onChange={(e) => setSelectedAY(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${PRIMARY_COLOR_CLASS.replace('bg-', 'focus:ring-')} focus:border-transparent transition-all appearance-none bg-white`}
                                >
                                    <option value="all">Filter by Academic Year (Overall)</option>
                                    {academicYears.map(ay => (
                                        <option key={ay.id} value={ay.id}>
                                            {ay.year_name} {ay.is_current && '(Current)'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Semester Filter */}
                            <div className="flex items-center">
                                <BookOpen className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
                                <select
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${PRIMARY_COLOR_CLASS.replace('bg-', 'focus:ring-')} focus:border-transparent transition-all appearance-none bg-white`}
                                >
                                    <option value="all">Filter by Semester (All)</option>
                                    {semesters.map(sem => (
                                        <option key={sem.id} value={sem.id}>
                                            {sem.semester_name} {sem.is_current && '(Current)'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Empty space */}
                            <div />
                        </div>
                    </div>

                    {/* Stats Summary - Main KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <StatCard 
                            title="Total Grade Entries"
                            value={displayStats.total_grades}
                            icon={Hash}
                            iconBgClass={LIGHT_BG_CLASS}
                            iconColorClass={TEXT_COLOR_CLASS}
                        />
                        <StatCard 
                            title="Average Rating"
                            value={displayStats.average_final_rating}
                            icon={BarChart}
                            iconBgClass={LIGHT_BG_CLASS}
                            iconColorClass={TEXT_COLOR_CLASS}
                        />
                        <StatCard 
                            title="Passing Rate"
                            value={displayStats.passing_rate}
                            icon={Award}
                            iconBgClass="bg-green-50"
                            iconColorClass="text-green-600"
                        />
                        <StatCard 
                            title="Failed Students"
                            value={displayStats.failed_count}
                            icon={Zap}
                            iconBgClass="bg-red-50"
                            iconColorClass="text-red-600"
                        />
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