import React, { useState, useEffect } from 'react';
import { Link, Plus, Search, Edit, Trash2, X, RefreshCw, Layers, UserCheck, BookOpen, Eye } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { 
    adminClassSubjectService, 
    ClassSubject, 
    ClassSubjectFormData, 
    ClassSubjectsResponse, 
    ApiResponse,
    ClassOption,
    SubjectOption,
    TeacherOption,
    AcademicYearOption,
    SemesterOption
} from '../../../services/AdminClassSubjectService'; 

// ========================================================================
// 🎨 THEME COLORS - Centralized color scheme for consistent branding
// ========================================================================
const PRIMARY_COLOR_CLASS = 'bg-[#003366]';
const HOVER_COLOR_CLASS = 'hover:bg-[#002244]';
const TEXT_COLOR_CLASS = 'text-[#003366]';
const RING_COLOR_CLASS = 'focus:ring-[#003366]';
const LIGHT_BG_CLASS = 'bg-[#003366]/10';
const LIGHT_HOVER_CLASS = 'hover:bg-[#e6f2ff]';

// ========================================================================
// 📦 INTERFACES & UTILITIES
// ========================================================================

// Format year level for display (13 -> "1st Year", 14 -> "2nd Year", etc.)
const formatYearLevel = (yearLevel: number): string => {
    if (yearLevel >= 13) {
        const collegeYear = yearLevel - 12;
        const suffixes = ['st', 'nd', 'rd', 'th'];
        const suffix = collegeYear <= 3 ? suffixes[collegeYear - 1] : suffixes[3];
        return `${collegeYear}${suffix} Year`;
    }
    return `Grade ${yearLevel}`;
};

interface Notification {
    type: 'success' | 'error';
    message: string;
}

interface Filters {
    class_id: string;
    teacher_id: string;
    search: string;
    page: number;
    per_page: number;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

// ========================================================================
// 🔔 NOTIFICATION COMPONENT - Auto-dismissing toast notifications
// ========================================================================

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
// 📝 LINK CLASS & SUBJECT MODAL - For linking subjects to classes
// ========================================================================

const ClassSubjectModal: React.FC<{
    classSubject: ClassSubject | null;
    onClose: () => void;
    onSave: (data: ClassSubjectFormData) => Promise<void>;
    errors: Record<string, string[]>;
}> = ({ classSubject, onClose, onSave, errors }) => {

    const [formData, setFormData] = useState<ClassSubjectFormData>({
        class_id: classSubject?.class_id || 0,
        subject_id: classSubject?.subject_id || 0,
        teacher_id: classSubject?.teacher_id || null, 
        academic_year_id: classSubject?.academic_year_id || 0,
        semester_id: classSubject?.semester_id || 0,
    });
    
    const [loading, setLoading] = useState(false);
    
    // Dropdown options state
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
    const [semesters, setSemesters] = useState<SemesterOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);

