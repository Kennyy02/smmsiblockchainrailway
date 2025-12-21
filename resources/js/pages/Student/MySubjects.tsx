import React, { useState, useEffect, useCallback } from 'react';
import { 
    BookOpen, 
    Layers, 
    Calendar, 
    Search, 
    RefreshCw,
    Award,
    GraduationCap,
    Info,
    X,
    FileText,
    ChevronRight
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout'; 
import { usePage } from '@inertiajs/react';
import axios from 'axios';

// --- THEME COLORS (Using Blue for Student/System Consistency) ---
const PRIMARY_COLOR_CLASS = 'bg-[#007bff]'; 
const TEXT_COLOR_CLASS = 'text-[#007bff]';
const RING_COLOR_CLASS = 'focus:ring-[#007bff]';
const LIGHT_BG_CLASS = 'bg-[#007bff]/10';

interface StudentSubject {
    id: number;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    subject_description?: string;
    units: number;
    is_required: boolean;
    course_code: string;
    course_name: string;
    course_level: string;
    class_code: string;
    section: string;
    year_level: number;
    semester: string;
}

interface ClassInfo {
    class_id: number;
    class_code: string;
    section: string;
    course_name: string;
    course_level: string;
    year_level: number;
    semester: string;
}

interface AuthUser {
    id: number;
    name: string;
    student?: {
        id: number;
        student_id: string;
        course_id?: number;
        year_level?: number;
        current_class_id?: number;
    };
}

// Reusable Notification Component
interface Notification { type: 'success' | 'error'; message: string; }
const NotificationComponent: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = notification.type === 'success' ? PRIMARY_COLOR_CLASS : 'bg-red-500';

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
            <div className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                    <div className="font-medium">{notification.message}</div>
                    <button onClick={onClose} className="ml-4 rounded-full p-1 hover:bg-white/20 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Subject Details Modal
interface SubjectDetailsModalProps {
    subject: StudentSubject;
    classInfo: ClassInfo | null;
    onClose: () => void;
}

const SubjectDetailsModal: React.FC<SubjectDetailsModalProps> = ({ subject, classInfo, onClose }) => {
    const infoItems = [
        { icon: BookOpen, label: 'Subject Code', value: subject.subject_code },
        { icon: Layers, label: 'Subject Name', value: subject.subject_name },
        { icon: FileText, label: 'Description', value: subject.subject_description || 'No description available' },
        { icon: GraduationCap, label: 'Units', value: `${subject.units} units` },
        { icon: Calendar, label: 'Semester', value: `${subject.semester} Semester` },
        { icon: Layers, label: 'Section', value: classInfo?.section || subject.section || 'N/A' },
    ];

    return (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-white/30 dark:bg-black/30 flex justify-center items-center p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-gray-800 dark:border-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all border dark:border-white"
                onClick={e => e.stopPropagation()} 
            >
                {/* Modal Header */}
                <div className={`p-6 ${PRIMARY_COLOR_CLASS} text-white rounded-t-xl flex justify-between items-center`}>
                    <h2 className="text-xl font-bold flex items-center">
                        <BookOpen className="h-6 w-6 mr-3" />
                        {subject.subject_name}
                    </h2>
                    <button onClick={onClose} className="text-white p-1 rounded-full hover:bg-white hover:text-[#007bff] transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                {/* Modal Content */}
                <div className="p-6 space-y-6">
                    <div className="border-b dark:border-white pb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b dark:border-white pb-2 mb-4">Subject Information</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-500 dark:text-white flex items-center">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Subject Code
                                </span>
                                <span className="text-lg font-semibold text-gray-800 dark:text-white">{subject.subject_code}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-500 dark:text-white flex items-center">
                                    <Layers className="h-4 w-4 mr-2" />
                                    Subject Name
                                </span>
                                <span className="text-lg font-semibold text-gray-800 dark:text-white">{subject.subject_name}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-500 dark:text-white flex items-center">
                                    <GraduationCap className="h-4 w-4 mr-2" />
                                    Units
                                </span>
                                <span className="text-lg font-semibold text-gray-800 dark:text-white">{subject.units} units</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-500 dark:text-white flex items-center">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Semester
                                </span>
                                <span className="text-lg font-semibold text-gray-800 dark:text-white">{subject.semester} Semester</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-500 dark:text-white flex items-center">
                                    <Layers className="h-4 w-4 mr-2" />
                                    Section
                                </span>
                                <span className="text-lg font-semibold text-gray-800 dark:text-white">{classInfo?.section || subject.section || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <span className="text-sm font-medium text-gray-500 dark:text-white flex items-center mb-2">
                                <FileText className="h-4 w-4 mr-2" />
                                Description
                            </span>
                            <p className="text-sm text-gray-700 dark:text-white bg-gray-50 dark:bg-gray-900 dark:border-white border dark:border-white p-3 rounded-lg">
                                {subject.subject_description || 'No description available'}
                            </p>
                        </div>
                    </div>

                    {/* Course Info */}
                    <div className="border-b dark:border-white pb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b dark:border-white pb-2 mb-4">Course/Program</h3>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500 dark:text-white">Program</span>
                            <span className="text-lg font-semibold text-gray-800 dark:text-white">{subject.course_name}</span>
                            <span className="text-sm text-gray-500 dark:text-white">{subject.course_code}</span>
                        </div>
                    </div>

                    {/* Quick Access */}
                    <div className="pt-4">
                        <h3 className={`text-lg font-bold mb-3 ${TEXT_COLOR_CLASS}`}>Quick Access</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <a 
                                href={`/student/course-materials?subject_id=${subject.subject_id}`} 
                                className={`flex items-center justify-center px-4 py-3 rounded-xl ${PRIMARY_COLOR_CLASS} text-white hover:bg-[#0056b3] transition-colors font-medium`}
                            >
                                <FileText className="h-5 w-5 mr-2" />
                                View Course Materials
                                <ChevronRight className="h-5 w-5 ml-2" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Component
const MySubjects: React.FC = () => {
    const { auth } = usePage().props as { auth: { user: AuthUser | null } };
    const user = auth?.user;
    const studentId = user?.student?.id;

    const [subjects, setSubjects] = useState<StudentSubject[]>([]);
    const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<StudentSubject | null>(null);

    const fetchSubjects = useCallback(async () => {
        if (!studentId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get('/api/course-year-subjects/student-subjects', {
                params: { student_id: studentId }
            });

            if (response.data.success) {
                setSubjects(response.data.data || []);
                setClassInfo(response.data.class_info || null);
            } else {
                setNotification({ type: 'error', message: response.data.message || 'Failed to load subjects.' });
            }
        } catch (error: any) {
            console.error('Error fetching subjects:', error);
            setNotification({ 
                type: 'error', 
                message: error.response?.data?.message || 'Failed to connect to the server.' 
            });
        } finally {
            setLoading(false);
        }
    }, [studentId]);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    // Filter subjects based on search
    const filteredSubjects = subjects.filter(subject => 
        subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.subject_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate total units
    const totalUnits = subjects.reduce((sum, s) => sum + (s.units || 0), 0);

    // Format grade level display
    const formatGradeLevel = (grade: number): string => {
        if (grade >= 13) {
            const yearNames = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
            return yearNames[grade - 13] || `${grade - 12}th Year`;
        }
        return `Grade ${grade}`;
    };

    return (
        <AppLayout>
            <div className="p-8 space-y-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Enrolled Subjects</h1>
                        <p className="mt-2 text-gray-600 dark:text-white">
                            Subjects you are currently taking based on your program curriculum.
                        </p>
                    </div>
                    <button
                        onClick={fetchSubjects}
                        className={`flex items-center px-4 py-2 border border-gray-300 dark:border-white rounded-lg text-sm font-medium ${TEXT_COLOR_CLASS} hover:bg-[#e6f2ff] dark:hover:bg-gray-700 transition-colors`}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh List
                    </button>
                </div>

                {/* Class Info Card */}
                {classInfo && (
                    <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className={`p-3 rounded-xl ${LIGHT_BG_CLASS}`}>
                                    <GraduationCap className={`h-8 w-8 ${TEXT_COLOR_CLASS}`} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{classInfo.course_name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-white">
                                        {formatGradeLevel(classInfo.year_level)} • {classInfo.semester} Semester • Section {classInfo.section}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{subjects.length}</div>
                                <div className="text-sm text-gray-500 dark:text-white">Subjects ({totalUnits} units)</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search Filter */}
                <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-white">
                    <div className="relative max-w-lg">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 dark:text-white" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`pl-12 w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                            placeholder="Search Subject Name or Code..."
                        />
                    </div>
                </div>

                {/* Subjects Table */}
                <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-white">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-white">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900 dark:border-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">Class/Section</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">Units</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">Details</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex justify-center">
                                                <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                                            </div>
                                            <p className="mt-2 text-sm text-gray-600 dark:text-white">Loading your subjects...</p>
                                        </td>
                                    </tr>
                                ) : !studentId ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-white">
                                            Student profile not found. Please contact the administrator.
                                        </td>
                                    </tr>
                                ) : filteredSubjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-white">
                                            {searchTerm 
                                                ? 'No subjects match your search.'
                                                : 'You are not currently enrolled in any subjects. Please ensure you are enrolled in a class.'
                                            }
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubjects.map((subject) => (
                                        <tr key={subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            {/* Subject info */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`p-2 rounded-lg mr-3 ${LIGHT_BG_CLASS}`}>
                                                        <BookOpen className={`h-5 w-5 ${TEXT_COLOR_CLASS}`} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{subject.subject_name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-white">{subject.subject_code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Class/Section */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-700 dark:text-white">
                                                    {classInfo?.class_code || subject.class_code || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-white">
                                                    Section {classInfo?.section || subject.section || 'N/A'}
                                                </div>
                                            </td>
                                            {/* Units */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${LIGHT_BG_CLASS} ${TEXT_COLOR_CLASS}`}>
                                                    {subject.units} units
                                                </span>
                                            </td>
                                            {/* Description */}
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-700 dark:text-white max-w-xs truncate">
                                                    {subject.subject_description || 'No description available'}
                                                </div>
                                            </td>
                                            {/* Action */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button 
                                                    onClick={() => setSelectedSubject(subject)}
                                                    className={`flex items-center ml-auto px-3 py-2 text-sm font-medium border border-gray-300 dark:border-white rounded-lg ${TEXT_COLOR_CLASS} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                                                >
                                                    <Info className="h-4 w-4 mr-1" />
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer with summary */}
                    {!loading && filteredSubjects.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-white bg-gray-50 dark:bg-gray-900">
                            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-white">
                                <span>Showing {filteredSubjects.length} of {subjects.length} subjects</span>
                                <span className="font-medium">Total: {totalUnits} units</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notification */}
                {notification && (
                    <NotificationComponent 
                        notification={notification} 
                        onClose={() => setNotification(null)} 
                    />
                )}
            </div>

            {/* Subject Details Modal */}
            {selectedSubject && (
                <SubjectDetailsModal
                    subject={selectedSubject}
                    classInfo={classInfo}
                    onClose={() => setSelectedSubject(null)}
                />
            )}
        </AppLayout>
    );
};

export default MySubjects;
