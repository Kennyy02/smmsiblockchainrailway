import React, { useState, useEffect, useCallback } from 'react';
import { 
    Award, 
    RefreshCw, 
    X, 
    BarChart, 
    Hash, 
    TrendingUp, 
    TrendingDown, 
    ClipboardList,
    AlertCircle,
    Users
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { usePage } from '@inertiajs/react';
import { 
    adminGradeService, 
    Grade, 
    GradeStats, 
    MinimalClassSubject
} from '../../../services/AdminGradeService';
import { adminClassSubjectService } from '../../../services/AdminClassSubjectService';

const PRIMARY_COLOR_CLASS = 'bg-gradient-to-r from-purple-600 to-indigo-600';
const TEXT_COLOR_CLASS = 'text-purple-600';

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

interface StudentDetails {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    full_name: string;
}

interface ParentDetails {
    id: number;
    students?: StudentDetails[];
}

interface AuthUser {
    id: number;
    role: string;
    name?: string;
    parent?: ParentDetails;
}

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

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => {
    const displayValue = (typeof value === 'number' && isNaN(value)) ? 'N/A' : value;
    const bgColor = color.replace('text-', 'bg-').replace('-600', '-100');
    
    return (
        <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-white">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{title}</p>
                    <p className={`text-3xl font-bold ${color}`}>{displayValue}</p>
                </div>
                <div className={`${bgColor} p-3 rounded-xl`}>
                    <Icon className={`h-8 w-8 ${color}`} />
                </div>
            </div>
        </div>
    );
};

const ParentGrades: React.FC = () => {
    const { auth } = usePage().props as { auth: { user: AuthUser } };
    const user = auth?.user;
    const parent = user?.parent;
    const children = parent?.students || [];

    // Get student_id from URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const initialStudentId = urlParams.get('student_id');
    
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
        initialStudentId ? parseInt(initialStudentId) : (children.length > 0 ? children[0].id : null)
    );
    
    const [groupedGrades, setGroupedGrades] = useState<GroupedGrades[]>([]);
    const [stats, setStats] = useState<GradeStats | null>(null);
    const [classSubjects, setClassSubjects] = useState<MinimalClassSubject[]>([]);
    const [studentName, setStudentName] = useState('');
    const [className, setClassName] = useState('');
    const [yearLevel, setYearLevel] = useState<number | null>(null);
    
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<Notification | null>(null);

    const selectedChild = children.find(c => c.id === selectedStudentId);

    const loadStudentGrades = async () => {
        if (!selectedStudentId) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        try {
            // Get student information
            const studentRes = await fetch(`/api/students/${selectedStudentId}`, {
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
                student_id: selectedStudentId,
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
                    message: 'No subjects found. Please ensure the student is enrolled in classes.' 
                });
                setGroupedGrades([]);
                return;
            }

            // Get the class information from the first class subject
            if (subjects.length > 0 && subjects[0].class) {
                setClassName(subjects[0].class.class_code || subjects[0].class.class_name || '');
                if (subjects[0].class.year_level !== undefined && subjects[0].class.year_level !== null) {
                    setYearLevel(subjects[0].class.year_level);
                }
            }

            // Get all grades for this student
            const classSubjectIds = subjects.map((cs: any) => cs.id);
            
            const response = await adminGradeService.getGrades({
                student_id: selectedStudentId,
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
        if (!selectedStudentId) return;
        
        try {
            const response = await adminGradeService.getGradeStats({ 
                student_id: selectedStudentId 
            });
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, [selectedStudentId]);

    useEffect(() => {
        if (selectedStudentId) {
            loadStudentGrades();
            fetchStats();
        }
    }, [selectedStudentId, fetchStats]);

    if (!parent || children.length === 0) {
        return (
            <AppLayout>
                <div className="p-8">
                    <div className="bg-red-50 border border-red-400 text-red-700 px-6 py-4 rounded-xl">
                        <div className="flex items-center">
                            <AlertCircle className="h-6 w-6 mr-3" />
                            <div>
                                <p className="font-bold">No Children Linked</p>
                                <p className="text-sm">No children are linked to your account. Please contact the administrator.</p>
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
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-6">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
                                Child's Grades
                            </h1>
                            <div className="mb-4">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                                    {studentName || (selectedChild ? (selectedChild.full_name || `${selectedChild.first_name} ${selectedChild.last_name}`) : 'Student')}
                                </h2>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                                    {selectedChild && (
                                        <div>
                                            <span className="font-semibold">Student ID:</span> {selectedChild.student_id}
                                        </div>
                                    )}
                                    {className && (
                                        <div>
                                            <span className="font-semibold">Class:</span> {className}
                                        </div>
                                    )}
                                    {yearLevel !== null && (() => {
                                        const { label, value } = formatGradeYearLevel(yearLevel);
                                        return (
                                            <div>
                                                <span className="font-semibold">{label}:</span> {value}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Child Selector (if multiple children) */}
                    {children.length > 1 && (
                        <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-white mb-6">
                            <div className="flex items-center">
                                <Users className="h-5 w-5 text-gray-400 dark:text-gray-300 mr-3" />
                                <label className="text-sm font-medium text-gray-700 dark:text-white mr-3">Select Child:</label>
                                <select
                                    value={selectedStudentId || ''}
                                    onChange={(e) => {
                                        const newId = parseInt(e.target.value);
                                        setSelectedStudentId(newId);
                                        window.history.replaceState({}, '', `/parent/grades?student_id=${newId}`);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all appearance-none bg-white dark:bg-gray-900 cursor-pointer"
                                >
                                    {children.map(child => (
                                        <option key={child.id} value={child.id}>
                                            {child.full_name || `${child.first_name} ${child.last_name}`} ({child.student_id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
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
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 p-6">
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} dark:text-white animate-spin`} />
                            </div>
                        </div>
                    ) : groupedGrades.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 p-6">
                            <div className="text-center py-12 text-gray-500 dark:text-gray-300">
                                No grades found for this student
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {groupedGrades.map((group, groupIndex) => (
                                <div key={`${group.academic_year_id}_${group.semester_id}`} className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-white">
                                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-900 px-6 py-4 border-b border-gray-200 dark:border-white">
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
                                    <div className="p-6">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full border-collapse border border-gray-300 dark:border-white">
                                                <thead>
                                                    <tr className="bg-gray-100 dark:bg-gray-900">
                                                        <th className="border border-gray-300 dark:border-white px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-white">Subject</th>
                                                        <th className="border border-gray-300 dark:border-white px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-white">Prelim</th>
                                                        <th className="border border-gray-300 dark:border-white px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-white">Midterm</th>
                                                        <th className="border border-gray-300 dark:border-white px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-white">Final</th>
                                                        <th className="border border-gray-300 dark:border-white px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-white">Final Rating</th>
                                                        <th className="border border-gray-300 dark:border-white px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-white">Units</th>
                                                        <th className="border border-gray-300 dark:border-white px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-white">Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.grades.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={7} className="border border-gray-300 dark:border-white px-4 py-8 text-center text-gray-500 dark:text-gray-300">
                                                                No subjects found for this period
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        group.grades.map((grade, index) => (
                                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                                <td className="border border-gray-300 dark:border-white px-4 py-3 text-sm">
                                                                    <div>
                                                                        <div className="font-medium dark:text-white">{grade.subject.subject_code}</div>
                                                                        <div className="text-xs text-gray-600 dark:text-gray-300">{grade.subject.subject_name}</div>
                                                                    </div>
                                                                </td>
                                                                <td className="border border-gray-300 dark:border-white px-4 py-3 text-center text-sm dark:text-white">
                                                                    {grade.prelim_grade !== null && grade.prelim_grade !== undefined ? grade.prelim_grade : ''}
                                                                </td>
                                                                <td className="border border-gray-300 dark:border-white px-4 py-3 text-center text-sm dark:text-white">
                                                                    {grade.midterm_grade !== null && grade.midterm_grade !== undefined ? grade.midterm_grade : ''}
                                                                </td>
                                                                <td className="border border-gray-300 dark:border-white px-4 py-3 text-center text-sm dark:text-white">
                                                                    {grade.final_grade !== null && grade.final_grade !== undefined ? grade.final_grade : ''}
                                                                </td>
                                                                <td className="border border-gray-300 dark:border-white px-4 py-3 text-center text-sm font-semibold dark:text-white">
                                                                    {grade.final_rating !== null && grade.final_rating !== undefined ? grade.final_rating : ''}
                                                                </td>
                                                                <td className="border border-gray-300 dark:border-white px-4 py-3 text-center text-sm dark:text-white">
                                                                    {grade.units || ''}
                                                                </td>
                                                                <td className="border border-gray-300 dark:border-white px-4 py-3 text-center text-sm">
                                                                    {grade.remarks ? (
                                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border dark:border-white ${
                                                                            grade.remarks === 'Passed' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-white dark:border-white' :
                                                                            grade.remarks === 'Failed' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-white dark:border-white' :
                                                                            'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-white dark:border-white'
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

export default ParentGrades;
