import React, { useState, useEffect, useCallback } from 'react';
import { 
    Award, 
    Filter, 
    RefreshCw, 
    X, 
    BarChart, 
    Hash, 
    TrendingUp, 
    TrendingDown, 
    ClipboardList,
    AlertCircle
} from 'lucide-react';

// --- Local Imports ---
import AppLayout from '@/layouts/app-layout';
import { useStudentAuth } from '../../../services/usestudentauth';
import { 
    adminGradeService, 
    Grade, 
    GradeStats, 
    GradeRemarks,
    AcademicYearOption,  
    SemesterOption,      
    GradeFilters,
    MinimalClassSubject
} from '../../../services/AdminGradeService';
import { adminClassSubjectService } from '../../../services/AdminClassSubjectService';

// ====================================================================
// --- 1. Constants and Types
// ====================================================================

const PRIMARY_COLOR_CLASS = 'bg-gradient-to-r from-purple-600 to-indigo-600';
const TEXT_COLOR_CLASS = 'text-purple-600';
const RING_COLOR_CLASS = 'focus:ring-purple-600';

// Helper function to format grade/year level based on education category
const formatGradeYearLevel = (yearLevel: number | null): { label: string; value: string } => {
    if (yearLevel === null || yearLevel === undefined) return { label: '', value: '' };
    
    // College: 13-16 (1st Year - 4th Year)
    if (yearLevel >= 13 && yearLevel <= 16) {
        const yearNames = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
        return { label: 'Year Level', value: yearNames[yearLevel - 13] };
    }
    
    // Elementary (1-6), Junior High (7-10), Senior High (11-12): All use "Grade Level"
    return { label: 'Grade Level', value: `Grade ${yearLevel}` };
};

interface Notification {
    type: 'success' | 'error' | 'info';
    message: string;
}

interface StudentGrades {
    subject: {
        id: number;
        subject_code: string;
        subject_name: string;
        units?: number;
    };
    prelim_grade: number | null;
    midterm_grade: number | null;
    final_grade: number | null;
    final_rating: number | null;
    remarks: string | null;
    units: number;
}

interface GroupedGrades {
    academic_year_id: number;
    semester_id: number;
    academic_year_name: string;
    semester_name: string;
    grades: StudentGrades[];
}

// ====================================================================
// --- 2. Helper Components & Utilities
// ====================================================================

/**
 * Renders a transient notification popup.
 */
