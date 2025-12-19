import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowLeft, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Link, usePage, router } from '@inertiajs/react';
import { adminGradeService, Grade } from '../../../services/AdminGradeService';
import { adminClassSubjectService } from '../../../services/AdminClassSubjectService';

const PRIMARY_COLOR_CLASS = 'bg-gradient-to-r from-purple-600 to-indigo-600';
const TEXT_COLOR_CLASS = 'text-purple-600';

// Helper function to format year level for college
const formatYearLevel = (yearLevel: number | null): string => {
    if (yearLevel === null || yearLevel === undefined) return '';
    const yearNames = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
    if (yearLevel >= 1 && yearLevel <= yearNames.length) {
        return yearNames[yearLevel - 1];
    }
    return `${yearLevel}${yearLevel === 1 ? 'st' : yearLevel === 2 ? 'nd' : yearLevel === 3 ? 'rd' : 'th'} Year`;
};

interface Notification {
    type: 'success' | 'error' | 'info';
    message: string;
}

// Notification Component
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
                    <button onClick={onClose} className="ml-4 rounded-full p-1 hover:bg-white/20 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

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

const BlockchainStudentGrades: React.FC = () => {
    const { props } = usePage();
    const studentId = (props as any).studentId;
    const classId = (props as any).classId;
    
    const [loading, setLoading] = useState(true);
    const [groupedGrades, setGroupedGrades] = useState<GroupedGrades[]>([]);
    const [studentName, setStudentName] = useState('');
    const [className, setClassName] = useState('');
    const [yearLevel, setYearLevel] = useState<number | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);

    useEffect(() => {
        if (studentId && classId) {
            loadStudentGrades();
        }
    }, [studentId, classId]);

    const loadStudentGrades = async () => {
        setLoading(true);
        try {
            // Get class information
            const classRes = await fetch(`/api/classes/${classId}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            
            if (!classRes.ok) {
                const errorData = await classRes.json().catch(() => ({ message: 'Failed to load class information' }));
                throw new Error(errorData.message || errorData.error || `Server error: ${classRes.status}`);
            }
            
            const classData = await classRes.json();
            
            if (!classData.success) {
                throw new Error(classData.message || 'Failed to load class information');
            }
            
            if (classData.success) {
                setClassName(classData.data.class_code || classData.data.class_name);
                
                // Extract year level
                if (classData.data.year_level !== undefined && classData.data.year_level !== null) {
                    setYearLevel(classData.data.year_level);
                }
                
                // Get student information
                const studentRes = await fetch(`/api/students/${studentId}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                });
                
                if (studentRes.ok) {
                    const studentData = await studentRes.json();
                    if (studentData.success) {
                        setStudentName(studentData.data.full_name || `${studentData.data.first_name} ${studentData.data.last_name}`);
                    }
                } else {
                    console.warn('Failed to load student information:', studentRes.status);
                }

                // Get all subjects for this class FIRST
                const classSubjectsRes = await adminClassSubjectService.getClassSubjects({
                    class_id: classId,
                    per_page: 9999,
                });

                // Get all grades for this student (not filtered by academic year/semester)
                const classSubjectIds = classSubjectsRes.success && classSubjectsRes.data 
                    ? classSubjectsRes.data.map((cs: any) => cs.id)
                    : [];
                
                const response = await adminGradeService.getGrades({
                    student_id: studentId,
                    per_page: 9999,
                });

                // Debug logging
                console.log('=== DEBUG INFO ===');
                console.log('Class ID:', classId);
                console.log('Student ID:', studentId);
                console.log('Class Subjects Response:', classSubjectsRes);
                console.log('Grades Response:', response);
                console.log('Class Data:', classData);

                if (!classSubjectsRes.success) {
                    setNotification({ 
                        type: 'error', 
                        message: classSubjectsRes.message || 'Failed to load class subjects' 
                    });
                    setGroupedGrades([]);
                    return;
                }

                const classSubjects = classSubjectsRes.data || [];
                
                if (classSubjects.length === 0) {
                    setNotification({ 
                        type: 'info', 
                        message: 'No subjects found for this class. Please link subjects to this class first.' 
                    });
                    setGroupedGrades([]);
                    return;
                }

                // Map grades to subjects by subject_id
                // Only include grades that belong to this class's class_subjects
                const gradesMap = new Map<number, Grade>();
                if (response.success && response.data && response.data.length > 0) {
                    response.data.forEach((grade: Grade) => {
                        // Only process grades that belong to this class
                        const gradeClassSubjectId = grade.class_subject_id || (grade.class_subject as any)?.id;
                        if (classSubjectIds.length > 0 && !classSubjectIds.includes(gradeClassSubjectId)) {
                            console.log(`Skipping grade with class_subject_id ${gradeClassSubjectId} (not in this class)`);
                            return;
                        }
                        
                        // Try multiple ways to get the subject_id
                        const subjectId = grade.class_subject?.subject?.id || 
                                        (grade.class_subject as any)?.subject_id ||
                                        null;
                        if (subjectId) {
                            gradesMap.set(subjectId, grade);
                            console.log(`Mapped grade for subject ${subjectId}:`, grade);
                        } else {
                            console.warn('Grade without subject_id:', grade);
                        }
                    });
                } else {
                    console.log('No grades found for this student');
                }

                console.log('Grades Map:', Array.from(gradesMap.entries()));

                // Group grades by academic_year_id and semester_id
                const gradesByPeriod = new Map<string, { academic_year_id: number; semester_id: number; academic_year_name: string; semester_name: string; grades: Map<number, Grade> }>();
                
                if (response.success && response.data && response.data.length > 0) {
                    response.data.forEach((grade: Grade) => {
                        // Only process grades that belong to this class
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
                    const gradesTable: StudentGrades[] = classSubjects.map((cs: any) => {
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

                console.log('Final grouped grades:', grouped);
                setGroupedGrades(grouped);
            }
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

    return (
        <AppLayout>
            {notification && (
                <NotificationDisplay 
                    notification={notification} 
                    onClose={() => setNotification(null)} 
                />
            )}
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-6">
                        <button
                            onClick={() => {
                                if (classId) {
                                    router.visit(`/admin/blockchain-transactions/grades/class/${classId}/students`);
                                } else {
                                    router.visit('/admin/blockchain-transactions/grades');
                                }
                            }}
                            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Students
                        </button>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                                Student Grades
                            </h1>
                            <div className="mb-4">
                                <h2 className="text-3xl font-bold text-gray-900 mb-3">{studentName}</h2>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                    <div>
                                        <span className="font-semibold">Class:</span> {className}
                                    </div>
                                    {yearLevel !== null && (
                                        <div>
                                            <span className="font-semibold">Year Level:</span> {formatYearLevel(yearLevel)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 p-6">
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                            </div>
                        </div>
                    ) : groupedGrades.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 p-6">
                            <div className="text-center py-12 text-gray-500">
                                No grades found for this student
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {groupedGrades.map((group, groupIndex) => (
                                <div key={`${group.academic_year_id}_${group.semester_id}`} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div>
                                                <span className="font-semibold text-gray-700">Academic Year:</span> 
                                                <span className="ml-2 text-gray-900">{group.academic_year_name || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700">Semester:</span> 
                                                <span className="ml-2 text-gray-900">{group.semester_name || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full border-collapse border border-gray-300">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                                                        <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">Prelim</th>
                                                        <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">Midterm</th>
                                                        <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">Final</th>
                                                        <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">Final Rating</th>
                                                        <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">Units</th>
                                                        <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.grades.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={7} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                                                No subjects found for this period
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        group.grades.map((grade, index) => (
                                                            <tr key={index} className="hover:bg-gray-50">
                                                                <td className="border border-gray-300 px-4 py-3 text-sm">
                                                                    <div>
                                                                        <div className="font-medium">{grade.subject.subject_code}</div>
                                                                        <div className="text-xs text-gray-600">{grade.subject.subject_name}</div>
                                                                    </div>
                                                                </td>
                                                                <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                                                                    {grade.prelim_grade !== null && grade.prelim_grade !== undefined ? grade.prelim_grade : ''}
                                                                </td>
                                                                <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                                                                    {grade.midterm_grade !== null && grade.midterm_grade !== undefined ? grade.midterm_grade : ''}
                                                                </td>
                                                                <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                                                                    {grade.final_grade !== null && grade.final_grade !== undefined ? grade.final_grade : ''}
                                                                </td>
                                                                <td className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">
                                                                    {grade.final_rating !== null && grade.final_rating !== undefined ? grade.final_rating : ''}
                                                                </td>
                                                                <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                                                                    {grade.units || ''}
                                                                </td>
                                                                <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                                                                    {grade.remarks ? (
                                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                            grade.remarks === 'Passed' ? 'bg-green-100 text-green-800' :
                                                                            grade.remarks === 'Failed' ? 'bg-red-100 text-red-800' :
                                                                            'bg-yellow-100 text-yellow-800'
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

export default BlockchainStudentGrades;

