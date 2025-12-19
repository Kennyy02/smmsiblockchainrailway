import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Link, usePage, router } from '@inertiajs/react';
import { adminGradeService, Grade } from '../../../services/AdminGradeService';
import { adminClassSubjectService } from '../../../services/AdminClassSubjectService';

const PRIMARY_COLOR_CLASS = 'bg-gradient-to-r from-purple-600 to-indigo-600';
const TEXT_COLOR_CLASS = 'text-purple-600';

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

const BlockchainStudentGrades: React.FC = () => {
    const { props } = usePage();
    const studentId = (props as any).studentId;
    const classId = (props as any).classId;
    
    const [loading, setLoading] = useState(true);
    const [grades, setGrades] = useState<StudentGrades[]>([]);
    const [studentName, setStudentName] = useState('');
    const [className, setClassName] = useState('');
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
            const classRes = await fetch(`/api/classes/${classId}`);
            const classData = await classRes.json();
            
            if (classData.success) {
                setClassName(classData.data.class_code || classData.data.class_name);
                
                // Get student information
                const studentRes = await fetch(`/api/students/${studentId}`);
                const studentData = await studentRes.json();
                
                if (studentData.success) {
                    setStudentName(studentData.data.full_name || `${studentData.data.first_name} ${studentData.data.last_name}`);
                }

                // Get all grades for this student
                const response = await adminGradeService.getGrades({
                    student_id: studentId,
                    academic_year_id: classData.data.academic_year_id,
                    semester_id: classData.data.semester_id,
                    per_page: 9999,
                });

                // Get all subjects for this class
                const classSubjectsRes = await adminClassSubjectService.getClassSubjects({
                    class_id: classId,
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
                    setGrades([]);
                    return;
                }

                const classSubjects = classSubjectsRes.data || [];
                
                if (classSubjects.length === 0) {
                    setNotification({ 
                        type: 'info', 
                        message: 'No subjects found for this class. Please link subjects to this class first.' 
                    });
                    setGrades([]);
                    return;
                }

                // Map grades to subjects by subject_id
                const gradesMap = new Map<number, Grade>();
                if (response.success && response.data && response.data.length > 0) {
                    response.data.forEach((grade: Grade) => {
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

                // Create the grades table structure
                const gradesTable: StudentGrades[] = classSubjects.map((cs: any) => {
                    const subjectId = cs.subject?.id || cs.subject_id;
                    const grade = gradesMap.get(subjectId);
                    
                    console.log(`Processing subject ${subjectId}, found grade:`, grade ? 'Yes' : 'No');
                    
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

                console.log('Final grades table:', gradesTable);
                setGrades(gradesTable);
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to load grades' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-6">
                        <button
                            onClick={() => router.visit('/admin/blockchain-transactions/grades')}
                            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Grades
                        </button>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                Student Grades
                            </h1>
                            <p className="text-gray-600">{studentName} - {className}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="p-6">
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
            </div>
        </AppLayout>
    );
};

export default BlockchainStudentGrades;