const NotificationDisplay: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = notification.type === 'success' 
        ? 'bg-green-600'
        : notification.type === 'error'
        ? 'bg-red-600'
        : 'bg-blue-600';

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
            <div className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                    <div className="font-medium">{notification.message}</div>
                    <button 
                        onClick={onClose}
                        className="ml-4 rounded-full p-1 hover:bg-white/20 transition-colors cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Renders a single statistic card for the dashboard view.
 */
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => {
    const displayValue = (typeof value === 'number' && isNaN(value)) ? 'N/A' : value;
    const bgColor = color.replace('text-', 'bg-').replace('-600', '-100');
    
    return (
        <div className="bg-white dark:bg-gray-800 dark:border-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100 dark:border-white">
            {/* Mobile: Centered layout */}
            <div className="flex flex-col items-center text-center md:hidden">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-white mb-1 sm:mb-2">{title}</p>
                <p className={`text-2xl sm:text-3xl font-bold ${color} mb-2 sm:mb-3`}>{displayValue}</p>
                <div className={`${bgColor} dark:bg-gray-700 p-2 sm:p-3 rounded-full`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${color} dark:text-white`} />
                </div>
            </div>
            {/* Desktop: Original layout with icon on right */}
            <div className="hidden md:flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-white mb-1">{title}</p>
                    <p className={`text-3xl font-bold ${color}`}>{displayValue}</p>
                </div>
                <div className={`${bgColor} dark:bg-gray-700 p-3 rounded-xl`}>
                    <Icon className={`h-8 w-8 ${color} dark:text-white`} />
                </div>
            </div>
        </div>
    );
};

// ====================================================================
// --- 3. Main Component
// ====================================================================

const MyGrades: React.FC = () => {
    const { currentStudentId, isStudent, user } = useStudentAuth(); 
    
    // --- State Management ---
    const [groupedGrades, setGroupedGrades] = useState<GroupedGrades[]>([]);
    const [stats, setStats] = useState<GradeStats | null>(null);
    const [classSubjects, setClassSubjects] = useState<MinimalClassSubject[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
    const [semesters, setSemesters] = useState<SemesterOption[]>([]);
    const [studentName, setStudentName] = useState('');
    const [className, setClassName] = useState('');
    const [yearLevel, setYearLevel] = useState<number | null>(null);
    
    const [loading, setLoading] = useState(true);
    const [loadingLists, setLoadingLists] = useState(true);
    const [notification, setNotification] = useState<Notification | null>(null);

    // --- Data Fetching Logic ---

    const loadStudentGrades = async () => {
        if (!currentStudentId) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        try {
            // Get student information
            const studentRes = await fetch(`/api/students/${currentStudentId}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            
            if (studentRes.ok) {
                const studentData = await studentRes.json();
                if (studentData.success) {
                    setStudentName(studentData.data.full_name || `${studentData.data.first_name} ${studentData.data.last_name}`);
                    if (studentData.data.year_level !== undefined && studentData.data.year_level !== null) {
                        setYearLevel(studentData.data.year_level);
                    }
                }
            }

            // Get all class subjects for this student
            const classSubjectsRes = await adminClassSubjectService.getClassSubjects({
                student_id: currentStudentId,
                per_page: 9999,
            });

            if (!classSubjectsRes.success) {
                setNotification({ 
                    type: 'error', 
                    message: classSubjectsRes.message || 'Failed to load class subjects' 
                });
                setGroupedGrades([]);
                return;
            }

            const subjects = classSubjectsRes.data || [];
            setClassSubjects(subjects);
            
            if (subjects.length === 0) {
                setNotification({ 
                    type: 'info', 
                    message: 'No subjects found. Please ensure you are enrolled in classes.' 
                });
                setGroupedGrades([]);
                return;
            }

            // Get the class information from the first class subject (assuming student is in one primary class)
            if (subjects.length > 0 && subjects[0].class) {
                setClassName(subjects[0].class.class_code || subjects[0].class.class_name || '');
                if (subjects[0].class.year_level !== undefined && subjects[0].class.year_level !== null) {
                    setYearLevel(subjects[0].class.year_level);
                }
            }

            // Get all grades for this student
            const classSubjectIds = subjects.map((cs: any) => cs.id);
            
            const response = await adminGradeService.getGrades({
                student_id: currentStudentId,
                per_page: 9999,
            });

            if (!response.success) {
                setNotification({ 
                    type: 'error', 
                    message: response.message || 'Failed to load grades' 
                });
                setGroupedGrades([]);
                return;
            }

            // Group grades by academic_year_id and semester_id
            const gradesByPeriod = new Map<string, { academic_year_id: number; semester_id: number; academic_year_name: string; semester_name: string; grades: Map<number, Grade> }>();
            
            if (response.data && response.data.length > 0) {
                response.data.forEach((grade: Grade) => {
                    // Only process grades that belong to this student's class subjects
                    const gradeClassSubjectId = grade.class_subject_id || (grade.class_subject as any)?.id;
                    if (classSubjectIds.length > 0 && !classSubjectIds.includes(gradeClassSubjectId)) {
                        return;
                    }
                    
                    const academicYearId = grade.academic_year_id;
                    const semesterId = grade.semester_id;
                    const key = `${academicYearId}_${semesterId}`;
                    
                    // Get academic year and semester names from the grade object
                    const academicYearName = (grade as any).academic_year?.year_name || (grade as any).academicYear?.year_name || '';
                    const semesterName = (grade as any).semester?.semester_name || (grade as any).semester?.semester_name || '';
                    
                    if (!gradesByPeriod.has(key)) {
                        gradesByPeriod.set(key, {
                            academic_year_id: academicYearId,
                            semester_id: semesterId,
                            academic_year_name: academicYearName,
                            semester_name: semesterName,
                            grades: new Map()
                        });
                    }
                    
                    const periodData = gradesByPeriod.get(key)!;
                    const subjectId = grade.class_subject?.subject?.id || (grade.class_subject as any)?.subject_id || null;
                    if (subjectId) {
                        periodData.grades.set(subjectId, grade);
                    }
                });
            }

            // Create grouped grades structure
            const grouped: GroupedGrades[] = Array.from(gradesByPeriod.values()).map(periodData => {
                // Create the grades table structure for this period
                const gradesTable: StudentGrades[] = subjects.map((cs: any) => {
                    const subjectId = cs.subject?.id || cs.subject_id;
                    const grade = periodData.grades.get(subjectId);
                    
                    return {
                        subject: cs.subject || {
                            id: cs.subject_id,
                            subject_code: cs.subject_code || '',
                            subject_name: cs.subject_name || '',
                            units: cs.subject?.units || 0,
                        },
                        prelim_grade: grade?.prelim_grade || null,
                        midterm_grade: grade?.midterm_grade || null,
                        final_grade: grade?.final_grade || null,
                        final_rating: grade?.final_rating || null,
                        remarks: grade?.remarks || null,
                        units: cs.subject?.units || 0,
                    };
                });

                return {
                    academic_year_id: periodData.academic_year_id,
                    semester_id: periodData.semester_id,
                    academic_year_name: periodData.academic_year_name,
                    semester_name: periodData.semester_name,
                    grades: gradesTable
                };
            });

            // Sort by academic year (desc) and semester (desc)
            grouped.sort((a, b) => {
                if (a.academic_year_id !== b.academic_year_id) {
                    return b.academic_year_id - a.academic_year_id;
                }
                return b.semester_id - a.semester_id;
            });

            setGroupedGrades(grouped);
        } catch (error: any) {
            console.error('Error loading student grades:', error);
            setNotification({ 
                type: 'error', 
                message: error.message || 'Failed to load grades. Please try again or contact support if the issue persists.' 
            });
            setGroupedGrades([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = useCallback(async () => {
        if (!currentStudentId) return;
        
        try {
            const response = await adminGradeService.getGradeStats({ 
                student_id: currentStudentId 
            });
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('❌ Failed to fetch stats:', error);
        }
    }, [currentStudentId]);

    const fetchDropdownLists = useCallback(async () => {
        if (!currentStudentId) return;
        
        setLoadingLists(true);
        try {
            const response = await adminGradeService.getAllDropdownOptions(undefined, currentStudentId);
            
            setAcademicYears(response.academicYears || []);
            setSemesters(response.semesters || []);
            
        } catch (error) {
            console.error('❌ Failed to load dropdowns:', error);
        } finally {
            setLoadingLists(false);
        }
    }, [currentStudentId]);

    // --- Effects ---
    
    useEffect(() => {
        if (currentStudentId) {
            fetchDropdownLists();
            loadStudentGrades();
            fetchStats();
        }
    }, [currentStudentId, fetchDropdownLists, fetchStats]);

    if (!isStudent) {
        return (
            <AppLayout>
                <div className="p-4 sm:p-6 lg:p-8">
                    <div className="bg-red-50 border border-red-400 text-red-700 px-4 sm:px-6 py-4 rounded-xl">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-3 flex-shrink-0" />
                            <div>
                                <p className="font-bold text-sm sm:text-base">Access Denied</p>
                                <p className="text-xs sm:text-sm">This page is only accessible to students.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            {notification && (
                <NotificationDisplay 
                    notification={notification} 
                    onClose={() => setNotification(null)} 
                />
            )}
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                    <div className="mb-4 sm:mb-6">
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
                                My Grades
                            </h1>
                            <div className="mb-4">
                                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 break-words">{studentName || user?.name || 'Student'}</h2>
                                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                    {className && (
                                        <div className="dark:text-white">
                                            <span className="font-semibold">Class:</span> {className}
                                        </div>
                                    )}
                                    {yearLevel !== null && (() => {
                                        const { label, value } = formatGradeYearLevel(yearLevel);
                                        return (
                                            <div className="dark:text-white">
                                                <span className="font-semibold">{label}:</span> {value}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards - Mobile: Centered with icon below, Desktop: Icon on right */}
                    {stats && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6">
                            <StatCard 
                                title="Total Grades" 
                                value={stats.total_grades} 
                                icon={Hash} 
                                color={TEXT_COLOR_CLASS} 
                            />
                            <StatCard 
                                title="Average Rating" 
                                value={`${Number(stats.average_final_rating ?? 0).toFixed(2)}%`} 
                                icon={BarChart} 
                                color="text-blue-600" 
                            />
                            <StatCard 
                                title="Passing Rate" 
                                value={`${Number(stats.passing_rate ?? 0).toFixed(1)}%`} 
                                icon={TrendingUp} 
                                color="text-green-600" 
                            />
                            <StatCard 
                                title="Passed" 
                                value={stats.passed_grades} 
                                icon={ClipboardList} 
                                color="text-indigo-600" 
                            />
                            <StatCard 
                                title="Failed" 
                                value={stats.failed_count} 
                                icon={TrendingDown} 
                                color="text-red-600" 
                            />
                        </div>
                    )}

                    {loading ? (
                        <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-white p-4 sm:p-6">
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} dark:text-white animate-spin`} />
                            </div>
                        </div>
                    ) : groupedGrades.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-white p-4 sm:p-6">
                            <div className="text-center py-12 text-gray-500 dark:text-gray-300">
                                No grades found for this student
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {groupedGrades.map((group, groupIndex) => (
                                <div key={`${group.academic_year_id}_${group.semester_id}`} className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-white">
                                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-900 dark:border-white px-6 py-4 border-b border-gray-200 dark:border-white">
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-white">Academic Year:</span> 
                                                <span className="ml-2 text-gray-900 dark:text-white">{group.academic_year_name || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-white">Semester:</span> 
                                                <span className="ml-2 text-gray-900 dark:text-white">{group.semester_name || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 sm:p-6">
                                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                                            <table className="min-w-full border-collapse border border-gray-300 dark:border-white">
                                                <thead>
                                                    <tr className="bg-gray-100 dark:bg-gray-900 dark:border-white">
                                                        <th className="border border-gray-300 dark:border-white px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-700 dark:text-white min-w-[120px]">Subject</th>
                                                        <th className="border border-gray-300 dark:border-white px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-700 dark:text-white min-w-[70px]">Prelim</th>
                                                        <th className="border border-gray-300 dark:border-white px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-700 dark:text-white min-w-[70px]">Midterm</th>
                                                        <th className="border border-gray-300 dark:border-white px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-700 dark:text-white min-w-[70px]">Final</th>
                                                        <th className="border border-gray-300 dark:border-white px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-700 dark:text-white min-w-[80px]">Final Rating</th>
                                                        <th className="border border-gray-300 dark:border-white px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-700 dark:text-white min-w-[60px]">Units</th>
                                                        <th className="border border-gray-300 dark:border-white px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-700 dark:text-white min-w-[90px]">Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.grades.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={7} className="border border-gray-300 dark:border-white px-2 sm:px-4 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                                                                No subjects found for this period
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        group.grades.map((grade, index) => (
                                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                                <td className="border border-gray-300 dark:border-white px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                                                                    <div>
                                                                        <div className="font-medium break-words dark:text-white">{grade.subject.subject_code}</div>
                                                                        <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 break-words">{grade.subject.subject_name}</div>
                                                                    </div>
                                                                </td>
                                                                <td className="border border-gray-300 dark:border-white px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm dark:text-white">
                                                                    {grade.prelim_grade !== null && grade.prelim_grade !== undefined ? grade.prelim_grade : ''}
                                                                </td>
                                                                <td className="border border-gray-300 dark:border-white px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm dark:text-white">
                                                                    {grade.midterm_grade !== null && grade.midterm_grade !== undefined ? grade.midterm_grade : ''}
                                                                </td>
                                                                <td className="border border-gray-300 dark:border-white px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm dark:text-white">
                                                                    {grade.final_grade !== null && grade.final_grade !== undefined ? grade.final_grade : ''}
                                                                </td>
                                                                <td className="border border-gray-300 dark:border-white px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold dark:text-white">
                                                                    {grade.final_rating !== null && grade.final_rating !== undefined ? grade.final_rating : ''}
                                                                </td>
                                                                <td className="border border-gray-300 dark:border-white px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm dark:text-white">
                                                                    {grade.units || ''}
                                                                </td>
                                                                <td className="border border-gray-300 dark:border-white px-2 sm:px-4 py-2 sm:py-3 text-center">
                                                                    {grade.remarks ? (
                                                                        <span className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border dark:border-white dark:text-white ${
                                                                            grade.remarks === 'Passed' ? 'bg-green-100 text-green-800 dark:bg-green-900' :
                                                                            grade.remarks === 'Failed' ? 'bg-red-100 text-red-800 dark:bg-red-900' :
                                                                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900'
                                                                        }`}>
                                                                            {grade.remarks}
                                                                        </span>
                                                                    ) : ''}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default MyGrades;
