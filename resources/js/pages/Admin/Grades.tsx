import React, { useState, useEffect } from 'react';
import { Award, Plus, Search, Filter, Edit, Trash2, X, RefreshCw, BarChart, BookOpen, User, Zap, Hash, Eye } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
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
    AcademicYearOption,  // ← ADDED
    SemesterOption,      // ← ADDED
} from '../../../services/AdminGradeService'; 

// --- THEME COLORS ---
const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]';

// ========================================================================
// 📦 INTERFACES & UTILS
// ========================================================================

interface Notification {
    type: 'success' | 'error';
    message: string;
}

interface Filters {
    search: string;
    class_subject_id: string;
    student_id: string;
    remarks: string;
    page: number;
    per_page: number;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const REMARKS_OPTIONS: GradeRemarks[] = ['Passed', 'Failed', 'Incomplete'];

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
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 📝 GRADE MODAL (For Add/Edit)
// ========================================================================

const GradeModal: React.FC<{
    grade: Grade | null;
    onClose: () => void;
    onSave: (data: GradeFormData) => Promise<void>;
    errors: Record<string, string[]>;
    classSubjects: MinimalClassSubject[];
    students: MinimalStudent[];
    academicYears: AcademicYearOption[];    // ← ADDED
    semesters: SemesterOption[];            // ← ADDED
    loadingLists: boolean;
}> = ({ grade, onClose, onSave, errors, classSubjects, students, academicYears, semesters, loadingLists }) => {

    const [formData, setFormData] = useState<GradeFormData>({
        class_subject_id: grade?.class_subject_id || 0, // Don't auto-select first class - let user choose
        student_id: grade?.student_id || 0,
        academic_year_id: grade?.academic_year_id || 0,  // ← ADDED
        semester_id: grade?.semester_id || 0,            // ← ADDED
        prelim_grade: grade?.prelim_grade || null,
        midterm_grade: grade?.midterm_grade || null,
        final_grade: grade?.final_grade || null,
        final_rating: grade?.final_rating || null,
        remarks: grade?.remarks || 'Passed',
    });

    const [loading, setLoading] = useState(false);
    const [filteredStudents, setFilteredStudents] = useState<MinimalStudent[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Load students for the selected class when class_subject_id changes
    useEffect(() => {
        const loadStudentsForClass = async () => {
            console.log('🔄 loadStudentsForClass triggered:', {
                class_subject_id: formData.class_subject_id,
                loadingLists,
                classSubjectsLength: classSubjects.length
            });
            
            // Always clear students first
            setFilteredStudents([]);
            
            if (!formData.class_subject_id || formData.class_subject_id === 0) {
                console.log('⏭️ No class_subject_id selected, clearing students');
                return;
            }

            // Wait for classSubjects to be loaded
            if (loadingLists) {
                console.log('⏭️ Still loading lists, waiting...');
                return;
            }

            if (classSubjects.length === 0) {
                console.log('⏭️ No class subjects available yet');
                return;
            }

            const selectedClassSubject = classSubjects.find(cs => cs.id === formData.class_subject_id);
            console.log('🔍 Selected class subject:', selectedClassSubject);
            
            if (!selectedClassSubject) {
                console.warn('⚠️ No class_subject found for id:', formData.class_subject_id);
                setFilteredStudents([]);
                return;
            }

            // Get class_id - try class_id first, then fallback to class.id
            const classId = selectedClassSubject.class_id || selectedClassSubject.class?.id;
            
            if (!classId) {
                console.warn('⚠️ Selected class_subject missing class_id and class.id');
                setFilteredStudents([]);
                return;
            }

            console.log('📥 Loading students for class_id:', classId);
            setLoadingStudents(true);
            try {
                const response = await adminGradeService.getStudentsMinimal(classId);
                console.log('✅ Students loaded:', response);
                
                if (response.success) {
                    const studentsList = response.data || [];
                    console.log('📋 Setting filtered students:', studentsList.length, 'students');
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
                    console.warn('⚠️ Failed to load students:', response);
                    setFilteredStudents([]);
                }
            } catch (error) {
                console.error('❌ Error loading students for class:', error);
                setFilteredStudents([]);
            } finally {
                setLoadingStudents(false);
            }
        };

        loadStudentsForClass();
    }, [formData.class_subject_id, classSubjects, loadingLists, grade]);

    // Auto-load current academic year and semester for new grades
    useEffect(() => {
        const loadDefaults = async () => {
            if (!grade && academicYears.length > 0 && semesters.length > 0) {
                console.log('🔄 Loading default academic year and semester...');
                
                // Find current academic year and semester
                const currentAY = academicYears.find(ay => ay.is_current);
                const currentSem = semesters.find(sem => sem.is_current);
                if (currentAY && currentSem) {
                    setFormData(prev => ({
                        ...prev,
                        academic_year_id: currentAY.id,
                        semester_id: currentSem.id,
                    }));
                } else {
                    console.warn('⚠️ No current academic year or semester found!');
                    // Fallback to first available
                    setFormData(prev => ({
                        ...prev,
                        academic_year_id: academicYears[0]?.id || 0,
                        semester_id: semesters[0]?.id || 0,
                    }));
                }
            }
        };
        
        loadDefaults();
    }, [grade, academicYears, semesters, loadingLists]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        console.log('📝 FORM SUBMIT - Raw Form Data:', formData);
        
        try {
            const dataToSubmit: GradeFormData = {
                ...formData,
                class_subject_id: parseInt(formData.class_subject_id as unknown as string),
                student_id: parseInt(formData.student_id as unknown as string),
                academic_year_id: parseInt(formData.academic_year_id as unknown as string),  // ← ADDED
                semester_id: parseInt(formData.semester_id as unknown as string),            // ← ADDED
            };

            
            // Validate before sending
            if (!dataToSubmit.academic_year_id || dataToSubmit.academic_year_id === 0) {
                console.error('❌ ERROR: academic_year_id is missing or 0!');
                alert('Please select an academic year');
                return;
            }
            
            if (!dataToSubmit.semester_id || dataToSubmit.semester_id === 0) {
                console.error('❌ ERROR: semester_id is missing or 0!');
                alert('Please select a semester');
                return;
            }
            
            await onSave(dataToSubmit);
        } catch (error) {
            console.error('❌ FORM SUBMIT ERROR:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        // When class_subject_id changes, reset student_id and clear filtered students immediately
        if (name === 'class_subject_id') {
            const newClassSubjectId = parseInt(value) || 0;
            console.log('🔄 Class & Subject changed to:', newClassSubjectId);
            
            // Immediately clear filtered students
            setFilteredStudents([]);
            setFormData(prev => ({ 
                ...prev, 
                [name]: newClassSubjectId,
                student_id: 0 // Reset student selection when class changes
            } as GradeFormData));
            return;
        }
        
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' 
                ? parseFloat(value) || null
                : value 
        } as GradeFormData));
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {grade ? 'Edit Grade' : 'Record New Grade'}
                            </h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        
                        {/* Class & Subject */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Class & Subject</label>
                            <select
                                name="class_subject_id"
                                value={formData.class_subject_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                required
                                disabled={loadingLists}
                            >
                                <option value={0} disabled>
                                    {loadingLists ? 'Loading subjects...' : 'Select Class Subject'}
                                </option>
                                {classSubjects.map(cs => (
                                    <option key={cs.id} value={cs.id}>
                                        {cs.class?.class_code || cs.class?.class_name || 'Unknown'} - {cs.subject?.subject_name || cs.subject?.subject_code || 'Unknown'}
                                    </option>
                                ))}
                            </select>
                            {errors.class_subject_id && (<p className="text-red-500 text-xs mt-1">{errors.class_subject_id[0]}</p>)}
                        </div>
                        
                        {/* Student */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Student <span className="text-red-500">*</span>
                            </label>
                            <select
                                key={`student-select-${formData.class_subject_id}-${filteredStudents.length}`}
                                name="student_id"
                                value={formData.student_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                required
                                disabled={loadingLists || loadingStudents || !formData.class_subject_id || formData.class_subject_id === 0}
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
                                {/* CRITICAL: Only show filteredStudents - NEVER use the students prop */}
                                {filteredStudents.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.full_name} ({student.student_id})
                                    </option>
                                ))}
                            </select>
                            {errors.student_id && (<p className="text-red-500 text-xs mt-1">{errors.student_id[0]}</p>)}
                            {formData.class_subject_id && formData.class_subject_id !== 0 && filteredStudents.length === 0 && !loadingStudents && (
                                <p className="text-yellow-600 text-xs mt-1">No students enrolled in this class</p>
                            )}
                            {/* Debug info - remove in production */}
                            {process.env.NODE_ENV === 'development' && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Debug: {filteredStudents.length} filtered students | Class Subject ID: {formData.class_subject_id}
                                </p>
                            )}
                        </div>

                        {/* Academic Year & Semester - NEW SECTION */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Academic Year Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Academic Year <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="academic_year_id"
                                    value={formData.academic_year_id}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                    required
                                    disabled={loadingLists}
                                >
                                    <option value={0} disabled>
                                        {loadingLists ? 'Loading...' : 'Select academic year'}
                                    </option>
                                    {academicYears.map(ay => (
                                        <option key={ay.id} value={ay.id}>
                                            {ay.year_name} {ay.is_current && '(Current)'}
                                        </option>
                                    ))}
                                </select>
                                {errors.academic_year_id && (
                                    <p className="text-red-500 text-xs mt-1">{errors.academic_year_id[0]}</p>
                                )}
                            </div>

                            {/* Semester Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Semester <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="semester_id"
                                    value={formData.semester_id}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                    required
                                    disabled={loadingLists}
                                >
                                    <option value={0} disabled>
                                        {loadingLists ? 'Loading...' : 'Select semester'}
                                    </option>
                                    {semesters.map(semester => (
                                        <option key={semester.id} value={semester.id}>
                                            {semester.semester_name} {semester.is_current && '(Current)'}
                                        </option>
                                    ))}
                                </select>
                                {errors.semester_id && (
                                    <p className="text-red-500 text-xs mt-1">{errors.semester_id[0]}</p>
                                )}
                            </div>
                        </div>

                        {/* Grade Inputs */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Prelim Grade</label>
                                <input
                                    type="number"
                                    name="prelim_grade"
                                    value={formData.prelim_grade || ''}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="0-100"
                                />
                                {errors.prelim_grade && (<p className="text-red-500 text-xs mt-1">{errors.prelim_grade[0]}</p>)}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Midterm Grade</label>
                                <input
                                    type="number"
                                    name="midterm_grade"
                                    value={formData.midterm_grade || ''}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="0-100"
                                />
                                {errors.midterm_grade && (<p className="text-red-500 text-xs mt-1">{errors.midterm_grade[0]}</p>)}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Final Grade</label>
                                <input
                                    type="number"
                                    name="final_grade"
                                    value={formData.final_grade || ''}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    placeholder="0-100"
                                />
                                {errors.final_grade && (<p className="text-red-500 text-xs mt-1">{errors.final_grade[0]}</p>)}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Final Rating (0-100)</label>
                                <input
                                    type="number"
                                    name="final_rating"
                                    value={formData.final_rating || ''}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                />
                                {errors.final_rating && (<p className="text-red-500 text-xs mt-1">{errors.final_rating[0]}</p>)}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
                                <select
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white`}
                                    required
                                >
                                    {REMARKS_OPTIONS.map(remark => (
                                        <option key={remark} value={remark}>{remark}</option>
                                    ))}
                                </select>
                                {errors.remarks && (<p className="text-red-500 text-xs mt-1">{errors.remarks[0]}</p>)}
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium" disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg disabled:opacity-50`} disabled={loading}>
                                {loading ? 'Saving...' : grade ? 'Update Grade' : 'Record Grade'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 👁️ VIEW GRADE MODAL
// ========================================================================

const ViewGradeModal: React.FC<{
    grade: Grade;
    onClose: () => void;
    renderRemarksTag: (remarks: GradeRemarks) => JSX.Element;
}> = ({ grade, onClose, renderRemarksTag }) => {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Grade Details</h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        {/* Header */}
                        <div className="mb-6 pb-6 border-b">
                            <h3 className="text-2xl font-bold text-gray-900">{grade.student?.full_name || 'N/A'}</h3>
                            <p className="text-gray-500">{grade.student?.student_id || 'N/A'}</p>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</label>
                                <p className="text-gray-900 font-medium mt-1">{grade.student?.full_name || 'N/A'}</p>
                                <p className="text-sm text-gray-500">{grade.student?.student_id || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Class / Subject</label>
                                <p className="text-gray-900 font-medium mt-1">{grade.class_subject?.subject?.subject_name || 'N/A'}</p>
                                <p className="text-sm text-gray-500">{grade.class_subject?.class?.class_code || 'N/A'} ({grade.class_subject?.subject?.subject_code || 'N/A'})</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prelim Grade</label>
                                <p className="text-gray-900 font-medium mt-1">{grade.prelim_grade != null ? Number(grade.prelim_grade).toFixed(2) : 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Midterm Grade</label>
                                <p className="text-gray-900 font-medium mt-1">{grade.midterm_grade != null ? Number(grade.midterm_grade).toFixed(2) : 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Final Grade</label>
                                <p className="text-gray-900 font-medium mt-1">{grade.final_grade != null ? Number(grade.final_grade).toFixed(2) : 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Final Rating</label>
                                <p className="text-gray-900 font-medium mt-1">{grade.final_rating != null ? Number(grade.final_rating).toFixed(2) + '%' : 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</label>
                                <div className="mt-1">{renderRemarksTag(grade.remarks)}</div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end mt-6 pt-6 border-t">
                            <button
                                onClick={onClose}
                                className={`px-6 py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium`}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// ❌ DELETE CONFIRMATION MODAL
// ========================================================================

const DeleteGradeModal: React.FC<{
    grade: Grade;
    onClose: () => void;
    onConfirm: (id: number) => Promise<void>;
}> = ({ grade, onClose, onConfirm }) => {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await onConfirm(grade.id);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className="bg-red-600 px-6 py-4">
                        <h2 className="text-xl font-bold text-white">Confirm Grade Deletion</h2>
                    </div>
                    
                    <div className="p-6">
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete the grade record for: 
                            <strong className="text-red-700 block mt-1">
                                {grade.student?.full_name || 'Unknown Student'} ({grade.class_subject?.subject?.subject_name || 'Unknown Subject'}) - {grade.final_rating != null ? Number(grade.final_rating).toFixed(2) : '0.00'}%
                            </strong>? 
                            This action cannot be undone.
                        </p>
                        
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium shadow-lg disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Deleting...' : 'Delete Record'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// ========================================================================
// 🏠 MAIN GRADES PAGE
// ========================================================================

const Grades: React.FC = () => {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [classSubjects, setClassSubjects] = useState<MinimalClassSubject[]>([]);
    const [students, setStudents] = useState<MinimalStudent[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);   // ← ADDED
    const [semesters, setSemesters] = useState<SemesterOption[]>([]);               // ← ADDED
    const [loading, setLoading] = useState(true);
    const [loadingLists, setLoadingLists] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    
    const [filters, setFilters] = useState<Filters>({
        search: '',
        class_subject_id: '',
        student_id: '',
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

    const [stats, setStats] = useState<GradeStats>({
        total_grades: 0,
        average_final_rating: 0,
        passing_rate: 0,
        failed_count: 0,
        by_class_subject: [],
    });

    // --- Data List Loaders ---
    const loadLists = async () => {
        setLoadingLists(true);
        
        try {
            const options = await adminGradeService.getAllDropdownOptions();
            
     
            
            setClassSubjects(options.classSubjects);
            setStudents(options.students);
            setAcademicYears(options.academicYears);      // ← ADDED
            setSemesters(options.semesters);              // ← ADDED
            
        } catch (error) {
            console.error('❌ Error loading dropdown lists:', error);
            setNotification({ type: 'error', message: 'Failed to load dropdown lists.' });
        } finally {
            setLoadingLists(false);
        }
    }

    useEffect(() => {
        loadLists();
        loadGrades();
        loadStats();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadGrades();
            loadStats(); 
        }, 500);
        
        return () => clearTimeout(delayDebounceFn);
    }, [filters.search, filters.class_subject_id, filters.student_id, filters.remarks, filters.page, filters.per_page]);

    const loadGrades = async () => {
        setLoading(true);
        try {
            const apiFilters = {
                ...filters,
                class_subject_id: filters.class_subject_id ? parseInt(filters.class_subject_id) : undefined,
                student_id: filters.student_id ? parseInt(filters.student_id) : undefined,
            };
            const response: GradesResponse = await adminGradeService.getGrades(apiFilters);
            if (response.success && Array.isArray(response.data)) {
                setGrades(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Error loading grades:', error);
            setNotification({ type: 'error', message: 'Failed to load grades' });
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await adminGradeService.getGradeStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error loading grade stats:', error);
        }
    };

    const handleCreate = () => {
        if (loadingLists || classSubjects.length === 0 || students.length === 0) {
            setNotification({ type: 'error', message: 'Cannot create grade: Required lists are empty or still loading.' });
            return;
        }
        setSelectedGrade(null);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleEdit = (grade: Grade) => {
        setSelectedGrade(grade);
        setValidationErrors({});
        setShowModal(true);
    };

    const handleView = (grade: Grade) => {
        setSelectedGrade(grade);
        setShowViewModal(true);
    };

    const handleSave = async (data: GradeFormData) => {
        setValidationErrors({});
        
        
        try {
            let response: ApiResponse<Grade>;
            
            const dataToSend: GradeFormData = {
                ...data,
                class_subject_id: parseInt(data.class_subject_id as unknown as string),
                student_id: parseInt(data.student_id as unknown as string),
                academic_year_id: parseInt(data.academic_year_id as unknown as string),  // ← ADDED
                semester_id: parseInt(data.semester_id as unknown as string),            // ← ADDED
            };
            
      
            
            if (selectedGrade) {
                response = await adminGradeService.updateGrade(selectedGrade.id, dataToSend);
                setNotification({ type: 'success', message: 'Grade updated successfully!' });
            } else {
                response = await adminGradeService.createGrade(dataToSend);
                setNotification({ type: 'success', message: 'Grade recorded successfully!' });
            }
            
            if (response.success) {
                setShowModal(false);
                loadGrades();
                loadStats();
                setValidationErrors({});
            }
        } catch (error: any) {
            console.error('❌ ERROR SAVING GRADE:', error);
            if (error.message && error.message.includes(':')) {
                const errorsObj: Record<string, string[]> = {};
                error.message.split(';').forEach((err: string) => {
                    const [field, msg] = err.split(':').map((s: string) => s.trim());
                    if (field && msg) {
                        errorsObj[field] = [msg];
                    }
                });
                setValidationErrors(errorsObj);
            }
            setNotification({ type: 'error', message: error.message || 'Failed to save grade' });
        }
    };
    
    const handleDelete = (grade: Grade) => {
        setSelectedGrade(grade);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async (id: number) => {
        try {
            await adminGradeService.deleteGrade(id);
            setNotification({ type: 'success', message: 'Grade record deleted successfully!' });
            setShowDeleteModal(false);
            loadGrades();
            loadStats();
        } catch (error: any) {
            console.error('Error deleting grade:', error);
            setNotification({ type: 'error', message: error.message || 'Failed to delete grade record.' });
        }
    };

    const renderRemarksTag = (remarks: GradeRemarks) => {
        const colors = {
            'Passed': 'bg-green-100 text-green-800 border-green-200',
            'Failed': 'bg-red-100 text-red-800 border-red-200',
            'Incomplete': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        };
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${colors[remarks]}`}>
                {remarks}
            </span>
        );
    };

    const renderPagination = () => {
        if (pagination.last_page <= 1) return null;
        
        const pages = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, pagination.current_page - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(pagination.last_page, startPage + maxPagesToShow - 1);
        
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return (
            <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-gray-700">
                    Showing <span className="font-semibold">{((pagination.current_page - 1) * pagination.per_page) + 1}</span> to{' '}
                    <span className="font-semibold">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> of{' '}
                    <span className="font-semibold">{pagination.total}</span> results
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.current_page === 1}
                        className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        Previous
                    </button>
                    {pages.map(page => (
                        <button
                            key={page}
                            onClick={() => setFilters(prev => ({ ...prev, page }))}
                            className={`px-3 py-1 border rounded-lg transition-colors ${
                                page === pagination.current_page
                                    ? `${PRIMARY_COLOR_CLASS} text-white border-transparent`
                                    : 'hover:bg-gray-50'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.current_page === pagination.last_page}
                        className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
                    {/* Header */}
                    <div className="mb-4 sm:mb-6 md:mb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="mb-4 sm:mb-6 md:mb-0">
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Grade Management</h1>
                                <p className="text-xs sm:text-sm text-gray-600">Manage and track student academic performance</p>
                            </div>
                            <button
                                onClick={handleCreate}
                                className={`flex items-center px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 ${PRIMARY_COLOR_CLASS} text-white rounded-lg sm:rounded-xl ${HOVER_COLOR_CLASS} transition-all font-medium shadow-lg text-xs sm:text-sm md:text-base`}
                            >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Record New Grade</span>
                                <span className="sm:hidden">New Grade</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats - Mobile: Centered with icon below, Desktop: Icon on right */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100">
                            {/* Mobile: Centered layout */}
                            <div className="flex flex-col items-center text-center md:hidden">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Total Grades</p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">{stats.total_grades || 0}</p>
                                <div className={`p-2 sm:p-3 rounded-full ${LIGHT_BG_CLASS}`}>
                                    <Hash className={`w-5 h-5 sm:w-6 sm:h-6 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                            {/* Desktop: Original layout with icon on right */}
                            <div className="hidden md:flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Grades</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.total_grades || 0}</p>
                                </div>
                                <div className={`p-3 ${LIGHT_BG_CLASS} rounded-xl`}>
                                    <Hash className={`w-6 h-6 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100">
                            {/* Mobile: Centered layout */}
                            <div className="flex flex-col items-center text-center md:hidden">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Average Rating</p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">{Number(stats.average_final_rating ?? 0).toFixed(1)}%</p>
                                <div className={`p-2 sm:p-3 rounded-full ${LIGHT_BG_CLASS}`}>
                                    <BarChart className={`w-5 h-5 sm:w-6 sm:h-6 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                            {/* Desktop: Original layout with icon on right */}
                            <div className="hidden md:flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Average Rating</p>
                                    <p className="text-3xl font-bold text-gray-900">{Number(stats.average_final_rating ?? 0).toFixed(1)}%</p>
                                </div>
                                <div className={`p-3 ${LIGHT_BG_CLASS} rounded-xl`}>
                                    <BarChart className={`w-6 h-6 ${TEXT_COLOR_CLASS}`} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100">
                            {/* Mobile: Centered layout */}
                            <div className="flex flex-col items-center text-center md:hidden">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Passing Rate</p>
                                <p className="text-2xl sm:text-3xl font-bold text-green-600 mb-2 sm:mb-3">{Number(stats.passing_rate ?? 0).toFixed(1)}%</p>
                                <div className="p-2 sm:p-3 bg-green-50 rounded-full">
                                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                                </div>
                            </div>
                            {/* Desktop: Original layout with icon on right */}
                            <div className="hidden md:flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Passing Rate</p>
                                    <p className="text-3xl font-bold text-green-600">{Number(stats.passing_rate ?? 0).toFixed(1)}%</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-xl">
                                    <Award className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-100">
                            {/* Mobile: Centered layout */}
                            <div className="flex flex-col items-center text-center md:hidden">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Failed</p>
                                <p className="text-2xl sm:text-3xl font-bold text-red-600 mb-2 sm:mb-3">{stats.failed_count || 0}</p>
                                <div className="p-2 sm:p-3 bg-red-50 rounded-full">
                                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                                </div>
                            </div>
                            {/* Desktop: Original layout with icon on right */}
                            <div className="hidden md:flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Failed</p>
                                    <p className="text-3xl font-bold text-red-600">{stats.failed_count || 0}</p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-xl">
                                    <Zap className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters - Compact on Mobile */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                                    className={`pl-10 sm:pl-12 w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all text-sm sm:text-base`}
                                    placeholder="Search student or subject..."
                                />
                            </div>
                            <div className="flex items-center">
                                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3" />
                                <select
                                    value={filters.class_subject_id}
                                    onChange={(e) => setFilters({...filters, class_subject_id: e.target.value, page: 1})}
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white text-sm sm:text-base`}
                                >
                                    <option value="">Filter by Subject</option>
                                    {classSubjects.map(cs => (
                                        <option key={cs.id} value={cs.id}>
                                            {cs.subject?.subject_code} - {cs.class?.class_code}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center">
                                <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3" />
                                <select
                                    value={filters.student_id}
                                    onChange={(e) => setFilters({...filters, student_id: e.target.value, page: 1})}
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white text-sm sm:text-base`}
                                >
                                    <option value="">Filter by Student</option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.student_id} - {student.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center">
                                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3" />
                                <select
                                    value={filters.remarks}
                                    onChange={(e) => setFilters({...filters, remarks: e.target.value, page: 1})}
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all appearance-none bg-white text-sm sm:text-base`}
                                >
                                    <option value="">Filter by Remarks</option>
                                    {REMARKS_OPTIONS.map(remark => (
                                        <option key={remark} value={remark}>{remark}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table - Responsive: Mobile shows Student + Actions, Desktop shows all columns */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Student</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Class / Subject</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Rating</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Remarks</th> 
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                                <div className="flex justify-center">
                                                    <RefreshCw className={`h-6 w-6 sm:h-8 sm:w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : grades.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <Award className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-3 sm:mb-4" />
                                                    <p className="text-base sm:text-lg font-medium">No grade records found</p>
                                                    <p className="text-xs sm:text-sm">Record a new grade or adjust filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        grades.map((grade) => (
                                            <tr key={grade.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                    <div className="text-xs sm:text-sm font-semibold text-gray-900">{grade.student?.full_name || 'N/A'}</div>
                                                    <div className="text-xs text-gray-500">{grade.student?.student_id || 'N/A'}</div>
                                                    {/* Show additional info on mobile */}
                                                    <div className="md:hidden mt-1 space-y-1">
                                                        <div className="text-xs text-gray-600">{grade.class_subject?.subject?.subject_name || 'N/A'}</div>
                                                        <div className="text-xs text-gray-500">{grade.class_subject?.class?.class_code || 'N/A'} ({grade.class_subject?.subject?.subject_code || 'N/A'})</div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-gray-900">
                                                                {grade.final_rating != null ? Number(grade.final_rating).toFixed(2) : '0.00'}%
                                                            </span>
                                                            {renderRemarksTag(grade.remarks)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm font-semibold text-gray-900">{grade.class_subject?.subject?.subject_name || 'N/A'}</div>
                                                    <div className="text-xs text-gray-500">{grade.class_subject?.class?.class_code || 'N/A'} ({grade.class_subject?.subject?.subject_code || 'N/A'})</div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-900">
                                                    {grade.final_rating != null ? Number(grade.final_rating).toFixed(2) : '0.00'}%
                                                </td>
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    {renderRemarksTag(grade.remarks)}
                                                </td>
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end space-x-1 sm:space-x-2">
                                                        <button
                                                            onClick={() => handleView(grade)}
                                                            className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(grade)}
                                                            className={`p-1.5 sm:p-2 ${TEXT_COLOR_CLASS} ${LIGHT_HOVER_CLASS} rounded-lg transition-colors`}
                                                            title="Edit Grade"
                                                        >
                                                            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(grade)}
                                                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Grade"
                                                        >
                                                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
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
                            onClose={() => {
                                console.log('🚪 Closing grade modal');
                                setShowModal(false);
                                setValidationErrors({});
                            }}
                            onSave={handleSave}
                            errors={validationErrors}
                            classSubjects={classSubjects}
                            students={students}
                            academicYears={academicYears}      // ← ADDED
                            semesters={semesters}              // ← ADDED
                            loadingLists={loadingLists}
                        />
                    )}

                    {showViewModal && selectedGrade && (
                        <ViewGradeModal
                            grade={selectedGrade}
                            onClose={() => setShowViewModal(false)}
                            renderRemarksTag={renderRemarksTag}
                        />
                    )}

                    {showDeleteModal && selectedGrade && (
                        <DeleteGradeModal
                            grade={selectedGrade}
                            onClose={() => setShowDeleteModal(false)}
                            onConfirm={handleConfirmDelete}
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

export default Grades;