    // Fetch dropdown options on mount using the service
    useEffect(() => {
        const fetchOptions = async () => {
            setLoadingOptions(true);
            try {
                // Use the service method to fetch all dropdown options in parallel
                const options = await adminClassSubjectService.getAllDropdownOptions();
                
                setClasses(options.classes);
                setSubjects(options.subjects);
                setTeachers(options.teachers);
                setAcademicYears(options.academicYears);
                setSemesters(options.semesters);

                // Set default values to current academic year and semester if creating new
                if (!classSubject) {
                    const defaultValues = await adminClassSubjectService.getDefaultFormValues();
                    setFormData(prev => ({
                        ...prev,
                        academic_year_id: defaultValues.academic_year_id,
                        semester_id: defaultValues.semester_id
                    }));
                }
            } catch (error) {
                console.error('Error fetching dropdown options:', error);
            } finally {
                setLoadingOptions(false);
            }
        };

        fetchOptions();
    }, [classSubject]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onSave(formData);
        } finally {
            setLoading(false);
        }
    };

    // Get the assigned teachers for the selected subject (many-to-many)
    const selectedSubject = subjects.find(s => s.id === formData.subject_id);
    
    // Filter teachers: only show teachers assigned to the selected subject
    const filteredTeachers = React.useMemo(() => {
        if (!formData.subject_id) {
            return []; // No subject selected
        }
        
        // Use assigned_teachers if available (many-to-many)
        if (selectedSubject?.assigned_teachers && selectedSubject.assigned_teachers.length > 0) {
            const assignedIds = selectedSubject.assigned_teachers.map(t => t.id);
            return teachers.filter(t => assignedIds.includes(t.id));
        }
        
        // Fallback to legacy teacher_id
        if (selectedSubject?.teacher_id) {
            return teachers.filter(t => t.id === selectedSubject.teacher_id);
        }
        
        return []; // No teachers assigned to this subject
    }, [formData.subject_id, selectedSubject, teachers]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // When subject changes, auto-select the first assigned teacher
        if (name === 'subject_id') {
            const subjectId = value === '' ? 0 : parseInt(value);
            const subject = subjects.find(s => s.id === subjectId);
            
            // Get first assigned teacher (if any)
            let autoTeacherId: number | null = null;
            if (subject?.assigned_teachers && subject.assigned_teachers.length > 0) {
                autoTeacherId = subject.assigned_teachers[0].id;
            } else if (subject?.teacher_id) {
                autoTeacherId = subject.teacher_id;
            }
            
            setFormData(prev => ({ 
                ...prev, 
                subject_id: subjectId,
                teacher_id: autoTeacherId
            }));
            return;
        }
        
        setFormData(prev => ({ 
            ...prev, 
            [name]: value === '' ? null : parseInt(value)
        } as ClassSubjectFormData));
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                {/* Backdrop */}
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                {/* Modal content */}
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    {/* Modal header */}
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {classSubject ? 'Edit Class-Subject Link' : 'Link Class & Subject'}
                            </h2>
                            <button 
                                onClick={onClose} 
                                className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Modal body */}
                    <div className="p-6 space-y-6">
                        {loadingOptions ? (
                            <div className="flex justify-center py-8">
                                <RefreshCw className={`h-8 w-8 ${TEXT_COLOR_CLASS} animate-spin`} />
                            </div>
                        ) : (
                            <>
                                {/* Class Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Class <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="class_id"
                                        value={formData.class_id}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                        required
                                    >
                                        <option value="">Select a class...</option>
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.class_code} - {cls.class_name} ({formatYearLevel(cls.year_level)}, Section {cls.section})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.class_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.class_id[0]}</p>
                                    )}
                                </div>

                                {/* Subject Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Subject <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="subject_id"
                                        value={formData.subject_id}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                        required
                                    >
                                        <option value="">Select a subject...</option>
                                        {subjects.map(subject => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.subject_code} - {subject.subject_name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.subject_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.subject_id[0]}</p>
                                    )}
                                </div>

                                {/* Teacher Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Teacher
                                    </label>
                                    <select
                                        name="teacher_id"
                                        value={formData.teacher_id || ''}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                    >
                                        <option value="">No teacher assigned</option>
                                        {teachers.map(teacher => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.full_name} ({teacher.teacher_id}){teacher.department && ` - ${teacher.department}`}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.teacher_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.teacher_id[0]}</p>
                                    )}
                                </div>

                                {/* Academic Year Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Academic Year <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="academic_year_id"
                                        value={formData.academic_year_id}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                        required
                                    >
                                        <option value="">Select academic year...</option>
                                        {academicYears.map(ay => (
                                            <option key={ay.id} value={ay.id}>
                                                {ay.year_name} {ay.is_current && '(Current)'}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.academic_year_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.academic_year_id[0]}</p>
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
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all`}
                                        required
                                    >
                                        <option value="">Select semester...</option>
                                        {semesters.map(semester => (
                                            <option key={semester.id} value={semester.id}>
                                                {semester.semester_name} {semester.is_current && '(Current)'}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.semester_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.semester_id[0]}</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Modal footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || loadingOptions}
                            className={`${PRIMARY_COLOR_CLASS} ${HOVER_COLOR_CLASS} text-white px-6 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center space-x-2`}
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>{classSubject ? 'Update' : 'Create'} Link</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================================================
// 👁️ VIEW CLASS SUBJECT MODAL
// ========================================================================

const ViewClassSubjectModal: React.FC<{
    classSubject: ClassSubject;
    onClose: () => void;
}> = ({ classSubject, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className={`${PRIMARY_COLOR_CLASS} px-6 py-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Class-Subject Link Details</h2>
                            <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        {/* Header with Icon */}
                        <div className="flex items-center mb-6 pb-6 border-b">
                            <div className={`${LIGHT_BG_CLASS} p-4 rounded-full mr-4`}>
                                <Link className={`h-12 w-12 ${TEXT_COLOR_CLASS}`} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{classSubject.class_name} - {classSubject.subject_name}</h3>
                                <p className="text-gray-500">{classSubject.subject_code}</p>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</label>
                                <p className="text-gray-900 font-medium mt-1">{classSubject.class_name || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</label>
                                <p className="text-gray-900 font-medium mt-1">{classSubject.subject_name || 'N/A'}</p>
                                <p className="text-sm text-gray-500">{classSubject.subject_code}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Teacher</label>
                                <p className="text-gray-900 font-medium mt-1">{classSubject.teacher_name || 'Unassigned'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Academic Year</label>
                                <p className="text-gray-900 font-medium mt-1">{classSubject.academic_year_name || `AY ID: ${classSubject.academic_year_id}`}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Semester</label>
                                <p className="text-gray-900 font-medium mt-1">{classSubject.semester_name || `Semester ID: ${classSubject.semester_id}`}</p>
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
// 📊 CLASS SUBJECTS MAIN COMPONENT
// ========================================================================

const ClassSubjects: React.FC = () => {
    const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedClassSubject, setSelectedClassSubject] = useState<ClassSubject | null>(null);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0
    });
    const [filters, setFilters] = useState<Filters>({
        class_id: '',
        teacher_id: '',
        search: '',
        page: 1,
        per_page: 10
    });

    // Fetch class subjects on mount and filter change
    useEffect(() => {
        fetchClassSubjects();
    }, [filters.page, filters.class_id, filters.teacher_id, filters.search]);

    const fetchClassSubjects = async () => {
        setLoading(true);
        try {
            // Build filter object - send as-is (backend will handle both numeric IDs and text searches)
            const filterParams: any = {
                search: filters.search || undefined,
                page: filters.page,
                per_page: filters.per_page
            };
            
            // Add class_id filter if provided (can be numeric ID or text for searching)
            if (filters.class_id && filters.class_id.trim() !== '') {
                filterParams.class_id = filters.class_id.trim();
            }
            
            // Add teacher_id filter if provided (can be numeric ID or text for searching)
            if (filters.teacher_id && filters.teacher_id.trim() !== '') {
                filterParams.teacher_id = filters.teacher_id.trim();
            }
            
            const response: ClassSubjectsResponse = await adminClassSubjectService.getClassSubjects(filterParams);

            if (response.success && response.data) {
                setClassSubjects(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (error) {
            console.error('Error fetching class subjects:', error);
            setNotification({ type: 'error', message: 'Failed to load class subjects' });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (classSubject: ClassSubject) => {
        setSelectedClassSubject(classSubject);
        setShowModal(true);
        setValidationErrors({});
    };

    const handleView = (classSubject: ClassSubject) => {
        setSelectedClassSubject(classSubject);
        setShowViewModal(true);
    };

    const handleDelete = async (classSubject: ClassSubject) => {
        if (!confirm(`Are you sure you want to unlink ${classSubject.subject_name} from ${classSubject.class_name}?`)) {
            return;
        }

        try {
            await adminClassSubjectService.deleteClassSubject(classSubject.id);
            setNotification({ type: 'success', message: 'Class-Subject link removed successfully' });
            fetchClassSubjects();
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Failed to remove link' });
        }
    };

    const handleSave = async (data: ClassSubjectFormData) => {
        setValidationErrors({});
        try {
            if (selectedClassSubject) {
                await adminClassSubjectService.updateClassSubject(selectedClassSubject.id, data);
                setNotification({ type: 'success', message: 'Class-Subject link updated successfully' });
            } else {
                await adminClassSubjectService.linkSubjectToClass(data);
                setNotification({ type: 'success', message: 'Class-Subject linked successfully' });
            }
            setShowModal(false);
            setSelectedClassSubject(null);
            fetchClassSubjects();
        } catch (error: any) {
            if (error.message.includes(':')) {
                const errorParts = error.message.split('; ');
                const errors: Record<string, string[]> = {};
                errorParts.forEach(part => {
                    const [field, ...messageParts] = part.split(': ');
                    errors[field] = [messageParts.join(': ')];
                });
                setValidationErrors(errors);
            } else {
                setNotification({ type: 'error', message: error.message || 'Failed to save link' });
            }
        }
    };

    const renderPagination = () => {
        if (pagination.last_page <= 1) return null;

        return (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                    Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setFilters({...filters, page: filters.page - 1})}
                        disabled={pagination.current_page === 1}
                        className={`px-4 py-2 border border-gray-300 rounded-lg ${TEXT_COLOR_CLASS} hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setFilters({...filters, page: filters.page + 1})}
                        disabled={pagination.current_page === pagination.last_page}
                        className={`px-4 py-2 border border-gray-300 rounded-lg ${TEXT_COLOR_CLASS} hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-[#f3f4f6] dark:bg-gray-900">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
                {/* Header */}
                    <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="mb-4 sm:mb-6 md:mb-0">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Class-Subject Links</h1>
                            <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 md:mt-2">Manage class-subject assignments and schedules</p>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedClassSubject(null);
                            setShowModal(true);
                            setValidationErrors({});
                        }}
                            className={`${PRIMARY_COLOR_CLASS} ${HOVER_COLOR_CLASS} text-white px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl text-xs sm:text-sm md:text-base`}
                    >
                            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="hidden sm:inline">Link Class & Subject</span>
                            <span className="sm:hidden">Link</span>
                    </button>
                </div>

                    {/* Filters - Compact on Mobile */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                        {/* Class filter */}
                        <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                    <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={filters.class_id}
                                onChange={(e) => setFilters({...filters, class_id: e.target.value, page: 1})}
                                    className={`pl-10 sm:pl-12 w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all text-sm sm:text-base`}
                                placeholder="Filter by Class Code or Name..."
                            />
                        </div>
                        {/* Teacher filter */}
                        <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                    <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={filters.teacher_id}
                                onChange={(e) => setFilters({...filters, teacher_id: e.target.value, page: 1})}
                                    className={`pl-10 sm:pl-12 w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all text-sm sm:text-base`}
                                placeholder="Filter by Teacher Name or ID..."
                            />
                        </div>
                        {/* Subject search */}
                        <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                                    className={`pl-10 sm:pl-12 w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 ${RING_COLOR_CLASS} focus:border-transparent transition-all text-sm sm:text-base`}
                                placeholder="Search Subject..."
                            />
                        </div>
                    </div>
                </div>

                    {/* Class Subjects table - Responsive: Mobile shows Class & Subject + Actions, Desktop shows all columns */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Class</th>
                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Subject</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Teacher</th>
                                        <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Academic Period</th>
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
                                ) : classSubjects.length === 0 ? (
                                    <tr>
                                            <td colSpan={5} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <Link className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-3 sm:mb-4" />
                                                    <p className="text-base sm:text-lg font-medium">No class-subject links found</p>
                                                    <p className="text-xs sm:text-sm">Create a new link or adjust filters</p>
                                                </div>
                                        </td>
                                    </tr>
                                ) : (
                                    classSubjects.map((cs) => (
                                        <tr key={cs.id} className="hover:bg-gray-50 transition-colors">
                                            {/* Class info */}
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                <div className="flex items-center">
                                                        <div className={`p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 ${LIGHT_BG_CLASS}`}>
                                                            <Layers className={`h-4 w-4 sm:h-5 sm:w-5 ${TEXT_COLOR_CLASS}`} />
                                                    </div>
                                                    <div>
                                                            <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{cs.class_name || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Subject info */}
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                <div className="flex items-center">
                                                        <div className={`p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 ${LIGHT_BG_CLASS}`}>
                                                            <BookOpen className={`h-4 w-4 sm:h-5 sm:w-5 ${TEXT_COLOR_CLASS}`} />
                                                    </div>
                                                    <div>
                                                            <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{cs.subject_name || 'N/A'}</div>
                                                            <div className="text-xs text-gray-500 truncate">{cs.subject_code}</div>
                                                            {/* Show additional info on mobile */}
                                                            <div className="md:hidden mt-1 space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <UserCheck className={`h-3 w-3 ${TEXT_COLOR_CLASS}`} />
                                                                    <span className="text-xs text-gray-600">{cs.teacher_name || 'Unassigned'}</span>
                                                                </div>
                                                                <div className="text-xs text-gray-600">
                                                                    {cs.academic_year_name || `AY ID: ${cs.academic_year_id}`} - {cs.semester_name || `Semester ID: ${cs.semester_id}`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                </div>
                                            </td>
                                            {/* Teacher */}
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                        <div className={`p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 ${LIGHT_BG_CLASS}`}>
                                                            <UserCheck className={`h-3 w-3 sm:h-4 sm:w-4 ${TEXT_COLOR_CLASS}`} />
                                                    </div>
                                                        <div className="text-xs sm:text-sm text-gray-900">{cs.teacher_name || 'Unassigned'}</div>
                                                </div>
                                            </td>
                                            {/* Academic Period */}
                                                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    <div className="text-xs sm:text-sm text-gray-700">
                                                    <div className="font-medium">{cs.academic_year_name || `AY ID: ${cs.academic_year_id}`}</div>
                                                    <div className="text-xs text-gray-500">{cs.semester_name || `Semester ID: ${cs.semester_id}`}</div>
                                                </div>
                                            </td>
                                            {/* Action buttons */}
                                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end space-x-1 sm:space-x-2">
                                                        <button
                                                            onClick={() => handleView(cs)}
                                                            className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </button>
                                                    <button
                                                        onClick={() => handleEdit(cs)}
                                                            className={`p-1.5 sm:p-2 ${TEXT_COLOR_CLASS} ${LIGHT_HOVER_CLASS} rounded-lg transition-colors`}
                                                        title="Edit Link"
                                                    >
                                                            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(cs)}
                                                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Unlink Subject"
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
                    
                    {/* Pagination */}
                    {renderPagination()}
                </div>

                    {/* Modals */}
                {showModal && (
                    <ClassSubjectModal
                        classSubject={selectedClassSubject}
                        onClose={() => setShowModal(false)}
                        onSave={handleSave}
                        errors={validationErrors}
                    />
                )}

                    {showViewModal && selectedClassSubject && (
                        <ViewClassSubjectModal
                            classSubject={selectedClassSubject}
                            onClose={() => setShowViewModal(false)}
                        />
                    )}

                {/* Toast notification */}
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

export default ClassSubjects;