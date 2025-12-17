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
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:scale-[1.02] overflow-hidden">
            {/* Header with gradient */}
            <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            {subject.subject_code}
                        </h3>
                        <p className="text-sm text-white/80">
                            {subject.subject_name}
                        </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                        <BookOpen className="h-6 w-6 text-white" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
                {/* Description */}
                {subject.description && (
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description</p>
                        <p className="text-sm text-gray-700">{subject.description}</p>
                    </div>
                )}

                {/* Units */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                            {subject.units || 0} {(subject.units || 0) === 1 ? 'unit' : 'units'}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                    <a
                        href={`/teacher/course-materials?subject_id=${subject.id}`}
                        className={`flex items-center justify-center px-4 py-2 ${LIGHT_BG_CLASS} ${TEXT_COLOR_CLASS} rounded-lg ${LIGHT_HOVER_CLASS} transition-colors text-sm font-medium`}
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Materials
                    </a>
                    <a
                        href={`/teacher/my-classes?subject_id=${subject.id}`}
                        className={`flex items-center justify-center px-4 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-lg ${HOVER_COLOR_CLASS} transition-all text-sm font-medium`}
                    >
                        <GraduationCap className="h-4 w-4 mr-2" />
                        View Classes
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
    const totalUnits = subjects.reduce((sum, s) => sum + (s.units || 0), 0);

    if (!isTeacher) {
        return (
            <AppLayout>
                <div className="p-8">
                    <div className="bg-red-50 border border-red-400 text-red-700 px-6 py-4 rounded-xl">
                        <div className="flex items-center">
                            <AlertCircle className="h-6 w-6 mr-3" />
                            <div>
                                <p className="font-bold">Access Denied</p>
                                <p className="text-sm">This page is only accessible to teachers.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-8 space-y-6 min-h-screen bg-[#f3f4f6]">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <BookOpen className={`h-8 w-8 mr-3 ${TEXT_COLOR_CLASS}`} />
                            My Subjects
                        </h1>
                        <p className="mt-2 text-gray-600">
                            View all subjects assigned to you
                        </p>
                    </div>
                    <button
                        onClick={fetchMySubjects}
                        className={`flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium ${TEXT_COLOR_CLASS} hover:bg-gray-50 transition-colors`}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Total Subjects</p>
                                <p className={`text-3xl font-bold ${TEXT_COLOR_CLASS}`}>{subjects.length}</p>
                                <p className="text-xs text-gray-500 mt-1">Assigned to you</p>
                            </div>
                            <div className={`${LIGHT_BG_CLASS} p-3 rounded-xl`}>
                                <BookOpen className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Total Units</p>
                                <p className="text-3xl font-bold text-blue-600">{totalUnits}</p>
                                <p className="text-xs text-gray-500 mt-1">Combined teaching load</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <Layers className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <BookOpen className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                            placeholder="Search subjects..."
                        />
                    </div>
                </div>

                {/* Subjects Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className={`h-12 w-12 ${TEXT_COLOR_CLASS} animate-spin`} />
                        <p className="ml-4 text-lg text-gray-600">Loading your subjects...</p>
                    </div>
                ) : filteredSubjects.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                        <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchTerm ? 'No subjects match your search' : 'No subjects assigned yet'}
                        </h3>
                        <p className="text-gray-600">
                            {searchTerm 
                                ? 'Try adjusting your search criteria'
                                : 'You will see your assigned subjects here once they are set up'}
                        </p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className={`mt-4 px-6 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-lg ${HOVER_COLOR_CLASS} transition-all font-medium`}
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSubjects.map((subject) => (
                                <SubjectCard key={subject.id} subject={subject} />
                            ))}
                        </div>

                        {/* Results count */}
                        <div className="text-center text-sm text-gray-600">
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
        </AppLayout>
    );
};

export default MySubjects;

