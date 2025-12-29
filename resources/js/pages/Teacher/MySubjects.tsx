import React, { useState, useEffect } from 'react';
import { 
    BookOpen, 
    RefreshCw,
    ChevronRight,
    GraduationCap,
    FileText,
    AlertCircle,
    Hash,
    Layers
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useTeacherAuth } from '../../../services/useTeacherAuth';

const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]';

interface Subject {
    id: number;
    subject_code: string;
    subject_name: string;
    description?: string;
    units?: number;
}

interface Notification {
    type: 'success' | 'error';
    message: string;
}

const NotificationBanner: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = notification.type === 'success' 
        ? PRIMARY_COLOR_CLASS
        : 'bg-gradient-to-r from-red-500 to-red-600';

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
            <div className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                    <div className="font-medium">{notification.message}</div>
                    <button 
                        onClick={onClose}
                        className="ml-4 rounded-full p-1 hover:bg-white/20 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const SubjectCard: React.FC<{ subject: Subject }> = ({ subject }) => {
    return (
        <div className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all hover:scale-[1.01] sm:hover:scale-[1.02] overflow-hidden">
            {/* Header with gradient */}
            <div className={`${PRIMARY_COLOR_CLASS} px-4 sm:px-6 py-3 sm:py-4`}>
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">
                            {subject.subject_code}
                        </h3>
                        <p className="text-xs sm:text-sm text-white/80 truncate">
                            {subject.subject_name}
                        </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-lg flex-shrink-0 ml-2">
                        <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {/* Description */}
                {subject.description && (
                    <div>
                        <p className="text-xs text-gray-500 dark:text-white uppercase tracking-wider mb-1">Description</p>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-white line-clamp-2">{subject.description}</p>
                    </div>
                )}

                {/* Units */}
                <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <Layers className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-white" />
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-white">
                            {subject.units || 0} {(subject.units || 0) === 1 ? 'unit' : 'units'}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-3 sm:pt-4">
                    <a
                        href={`/teacher/course-materials?subject_id=${subject.id}`}
                        className={`flex items-center justify-center px-3 sm:px-4 py-2 ${LIGHT_BG_CLASS} ${TEXT_COLOR_CLASS} dark:text-white rounded-lg ${LIGHT_HOVER_CLASS} dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm font-medium`}
                    >
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 dark:text-white" />
                        <span className="hidden sm:inline">Materials</span>
                        <span className="sm:hidden">Mat</span>
                    </a>
                    <a
                        href={`/teacher/my-classes?subject_id=${subject.id}`}
                        className={`flex items-center justify-center px-3 sm:px-4 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-lg ${HOVER_COLOR_CLASS} transition-all text-xs sm:text-sm font-medium`}
                    >
                        <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">View Classes</span>
                        <span className="sm:hidden">Classes</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

const MySubjects: React.FC = () => {
    const { currentTeacherId, isTeacher, teacher } = useTeacherAuth();
    
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchMySubjects = async () => {
        if (!currentTeacherId) {
            console.warn('⚠️ No teacher ID available');
            setLoading(false);
            return;
        }
        
        setLoading(true);
        try {
            console.log('🔍 [MY SUBJECTS] Fetching subjects for teacher ID:', currentTeacherId);
            const response = await fetch(`/api/teachers/${currentTeacherId}/subjects`);
            const data = await response.json();
            console.log('📦 [MY SUBJECTS] Response:', data);
            
            if (data.success) {
                setSubjects(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch subjects:', error);
            setNotification({ type: 'error', message: 'Failed to load your subjects.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('🔍 [MY SUBJECTS] Auth state - teacherId:', currentTeacherId, 'teacher:', teacher);
        if (currentTeacherId) {
            fetchMySubjects();
        } else if (!isTeacher) {
            setLoading(false);
        }
    }, [currentTeacherId]);

    // Filter subjects based on search
    const filteredSubjects = subjects.filter(subject => {
        const matchesSearch = !searchTerm || 
            subject.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subject.subject_code?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
    });

    // Calculate total units
    const totalUnits = subjects.reduce((sum, s) => sum + (parseFloat(s.units?.toString() || '0') || 0), 0);

    if (!isTeacher) {
        return (
            <AppLayout>
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl">
                            <div className="flex items-center">
                                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 flex-shrink-0" />
                                <div>
                                    <p className="text-sm sm:text-base font-bold">Access Denied</p>
                                    <p className="text-xs sm:text-sm mt-0.5">This page is only accessible to teachers.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
                    {/* Header */}
                    <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="mb-4 sm:mb-6 md:mb-0">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center mb-1 sm:mb-2">
                                <BookOpen className={`h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 mr-2 sm:mr-3 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                My Subjects
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-white">
                                View all subjects assigned to you
                            </p>
                        </div>
                        <button
                            onClick={fetchMySubjects}
                            className={`inline-flex items-center px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 border border-gray-300 dark:border-gray-700 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base font-medium ${TEXT_COLOR_CLASS} bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                        >
                            <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
                        <div className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-white mb-0.5 sm:mb-1">Total Subjects</p>
                                    <p className={`text-xl sm:text-2xl md:text-3xl font-bold ${TEXT_COLOR_CLASS} dark:text-white leading-tight`}>{subjects.length}</p>
                                    <p className="text-xs text-gray-500 dark:text-white mt-0.5 sm:mt-1">Assigned to you</p>
                                </div>
                                <div className={`${LIGHT_BG_CLASS} dark:bg-gray-700 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0`}>
                                    <BookOpen className={`h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 ${TEXT_COLOR_CLASS} dark:text-white`} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-white mb-0.5 sm:mb-1">Total Units</p>
                                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 dark:text-white leading-tight">{Number(totalUnits).toFixed(2)}</p>
                                    <p className="text-xs text-gray-500 dark:text-white mt-0.5 sm:mt-1">Combined teaching load</p>
                                </div>
                                <div className="bg-blue-100 dark:bg-gray-700 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
                                    <Layers className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600 dark:text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8 border border-gray-100 dark:border-gray-700">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-white" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 sm:pl-12 w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all text-sm sm:text-base"
                                placeholder="Search subjects..."
                            />
                        </div>
                    </div>

                    {/* Subjects Grid */}
                    {loading ? (
                        <div className="flex flex-col sm:flex-row items-center justify-center py-8 sm:py-12 gap-3 sm:gap-4">
                            <RefreshCw className={`h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 ${TEXT_COLOR_CLASS} dark:text-white animate-spin`} />
                            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-white">Loading your subjects...</p>
                        </div>
                    ) : filteredSubjects.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 md:p-12 text-center border border-gray-100 dark:border-gray-700">
                            <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-white mx-auto mb-3 sm:mb-4" />
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                                {searchTerm ? 'No subjects match your search' : 'No subjects assigned yet'}
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-white">
                                {searchTerm 
                                    ? 'Try adjusting your search criteria'
                                    : 'You will see your assigned subjects here once they are set up'}
                            </p>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className={`mt-3 sm:mt-4 px-4 sm:px-6 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-lg sm:rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium text-sm sm:text-base`}
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {filteredSubjects.map((subject) => (
                                    <SubjectCard key={subject.id} subject={subject} />
                                ))}
                            </div>

                            {/* Results count */}
                            <div className="text-center text-xs sm:text-sm text-gray-600 dark:text-white mt-4 sm:mt-6">
                                Showing {filteredSubjects.length} of {subjects.length} subjects
                            </div>
                        </>
                    )}

                    {notification && (
                        <NotificationBanner
                            notification={notification}
                            onClose={() => setNotification(null)}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default MySubjects;

