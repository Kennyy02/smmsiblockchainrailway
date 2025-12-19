import React, { useState, useEffect } from 'react';
import { RefreshCw, Eye, X, Users, ChevronRight, ChevronDown } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { adminClassesService, Class, Student } from '../../../services/AdminClassesService';
import { adminGradeService, Grade } from '../../../services/AdminGradeService';

const PRIMARY_COLOR_CLASS = 'bg-gradient-to-r from-purple-600 to-indigo-600';
const TEXT_COLOR_CLASS = 'text-purple-600';

interface Notification {
    type: 'success' | 'error' | 'info';
    message: string;
}

const Notification: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
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

const StudentGradesModal: React.FC<{
    student: Student;
    classInfo: Class;
    onClose: () => void;
}> = ({ student, classInfo, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [grades, setGrades] = useState<StudentGrades[]>([]);
    const [notification, setNotification] = useState<Notification | null>(null);

    useEffect(() => {
        loadStudentGrades();
    }, []);

    const loadStudentGrades = async () => {
        setLoading(true);
        try {
            // Get all grades for this student
            const response = await adminGradeService.getGrades({
                student_id: student.id,
                academic_year_id: classInfo.academic_year_id,
                semester_id: classInfo.semester_id,
                per_page: 9999,
            });

            if (response.success && response.data) {
                // Get all subjects for this class
                const classSubjectsRes = await fetch(`/api/class-subjects?class_id=${classInfo.id}&per_page=9999`);
                const classSubjectsData = await classSubjectsRes.json();

                // Map grades to subjects
                const gradesMap = new Map<number, Grade>();
                response.data.forEach((grade: Grade) => {
                    gradesMap.set(grade.class_subject.subject.id, grade);
                });

                // Create the grades table structure
                const gradesTable: StudentGrades[] = (classSubjectsData.data?.data || []).map((cs: any) => {
                    const grade = gradesMap.get(cs.subject.id);
                    return {
                        subject: cs.subject,
                        prelim_grade: grade?.prelim_grade || null,
                        midterm_grade: grade?.midterm_grade || null,
                        final_grade: grade?.final_grade || null,
                        final_rating: grade?.final_rating || null,
                        remarks: grade?.remarks || null,
                        units: cs.subject.units || 0,
                    };
                });

                setGrades(gradesTable);
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to load grades' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Student Grades</h2>
                                <p className="text-sm text-white/90 mt-1">{student.full_name} - {classInfo.class_code}</p>
                            </div>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                            </div>
                        ) : (
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
                                        {grades.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                                    No subjects found for this class
                                                </td>
                                            </tr>
                                        ) : (
                                            grades.map((grade, index) => (
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
                        )}
                    </div>
                </div>
            </div>

            {notification && (
                <Notification
                    notification={notification}
                    onClose={() => setNotification(null)}
                />
            )}
        </div>
    );
};

const BlockchainGrades: React.FC = () => {
    const [notification, setNotification] = useState<Notification | null>(null);
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState<Class[]>([]);
    const [expandedClassId, setExpandedClassId] = useState<number | null>(null);
    const [students, setStudents] = useState<Map<number, Student[]>>(new Map());
    const [loadingStudents, setLoadingStudents] = useState<Set<number>>(new Set());
    const [selectedStudent, setSelectedStudent] = useState<{ student: Student; classInfo: Class } | null>(null);

    const loadClasses = async () => {
        setLoading(true);
        try {
            const response = await adminClassesService.getClasses({ per_page: 9999 });
            if (response.success) {
                setClasses(response.data || []);
            } else {
                setNotification({ type: 'error', message: response.message || 'Failed to load classes' });
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to load classes' });
        } finally {
            setLoading(false);
        }
    };

    const loadStudentsForClass = async (classId: number) => {
        if (students.has(classId)) {
            // Already loaded, just toggle
            setExpandedClassId(expandedClassId === classId ? null : classId);
            return;
        }

        setLoadingStudents(new Set([...loadingStudents, classId]));
        try {
            const response = await adminClassesService.getClassStudents(classId);
            if (response.success) {
                setStudents(new Map(students.set(classId, response.data || [])));
                setExpandedClassId(classId);
            } else {
                setNotification({ type: 'error', message: response.message || 'Failed to load students' });
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to load students' });
        } finally {
            const newSet = new Set(loadingStudents);
            newSet.delete(classId);
            setLoadingStudents(newSet);
        }
    };

    useEffect(() => {
        loadClasses();
    }, []);

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                    Blockchain Grades
                                </h1>
                                <p className="text-gray-600">View student grades by class</p>
                            </div>
                            <button
                                onClick={loadClasses}
                                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                            </div>
                        ) : classes.length === 0 ? (
                            <div className="px-6 py-12 text-center text-gray-500">
                                No classes found
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {classes.map((classItem) => {
                                    const isExpanded = expandedClassId === classItem.id;
                                    const classStudents = students.get(classItem.id) || [];
                                    const isLoading = loadingStudents.has(classItem.id);

                                    return (
                                        <div key={classItem.id} className="p-6 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900">{classItem.class_code}</h3>
                                                    <p className="text-sm text-gray-600 mt-1">{classItem.class_name}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {classItem.student_count || 0} students
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => loadStudentsForClass(classItem.id)}
                                                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                                >
                                                    {isLoading ? (
                                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Users className="w-4 h-4 mr-2" />
                                                            View Students
                                                        </>
                                                    )}
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-4 h-4 ml-2" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 ml-2" />
                                                    )}
                                                </button>
                                            </div>

                                            {isExpanded && (
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    {isLoading ? (
                                                        <div className="flex items-center justify-center py-8">
                                                            <RefreshCw className={`h-6 w-6 ${TEXT_COLOR_CLASS} animate-spin`} />
                                                        </div>
                                                    ) : classStudents.length === 0 ? (
                                                        <p className="text-center text-gray-500 py-8">No students found in this class</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {classStudents.map((student) => (
                                                                <div
                                                                    key={student.id}
                                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                                >
                                                                    <div>
                                                                        <p className="font-medium text-gray-900">{student.full_name}</p>
                                                                        <p className="text-sm text-gray-600">{student.student_id}</p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setSelectedStudent({ student, classInfo: classItem })}
                                                                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                                                    >
                                                                        <Eye className="w-4 h-4 mr-1.5" />
                                                                        View Grades
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {selectedStudent && (
                        <StudentGradesModal
                            student={selectedStudent.student}
                            classInfo={selectedStudent.classInfo}
                            onClose={() => setSelectedStudent(null)}
                        />
                    )}

                    {notification && (
                        <Notification
                            notification={notification}
                            onClose={() => setNotification(null)}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default BlockchainGrades;
