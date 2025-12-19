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
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
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
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600`}>
                N/A
            </span>
        );
    }

    let color = 'bg-gray-100 text-gray-600';
    if (remarks === 'Passed') color = 'bg-green-100 text-green-800';
    else if (remarks === 'Failed') color = 'bg-red-100 text-red-800';
    else if (remarks === 'Incomplete') color = 'bg-yellow-100 text-yellow-800';

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
                
                <div className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Student *
                                    </label>
                                    <select
                                        key={`student-select-${formData.class_subject_id}-${filteredStudents.length}`}
                                        name="student_id"
                                        value={formData.student_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Class & Subject *
                                    </label>
                                    <select
                                        name="class_subject_id"
                                        value={formData.class_subject_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Academic Year *
                                    </label>
                                    <select
                                        name="academic_year_id"
                                        value={formData.academic_year_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Semester *
                                    </label>
                                    <select
                                        name="semester_id"
                                        value={formData.semester_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                                    />
                                    {errors.prelim_grade && <p className="mt-1 text-sm text-red-600">{errors.prelim_grade[0]}</p>}
                                </div>

                                {/* Midterm Grade */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                                    />
                                    {errors.midterm_grade && <p className="mt-1 text-sm text-red-600">{errors.midterm_grade[0]}</p>}
                                </div>

                                {/* Final Grade */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
                                    />
                                    {errors.final_grade && <p className="mt-1 text-sm text-red-600">{errors.final_grade[0]}</p>}
                                </div>

                                {/* Final Rating - Auto-calculated */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed transition-all"
                                        title="Final Rating is automatically calculated as the average of Prelim, Midterm, and Final grades"
                                    />
                                    {errors.final_rating && <p className="mt-1 text-sm text-red-600">{errors.final_rating[0]}</p>}
                                    {formData.prelim_grade !== undefined && formData.midterm_grade !== undefined && formData.final_grade !== undefined && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            ({formData.prelim_grade} + {formData.midterm_grade} + {formData.final_grade}) ÷ 3 = {formData.final_rating?.toFixed(2) || 'N/A'}
                                        </p>
                                    )}
                                </div>

                                {/* Remarks */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Remarks *
                                    </label>
                                    <select
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
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
                                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
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
    useEffect(() => {
        if (currentTeacherId) {
            fetchGrades();
            fetchStats();
            fetchDropdownLists();
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

    // ========================================================================
    // 🎨 RENDER PAGINATION
    // ========================================================================

    const renderPagination = () => {
        if (pagination.last_page <= 1) return null;

        return (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                    Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setFilters(prev => ({...prev, page: prev.page - 1}))}
                        disabled={pagination.current_page === 1}
                        className={`px-4 py-2 border border-gray-300 rounded-lg ${TEXT_COLOR_CLASS} hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setFilters(prev => ({...prev, page: prev.page + 1}))}
                        disabled={pagination.current_page === pagination.last_page}
                        className={`px-4 py-2 border border-gray-300 rounded-lg ${TEXT_COLOR_CLASS} hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
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
            <div className="p-8 space-y-6 min-h-screen bg-[#f3f4f6]">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <Award className={`h-8 w-8 mr-3 ${TEXT_COLOR_CLASS}`} />
                            Student Grades Management
                          
                        </h1>
                        <p className="mt-2 text-gray-600">Manage grades for your students</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => { fetchGrades(); fetchStats(); }}
                            className={`flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium ${TEXT_COLOR_CLASS} hover:bg-gray-50 transition-colors`}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </button>
                        <button
                            onClick={handleAdd}
                            className={`flex items-center px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all shadow-lg font-medium`}
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Add Grade
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <StatCard 
                            title="Total Grades" 
                            value={stats.total_grades} 
                            icon={Hash} 
                            color={TEXT_COLOR_CLASS} 
                        />
                        <StatCard 
                            title="Average Rating" 
                            value={`${stats.average_final_rating?.toFixed(2) || 0}%`} 
                            icon={BarChart} 
                            color="text-blue-600" 
                        />
                        <StatCard 
                            title="Passing Rate" 
                            value={`${stats.passing_rate?.toFixed(1) || 0}%`} 
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
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="relative col-span-2">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                                className={`pl-12 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                placeholder="Search student name..."
                            />
                        </div>
                        
                        <div className="flex items-center">
                            <select
                                value={filters.class_subject_id}
                                onChange={(e) => setFilters({...filters, class_subject_id: e.target.value, page: 1})}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                            >
                                <option value="">Filter by My Subject</option>
                                {classSubjects.map(cs => (
                                    <option key={cs.id} value={cs.id}>
                                        {cs.class?.class_code} - {cs.subject?.subject_code}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-center">
                            <select
                                value={filters.academic_year_id}
                                onChange={(e) => setFilters({...filters, academic_year_id: e.target.value, page: 1})}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
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
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                            >
                                <option value="">Filter by Remarks</option>
                                <option value="Passed">Passed</option>
                                <option value="Failed">Failed</option>
                                <option value="Incomplete">Incomplete</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Grades Table */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Student & Class</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Prelim/Midterm/Final</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Final Rating & Remarks</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center"><RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin mx-auto`} /></td></tr>
                                ) : grades.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No grade records found for your assigned classes.</td></tr>
                                ) : (
                                     grades.map((grade) => (
                                        <tr key={grade.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">{grade.student?.full_name || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">{grade.class_subject?.class?.class_name || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">{grade.class_subject?.subject?.subject_name || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">{grade.class_subject?.subject?.subject_code || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                <p>P: {grade.prelim_grade ?? 'N/A'}</p>
                                                <p>M: {grade.midterm_grade ?? 'N/A'}</p>
                                                <p>F: {grade.final_grade ?? 'N/A'}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">{grade.final_rating ?? 'N/A'}</div>
                                                <div className="mt-1">{renderRemarksTag(grade.remarks)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(grade)}
                                                        className={`p-2 ${TEXT_COLOR_CLASS} ${LIGHT_HOVER_CLASS} rounded-lg transition-colors`}
                                                        title="Edit Grade"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {renderPagination()}
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