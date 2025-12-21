import React, { useState, useEffect } from 'react';
import { 
    Award, 
    Plus, 
    Search, 
    Filter, 
    Edit, 
    X, 
    RefreshCw, 
    BarChart, 
    Hash, 
    TrendingUp, 
    TrendingDown, 
    ClipboardList,
    Save,
    AlertCircle
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useTeacherAuth } from '../../../services/useTeacherAuth';
import { 
    adminGradeService, 
    Grade, 
    GradeFormData, 
    GradeStats, 
    GradesResponse, 
    ApiResponse,
    MinimalClassSubject,
    MinimalStudent,
    GradeRemarks,
    AcademicYearOption,  
    SemesterOption,      
    GradeFilters 
} from '../../../services/AdminGradeService'; 
import { adminClassSubjectService } from '../../../services/AdminClassSubjectService';
import { adminClassesService } from '../../../services/AdminClassesService';
import { adminTeacherService } from '../../../services/AdminTeacherService';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]';

// ========================================================================
// 📦 INTERFACES & UTILS
// ========================================================================

interface Notification {
    type: 'success' | 'error';
    message: string;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface LocalFilters {
    search: string;
    class_subject_id: string; 
    academic_year_id: string; 
    semester_id: string;
    remarks: string;
    page: number;
    per_page: number;
}

const Notification: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
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
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => {
    const displayValue = (typeof value === 'number' && isNaN(value)) ? 'N/A' : value;
    const bgColor = color.replace('text-', 'bg-').replace('-600', '-100').replace('[#003366]', '[#003366]/10');
    
    return (
        <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-white">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-white mb-1">{title}</p>
                    <p className={`text-3xl font-bold ${color}`}>{displayValue}</p>
                </div>
                <div className={`${bgColor} p-3 rounded-xl`}>
                    <Icon className={`h-8 w-8 ${color}`} />
                </div>
            </div>
        </div>
    );
};

const renderRemarksTag = (remarks: GradeRemarks | undefined) => {
    if (!remarks) {
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 dark:border-white dark:text-white text-gray-600 dark:text-white border dark:border-white`}>
                N/A
            </span>
        );
    }

    let color = 'bg-gray-100 dark:bg-gray-800 dark:border-white dark:text-white text-gray-600 dark:text-white border dark:border-white';
    if (remarks === 'Passed') color = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-white dark:border-white border dark:border-white';
    else if (remarks === 'Failed') color = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-white dark:border-white border dark:border-white';
    else if (remarks === 'Incomplete') color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-white dark:border-white border dark:border-white';

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
            {remarks}
        </span>
    );
};

// ========================================================================
// 📝 GRADE MODAL (FULL IMPLEMENTATION with Duplication Check)
// ========================================================================

interface GradeModalProps {
    grade: Grade | null;
    onClose: () => void;
    onSave: (data: GradeFormData) => Promise<void>;
    errors: Record<string, string[]>;
    classSubjects: MinimalClassSubject[];
    students: MinimalStudent[];
    academicYears: AcademicYearOption[];
    semesters: SemesterOption[];
    loadingLists: boolean;
    allGrades: Grade[];
}

const GradeModal: React.FC<{
    grade: Grade | null;
    onClose: () => void;
    onSave: (data: GradeFormData) => Promise<void>;
    errors: Record<string, string[]>;
    classSubjects: MinimalClassSubject[];
    students: MinimalStudent[];
    academicYears: AcademicYearOption[];
    semesters: SemesterOption[];
    loadingLists: boolean;
    allGrades: Grade[];
}> = ({ 
    grade, 
    onClose, 
    onSave, 
    errors, 
    classSubjects, 
    students,
    academicYears,
    semesters,
    loadingLists,
    allGrades
}) => {
    const isEditing = !!grade;

    // ✅ FIX 1: Initialize with proper defaults AFTER data loads
    const getInitialFormData = (): GradeFormData => {
        if (grade) {
            // Editing existing grade
            return {
                class_subject_id: grade.class_subject_id,
                student_id: grade.student_id,
                academic_year_id: grade.academic_year_id,
                semester_id: grade.semester_id,
                prelim_grade: grade.prelim_grade ?? undefined,
                midterm_grade: grade.midterm_grade ?? undefined,
                final_grade: grade.final_grade ?? undefined,
                final_rating: grade.final_rating ?? undefined,
                remarks: grade.remarks || 'Passed',
            };
        } else {
            // Creating new grade - use first available options
            return {
                class_subject_id: classSubjects.length > 0 ? classSubjects[0].id : 0,
                student_id: students.length > 0 ? students[0].id : 0,
                academic_year_id: academicYears.length > 0 ? academicYears[0].id : 0,
                semester_id: semesters.length > 0 ? semesters[0].id : 0,
                prelim_grade: undefined,
                midterm_grade: undefined,
                final_grade: undefined,
                final_rating: undefined,
                remarks: 'Passed',
            };
        }
    };

    const [formData, setFormData] = useState<GradeFormData>(getInitialFormData());
    const [loading, setLoading] = useState(false);
    const [isDuplicateError, setIsDuplicateError] = useState(false);
    const [filteredStudents, setFilteredStudents] = useState<MinimalStudent[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Auto-calculate Final Rating when Prelim, Midterm, or Final grades change
    useEffect(() => {
        const prelim = formData.prelim_grade;
        const midterm = formData.midterm_grade;
        const final = formData.final_grade;

        // Calculate average if all three grades are present
        if (prelim !== undefined && prelim !== null && 
            midterm !== undefined && midterm !== null && 
            final !== undefined && final !== null) {
            // Ensure values are numbers and calculate average
            const prelimNum = Number(prelim);
            const midtermNum = Number(midterm);
            const finalNum = Number(final);
            const sum = prelimNum + midtermNum + finalNum;
            const average = sum / 3;
            const roundedAverage = Math.round(average * 100) / 100; // Round to 2 decimal places
            
            // Update final_rating with the calculated value
            setFormData(prev => {
                // Only update if the value actually changed to avoid unnecessary re-renders
                if (prev.final_rating !== roundedAverage) {
                    return {
                        ...prev,
                        final_rating: roundedAverage
                    };
                }
                return prev;
            });
        } else {
            // If any grade is missing, clear final_rating
            setFormData(prev => {
                if (prev.final_rating !== undefined) {
                    return {
                        ...prev,
                        final_rating: undefined
                    };
                }
                return prev;
            });
        }
    }, [formData.prelim_grade, formData.midterm_grade, formData.final_grade]);

    // Load students for the selected class when class_subject_id changes
    useEffect(() => {
        const loadStudentsForClass = async () => {
            // Always clear students first
            setFilteredStudents([]);
            
            if (!formData.class_subject_id || formData.class_subject_id === 0) {
                return;
            }

            // Wait for classSubjects to be loaded
            if (loadingLists) {
                return;
            }

            if (classSubjects.length === 0) {
                return;
            }

            const selectedClassSubject = classSubjects.find(cs => cs.id === formData.class_subject_id);
            
            if (!selectedClassSubject) {
                setFilteredStudents([]);
                return;
            }

            // Get class_id - try class_id first, then fallback to class.id
            const classId = selectedClassSubject.class_id || selectedClassSubject.class?.id;
            
            if (!classId) {
                setFilteredStudents([]);
                return;
            }

            setLoadingStudents(true);
            try {
                const response = await adminGradeService.getStudentsMinimal(classId);
                
                if (response.success) {
                    const studentsList = response.data || [];
                    setFilteredStudents(studentsList);
                    
                    // If editing and current student is not in filtered list, keep it
                    // If creating new grade, reset student_id
                    if (!grade) {
                        setFormData(prev => ({
                            ...prev,
                            student_id: studentsList.length > 0 ? studentsList[0].id : 0
                        }));
                    } else {
                        // When editing, check if current student is in the filtered list
                        const currentStudentExists = studentsList.some(s => s.id === formData.student_id);
                        if (!currentStudentExists && studentsList.length > 0) {
                            setFormData(prev => ({
                                ...prev,
                                student_id: studentsList[0].id
                            }));
                        }
                    }
                } else {
                    setFilteredStudents([]);
                }
            } catch (error) {
                console.error('Error loading students for class:', error);
                setFilteredStudents([]);
            } finally {
                setLoadingStudents(false);
            }
        };

        loadStudentsForClass();
    }, [formData.class_subject_id, classSubjects, loadingLists, grade]);

    // ✅ FIX 2: Update form data when dropdown data loads
    useEffect(() => {
        if (!isEditing && !loadingLists) {
            // Only update if we have valid data and IDs are still 0
            if (classSubjects.length > 0 && formData.class_subject_id === 0) {
                setFormData(prev => ({
                    ...prev,
                    class_subject_id: classSubjects[0].id
                }));
            }
            if (academicYears.length > 0 && formData.academic_year_id === 0) {
                setFormData(prev => ({
                    ...prev,
                    academic_year_id: academicYears[0].id
                }));
            }
            if (semesters.length > 0 && formData.semester_id === 0) {
                setFormData(prev => ({
                    ...prev,
                    semester_id: semesters[0].id
                }));
            }
        }
    }, [classSubjects, academicYears, semesters, loadingLists, isEditing, formData]);

    // Check for duplicates
    useEffect(() => {
        if (isEditing) {
            setIsDuplicateError(false);
            return;
        }

        const duplicate = allGrades.find(g => 
            g.class_subject_id === formData.class_subject_id &&
            g.student_id === formData.student_id &&
            g.academic_year_id === formData.academic_year_id &&
            g.semester_id === formData.semester_id
        );

        setIsDuplicateError(!!duplicate);
    }, [formData.class_subject_id, formData.student_id, formData.academic_year_id, formData.semester_id, allGrades, isEditing]);

    // ✅ FIX 3: Validate before submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate all IDs are set
        if (formData.class_subject_id === 0) {
            alert('⚠️ Please select a class & subject');
            return;
        }
        if (formData.student_id === 0) {
            alert('⚠️ Please select a student');
            return;
        }
        if (formData.academic_year_id === 0) {
            alert('⚠️ Please select an academic year');
            return;
        }
        if (formData.semester_id === 0) {
            alert('⚠️ Please select a semester');
            return;
        }
        
        if (isDuplicateError) {
            alert('⚠️ A grade record already exists for this student in this subject/semester.');
            return;
        }

        setLoading(true);
        try {
            // Log what we're sending
            console.log('📤 Submitting grade data:', formData);
            
            await onSave(formData);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // When class_subject_id changes, reset student_id and clear filtered students immediately
        if (name === 'class_subject_id') {
            const newClassSubjectId = parseInt(value) || 0;
            
            // Immediately clear filtered students
            setFilteredStudents([]);
            setFormData(prev => ({ 
                ...prev, 
                [name]: newClassSubjectId,
                student_id: 0 // Reset student selection when class changes
            }));
            return;
        }
        
        if (name === 'prelim_grade' || name === 'midterm_grade' || name === 'final_grade' || name === 'final_rating') {
            setFormData(prev => ({ 
                ...prev, 
                [name]: value === '' ? undefined : parseFloat(value)
            }));
        } else if (name === 'student_id' || name === 'academic_year_id' || name === 'semester_id') {
            setFormData(prev => ({ 
                ...prev, 
                [name]: parseInt(value) 
            }));
        } else {
            setFormData(prev => ({ 
                ...prev, 
                [name]: value 
            }));
        }
    };

    // ✅ FIX 4: Check if we have all required data
    const hasRequiredData = classSubjects.length > 0 && 
                           students.length > 0 && 
                           academicYears.length > 0 && 
                           semesters.length > 0;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 dark:border-white shadow-2xl transition-all border dark:border-white">
                    <div className="bg-[#003366] px-6 py-4">
                        <h2 className="text-xl font-bold text-white">
                            {isEditing ? 'Edit Grade' : 'Add New Grade'}
                        </h2>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6">
                        {/* ✅ LOADING STATE */}
                        {loadingLists && (
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-center">
                                    <RefreshCw className="h-4 w-4 text-blue-600 mr-2 animate-spin" />
                                    <p className="text-sm text-blue-700">
                                        Loading form data (class subjects, students, academic years, semesters)...
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ✅ NO DATA WARNING */}
                        {!loadingLists && !hasRequiredData && (
                            <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl">
                                <div className="flex items-start">
                                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-yellow-800">
                                            ⚠️ Missing Required Data
                                        </p>
                                        <p className="text-xs text-yellow-700 mt-1">
                                            Cannot create grade without:
                                        </p>
                                        <ul className="text-xs text-yellow-700 mt-1 ml-4 list-disc">
                                            {classSubjects.length === 0 && <li>Class Subjects (you may not be assigned to any classes)</li>}
                                            {students.length === 0 && <li>Students</li>}
                                            {academicYears.length === 0 && <li>Academic Years</li>}
                                            {semesters.length === 0 && <li>Semesters</li>}
                                        </ul>
                                        <button
                                            type="button"
                                            onClick={() => window.location.reload()}
                                            className="mt-2 px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition"
                                        >
                                            Reload Page
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                   

                        {/* ✅ FORM FIELDS - Only show if data is loaded */}
                        {!loadingLists && (
                            <div className="grid grid-cols-2 gap-4">
                                {/* Student */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                                        Student *
                                    </label>
                                    <select
                                        key={`student-select-${formData.class_subject_id}-${filteredStudents.length}`}
                                        name="student_id"
                                        value={formData.student_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                                        disabled={isEditing || loadingStudents || !formData.class_subject_id || formData.class_subject_id === 0}
                                        required
                                    >
                                        <option value={0} disabled>
                                            {loadingStudents 
                                                ? 'Loading students...' 
                                                : !formData.class_subject_id || formData.class_subject_id === 0
                                                ? 'Select Class & Subject first'
                                                : filteredStudents.length === 0
                                                ? 'No students in this class'
                                                : 'Select Student'}
                                        </option>
                                        {/* Only show filteredStudents - students filtered by class */}
                                        {filteredStudents.map(student => (
                                            <option key={student.id} value={student.id}>
                                                {student.full_name} ({student.student_id})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.student_id && <p className="mt-1 text-sm text-red-600">{errors.student_id[0]}</p>}
                                    {formData.class_subject_id && formData.class_subject_id !== 0 && filteredStudents.length === 0 && !loadingStudents && (
                                        <p className="text-yellow-600 text-xs mt-1">No students enrolled in this class</p>
                                    )}
                                </div>

                                {/* Class/Subject */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                                        Class & Subject *
                                    </label>
                                    <select
                                        name="class_subject_id"
                                        value={formData.class_subject_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                                        disabled={isEditing || classSubjects.length === 0}
                                        required
                                    >
                                        {classSubjects.length === 0 ? (
                                            <option value="0">No subjects available</option>
                                        ) : (
                                            classSubjects.map(cs => (
                                                <option key={cs.id} value={cs.id}>
                                                    {cs.class?.class_code || cs.class?.class_name || 'Unknown'} - {cs.subject?.subject_code || cs.subject?.subject_name || 'Unknown'}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {errors.class_subject_id && <p className="mt-1 text-sm text-red-600">{errors.class_subject_id[0]}</p>}
                                </div>

                                {/* Academic Year */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                                        Academic Year *
                                    </label>
                                    <select
                                        name="academic_year_id"
                                        value={formData.academic_year_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                                        disabled={isEditing || academicYears.length === 0}
                                        required
                                    >
                                        {academicYears.length === 0 ? (
                                            <option value="0">No academic years available</option>
                                        ) : (
                                            academicYears.map(ay => (
                                                <option key={ay.id} value={ay.id}>
                                                    {ay.year_name} {ay.is_current ? '(Current)' : ''}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {errors.academic_year_id && <p className="mt-1 text-sm text-red-600">{errors.academic_year_id[0]}</p>}
                                </div>

                                {/* Semester */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                                        Semester *
                                    </label>
                                    <select
                                        name="semester_id"
                                        value={formData.semester_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                                        disabled={isEditing || semesters.length === 0}
                                        required
                                    >
                                        {semesters.length === 0 ? (
                                            <option value="0">No semesters available</option>
                                        ) : (
                                            semesters.map(sem => (
                                                <option key={sem.id} value={sem.id}>
                                                    {sem.semester_name} {sem.is_current ? '(Current)' : ''}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {errors.semester_id && <p className="mt-1 text-sm text-red-600">{errors.semester_id[0]}</p>}
                                </div>

                                {/* Prelim Grade */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                                        Prelim Grade (0-100)
                                    </label>
                                    <input
                                        type="number"
                                        name="prelim_grade"
                                        value={formData.prelim_grade ?? ''}
                                        onChange={handleChange}
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                                    />
                                    {errors.prelim_grade && <p className="mt-1 text-sm text-red-600">{errors.prelim_grade[0]}</p>}
                                </div>

                                {/* Midterm Grade */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                                        Midterm Grade (0-100)
                                    </label>
                                    <input
                                        type="number"
                                        name="midterm_grade"
                                        value={formData.midterm_grade ?? ''}
                                        onChange={handleChange}
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                                    />
                                    {errors.midterm_grade && <p className="mt-1 text-sm text-red-600">{errors.midterm_grade[0]}</p>}
                                </div>

                                {/* Final Grade */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                                        Final Grade (0-100)
                                    </label>
                                    <input
                                        type="number"
                                        name="final_grade"
                                        value={formData.final_grade ?? ''}
                                        onChange={handleChange}
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                                    />
                                    {errors.final_grade && <p className="mt-1 text-sm text-red-600">{errors.final_grade[0]}</p>}
                                </div>

                                {/* Final Rating - Auto-calculated */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                                        Final Rating (0-100) <span className="text-xs text-gray-500">(Auto-calculated)</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="final_rating"
                                        value={formData.final_rating ?? ''}
                                        readOnly
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-white cursor-not-allowed transition-all"
                                        title="Final Rating is automatically calculated as the average of Prelim, Midterm, and Final grades"
                                    />
                                    {errors.final_rating && <p className="mt-1 text-sm text-red-600">{errors.final_rating[0]}</p>}
                                    {formData.prelim_grade !== undefined && formData.midterm_grade !== undefined && formData.final_grade !== undefined && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-white dark:border-white">
                                            ({formData.prelim_grade} + {formData.midterm_grade} + {formData.final_grade}) ÷ 3 = {formData.final_rating != null ? Number(formData.final_rating).toFixed(2) : 'N/A'}
                                        </p>
                                    )}
                                </div>

                                {/* Remarks */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                                        Remarks *
                                    </label>
                                    <select
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                                        required
                                    >
                                        <option value="Passed">Passed</option>
                                        <option value="Failed">Failed</option>
                                        <option value="Incomplete">Incomplete</option>
                                    </select>
                                    {errors.remarks && <p className="mt-1 text-sm text-red-600">{errors.remarks[0]}</p>}
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border border-gray-300 dark:border-white rounded-xl text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-[#003366] text-white rounded-xl hover:bg-[#002244] transition-all font-medium shadow-lg disabled:opacity-50"
                                disabled={loading || loadingLists || !hasRequiredData || isDuplicateError}
                            >
                                {loading ? 'Saving...' : (isEditing ? 'Update Grade' : 'Add Grade')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 📊 MAIN GRADES COMPONENT
// ========================================================================

const Grades: React.FC = () => {
    // ✅ DYNAMIC: Get current teacher ID from auth
    const { currentTeacherId, isTeacher, user } = useTeacherAuth();
    
    const [grades, setGrades] = useState<Grade[]>([]);
    const [stats, setStats] = useState<GradeStats | null>(null);
    const [classSubjects, setClassSubjects] = useState<MinimalClassSubject[]>([]);
    const [students, setStudents] = useState<MinimalStudent[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
    const [semesters, setSemesters] = useState<SemesterOption[]>([]);
    const [loadingLists, setLoadingLists] = useState(true);
    
    const [filters, setFilters] = useState<LocalFilters>({
        search: '',
        class_subject_id: '',
        academic_year_id: '',
        semester_id: '',
        remarks: '',
        page: 1,
        per_page: 10,
    });
    
    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });
    
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    
    // Class selection state
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [rawClasses, setRawClasses] = useState<Array<{ id: number; class_code: string; class_name: string }>>([]);
    const [classes, setClasses] = useState<Array<{ id: number; class_code: string; class_name: string; subjectCount: number }>>([]);
    const [classStudents, setClassStudents] = useState<MinimalStudent[]>([]);
    const [loadingClassStudents, setLoadingClassStudents] = useState(false);
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    
    // Grid editing state
    const [gridData, setGridData] = useState<Record<string, {
        prelim_grade?: number;
        midterm_grade?: number;
        final_grade?: number;
        final_rating?: number;
        remarks?: GradeRemarks;
        gradeId?: number;
    }>>({});
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // ========================================================================
    // 📡 DATA FETCHING
    // ========================================================================

    const fetchGrades = async () => {
        if (!currentTeacherId) return;
        
        setLoading(true);
        try {
            const queryParams: GradeFilters = {
                page: filters.page,
                per_page: filters.per_page,
                search: filters.search || undefined,
                class_subject_id: filters.class_subject_id ? parseInt(filters.class_subject_id) : undefined,
                academic_year_id: filters.academic_year_id ? parseInt(filters.academic_year_id) : undefined,
                semester_id: filters.semester_id ? parseInt(filters.semester_id) : undefined,
                remarks: filters.remarks as GradeRemarks || undefined,
                teacher_id: currentTeacherId, // ✅ Use dynamic teacher ID
            };

            const response = await adminGradeService.getGrades(queryParams);
            
            if (response.success && Array.isArray(response.data)) {
                setGrades(response.data);
                if ('pagination' in response && response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Failed to fetch grades:', error);
            setNotification({ type: 'error', message: 'Failed to load grades.' });
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        if (!currentTeacherId) return;
        
        try {
            // ✅ Pass teacher ID to get stats for this teacher only
            const response = await adminGradeService.getGradeStats({ 
                teacher_id: currentTeacherId 
            });
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

const fetchDropdownLists = async () => {
    if (!currentTeacherId) {
        console.warn('⚠️ No teacher ID available');
        return;
    }
    
    setLoadingLists(true);
    try {
        
        let classSubjectsData: MinimalClassSubject[] = [];
        let studentsData: MinimalStudent[] = [];
        let academicYearsData: AcademicYearOption[] = [];
        let semestersData: SemesterOption[] = [];
        
        // ===========================================================
        // METHOD 1: Try combined getAllDropdownOptions (BEST)
        // ===========================================================
        try {
            const response = await adminGradeService.getAllDropdownOptions(currentTeacherId);
          
            
            if (response.classSubjects && response.classSubjects.length > 0) {
                classSubjectsData = response.classSubjects;
                
                // Filter students to only those from teacher's assigned classes
                const classIds = [...new Set(classSubjectsData.map((cs: any) => 
                    cs.class?.id || cs.class_id || (cs.class as any)?.id
                ).filter(Boolean))];
                
                if (classIds.length > 0) {
                    const studentPromises = classIds.map(async (classId: number) => {
                        try {
                            const classStudentsRes = await adminClassesService.getClassStudents(classId, { per_page: 9999 });
                            return classStudentsRes.success ? (classStudentsRes.data || []) : [];
                        } catch (error) {
                            console.warn(`Failed to fetch students for class ${classId}:`, error);
                            return [];
                        }
                    });
                    
                    const studentsArrays = await Promise.all(studentPromises);
                    const allStudents = studentsArrays.flat();
                    const uniqueStudents = Array.from(
                        new Map(allStudents.map((s: any) => [s.id, s])).values()
                    );
                    studentsData = uniqueStudents;
                } else {
                    studentsData = [];
                }
                
                academicYearsData = response.academicYears || [];
                semestersData = response.semesters || [];
                console.log('✅ Method 1 SUCCESS:', classSubjectsData.length, 'subjects', studentsData.length, 'students');
            }
        } catch (error) {
            console.warn('⚠️ Method 1 failed:', error);
        }
        
        // ===========================================================
        // METHOD 2: Individual API calls (FALLBACK)
        // ===========================================================
        if (classSubjectsData.length === 0) {
            try {
                const [csRes, ayRes, semRes] = await Promise.all([
                    adminGradeService.getClassSubjectsMinimal(currentTeacherId),
                    adminGradeService.getAcademicYears(),
                    adminGradeService.getSemesters()
                ]);
                
                if (csRes.data && csRes.data.length > 0) {
                    classSubjectsData = csRes.data;
                    
                    // Filter students to only those from teacher's assigned classes
                    const classIds = [...new Set(classSubjectsData.map((cs: any) => 
                        cs.class?.id || cs.class_id || (cs.class as any)?.id
                    ).filter(Boolean))];
                    
                    if (classIds.length > 0) {
                        const studentPromises = classIds.map(async (classId: number) => {
                            try {
                                const classStudentsRes = await adminClassesService.getClassStudents(classId, { per_page: 9999 });
                                return classStudentsRes.success ? (classStudentsRes.data || []) : [];
                            } catch (error) {
                                console.warn(`Failed to fetch students for class ${classId}:`, error);
                                return [];
                            }
                        });
                        
                        const studentsArrays = await Promise.all(studentPromises);
                        const allStudents = studentsArrays.flat();
                        const uniqueStudents = Array.from(
                            new Map(allStudents.map((s: any) => [s.id, s])).values()
                        );
                        studentsData = uniqueStudents;
                    } else {
                        studentsData = [];
                    }
                    
                    academicYearsData = ayRes.data || [];
                    semestersData = semRes.data || [];
                }
            } catch (error) {
                console.warn('⚠️ Method 2 failed:', error);
            }
        }
        
        // ===========================================================
        // METHOD 3: Get all, filter client-side (FALLBACK)
        // ===========================================================
        if (classSubjectsData.length === 0) {
            try {
                const allRes = await adminClassSubjectService.getClassSubjects({
                    per_page: 999
                });
                
                if (allRes.success && allRes.data) {
                    const all = Array.isArray(allRes.data) ? allRes.data : [];
                    classSubjectsData = all
                        .filter((cs: any) => cs.teacher_id === currentTeacherId)
                        .map((cs: any) => ({
                            id: cs.id,
                            class: cs.class,
                            subject: cs.subject,
                            teacher_id: cs.teacher_id
                        }));
                    
                    // Get students from teacher's assigned classes only
                    const classIds = [...new Set(classSubjectsData.map((cs: any) => 
                        cs.class?.id || cs.class_id || (cs.class as any)?.id
                    ).filter(Boolean))];
                    
                    if (classIds.length > 0) {
                        // Fetch students from each class
                        const studentPromises = classIds.map(async (classId: number) => {
                            try {
                                const classStudentsRes = await adminClassesService.getClassStudents(classId, { per_page: 9999 });
                                return classStudentsRes.success ? (classStudentsRes.data || []) : [];
                            } catch (error) {
                                console.warn(`Failed to fetch students for class ${classId}:`, error);
                                return [];
                            }
                        });
                        
                        const studentsArrays = await Promise.all(studentPromises);
                        // Flatten and deduplicate students
                        const allStudents = studentsArrays.flat();
                        const uniqueStudents = Array.from(
                            new Map(allStudents.map((s: any) => [s.id, s])).values()
                        );
                        studentsData = uniqueStudents;
                    } else {
                        studentsData = [];
                    }
                    
                    // Get other dropdowns
                    const [ayRes, semRes] = await Promise.all([
                        adminGradeService.getAcademicYears(),
                        adminGradeService.getSemesters()
                    ]);
                    academicYearsData = ayRes.data || [];
                    semestersData = semRes.data || [];
                }
            } catch (error) {
                console.warn('⚠️ Method 3 failed:', error);
            }
        }
        
        // ===========================================================
        // METHOD 4: Show ALL (TESTING ONLY)
        // ===========================================================
        if (classSubjectsData.length === 0) {
            try {
                const allRes = await adminClassSubjectService.getClassSubjects({
                    per_page: 999
                });
                
                if (allRes.success && allRes.data) {
                    classSubjectsData = (Array.isArray(allRes.data) ? allRes.data : []).map((cs: any) => ({
                        id: cs.id,
                        class: cs.class,
                        subject: cs.subject,
                        teacher_id: cs.teacher_id
                    }));
                    
                    console.warn('⚠️ TESTING MODE: Showing ALL', classSubjectsData.length, 'subjects');
                    
                    // Filter students to only those from teacher's assigned classes
                    const classIds = [...new Set(classSubjectsData.map((cs: any) => 
                        cs.class?.id || cs.class_id || (cs.class as any)?.id
                    ).filter(Boolean))];
                    
                    if (classIds.length > 0) {
                        const studentPromises = classIds.map(async (classId: number) => {
                            try {
                                const classStudentsRes = await adminClassesService.getClassStudents(classId, { per_page: 9999 });
                                return classStudentsRes.success ? (classStudentsRes.data || []) : [];
                            } catch (error) {
                                console.warn(`Failed to fetch students for class ${classId}:`, error);
                                return [];
                            }
                        });
                        
                        const studentsArrays = await Promise.all(studentPromises);
                        const allStudents = studentsArrays.flat();
                        const uniqueStudents = Array.from(
                            new Map(allStudents.map((s: any) => [s.id, s])).values()
                        );
                        studentsData = uniqueStudents;
                    } else {
                        studentsData = [];
                    }
                    
                    const [ayRes, semRes] = await Promise.all([
                        adminGradeService.getAcademicYears(),
                        adminGradeService.getSemesters()
                    ]);
                    academicYearsData = ayRes.data || [];
                    semestersData = semRes.data || [];
                }
            } catch (error) {
                console.error('❌ Method 4 failed:', error);
            }
        }
        
        // Set all data
        setClassSubjects(classSubjectsData);
        setStudents(studentsData);
        setAcademicYears(academicYearsData);
        setSemesters(semestersData);
        

       
        
        if (classSubjectsData.length === 0) {
            console.error('❌ NO CLASS SUBJECTS FOUND!');
            console.log('💡 FIX: UPDATE class_subjects SET teacher_id =', currentTeacherId, 'WHERE id IN (1,2,3);');
        } else {
           
            console.table(classSubjectsData.slice(0, 3).map((cs: any) => ({
                id: cs.id,
                class: cs.class?.class_code,
                subject: cs.subject?.subject_code
            })));
        }
        
    } catch (error) {
        console.error('❌ FATAL ERROR:', error);
        setClassSubjects([]);
        setStudents([]);
        setAcademicYears([]);
        setSemesters([]);
    } finally {
        setLoadingLists(false);
    }
};
    const fetchClasses = async () => {
        if (!currentTeacherId) {
            console.warn('⚠️ [GRADES] No teacher ID available for fetching classes');
            return;
        }
        
        try {
            console.log('🔍 [GRADES] Fetching classes for teacher ID:', currentTeacherId);
            const response = await adminTeacherService.getTeacherClasses(currentTeacherId);
            
            if (response.success && Array.isArray(response.data)) {
                const classesData = response.data.map((classItem: any) => ({
                    id: classItem.id,
                    class_code: classItem.class_code,
                    class_name: classItem.class_name
                }));
                
                setRawClasses(classesData);
                console.log('✅ [GRADES] Loaded', classesData.length, 'classes');
            } else {
                setRawClasses([]);
                console.warn('⚠️ [GRADES] No classes returned from API');
            }
        } catch (error) {
            console.error('❌ [GRADES] Failed to fetch classes:', error);
            setRawClasses([]);
        }
    };

    // Calculate classes with subjectCount when rawClasses or classSubjects change
    useEffect(() => {
        if (rawClasses.length > 0) {
            const classesWithCount = rawClasses.map((classItem) => {
                const subjectCount = classSubjects.filter(
                    (cs) => (cs.class?.id || cs.class_id) === classItem.id
                ).length;
                
                return {
                    ...classItem,
                    subjectCount: subjectCount
                };
            });
            
            setClasses(classesWithCount);
        } else {
            setClasses([]);
        }
    }, [rawClasses, classSubjects]);

    // Load students for selected class
    useEffect(() => {
        const loadClassStudents = async () => {
            if (!selectedClassId) {
                setClassStudents([]);
                return;
            }

            setLoadingClassStudents(true);
            try {
                const response = await adminGradeService.getStudentsMinimal(selectedClassId);
                if (response.success) {
                    setClassStudents(response.data || []);
                } else {
                    setClassStudents([]);
                }
            } catch (error) {
                console.error('Error loading class students:', error);
                setClassStudents([]);
            } finally {
                setLoadingClassStudents(false);
            }
        };

        if (selectedClassId) {
            loadClassStudents();
        }
    }, [selectedClassId]);

    // Load grades for selected class and subject with filters
    useEffect(() => {
        if (selectedClassId && selectedSubjectId) {
            const loadGradesForGrid = async () => {
                setLoading(true);
                try {
                    const response = await adminGradeService.getGrades({
                        class_subject_id: selectedSubjectId,
                        teacher_id: currentTeacherId,
                        academic_year_id: filters.academic_year_id ? parseInt(filters.academic_year_id) : undefined,
                        semester_id: filters.semester_id ? parseInt(filters.semester_id) : undefined,
                        remarks: filters.remarks as GradeRemarks || undefined,
                        per_page: 9999
                    });
                    
                    if (response.success && Array.isArray(response.data)) {
                        const gridDataMap: Record<string, any> = {};
                        response.data.forEach((grade: Grade) => {
                            const key = `${grade.student_id}_${grade.class_subject_id}`;
                            gridDataMap[key] = {
                                prelim_grade: grade.prelim_grade,
                                midterm_grade: grade.midterm_grade,
                                final_grade: grade.final_grade,
                                final_rating: grade.final_rating,
                                remarks: grade.remarks,
                                gradeId: grade.id,
                                academic_year_id: grade.academic_year_id,
                                semester_id: grade.semester_id
                            };
                        });
                        setGridData(gridDataMap);
                    }
                } catch (error) {
                    console.error('Error loading grades for grid:', error);
                } finally {
                    setLoading(false);
                }
            };
            
            loadGradesForGrid();
        } else {
            setGridData({});
        }
    }, [selectedClassId, selectedSubjectId, currentTeacherId, filters.academic_year_id, filters.semester_id, filters.remarks]);

    useEffect(() => {
        if (currentTeacherId) {
            fetchGrades();
            fetchStats();
            fetchDropdownLists();
            fetchClasses();
        }
    }, [filters, currentTeacherId]);

    // ========================================================================
    // 🎬 EVENT HANDLERS
    // ========================================================================

    const handleAdd = () => {
        setSelectedGrade(null);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleEdit = (grade: Grade) => {
        setSelectedGrade(grade);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleSave = async (data: GradeFormData) => {
        try {
            if (selectedGrade) {
                await adminGradeService.updateGrade(selectedGrade.id, data);
                setNotification({ type: 'success', message: 'Grade updated successfully!' });
            } else {
                await adminGradeService.createGrade(data);
                setNotification({ type: 'success', message: 'Grade added successfully!' });
            }
            setShowModal(false);
            setValidationErrors({});
            fetchGrades();
            fetchStats();
        } catch (error: any) {
            if (error.message && error.message.includes(':')) {
                const errorParts = error.message.split(';').reduce((acc, part) => {
                    const [field, msg] = part.split(':').map(s => s.trim());
                    if (field && msg) acc[field] = [msg];
                    return acc;
                }, {} as Record<string, string[]>);
                setValidationErrors(errorParts);
            } else {
                setNotification({ type: 'error', message: error.message || 'Failed to save grade.' });
            }
        }
    };

    // Grid editing handlers
    const handleGridCellChange = (studentId: number, field: 'prelim_grade' | 'midterm_grade' | 'final_grade' | 'remarks', value: any) => {
        if (!selectedSubjectId) return;
        
        const key = `${studentId}_${selectedSubjectId}`;
        const currentData = gridData[key] || {};
        
        let updatedData = { ...currentData, [field]: value };
        
        // Auto-calculate final_rating if all three grades are present
        if (field !== 'remarks' && (field === 'prelim_grade' || field === 'midterm_grade' || field === 'final_grade')) {
            const prelim = field === 'prelim_grade' 
                ? (value === '' ? undefined : parseFloat(value)) 
                : (updatedData.prelim_grade !== undefined && updatedData.prelim_grade !== '' ? parseFloat(String(updatedData.prelim_grade)) : undefined);
            const midterm = field === 'midterm_grade' 
                ? (value === '' ? undefined : parseFloat(value)) 
                : (updatedData.midterm_grade !== undefined && updatedData.midterm_grade !== '' ? parseFloat(String(updatedData.midterm_grade)) : undefined);
            const final = field === 'final_grade' 
                ? (value === '' ? undefined : parseFloat(value)) 
                : (updatedData.final_grade !== undefined && updatedData.final_grade !== '' ? parseFloat(String(updatedData.final_grade)) : undefined);
            
            if (prelim !== undefined && !isNaN(prelim) && midterm !== undefined && !isNaN(midterm) && final !== undefined && !isNaN(final)) {
                const average = (prelim + midterm + final) / 3;
                updatedData.final_rating = Math.round(average * 100) / 100;
            } else {
                updatedData.final_rating = undefined;
            }
        }
        
        setGridData(prev => ({
            ...prev,
            [key]: updatedData
        }));
        setHasUnsavedChanges(true);
    };

    const handleBulkSave = async () => {
        if (!selectedSubjectId || !selectedClassId) {
            setNotification({ type: 'error', message: 'Please select a class and subject first.' });
            return;
        }

        setSaving(true);
        try {
            const savePromises: Promise<any>[] = [];
            
            for (const [key, data] of Object.entries(gridData)) {
                const [studentIdStr] = key.split('_');
                const studentId = parseInt(studentIdStr);
                
                if (!data.prelim_grade && !data.midterm_grade && !data.final_grade) {
                    continue; // Skip empty rows
                }

                const gradeData: GradeFormData = {
                    class_subject_id: selectedSubjectId,
                    student_id: studentId,
                    academic_year_id: academicYears.length > 0 ? academicYears[0].id : 0,
                    semester_id: semesters.length > 0 ? semesters[0].id : 0,
                    prelim_grade: data.prelim_grade,
                    midterm_grade: data.midterm_grade,
                    final_grade: data.final_grade,
                    final_rating: data.final_rating,
                    remarks: data.remarks || 'Passed'
                };

                if (data.gradeId) {
                    // Update existing grade
                    savePromises.push(adminGradeService.updateGrade(data.gradeId, gradeData));
                } else {
                    // Create new grade
                    savePromises.push(adminGradeService.createGrade(gradeData));
                }
            }

            await Promise.all(savePromises);
            setNotification({ type: 'success', message: 'Grades saved successfully!' });
            setHasUnsavedChanges(false);
            
            // Reload data
            fetchGrades();
            fetchStats();
            
            // Reload grid data
            const response = await adminGradeService.getGrades({
                class_subject_id: selectedSubjectId,
                teacher_id: currentTeacherId,
                per_page: 9999
            });
            
            if (response.success && Array.isArray(response.data)) {
                const gridDataMap: Record<string, any> = {};
                response.data.forEach((grade: Grade) => {
                    const key = `${grade.student_id}_${grade.class_subject_id}`;
                    gridDataMap[key] = {
                        prelim_grade: grade.prelim_grade,
                        midterm_grade: grade.midterm_grade,
                        final_grade: grade.final_grade,
                        final_rating: grade.final_rating,
                        remarks: grade.remarks,
                        gradeId: grade.id
                    };
                });
                setGridData(gridDataMap);
            }
        } catch (error: any) {
            console.error('Error saving grades:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to save grades.' });
        } finally {
            setSaving(false);
        }
    };

    // ========================================================================
    // 🎨 RENDER PAGINATION
    // ========================================================================

    const renderPagination = () => {
        if (pagination.last_page <= 1) return null;

        return (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-white">
                    Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setFilters(prev => ({...prev, page: prev.page - 1}))}
                        disabled={pagination.current_page === 1}
                        className={`px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg ${TEXT_COLOR_CLASS} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setFilters(prev => ({...prev, page: prev.page + 1}))}
                        disabled={pagination.current_page === pagination.last_page}
                        className={`px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg ${TEXT_COLOR_CLASS} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    // ✅ GUARD: Show access denied if not a teacher
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

    // ========================================================================
    // 🎨 MAIN RENDER
    // ========================================================================

    return (
        <AppLayout>
            <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                            <Award className={`h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 mr-2 sm:mr-3 ${TEXT_COLOR_CLASS}`} />
                            <span className="break-words">Student Grades Management</span>
                        </h1>
                        <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-white">Manage grades for your students</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-3">
                        <button
                            onClick={() => { 
                                fetchGrades(); 
                                fetchStats(); 
                                fetchDropdownLists();
                                fetchClasses();
                            }}
                            className={`flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-white rounded-xl text-sm font-medium ${TEXT_COLOR_CLASS} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </button>
                        <button
                            onClick={handleAdd}
                            className={`flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-lg font-medium text-sm sm:text-base`}
                        >
                            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            <span className="hidden sm:inline">Add Grade</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
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
                            title="Passed Grades" 
                            value={stats.passed_grades || stats.total_grades - stats.failed_count} 
                            icon={ClipboardList} 
                            color="text-indigo-600" 
                        />
                        <StatCard 
                            title="Failed Grades" 
                            value={stats.failed_count} 
                            icon={TrendingDown} 
                            color="text-red-600" 
                        />
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-100 dark:border-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative sm:col-span-2 lg:col-span-2">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400 dark:text-white" />
                            </div>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                                className={`pl-12 w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                placeholder="Search student name..."
                            />
                        </div>
                        
                        <div className="flex items-center">
                            <select
                                value={filters.academic_year_id}
                                onChange={(e) => setFilters({...filters, academic_year_id: e.target.value, page: 1})}
                                className={`w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white dark:bg-gray-900`}
                            >
                                <option value="">Filter by Academic Year</option>
                                {academicYears.map(ay => (
                                    <option key={ay.id} value={ay.id}>{ay.year_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center">
                            <select
                                value={filters.remarks}
                                onChange={(e) => setFilters({...filters, remarks: e.target.value, page: 1})}
                                className={`w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white dark:bg-gray-900`}
                            >
                                <option value="">Filter by Remarks</option>
                                <option value="Passed">Passed</option>
                                <option value="Failed">Failed</option>
                                <option value="Incomplete">Incomplete</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Class Selection and Grades Grid */}
                <div className="bg-white dark:bg-gray-800 dark:border-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-white">
                    {!selectedClassId ? (
                        // Class Selection View
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Select a Class</h3>
                            {loadingLists ? (
                                <div className="text-center py-8">
                                    <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin mx-auto`} />
                                    <p className="mt-2 text-sm text-gray-600 dark:text-white">Loading classes...</p>
                                </div>
                            ) : classes.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-white">
                                    No classes found. Please ensure you are assigned to classes.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {classes.map((classItem) => (
                                        <button
                                            key={classItem.id}
                                            onClick={() => setSelectedClassId(classItem.id)}
                                            className="p-6 bg-white dark:bg-gray-800 dark:border-white border-2 border-gray-200 dark:border-white rounded-xl hover:border-[#003366] dark:hover:border-white hover:shadow-lg transition-all text-left cursor-pointer group"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#003366] dark:group-hover:text-white">
                                                    {classItem.class_code}
                                                </h4>
                                                <Award className="w-5 h-5 text-gray-400 group-hover:text-[#003366]" />
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-white mb-2">{classItem.class_name}</p>
                                            <p className="text-xs text-gray-500 dark:text-white">
                                                {classItem.subjectCount} {classItem.subjectCount === 1 ? 'subject' : 'subjects'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        // Grades Grid View
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <button
                                        onClick={() => {
                                            setSelectedClassId(null);
                                            setSelectedSubjectId(null);
                                            setGridData({});
                                            setHasUnsavedChanges(false);
                                        }}
                                        className="flex items-center text-[#003366] hover:text-[#002244] cursor-pointer text-sm sm:text-base"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        <span className="hidden sm:inline">Back to Classes</span>
                                        <span className="sm:hidden">Back</span>
                                    </button>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words">
                                            {classes.find(c => c.id === selectedClassId)?.class_code || 'Manage Grades'}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-white break-words">
                                            {classes.find(c => c.id === selectedClassId)?.class_name || ''}
                                        </p>
                                    </div>
                                </div>
                                {hasUnsavedChanges && (
                                    <button
                                        onClick={handleBulkSave}
                                        disabled={saving}
                                        className={`flex items-center justify-center px-4 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-lg font-medium disabled:opacity-50 text-sm sm:text-base`}
                                    >
                                        {saving ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                <span className="hidden sm:inline">Saving...</span>
                                                <span className="sm:hidden">Saving</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                <span className="hidden sm:inline">Save All Changes</span>
                                                <span className="sm:hidden">Save</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Subject Selection */}
                            <div className="mb-4">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-white mb-2">Select Subject</label>
                                <select
                                    value={selectedSubjectId || ''}
                                    onChange={(e) => {
                                        setSelectedSubjectId(e.target.value ? parseInt(e.target.value) : null);
                                        setGridData({});
                                        setHasUnsavedChanges(false);
                                    }}
                                    className={`w-full px-4 py-3 border border-gray-200 dark:border-white dark:bg-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white dark:bg-gray-900`}
                                >
                                    <option value="">Select a subject...</option>
                                    {classSubjects
                                        .filter(cs => (cs.class?.id || cs.class_id) === selectedClassId)
                                        .map(cs => (
                                            <option key={cs.id} value={cs.id}>
                                                {cs.subject?.subject_code} - {cs.subject?.subject_name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Grades Grid */}
                            {selectedSubjectId && (
                                <div className="mt-6">
                                    {loadingClassStudents ? (
                                        <div className="text-center py-8">
                                            <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin mx-auto`} />
                                            <p className="mt-2 text-sm text-gray-600 dark:text-white">Loading students...</p>
                                        </div>
                                    ) : (() => {
                                        // Apply filters to students
                                        const filteredStudents = classStudents.filter((student) => {
                                            // Apply search filter
                                            if (filters.search) {
                                                const searchLower = filters.search.toLowerCase();
                                                const matchesSearch = 
                                                    student.full_name?.toLowerCase().includes(searchLower) ||
                                                    student.student_id?.toLowerCase().includes(searchLower);
                                                if (!matchesSearch) return false;
                                            }
                                            
                                            // Apply remarks filter
                                            if (filters.remarks) {
                                                const key = `${student.id}_${selectedSubjectId}`;
                                                const gradeData = gridData[key];
                                                if (!gradeData || gradeData.remarks !== filters.remarks) {
                                                    return false;
                                                }
                                            }
                                            
                                            // Apply academic year filter
                                            if (filters.academic_year_id) {
                                                const key = `${student.id}_${selectedSubjectId}`;
                                                const gradeData = gridData[key];
                                                if (!gradeData || gradeData.academic_year_id !== parseInt(filters.academic_year_id)) {
                                                    return false;
                                                }
                                            }
                                            
                                            return true;
                                        });
                                        
                                        return filteredStudents.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 dark:text-white text-sm sm:text-base">
                                                No students found matching the current filters.
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                            <div className="bg-white dark:bg-gray-800 dark:border-white rounded-xl shadow-sm border border-gray-200 dark:border-white overflow-hidden min-w-full">
                                                <table className="min-w-full divide-y divide-gray-200 dark:divide-white">
                                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900 dark:border-white">
                                                        <tr>
                                                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-900 z-10 border-r border-gray-200 dark:border-white min-w-[120px]">
                                                                Student
                                                            </th>
                                                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider min-w-[80px] sm:min-w-[100px]">
                                                                Prelim
                                                            </th>
                                                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider min-w-[80px] sm:min-w-[100px]">
                                                                Midterm
                                                            </th>
                                                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider min-w-[80px] sm:min-w-[100px]">
                                                                Final
                                                            </th>
                                                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider min-w-[90px] sm:min-w-[100px] bg-gray-50 dark:bg-gray-900">
                                                                Final Rating
                                                            </th>
                                                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider min-w-[100px] sm:min-w-[120px]">
                                                                Remarks
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-white">
                                                        {filteredStudents.map((student) => {
                                                            const key = `${student.id}_${selectedSubjectId}`;
                                                            const gradeData = gridData[key] || {};
                                                            
                                                            return (
                                                                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                                    <td className="px-2 sm:px-4 py-2 sm:py-3 sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-200 dark:border-white min-w-[120px]">
                                                                        <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white break-words">{student.student_id}</div>
                                                                        <div className="text-[10px] sm:text-xs text-gray-600 dark:text-white break-words">{student.full_name}</div>
                                                                    </td>
                                                                    <td className="px-2 sm:px-4 py-2">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            step="0.01"
                                                                            value={gradeData.prelim_grade ?? ''}
                                                                            onChange={(e) => handleGridCellChange(student.id, 'prelim_grade', e.target.value)}
                                                                            className="w-full px-1 sm:px-2 py-1 text-xs sm:text-sm text-center border border-gray-300 dark:border-white dark:bg-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 sm:px-4 py-2">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            step="0.01"
                                                                            value={gradeData.midterm_grade ?? ''}
                                                                            onChange={(e) => handleGridCellChange(student.id, 'midterm_grade', e.target.value)}
                                                                            className="w-full px-1 sm:px-2 py-1 text-xs sm:text-sm text-center border border-gray-300 dark:border-white dark:bg-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 sm:px-4 py-2">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            step="0.01"
                                                                            value={gradeData.final_grade ?? ''}
                                                                            onChange={(e) => handleGridCellChange(student.id, 'final_grade', e.target.value)}
                                                                            className="w-full px-1 sm:px-2 py-1 text-xs sm:text-sm text-center border border-gray-300 dark:border-white dark:bg-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 sm:px-4 py-2 bg-gray-50 dark:bg-gray-900">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            step="0.01"
                                                                            value={gradeData.final_rating ?? ''}
                                                                            readOnly
                                                                            className="w-full px-1 sm:px-2 py-1 text-xs sm:text-sm text-center border border-gray-300 dark:border-white rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white cursor-not-allowed"
                                                                            placeholder="Auto"
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 sm:px-4 py-2">
                                                                        <select
                                                                            value={gradeData.remarks || 'Passed'}
                                                                            onChange={(e) => handleGridCellChange(student.id, 'remarks', e.target.value as GradeRemarks)}
                                                                            className="w-full px-1 sm:px-2 py-1 text-[10px] sm:text-xs text-center border border-gray-300 dark:border-white dark:bg-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                                                                        >
                                                                            <option value="Passed">Passed</option>
                                                                            <option value="Failed">Failed</option>
                                                                            <option value="Incomplete">Incomplete</option>
                                                                        </select>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modals */}
                {showModal && (
                    <GradeModal
                        grade={selectedGrade}
                        onClose={() => setShowModal(false)}
                        onSave={handleSave}
                        errors={validationErrors}
                        classSubjects={classSubjects}
                        students={students}
                        academicYears={academicYears}
                        semesters={semesters}
                        loadingLists={loadingLists}
                        allGrades={grades}
                    />
                )}

                {notification && (
                    <Notification
                        notification={notification}
                        onClose={() => setNotification(null)}
                    />
                )}
                
            </div>
        </AppLayout>
    );
};

export default Grades;